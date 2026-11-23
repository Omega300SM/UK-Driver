import type { FaultCode } from '../faults';
import { day1Checks, type Check } from './index';

/** Tuning values for town checks (game design; see NEEDS_REVIEW.md). */
export const TOWN_TUNING = {
  turnMirrorWindowS: 8,
  junctionLookWindowS: 8,
  stopMaxMps: 0.25,
  conflictSeriousS: 2.2,
  conflictDangerousS: 1.0,
  meetingMinorM: 35,
  meetingSeriousM: 15,
  clearanceMinM: 0.7,
  clearanceMinSpeed: 2,
  slowSustainS: 10,
  kerbFarM: 1.2
};

export function turnCheck(): Check {
  return {
    id: 'turn',
    onEvent(ev, ctx) {
      if (ev.type !== 'turn') return null;
      const out: FaultCode[] = [];
      if (ev.signalAtStart === 'off') out.push('turn-no-signal');
      else if (ev.signalAtStart !== ev.dir) out.push('turn-wrong-signal');
      // Mirrors count if checked shortly before the turn, or before the signal
      // that was on for it (MSM on the approach; a wait at a junction is fine).
      const mirrorT = Math.max(ctx.lastMirror.interior, ctx.lastMirror[ev.dir]);
      const signalledSince = ev.signalAtStart === ev.dir ? ctx.signalSince : Infinity;
      const okFrom = Math.min(ev.startT - TOWN_TUNING.turnMirrorWindowS, signalledSince - TOWN_TUNING.turnMirrorWindowS);
      if (mirrorT < okFrom) out.push('turn-no-mirror');
      return out.length ? out : null;
    }
  };
}

export function junctionCheck(): Check {
  return {
    id: 'junction',
    onEvent(ev, ctx) {
      if (ev.type !== 'emerge') return null;
      const out: FaultCode[] = [];
      if (ev.kind === 'stop' && ev.minSpeed > TOWN_TUNING.stopMaxMps) out.push('stop-not-stopped');
      const w = TOWN_TUNING.junctionLookWindowS;
      if (ev.t - ctx.lastShoulder.right > w || ev.t - ctx.lastShoulder.left > w) out.push('junction-observation');
      return out.length ? out : null;
    }
  };
}

export function conflictCheck(): Check {
  const last = new Map<string, number>();
  return {
    id: 'conflict',
    onEvent(ev) {
      if (ev.type !== 'conflict') return null;
      if (ev.t - (last.get(ev.junction) ?? -Infinity) < 8) return null;
      if (ev.ttc < TOWN_TUNING.conflictDangerousS) {
        last.set(ev.junction, ev.t);
        return 'junction-pulled-out-dangerous';
      }
      if (ev.ttc < TOWN_TUNING.conflictSeriousS) {
        last.set(ev.junction, ev.t);
        return 'junction-pulled-out';
      }
      return null;
    }
  };
}

/** Passing parked cars on your side: give way to oncoming traffic (rule 163) and leave door room. */
export function obstructionCheck(): Check {
  let meetingLevel = 0;
  let clearanceFlagged = false;
  let notPassingFor = 0;
  return {
    id: 'obstruction',
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      if (!ev.passingObstruction) {
        notPassingFor += ev.dt;
        if (notPassingFor > 2) {
          meetingLevel = 0;
          clearanceFlagged = false;
        }
        return null;
      }
      notPassingFor = 0;
      const out: FaultCode[] = [];
      const on = ev.oncomingM;
      if (on !== null && on !== undefined && Math.abs(ev.speed) > 0.5) {
        if (on < TOWN_TUNING.meetingSeriousM && meetingLevel < 2) {
          meetingLevel = 2;
          out.push('meeting-serious');
        } else if (on < TOWN_TUNING.meetingMinorM && meetingLevel < 1) {
          meetingLevel = 1;
          out.push('meeting');
        }
      }
      if (!clearanceFlagged && ev.clearance !== null && ev.clearance !== undefined && ev.clearance < TOWN_TUNING.clearanceMinM && Math.abs(ev.speed) > TOWN_TUNING.clearanceMinSpeed) {
        clearanceFlagged = true;
        out.push('clearance');
      }
      return out.length ? out : null;
    }
  };
}

export function doubleWhiteCheck(): Check {
  let lastT = -Infinity;
  return {
    id: 'double-white',
    onEvent(ev) {
      if (ev.type !== 'tick' || !ev.inDoubleWhite || ev.passingObstruction) return null;
      if (ev.wrongSideBy !== null && ev.wrongSideBy > 0.1 && ev.t - lastT > 10) {
        lastT = ev.t;
        return 'double-white';
      }
      return null;
    }
  };
}

export function noEntryCheck(): Check {
  let flagged = false;
  return {
    id: 'no-entry',
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      if (ev.inNoEntry && !flagged) {
        flagged = true;
        return 'no-entry';
      }
      return null;
    }
  };
}

export function progressCheck(): Check {
  let slow = 0;
  let lastT = -Infinity;
  return {
    id: 'progress',
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      slow = ev.undulySlow ? slow + ev.dt : 0;
      if (slow > TOWN_TUNING.slowSustainS && ev.t - lastT > 30) {
        lastT = ev.t;
        slow = 0;
        return 'progress';
      }
      return null;
    }
  };
}

export function pullUpCheck(): Check {
  return {
    id: 'pull-up',
    onEvent(ev) {
      if (ev.type !== 'finish' || !ev.pullUp) return null;
      const p = ev.pullUp;
      const out: FaultCode[] = [];
      if (p.onYellow === 'double') out.push('park-double-yellow');
      else if (p.onYellow === 'single') out.push('park-single-yellow');
      if (p.nearJunctionM !== null && p.nearJunctionM < 10) out.push('park-junction');
      if (p.onDoubleWhite) out.push('park-double-white');
      if (p.kerbGap > TOWN_TUNING.kerbFarM) out.push('park-kerb-far');
      return out.length ? out : null;
    }
  };
}

/** Everything from Day 1 plus the town checks. */
export function townChecks(): Check[] {
  return [...day1Checks(), turnCheck(), junctionCheck(), conflictCheck(), obstructionCheck(), doubleWhiteCheck(), noEntryCheck(), progressCheck(), pullUpCheck()];
}
