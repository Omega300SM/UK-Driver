import { describe, it, expect } from 'vitest';
import { MILL_TOWN, R1, R2, M1, roundaboutPath } from '../../src/world/scenes/millTownLayout';
import { Traffic, pathLength, pointAt } from '../../src/sim/traffic';
import { isDrivable, circulationHeading, polarAngle } from '../../src/world/layout';
import { angleDiff } from '../../src/rules/checks';

const farAway = { x: -1000, z: -1000, heading: 0, speed: 0, corners: [] as Array<[number, number]> };

describe('Mill Town geometry', () => {
  it('every AI path stays on drivable road', () => {
    for (const p of MILL_TOWN.aiPaths!) {
      const len = pathLength(p);
      for (let s = 0; s <= len; s += 1) {
        const q = pointAt(p, s);
        expect(isDrivable(MILL_TOWN, q.x, q.z), `${p.id} at ${q.x.toFixed(1)},${q.z.toFixed(1)}`).toBe(true);
      }
    }
  });

  it('roundabout paths circulate clockwise (island on the right)', () => {
    for (const rb of [R1, R2, M1]) {
      const pts = roundaboutPath(rb, rb.arms[0].angle, rb.arms[rb.arms.length - 1].angle);
      for (let i = 2; i < pts.length - 2; i++) {
        const [ax, az] = pts[i];
        const [bx, bz] = pts[i + 1];
        const h = Math.atan2(bx - ax, bz - az);
        const expected = circulationHeading(rb, (ax + bx) / 2, (az + bz) / 2);
        expect(Math.abs(angleDiff(h, expected)), `${rb.id} segment ${i}`).toBeLessThan(0.35);
      }
    }
  });

  it('islands are not drivable but mini-roundabout centres are (painted)', () => {
    expect(isDrivable(MILL_TOWN, R1.x, R1.z)).toBe(false);
    expect(isDrivable(MILL_TOWN, R2.x + 5, R2.z)).toBe(false);
    expect(isDrivable(MILL_TOWN, M1.x, M1.z)).toBe(true);
  });

  it('every path joins another, except where traffic leaves the map', () => {
    const ps = MILL_TOWN.aiPaths!;
    const dead = ps.filter((p) => {
      const e = p.points[p.points.length - 1];
      return !ps.some((q) => q !== p && Math.hypot(q.points[0][0] - e[0], q.points[0][1] - e[1]) < 1.6);
    });
    for (const p of dead) {
      const e = p.points[p.points.length - 1];
      const edge = Math.abs(e[0]) >= 245 || e[0] >= 295 || e[1] <= -105 || e[0] <= -115;
      expect(edge, `${p.id} ends at ${e}`).toBe(true);
    }
  });
});

describe('Mill Town AI traffic', () => {
  it('flows for two minutes without overlapping or gridlocking, and uses the roundabouts', () => {
    const tr = new Traffic(MILL_TOWN, 'busy');
    let overlaps = 0;
    let visitedRb = 0;
    const moved = new Map<number, number>();
    for (let i = 0; i < 120 * 30; i++) {
      tr.update(1 / 30, farAway);
      for (const c of tr.cars) {
        moved.set(c.id, (moved.get(c.id) ?? 0) + c.speed / 30);
        if (c.path?.yieldTo) visitedRb++;
      }
      if (i % 15 === 0) {
        for (let a = 0; a < tr.cars.length; a++)
          for (let b = a + 1; b < tr.cars.length; b++) {
            const A = tr.cars[a];
            const B = tr.cars[b];
            if (Math.hypot(A.x - B.x, A.z - B.z) < 2.6) overlaps++;
          }
      }
    }
    expect(overlaps).toBe(0);
    expect(visitedRb).toBeGreaterThan(100);
    // Most cars kept moving (no gridlock).
    const still = tr.cars.filter((c) => c.speed < 0.1 && !c.waiting).length;
    expect(still).toBeLessThan(tr.cars.length / 2);
    expect(tr.cars.length).toBeGreaterThan(6);
  });

  it('a car about to join a roundabout gives way to a car already on it', () => {
    const tr = new Traffic(MILL_TOWN, 'none');
    const join = MILL_TOWN.aiPaths!.find((p) => p.yieldTo === 'R1' && Math.abs(p.points[0][1] - -18) < 1 && p.points[0][0] > 0)!; // from the south arm
    const circ = MILL_TOWN.aiPaths!.find((p) => p.yieldTo === 'R1' && p.points[0][0] < -15)!; // from the west arm, passing the south entry
    // Car on the roundabout, a little before the south entry.
    (tr as any).addOnPath(circ, 4);
    const waiting = (tr as any).addOnPath(join, 0);
    tr.cars[0].speed = 7;
    tr.update(1 / 30, farAway);
    expect(waiting.waiting).toBe(true);
    expect(polarAngle(R1, waiting.x, waiting.z)).toBeDefined();
  });
});
