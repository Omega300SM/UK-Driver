import { describe, it, expect } from 'vitest';
import { DEVON, OKEMENT, CARRIAGEWAYS, nbLane } from '../../src/world/scenes/devonLayout';
import { Traffic, pathLength, pointAt } from '../../src/sim/traffic';
import { isDrivable, carriagewayAt, laneNumber, laneCentre, speedLimitAt } from '../../src/world/layout';

const at = (x: number, z: number) => ({ x, z, heading: 0, speed: 0, corners: [] as Array<[number, number]> });

describe('Devon Run geometry', () => {
  it('every AI path stays on drivable road', () => {
    for (const p of DEVON.aiPaths!) {
      const len = pathLength(p);
      for (let s = 0; s <= len; s += 2) {
        const q = pointAt(p, s);
        expect(isDrivable(DEVON, q.x, q.z), `${p.id} at ${q.x.toFixed(1)},${q.z.toFixed(1)}`).toBe(true);
      }
    }
  });

  it('lane numbers: lane 1 is on the left of the direction of travel', () => {
    const nb = CARRIAGEWAYS.find((c) => c.id === 'm5-nb')!;
    expect(laneNumber(nb, nbLane(1))).toBe(1);
    expect(laneNumber(nb, nbLane(2))).toBe(2);
    expect(laneCentre(nb, 1)).toBeCloseTo(nbLane(1));
    const sb = CARRIAGEWAYS.find((c) => c.id === 'm5-sb')!;
    expect(laneNumber(sb, sb.x0 + 1)).toBe(1);
    expect(carriagewayAt(DEVON, nbLane(1), 4000)?.id).toBe('m5-nb');
  });

  it('speed limits: 60 on the A386, 70 on the dual carriageway and motorway, variable on the smart section', () => {
    expect(speedLimitAt(DEVON, 402, 1000)).toBe(60);
    expect(speedLimitAt(DEVON, 405, 3000)).toBe(70);
    expect(speedLimitAt(DEVON, 405, 6200)).toBe(60);
    expect(speedLimitAt(DEVON, 405, 6900)).toBe(50);
    expect(speedLimitAt(DEVON, 800, -60)).toBe(30);
  });

  it('roundabout island is not drivable; its ring is', () => {
    expect(isDrivable(DEVON, OKEMENT.x, OKEMENT.z)).toBe(false);
    expect(isDrivable(DEVON, OKEMENT.x + 18, OKEMENT.z)).toBe(true);
  });
});

describe('Devon Run traffic', () => {
  it('keeps traffic around the player, at realistic speeds, without overlaps', () => {
    const player = at(nbLane(1), 4500);
    const tr = new Traffic(DEVON, 'busy', [], 3, player);
    let overlaps = 0;
    let maxSpeed = 0;
    for (let i = 0; i < 90 * 30; i++) {
      tr.update(1 / 30, player);
      for (const c of tr.cars) maxSpeed = Math.max(maxSpeed, c.speed);
      if (i % 15) continue;
      for (let a = 0; a < tr.cars.length; a++)
        for (let b = a + 1; b < tr.cars.length; b++) {
          const A = tr.cars[a];
          const B = tr.cars[b];
          if (Math.abs(A.x - B.x) < 2 && Math.abs(A.z - B.z) < 5) overlaps++;
        }
    }
    expect(overlaps).toBe(0);
    expect(tr.cars.length).toBeGreaterThan(5);
    expect(tr.cars.every((c) => Math.hypot(c.x - player.x, c.z - player.z) < 700)).toBe(true);
    expect(maxSpeed).toBeGreaterThan(25); // ~60 mph on the motorway
    expect(maxSpeed).toBeLessThanOrEqual(31.3 + 0.1); // never above 70 mph
  });
});
