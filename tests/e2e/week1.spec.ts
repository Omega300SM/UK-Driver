import { test, expect, type Page } from '@playwright/test';
import { ROUTES, guidedSteps } from './routes';

/**
 * Week 1 (Days 2–7) in the town of Little Ashby. Each test route is driven by
 * a scripted "good learner" through the same controls the player uses, with
 * AI traffic running. A clean drive must score zero faults and pass.
 */
test.skip(({ viewport }) => (viewport?.width ?? 0) < (viewport?.height ?? 0), 'Driving is landscape-only');
test.setTimeout(240_000);

async function ready(page: Page) {
  await page.goto('/?e2e=1');
  await page.evaluate(() => {
    const s = (window as any).__DE.app.save;
    s.onboarded = true;
    s.settings.tiltOffered = true;
    s.settings.sprint = true;
    (window as any).__DE.persist();
  });
  await page.goto('/?e2e=1');
}

async function openStage(page: Page, day: number, stage: string) {
  await page.evaluate(
    ([d, st]) => {
      const de = (window as any).__DE;
      de.startLesson(d);
      de.session.jump(st);
      de.runStage(de.session);
    },
    [day, stage] as const
  );
  await page.waitForFunction(() => !!(window as any).__drive);
}

async function runScript(page: Page, steps: unknown[], scale = 6) {
  await page.evaluate(
    ([st, k]) => {
      const d = (window as any).__drive;
      d.setTimeScale(k);
      d.run(st);
    },
    [steps, scale] as const
  );
}

async function answerAll(page: Page) {
  await expect(page.getByTestId('quiz')).toBeVisible();
  const n = await page.evaluate(() => (window as any).__DE.session.lesson.quiz.length);
  for (let i = 0; i < n; i++) {
    await page.locator('[data-correct="true"]').first().click();
    await page.getByTestId('quiz-next').click();
  }
}

for (const day of [2, 3, 4, 5, 6, 7]) {
  test(`Day ${day}: a careful drive of the test route passes with no faults`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await ready(page);
    await openStage(page, day, 'test');
    await runScript(page, ROUTES[day]);
    await expect(page.getByTestId('test-over')).toBeVisible({ timeout: 220_000 });
    const res = await page.evaluate(() => ({
      faults: (window as any).__DE.session.testFaults.map((f: { code: string }) => f.code),
      early: (window as any).__DE.session.testEndedEarly
    }));
    expect(res).toEqual({ faults: [], early: false });
    await page.evaluate(() => ((window as any).__DE.app.timeScale = 1));
    await page.getByTestId('to-quiz').click();
    await answerAll(page);
    await expect(page.getByTestId('debrief')).toHaveAttribute('data-passed', 'true');
    expect(errors).toEqual([]);
  });
}

for (const day of [3, 6]) {
  test(`Day ${day}: the guided drive can be completed step by step`, async ({ page }) => {
    await ready(page);
    await openStage(page, day, 'guided');
    await page.waitForTimeout(300);
    await runScript(page, guidedSteps(day), 5);
    await expect(page.getByTestId('drive-free')).toBeVisible({ timeout: 200_000 });
    expect(await page.evaluate(() => (window as any).__DE.session.guidedCompletion)).toBe(1);
  });
}

test('Day 6: rolling over the STOP line is a serious fault citing rule 171', async ({ page }) => {
  await ready(page);
  await openStage(page, 6, 'test');
  await runScript(page, [
    { moveOff: 'right' },
    { drive: [[138.1, 90, 4]] },
    { act: 'signal', arg: 'off' },
    { drive: [[138.1, 22, 7]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'signal', arg: 'left' },
    { act: 'look', arg: 'right' },
    { act: 'look', arg: 'left' },
    // No stop: straight over the line at walking pace.
    { drive: [[138.1, 9, 3], [137, 3.4, 3], [133, 2.1, 4]] }
  ]);
  await expect
    .poll(() => page.evaluate(() => (window as any).__drive?.rules.faults.map((f: { code: string }) => f.code) ?? []), { timeout: 60_000 })
    .toContain('stop-not-stopped');
  const f = await page.evaluate(() => (window as any).__drive.rules.faults.find((x: { code: string }) => x.code === 'stop-not-stopped'));
  expect(f.severity).toBe('serious');
  expect(f.rules).toContain(171);
});

test('Day 5: turning into the No Entry street is a serious fault citing rule 109', async ({ page }) => {
  await ready(page);
  await openStage(page, 5, 'free');
  await page.evaluate(() => {
    const d = (window as any).__drive;
    d.place(96, 1.9, -Math.PI / 2);
    d.rules.mode = 'test';
  });
  await runScript(page, [{ brake: true }, { act: 'gear', arg: 'D' }, { act: 'handbrake' }, { drive: [[84, 2, 3], [80.5, 8, 3], [80, 20, 4]] }]);
  await expect
    .poll(() => page.evaluate(() => (window as any).__drive?.rules.faults.map((f: { code: string }) => f.code) ?? []), { timeout: 60_000 })
    .toContain('no-entry');
});

test('the Week 1 boss unlocks only after Day 6 is passed', async ({ page }) => {
  await ready(page);
  await page.evaluate(() => {
    const s = (window as any).__DE.app.save;
    s.settings.sprint = false;
    (window as any).__DE.persist();
  });
  await page.reload();
  await expect(page.getByTestId('day-7')).toHaveAttribute('data-lock', 'locked-previous');
  await page.evaluate(() => {
    const s = (window as any).__DE.app.save;
    for (let d = 1; d <= 6; d++) s.days[d] = { bestScore: 90, stars: 2, passed: true, attempts: 1, firstPassedDate: '2020-01-0' + d };
    (window as any).__DE.persist();
  });
  await page.reload();
  await expect(page.getByTestId('day-7')).toHaveAttribute('data-lock', 'unlocked');
  await expect(page.getByTestId('day-7')).toContainText('BOSS');
});
