import type { Crossing, Obstacle, SceneLayout, SignalController, StopLine } from '../world/layout';
import type { TrafficLevel } from '../content/schema';

/** What a traffic signal shows to drivers. */
export type Aspect = 'green' | 'amber' | 'red' | 'redAmber' | 'flashAmber';

/**
 * Timings (seconds). Real timings vary by site; these are game values chosen
 * to feel natural at walking pace. See NEEDS_REVIEW.md.
 */
export const SIGNAL_TIMING = {
  junctionGreen: 14,
  amber: 3,
  allRed: 2,
  redAmber: 2,
  /** Minimum green for traffic at a crossing before a pedestrian request is served. */
  crossingMinGreen: 8,
  pelicanRed: 7,
  pelicanFlash: 6,
  puffinRedMin: 6,
  puffinRedMax: 16
};

/** Comfortable braking used to decide "stop or go" at amber (m/s²). */
const AMBER_DECEL = 3.5;

interface Phase {
  /** Aspect per group. */
  show: Record<string, Aspect>;
  /** Fixed length, or null when the phase ends on a condition. */
  dur: number | null;
  /** Pedestrians may start to cross. */
  walk?: boolean;
}

class Controller {
  phase = 0;
  timer = 0;
  request = false;
  private phases: Phase[];

  constructor(
    readonly def: SignalController,
    offset: number
  ) {
    const T = SIGNAL_TIMING;
    if (def.kind === 'junction') {
      const [a, b] = def.groups;
      const p = (sa: Aspect, sb: Aspect, dur: number): Phase => ({ show: { [a]: sa, [b]: sb }, dur });
      this.phases = [
        p('green', 'red', T.junctionGreen),
        p('amber', 'red', T.amber),
        p('red', 'red', T.allRed),
        p('red', 'redAmber', T.redAmber),
        p('red', 'green', T.junctionGreen),
        p('red', 'amber', T.amber),
        p('red', 'red', T.allRed),
        p('redAmber', 'red', T.redAmber)
      ];
    } else {
      const g = def.groups[0];
      const p = (s: Aspect, dur: number | null, walk = false): Phase => ({ show: { [g]: s }, dur, walk });
      this.phases =
        def.kind === 'pelican'
          ? [p('green', null), p('amber', T.amber), p('red', T.pelicanRed, true), p('flashAmber', T.pelicanFlash)]
          : [p('green', null), p('amber', T.amber), p('red', null, true), p('redAmber', T.redAmber)];
    }
    // Start part-way through the cycle so junctions don't all change together.
    this.timer = offset;
  }

  get current(): Phase {
    return this.phases[this.phase];
  }

  aspect(group: string): Aspect {
    return this.current.show[group] ?? 'red';
  }

  get walk(): boolean {
    return !!this.current.walk;
  }

  update(dt: number, pedsOnCrossing: number): void {
    this.timer += dt;
    const ph = this.current;
    const T = SIGNAL_TIMING;
    let done = ph.dur !== null && this.timer >= ph.dur;
    if (ph.dur === null) {
      if (this.phase === 0) done = this.request && this.timer >= T.crossingMinGreen;
      // Puffin / toucan red: kept while people are still on the crossing (kerbside and on-crossing detectors).
      else done = this.timer >= T.puffinRedMax || (this.timer >= T.puffinRedMin && pedsOnCrossing === 0);
    }
    if (!done) return;
    this.timer = 0;
    this.phase = (this.phase + 1) % this.phases.length;
    if (this.current.walk) this.request = false;
  }
}

export interface Pedestrian {
  id: number;
  x: number;
  z: number;
  heading: number;
  speed: number;
  state: 'approach' | 'wait' | 'cross' | 'leave';
  crossing: Crossing;
  /** Waypoints: kerb, far kerb, then away along the pavement. */
  route: Array<[number, number]>;
  leg: number;
  colour: number;
  waitedS: number;
  /** Children (at the school crossing patrol). */
  child?: boolean;
  done?: boolean;
}

/** A road user that might need to stop for (or be waited for by) pedestrians. */
export interface Mover {
  x: number;
  z: number;
  heading: number;
  speed: number;
}

const PED_COLOURS = [0x2b4c7e, 0xa83232, 0x3f6e3a, 0x6b4f8a, 0xc98a2e, 0x333333, 0x8a8a8a, 0x1f6f78];

/**
 * Traffic signals and pedestrian crossings: signal phases, people walking to
 * and over crossings, and the shared "must I stop at this line?" logic that
 * AI cars, the scripted driver and the rules all use.
 */
export class StreetControl {
  peds: Pedestrian[] = [];
  private ctrls = new Map<string, Controller>();
  private nextId = 1;
  private rnd: () => number;
  private spawnRate: number;
  private clock = 0;

