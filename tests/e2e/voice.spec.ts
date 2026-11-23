import { test, expect, type Page } from '@playwright/test';

/**
 * We can't hear an iPhone from CI, so these tests swap in a fake
 * speechSynthesis that follows iOS Safari's rules:
 *  - speech is locked until an utterance *starts* that was requested
 *    synchronously inside a tap (touchend/click);
 *  - while locked, speak() outside a tap is silently dropped;
 *  - cancel() kills queued utterances before they start (so a cancelled
 *    unlock utterance never unlocks anything).
 */
async function installFakeIosSpeech(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__started = [] as string[];
    (navigator as any).audioSession = { type: 'auto' };
    let inGesture = false;
    for (const ev of ['touchend', 'click']) {
      window.addEventListener(
        ev,
        () => {
          inGesture = true;
          setTimeout(() => (inGesture = false), 0);
        },
        true
      );
    }
    let unlocked = false;
    let queue: Array<{ u: SpeechSynthesisUtterance; gesture: boolean }> = [];
    let speaking: SpeechSynthesisUtterance | null = null;
    const pump = () => {
      if (speaking || !queue.length) return;
      const { u, gesture } = queue.shift()!;
      if (!unlocked && !gesture) return pump(); // dropped silently, as on iOS
      unlocked = true;
      speaking = u;
      if (u.volume > 0) w.__started.push(u.text);
      u.onstart?.(new Event('start') as any);
      setTimeout(() => {
        if (speaking !== u) return;
        speaking = null;
        u.onend?.(new Event('end') as any);
        pump();
      }, 30);
    };
    const fake = {
      getVoices: () => [{ name: 'Serena', lang: 'en-GB', localService: true, default: false, voiceURI: 'serena' }],
      speak(u: SpeechSynthesisUtterance) {
        queue.push({ u, gesture: inGesture });
        setTimeout(pump, 0);
      },
      cancel() {
        const killed = [...queue.map((q) => q.u), ...(speaking ? [speaking] : [])];
        queue = [];
        speaking = null;
        for (const u of killed) u.onerror?.({ error: 'interrupted' } as any);
      },
      pause() {},
      resume() {},
      get speaking() {
        return !!speaking;
      },
      get pending() {
        return queue.length > 0;
      },
      get paused() {
        return false;
      },
      addEventListener() {},
      removeEventListener() {}
    };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
    // Real utterance objects may refuse a fake voice; accept anything.
    class U {
      text: string;
      lang = '';
      voice: unknown = null;
      volume = 1;
      rate = 1;
      pitch = 1;
      onstart: ((e: Event) => void) | null = null;
      onend: ((e: Event) => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      constructor(t: string) {
        this.text = t;
      }
    }
    (window as any).SpeechSynthesisUtterance = U;
  });
}

const started = (page: Page) => page.evaluate(() => (window as any).__started as string[]);

test('Maggie is heard on iOS-style speech: first tap unlocks, later lines play', async ({ page }) => {
  await installFakeIosSpeech(page);
  await page.goto('/?e2e=1');
  await page.getByTestId('onboard-agree').check();
  await page.getByTestId('onboard-start').click();
  await expect(page.getByTestId('home')).toBeVisible();
  expect(await page.evaluate(() => (navigator as any).audioSession.type)).toBe('playback');
  await expect.poll(() => started(page)).toEqual(expect.arrayContaining([expect.stringContaining('Lovely to meet you')]));

  // Opening a lesson speaks the first slide; tapping Next speaks the next one.
  await page.getByTestId('day-1').click();
  await expect.poll(() => started(page)).toEqual(expect.arrayContaining([expect.stringContaining('I’m Maggie Hale')]));
  await page.getByTestId('brief-next').click();
  await expect.poll(() => started(page)).toEqual(expect.arrayContaining([expect.stringContaining('cockpit drill')]));
});

test('after a reload, the first tap still unlocks speech (no cancelled unlock)', async ({ page }) => {
  await installFakeIosSpeech(page);
  await page.goto('/?e2e=1');
  await page.evaluate(() => {
    const s = (window as any).__DE.app.save;
    s.onboarded = true;
    (window as any).__DE.persist();
  });
  await page.reload();
  await page.getByTestId('day-1').click();
  await expect.poll(() => started(page)).toEqual(expect.arrayContaining([expect.stringContaining('I’m Maggie Hale')]));
  await page.getByTestId('brief-next').click();
  await page.getByTestId('brief-next').click();
  await expect.poll(async () => (await started(page)).length).toBeGreaterThanOrEqual(3);
});

test('Settings voice check plays and reports status', async ({ page }) => {
  await installFakeIosSpeech(page);
  await page.goto('/?e2e=1');
  await page.evaluate(() => {
    const s = (window as any).__DE.app.save;
    s.onboarded = true;
    (window as any).__DE.persist();
  });
  await page.reload();
  await page.getByTestId('open-settings').click();
  await page.getByTestId('test-voice').click();
  await expect.poll(() => started(page)).toEqual(expect.arrayContaining([expect.stringContaining('If you can hear me')]));
  await expect(page.getByTestId('voice-status')).toContainText('English (UK) voices: Serena');
  await expect(page.getByTestId('voice-status')).toContainText('Unlocked: yes');
});
