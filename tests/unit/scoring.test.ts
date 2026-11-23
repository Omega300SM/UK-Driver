import { describe, it, expect } from 'vitest';
import { tally, groupFaults, MAX_MINORS } from '../../src/scoring/dvsa';
import { scoreLesson, testPercent } from '../../src/scoring/lessonScore';
import { makeFault } from '../../src/rules/faults';

const minors = (n: number) => Array.from({ length: n }, (_, i) => makeFault('kerb-minor', i));

describe('DVSA tally', () => {
  it('passes with up to 15 minors', () => {
    expect(tally(minors(MAX_MINORS)).passed).toBe(true);
    expect(tally(minors(MAX_MINORS + 1)).passed).toBe(false);
  });
  it('any serious or dangerous fault fails', () => {
    expect(tally([makeFault('seatbelt-off', 0)]).passed).toBe(false);
    expect(tally([makeFault('collision-dangerous', 0)]).passed).toBe(false);
  });
  it('groups repeated faults, worst first', () => {
    const g = groupFaults([makeFault('kerb-minor', 0), makeFault('seatbelt-off', 1), makeFault('kerb-minor', 2)]);
    expect(g.map((x) => [x.fault.code, x.count])).toEqual([
      ['seatbelt-off', 1],
      ['kerb-minor', 2]
    ]);
  });
});

describe('lesson score', () => {
  const clean = tally([]);
  it('perfect lesson = 100%, 3 stars', () => {
    const r = scoreLesson({ tally: clean, quizCorrect: 4, quizTotal: 4, guidedCompletion: 1 }, true);
    expect(r).toMatchObject({ scorePct: 100, passed: true, stars: 3, xp: 100 + 150 + 25 });
  });
  it('80% is the pass mark', () => {
    // 3 minors → test 88; quiz 2/4 → 50; guided 100 → 0.6*88 + 0.25*50 + 15 = 80.3
    const r = scoreLesson({ tally: tally(minors(3)), quizCorrect: 2, quizTotal: 4, guidedCompletion: 1 });
    expect(r.scorePct).toBe(80);
    expect(r.passed).toBe(true);
    expect(r.stars).toBe(1);
  });
  it('a serious fault fails even with a high score', () => {
    const r = scoreLesson({ tally: tally([makeFault('seatbelt-off', 0)]), quizCorrect: 4, quizTotal: 4, guidedCompletion: 1 });
    expect(r.passed).toBe(false);
    expect(r.stars).toBe(0);
  });
  it('dangerous zeroes the test component', () => {
    expect(testPercent(tally([makeFault('collision-dangerous', 0)]))).toBe(0);
  });
  it('two stars needs ≤3 minors and quiz ≥75%', () => {
    const r = scoreLesson({ tally: tally(minors(2)), quizCorrect: 3, quizTotal: 4, guidedCompletion: 1 });
    expect(r.stars).toBe(2);
  });
});
