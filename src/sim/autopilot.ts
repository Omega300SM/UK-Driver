import type { Car, CarInput } from './car';
import { angleDiff } from '../rules/checks';

export interface Waypoint {
  x: number;
  z: number;
  /** Target speed (m/s) on the way to this point. 0 = stop here. */
  v: number;
  /** Reverse to this point (the car must be in R). */
  rev?: boolean;
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

  /** The point is now in front of us (we reversed past it). */
  private overshot(car: Car, wp: Waypoint): boolean {
    return (wp.x - car.x) * Math.sin(car.heading) + (wp.z - car.z) * Math.cos(car.heading) > 0;
  }

  drive(car: Car): CarInput | null {
    if (this.done) return null;
    const wp = this.route[this.i];
    const dx = wp.x - car.x;
    const dz = wp.z - car.z;
    const dist = Math.hypot(dx, dz);
    if (wp.rev) {
      // Reversing: steer so the back of the car heads for the point (steering works the other way round).
      if ((wp.v > 0 && dist < 1.6) || (wp.v === 0 && dist < 0.3 && Math.abs(car.speed) < 0.05) || (wp.v === 0 && dist < 0.8 && Math.abs(car.speed) < 0.05 && this.overshot(car, wp))) {
        this.i++;
        return this.drive(car);
      }
      const desired = Math.atan2(dx, dz);
      const err = angleDiff(desired, car.heading + Math.PI);
      const steer = Math.max(-1, Math.min(1, err * 2.4));
      const target = wp.v === 0 ? Math.max(0.6, Math.min(1.4, dist * 0.7)) : wp.v;
      const dv = target - -car.speed;
      if (wp.v === 0 && (dist < 0.2 || this.overshot(car, wp))) return { throttle: 0, brake: 0.6, steer };
      return { throttle: dv > 0 ? Math.min(0.6, dv * 0.5) : 0, brake: dv < -0.3 ? Math.min(0.5, -dv * 0.25) : 0, steer };
    }
    // At speed, aim further ahead (a waypoint is 'reached' sooner) and steer more gently.
    const reach = car.speed > 12 ? Math.max(3.5, car.speed * 0.3) : 3.5;
    if ((wp.v > 0 && dist < reach) || (wp.v === 0 && dist < 1.2 && Math.abs(car.speed) < 0.05)) {
      this.i++;
      return this.drive(car);
    }
    const desired = Math.atan2(dx, dz);
    const err = angleDiff(desired, car.heading);
    const gain = car.speed > 12 ? (2.2 * 12) / car.speed : 2.2;
    const steer = Math.max(-1, Math.min(1, -err * gain));
    const target = wp.v === 0 ? Math.min(4, dist * 0.6) : wp.v;
    const dv = target - car.speed;
    if (wp.v === 0 && dist < 1.5) return { throttle: 0, brake: 0.5, steer };
    return { throttle: dv > 0 ? Math.min(1, dv * 0.6) : 0, brake: dv < -0.5 ? Math.min(0.45, -dv * 0.1) : 0, steer };
  }
}
