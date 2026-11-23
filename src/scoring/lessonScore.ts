import type { TestTally } from './dvsa';

/** All scoring weights in one place (see PLAN.md §3). */
export const WEIGHTS = {
  test: 0.6,
  quiz: 0.25,
  guided: 0.15,
  perMinor: 4,
  perSerious: 30,
  passMark: 80
};

export interface LessonInputs {
  tally: TestTally;
  quizCorrect: number;
  quizTotal: number;
  /** 0..1 share of guided steps completed. */
  guidedCompletion: number;
}

export interface LessonResult {
  testPct: number;
  quizPct: number;
  guidedPct: number;
  scorePct: number;
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
  xp: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function testPercent(t: TestTally): number {
  if (t.dangerous > 0) return 0;
  return clamp(100 - t.minors * WEIGHTS.perMinor - t.serious * WEIGHTS.perSerious, 0, 100);
}

export function scoreLesson(i: LessonInputs, firstPass = false): LessonResult {
  const testPct = testPercent(i.tally);
  const quizPct = i.quizTotal ? (100 * i.quizCorrect) / i.quizTotal : 100;
  const guidedPct = 100 * clamp(i.guidedCompletion, 0, 1);
  const scorePct = Math.round(testPct * WEIGHTS.test + quizPct * WEIGHTS.quiz + guidedPct * WEIGHTS.guided);
  const passed = scorePct >= WEIGHTS.passMark && i.tally.passed;

  let stars: LessonResult['stars'] = 0;
  if (passed) {
    stars = 1;
    if (i.tally.minors <= 3 && quizPct >= 75) stars = 2;
    if (i.tally.minors === 0 && quizPct === 100) stars = 3;
  }
  const xp = passed ? 100 + 50 * stars + (firstPass ? 25 : 0) : 20; // a little XP for trying
  return { testPct, quizPct, guidedPct, scorePct, passed, stars, xp };
}
