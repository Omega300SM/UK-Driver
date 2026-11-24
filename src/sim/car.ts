import type { Gear } from '../rules/types';
import { inRect, isDrivable, type Obstacle, type SceneLayout } from '../world/layout';

export interface CarInput {
  throttle: number; // 0..1
  brake: number; // 0..1
  steer: number; // −1 (left) .. +1 (right)
}

export interface StepResult {
  kerb?: number;
  collision?: { speed: number; what: string };
}

/**
 * Arcade-realistic kinematic bicycle model with an automatic gearbox.
 * Heading 0 faces +z; forward = (sin h, cos h). Steering right reduces h.
 */
export class Car {
  x = 0;
  z = 0;
  heading = 0;
  /** m/s, signed. */
  speed = 0;
  accel = 0;
  steerAngle = 0;
  gear: Gear = 'P';
  handbrake = true;
  odometer = 0;

  readonly length = 4.1;
  readonly width = 1.8;
  readonly wheelbase = 2.6;
  readonly maxSteer = 0.62;

  reset(x: number, z: number, heading: number): void {
    this.x = x;
    this.z = z;
    this.heading = heading;
    this.speed = 0;
    this.accel = 0;
    this.steerAngle = 0;
    this.odometer = 0;
  }

  get forward(): [number, number] {
    return [Math.sin(this.heading), Math.cos(this.heading)];
  }

  /** Right-hand vector (driver sits on the right in a UK car). */
  get right(): [number, number] {
    return [-Math.cos(this.heading), Math.sin(this.heading)];
  }

  corners(x = this.x, z = this.z, h = this.heading, pad = 0): Array<[number, number]> {
    const f: [number, number] = [Math.sin(h), Math.cos(h)];
    const r: [number, number] = [-Math.cos(h), Math.sin(h)];
    const hl = this.length / 2 + pad;
    const hw = this.width / 2 + pad;
    const out: Array<[number, number]> = [];
    for (const [a, b] of [
      [hl, hw],
      [hl, -hw],
      [-hl, hw],
      [-hl, -hw],
      [hl, 0],
      [-hl, 0],
      [0, hw],
      [0, -hw]
    ]) {
      out.push([x + f[0] * a + r[0] * b, z + f[1] * a + r[1] * b]);
    }
    return out;
  }

  step(dt: number, input: CarInput, layout: SceneLayout, moving: Obstacle[] = []): StepResult {
    const res: StepResult = {};
    const v0 = this.speed;

    // Steering: rate-limited, slightly reduced at speed.
    const lock = this.maxSteer * (1 - Math.min(0.55, Math.abs(this.speed) / 30));
    const target = input.steer * lock;
    const rate = 2.6 * dt;
    this.steerAngle += Math.max(-rate, Math.min(rate, target - this.steerAngle));

    // Longitudinal: drive, then resistance and brakes pull speed towards zero (never past it).
    let v = this.speed;
    if (this.gear === 'P') {
      v = toward(v, 0, 12 * dt);
    } else {
      const dir = this.gear === 'R' ? -1 : 1;
      let drive = input.throttle * (this.gear === 'R' ? 1.6 : 3.2);
      if (input.throttle < 0.05 && Math.abs(v) < 1.6) drive += 0.7; // automatics creep at idle
      if (this.handbrake) drive *= 0.12;
      if (this.gear === 'R' && v < -3) drive = 0;
      v += dir * drive * dt;
      v = toward(v, 0, (0.12 + 0.0035 * v * v) * dt);
      v = toward(v, 0, (input.brake * 8.5 + (this.handbrake ? 4 : 0)) * dt);
    }
    v = Math.max(-4, Math.min(32, v));

    // Kinematics.
    const yaw = (v / this.wheelbase) * Math.tan(this.steerAngle);
    const nh = this.heading - yaw * dt;
    const nx = this.x + Math.sin(nh) * v * dt;
    const nz = this.z + Math.cos(nh) * v * dt;

    const hit = this.collide(nx, nz, nh, layout, moving);
    if (hit) {
      if (hit === 'kerb') res.kerb = v;
      else res.collision = { speed: v, what: hit };
      this.speed = 0;
      this.accel = (0 - v0) / dt;
      return res;
    }
    this.odometer += Math.abs(v * dt);
    this.x = nx;
    this.z = nz;
    this.heading = nh;
    this.accel = (v - v0) / dt;
    this.speed = v;
    return res;
  }

  private collide(x: number, z: number, h: number, layout: SceneLayout, moving: Obstacle[]): 'kerb' | string | null {
    const pts = this.corners(x, z, h);
    for (const [px, pz] of pts) {
      if (!isDrivable(layout, px, pz)) return 'kerb';
    }
    for (const o of moving.length ? [...layout.obstacles, ...moving] : layout.obstacles) {
      for (const [px, pz] of pts) if (inRect(o, px, pz)) return o.kind;
      // Obstacle corners inside the car (catches small posts between our sample points).
      const oc: Array<[number, number]> = [
        [o.x0, o.z0],
        [o.x1, o.z0],
        [o.x0, o.z1],
        [o.x1, o.z1]
      ];
      for (const [ox, oz] of oc) if (this.contains(ox, oz, x, z, h)) return o.kind;
    }
    return null;
  }

  private contains(px: number, pz: number, x: number, z: number, h: number): boolean {
    const dx = px - x;
    const dz = pz - z;
    const along = dx * Math.sin(h) + dz * Math.cos(h);
    const across = dx * -Math.cos(h) + dz * Math.sin(h);
    return Math.abs(along) <= this.length / 2 && Math.abs(across) <= this.width / 2;
  }
}

function toward(v: number, target: number, amount: number): number {
  if (v > target) return Math.max(target, v - amount);
  if (v < target) return Math.min(target, v + amount);
  return v;
}
