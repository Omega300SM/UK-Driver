import { makeFault } from './faults';
import { freshContext, type Check, type RuleContext } from './checks';
import type { DriveEvent, Fault } from './types';

export type RulesMode = 'coach' | 'test';

/**
 * Event-driven rules engine. Feed it DriveEvents; it updates the shared
 * context, runs every check and collects faults. In "coach" mode faults are
 * reported to listeners (for Maggie to comment on) but not counted.
 */
export class RulesEngine {
  readonly ctx: RuleContext = freshContext();
  readonly faults: Fault[] = [];
  private listeners: Array<(f: Fault) => void> = [];

  constructor(
    private checks: Check[],
    public mode: RulesMode = 'test'
  ) {}

  onFault(fn: (f: Fault) => void): void {
    this.listeners.push(fn);
  }

  /** Seed state (e.g. seat belt already on after the cockpit drill). */
  seed(partial: Partial<RuleContext>): void {
    Object.assign(this.ctx, partial);
  }

  emit(ev: DriveEvent): Fault[] {
    // Checks see the context *before* this event updates it, so e.g. a signal
    // is judged against mirror checks that happened earlier.
    const raised: Fault[] = [];
    for (const c of this.checks) {
      const r = c.onEvent(ev, this.ctx);
      if (!r) continue;
      for (const code of Array.isArray(r) ? r : [r]) raised.push(makeFault(code, ev.t));
    }
    this.update(ev);
    for (const f of raised) {
      if (this.mode === 'test') this.faults.push(f);
      for (const l of this.listeners) l(f);
    }
    return raised;
  }

  private update(ev: DriveEvent): void {
    const c = this.ctx;
    switch (ev.type) {
      case 'mirror':
        c.lastMirror[ev.which] = ev.t;
        break;
      case 'shoulder':
        c.lastShoulder[ev.side] = ev.t;
        break;
      case 'seatbelt':
        c.seatbelt = ev.on;
        break;
      case 'handbrake':
        c.handbrake = ev.on;
        break;
      case 'signal':
        c.signal = ev.state;
        c.signalSince = ev.t;
        c.distSinceSignal = 0;
        c.headingAtSignal = c.heading;
        c.stoppedSinceSignal = false;
        break;
      case 'moveOff':
        c.moving = true;
        break;
      case 'laneChange':
        // The signal has done its job; count afresh from here.
        c.distSinceSignal = 0;
        c.headingAtSignal = c.heading;
        break;
      case 'stop':
        c.moving = false;
        if (c.signal !== 'off') {
          c.stoppedSinceSignal = true;
          c.distSinceSignal = 0;
        }
        break;
      case 'tick':
        c.speed = ev.speed;
        c.heading = ev.heading;
        if (ev.onRoundabout) {
          // A roundabout uses the signal; start counting afresh once we leave it.
          c.distSinceSignal = 0;
          c.headingAtSignal = ev.heading;
          c.stoppedSinceSignal = false;
        } else if (c.signal !== 'off') c.distSinceSignal += ev.dist;
        break;
    }
  }

  get dangerous(): boolean {
    return this.faults.some((f) => f.severity === 'dangerous');
  }
}
