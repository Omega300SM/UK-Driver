import { describe, it, expect } from 'vitest';
import { newSave, lockState, recordResult, touchStreak, levelFor, localDate } from '../../src/scoring/progress';
import { scoreLesson } from '../../src/scoring/lessonScore';
import { tally } from '../../src/scoring/dvsa';
import { parseSave, loadSave, writeSave, SAVE_KEY, type KV } from '../../src/platform/storage';
import { makeFault } from '../../src/rules/faults';

const pass = scoreLesson({ tally: tally([]), quizCorrect: 4, quizTotal: 4, guidedCompletion: 1 });
const fail = scoreLesson({ tally: tally([makeFault('seatbelt-off', 0)]), quizCorrect: 4, quizTotal: 4, guidedCompletion: 1 });

const d = (s: string) => new Date(`${s}T10:00:00`);

describe('unlocks', () => {
  it('day 1 is always open; day 2 needs day 1 passed', () => {
    const s = newSave();
    expect(lockState(s, 1, d('2026-11-23'))).toBe('unlocked');
    expect(lockState(s, 2, d('2026-11-23'))).toBe('locked-previous');
  });

  it('failing does not unlock', () => {
    const s = newSave();
    recordResult(s, 1, fail, [], d('2026-11-23'));
    expect(lockState(s, 2, d('2026-11-24'))).toBe('locked-previous');
  });

  it('passing opens the next day tomorrow (daily gate)', () => {
    const s = newSave();
    const out = recordResult(s, 1, pass, [], d('2026-11-23'));
    expect(out.unlockedNext).toBe('locked-tomorrow');
    expect(lockState(s, 2, d('2026-11-23'))).toBe('locked-tomorrow');
    expect(lockState(s, 2, d('2026-11-24'))).toBe('unlocked');
  });

  it('sprint mode removes the daily gate', () => {
    const s = newSave();
    s.settings.sprint = true;
    recordResult(s, 1, pass, [], d('2026-11-23'));
    expect(lockState(s, 2, d('2026-11-23'))).toBe('unlocked');
  });

  it('a later retake does not move the first-pass date', () => {
    const s = newSave();
    recordResult(s, 1, pass, [], d('2026-11-23'));
    recordResult(s, 1, pass, [], d('2026-11-25'));
    expect(s.days[1].firstPassedDate).toBe('2026-11-23');
    expect(s.days[1].attempts).toBe(2);
  });
});

describe('streaks, XP, badges', () => {
  it('counts consecutive days and resets after a gap', () => {
    const s = newSave();
    touchStreak(s, d('2026-11-23'));
    touchStreak(s, d('2026-11-23'));
    touchStreak(s, d('2026-11-24'));
    touchStreak(s, d('2026-11-25'));
    expect(s.streak.count).toBe(3);
    touchStreak(s, d('2026-11-28'));
    expect(s.streak.count).toBe(1);
    expect(s.streak.best).toBe(3);
  });

  it('awards the lesson badge and clean sheet once', () => {
    const s = newSave();
    const a = recordResult(s, 1, pass, [], d('2026-11-23'), 'belt-up');
    expect(a.newBadges).toEqual(expect.arrayContaining(['belt-up', 'clean-sheet', 'three-star', 'mirror-mirror']));
    const b = recordResult(s, 1, pass, [], d('2026-11-23'), 'belt-up');
    expect(b.newBadges).toEqual([]);
  });

  it('level curve', () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(150).level).toBe(2);
    expect(levelFor(600).level).toBe(3);
  });

  it('localDate uses the local calendar', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('save/load', () => {
  function memKV(): KV & { store: Map<string, string> } {
    const store = new Map<string, string>();
    return { store, getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: (k) => void store.delete(k) };
  }

  it('round-trips', () => {
    const kv = memKV();
    const s = newSave();
    s.onboarded = true;
    recordResult(s, 1, pass, [], d('2026-11-23'));
    writeSave(s, kv);
    expect(loadSave(kv)).toEqual(s);
  });

  it('corrupt or unknown data falls back to a fresh save', () => {
    expect(parseSave('{nope')).toEqual(newSave());
    expect(parseSave(JSON.stringify({ version: 99 }))).toEqual(newSave());
  });

  it('fills in settings added in later versions', () => {
    const kv = memKV();
    kv.setItem(SAVE_KEY, JSON.stringify({ version: 1, onboarded: true, settings: { voice: false }, days: {}, xp: 5, streak: { count: 1, lastDate: null, best: 1 }, badges: [] }));
    const s = loadSave(kv);
    expect(s.settings.voice).toBe(false);
    expect(s.settings.speedHud).toBe(true);
  });
});
