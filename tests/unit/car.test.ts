import { describe, it, expect } from 'vitest';
import { Car } from '../../src/sim/car';
import { CAR_PARK } from '../../src/world/scenes/carParkLayout';
import { debriefLines } from '../../src/instructor/feedback';
import { scoreLesson } from '../../src/scoring/lessonScore';
import { tally } from '../../src/scoring/dvsa';
import { makeFault } from '../../src/rules/faults';
import { day01 } from '../../src/content/lessons/day01';
import { RULES } from '../../src/content/ruleRefs';

function fresh(): Car {
  const c = new Car();
  c.reset(CAR_PARK.start.x, CAR_PARK.start.z, CAR_PARK.start.heading);
  c.gear = 'D';
  c.handbrake = false;
  return c;
}
const run = (c: Car, secs: number, input: { throttle?: number; brake?: number; steer?: number }) => {
  const out = [];
  for (let i = 0; i < secs * 60; i++) out.push(c.step(1 / 60, { throttle: 0, brake: 0, steer: 0, ...input }, CAR_PARK));
  return out;
};

describe('car model', () => {
  it('automatics creep forward with no pedals', () => {
    const c = fresh();
    run(c, 3, {});
    expect(c.speed).toBeGreaterThan(1);
    expect(c.speed).toBeLessThan(2);
  });

  it('holding the brake stops creep', () => {
    const c = fresh();
    run(c, 2, { brake: 0.4 });
    expect(c.speed).toBe(0);
  });

  it('P holds the car even with throttle', () => {
    const c = fresh();
    c.gear = 'P';
    run(c, 2, { throttle: 1 });
    expect(c.speed).toBe(0);
  });

  it('the handbrake mostly holds against throttle', () => {
    const c = fresh();
    c.handbrake = true;
    run(c, 2, { throttle: 1 });
    expect(Math.abs(c.speed)).toBeLessThan(0.2);
  });

  it('drives east from the start (heading +x)', () => {
    const c = fresh();
    const x0 = c.x;
    run(c, 2, { throttle: 0.6 });
    expect(c.x).toBeGreaterThan(x0 + 2);
    expect(Math.abs(c.z - CAR_PARK.start.z)).toBeLessThan(0.05);
  });

  it('steering right turns the car to its right (towards +z when facing east)', () => {
    const c = fresh();
    run(c, 3, { throttle: 0.5, steer: 1 });
    expect(c.z).toBeGreaterThan(CAR_PARK.start.z + 1);
  });

  it('reports a kerb strike at the car park edge and stops', () => {
    const c = fresh();
    c.heading = Math.PI; // facing −z: drive south through the bays towards the kerb (or a parked car)
    c.x = -40.5;
    const res = run(c, 8, { throttle: 0.6 });
    expect(res.some((r) => r.kerb !== undefined || r.collision)).toBe(true);
  });
});

describe('Maggie’s debrief', () => {
  const q = { correct: 4, total: 4, questions: day01.quiz };
  it('praises a clean pass', () => {
    const r = scoreLesson({ tally: tally([]), quizCorrect: 4, quizTotal: 4, guidedCompletion: 1 });
    expect(debriefLines(r, tally([]), [], q)[0]).toMatch(/Not a single fault/);
  });
  it('names the serious fault and its rule on a fail', () => {
    const f = [makeFault('seatbelt-off', 1)];
    const r = scoreLesson({ tally: tally(f), quizCorrect: 4, quizTotal: 4, guidedCompletion: 1 });
    const lines = debriefLines(r, tally(f), f, q);
    expect(lines[0]).toMatch(/seat belt/i);
    expect(lines[0]).toMatch(/rule 99/);
  });
});

describe('Day 1 content', () => {
  it('cites only verified rules and has 3–5 quiz questions', () => {
    for (const n of day01.rules) expect(RULES[n]).toBeDefined();
    for (const qq of day01.quiz) for (const n of qq.rules) expect(RULES[n]).toBeDefined();
    expect(day01.quiz.length).toBeGreaterThanOrEqual(3);
    expect(day01.quiz.length).toBeLessThanOrEqual(5);
    for (const qq of day01.quiz) expect(qq.answer).toBeLessThan(qq.options.length);
  });
  it('briefing narration is roughly 60–90 seconds', () => {
    const words = day01.briefing.reduce((n, s) => n + s.say.split(/\s+/).length, 0);
    const seconds = words / 2.6; // ~155 wpm
    expect(seconds).toBeGreaterThan(55);
    expect(seconds).toBeLessThan(100);
  });
});
