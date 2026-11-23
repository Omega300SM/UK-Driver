import { describe, it, expect } from 'vitest';
import { RulesEngine } from '../../src/rules/RulesEngine';
import { townChecks, TOWN_TUNING } from '../../src/rules/checks/town';
import type { DriveEvent } from '../../src/rules/types';
import { TOWN, STARTS } from '../../src/world/scenes/townLayout';
import { inRect, wrongSideBy, speedLimitAt } from '../../src/world/layout';
import { getLesson, CURRICULUM } from '../../src/content/curriculum';
import { RULES } from '../../src/content/ruleRefs';
import { FAULTS } from '../../src/rules/faults';
import { Car } from '../../src/sim/car';
import { Traffic } from '../../src/sim/traffic';

const tick = (t: number, o: Partial<Extract<DriveEvent, { type: 'tick' }>> = {}): DriveEvent => ({
  type: 'tick',
  t,
  dt: 0.1,
  speed: 5,
  accel: 0,
  limitMph: 30,
  heading: 0,
  dist: 0.5,
  wrongSideBy: null,
  handbrake: false,
  throttle: 0.3,
  ...o
});
const eng = () => new RulesEngine(townChecks(), 'test');
const codes = (e: RulesEngine) => e.faults.map((f) => f.code);

describe('turns', () => {
  it('a signalled, mirrored turn is clean', () => {
    const e = eng();
    e.emit({ type: 'mirror', t: 1, which: 'interior' });
    e.emit({ type: 'signal', t: 2, state: 'left' });
    e.emit({ type: 'turn', t: 8, dir: 'left', startT: 5, signalAtStart: 'left' });
    expect(e.faults).toEqual([]);
  });
  it('no signal, wrong signal, no mirror', () => {
    const a = eng();
    a.emit({ type: 'mirror', t: 1, which: 'interior' });
    a.emit({ type: 'turn', t: 8, dir: 'left', startT: 5, signalAtStart: 'off' });
    expect(codes(a)).toEqual(['turn-no-signal']);
    const b = eng();
    b.emit({ type: 'mirror', t: 1, which: 'interior' });
    b.emit({ type: 'turn', t: 8, dir: 'left', startT: 5, signalAtStart: 'right' });
    expect(codes(b)).toEqual(['turn-wrong-signal']);
    const c = eng();
    c.emit({ type: 'turn', t: 30, dir: 'right', startT: 28, signalAtStart: 'off' });
    expect(codes(c)).toEqual(['turn-no-signal', 'turn-no-mirror']);
  });
  it('a long wait at a junction after MSM on the approach is fine', () => {
    const e = eng();
    e.emit({ type: 'mirror', t: 1, which: 'interior' });
    e.emit({ type: 'signal', t: 2, state: 'left' });
    e.emit({ type: 'turn', t: 40, dir: 'left', startT: 36, signalAtStart: 'left' });
    expect(e.faults).toEqual([]);
  });
});

describe('junctions', () => {
  it('rolling over a STOP line is serious (rule 171)', () => {
    const e = eng();
    e.emit({ type: 'shoulder', t: 1, side: 'right' });
    e.emit({ type: 'shoulder', t: 1.5, side: 'left' });
    e.emit({ type: 'emerge', t: 2, junction: 'church', kind: 'stop', minSpeed: 1.2 });
    const f = e.faults.find((x) => x.code === 'stop-not-stopped');
    expect(f?.severity).toBe('serious');
    expect(f?.rules).toContain(171);
  });
  it('a full stop and looks both ways is clean', () => {
    const e = eng();
    e.emit({ type: 'shoulder', t: 1, side: 'right' });
    e.emit({ type: 'shoulder', t: 1.5, side: 'left' });
    e.emit({ type: 'emerge', t: 4, junction: 'church', kind: 'stop', minSpeed: 0 });
    expect(e.faults).toEqual([]);
  });
  it('emerging without looking both ways is a minor (rule 170)', () => {
    const e = eng();
    e.emit({ type: 'shoulder', t: 1, side: 'right' });
    e.emit({ type: 'emerge', t: 4, junction: 'mill', kind: 'giveway', minSpeed: 2 });
    expect(codes(e)).toEqual(['junction-observation']);
  });
  it('pulling out into traffic: serious under ~2 s, dangerous under 1 s, once per junction', () => {
    const e = eng();
    e.emit({ type: 'conflict', t: 1, ttc: 3, junction: 'mill' });
    expect(e.faults).toEqual([]);
    e.emit({ type: 'conflict', t: 2, ttc: 1.8, junction: 'mill' });
    e.emit({ type: 'conflict', t: 2.1, ttc: 1.6, junction: 'mill' });
    expect(codes(e)).toEqual(['junction-pulled-out']);
    const d = eng();
    d.emit({ type: 'conflict', t: 2, ttc: 0.6, junction: 'mill' });
    expect(d.dangerous).toBe(true);
  });
});

