import type { FaultCode } from '../faults';
import type { DriveEvent, Fault, MirrorId, Side, SignalState } from '../types';
import { mph } from '../types';

/** Shared memory of recent driver actions that checks can read. */
export interface RuleContext {
  lastMirror: Record<MirrorId, number>;
  lastShoulder: Record<Side, number>;
  seatbelt: boolean;
  handbrake: boolean;
  signal: SignalState;
  signalSince: number;
  speed: number;
  moving: boolean;
  /** Distance driven (m) since the current signal was switched on. */
  distSinceSignal: number;
  /** Heading when the current signal was switched on. */
  headingAtSignal: number;
  heading: number;
  stoppedSinceSignal: boolean;
}

export function freshContext(): RuleContext {
  return {
    lastMirror: { interior: -Infinity, left: -Infinity, right: -Infinity },
    lastShoulder: { left: -Infinity, right: -Infinity },
    seatbelt: false,
    handbrake: true,
    signal: 'off',
    signalSince: 0,
    speed: 0,
    moving: false,
    distSinceSignal: 0,
    headingAtSignal: 0,
    heading: 0,
    stoppedSinceSignal: false
  };
}

export interface Check {
  id: string;
  onEvent(ev: DriveEvent, ctx: RuleContext): FaultCode | FaultCode[] | null;
}

/** Tuning values (game design, not Highway Code text). */
export const TUNING = {
  mirrorWindowS: 6,
  shoulderWindowS: 6,
  mirrorBeforeSignalS: 4,
  handbrakeDriveS: 1.2,
  speedMinorOverMph: 2,
  speedSeriousOverMph: 10,
  speedSustainS: 1.5,
  kerbSeriousMps: 4.5,
  collisionDangerousMps: 2.5,
  laneWrongSideM: 0.6,
  laneSustainS: 1.5,
  harshBrakeMps2: -6.5,
  harshBrakeMinMps: 4,
  signalForgottenM: 90,
  signalForgottenAfterStopM: 30,
  signalUsedTurnRad: 0.7
};

const mirrorRecent = (ctx: RuleContext, t: number, w: number, which: MirrorId[]) =>
  which.some((m) => t - ctx.lastMirror[m] <= w);

export function seatbeltCheck(): Check {
  let flagged = false;
  return {
    id: 'seatbelt',
    onEvent(ev, ctx) {
      if (ev.type === 'moveOff' && !ctx.seatbelt && !flagged) {
        flagged = true;
        return 'seatbelt-off';
      }
      return null;
    }
  };
}

export function moveOffObservationCheck(): Check {
  return {
    id: 'moveoff-observation',
    onEvent(ev, ctx) {
      if (ev.type !== 'moveOff') return null;
      const out: FaultCode[] = [];
      if (!mirrorRecent(ctx, ev.t, TUNING.mirrorWindowS, ['interior', 'right'])) out.push('moveoff-mirrors');
      if (ev.t - ctx.lastShoulder.right > TUNING.shoulderWindowS) out.push('moveoff-blindspot');
      return out.length ? out : null;
    }
  };
}

export function mirrorBeforeSignalCheck(): Check {
  return {
    id: 'mirror-before-signal',
    onEvent(ev, ctx) {
      if (ev.type !== 'signal' || ev.state === 'off') return null;
      // The mirror on the side you're signalling towards, or the interior mirror, counts.
      const ok = mirrorRecent(ctx, ev.t, TUNING.mirrorBeforeSignalS, ['interior', ev.state]);
      return ok ? null : 'signal-no-mirror';
    }
  };
}

export function handbrakeDriveCheck(): Check {
  let held = 0;
  let flagged = false;
  return {
    id: 'handbrake-drive',
    onEvent(ev) {
      if (ev.type === 'handbrake' && !ev.on) {
        held = 0;
        flagged = false;
      }
      if (ev.type !== 'tick') return null;
      if (ev.handbrake && ev.throttle > 0.2) held += ev.dt;
      else held = 0;
      if (held > TUNING.handbrakeDriveS && !flagged) {
        flagged = true;
        return 'handbrake-drive';
      }
      return null;
    }
  };
}

