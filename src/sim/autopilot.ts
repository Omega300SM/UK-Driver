import type { Car, CarInput } from './car';
import { angleDiff } from '../rules/checks';

export interface Waypoint {
  x: number;
  z: number;
  /** Target speed (m/s) on the way to this point. 0 = stop here. */
  v: number;
}

/**
 * Simple pure-pursuit driver. Used by e2e tests and screenshots, and handy
 * for demonstrating a manoeuvre. Returns null when the route is done.
 */
export class Autopilot {
  private i = 0;
  constructor(private route: Waypoint[]) {}

  /** True when the final waypoint is a stop. */
  get endsStopped(): boolean {
    return this.route[this.route.length - 1]?.v === 0;
  }

  get done(): boolean {
    return this.i >= this.route.length;
  }

  drive(car: Car): CarInput | null {
    if (this.done) return null;
    const wp = this.route[this.i];
    const dx = wp.x - car.x;
    const dz = wp.z - car.z;
    const dist = Math.hypot(dx, dz);
    if ((wp.v > 0 && dist < 3.5) || (wp.v === 0 && dist < 1.2 && Math.abs(car.speed) < 0.05)) {
      this.i++;
      return this.drive(car);
    }
    const desired = Math.atan2(dx, dz);
    const err = angleDiff(desired, car.heading);
    const steer = Math.max(-1, Math.min(1, -err * 2.2));
    const target = wp.v === 0 ? Math.min(4, dist * 0.6) : wp.v;
    const dv = target - car.speed;
    if (wp.v === 0 && dist < 1.5) return { throttle: 0, brake: 0.5, steer };
    return { throttle: dv > 0 ? Math.min(1, dv * 0.6) : 0, brake: dv < -0.5 ? Math.min(0.45, -dv * 0.1) : 0, steer };
  }
}