  constructor(
    private L: SceneLayout,
    level: TrafficLevel,
    seed = 11
  ) {
    let s = seed;
    this.rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    (L.signals ?? []).forEach((d, i) => this.ctrls.set(d.id, new Controller(d, (i * 7) % 11)));
    // People arriving at each crossing, per second.
    this.spawnRate = level === 'busy' ? 1 / 9 : level === 'light' ? 1 / 16 : 1 / 30;
    // A few people already about.
    for (const c of L.crossings ?? []) if (this.rnd() < 0.6) this.spawn(c, 0.4 + this.rnd() * 0.5);
  }

  get active(): boolean {
    return !!(this.L.crossings?.length || this.L.signals?.length);
  }

  controller(id: string): Controller | undefined {
    return this.ctrls.get(id);
  }

  aspect(controller: string, group: string): Aspect {
    return this.ctrls.get(controller)?.aspect(group) ?? 'green';
  }

  /** The aspect a stop line shows, or null for an uncontrolled (zebra) line. */
  aspectAt(line: StopLine): Aspect | null {
    return line.signal ? this.aspect(line.signal.controller, line.signal.group) : null;
  }

  crossing(id: string | undefined): Crossing | undefined {
    return id ? this.L.crossings?.find((c) => c.id === id) : undefined;
  }

  pedsOn(crossingId: string): Pedestrian[] {
    return this.peds.filter((p) => p.crossing.id === crossingId && p.state === 'cross');
  }

  /** Someone has been waiting at the kerb for at least `minWaitS` (long enough for a driver to see them). */
  pedWaiting(crossingId: string, minWaitS = 1.2): boolean {
    return this.peds.some((p) => p.crossing.id === crossingId && p.state === 'wait' && p.waitedS >= minWaitS);
  }

  /** A school crossing patrol is out in the road with the sign while children wait or cross (rule 210). */
  patrolActive(crossingId: string): boolean {
    return this.peds.some((p) => p.crossing.id === crossingId && (p.state === 'wait' || p.state === 'cross'));
  }

  /** Time (s) the signal at a line has shown its current aspect. */
  aspectAge(line: StopLine): number {
    return line.signal ? (this.ctrls.get(line.signal.controller)?.timer ?? 0) : 0;
  }

  /**
   * Should traffic stop at this line? `dist` is from the vehicle's front to
   * the line (m), `speed` in m/s. Amber: stop unless too close to stop safely
   * (rule 175).
   */
  mustStop(line: StopLine, dist: number, speed: number): boolean {
    const asp = this.aspectAt(line);
    const crossing = this.crossing(line.crossing);
    const onCrossing = crossing ? this.pedsOn(crossing.id).length > 0 : false;
    if (asp === 'red' || asp === 'redAmber') return true;
    if (asp === 'amber') return dist > (speed * speed) / (2 * AMBER_DECEL) + 0.5;
    if (asp === 'flashAmber') return onCrossing;
    if (onCrossing) return true; // rule 198: give way to anyone still crossing
    const canStop = dist > (speed * speed) / (2 * 5) - 0.5;
    if (crossing?.kind === 'patrol' && this.patrolActive(crossing.id)) return canStop; // rule 210
    if ((crossing?.kind === 'zebra' || crossing?.kind === 'informal') && this.pedWaiting(crossing.id)) return canStop; // rules 195, H2
    return false;
  }

  /** Stop lines ahead of a mover in its lane: [line, distance from the vehicle's centre]. */
  linesAhead(m: Mover, range = 45): Array<{ line: StopLine; along: number }> {
    const fx = Math.sin(m.heading);
    const fz = Math.cos(m.heading);
    const out: Array<{ line: StopLine; along: number }> = [];
    for (const line of this.L.stopLines ?? []) {
      if (Math.cos(line.heading - m.heading) < 0.8) continue;
      const dx = line.x - m.x;
      const dz = line.z - m.z;
      const along = dx * fx + dz * fz;
      const across = Math.abs(dx * fz - dz * fx);
      if (along > -1 && along < range && across < 2.2) out.push({ line, along });
    }
    return out.sort((a, b) => a.along - b.along);
  }

  update(dt: number, movers: Mover[], player: Mover): void {
    this.clock += dt;
    for (const [id, c] of this.ctrls) {
      const crossing = this.L.crossings?.find((x) => x.controller === id);
      c.update(dt, crossing ? this.pedsOn(crossing.id).length : 0);
    }
    for (const cr of this.L.crossings ?? []) {
      const here = this.peds.filter((p) => p.crossing === cr).length;
      if (here < 3 && this.rnd() < dt * this.spawnRate) this.spawn(cr, 0);
    }
    for (const p of this.peds) this.stepPed(p, dt, movers, player);
    this.peds = this.peds.filter((p) => !p.done);
  }

  /** People as obstacles for the car physics. */
  obstacles(): Obstacle[] {
    return this.peds.map((p) => ({ kind: 'pedestrian', x0: p.x - 0.3, x1: p.x + 0.3, z0: p.z - 0.3, z1: p.z + 0.3 }));
  }

