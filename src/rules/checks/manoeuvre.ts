import type { FaultCode } from '../faults';
import type { Check } from './index';

/** Tuning for parking manoeuvres (game design; see NEEDS_REVIEW.md). */
export const PARK_TUNING = {
  /** Looks (shoulder) and a mirror needed this recently before reversing (s). */
  reverseLookS: 6,
  angleMaxRad: 0.22,
  parallelKerbMaxM: 0.5
};

/** Rule 202: look all round before reversing. */
export function reverseObservationCheck(): Check {
  return {
    id: 'reverse-observation',
    onEvent(ev, ctx) {
      if (ev.type !== 'reverse') return null;
      const look = Math.max(ctx.lastShoulder.left, ctx.lastShoulder.right);
      const mirror = Math.max(ctx.lastMirror.interior, ctx.lastMirror.left, ctx.lastMirror.right);
      return ev.t - look > PARK_TUNING.reverseLookS || ev.t - mirror > PARK_TUNING.reverseLookS + 2 ? 'reverse-observation' : null;
    }
  };
}

/** Where the car finished a parking manoeuvre. */
export function parkingCheck(): Check {
  return {
    id: 'parking',
    onEvent(ev) {
      if (ev.type !== 'finish' || !ev.parked) return null;
      const p = ev.parked;
      const out: FaultCode[] = [];
      if (!p.inside) out.push('park-accuracy');
      if (p.angleErr > PARK_TUNING.angleMaxRad) out.push('park-angle');
      if (p.kind === 'parallel' && p.kerbGap !== null && p.kerbGap > PARK_TUNING.parallelKerbMaxM) out.push('park-parallel-kerb');
      return out.length ? out : null;
    }
  };
}

export function manoeuvreChecks(): Check[] {
  return [reverseObservationCheck(), parkingCheck()];
}
