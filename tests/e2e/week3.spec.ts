import { test, expect, type Page } from '@playwright/test';
import { ROUTES3 } from './routes3';

test.skip(({ viewport }) => (viewport?.width ?? 0) < (viewport?.height ?? 0), 'Driving is landscape-only');
test.setTimeout(560_000);

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

for (const day of Object.keys(ROUTES3).map(Number)) {
  test(`Day ${day}: a careful drive of the test route passes with no faults`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await ready(page);
    await openStage(page, day, 'test');
    await page.evaluate((st) => {
      const d = (window as any).__drive;
      d.setTimeScale(5);
      d.run(st);
    }, ROUTES3[day] as unknown[]);
    const t0 = Date.now();
    let finished = false;
    while (Date.now() - t0 < 540_000) {
      const st = await page.evaluate(() => ({
        over: !!document.querySelector('[data-testid=test-over]'),
        t: Math.round((window as any).__drive?.t ?? 0),
        near: ((window as any).__drive?.traffic.cars ?? [])
          .filter((c: any) => Math.hypot(c.x - (window as any).__drive.car.x, c.z - (window as any).__drive.car.z) < 25)
          .map((c: any) => `${c.kind}:${c.path?.id ?? 'x'}:${c.x.toFixed(1)},${c.z.toFixed(1)}:${c.speed.toFixed(1)}${c.waiting ? 'W' : ''}`)
          .join(' '),
        x: (window as any).__drive?.car.x,
        z: (window as any).__drive?.car.z,
        f: (window as any).__drive?.rules.faults.map((f: { code: string; t: number }) => `${f.code}@${Math.round(f.t)}`)
      }));
      if ((globalThis as any).process?.env?.ROUTE_DEBUG) console.log(JSON.stringify(st));
      if (st.over) {
        finished = true;
        break;
      }
      await page.waitForTimeout(2000);
    }
    const res = await page.evaluate(() => ({
      faults: (window as any).__DE.session.testFaults.map((f: { code: string }) => f.code),
      early: (window as any).__DE.session.testEndedEarly
    }));
    expect(finished, 'the scripted drive reached the end of the test').toBe(true);
    expect(res).toEqual({ faults: [], early: false });
    expect(errors).toEqual([]);
  });
}