describe('parked cars, lines and signs', () => {
  it('meeting: give way to oncoming when the obstruction is on your side (rule 163)', () => {
    const e = eng();
    e.emit(tick(1, { passingObstruction: true, oncomingM: 28 }));
    expect(codes(e)).toEqual(['meeting']);
    e.emit(tick(1.5, { passingObstruction: true, oncomingM: 10 }));
    expect(codes(e)).toEqual(['meeting', 'meeting-serious']);
  });
  it('passing too close to a parked car (rule 152)', () => {
    const e = eng();
    e.emit(tick(1, { passingObstruction: true, clearance: 0.3 }));
    e.emit(tick(1.1, { passingObstruction: true, clearance: 0.2 }));
    expect(codes(e)).toEqual(['clearance']);
  });
  it('crossing a solid double white line is serious (rule 129)', () => {
    const e = eng();
    e.emit(tick(1, { inDoubleWhite: true, wrongSideBy: -1.5 }));
    expect(e.faults).toEqual([]);
    e.emit(tick(2, { inDoubleWhite: true, wrongSideBy: 0.4 }));
    expect(codes(e)).toEqual(['double-white']);
    expect(e.faults[0].rules).toEqual([129]);
  });
  it('no entry (rule 109)', () => {
    const e = eng();
    e.emit(tick(1, { inNoEntry: true }));
    e.emit(tick(2, { inNoEntry: true }));
    expect(codes(e)).toEqual(['no-entry']);
  });
  it('dawdling on a clear road is a progress fault after a while', () => {
    const e = eng();
    for (let i = 0; i < (TOWN_TUNING.slowSustainS + 1) * 10; i++) e.emit(tick(i * 0.1, { undulySlow: true }));
    expect(codes(e)).toEqual(['progress']);
  });
});

describe('pulling up', () => {
  const fin = (p: { onYellow: 'double' | 'single' | null; nearJunctionM: number | null; onDoubleWhite: boolean; kerbGap: number }): DriveEvent => ({
    type: 'finish',
    t: 99,
    handbrake: true,
    gear: 'P',
    pullUp: p
  });
  it('a legal stop is clean', () => {
    const e = eng();
    e.emit(fin({ onYellow: null, nearJunctionM: 30, onDoubleWhite: false, kerbGap: 0.3 }));
    expect(e.faults).toEqual([]);
  });
  it('double yellow, near a junction, on double white, far from the kerb', () => {
    const e = eng();
    e.emit(fin({ onYellow: 'double', nearJunctionM: 4, onDoubleWhite: true, kerbGap: 2 }));
    expect(codes(e).sort()).toEqual(['park-double-white', 'park-double-yellow', 'park-junction', 'park-kerb-far'].sort());
    expect(e.faults.find((f) => f.code === 'park-junction')?.rules).toEqual([243]);
    expect(e.faults.find((f) => f.code === 'park-double-white')?.rules).toEqual([240]);
  });
});

