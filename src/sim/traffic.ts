import type { Obstacle, SceneLayout } from '../world/layout';
import { inRect, speedLimitAt } from '../world/layout';
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

  update(dt: number, player: PlayerShape): void {
    // Release scripted cars when the player reaches their trigger area.
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      if (inRect(p.when, player.x, player.z)) {
        this.add({ ...p.from, speed: p.speed, looping: false, colour: p.colour });
        this.pending.splice(i, 1);
      }
    }
    for (const c of this.cars) this.step(c, dt, player);
    this.cars = this.cars.filter((c) => c.looping || this.onRoad(c));
  }

  private onRoad(c: AiCar): boolean {
    return this.layout.drivable.some((r) => inRect(r, c.x, c.z));
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
