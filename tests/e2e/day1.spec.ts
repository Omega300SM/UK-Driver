import { test, expect, type Page } from '@playwright/test';

/**
 * Core flows on iPhone 13 emulation (portrait + landscape projects).
 * `?e2e=1` exposes test hooks: window.__DE (app) and window.__drive (sim).
 * Drives are scripted through the same action functions the touch HUD uses.
 */

declare global {
  interface Window {
    __DE: {
      app: { save: any; timeScale: number };
      persist(): void;
      startLesson(day: number): void;
      runStage(s: unknown): void;
      session: any;
      setNow(iso: string): void;
    };
    __drive: {
      setTimeScale(k: number): void;
      autoGuided(): void;
      autoTest(o?: { skipMirrors?: boolean; hitSomething?: boolean }): void;
      finish(): void;
      act: Record<string, (...a: any[]) => void>;
      step: number;
    };
  }
}

async function onboard(page: Page) {
  await page.goto('/?e2e=1');
  await expect(page.getByTestId('onboarding')).toBeVisible();
  await page.getByTestId('onboard-agree').check();
  await page.getByTestId('onboard-start').click();
  await expect(page.getByTestId('home')).toBeVisible();
}

async function drillThrough(page: Page) {
  await expect(page.getByTestId('drill')).toBeVisible();
  await page.locator('.hot[data-id="doors"]').click();
  await page.locator('.hot[data-id="seat"]').click();
  await page.getByTestId('seat-slider').fill('65');
  for (const id of ['steering', 'seatbelt', 'mirror-interior', 'mirror-left', 'mirror-right']) await page.locator(`.hot[data-id="${id}"]`).click();
  await page.getByTestId('drill-done').click();
}

async function answerQuiz(page: Page, wrong = 0) {
  await expect(page.getByTestId('quiz')).toBeVisible();
  const n = await page.evaluate(() => window.__DE.session.lesson.quiz.length);
  for (let i = 0; i < n; i++) {
    await page.locator(i < wrong ? '[data-correct="false"]' : '[data-correct="true"]').first().click();
    await page.getByTestId('quiz-next').click();
  }
}

test('launch: onboarding shows disclaimers, then the map', async ({ page }) => {
  await page.goto('/?e2e=1');
  const ob = page.getByTestId('onboarding');
  await expect(ob).toContainText('not a replacement for lessons with a DVSA-approved driving instructor');
  await expect(ob).toContainText('provisional driving licence');
  await expect(ob).toContainText('Highway Code is the legal reference');
  await expect(ob).toContainText('Never play this game while you are driving');
  await expect(ob).toContainText('England');
  await expect(page.getByTestId('onboard-start')).toBeDisabled();
  await page.getByTestId('onboard-agree').check();
  await page.getByTestId('onboard-start').click();
  await expect(page.getByTestId('day-1')).toHaveAttribute('data-lock', 'unlocked');
  await expect(page.getByTestId('day-2')).toHaveAttribute('data-lock', 'locked-previous');
});

test('settings show the safety statements and persist toggles', async ({ page }) => {
  await onboard(page);
  await page.getByTestId('open-settings').click();
  await expect(page.getByTestId('settings')).toContainText('learning aid');
  await page.getByTestId('set-sprint').click();
  await page.reload();
  const sprint = await page.evaluate(() => window.__DE.app.save.settings.sprint);
  expect(sprint).toBe(true);
});

