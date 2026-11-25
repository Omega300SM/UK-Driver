import type { AiPath, Obstacle, SceneLayout } from '../world/layout';
import { inRect, isDrivable, speedLimitAt } from '../world/layout';
import type { RoadUserKind, ScriptedCar, TrafficLevel } from '../content/schema';
import { MPH_PER_MPS } from '../rules/types';
import type { StreetControl } from './street';

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
  /** Car (default), cyclist or horse rider. */
  kind?: RoadUserKind;
  /** When it arrived at the give way it's waiting at (first come, first served). */
  waitSince?: number;
  /** Fraction of the speed limit it likes to drive at (fast roads). */
  pace?: number;
  /** Never faster than this (cyclists, horses). */
  maxSpeed?: number;
}

/** Footprint (length, width) of each kind of road user, in metres. */
export const ROAD_USER_SIZE: Record<RoadUserKind, { len: number; wid: number }> = {
  car: { len: 4.2, wid: 1.8 },
  bike: { len: 1.8, wid: 0.6 },
  horse: { len: 2.6, wid: 0.9 },
  lorry: { len: 12, wid: 2.5 },
  tractor: { len: 5.5, wid: 2.3 }
};
const sizeOf = (c: AiCar) => ROAD_USER_SIZE[c.kind ?? 'car'];
/** Speeds above this (m/s, 30 mph) count as a fast road: time-gap following, no town speed cap. */
const FAST = 13.5;

export interface PlayerShape {
  x: number;
  z: number;
  heading: number;
  speed: number;
  corners: Array<[number, number]>;
}

