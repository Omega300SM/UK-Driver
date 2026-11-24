import { describe, it, expect } from 'vitest';
import { getLesson, CURRICULUM } from '../../src/content/curriculum';
import { isDrivable, type SceneLayout } from '../../src/world/layout';
import { MILL_TOWN } from '../../src/world/scenes/millTownLayout';
import { TOWN } from '../../src/world/scenes/townLayout';

const SCENES: Record<string, SceneLayout | undefined> = { millTown: MILL_TOWN, town: TOWN };

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
