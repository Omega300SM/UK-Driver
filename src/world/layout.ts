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
  kind: 'car' | 'shelter' | 'gate' | 'bollard' | 'van';
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
  | 'name';

export interface SignPlacement {
  kind: SignKind;
  x: number;
  z: number;
  /** Heading of a driver who should read it (the sign faces them). */
  faces: number;
  value?: number;
  text?: string;
  size?: number;
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
