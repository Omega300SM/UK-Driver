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
  | { type: 'moveOff'; t: number }
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
    }
  | { type: 'finish'; t: number; handbrake: boolean; gear: Gear };

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
