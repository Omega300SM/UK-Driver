import type { AiPath, Obstacle, SceneLayout } from '../world/layout';
import { inRect, isDrivable, speedLimitAt } from '../world/layout';
import type { ScriptedCar, TrafficLevel } from '../content/schema';
import { MPH_PER_MPS } from '../rules/types';

export interface AiCar {
  id: number;
  x: number;
  z: number;
  heading: number;
  speed: number;
  /** The speed it would be doing if nothing were in the way (for gap judgements). */
  cruise: number;
  colour: number;
  /** Main-road loopers wrap around; scripted cars drive once then leave. */
  looping: boolean;
  /** Lateral line it follows (z for ±x travel, x for ±z travel). */
  lane: number;
  waiting: boolean;
  braking: number;
  /** How far it has pulled out towards the centre to pass something (m). */
  offset: number;
  /** Path-following cars (scenes with aiPaths): current path and distance along it. */
  path?: AiPath;
  s?: number;
  /** Removed at the next update (reached the edge of the map). */
  done?: boolean;
}

export interface PlayerShape {
  x: number;
  z: number;
  heading: number;
  speed: number;
  corners: Array<[number, number]>;
}

const COLOURS = [0x2e5c8a, 0xb8352f, 0xe8e4da, 0x3c3f44, 0x6b8f3a, 0xd9a22e, 0x7a4f9a, 0x9aa3ab, 0x1c1c1c, 0xc9c2b0];
const LEN = 4.2;
const WID = 1.8;
const X_MIN = -415;
const X_MAX = 255;

/**
 * Simple, polite AI traffic: cars follow a lane, keep their distance from
 * whatever is ahead (other cars, parked cars or you), and never deliberately
 * hit you. Good enough to teach gaps, meeting and junction priority.
 */
export class Traffic {
  cars: AiCar[] = [];
  private nextId = 1;
  private pending: ScriptedCar[];
  private rnd: () => number = Math.random;
  /** Number of path cars to keep on the map. */
  private target = 0;

  constructor(
    private layout: SceneLayout,
    level: TrafficLevel,
    scripted: ScriptedCar[] = [],
    seed = 3
  ) {
    this.pending = [...scripted];
    const n = level === 'busy' ? 7 : level === 'light' ? 4 : 0;
    let s = seed;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    this.rnd = rnd;
    if (layout.aiPaths?.length) {
      // Path-following traffic: spread cars over the non-roundabout paths.
      this.target = n * 2;
      const straight = layout.aiPaths.filter((p) => !p.yieldTo);
      for (let i = 0; i < this.target; i++) {
        const p = straight[Math.floor(rnd() * straight.length)];
        const len = pathLength(p);
        this.addOnPath(p, len * (0.15 + rnd() * 0.6));
      }
      return;
    }
    const span = X_MAX - X_MIN;
    for (let i = 0; i < n; i++) {
      // Eastbound in the z < 0 lane, westbound in the z > 0 lane.
      this.add({ x: X_MIN + ((i + rnd() * 0.5) / n) * span, z: -1.9, heading: Math.PI / 2, speed: 8, looping: true });
      this.add({ x: X_MIN + ((i + 0.5 + rnd() * 0.5) / n) * span, z: 1.9, heading: -Math.PI / 2, speed: 8, looping: true });
    }
  }

  private add(o: { x: number; z: number; heading: number; speed: number; looping: boolean; colour?: number }): AiCar {
    const alongX = Math.abs(Math.sin(o.heading)) > 0.7;
    const car: AiCar = {
      id: this.nextId++,
      x: o.x,
      z: o.z,
      heading: o.heading,
      speed: o.speed,
      cruise: o.speed,
      colour: o.colour ?? COLOURS[this.nextId % COLOURS.length],
      looping: o.looping,
      lane: alongX ? o.z : o.x,
      waiting: false,
      braking: 0,
      offset: 0
    };
    this.cars.push(car);
    return car;
  }

  private addOnPath(path: AiPath, s0 = 0, colour?: number): AiCar | null {
    const pos = pointAt(path, s0);
    // Don't spawn on top of anything.
    if (this.cars.some((o) => Math.hypot(o.x - pos.x, o.z - pos.z) < 10)) return null;
    const car = this.add({ x: pos.x, z: pos.z, heading: pos.heading, speed: 6, looping: true, colour });
    car.path = path;
    car.s = s0;
    return car;
  }

