/**
 * Pure layout data for the Day 1 scene (no Three.js). Shared by the 3D
 * builder, the car physics (kerbs/obstacles), the rules engine (markers,
 * speed zones) and the 2D replay renderer.
 *
 * Units: metres. +x is east. The car faces +x at the start. Because we drive
 * on the left, the left-hand side when heading east is −z.
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
  kind: 'car' | 'shelter' | 'gate' | 'bollard';
  color?: number;
}

export interface SceneLayout {
  name: string;
  /** Areas where tyres can go. Anything outside is kerb. */
  drivable: Rect[];
  /** Pavements (raised; drawn and treated as kerb). */
  pavements: Rect[];
  obstacles: Obstacle[];
  markers: Marker[];
  speedZones: SpeedZone[];
  /** Road sections with a centre line; used for keep-left checks. */
  lanes: Array<Rect & { axis: 'x'; centre: number }>;
  start: { x: number; z: number; heading: number };
  bays: Array<{ x: number; z: number; w: number; d: number }>;
}

const CAR_COLOURS = [0x2e5c8a, 0xb8352f, 0xe8e4da, 0x3c3f44, 0x6b8f3a, 0xd9a22e, 0x7a4f9a, 0x9aa3ab];

function bays(): SceneLayout['bays'] {
  const out: SceneLayout['bays'] = [];
  for (let x = -40; x <= 26; x += 2.6) {
    out.push({ x: x + 1.3, z: 13, w: 2.6, d: 6 });
    out.push({ x: x + 1.3, z: -13, w: 2.6, d: 6 });
  }
  return out;
}

function parkedCars(allBays: SceneLayout['bays']): Obstacle[] {
  // Deterministic sprinkling of parked cars, leaving the trolley shelter bays free.
  const cars: Obstacle[] = [];
  allBays.forEach((b, i) => {
    const nearShelter = b.z < 0 && b.x > 2 && b.x < 10;
    if (nearShelter) return;
    if ((i * 7) % 5 < 2) {
      cars.push({
        kind: 'car',
        x0: b.x - 0.9,
        x1: b.x + 0.9,
        z0: b.z - 2.1,
        z1: b.z + 2.1,
        color: CAR_COLOURS[(i * 3) % CAR_COLOURS.length]
      });
    }
  });
  return cars;
}

const allBays = bays();

export const CAR_PARK: SceneLayout = {
  name: 'Little Ashby Leisure Centre car park',
  drivable: [
    { x0: -42, x1: 30, z0: -16, z1: 16 },
    { x0: 29, x1: 150, z0: -5, z1: 5 }
  ],
  pavements: [
    { x0: 30, x1: 150, z0: -7.5, z1: -5 },
    { x0: 30, x1: 150, z0: 5, z1: 7.5 }
  ],
  obstacles: [
    ...parkedCars(allBays),
    { kind: 'shelter', x0: 3, x1: 9, z0: -15.5, z1: -11 },
    { kind: 'gate', x0: 148, x1: 150, z0: -5, z1: 5 }
  ],
  markers: [
    { id: 'A', label: 'Trolley shelter', x0: 2, x1: 10, z0: -9.5, z1: -4.5 },
    { id: 'B', label: 'Post box, Church Lane', x0: 96, x1: 112, z0: -4.8, z1: -0.8 }
  ],
  speedZones: [
    { name: 'Car park', mph: 10, x0: -42, x1: 30, z0: -16, z1: 16 },
    { name: 'Church Lane', mph: 20, x0: 30, x1: 150, z0: -8, z1: 8 }
  ],
  lanes: [{ axis: 'x', centre: 0, x0: 34, x1: 148, z0: -5, z1: 5 }],
  start: { x: -34, z: -7.6, heading: Math.PI / 2 },
  bays: allBays
};

export function inRect(r: Rect, x: number, z: number): boolean {
  return x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
}

export function speedLimitAt(layout: SceneLayout, x: number, z: number): number {
  for (const zone of layout.speedZones) if (inRect(zone, x, z)) return zone.mph;
  return 30;
}

export function markerAt(layout: SceneLayout, x: number, z: number): string | null {
  for (const m of layout.markers) if (inRect(m, x, z)) return m.id;
  return null;
}