  // ---------------------------------------------------------------------------

  private spawn(cr: Crossing, progress: number): void {
    const a = cr.area;
    const side = this.rnd() < 0.5 ? 0 : 1;
    const along = (cr.approachFrom ?? (this.rnd() < 0.5 ? -1 : 1)) * (10 + this.rnd() * 8);
    // Walk line across: a random spot within the crossing's width.
    let route: Array<[number, number]>;
    if (cr.axis === 'x') {
      const x = a.x0 + 0.5 + this.rnd() * (a.x1 - a.x0 - 1);
      const near = side === 0 ? a.z0 - 0.9 : a.z1 + 0.9;
      const far = side === 0 ? a.z1 + 0.9 : a.z0 - 0.9;
      const off = side === 0 ? -0.6 : 0.6; // walk along the pavement, a little back from the kerb
      route = [
        [x + along, near + off],
        [x, near],
        [x, far],
        [x + (cr.approachFrom ? along : -along), far - off]
      ];
    } else {
      const z = a.z0 + 0.5 + this.rnd() * (a.z1 - a.z0 - 1);
      const near = side === 0 ? a.x0 - 0.9 : a.x1 + 0.9;
      const far = side === 0 ? a.x1 + 0.9 : a.x0 - 0.9;
      const off = side === 0 ? -0.6 : 0.6;
      route = [
        [near + off, z + along],
        [near, z],
        [far, z],
        [far - off, z + (cr.approachFrom ? along : -along)]
      ];
    }
    const [sx, sz] = route[0];
    const [kx, kz] = route[1];
    const p: Pedestrian = {
      id: this.nextId++,
      x: sx + (kx - sx) * progress,
      z: sz + (kz - sz) * progress,
      heading: Math.atan2(kx - sx, kz - sz),
      speed: 1.15 + this.rnd() * 0.4,
      state: 'approach',
      crossing: cr,
      route,
      leg: 1,
      colour: PED_COLOURS[this.nextId % PED_COLOURS.length],
      waitedS: 0,
      child: cr.kind === 'patrol'
    };
    if (p.child) p.speed *= 0.9;
    this.peds.push(p);
  }

  private canStart(p: Pedestrian, movers: Mover[]): boolean {
    const cr = p.crossing;
    if (cr.controller) {
      const c = this.ctrls.get(cr.controller);
      if (!c) return true;
      c.request = true;
      // Start only early in the walk phase (no starting on a flashing green man).
      return c.walk && c.timer < 4;
    }
    // Zebra: step out once approaching traffic has stopped or is still well away.
    const cx = (cr.area.x0 + cr.area.x1) / 2;
    const cz = (cr.area.z0 + cr.area.z1) / 2;
    for (const m of movers) {
      const fx = Math.sin(m.heading);
      const fz = Math.cos(m.heading);
      const along = (cx - m.x) * fx + (cz - m.z) * fz;
      const across = Math.abs((cx - m.x) * fz - (cz - m.z) * fx);
      if (along < -2.5 || along > 45 || across > 5) continue;
      if (along < 3) return false; // a car is on the crossing
      if (m.speed < 0.6) continue; // stopped for us
      if ((along - 2.5) / m.speed < 4.5) return false;
    }
    return true;
  }

  private stepPed(p: Pedestrian, dt: number, movers: Mover[], player: Mover): void {
    if (p.state === 'wait') {
      p.waitedS += dt;
      if (!this.canStart(p, movers)) return;
      p.state = 'cross';
    }
    const [tx, tz] = p.route[p.leg];
    const dx = tx - p.x;
    const dz = tz - p.z;
    const d = Math.hypot(dx, dz);
    const step = p.speed * dt;
    // Don't walk into a stopped car (e.g. one left on the crossing).
    const nx = p.x + (dx / Math.max(d, 1e-6)) * Math.min(step + 0.7, d);
    const nz = p.z + (dz / Math.max(d, 1e-6)) * Math.min(step + 0.7, d);
    if (insideCar(player, nx, nz)) return;
    if (d <= step) {
      p.x = tx;
      p.z = tz;
      p.leg++;
      if (p.leg === 2) p.state = 'wait';
      else if (p.leg === 3) p.state = 'leave';
      else if (p.leg >= p.route.length) p.done = true;
      return;
    }
    p.heading = Math.atan2(dx, dz);
    p.x += (dx / d) * step;
    p.z += (dz / d) * step;
  }
}

/** Point within the player's car footprint (4.2 × 1.8 m) plus a margin. */
function insideCar(car: Mover, x: number, z: number): boolean {
  const dx = x - car.x;
  const dz = z - car.z;
  const along = dx * Math.sin(car.heading) + dz * Math.cos(car.heading);
  const across = -dx * Math.cos(car.heading) + dz * Math.sin(car.heading);
  return Math.abs(along) < 2.1 + 0.5 && Math.abs(across) < 0.9 + 0.5;
}
