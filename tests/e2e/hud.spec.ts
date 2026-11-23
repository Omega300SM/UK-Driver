import { test, expect, devices, type Page } from '@playwright/test';

/**
 * Drive HUD on real iPhone viewport sizes, including Safari with its address
 * and tab bars showing in landscape (as short as ~220px tall).
 */
const SIZES: Array<[string, number, number]> = [
  ['iPhone 13, Safari with tab bar', 844, 280],
  ['iPhone 13, Safari', 844, 320],
  ['iPhone SE, Safari', 667, 220],
  ['iPhone 13 mini, Safari', 812, 290],
  ['iPhone 13, home screen', 844, 390],
  ['iPhone Pro Max, home screen', 932, 430],
  ['iPhone SE, home screen', 667, 375]
];

test.use({ ...devices['iPhone 13'], browserName: 'chromium' });

async function openDrive(page: Page, stage: 'free' | 'test') {
  await page.goto('/?e2e=1');
  await page.evaluate(() => {
    const s = (window as any).__DE.app.save;
    s.onboarded = true;
    s.settings.tiltOffered = true;
    (window as any).__DE.persist();
  });
  await page.goto('/?e2e=1');
  await page.evaluate((st) => {
    const de = (window as any).__DE;
    de.startLesson(1);
    de.session.jump(st);
    de.runStage(de.session);
  }, stage);
  await page.waitForFunction(() => !!(window as any).__drive);
}

for (const [name, w, h] of SIZES) {
  test(`no HUD controls overlap: ${name} (${w}×${h})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await openDrive(page, 'free');
    const problems = await page.evaluate(() => {
      const els = [...document.querySelectorAll<HTMLElement>('.hud button, .hud .speedo, .hud .wheel, .hud .bubble-wrap')];
      const rs = els.map((e) => [e, e.getBoundingClientRect()] as const).filter(([, r]) => r.width > 0);
      const out: string[] = [];
      const name = (e: Element) => e.getAttribute('aria-label') || e.getAttribute('data-testid') || e.className;
      for (let i = 0; i < rs.length; i++)
        for (let j = i + 1; j < rs.length; j++) {
          const [a, ra] = rs[i];
          const [b, rb] = rs[j];
          if (a.contains(b) || b.contains(a)) continue;
          const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (ix > 1 && iy > 1) out.push(`${name(a)} overlaps ${name(b)}`);
        }
      for (const [e, r] of rs) if (r.left < 0 || r.top < 0 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) out.push(`${name(e)} is off screen`);
      return out;
    });
    expect(problems).toEqual([]);
  });
}

test('two-finger control: hold BRAKE and tap D selects Drive', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 280 });
  await openDrive(page, 'test');
  const centre = async (sel: string) => {
    const r = (await page.locator(sel).boundingBox())!;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  const brake = await centre('.pedal.brake');
  const d = await centre('[data-testid="hud-gear-D"]');
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchEnd', points: Array<{ x: number; y: number; id: number }>) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });

  // Without the brake, Maggie refuses to leave Park.
  await touch('touchStart', [{ ...d, id: 2 }]);
  await touch('touchEnd', []);
  await expect(page.locator('[data-testid="hud-gear-P"]')).toHaveClass(/on/);

  // Finger 1 holds the brake, finger 2 taps D.
  await touch('touchStart', [{ ...brake, id: 1 }]);
  await page.waitForTimeout(200);
  await touch('touchStart', [{ ...brake, id: 1 }, { ...d, id: 2 }]);
  await touch('touchEnd', [{ ...brake, id: 1 }]);
  await expect(page.locator('[data-testid="hud-gear-D"]')).toHaveClass(/on/);
  await touch('touchEnd', []);
  expect(await page.evaluate(() => (window as any).__drive.car.gear)).toBe('D');
});

test('handbrake, belt and indicators respond to single taps', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 280 });
  await openDrive(page, 'test');
  await page.getByTestId('hud-belt').tap();
  await page.getByTestId('hud-handbrake').tap();
  await page.getByTestId('hud-ind-right').tap();
  const st = await page.evaluate(() => ({ hb: (window as any).__drive.car.handbrake, belt: (window as any).__drive.rules.ctx.seatbelt, sig: (window as any).__drive.rules.ctx.signal }));
  expect(st).toEqual({ hb: false, belt: true, sig: 'right' });
});
