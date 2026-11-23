import { describe, it, expect } from 'vitest';
import { RulesEngine } from '../../src/rules/RulesEngine';
import { day1Checks, TUNING } from '../../src/rules/checks';
import type { DriveEvent } from '../../src/rules/types';
import { RULES } from '../../src/content/ruleRefs';
import { FAULTS } from '../../src/rules/faults';

const tick = (t: number, o: Partial<Extract<DriveEvent, { type: 'tick' }>> = {}): DriveEvent => ({
  type: 'tick',
  t,
  dt: 0.1,
  speed: 0,
  accel: 0,
  limitMph: 10,
  heading: 0,
  dist: 0,
  wrongSideBy: null,
  handbrake: false,
  throttle: 0,
  ...o
});

function engine() {
  return new RulesEngine(day1Checks(), 'test');
}

const codes = (e: RulesEngine) => e.faults.map((f) => f.code);

describe('moving off', () => {
  it('a perfect move-off raises no faults', () => {
    const e = engine();
    e.emit({ type: 'seatbelt', t: 0, on: true });
    e.emit({ type: 'handbrake', t: 1, on: false });
    e.emit({ type: 'mirror', t: 2, which: 'interior' });
    e.emit({ type: 'mirror', t: 2.5, which: 'right' });
    e.emit({ type: 'shoulder', t: 3, side: 'right' });
    e.emit({ type: 'signal', t: 3.5, state: 'right' });
    e.emit({ type: 'moveOff', t: 4.5 });
    expect(e.faults).toEqual([]);
  });

  it('moving off without a seat belt is a serious fault citing rule 99', () => {
    const e = engine();
    e.emit({ type: 'mirror', t: 0, which: 'right' });
    e.emit({ type: 'shoulder', t: 0, side: 'right' });
    e.emit({ type: 'moveOff', t: 1 });
    const f = e.faults.find((x) => x.code === 'seatbelt-off');
    expect(f?.severity).toBe('serious');
    expect(f?.rules).toContain(99);
  });

  it('flags missing mirror and blind-spot checks (rule 159)', () => {
    const e = engine();
    e.emit({ type: 'seatbelt', t: 0, on: true });
    e.emit({ type: 'moveOff', t: 10 });
    expect(codes(e)).toEqual(['moveoff-mirrors', 'moveoff-blindspot']);
    expect(e.faults.every((f) => f.rules.includes(159))).toBe(true);
  });

  it('a stale mirror check does not count', () => {
    const e = engine();
    e.emit({ type: 'seatbelt', t: 0, on: true });
    e.emit({ type: 'mirror', t: 0, which: 'interior' });
    e.emit({ type: 'shoulder', t: 0, side: 'right' });
    e.emit({ type: 'moveOff', t: TUNING.mirrorWindowS + 1 });
    expect(codes(e)).toContain('moveoff-mirrors');
  });
});

describe('mirror before signal', () => {
  it('faults a signal with no prior mirror check', () => {
    const e = engine();
    e.emit({ type: 'signal', t: 5, state: 'left' });
    expect(codes(e)).toEqual(['signal-no-mirror']);
  });

  it('accepts the interior or same-side mirror', () => {
    const e = engine();
    e.emit({ type: 'mirror', t: 1, which: 'left' });
    e.emit({ type: 'signal', t: 2, state: 'left' });
    e.emit({ type: 'mirror', t: 10, which: 'interior' });
    e.emit({ type: 'signal', t: 11, state: 'right' });
    expect(e.faults).toEqual([]);
  });

  it('the opposite door mirror does not count', () => {
    const e = engine();
    e.emit({ type: 'mirror', t: 1, which: 'right' });
    e.emit({ type: 'signal', t: 2, state: 'left' });
    expect(codes(e)).toEqual(['signal-no-mirror']);
  });

  it('cancelling a signal never needs a mirror check', () => {
    const e = engine();
    e.emit({ type: 'signal', t: 2, state: 'off' });
    expect(e.faults).toEqual([]);
  });
});