test.describe('Day 1 lesson loop', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < (viewport?.height ?? 0), 'Driving is landscape-only');
  test.setTimeout(180_000);

  test('full loop: briefing → drill → guided → free → test → quiz → debrief, then daily gate', async ({ page }) => {
    await onboard(page);
    await page.getByTestId('day-1').click();
    await expect(page.getByTestId('briefing')).toBeVisible();
    for (let i = 0; i < 4; i++) await page.getByTestId('brief-next').click();
    await drillThrough(page);

    await expect(page.getByTestId('drive-guided')).toBeVisible();
    await page.waitForFunction(() => !!window.__drive);
    await page.evaluate(() => {
      window.__drive.setTimeScale(4);
      window.__drive.autoGuided();
    });
    await expect(page.getByTestId('drive-free')).toBeVisible({ timeout: 90_000 });
    expect(await page.evaluate(() => window.__DE.session.guidedCompletion)).toBe(1);
    await page.getByTestId('drive-finish').click();

    await expect(page.getByTestId('drive-test')).toBeVisible();
    await page.waitForFunction(() => !!window.__drive);
    await page.evaluate(() => {
      window.__drive.setTimeScale(4);
      window.__drive.autoTest();
    });
    await expect(page.getByTestId('test-over')).toBeVisible({ timeout: 120_000 });
    const faults = await page.evaluate(() => window.__DE.session.testFaults.map((f: { code: string }) => f.code));
    expect(faults).toEqual([]);
    await page.evaluate(() => (window.__DE.app.timeScale = 1));
    await page.getByTestId('to-quiz').click();

    await answerQuiz(page);
    const debrief = page.getByTestId('debrief');
    await expect(debrief).toHaveAttribute('data-passed', 'true');
    await expect(debrief).toHaveAttribute('data-score', '100');
    await expect(page.getByTestId('stars')).toHaveAttribute('data-stars', '3');

    // Save + daily gate.
    const save = await page.evaluate(() => window.__DE.app.save);
    expect(save.days[1].passed).toBe(true);
    expect(save.xp).toBeGreaterThan(0);
    expect(save.badges).toContain('belt-up');
    await page.getByTestId('debrief-home').click();
    await expect(page.getByTestId('day-2')).toHaveAttribute('data-lock', 'locked-tomorrow');

    // Persisted across reloads.
    await page.reload();
    await expect(page.getByTestId('home')).toBeVisible();
    await expect(page.getByTestId('day-1')).toContainText('Best 100%');
  });

  test('sloppy move-off gives minor faults with replays and rule citations', async ({ page }) => {
    await onboard(page);
    await page.evaluate(() => {
      window.__DE.startLesson(1);
      window.__DE.session.jump('test');
      window.__DE.runStage(window.__DE.session);
    });
    await page.waitForFunction(() => !!window.__drive);
    await page.evaluate(() => {
      window.__drive.setTimeScale(4);
      window.__drive.autoTest({ skipMirrors: true });
    });
    await expect(page.getByTestId('test-over')).toBeVisible({ timeout: 120_000 });
    await page.evaluate(() => (window.__DE.app.timeScale = 1));
    await page.getByTestId('to-quiz').click();
    await answerQuiz(page);
    await expect(page.getByTestId('debrief')).toHaveAttribute('data-passed', 'true');
    await expect(page.getByTestId('debrief')).toContainText('Observation – moving off');
    await expect(page.getByTestId('debrief')).toContainText('Rule 159');
    await page.getByTestId('replay-moveoff-mirrors').click();
    await expect(page.getByTestId('replay')).toContainText('Highway Code rule 159');
  });

  test('a collision is a dangerous fault: test stops, lesson fails, retry is instant', async ({ page }) => {
    await onboard(page);
    await page.evaluate(() => {
      window.__DE.startLesson(1);
      window.__DE.session.jump('test');
      window.__DE.runStage(window.__DE.session);
    });
    await page.waitForFunction(() => !!window.__drive);
    await page.evaluate(() => {
      window.__drive.setTimeScale(4);
      window.__drive.autoTest({ hitSomething: true });
    });
    await expect(page.getByTestId('test-over')).toContainText('stop you there', { timeout: 120_000 });
    await page.evaluate(() => (window.__DE.app.timeScale = 1));
    await page.getByTestId('to-quiz').click();
    await answerQuiz(page);
    await expect(page.getByTestId('debrief')).toHaveAttribute('data-passed', 'false');
    await page.getByTestId('retry').click();
    await expect(page.getByTestId('drive-test')).toBeVisible();
    const day2 = await page.evaluate(() => window.__DE.app.save.days[1]?.passed ?? false);
    expect(day2).toBe(false);
  });
});

test('sprint mode unlocks Day 2 the same day', async ({ page }) => {
  await onboard(page);
  await page.evaluate(() => {
    const s = window.__DE.app.save;
    s.settings.sprint = true;
    s.days[1] = { bestScore: 90, stars: 2, passed: true, attempts: 1, firstPassedDate: '2026-11-23' };
    window.__DE.setNow('2026-11-23T12:00:00');
    window.__DE.persist();
  });
  await page.reload();
  await expect(page.getByTestId('day-2')).toHaveAttribute('data-lock', 'unlocked');
});
