import { describe, it, expect } from 'vitest';
import { getLesson, CURRICULUM } from '../../src/content/curriculum';
import { isDrivable, type SceneLayout } from '../../src/world/layout';
import { MILL_TOWN } from '../../src/world/scenes/millTownLayout';
import { TOWN } from '../../src/world/scenes/townLayout';
import { DEVON } from '../../src/world/scenes/devonLayout';

const SCENES: Record<string, SceneLayout | undefined> = { millTown: MILL_TOWN, town: TOWN, devon: DEVON };

describe('lesson content', () => {
  for (const d of CURRICULUM.filter((c) => c.available)) {
    const lesson = getLesson(d.day)!;
    const L = SCENES[lesson.sceneId];
    if (!L) continue;
    it(`Day ${d.day}: starts, hints and markers are on the road`, () => {
      for (const [name, stage] of [['guided', lesson.guided], ['free', lesson.free], ['test', lesson.test]] as const) {
        if (!stage) continue;
        if (stage.start) expect(isDrivable(L, stage.start.x, stage.start.z), `${name} start`).toBe(true);
        const hint = stage.hint ?? [];
        for (let i = 1; i < hint.length; i++) {
          const [ax, az] = hint[i - 1];
          const [bx, bz] = hint[i];
          const n = Math.ceil(Math.hypot(bx - ax, bz - az));
          for (let k = 0; k <= n; k++) {
            const x = ax + ((bx - ax) * k) / Math.max(1, n);
            const z = az + ((bz - az) * k) / Math.max(1, n);
            expect(isDrivable(L, x, z), `${name} hint at ${x.toFixed(1)},${z.toFixed(1)}`).toBe(true);
          }
        }
      }
      const ids = new Set(L.markers.map((m) => m.id));
      // Each drive's route line reaches the marker where it finishes, on the correct side of the road.
      const reaches = (hint: Array<[number, number]> | undefined, id: string, what: string) => {
        const mk = L.markers.find((m) => m.id === id);
        if (!hint?.length || !mk) return;
        let best = Infinity;
        for (let i = 1; i < hint.length; i++) {
          const [ax, az] = hint[i - 1];
          const [bx, bz] = hint[i];
          const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
          for (let k = 0; k <= n; k++) {
            const x = ax + ((bx - ax) * k) / n;
            const z = az + ((bz - az) * k) / n;
            best = Math.min(best, Math.hypot(Math.max(mk.x0 - x, 0, x - mk.x1), Math.max(mk.z0 - z, 0, z - mk.z1)));
          }
        }
        expect(best, `${what} route line doesn't reach marker ${id}`).toBeLessThan(1.5);
      };
      if (!lesson.test.manoeuvre) reaches(lesson.test.hint, lesson.test.finishMarker, 'test');
      const lastStop = [...(lesson.guided?.steps ?? [])].reverse().find((st) => /^stoppedAt\./.test(st.await));
      if (lastStop) reaches(lesson.guided?.hint, lastStop.await.split('.')[1], 'guided');
      expect(ids.has(lesson.test.finishMarker), 'finish marker').toBe(true);
      for (const s of lesson.guided?.steps ?? []) {
        const m = /^(zone|stoppedAt|marker|parkedIn)\.(.+)$/.exec(s.await);
        if (m) expect(ids.has(m[2]), s.await).toBe(true);
        const ln = /^line\.(.+)$/.exec(s.await);
        if (ln) expect(L.stopLines?.some((l) => l.id === ln[1]), s.await).toBe(true);
        const r = /^rb(Enter|Exit)\.(.+)$/.exec(s.await);
        if (r) expect(L.roundabouts?.some((rb) => rb.id === r[2]), s.await).toBe(true);
      }
    });
  }
});
