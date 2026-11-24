export type Severity = 'minor' | 'serious' | 'dangerous';
export type MirrorId = 'interior' | 'left' | 'right';
export type Side = 'left' | 'right';
export type SignalState = Side | 'off';
export type Gear = 'P' | 'R' | 'D';

/** Events emitted by the sim/controls and consumed by the rules engine. Times are seconds. */
export type DriveEvent =
  | { type: 'mirror'; t: number; which: MirrorId }
  | { type: 'shoulder'; t: number; side: Side }
  | { type: 'signal'; t: number; state: SignalState }
  | { type: 'seatbelt'; t: number; on: boolean }
  | { type: 'handbrake'; t: number; on: boolean }
  | { type: 'gear'; t: number; gear: Gear }
  | { type: 'horn'; t: number; speed: number }
  | {
      type: 'moveOff';
      t: number;
      /** Moving off from a parked position (at the kerb or with the handbrake on), not pulling away in traffic. */
      fromParked?: boolean;
    }
  | { type: 'stop'; t: number }
  | { type: 'kerb'; t: number; speed: number }
  | { type: 'collision'; t: number; speed: number; what: string }
  | {
      type: 'tick';
      t: number;
      dt: number;
      /** m/s, signed (negative = reversing). */
      speed: number;
      /** m/s² (negative = slowing). */
      accel: number;
      limitMph: number;
      /** Heading in radians. */
      heading: number;
      /** Distance travelled since the last tick (m). */
      dist: number;
      /** +ve when the car centre is on the wrong side of a lane centre line (m); null when no lane. */
      wrongSideBy: number | null;
      handbrake: boolean;
      throttle: number;
      /** Town-only situation facts (computed by the drive screen from the layout and traffic). */
      passingObstruction?: boolean;
      /** Distance to an oncoming car while passing an obstruction on your side (m). */
      oncomingM?: number | null;
      /** Gap between your car's side and a parked vehicle you're passing (m). */
      clearance?: number | null;
      /** On a road section with a solid white line nearest you. */
      inDoubleWhite?: boolean;
      /** Driving into a no-entry road. */
      inNoEntry?: boolean;
      /** Well below the limit on a clear road with no reason to be slow. */
      undulySlow?: boolean;
      /** On or near a roundabout (signals there are judged by rule 186, not "cancel after use"). */
      onRoundabout?: boolean;
      /** Going anticlockwise on a roundabout. */
      rbWrongWay?: boolean;
      /** On the painted centre of a mini-roundabout (id), if any. */
      onMiniCentre?: string | null;
      /** Driving along a bus lane during its hours (rule 141). */
      inBusLane?: boolean;
    }
  | {
      /** The front of the car crossed a stop line at signals or a pedestrian crossing. */
      type: 'stopLine';
      t: number;
      line: string;
      /** 'signals' for a junction; otherwise the crossing kind. */
      kind: 'signals' | 'zebra' | 'pelican' | 'puffin' | 'toucan';
      /** What the lights showed (null at a zebra). */
      aspect: 'green' | 'amber' | 'red' | 'redAmber' | 'flashAmber' | null;
      /** Distance (m) from the line when the lights turned amber, and our speed then (m/s). */
      amberAt: { dist: number; speed: number } | null;
      /** People on the crossing, and whether any were in or close to our path. */
      pedsOn: number;
      pedInPath: boolean;
      /** Someone waiting at the kerb of a zebra. */
      pedWaiting: boolean;
    }
  | {
      /** Stopped with part of the car on a pedestrian crossing (rule 192). */
      type: 'blockCrossing';
      t: number;
      crossing: string;
    }
  | {
      /** Stopped inside a yellow box junction (rule 174). */
      type: 'boxStop';
      t: number;
      box: string;
      signal: SignalState;
    }
  | {
      /** Crossed the give way line onto a roundabout. */
      type: 'rbEnter';
      t: number;
      rb: string;
      arm: string;
      signal: SignalState;
      /** For two-lane entries: which lane the car entered from. */
      lane: 'left' | 'right' | null;
      mini: boolean;
    }
  | {
      /** Left a roundabout. turn = angle travelled round (rad): ~π/2 first exit, ~π ahead, ~3π/2 right. */
      type: 'rbExit';
      t: number;
      rb: string;
      fromArm: string;
      toArm: string;
      turn: number;
      signalAtEntry: SignalState;
      signalAtExit: SignalState;
      lane: 'left' | 'right' | null;
      mini: boolean;
    }
  | {
      /** A completed turn (heading changed by roughly 90°). */
      type: 'turn';
      t: number;
      dir: Side;
      /** When the turn started (s). */
      startT: number;
      /** Indicator state when the turn started. */
      signalAtStart: SignalState;
    }
  | {
      /** The front of the car crossed a junction's give way or stop line. */
      type: 'emerge';
      t: number;
      junction: string;
      kind: 'giveway' | 'stop';
      /** Lowest speed (m/s) in the last few metres before the line. */
      minSpeed: number;
    }
  | {
      /** You were in another car's path at a junction. ttc = seconds before it would have reached you. */
      type: 'conflict';
      t: number;
      ttc: number;
      junction: string;
      /** Roundabout conflicts are judged under rule 185. */
      roundabout?: boolean;
    }
  | {
      type: 'finish';
      t: number;
      handbrake: boolean;
      gear: Gear;
      /** Where the car was pulled up, when the lesson asked for a pull-up on the left. */
      pullUp?: { onYellow: 'double' | 'single' | null; nearJunctionM: number | null; onDoubleWhite: boolean; kerbGap: number; onZigzag?: boolean; inBusLane?: boolean };
    };

export interface Fault {
  code: string;
  severity: Severity;
  /** DVSA-style category, e.g. "Observation – moving off". */
  category: string;
  /** What Maggie says about it (kind, specific). */
  message: string;
  /** Highway Code rule numbers. */
  rules: number[];
  t: number;
}

export type MPS = number;
export const MPH_PER_MPS = 2.236936;
export const mph = (mps: MPS) => Math.abs(mps) * MPH_PER_MPS;