describe('town layout', () => {
  const onRoad = (x: number, z: number) => TOWN.drivable.some((r) => inRect(r, x, z));
  it('all lesson start positions are on the road and clear of parked cars', () => {
    for (const d of CURRICULUM.filter((c) => c.available && getLesson(c.day)!.sceneId === 'town')) {
      const l = getLesson(d.day)!;
      for (const stage of [l.guided, l.free, l.test]) {
        if (!stage?.start) continue;
        const car = new Car();
        car.reset(stage.start.x, stage.start.z, stage.start.heading);
        for (const [x, z] of car.corners()) {
          expect(onRoad(x, z), `day ${d.day} start corner ${x},${z}`).toBe(true);
          expect(TOWN.obstacles.some((o) => inRect(o, x, z)), `day ${d.day} start overlaps obstacle`).toBe(false);
        }
      }
    }
  });
  it('limits: NSL out of town, 30 under the street lights, 20 in the zone', () => {
    expect(speedLimitAt(TOWN, -300, -1.9)).toBe(60);
    expect(speedLimitAt(TOWN, -120, -1.9)).toBe(30);
    expect(speedLimitAt(TOWN, 50, 1.9)).toBe(20);
    expect(speedLimitAt(TOWN, 40, -150)).toBe(30);
  });
  it('keep-left geometry: the left lane is correct in every direction', () => {
    const s = STARTS.millSouth(-100);
    expect(wrongSideBy(TOWN, s.x, s.z, s.heading)!).toBeLessThan(0);
    const n = STARTS.millNorth(-100);
    expect(wrongSideBy(TOWN, n.x, n.z, n.heading)!).toBeLessThan(0);
    const e = STARTS.mainEast(-300);
    expect(wrongSideBy(TOWN, e.x, e.z, e.heading)!).toBeLessThan(0);
    const w = STARTS.mainWest(200);
    expect(wrongSideBy(TOWN, w.x, w.z, w.heading)!).toBeLessThan(0);
    // Driving east in the westbound lane is the wrong side.
    expect(wrongSideBy(TOWN, -300, 1.9, Math.PI / 2)!).toBeGreaterThan(0);
  });
  it('markers referenced by lessons exist', () => {
    const ids = new Set(TOWN.markers.map((m) => m.id));
    for (const d of CURRICULUM.filter((c) => c.available)) {
      const l = getLesson(d.day)!;
      if (l.sceneId !== 'town') continue;
      expect(ids.has(l.test.finishMarker), `day ${d.day} finish`).toBe(true);
      for (const dir of l.test.directions) if (dir.marker) expect(ids.has(dir.marker)).toBe(true);
      for (const st of l.guided?.steps ?? []) {
        const m = /^(?:marker|stoppedAt|zone)\.(.+)$/.exec(st.await);
        if (m) expect(ids.has(m[1]), `day ${d.day} ${st.await}`).toBe(true);
      }
    }
  });
});

describe('AI traffic', () => {
  it('reports the time for an approaching car to reach a point', () => {
    const tr = new Traffic(TOWN, 'none', [{ when: { x0: -1e3, x1: 1e3, z0: -1e3, z1: 1e3 }, from: { x: -60, z: -1.9, heading: Math.PI / 2 }, speed: 8 }]);
    tr.update(0.01, { x: 0, z: 50, heading: 0, speed: 0, corners: [] });
    const ttr = tr.timeToReach(0, -1.9);
    expect(ttr).toBeGreaterThan(3);
    expect(ttr).toBeLessThan(12);
    expect(tr.timeToReach(0, 1.9)).toBe(Infinity);
  });
  it('waits behind parked cars on its side while you come the other way (rule 163)', () => {
    // Southbound on Mill Lane towards the parked cars at z −168…−186; player coming north.
    const tr = new Traffic(TOWN, 'none', [{ when: { x0: -1e3, x1: 1e3, z0: -1e3, z1: 1e3 }, from: { x: 38.1, z: -130, heading: Math.PI }, speed: 7 }]);
    for (let i = 0; i < 300; i++) tr.update(1 / 30, { x: 41.9, z: -215, heading: 0, speed: 5, corners: [[41, -213], [42.8, -213], [41, -217], [42.8, -217]] });
    const c = tr.cars[0];
    expect(c.waiting).toBe(true);
    expect(c.z).toBeGreaterThan(-168);
  });
});

describe('Week 1 content integrity', () => {
  it('every cited rule exists, quizzes have 3–5 questions, briefings run 60–90 s', () => {
    for (const d of CURRICULUM.filter((c) => c.available)) {
      const l = getLesson(d.day)!;
      for (const n of l.rules) expect(RULES[n], `day ${d.day} rule ${n}`).toBeDefined();
      for (const q of l.quiz) {
        for (const n of q.rules) expect(RULES[n], `day ${d.day} ${q.id} rule ${n}`).toBeDefined();
        expect(q.answer).toBeLessThan(q.options.length);
      }
      expect(l.quiz.length).toBeGreaterThanOrEqual(3);
      expect(l.quiz.length).toBeLessThanOrEqual(5);
      const words = l.briefing.reduce((n, s) => n + s.say.split(/\s+/).length, 0);
      const secs = words / 2.6;
      expect(secs, `day ${d.day} briefing ${Math.round(secs)}s`).toBeGreaterThan(l.boss ? 30 : 55);
      expect(secs, `day ${d.day} briefing ${Math.round(secs)}s`).toBeLessThan(100);
    }
  });
  it('every fault cites only verified rules', () => {
    for (const [code, def] of Object.entries(FAULTS)) for (const r of def.rules) expect(RULES[r], `${code} → ${r}`).toBeDefined();
  });
  it('Week 1 is complete: days 1–7 available, the boss has no guided drive', () => {
    for (let d = 1; d <= 7; d++) expect(getLesson(d), `day ${d}`).toBeDefined();
    expect(getLesson(7)!.guided).toBeUndefined();
    expect(getLesson(7)!.boss).toBe(true);
  });
});
