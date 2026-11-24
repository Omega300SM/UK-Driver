/**
 * Pure scene-layout model shared by the 3D builders, the car physics,
 * the rules engine, the AI traffic and the 2D replay renderer. No Three.js.
 *
 * Units are metres; +x and +z are map axes. The car's heading h gives a
 * forward vector (sin h, cos h). Because we drive on the left:
 *   heading +x (h = π/2)  → the left-hand lane is at lower z
 *   heading −x (h = −π/2) → the left-hand lane is at higher z
 *   heading +z (h = 0)    → the left-hand lane is at higher x
 *   heading −z (h = π)    → the left-hand lane is at lower x
 */

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export interface Marker extends Rect {
  id: string;
  label: string;
}

export interface SpeedZone extends Rect {
  mph: number;
  name: string;
}

export interface Obstacle extends Rect {
  kind: 'car' | 'shelter' | 'gate' | 'bollard' | 'van' | 'pedestrian';
  color?: number;
}

/** A straight road (or road section) with a centre line along one axis. */
export interface Lane extends Rect {
  axis: 'x' | 'z';
  /** Centre-line coordinate (z for axis 'x', x for axis 'z'). */
  centre: number;
  name?: string;
}

export type LineKind = 'centre' | 'hazard' | 'double-solid' | 'edge' | 'giveway' | 'stop' | 'double-yellow' | 'single-yellow';

