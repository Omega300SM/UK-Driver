import type { FaultCode } from '../faults';
import type { Check } from './index';
import { millTownChecks } from './roundabout';

/** Tuning for Week 3 (game design; see NEEDS_REVIEW.md). */
export const FAST_TUNING = {
  /** Two-second rule (rule 126), doubled in the wet (rule 227). */
  gapDryS: 2,
  gapWetS: 4,
  /** Well under a second is a serious fault. */
  gapSeriousS: 0.9,
  tailgateSustainS: 3,
  /** Sitting in an outer lane with the left lane clear (rules 137, 264). */
  hogS: 15,
  /** Lights off in the dark or in fog (rules 113, 226). */
  lightsGraceS: 4,
  dazzleS: 2.5,
  /** Over a bend's advisory speed by this much (mph) for a second (rule 154). */
  bendOverMph: 5,
  /** Mirror check before changing lanes (rule 133). */
  laneMirrorS: 6,
  /** Joining from a slip road (rule 259). */
  mergeTtcSeriousS: 1.6,
  mergeGapAheadM: 6,
  mergeSlowMph: 40
};

const mph = (mps: number) => mps * 2.236936;

/** Following distance: the two-second rule, doubled in the wet (rules 126, 227). */
export function followingCheck(): Check {
  let close = 0;
  let veryClose = 0;
  let flagged = false;
  return {
    id: 'following',
    onEvent(ev) {
      if (ev.type !== 'tick' || ev.followGapS === undefined) return null;
      const g = ev.followGapS;
      const need = ev.wet ? FAST_TUNING.gapWetS : FAST_TUNING.gapDryS;
      close = g !== null && g < need * 0.85 ? close + ev.dt : 0;
      veryClose = g !== null && g < FAST_TUNING.gapSeriousS ? veryClose + ev.dt : 0;
      if (g === null || g > need) flagged = false;
      if (flagged) return null;
      if (veryClose > 2) {
        flagged = true;
        return 'tailgating-serious';
      }
      if (close > FAST_TUNING.tailgateSustainS) {
        flagged = true;
        return ev.wet ? 'tailgating-wet' : 'tailgating';
      }
      return null;
    }
  };
}

/** Changing lanes: mirror and signal first (rule 133). */
export function laneChangeCheck(): Check {
  return {
    id: 'lane-change',
    onEvent(ev, ctx) {
      if (ev.type !== 'laneChange') return null;
      const out: FaultCode[] = [];
      const mirror = Math.max(ctx.lastMirror.interior, ev.dir === 'left' ? ctx.lastMirror.left : ctx.lastMirror.right);
      if (ev.t - mirror > FAST_TUNING.laneMirrorS) out.push('lane-change-mirror');
      if (ctx.signal !== ev.dir) out.push('lane-change-signal');
      return out.length ? out : null;
    }
  };
}

/** Joining from a slip road (rule 259). */
export function mergeCheck(): Check {
  return {
    id: 'merge',
    onEvent(ev) {
      if (ev.type !== 'merge') return null;
      const out: FaultCode[] = [];
      if (ev.crossedSolid) out.push('slip-solid-line');
      if (ev.ttcBehind < FAST_TUNING.mergeTtcSeriousS || ev.gapAhead < FAST_TUNING.mergeGapAheadM) out.push('merge-cut-in');
      if (mph(ev.speed) < FAST_TUNING.mergeSlowMph) out.push('merge-slow');
      return out.length ? out : null;
    }
  };
}

/** Lane discipline (rules 137, 264): back to the left lane when you've finished overtaking. */
export function laneHogCheck(): Check {
  let hog = 0;
  let flagged = false;
  return {
    id: 'lane-hog',
    onEvent(ev) {
      if (ev.type !== 'tick' || ev.laneNo === undefined) return null;
      const hogging = (ev.laneNo ?? 1) >= 2 && !!ev.leftLaneClear && !ev.overtaking && ev.speed > 15;
      hog = hogging ? hog + ev.dt : 0;
      if (!hogging) flagged = false;
      if (hog > FAST_TUNING.hogS && !flagged) {
        flagged = true;
        return 'lane-hogging';
      }
      return null;
    }
  };
}

/** Sustained-condition faults from tick flags. */
function sustained(id: string, flag: (ev: Extract<import('../types').DriveEvent, { type: 'tick' }>) => boolean, after: number, code: FaultCode): Check {
  let on = 0;
  let flagged = false;
  return {
    id,
    onEvent(ev) {
      if (ev.type !== 'tick') return null;
      const f = flag(ev);
      on = f ? on + ev.dt : 0;
      if (!f) flagged = false;
      if (on > after && !flagged) {
        flagged = true;
        return code;
      }
      return null;
    }
  };
}

export function fastRoadChecks(): Check[] {
  return [
    followingCheck(),
    laneChangeCheck(),
    mergeCheck(),
    laneHogCheck(),
    sustained('hard-shoulder', (ev) => !!ev.inHardShoulder, 2, 'hard-shoulder'),
    sustained('red-x', (ev) => !!ev.inClosedLane, 0.5, 'red-x'),
    sustained('wrong-way', (ev) => !!ev.wrongWayCarriageway, 1, 'wrong-way'),
    sustained('motorway-stop', (ev) => !!ev.stoppedOnMotorway, 3, 'motorway-stop'),
    sustained('bend-speed', (ev) => ev.slowZoneMph != null && mph(Math.abs(ev.speed)) > ev.slowZoneMph + FAST_TUNING.bendOverMph, 1, 'bend-speed'),
    sustained('lights-dark', (ev) => !!ev.dark && ev.lights === 'off' && Math.abs(ev.speed) > 2, FAST_TUNING.lightsGraceS, 'no-lights-dark'),
    sustained('lights-fog', (ev) => !!ev.poorVisibility && !ev.dark && ev.lights === 'off' && Math.abs(ev.speed) > 2, FAST_TUNING.lightsGraceS, 'no-lights-fog'),
    sustained('dazzle', (ev) => !!ev.dazzling, FAST_TUNING.dazzleS, 'dazzle'),
    {
      id: 'undertake',
      onEvent: (ev) => (ev.type === 'undertake' ? 'undertake' : null)
    },
    {
      id: 'motorway-reverse',
      onEvent: (ev) => (ev.type === 'motorwayReverse' ? 'motorway-reverse' : null)
    }
  ];
}

/** Week 3 (the Devon Run): everything from town plus fast roads. */
export function devonChecks(): Check[] {
  return [...millTownChecks(), ...fastRoadChecks()];
}
