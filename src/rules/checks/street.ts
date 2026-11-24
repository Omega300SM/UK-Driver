import type { FaultCode } from '../faults';
import type { Check } from './index';

/** Tuning for signals and crossings (game design; see NEEDS_REVIEW.md). */
export const STREET_TUNING = {
  /** Braking (m/s²) we expect a driver to manage when the lights turn amber. */
  amberDecel: 3.0,
  /** Extra metres of room before going on amber counts as a fault. */
  amberMarginM: 4,
  busLaneSustainS: 2
};

/** Traffic lights and signal-controlled crossings (rules 175, 176, 196, 198, 199) and zebras (rule 195). */
export function stopLineCheck(): Check {
  return {
    id: 'stop-line',
    onEvent(ev) {
      if (ev.type !== 'stopLine') return null;
      const out: FaultCode[] = [];
      if (ev.aspect === 'red' || ev.aspect === 'redAmber') out.push('red-light');
      if (ev.aspect === 'amber' && ev.amberAt) {
        const v = ev.amberAt.speed;
        const stopDist = (v * v) / (2 * STREET_TUNING.amberDecel);
        if (ev.amberAt.dist > stopDist + STREET_TUNING.amberMarginM) out.push('amber-light');
      }
      if (ev.kind === 'patrol') {
        // The patrol steps out with the sign whenever children are waiting or crossing (rule 210).
        if (ev.pedInPath) out.push('crossing-ped-dangerous');
        else if (ev.pedsOn > 0 || ev.pedWaiting) out.push('patrol-stop');
      } else if (ev.pedsOn > 0) {
        if (ev.pedInPath) out.push('crossing-ped-dangerous');
        else out.push(ev.kind === 'zebra' ? 'zebra-give-way' : ev.kind === 'informal' ? 'junction-ped' : 'crossing-ped');
      } else if (ev.kind === 'zebra' && ev.pedWaiting) out.push('zebra-waiting');
      else if (ev.kind === 'informal' && ev.pedWaiting) out.push('junction-ped-waiting');
      return out.length ? out : null;
    }
  };
}

export function blockCrossingCheck(): Check {
  return {
    id: 'block-crossing',
    onEvent(ev) {
      return ev.type === 'blockCrossing' ? 'crossing-blocked' : null;
    }
  };
}

/** Rule 174: waiting in the box is only allowed when turning right. */
export function boxJunctionCheck(): Check {
  return {
    id: 'box-junction',
    onEvent(ev) {
      return ev.type === 'boxStop' && ev.signal !== 'right' ? 'box-junction' : null;
    }
  };
}

export function busLaneCheck(): Check {
  let inLane = 0;
  let flagged = false;
  return {
    id: 'bus-lane',
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      inLane = ev.inBusLane ? inLane + ev.dt : 0;
      if (!ev.inBusLane) flagged = false;
      if (inLane > STREET_TUNING.busLaneSustainS && !flagged) {
        flagged = true;
        return 'bus-lane';
      }
      return null;
    }
  };
}

/** Pulling up on a crossing's zig-zags (rules 191, 240). */
export function zigzagPullUpCheck(): Check {
  return {
    id: 'zigzag-pull-up',
    onEvent(ev) {
      return ev.type === 'finish' && ev.pullUp?.onZigzag ? 'park-zigzag' : null;
    }
  };
}

/** Passing cyclists and horse riders (rules 163, 212, 215). */
export function passingCheck(): Check {
  return {
    id: 'passing-vulnerable',
    onEvent(ev) {
      if (ev.type !== 'passVulnerable') return null;
      const mph = ev.speed * 2.236936;
      if (ev.kind === 'horse') return ev.gap < VRU_TUNING.horseGapM || mph > VRU_TUNING.horseMaxMph ? 'pass-horse' : null;
      if (ev.gap < VRU_TUNING.cyclistDangerM) return 'pass-cyclist-dangerous';
      const need = mph > 30 ? VRU_TUNING.cyclistGapFastM : VRU_TUNING.cyclistGapM;
      return ev.gap < need ? 'pass-cyclist-close' : null;
    }
  };
}

/** Rule 163's guide distances, with a little allowance for the sim's precision. */
export const VRU_TUNING = {
  cyclistGapM: 1.4,
  cyclistGapFastM: 1.9,
  cyclistDangerM: 0.7,
  horseGapM: 1.9,
  horseMaxMph: 11
};

export function schoolPullUpCheck(): Check {
  return {
    id: 'school-pull-up',
    onEvent(ev) {
      return ev.type === 'finish' && ev.pullUp?.onSchoolZigzag ? 'park-school' : null;
    }
  };
}

export function streetChecks(): Check[] {
  return [stopLineCheck(), blockCrossingCheck(), boxJunctionCheck(), busLaneCheck(), zigzagPullUpCheck(), passingCheck(), schoolPullUpCheck()];
}
