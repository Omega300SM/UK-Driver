import { describe, it, expect } from 'vitest';
import { StreetControl, SIGNAL_TIMING, type Aspect } from '../../src/sim/street';
import { MILL_TOWN } from '../../src/world/scenes/millTownLayout';
import { RulesEngine } from '../../src/rules/RulesEngine';
import { streetChecks } from '../../src/rules/checks/street';
import type { DriveEvent } from '../../src/rules/types';
import { RULES } from '../../src/content/ruleRefs';
import { FAULTS } from '../../src/rules/faults';

const far = { x: -1000, z: -1000, heading: 0, speed: 0 };
const line = (id: string) => MILL_TOWN.stopLines!.find((l) => l.id === id)!;

function run(st: StreetControl, secs: number, movers = [] as Array<typeof far>) {
  for (let i = 0; i < secs * 20; i++) st.update(0.05, movers, far);
}

describe('traffic signals', () => {
  it('a junction runs red → red+amber → green → amber → red, and never shows green both ways', () => {
    const st = new StreetControl(MILL_TOWN, 'none');
    const seen: Aspect[] = [];
    for (let i = 0; i < 80 * 20; i++) {
      st.update(0.05, [], far);
      const ew = st.aspect('J1', 'ew');
      const ns = st.aspect('J1', 'ns');
      expect(ew === 'green' && ns === 'green').toBe(false);
      if (seen[seen.length - 1] !== ew) seen.push(ew);
    }
    const s = seen.join(',');
    expect(s).toContain('red,redAmber,green,amber,red');
  });

  it('a pelican stays green until someone presses the button, then gives them a red and a flashing amber', () => {
    const st = new StreetControl({ ...MILL_TOWN, crossings: [] }, 'none');
    run(st, 30);
    expect(st.aspect('P1', 'road')).toBe('green');
    st.controller('P1')!.request = true;
    const seq: Aspect[] = [];
    for (let i = 0; i < 30 * 20; i++) {
      st.update(0.05, [], far);
      const a = st.aspect('P1', 'road');
      if (seq[seq.length - 1] !== a) seq.push(a);
    }
    expect(seq.join(',')).toContain('amber,red,flashAmber,green');
  });

  it('a puffin has no flashing amber: red, red+amber, green', () => {
    const st = new StreetControl({ ...MILL_TOWN, crossings: [] }, 'none');
    run(st, SIGNAL_TIMING.crossingMinGreen + 1);
    st.controller('U1')!.request = true;
    const seq: Aspect[] = [];
    for (let i = 0; i < 30 * 20; i++) {
      st.update(0.05, [], far);
      const a = st.aspect('U1', 'road');
      if (seq[seq.length - 1] !== a) seq.push(a);
    }
    expect(seq).not.toContain('flashAmber');
    expect(seq.join(',')).toContain('amber,red,redAmber,green');
  });
});

describe('stop or go', () => {
  it('stops on red; on amber stops only with room to stop', () => {
    const st = new StreetControl(MILL_TOWN, 'none');
    const l = line('J1-e');
    // Find a red and an amber for east-west.
    let guard = 0;
    while (st.aspect('J1', 'ew') !== 'red' && guard++ < 4000) st.update(0.05, [], far);
    expect(st.mustStop(l, 30, 13)).toBe(true);
    while (st.aspect('J1', 'ew') !== 'amber' && guard++ < 8000) st.update(0.05, [], far);
    expect(st.mustStop(l, 40, 13)).toBe(true); // 24 m needed to stop at 13 m/s
    expect(st.mustStop(l, 8, 13)).toBe(false); // too close to stop safely
  });

  it('a zebra: people waiting are let across, and people on it must be given way to', () => {
    const st = new StreetControl({ ...MILL_TOWN, crossings: MILL_TOWN.crossings!.filter((c) => c.id === 'Z1') }, 'busy', 5);
    st.peds = [];
    const l = line('Z1-e');
    expect(st.mustStop(l, 30, 10)).toBe(false);
    // Spawn someone and let them walk to the kerb.
    (st as any).spawn(MILL_TOWN.crossings!.find((c) => c.id === 'Z1'), 0.95);
    // A car still well away: they step out once it is far enough or stopped.
    const stopped = { x: 38, z: -131.9, heading: Math.PI / 2, speed: 0 };
    let crossed = false;
    for (let i = 0; i < 400; i++) {
      st.update(0.05, [stopped], far);
      if (st.pedsOn('Z1').length) crossed = true;
      if (st.pedWaiting('Z1')) expect(st.mustStop(l, 20, 8)).toBe(true);
    }
    expect(crossed).toBe(true);
  });
});