export function speedCheck(): Check {
  let over = 0;
  let level: 0 | 1 | 2 = 0;
  return {
    id: 'speed',
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      const v = mph(ev.speed);
      const excess = v - ev.limitMph;
      if (excess <= TUNING.speedMinorOverMph) {
        over = 0;
        if (excess < 0) level = 0; // re-arm once back under the limit
        return null;
      }
      over += ev.dt;
      if (over < TUNING.speedSustainS) return null;
      if (excess > TUNING.speedSeriousOverMph && level < 2) {
        level = 2;
        return 'speed-serious';
      }
      if (level < 1) {
        level = 1;
        return 'speed-minor';
      }
      return null;
    }
  };
}

export function kerbCheck(): Check {
  let lastT = -Infinity;
  return {
    id: 'kerb',
    onEvent(ev) {
      if (ev.type !== 'kerb') return null;
      if (ev.t - lastT < 2) return null; // one scrape = one fault
      lastT = ev.t;
      return Math.abs(ev.speed) >= TUNING.kerbSeriousMps ? 'kerb-serious' : 'kerb-minor';
    }
  };
}

export function collisionCheck(): Check {
  let lastT = -Infinity;
  return {
    id: 'collision',
    onEvent(ev) {
      if (ev.type !== 'collision') return null;
      if (ev.t - lastT < 2) return null;
      lastT = ev.t;
      return Math.abs(ev.speed) >= TUNING.collisionDangerousMps ? 'collision-dangerous' : 'collision-serious';
    }
  };
}

export function laneCheck(): Check {
  let wrong = 0;
  let armed = true;
  return {
    id: 'lane',
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      if (ev.wrongSideBy !== null && ev.wrongSideBy > TUNING.laneWrongSideM && Math.abs(ev.speed) > 1) {
        wrong += ev.dt;
        if (wrong > TUNING.laneSustainS && armed) {
          armed = false;
          return 'lane-position';
        }
      } else {
        wrong = 0;
        if (ev.wrongSideBy === null || ev.wrongSideBy < 0) armed = true;
      }
      return null;
    }
  };
}

export function harshBrakeCheck(): Check {
  let lastT = -Infinity;
  return {
    id: 'harsh-brake',
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      if (ev.accel < TUNING.harshBrakeMps2 && Math.abs(ev.speed) > TUNING.harshBrakeMinMps && ev.t - lastT > 5) {
        lastT = ev.t;
        return 'harsh-brake';
      }
      return null;
    }
  };
}

export function signalCancelCheck(): Check {
  let flagged = false;
  return {
    id: 'signal-cancel',
    onEvent(ev, ctx) {
      if (ev.type === 'signal') flagged = false;
      if (ev.type !== 'tick' || ctx.signal === 'off' || flagged) return null;
      const turned = Math.abs(angleDiff(ctx.heading, ctx.headingAtSignal)) > TUNING.signalUsedTurnRad;
      // After pulling up, the signal has done its job; a much shorter distance counts as forgotten.
      const limit = ctx.stoppedSinceSignal ? TUNING.signalForgottenAfterStopM : TUNING.signalForgottenM;
      if (!turned && ctx.distSinceSignal > limit) {
        flagged = true;
        return 'signal-not-cancelled';
      }
      return null;
    }
  };
}

export function hornCheck(): Check {
  let flagged = false;
  return {
    id: 'horn',
    onEvent(ev) {
      if (ev.type === 'horn' && Math.abs(ev.speed) < 0.2 && !flagged) {
        flagged = true;
        return 'horn-stationary';
      }
      return null;
    }
  };
}

export function securingCheck(): Check {
  return {
    id: 'securing',
    onEvent(ev) {
      if (ev.type === 'finish' && (!ev.handbrake || ev.gear !== 'P')) return 'not-secured';
      return null;
    }
  };
}

export function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export function day1Checks(): Check[] {
  return [
    seatbeltCheck(),
    moveOffObservationCheck(),
    mirrorBeforeSignalCheck(),
    handbrakeDriveCheck(),
    speedCheck(),
    kerbCheck(),
    collisionCheck(),
    laneCheck(),
    harshBrakeCheck(),
    signalCancelCheck(),
    hornCheck(),
    securingCheck()
  ];
}

export type { Fault };