describe('speed', () => {
  it('ignores a brief blip and small excess', () => {
    const e = engine();
    for (let i = 0; i < 5; i++) e.emit(tick(i * 0.1, { speed: 6 /* 13.4 mph */ }));
    e.emit(tick(1, { speed: 5.2 /* 11.6 mph */ }));
    expect(e.faults).toEqual([]);
  });

  it('a sustained excess is a minor, then a big excess escalates once', () => {
    const e = engine();
    let t = 0;
    for (let i = 0; i < 20; i++) e.emit(tick((t += 0.1), { speed: 6 }));
    expect(codes(e)).toEqual(['speed-minor']);
    for (let i = 0; i < 20; i++) e.emit(tick((t += 0.1), { speed: 10 /* 22 mph */ }));
    expect(codes(e)).toEqual(['speed-minor', 'speed-serious']);
    for (let i = 0; i < 20; i++) e.emit(tick((t += 0.1), { speed: 10 }));
    expect(e.faults.length).toBe(2);
  });

  it('re-arms after dropping under the limit', () => {
    const e = engine();
    let t = 0;
    for (let i = 0; i < 20; i++) e.emit(tick((t += 0.1), { speed: 6 }));
    e.emit(tick((t += 0.1), { speed: 2 }));
    for (let i = 0; i < 20; i++) e.emit(tick((t += 0.1), { speed: 6 }));
    expect(codes(e)).toEqual(['speed-minor', 'speed-minor']);
  });
});

describe('control', () => {
  it('kerb strikes: slow = minor, fast = serious, one per scrape', () => {
    const e = engine();
    e.emit({ type: 'kerb', t: 1, speed: 2 });
    e.emit({ type: 'kerb', t: 1.5, speed: 2 });
    e.emit({ type: 'kerb', t: 10, speed: 8 });
    expect(codes(e)).toEqual(['kerb-minor', 'kerb-serious']);
  });

  it('a fast collision is dangerous', () => {
    const e = engine();
    e.emit({ type: 'collision', t: 1, speed: 5, what: 'car' });
    expect(e.dangerous).toBe(true);
  });

  it('driving against the handbrake is flagged once', () => {
    const e = engine();
    for (let i = 0; i < 30; i++) e.emit(tick(i * 0.1, { handbrake: true, throttle: 0.8 }));
    expect(codes(e)).toEqual(['handbrake-drive']);
  });

  it('harsh braking at speed', () => {
    const e = engine();
    e.emit(tick(1, { speed: 8, accel: -8 }));
    e.emit(tick(1.1, { speed: 7, accel: -8 }));
    expect(codes(e)).toEqual(['harsh-brake']);
  });

  it('horn while stationary cites rule 112', () => {
    const e = engine();
    e.emit({ type: 'horn', t: 1, speed: 0 });
    expect(e.faults[0].rules).toEqual([112]);
  });

  it('not securing the car at the end', () => {
    const e = engine();
    e.emit({ type: 'finish', t: 1, handbrake: false, gear: 'D' });
    expect(codes(e)).toEqual(['not-secured']);
    const ok = engine();
    ok.emit({ type: 'finish', t: 1, handbrake: true, gear: 'P' });
    expect(ok.faults).toEqual([]);
  });
});

describe('position and signals', () => {
  it('sustained wrong-side position is a minor (rule 160)', () => {
    const e = engine();
    for (let i = 0; i < 25; i++) e.emit(tick(i * 0.1, { speed: 5, wrongSideBy: 1.5 }));
    expect(codes(e)).toEqual(['lane-position']);
  });

  it('a signal left on for a long way is flagged (rule 103)', () => {
    const e = engine();
    e.emit({ type: 'mirror', t: 0, which: 'interior' });
    e.emit({ type: 'signal', t: 1, state: 'right' });
    for (let i = 0; i < 100; i++) e.emit(tick(1 + i * 0.1, { speed: 5, dist: 1, heading: 0 }));
    expect(codes(e)).toEqual(['signal-not-cancelled']);
  });

  it('a signal used for a turn is not flagged', () => {
    const e = engine();
    e.emit({ type: 'mirror', t: 0, which: 'interior' });
    e.emit({ type: 'signal', t: 1, state: 'left' });
    for (let i = 0; i < 100; i++) e.emit(tick(1 + i * 0.1, { speed: 5, dist: 1, heading: i < 20 ? 0 : 1.5 }));
    expect(e.faults).toEqual([]);
  });
});

describe('coach mode', () => {
  it('reports faults to listeners without counting them', () => {
    const e = new RulesEngine(day1Checks(), 'coach');
    const heard: string[] = [];
    e.onFault((f) => heard.push(f.code));
    e.emit({ type: 'signal', t: 1, state: 'left' });
    expect(heard).toEqual(['signal-no-mirror']);
    expect(e.faults).toEqual([]);
  });
});

describe('content integrity', () => {
  it('every fault cites rules that exist in ruleRefs', () => {
    for (const [code, def] of Object.entries(FAULTS)) {
      for (const r of def.rules) expect(RULES[r], `${code} cites ${r}`).toBeDefined();
    }
  });
});