describe('street rules', () => {
  const ev = (o: Partial<Extract<DriveEvent, { type: 'stopLine' }>>): DriveEvent => ({
    type: 'stopLine',
    t: 1,
    line: 'J1-e',
    kind: 'signals',
    aspect: 'green',
    amberAt: null,
    pedsOn: 0,
    pedInPath: false,
    pedWaiting: false,
    ...o
  });
  const faults = (e: DriveEvent) => {
    const r = new RulesEngine(streetChecks(), 'test');
    r.emit(e);
    return r.faults.map((f) => f.code);
  };

  it('red and red+amber are red-light faults; green is fine', () => {
    expect(faults(ev({ aspect: 'red' }))).toEqual(['red-light']);
    expect(faults(ev({ aspect: 'redAmber' }))).toEqual(['red-light']);
    expect(faults(ev({ aspect: 'green' }))).toEqual([]);
  });

  it('amber: a fault only if there was plenty of room to stop', () => {
    expect(faults(ev({ aspect: 'amber', amberAt: { dist: 60, speed: 13 } }))).toEqual(['amber-light']);
    expect(faults(ev({ aspect: 'amber', amberAt: { dist: 15, speed: 13 } }))).toEqual([]);
  });

  it('crossings: people on it, in our path, or waiting at a zebra', () => {
    expect(faults(ev({ kind: 'zebra', aspect: null, pedsOn: 1 }))).toEqual(['zebra-give-way']);
    expect(faults(ev({ kind: 'zebra', aspect: null, pedsOn: 1, pedInPath: true }))).toEqual(['crossing-ped-dangerous']);
    expect(faults(ev({ kind: 'zebra', aspect: null, pedWaiting: true }))).toEqual(['zebra-waiting']);
    expect(faults(ev({ kind: 'pelican', aspect: 'flashAmber', pedsOn: 1 }))).toEqual(['crossing-ped']);
    expect(faults(ev({ kind: 'pelican', aspect: 'flashAmber' }))).toEqual([]);
  });

  it('box junctions: stopping in the box is only allowed when turning right', () => {
    expect(faults({ type: 'boxStop', t: 1, box: 'J1', signal: 'off' })).toEqual(['box-junction']);
    expect(faults({ type: 'boxStop', t: 1, box: 'J1', signal: 'right' })).toEqual([]);
  });

  it('bus lane: sustained driving in it is a fault, once', () => {
    const r = new RulesEngine(streetChecks(), 'test');
    for (let i = 0; i < 60; i++)
      r.emit({ type: 'tick', t: i * 0.1, dt: 0.1, speed: 8, accel: 0, limitMph: 30, heading: 0, dist: 0.8, wrongSideBy: null, handbrake: false, throttle: 0.2, inBusLane: true });
    expect(r.faults.map((f) => f.code)).toEqual(['bus-lane']);
  });

  it('passing cyclists and horses (rules 163, 215)', () => {
    const pass = (kind: 'bike' | 'horse', gap: number, mph: number) => faults({ type: 'passVulnerable', t: 1, kind, gap, speed: mph / 2.236936 });
    expect(pass('bike', 1.8, 25)).toEqual([]);
    expect(pass('bike', 1.1, 25)).toEqual(['pass-cyclist-close']);
    expect(pass('bike', 1.6, 40)).toEqual(['pass-cyclist-close']); // more room needed when faster
    expect(pass('bike', 0.4, 20)).toEqual(['pass-cyclist-dangerous']);
    expect(pass('horse', 2.3, 8)).toEqual([]);
    expect(pass('horse', 2.3, 18)).toEqual(['pass-horse']);
    expect(pass('horse', 1.2, 8)).toEqual(['pass-horse']);
  });

  it('school crossing patrol and people crossing at a junction', () => {
    expect(faults(ev({ kind: 'patrol', aspect: null, pedWaiting: true }))).toEqual(['patrol-stop']);
    expect(faults(ev({ kind: 'patrol', aspect: null }))).toEqual([]);
    expect(faults(ev({ kind: 'informal', aspect: null, pedsOn: 1 }))).toEqual(['junction-ped']);
    expect(faults(ev({ kind: 'informal', aspect: null, pedWaiting: true }))).toEqual(['junction-ped-waiting']);
  });

  it('every new fault cites rules that are in the rule references', () => {
    for (const code of Object.keys(FAULTS) as Array<keyof typeof FAULTS>) {
      for (const n of FAULTS[code].rules) expect(RULES[n], `${code} → rule ${n}`).toBeDefined();
    }
  });
});
