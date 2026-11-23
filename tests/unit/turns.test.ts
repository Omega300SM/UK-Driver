import { describe, it, expect } from 'vitest';
import { Car } from '../../src/sim/car';
import { Autopilot, type Waypoint } from '../../src/sim/autopilot';
import { TOWN } from '../../src/world/scenes/townLayout';

/** Drive a route with the autopilot and report kerb strikes. */
function drive(start: { x: number; z: number; heading: number }, route: Waypoint[], secs = 60) {
  const car = new Car();
  car.reset(start.x, start.z, start.heading);
  car.gear = 'D';
  car.handbrake = false;
  const ap = new Autopilot(route);
  let kerbs = 0;
  for (let i = 0; i < secs * 60; i++) {
    const inp = ap.drive(car);
    if (!inp) break;
    const r = car.step(1 / 60, inp, TOWN);
    if (r.kerb !== undefined || r.collision) kerbs++;
  }
  return { car, kerbs, done: ap.done };
}

const E = Math.PI / 2;
const W = -Math.PI / 2;
const S = Math.PI;

describe('town junction corners are drivable at normal turning speeds', () => {
  it('left from Market Street into Mill Lane', () => {
    const r = drive({ x: 10, z: -1.9, heading: E }, [{ x: 30, z: -1.9, v: 4 }, { x: 35.5, z: -2.6, v: 3.5 }, { x: 38.1, z: -7, v: 3.5 }, { x: 38.1, z: -25, v: 5 }]);
    expect(r.kerbs).toBe(0);
    expect(r.done).toBe(true);
  });
  it('left out of Church Street into Market Street', () => {
    const r = drive({ x: 138.1, z: 10, heading: S }, [{ x: 138.1, z: 7, v: 3 }, { x: 137, z: 3.4, v: 3 }, { x: 133, z: 2.1, v: 4 }, { x: 120, z: 1.9, v: 6 }]);
    expect(r.kerbs).toBe(0);
  });
  it('right from Market Street into Mill Lane (across the road)', () => {
    const r = drive({ x: 60, z: 1.9, heading: W }, [{ x: 50, z: 1.1, v: 4 }, { x: 44.5, z: 0.6, v: 3 }, { x: 41, z: -2.4, v: 3 }, { x: 38.6, z: -8, v: 3.5 }, { x: 38.1, z: -25, v: 5 }]);
    expect(r.kerbs).toBe(0);
  });
  it('round the Tannery Road / Back Lane bend', () => {
    const r = drive({ x: -161.9, z: -250, heading: S }, [{ x: -161.9, z: -288, v: 5 }, { x: -158, z: -298.5, v: 4 }, { x: -150, z: -301.9, v: 5 }, { x: -120, z: -301.9, v: 6 }]);
    expect(r.kerbs).toBe(0);
  });
});