  update(dt: number, player: PlayerShape): void {
    // Release scripted cars when the player reaches their trigger area.
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      if (inRect(p.when, player.x, player.z)) {
        this.add({ ...p.from, speed: p.speed, looping: false, colour: p.colour });
        this.pending.splice(i, 1);
      }
    }
    for (const c of this.cars) {
      if (c.path) this.stepPath(c, dt, player);
      else this.step(c, dt, player);
    }
    this.cars = this.cars.filter((c) => !c.done && (c.looping || this.onRoad(c)));
    // Keep the map populated: new cars appear at the edges.
    if (this.target && this.layout.aiPaths && this.cars.filter((c) => c.path).length < this.target && this.rnd() < dt * 0.8) {
      const spawns = this.layout.aiPaths.filter((p) => p.spawn);
      const p = spawns[Math.floor(this.rnd() * spawns.length)];
      const start = p.points[0];
      if (Math.hypot(start[0] - player.x, start[1] - player.z) > 40) this.addOnPath(p, 0);
    }
  }

  /** Path-following car: follow, give way at roundabout entries, pick a route at each node. */
  private stepPath(c: AiCar, dt: number, player: PlayerShape): void {
    const path = c.path!;
    const fx = Math.sin(c.heading);
    const fz = Math.cos(c.heading);
    const limit = speedLimitAt(this.layout, c.x, c.z) / MPH_PER_MPS;
    const rb = path.yieldTo ? this.layout.roundabouts?.find((r) => r.id === path.yieldTo) : undefined;
    c.cruise = Math.min(limit * 0.85, 15, rb ? (rb.mini ? 5 : 7.5) : Infinity);

    // Gap to whatever is ahead (cars or the player), measured along our own
    // path so it works on curves and roundabouts.
    let gap = Infinity;
    for (const o of this.cars) {
      if (o === c || Math.hypot(o.x - c.x, o.z - c.z) > 32) continue;
      const d = this.distAlong(c, o.x, o.z, 1.7, 30);
      if (d < Infinity) gap = Math.min(gap, d - LEN);
    }
    for (const [px, pz] of player.corners) {
      if (Math.hypot(px - c.x, pz - c.z) > 32) continue;
      const d = this.distAlong(c, px, pz, 1.3, 30);
      if (d < Infinity) gap = Math.min(gap, d - LEN / 2);
    }
    void fx;
    void fz;

    // Give way at a roundabout entry (rule 185): wait if anyone will reach the merge point soon.
    c.waiting = false;
    if (rb && (c.s ?? 0) < 1.0) {
      const merge = pointAt(path, Math.min(6, pathLength(path) / 3));
      let clash = false;
      for (const o of this.cars) {
        if (o === c) continue;
        if (Math.hypot(o.x - merge.x, o.z - merge.z) < 7) clash = true;
        else if (o.speed > 0.2 && this.pathTimeTo(o, merge.x, merge.z, 3) < 3) clash = true;
      }
      const pd = Math.hypot(player.x - merge.x, player.z - merge.z);
      if (pd < 7) clash = true;
      else {
        const pfx = Math.sin(player.heading);
        const pfz = Math.cos(player.heading);
        const along = (merge.x - player.x) * pfx + (merge.z - player.z) * pfz;
        const across = Math.abs((merge.x - player.x) * pfz - (merge.z - player.z) * pfx);
        const onRb = Math.hypot(player.x - rb.x, player.z - rb.z) < rb.outer + 2;
        if (onRb && along > 0 && across < 4 && along / Math.max(Math.abs(player.speed), 2) < 3) clash = true;
      }
      if (clash) {
        c.waiting = true;
        gap = Math.min(gap, Math.max(0, 0.3 - (c.s ?? 0)));
      }
    }

    let target = c.cruise;
    if (gap < 25) target = Math.min(target, Math.max(0, (gap - 2) * 0.8));
    if (gap < 2.5) target = 0;
    // Slow for the roundabout ahead (approach paths end at a give way line).
    const remaining = pathLength(path) - (c.s ?? 0);
    if (!rb && remaining < 25 && this.nextPaths(path).some((p) => p.yieldTo)) target = Math.min(target, 4 + remaining * 0.3);
    const prev = c.speed;
    const a = target > c.speed ? 2.2 : -6.5;
    c.speed = Math.max(0, a > 0 ? Math.min(target, c.speed + a * dt) : Math.max(target, c.speed + a * dt));
    c.braking = Math.max(0, (prev - c.speed) / dt);

    // Advance along the path, moving onto the next one at the end.
    c.s = (c.s ?? 0) + c.speed * dt;
    const len = pathLength(path);
    if (c.s >= len) {
      const options = this.nextPaths(path);
      if (!options.length) {
        c.done = true;
        return;
      }
      c.path = options[Math.floor(this.rnd() * options.length)];
      c.s = c.s - len;
    }
    const pos = pointAt(c.path!, c.s);
    c.x = pos.x;
    c.z = pos.z;
    c.heading = pos.heading;
  }

  private nextCache = new Map<string, AiPath[]>();
  private nextPaths(p: AiPath): AiPath[] {
    const hit = this.nextCache.get(p.id);
    if (hit) return hit;
    const end = p.points[p.points.length - 1];
    const out = (this.layout.aiPaths ?? []).filter((q) => q !== p && Math.hypot(q.points[0][0] - end[0], q.points[0][1] - end[1]) < 1.6);
    this.nextCache.set(p.id, out);
    return out;
  }

  /** Distance along a car's path (this and the next, if unambiguous) to a point within `tol` m of it. */
  private distAlong(c: AiCar, x: number, z: number, tol: number, horizon: number): number {
    let path = c.path!;
    let s = c.s ?? 0;
    let travelled = 0;
    for (let hops = 0; hops < 2 && travelled < horizon; hops++) {
      const len = pathLength(path);
      for (let d = s + 0.5; d <= len && travelled + (d - s) < horizon; d += 1.2) {
        const p = pointAt(path, d);
        if (Math.hypot(p.x - x, p.z - z) < tol) return travelled + (d - s);
      }
      travelled += len - s;
      const next = this.nextPaths(path);
      if (!next.length) break;
      // Look along the most likely continuation (the first option).
      path = next[0];
      s = 0;
    }
    return Infinity;
  }

  /** Seconds until a path car would reach a point (within `tol` m of its path), at its normal speed. */
  pathTimeTo(c: AiCar, x: number, z: number, tol = 1.9, horizon = 90): number {
    if (!c.path) return Infinity;
    let path = c.path;
    let s = c.s ?? 0;
    let travelled = 0;
    const v = Math.max(c.cruise, c.speed, 0.5);
    for (let hops = 0; hops < 3 && travelled < horizon; hops++) {
      const len = pathLength(path);
      for (let d = s; d <= len && travelled + (d - s) < horizon; d += 1.5) {
        const p = pointAt(path, d);
        if (Math.hypot(p.x - x, p.z - z) < tol) return Math.max(0, travelled + (d - s) - LEN / 2) / v;
      }
      travelled += len - s;
      const next = this.nextPaths(path);
      if (next.length !== 1) break; // unknown route beyond a choice point
      path = next[0];
      s = 0;
    }
    return Infinity;
  }

  private onRoad(c: AiCar): boolean {
    return isDrivable(this.layout, c.x, c.z);
  }

  private step(c: AiCar, dt: number, player: PlayerShape): void {
    const fx = Math.sin(c.heading);
    const fz = Math.cos(c.heading);
    const rx = -Math.cos(c.heading); // towards the centre of the road (our right)
    const rz = Math.sin(c.heading);
    const alongX = Math.abs(fx) > 0.7;
    const limit = speedLimitAt(this.layout, c.x, c.z) / MPH_PER_MPS;
    c.cruise = Math.min(limit * 0.88, 17);

    // Lane line we normally follow (without any passing offset).
    const laneX = alongX ? c.x : c.lane;
    const laneZ = alongX ? c.lane : c.z;
    const rel = (px: number, pz: number) => {
      const dx = px - laneX;
      const dz = pz - laneZ;
      return { along: (px - c.x) * fx + (pz - c.z) * fz, lat: dx * rx + dz * rz };
    };

    // Things in our lane ahead: moving ones we follow, stationary ones we may pass.
    let followGap = Infinity;
    let stationaryAt = Infinity;
    for (const o of this.cars) {
      if (o === c) continue;
      const r = rel(o.x, o.z);
      if (r.along > 0 && Math.abs(r.lat - c.offset) < 1.8) followGap = Math.min(followGap, r.along - LEN);
    }
    const pr = rel(player.x, player.z);
    const playerHeadOn = Math.cos(player.heading - c.heading) < -0.5;
    const playerStopped = Math.abs(player.speed) < 0.3;
    // A car coming towards us and moving into our lane: give it a little more room.
    // (A car waiting just left of the centre line to turn right is not in our way.)
    const band = playerHeadOn && !playerStopped ? 2.4 : 1.9;
    const playerInLane = Math.abs(pr.lat) < band && pr.along > -LEN;
    if (playerInLane && pr.along > 0) {
      if (playerStopped && !playerHeadOn && Math.abs(pr.lat) > 0.4) stationaryAt = Math.min(stationaryAt, pr.along - LEN);
      else if (Math.abs(pr.lat - c.offset) < band + 0.1) followGap = Math.min(followGap, pr.along - LEN - (playerHeadOn ? 4 : 0));
    }
    for (const o of this.layout.obstacles) {
      if (o.kind !== 'car' && o.kind !== 'van') continue;
      const r = rel((o.x0 + o.x1) / 2, (o.z0 + o.z1) / 2);
      if (r.along > -LEN && r.along < 45 && Math.abs(r.lat) < 1.9) stationaryAt = Math.min(stationaryAt, r.along - LEN);
    }

    // Queue behind anything stopped in our lane (don't jump a queue to pass parked cars).
    const queueing = followGap < 12 && c.offset < 0.5;
    // Pass a stationary obstruction only if nothing is coming the other way (rule 163).
    c.waiting = false;
    let wantOffset = 0;
    if (stationaryAt < 18 && !queueing) {
      let oncomingClear = true;
      for (const o of this.cars) {
        if (o === c || Math.cos(o.heading - c.heading) > -0.5) continue;
        const r = rel(o.x, o.z);
        if (r.along > -5 && r.along < 75 && Math.abs(r.lat) < 6) oncomingClear = false;
      }
      const playerOncoming = Math.cos(player.heading - c.heading) < -0.5 && pr.along > -5 && pr.along < 75 && Math.abs(pr.lat) < 6;
      if (playerOncoming && !playerStopped) oncomingClear = false;
      if (oncomingClear || c.offset > 1.5) wantOffset = 2.5;
      else {
        c.waiting = true;
        followGap = Math.min(followGap, stationaryAt - 3);
      }
    }
    const step = 1.8 * dt;
    c.offset += Math.max(-step, Math.min(step, wantOffset - c.offset));
    // While pulled out, don't brake for the thing we're passing.
    if (wantOffset > 0 && c.offset < 2.0) followGap = Math.min(followGap, stationaryAt - 1);

    let target = c.cruise;
    if (c.offset > 0.3) target = Math.min(target, 6);
    if (followGap < 25) target = Math.min(target, Math.max(0, (followGap - 2) * 0.7));
    if (followGap < 2.5) target = 0;
    const a = target > c.speed ? 2.0 : -6.5;
    const prev = c.speed;
    c.speed = Math.max(0, a > 0 ? Math.min(target, c.speed + a * dt) : Math.max(target, c.speed + a * dt));
    c.braking = Math.max(0, (prev - c.speed) / dt);

    c.x += fx * c.speed * dt;
    c.z += fz * c.speed * dt;
    // Apply the lateral offset relative to the lane line.
    if (alongX) c.z = c.lane + rz * c.offset;
    else c.x = c.lane + rx * c.offset;
    if (c.looping) {
      if (fx > 0 && c.x > X_MAX) this.respawn(c, X_MIN);
      if (fx < 0 && c.x < X_MIN) this.respawn(c, X_MAX);
    }
  }

  private respawn(c: AiCar, x: number): void {
    const clear = this.cars.every((o) => o === c || Math.abs(o.x - x) > 25 || Math.abs(o.z - c.z) > 1);
    if (!clear) return;
    c.x = x;
    c.speed = c.cruise * 0.8;
  }

  /** AI cars as obstacles for the player's collision checks. */
  obstacles(): Obstacle[] {
    return this.cars.map((c) => {
      if (c.path) {
        const fx = Math.sin(c.heading);
        const fz = Math.cos(c.heading);
        const ex = Math.abs(fx) * (LEN / 2) + Math.abs(fz) * (WID / 2);
        const ez = Math.abs(fz) * (LEN / 2) + Math.abs(fx) * (WID / 2);
        return { kind: 'car' as const, x0: c.x - ex * 0.9, x1: c.x + ex * 0.9, z0: c.z - ez * 0.9, z1: c.z + ez * 0.9 };
      }
      const alongX = Math.abs(Math.sin(c.heading)) > 0.7;
      const hl = LEN / 2;
      const hw = WID / 2;
      return alongX
        ? { kind: 'car', x0: c.x - hl, x1: c.x + hl, z0: c.z - hw, z1: c.z + hw }
        : { kind: 'car', x0: c.x - hw, x1: c.x + hw, z0: c.z - hl, z1: c.z + hl };
    });
  }

  /**
   * Seconds until the nearest AI car in the lane through (x, z) would reach it
   * at its normal speed. Infinity if nothing is coming.
   */
  timeToReach(x: number, z: number): number {
    let best = Infinity;
    for (const c of this.cars) {
      if (c.path) {
        best = Math.min(best, this.pathTimeTo(c, x, z));
        continue;
      }
      const fx = Math.sin(c.heading);
      const fz = Math.cos(c.heading);
      const along = (x - c.x) * fx + (z - c.z) * fz;
      // Measure across from the car's lane line, so a car briefly pulled out
      // round a parked car still counts as coming down its lane.
      const across = Math.abs(fx) > 0.7 ? Math.abs(z - c.lane) : Math.abs(x - c.lane);
      if (along > -1 && along < 130 && across < 1.9) {
        const v = Math.max(c.cruise, c.speed, 0.5);
        best = Math.min(best, Math.max(0, along - LEN) / v);
      }
    }
    return best;
  }

  /** Nearest oncoming car (metres) heading towards a player at (x, z) with this heading. */
  oncoming(x: number, z: number, heading: number): number | null {
    let best: number | null = null;
    const fx = Math.sin(heading);
    const fz = Math.cos(heading);
    for (const c of this.cars) {
      if (Math.cos(c.heading - heading) > -0.5) continue;
      const dx = c.x - x;
      const dz = c.z - z;
      const along = dx * fx + dz * fz;
      const across = Math.abs(dx * fz - dz * fx);
      if (along > 0 && across < 6) best = best === null ? along : Math.min(best, along);
    }
    return best;
  }
}

// ---- Path helpers -------------------------------------------------------------
const lenCache = new WeakMap<AiPath, number>();
export function pathLength(p: AiPath): number {
  const hit = lenCache.get(p);
  if (hit !== undefined) return hit;
  let L = 0;
  for (let i = 1; i < p.points.length; i++) L += Math.hypot(p.points[i][0] - p.points[i - 1][0], p.points[i][1] - p.points[i - 1][1]);
  lenCache.set(p, L);
  return L;
}

/** Position and heading at distance s along a path. */
export function pointAt(p: AiPath, s: number): { x: number; z: number; heading: number } {
  let rem = Math.max(0, s);
  for (let i = 1; i < p.points.length; i++) {
    const [ax, az] = p.points[i - 1];
    const [bx, bz] = p.points[i];
    const seg = Math.hypot(bx - ax, bz - az);
    if (rem <= seg || i === p.points.length - 1) {
      const k = seg ? Math.min(1, rem / seg) : 0;
      return { x: ax + (bx - ax) * k, z: az + (bz - az) * k, heading: Math.atan2(bx - ax, bz - az) };
    }
    rem -= seg;
  }
  const [x, z] = p.points[0];
  return { x, z, heading: 0 };
}
