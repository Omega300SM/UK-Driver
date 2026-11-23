import type { LessonResult } from './lessonScore';
import type { Fault } from '../rules/types';

export interface Settings {
  voice: boolean;
  sound: boolean;
  sprint: boolean;
  steeringAssist: boolean;
  lineHints: boolean;
  speedHud: boolean;
  tilt: boolean;
  tiltOffered: boolean;
  camera: 'chase' | 'cockpit';
  lowPower: boolean;
  manual: boolean;
}

export interface DayRecord {
  bestScore: number;
  stars: 0 | 1 | 2 | 3;
  passed: boolean;
  attempts: number;
  /** Local date (YYYY-MM-DD) the day was first passed. */
  firstPassedDate?: string;
}

export interface SaveData {
  version: 1;
  onboarded: boolean;
  settings: Settings;
  days: Record<number, DayRecord>;
  xp: number;
  streak: { count: number; lastDate: string | null; best: number };
  badges: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  voice: true,
  sound: true,
  sprint: false,
  steeringAssist: false,
  lineHints: true,
  speedHud: true,
  tilt: false,
  tiltOffered: false,
  camera: 'chase',
  lowPower: false,
  manual: false
};

export function newSave(): SaveData {
  return {
    version: 1,
    onboarded: false,
    settings: { ...DEFAULT_SETTINGS },
    days: {},
    xp: 0,
    streak: { count: 0, lastDate: null, best: 0 },
    badges: []
  };
}

/** Local calendar date as YYYY-MM-DD (not UTC: a lesson at 11pm counts for today). */
export function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

export type LockState = 'unlocked' | 'locked-previous' | 'locked-tomorrow';

/**
 * Day n is open when day n−1 is passed AND (sprint mode OR today is a later
 * calendar day than when day n−1 was first passed).
 */
export function lockState(save: SaveData, day: number, now: Date): LockState {
  if (day <= 1) return 'unlocked';
  const prev = save.days[day - 1];
  if (!prev?.passed) return 'locked-previous';
  if (save.settings.sprint) return 'unlocked';
  if (!prev.firstPassedDate) return 'unlocked';
  return dayDiff(prev.firstPassedDate, localDate(now)) >= 1 ? 'unlocked' : 'locked-tomorrow';
}

export function touchStreak(save: SaveData, now: Date): void {
  const today = localDate(now);
  const last = save.streak.lastDate;
  if (last === today) return;
  if (last && dayDiff(last, today) === 1) save.streak.count += 1;
  else save.streak.count = 1;
  save.streak.lastDate = today;
  save.streak.best = Math.max(save.streak.best, save.streak.count);
}

/** XP level curve: level n needs 150·(n−1)² XP. */
export function levelFor(xp: number): { level: number; into: number; span: number } {
  const level = Math.floor(Math.sqrt(xp / 150)) + 1;
  const base = 150 * (level - 1) ** 2;
  const next = 150 * level ** 2;
  return { level, into: xp - base, span: next - base };
}

export interface RecordOutcome {
  newBadges: string[];
  firstPass: boolean;
  unlockedNext: LockState;
}

export function recordResult(
  save: SaveData,
  day: number,
  result: LessonResult,
  faults: readonly Fault[],
  now: Date,
  lessonBadge?: string
): RecordOutcome {
  const rec: DayRecord = save.days[day] ?? { bestScore: 0, stars: 0, passed: false, attempts: 0 };
  const firstPass = result.passed && !rec.passed;
  rec.attempts += 1;
  rec.bestScore = Math.max(rec.bestScore, result.scorePct);
  rec.stars = Math.max(rec.stars, result.stars) as DayRecord['stars'];
  if (result.passed) {
    rec.passed = true;
    rec.firstPassedDate ??= localDate(now);
  }
  save.days[day] = rec;
  save.xp += result.xp;
  touchStreak(save, now);

  const earned: string[] = [];
  const award = (id: string | undefined, cond: boolean) => {
    if (id && cond && !save.badges.includes(id)) {
      save.badges.push(id);
      earned.push(id);
    }
  };
  award(lessonBadge, result.passed);
  award('mirror-mirror', result.passed && !faults.some((f) => f.category.startsWith('Observation') || f.category.startsWith('Use of mirrors')));
  award('clean-sheet', result.passed && faults.length === 0);
  award('three-star', result.stars === 3);
  award('streak-3', save.streak.count >= 3);
  award('streak-7', save.streak.count >= 7);

  return { newBadges: earned, firstPass, unlockedNext: lockState(save, day + 1, now) };
}
