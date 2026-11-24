import type { FaultCode } from '../faults';
import type { Check } from './index';
import { townChecks } from './town';
import { streetChecks } from './street';
import { manoeuvreChecks } from './manoeuvre';

/** Tuning values for roundabout checks (game design; see NEEDS_REVIEW.md). */
export const RB_TUNING = {
  lookWindowS: 6,
  /** Turn angles (rad) separating left / ahead / right exits. */
  leftMax: (Math.PI * 3) / 4,
  rightMin: (Math.PI * 5) / 4,
  wrongWaySustainS: 0.8,
  conflictSeriousS: 2.2,
  conflictDangerousS: 1.0
};

export type ExitKind = 'left' | 'ahead' | 'right';
export function exitKind(turn: number): ExitKind {
  if (turn < RB_TUNING.leftMax) return 'left';
  if (turn > RB_TUNING.rightMin) return 'right';
  return 'ahead';
}

/** Looking right before joining (rule 185). */
export function rbObservationCheck(): Check {
  return {
    id: 'rb-observation',
    onEvent(ev, ctx) {
      if (ev.type !== 'rbEnter') return null;
      return ev.t - ctx.lastShoulder.right > RB_TUNING.lookWindowS ? 'rb-observation' : null;
    }
  };
}

/** Signals and lane choice (rule 186), judged once we know which exit was taken. */
export function rbSignalCheck(): Check {
  return {
    id: 'rb-signals',
    onEvent(ev) {
      if (ev.type !== 'rbExit') return null;
      const out: FaultCode[] = [];
      const kind = exitKind(ev.turn);
      const expected = kind === 'left' ? 'left' : kind === 'right' ? 'right' : 'off';
      if (ev.signalAtEntry !== expected) out.push('rb-signal-approach');
      // On a mini there's little time to signal off; on full-size roundabouts signal left to leave.
      if (!ev.mini && ev.signalAtExit !== 'left') out.push('rb-signal-exit');
      if (ev.lane === 'left' && kind === 'right') out.push('rb-lane');
      if (ev.lane === 'right' && kind === 'left') out.push('rb-lane');
      return out.length ? out : null;
    }
  };
}

export function rbWrongWayCheck(): Check {
  let wrong = 0;
  let flagged = false;
  return {
    id: 'rb-wrong-way',
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      wrong = ev.rbWrongWay ? wrong + ev.dt : 0;
      if (wrong > RB_TUNING.wrongWaySustainS && !flagged) {
        flagged = true;
        return 'rb-wrong-way';
      }
      if (!ev.rbWrongWay) flagged = false;
      return null;
    }
  };
}

export function miniCentreCheck(): Check {
  let last: string | null = null;
  return {
    id: 'mini-centre',
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      const now = ev.onMiniCentre ?? null;
      const hit = now && now !== last;
      last = now;
      return hit ? 'mini-centre' : null;
    }
  };
}

/** Pulling onto a roundabout in front of circulating traffic (rule 185). */
export function rbConflictCheck(): Check {
  const last = new Map<string, number>();
  return {
    id: 'rb-conflict',
    onEvent(ev) {
      if (ev.type !== 'conflict' || !ev.roundabout) return null;
      if (ev.t - (last.get(ev.junction) ?? -Infinity) < 8) return null;
      if (ev.ttc < RB_TUNING.conflictDangerousS) {
        last.set(ev.junction, ev.t);
        return 'rb-pulled-out-dangerous';
      }
      if (ev.ttc < RB_TUNING.conflictSeriousS) {
        last.set(ev.junction, ev.t);
        return 'rb-pulled-out';
      }
      return null;
    }
  };
}

/** Town checks plus roundabouts (Week 2 onwards). Junction conflicts skip roundabout events. */
export function millTownChecks(): Check[] {
  const base = townChecks().map((c) => {
    if (c.id !== 'conflict') return c;
    return { id: c.id, onEvent: (ev, ctx) => (ev.type === 'conflict' && ev.roundabout ? null : c.onEvent(ev, ctx)) } as Check;
  });
  return [...base, rbObservationCheck(), rbSignalCheck(), rbWrongWayCheck(), miniCentreCheck(), rbConflictCheck(), ...streetChecks(), ...manoeuvreChecks()];
}