/** A painted line from (x0,z0) to (x1,z1). */
export interface Marking {
  kind: LineKind;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export type SignKind =
  | 'limit'
  | 'nsl'
  | 'zone20'
  | 'zone20-end'
  | 'giveway'
  | 'stop'
  | 'no-entry'
  | 'warn-tjunction'
  | 'warn-narrows'
  | 'warn-giveway-ahead'
  | 'camera'
  | 'no-waiting'
  | 'warn-roundabout'
  | 'mini-roundabout'
  | 'roundabout-map'
  | 'warn-signals'
  | 'warn-pedestrians'
  | 'bus-lane'
  | 'name';

/** Data for an advance direction ("map") sign: the roundabout drawn from the driver's point of view. */
export interface RoundaboutMap {
  /** Arms relative to the driver: 0 = ahead, −90 = left, 90 = right (degrees). */
  exits: Array<{ rel: number; label: string }>;
}

export interface SignPlacement {
  kind: SignKind;
  x: number;
  z: number;
  /** Heading of a driver who should read it (the sign faces them). */
  faces: number;
  value?: number;
  text?: string;
  size?: number;
  map?: RoundaboutMap;
}

export interface Junction {
  id: string;
  kind: 'giveway' | 'stop';
  /** The line across the side road's approach lane. */
  line: Rect;
  /** Heading of traffic approaching the line from the side road. */
  approach: number;
  /** Area where side and main roads meet (for traffic-conflict checks). */
  box: Rect;
  /** Name of the main road, for Maggie's directions. */
  main: string;
}

/** One arm of a roundabout: a road leaving the centre in direction `angle` (a heading). */
export interface RoundaboutArm {
  id: string;
  angle: number;
  name: string;
  /** Lanes entering the roundabout from this arm (1 or 2). */
  entryLanes?: 1 | 2;
}

/**
 * A roundabout. Traffic circulates clockwise as seen from above (in this
 * world that means heading = θ − π/2 at polar angle θ, island on your right).
 */
export interface Roundabout {
  id: string;
  name: string;
  x: number;
  z: number;
  /** Raised central island radius (blocked), or the painted circle for a mini. */
  island: number;
  /** Outer edge of the circulatory carriageway. */
  outer: number;
  /** Mini-roundabout: the centre is painted and you MUST pass round it (rule 188). */
  mini?: boolean;
  /** Circulatory lanes (2 = multi-lane / spiral markings). */
  lanes: 1 | 2;
  spiral?: boolean;
  arms: RoundaboutArm[];
}

/** A directed AI path (lane centre line). Paths join where one ends and another starts. */
export interface AiPath {
  id: string;
  points: Array<[number, number]>;
  /** Give way before starting this path (roundabout entry). */
  yieldTo?: string;
  /** AI cars may be created at the start of this path. */
  spawn?: boolean;
  /** Give way before starting this path (joining a main road from a side road). */
  giveWay?: boolean;
}

/**
 * A line traffic must stop behind when a signal (or a pedestrian on a
 * crossing) says so. (x, z) is the middle of the line in the lane it
 * controls; traffic heading `heading` stops before it.
 */
export interface StopLine {
  id: string;
  x: number;
  z: number;
  heading: number;
  /** Signal controller and group (traffic lights / signal-controlled crossings). */
  signal?: { controller: string; group: string };
  /** Pedestrian crossing this line protects. */
  crossing?: string;
}

export type CrossingKind = 'zebra' | 'pelican' | 'puffin' | 'toucan';

/** A pedestrian crossing across a straight road. */
export interface Crossing {
  id: string;
  kind: CrossingKind;
  name: string;
  /** The striped / studded walking area across the carriageway. */
  area: Rect;
  /** Axis of the road it crosses ('x' = road runs along x, people walk along z). */
  axis: 'x' | 'z';
  /** Signal controller for pelican / puffin / toucan crossings. */
  controller?: string;
  /** Zig-zag areas either side (no stopping, no overtaking: rule 191). */
  zigzag: Rect[];
}

/** Traffic signals: a junction (two groups that take turns) or a signal-controlled crossing. */
export interface SignalController {
  id: string;
  kind: 'junction' | CrossingKind;
  /** Traffic groups, e.g. ['ew', 'ns'] at a crossroads or ['road'] at a crossing. */
  groups: string[];
  /** Signal heads to draw: position, the heading of drivers who read it, and its group. */
  heads: Array<{ x: number; z: number; faces: number; group: string }>;
}

/** Yellow criss-cross box (rule 174). */
export interface BoxJunction extends Rect {
  id: string;
}

/** A bus lane (rule 141): traffic heading `heading` should keep out. */
export interface BusLane extends Rect {
  heading: number;
  hours: string;
}

export interface SceneLayout {
  name: string;
  drivable: Rect[];
  pavements: Rect[];
  obstacles: Obstacle[];
  markers: Marker[];
  speedZones: SpeedZone[];
  lanes: Lane[];
  start: { x: number; z: number; heading: number };
  bays: Array<{ x: number; z: number; w: number; d: number }>;
  markings?: Marking[];
  signs?: SignPlacement[];
  junctions?: Junction[];
  /** Road sections where the line nearest you is solid (rule 129). */
  doubleWhite?: Rect[];
  /** Kerb-side yellow lines, for "where may I stop?" checks. */
  yellow?: Array<Rect & { kind: 'double' | 'single' }>;
  /** Areas you must not drive into (rule 109). */
  noEntry?: Array<Rect & { into: number }>;
  /** Corners where the road itself bends (no turn signal needed). */
  bends?: Rect[];
  roundabouts?: Roundabout[];
  /** Lane centre lines for path-following AI (scenes without them use straight-lane AI). */
  aiPaths?: AiPath[];
  stopLines?: StopLine[];
  crossings?: Crossing[];
  signals?: SignalController[];
  boxes?: BoxJunction[];
  busLanes?: BusLane[];
}

/** Polar angle of (x, z) about a roundabout centre, in the same convention as headings. */
export function polarAngle(rb: { x: number; z: number }, x: number, z: number): number {
  return Math.atan2(x - rb.x, z - rb.z);
}

export function distTo(rb: { x: number; z: number }, x: number, z: number): number {
  return Math.hypot(x - rb.x, z - rb.z);
}

/** Roundabout whose carriageway (or a margin around it) contains the point. */
export function roundaboutAt(layout: SceneLayout, x: number, z: number, margin = 0): Roundabout | null {
  for (const rb of layout.roundabouts ?? []) if (distTo(rb, x, z) <= rb.outer + margin) return rb;
  return null;
}

/** Can tyres be here? Road rects or roundabout rings, but never on a raised island. */
export function isDrivable(layout: SceneLayout, x: number, z: number): boolean {
  for (const rb of layout.roundabouts ?? []) {
    const d = distTo(rb, x, z);
    if (!rb.mini && d < rb.island) return false;
    if (d <= rb.outer) return true;
  }
  return layout.drivable.some((r) => inRect(r, x, z));
}

/** Heading of clockwise circulation at a point on a roundabout. */
export function circulationHeading(rb: Roundabout, x: number, z: number): number {
  return polarAngle(rb, x, z) - Math.PI / 2;
}

export function inRect(r: Rect, x: number, z: number): boolean {
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}

export function grow(r: Rect, by: number): Rect {
  return { x0: r.x0 - by, x1: r.x1 + by, z0: r.z0 - by, z1: r.z1 + by };
}

export function speedLimitAt(layout: SceneLayout, x: number, z: number): number {
  for (const zone of layout.speedZones) if (inRect(zone, x, z)) return zone.mph;
  return 30;
}

export function markerAt(layout: SceneLayout, x: number, z: number): string | null {
  for (const m of layout.markers) if (inRect(m, x, z)) return m.id;
  return null;
}

export function junctionBoxAt(layout: SceneLayout, x: number, z: number): Junction | null {
  for (const j of layout.junctions ?? []) if (inRect(j.box, x, z)) return j;
  return null;
}

/**
 * How far the car centre is over to the wrong (right-hand) side of the lane
 * it's on, in metres. Positive = wrong side. Null when not on a lane, in a
 * junction box, or heading across the road.
 */
export function wrongSideBy(layout: SceneLayout, x: number, z: number, heading: number): number | null {
  if (junctionBoxAt(layout, x, z)) return null;
  if (roundaboutAt(layout, x, z, 14)) return null; // approaches and the roundabout itself are judged separately
  for (const lane of layout.lanes) {
    if (!inRect(lane, x, z)) continue;
    const fx = Math.sin(heading);
    const fz = Math.cos(heading);
    if (lane.axis === 'x') {
      if (fx > 0.7) return z - lane.centre; // heading +x: left lane is lower z
      if (fx < -0.7) return lane.centre - z;
    } else {
      if (fz > 0.7) return lane.centre - x; // heading +z: left lane is higher x
      if (fz < -0.7) return x - lane.centre;
    }
    return null;
  }
  return null;
}

/** The lane rect the point is on (first match), if any. */
export function laneAt(layout: SceneLayout, x: number, z: number): Lane | null {
  for (const lane of layout.lanes) if (inRect(lane, x, z)) return lane;
  return null;
}