const COLOURS = [0x2e5c8a, 0xb8352f, 0xe8e4da, 0x3c3f44, 0x6b8f3a, 0xd9a22e, 0x7a4f9a, 0x9aa3ab, 0x1c1c1c, 0xc9c2b0];
const LEN = 4.2;
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
  /** Signals and crossings, when the scene has them. */
  street: StreetControl | null = null;
  private clock = 0;

  constructor(
    private layout: SceneLayout,
    level: TrafficLevel,
    scripted: ScriptedCar[] = [],
    seed = 3,
    near?: { x: number; z: number }
  ) {
    this.pending = [...scripted];
    const n = level === 'busy' ? 7 : level === 'light' ? 4 : 0;
    let s = seed;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    this.rnd = rnd;
    if (layout.aiPaths?.length && layout.aiNearPlayer) {
      // Long maps: populate the roads around the player.
      this.target = n * 2;
      const at = near ?? layout.start;
      for (let i = 0; i < this.target * 4 && this.cars.length < this.target; i++) this.spawnNear(at, 60, 500);
      return;
    }
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

  private add(o: { x: number; z: number; heading: number; speed: number; looping: boolean; colour?: number; kind?: RoadUserKind }): AiCar {
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
      offset: 0,
      kind: o.kind ?? 'car',
      maxSpeed: o.kind && o.kind !== 'car' ? o.speed : undefined
    };
    this.cars.push(car);
    return car;
  }

  private addOnPath(path: AiPath, s0 = 0, colour?: number): AiCar | null {
    const pos = pointAt(path, s0);
    // Don't spawn on top of anything.
    if (this.cars.some((o) => Math.hypot(o.x - pos.x, o.z - pos.z) < (this.layout.aiNearPlayer ? 30 : 10))) return null;
    const lorry = !!path.heavy && this.rnd() < 0.3;
    const limit = speedLimitAt(this.layout, pos.x, pos.z) / MPH_PER_MPS;
    const car = this.add({ x: pos.x, z: pos.z, heading: pos.heading, speed: limit > FAST ? limit * 0.8 : 6, looping: true, colour, kind: lorry ? 'lorry' : 'car' });
    car.maxSpeed = undefined;
    // Only the long fast-road maps vary pace (town maps keep their random sequence, and so their traffic).
    if (this.layout.aiNearPlayer) car.pace = lorry ? 0.76 : 0.84 + this.rnd() * 0.14;
    car.path = path;
    car.s = s0;
    return car;
  }

  /** Long maps: add a car on a random path somewhere between rMin and rMax metres from a point. */
  private spawnNear(p: { x: number; z: number }, rMin: number, rMax: number): void {
    const paths = (this.layout.aiPaths ?? []).filter((q) => !q.yieldTo);
    for (let tries = 0; tries < 12; tries++) {
      const q = paths[Math.floor(this.rnd() * paths.length)];
      const len = pathLength(q);
      const s0 = this.rnd() * len;
      const pos = pointAt(q, s0);
      const d = Math.hypot(pos.x - p.x, pos.z - p.z);
      if (d < rMin || d > rMax) continue;
      if (this.addOnPath(q, s0)) return;
    }
  }

  update(dt: number, player: PlayerShape): void {
    this.clock += dt;
    // Release scripted cars when the player reaches their trigger area.
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      if (inRect(p.when, player.x, player.z)) {
        this.add({ ...p.from, speed: p.speed, looping: false, colour: p.colour, kind: p.kind });
        this.pending.splice(i, 1);
      }
    }
    for (const c of this.cars) {
      if (c.path) this.stepPath(c, dt, player);
      else this.step(c, dt, player);
    }
    this.cars = this.cars.filter((c) => !c.done && (c.looping || this.onRoad(c)));
    if (this.layout.aiNearPlayer) {
      // Keep traffic around the player: drop cars far away, add new ones out of sight.
      this.cars = this.cars.filter((c) => !c.path || Math.hypot(c.x - player.x, c.z - player.z) < 700);
      if (this.cars.filter((c) => c.path).length < this.target && this.rnd() < dt * 3) this.spawnNear(player, 250, 550);
      return;
    }
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
    // Fast-road behaviour (time-gap following, no town cap) only on the long fast-road maps.
    const fast = limit > FAST && !!this.layout.aiNearPlayer;
    c.cruise = Math.min(limit * (c.pace ?? 0.85), fast ? Infinity : 15, rb ? (rb.mini ? 5 : 7.5) : Infinity);

    // Gap to whatever is ahead (cars or the player), measured along our own
    // path so it works on curves and roundabouts.
    let gap = Infinity;
    const look = fast ? Math.max(32, c.speed * 4) : 32;
    for (const o of this.cars) {
      if (o === c || Math.hypot(o.x - c.x, o.z - c.z) > look + sizeOf(o).len) continue;
      const d = this.distAlong(c, o.x, o.z, 1.7, look);
      if (d < Infinity) gap = Math.min(gap, d - (sizeOf(o).len + sizeOf(c).len) / 2);
    }
    for (const [px, pz] of player.corners) {
      if (Math.hypot(px - c.x, pz - c.z) > look) continue;
      const d = this.distAlong(c, px, pz, 1.3, look);
      if (d < Infinity) gap = Math.min(gap, d - sizeOf(c).len / 2);
    }
    void fx;
    void fz;

    // Traffic lights and crossings: stop at the line when told to.
    if (this.street) {
      for (const { line, along } of this.street.linesAhead(c, 40)) {
        const front = along - LEN / 2;
        if (front < -0.5) continue;
        if (this.street.mustStop(line, front, c.speed)) {
          gap = Math.min(gap, Math.max(0, front - 0.6));
          break;
        }
      }
    }

    // Give way at a roundabout entry (rule 185) or when joining a main road: wait if anyone will reach the merge point soon.
    c.waiting = false;
    // Checked until the car is right at the line (a braking car may roll a little past the start).
    if ((rb || path.giveWay) && (c.s ?? 0) < 1.8) {
      // Where we join the circulating traffic: the first point on the ring (or a few metres into a junction).
      const merge = rb ? { x: path.points[1][0], z: path.points[1][1] } : pointAt(path, Math.min(6, pathLength(path) / 3));
      // On a big roundabout the way in also crosses the outer lane: check every point we cross on the ring.
      const crossPts = [merge];
      if (rb) {
        const [ax, az] = path.points[0];
        const len = Math.hypot(merge.x - ax, merge.z - az);
        for (let d = 2; d < len; d += 2) {
          const x = ax + ((merge.x - ax) * d) / len;
          const z = az + ((merge.z - az) * d) / len;
          if (Math.hypot(x - rb.x, z - rb.z) <= rb.outer) crossPts.push({ x, z });
        }
      }
      let clash = false;
      if (c.speed < 0.5 && c.waitSince === undefined) c.waitSince = this.clock;
      for (const o of this.cars) {
        if (o === c) continue;
        if (Math.hypot(o.x - merge.x, o.z - merge.z) < 7) clash = true;
        for (const m of crossPts) {
          if (clash) break;
          if (o.speed > 0.2 && this.pathTimeTo(o, m.x, m.z, 3) < 3) clash = true;
          // Someone who got to their own give way line first, and whose route crosses ours, goes first.
          else if (o.speed <= 0.2 && o.waitSince !== undefined && o.waitSince < (c.waitSince ?? Infinity) && this.pathTimeTo(o, m.x, m.z, 3) < 4) clash = true;
        }
      }
      const pd = Math.hypot(player.x - merge.x, player.z - merge.z);
      if (pd < 7) clash = true;
      else {
        const pfx = Math.sin(player.heading);
        const pfz = Math.cos(player.heading);
        const along = (merge.x - player.x) * pfx + (merge.z - player.z) * pfz;
        const across = Math.abs((merge.x - player.x) * pfz - (merge.z - player.z) * pfx);
        const near = rb ? Math.hypot(player.x - rb.x, player.z - rb.z) < rb.outer + 2 : Math.abs(player.speed) > 0.3 && along < 40;
        if (near && along > 0 && across < 4 && along / Math.max(Math.abs(player.speed), 2) < 3) clash = true;
      }
      if (clash) {
        c.waiting = true;
        gap = Math.min(gap, Math.max(0, 0.3 - (c.s ?? 0)));
      }
    }

    let target = c.cruise;
    if (fast) {
      // Keep about a two-second gap at speed (rule 126).
      if (gap < 3 + c.cruise * 2.4) target = Math.min(target, Math.max(0, (gap - 3) / 1.9));
    } else if (gap < 25) target = Math.min(target, Math.max(0, (gap - 2) * 0.8));
    if (gap < 2.5) target = 0;
    // Slow for the roundabout ahead (approach paths end at a give way line).
    const remaining = pathLength(path) - (c.s ?? 0);
    if (!rb && remaining < 25 && this.nextPaths(path).some((p) => p.yieldTo)) target = Math.min(target, 4 + remaining * 0.3);
    const prev = c.speed;
    const a = target > c.speed ? 2.2 : -6.5;
    c.speed = Math.max(0, a > 0 ? Math.min(target, c.speed + a * dt) : Math.max(target, c.speed + a * dt));
    c.braking = Math.max(0, (prev - c.speed) / dt);

    if (!c.waiting && (c.s ?? 0) >= 1.8) c.waitSince = undefined;
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

  /** True for a path car approaching (or waiting at) a give way it will obey: it won't pull out in front of you. */
  willGiveWay(c: AiCar): boolean {
    if (!c.path) return false;
    const yields = (p: AiPath) => !!(p.giveWay || p.yieldTo);
    if (yields(c.path) && (c.s ?? 0) < 1.8) return true;
    const next = this.nextPaths(c.path);
    return pathLength(c.path) - (c.s ?? 0) < 40 && next.length > 0 && next.every(yields);
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
    c.cruise = Math.min(limit * 0.88, 17, c.maxSpeed ?? Infinity);

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
    if (stationaryAt < 18 && (c.kind ?? 'car') !== 'car') followGap = Math.min(followGap, stationaryAt - 2); // riders wait behind
    else if (stationaryAt < 18 && !queueing) {
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
    const out: Obstacle[] = [];
    for (const c of this.cars) {
      const { len, wid } = sizeOf(c);
      const fx = Math.sin(c.heading);
      const fz = Math.cos(c.heading);
      if (c.path) {
        // A chain of small boxes along the vehicle, so a long lorry going round a corner
        // isn't one huge axis-aligned box.
        const n = Math.max(1, Math.round(len / wid));
        const step = len / n;
        const h = (wid / 2) * 0.95;
        for (let k = 0; k < n; k++) {
          const along = -len / 2 + step * (k + 0.5);
          const x = c.x + fx * along;
          const z = c.z + fz * along;
          out.push({ kind: 'car', x0: x - h, x1: x + h, z0: z - h, z1: z + h });
        }
        continue;
      }
      const alongX = Math.abs(fx) > 0.7;
      const hl = len / 2;
      const hw = wid / 2;
      out.push(alongX ? { kind: 'car', x0: c.x - hl, x1: c.x + hl, z0: c.z - hw, z1: c.z + hw } : { kind: 'car', x0: c.x - hw, x1: c.x + hw, z0: c.z - hl, z1: c.z + hl });
    }
    return out;
  }


  /**
   * Seconds until the nearest AI car in the lane through (x, z) would reach it
   * at its normal speed. Infinity if nothing is coming.
   */
  timeToReach(x: number, z: number, ignore?: (c: AiCar) => boolean): number {
    let best = Infinity;
    for (const c of this.cars) {
      if (ignore?.(c)) continue;
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
