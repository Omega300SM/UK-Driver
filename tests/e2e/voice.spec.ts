import { test, expect } from '@playwright/test';

/**
 * We can't hear an iPhone from CI, but we can check the game does what iOS
 * needs: asks for a "playback" audio session (so the silent switch doesn't
 * mute it), unlocks speech from a tap, and sends Maggie's lines to the synth.
 */
test('Maggie speaks after the first tap, with a playback audio session', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__spoken = [];
    (navigator as any).audioSession = { type: 'auto' };
    const synth = window.speechSynthesis;
    if (synth) {
      const real = synth.speak.bind(synth);
      synth.speak = (u: SpeechSynthesisUtterance) => {
        (window as any).__spoken.push({ text: u.text, volume: u.volume, lang: u.lang });
        try {
          real(u);
        } catch {
          /* headless may have no voices */
        }
      };
    }
  });
  await page.goto('/?e2e=1');
  await page.getByTestId('onboard-agree').check();
  await page.getByTestId('onboard-start').click();
  await expect(page.getByTestId('home')).toBeVisible();

  const session = await page.evaluate(() => (navigator as any).audioSession.type);
  expect(session).toBe('playback');

  await page.getByTestId('day-1').click();
  await expect(page.getByTestId('briefing')).toBeVisible();
  await expect
    .poll(async () => page.evaluate(() => (window as any).__spoken.filter((s: any) => s.volume > 0).map((s: any) => s.text)))
    .toEqual(expect.arrayContaining([expect.stringContaining('I’m Maggie Hale')]));
  const lang = await page.evaluate(() => (window as any).__spoken.at(-1).lang);
  expect(lang).toBe('en-GB');

  // Settings has a one-tap voice test.
  await page.goto('/?e2e=1');
  await page.getByTestId('open-settings').click();
  await page.getByTestId('test-voice').click();
  await expect
    .poll(async () => page.evaluate(() => (window as any).__spoken.map((s: any) => s.text).join(' ')))
    .toContain('If you can hear me');
});
