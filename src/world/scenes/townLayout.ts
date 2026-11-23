/**
 * Little Ashby, a small Leicestershire market town (Week 1, Days 2–7).
 * Pure data; see src/world/layout.ts for axis and side conventions.
 *
 *  Ashby Road (NSL 60) ── 30 ── [20 zone] Market Street ───────────────
 *   x −420 … −200       −200…−60        −60 … 260   (main road, z = 0)
 *                   Tannery Rd (x=−160)   Mill Lane (x=40)    Church St (x=140, STOP)
 *                        │                    │      Sheep St (x=80, no entry)
 *                        └──── Back Lane (z = −300) ──┘
 *
 * Mill Lane, Tannery Road and Back Lane sit at negative z; Church Street and
 * Sheep Street at positive z. Heading +x you keep to the z < 0 lane.
 */
import type { Junction, Lane, Marking, Obstacle, Rect, SceneLayout, SignPlacement } from '../layout';

export const ROAD_HALF = 3.8;
export const LANE = 1.9;
export const PAVE = 2.6;

const E = Math.PI / 2; // heading +x
const W = -Math.PI / 2; // heading −x
const N = 0; // heading +z
const S = Math.PI; // heading −z

const H = ROAD_HALF;

// ---- Roads ---------------------------------------------------------------
export const MAIN: Lane = { name: 'Market Street', axis: 'x', centre: 0, x0: -420, x1: 260, z0: -H, z1: H };
export const MILL: Lane = { name: 'Mill Lane', axis: 'z', centre: 40, x0: 40 - H, x1: 40 + H, z0: -296.2, z1: -H };
export const CHURCH: Lane = { name: 'Church Street', axis: 'z', centre: 140, x0: 140 - H, x1: 140 + H, z0: H, z1: 170 };
export const BACK: Lane = { name: 'Back Lane', axis: 'x', centre: -300, x0: -156.2, x1: 120, z0: -300 - H, z1: -300 + H };
export const TANNERY: Lane = { name: 'Tannery Road', axis: 'z', centre: -160, x0: -160 - H, x1: -160 + H, z0: -296.2, z1: -H };
const SHEEP: Rect = { x0: 80 - H, x1: 80 + H, z0: H, z1: 90 };
const BEND: Rect = { x0: -160 - H, x1: -160 + H, z0: -300 - H, z1: -300 + H };

/** Kerb radius at junction corners, approximated by stepped rectangles of tarmac. */
export const CORNER_R = 5;
/**
 * Fillets for a side road along z meeting a road edge at z = edge. dir = +1 if
 * the side road runs towards +z from that edge, −1 if towards −z.
 */
function fillets(centreX: number, edge: number, dir: 1 | -1, r = CORNER_R, steps = 5): Rect[] {
  const out: Rect[] = [];
  for (let i = 0; i < steps; i++) {
    const d0 = (i * r) / steps;
    const d1 = ((i + 1) * r) / steps;
    // Quarter-circle profile: widening w at depth d.
    const dm = (d0 + d1) / 2;
    const w = r - Math.sqrt(Math.max(0, r * r - (r - dm) * (r - dm)));
    const za = edge + dir * d0;
    const zb = edge + dir * d1;
    const z0 = Math.min(za, zb);
    const z1 = Math.max(za, zb);
    out.push({ x0: centreX - H - w, x1: centreX - H, z0, z1 }, { x0: centreX + H, x1: centreX + H + w, z0, z1 });
  }
  return out;
}

const drivable: Rect[] = [
  MAIN,
  { ...MILL, z0: MILL.z0 - 0.6, z1: MILL.z1 + 0.6 },
  { ...CHURCH, z0: CHURCH.z0 - 0.6 },
  { ...BACK, x0: BACK.x0 - 0.6 },
  { ...TANNERY, z0: TANNERY.z0 - 0.6, z1: TANNERY.z1 + 0.6 },
  { ...SHEEP, z0: SHEEP.z0 - 0.6 },
  BEND,
  ...fillets(40, -H, -1),
  ...fillets(140, H, 1),
  ...fillets(-160, -H, -1),
  ...fillets(80, H, 1),
  ...fillets(40, -300 + H, 1),
  // Inside of the Tannery Road / Back Lane bend.
  ...fillets(-160, -300 + H, 1).filter((r) => r.x0 >= -160)
];

// ---- Pavements (raised kerbs), leaving gaps at junction mouths -----------
function strip(axis: 'x' | 'z', at0: number, at1: number, from: number, to: number, gaps: Array<[number, number]>): Rect[] {
  const out: Rect[] = [];
  let cur = from;
  for (const [g0, g1] of [...gaps].sort((a, b) => a[0] - b[0])) {
    if (g0 > cur) out.push(axis === 'x' ? { x0: cur, x1: g0, z0: at0, z1: at1 } : { x0: at0, x1: at1, z0: cur, z1: g0 });
    cur = Math.max(cur, g1);
  }
  if (cur < to) out.push(axis === 'x' ? { x0: cur, x1: to, z0: at0, z1: at1 } : { x0: at0, x1: at1, z0: cur, z1: to });
  return out;
}
const mouth = (c: number): [number, number] => [c - H - CORNER_R - 0.3, c + H + CORNER_R + 0.3];
const SIDE_START = H + CORNER_R + 0.3; // side-road pavements start beyond the corner radius

const pavements: Rect[] = [
  ...strip('x', -H - PAVE, -H, -200, 260, [mouth(40), mouth(-160)]),
  ...strip('x', H, H + PAVE, -200, 260, [mouth(140), mouth(80)]),
  ...strip('z', 40 - H - PAVE, 40 - H, -300 + SIDE_START, -SIDE_START, []),
  ...strip('z', 40 + H, 40 + H + PAVE, -300 + SIDE_START, -SIDE_START, []),
  ...strip('z', 140 - H - PAVE, 140 - H, SIDE_START, 170, []),
  ...strip('z', 140 + H, 140 + H + PAVE, SIDE_START, 170, []),
  ...strip('z', 80 - H - PAVE, 80 - H, SIDE_START, 90, []),
  ...strip('z', 80 + H, 80 + H + PAVE, SIDE_START, 90, []),
  ...strip('x', -300 + H, -300 + H + PAVE, -160 + SIDE_START, 120, [mouth(40)]),
  ...strip('x', -300 - H - PAVE, -300 - H, -166.4, 120, []),
  ...strip('z', -160 - H - PAVE, -160 - H, -306.4, -SIDE_START, []),
  ...strip('z', -160 + H, -160 + H + PAVE, -300 + SIDE_START, -SIDE_START, [])
];

// ---- Parked cars and vans ------------------------------------------------
const C = [0x2e5c8a, 0xb8352f, 0xe8e4da, 0x3c3f44, 0x6b8f3a, 0xd9a22e, 0x7a4f9a, 0x9aa3ab];
/** A car parked at the kerb of a lane. side: which kerb (low or high coordinate). */
function parkedOn(lane: Lane, along: number, side: 'low' | 'high', colour: number, kind: Obstacle['kind'] = 'car'): Obstacle {
  const len = kind === 'van' ? 5.2 : 4.2;
  const wid = kind === 'van' ? 2.0 : 1.8;
  const edge = side === 'low' ? lane.centre - H + 0.25 : lane.centre + H - 0.25;
  const c0 = side === 'low' ? edge : edge - wid;
  return lane.axis === 'x'
    ? { kind, color: colour, x0: along - len / 2, x1: along + len / 2, z0: c0, z1: c0 + wid }
    : { kind, color: colour, z0: along - len / 2, z1: along + len / 2, x0: c0, x1: c0 + wid };
}

const obstacles: Obstacle[] = [
  // Mill Lane, west kerb (southbound traffic's left).
  parkedOn(MILL, -118, 'low', C[0]),
  parkedOn(MILL, -170, 'low', C[1]),
  parkedOn(MILL, -176, 'low', C[2]),
  parkedOn(MILL, -183, 'low', C[5], 'van'),
  // Mill Lane, east kerb (northbound traffic's left).
  parkedOn(MILL, -232, 'high', C[3]),
  parkedOn(MILL, -238, 'high', C[6]),
  // Market Street.
  parkedOn(MAIN, 104, 'high', C[4]),
  parkedOn(MAIN, 110, 'high', C[7]),
  parkedOn(MAIN, 0, 'low', C[2]),
  parkedOn(MAIN, -6, 'low', C[0]),
  // Back Lane van.
  parkedOn(BACK, -80, 'low', 0xf4f1ea, 'van'),
  // Dead ends: walls (treated as obstacles so they read as solid).
  { kind: 'gate', x0: 136, x1: 144, z0: 169, z1: 171 },
  { kind: 'gate', x0: 119, x1: 121, z0: -304, z1: -296 },
  { kind: 'gate', x0: 76, x1: 84, z0: 89, z1: 91 }
];

// ---- Junctions -------------------------------------------------------------
const junctions: Junction[] = [
  {
    id: 'mill',
    kind: 'giveway',
    main: 'Market Street',
    approach: N,
    line: { x0: 40, x1: 40 + H, z0: -H - 0.6, z1: -H },
    box: { x0: 40 - H - 4, x1: 40 + H + 4, z0: -H, z1: H }
  },
  {
    id: 'church',
    kind: 'stop',
    main: 'Market Street',
    approach: S,
    line: { x0: 140 - H, x1: 140, z0: H, z1: H + 0.6 },
    box: { x0: 140 - H - 4, x1: 140 + H + 4, z0: -H, z1: H }
  },
  {
    id: 'tannery',
    kind: 'giveway',
    main: 'Ashby Road',
    approach: N,
    line: { x0: -160, x1: -160 + H, z0: -H - 0.6, z1: -H },
    box: { x0: -160 - H - 4, x1: -160 + H + 4, z0: -H, z1: H }
  },
  {
    id: 'back',
    kind: 'giveway',
    main: 'Back Lane',
    approach: S,
    line: { x0: 40 - H, x1: 40, z0: -300 + H, z1: -300 + H + 0.6 },
    box: { x0: 40 - H - 4, x1: 40 + H + 4, z0: -300 - H, z1: -300 + H }
  }
];

// ---- Markings --------------------------------------------------------------
const markings: Marking[] = [];
const seg = (kind: Marking['kind'], x0: number, z0: number, x1: number, z1: number) => markings.push({ kind, x0, z0, x1, z1 });
// Main road centre line: hazard lines near junctions and before the double whites.
const mainCentre: Array<[number, number, Marking['kind']]> = [
  [-420, -360, 'centre'],
  [-360, -300, 'hazard'],
  [-300, -200, 'centre'],
  [-200, -168, 'hazard'],
  [-152, -150, 'hazard'],
  [-150, -90, 'double-solid'],
  [-90, -60, 'hazard'],
  [-60, 20, 'centre'],
  [20, 60, 'hazard'],
  [60, 120, 'centre'],
  [120, 160, 'hazard'],
  [160, 260, 'centre']
];
for (const [a, b, k] of mainCentre) seg(k, a, 0, b, 0);
seg('edge', -420, -H + 0.25, -200, -H + 0.25);
seg('edge', -420, H - 0.25, -200, H - 0.25);
seg('centre', 40, -280, 40, -24);
seg('hazard', 40, -24, 40, -H);
seg('centre', 140, 20, 140, 160);
seg('hazard', 140, H, 140, 20);
seg('centre', -150, -300, 100, -300);
seg('centre', -160, -290, -160, -24);
seg('hazard', -160, -24, -160, -H);
// Give way (double broken) and stop (solid) lines.
for (const j of junctions) {
  const l = j.line;
  if (l.x1 - l.x0 > l.z1 - l.z0) {
    const zm = (l.z0 + l.z1) / 2;
    seg(j.kind === 'stop' ? 'stop' : 'giveway', l.x0, zm, l.x1, zm);
  } else {
    const xm = (l.x0 + l.x1) / 2;
    seg(j.kind === 'stop' ? 'stop' : 'giveway', xm, l.z0, xm, l.z1);
  }
}

// Kerb-side yellow lines (double = no waiting at any time; single = times on plates).
const yellow: Array<Rect & { kind: 'double' | 'single' }> = [];
/** Yellow line along a lane's kerb from `a` to `b` (along the lane axis). Also paints it. */
function yl(kind: 'double' | 'single', a: number, b: number, side: 'low' | 'high', lane: Lane = MAIN): void {
  const kerb = side === 'low' ? lane.centre - H : lane.centre + H;
  const paint = side === 'low' ? kerb + 0.25 : kerb - 0.25;
  const band0 = side === 'low' ? kerb : kerb - 1.6;
  const band1 = side === 'low' ? kerb + 1.6 : kerb;
  const mk = kind === 'double' ? 'double-yellow' : 'single-yellow';
  if (lane.axis === 'x') {
    yellow.push({ kind, x0: a, x1: b, z0: band0, z1: band1 });
    seg(mk, a, paint, b, paint);
  } else {
    yellow.push({ kind, z0: a, z1: b, x0: band0, x1: band1 });
    seg(mk, paint, a, paint, b);
  }
}
yl('single', -60, 20, 'high');
yl('double', 20, 100, 'high');
yl('double', 120, 160, 'high');
yl('double', 20, 60, 'low');
yl('single', 60, 130, 'low');
yl('double', -178, -142, 'low');
yl('double', -178, -142, 'high');
yl('double', -90, -60, 'high');
yl('double', -90, -60, 'low');
yl('double', -24, -H, 'low', MILL);
yl('double', -24, -H, 'high', MILL);
yl('double', H, 22, 'low', CHURCH);
yl('double', H, 22, 'high', CHURCH);

// ---- Signs -----------------------------------------------------------------
const signs: SignPlacement[] = [
  // Ashby Road: national speed limit ↔ 30, with camera warning.
  { kind: 'limit', value: 30, x: -200, z: -H - 1.6, faces: E },
  { kind: 'nsl', x: -200, z: H + 1.6, faces: W },
  { kind: 'camera', x: -186, z: -H - 1.6, faces: E },
  { kind: 'name', text: 'Little Ashby', x: -214, z: -H - 1.8, faces: E },
  // 20 zone gateway.
  { kind: 'zone20', x: -60, z: -H - 1.6, faces: E },
  { kind: 'zone20-end', x: -60, z: H + 1.6, faces: W },
  // Junction signs (on the side roads).
  { kind: 'giveway', x: 40 + H + 1.2, z: -H - 2.2, faces: N },
  { kind: 'warn-giveway-ahead', x: 40 + H + 1.2, z: -70, faces: N },
  { kind: 'stop', x: 140 - H - 1.2, z: H + 2.2, faces: S },
  { kind: 'giveway', x: -160 + H + 1.2, z: -H - 2.2, faces: N },
  { kind: 'giveway', x: 40 - H - 1.2, z: -300 + H + 2.2, faces: S },
  { kind: 'warn-tjunction', x: 40 - H - 1.2, z: -250, faces: S },
  // No entry: Sheep Street is one-way out onto Market Street.
  { kind: 'no-entry', x: 80 - H - 1.0, z: H + 1.6, faces: N },
  { kind: 'no-entry', x: 80 + H + 1.0, z: H + 1.6, faces: N },
  // Waiting restriction plates.
  { kind: 'no-waiting', x: 0, z: H + 1.4, faces: W, size: 0.5 },
  { kind: 'no-waiting', x: 90, z: -H - 1.4, faces: E, size: 0.5 },
  // Street names.
  { kind: 'name', text: 'Mill Lane', x: 40 - H - 1.2, z: -H - 3, faces: S },
  { kind: 'name', text: 'Church Street', x: 140 + H + 1.2, z: H + 3, faces: N },
  { kind: 'name', text: 'Tannery Road', x: -160 - H - 1.2, z: -H - 3, faces: S },
  { kind: 'name', text: 'Sheep Street', x: 80 + H + 1.2, z: H + 4.5, faces: N },
  { kind: 'name', text: 'Back Lane', x: 40 + H + 2, z: -300 + H + 1.2, faces: W }
];

// ---- Markers (pull-up spots and guided-drive zones) --------------------------
const markers = [
  { id: 'S1', label: 'Mill Lane, past the lamp post', x0: 40 - H, x1: 40 - H + 2.8, z0: -112, z1: -98 },
  { id: 'S2', label: 'Mill Lane, outside number 40', x0: 40 - H, x1: 40 - H + 2.8, z0: -160, z1: -144 },
  { id: 'S3', label: 'Mill Lane, before Back Lane', x0: 40 - H, x1: 40 - H + 2.8, z0: -280, z1: -262 },
  { id: 'C1', label: 'Church Street, by the green', x0: 140 + H - 2.8, x1: 140 + H, z0: 30, z1: 48 },
  // "Pull up somewhere safe and legal": deliberately not drawn (its outline would look like
  // yellow lines, and choosing the spot is the point of the exercise).
  { id: 'P5', label: '', x0: -205, x1: -60, z0: 0.6, z1: H },
  { id: 'T4', label: 'Mill Lane', x0: 40 - H, x1: 40 - H + 2.8, z0: -112, z1: -60 },
  // Zones used to time guided-drive prompts (never drawn).
  { id: 'mill-approach', label: '', x0: 40, x1: 40 + H, z0: -34, z1: -H },
  { id: 'mill-line', label: '', x0: 40, x1: 40 + H, z0: -12, z1: -H },
  { id: 'church-approach', label: '', x0: 112, x1: 136, z0: -H, z1: 0 },
  { id: 'church-in', label: '', x0: 136.2, x1: 143.8, z0: 8, z1: 30 },
  { id: 'narrow', label: '', x0: 36.2, x1: 43.8, z0: -165, z1: -130 },
  { id: 'narrow-passed', label: '', x0: 36.2, x1: 43.8, z0: -215, z1: -192 },
  { id: 'nsl', label: '', x0: -420, x1: -205, z0: -H, z1: H },
  { id: 'thirty', label: '', x0: -195, x1: -70, z0: -H, z1: H },
  { id: 'zone', label: '', x0: -55, x1: 30, z0: -H, z1: H },
  // Day 5 sign safari (westbound on Market Street / Ashby Road).
  { id: 'd5-church', label: '', x0: 145, x1: 185, z0: 0, z1: H },
  { id: 'd5-sheep', label: '', x0: 112, x1: 135, z0: 0, z1: H },
  { id: 'd5-zone-end', label: '', x0: -62, x1: -30, z0: 0, z1: H },
  { id: 'd5-double-white', label: '', x0: -100, x1: -80, z0: 0, z1: H },
  { id: 'd5-pull-up', label: '', x0: -150, x1: -138, z0: 0, z1: H },
  // Mill Lane northbound, approaching the parked cars on the left (Day 7).
  { id: 'mill-north-low', label: '', x0: 40, x1: 40 + H, z0: -300, z1: -270 }
];

export const TOWN: SceneLayout = {
  name: 'Little Ashby',
  drivable,
  pavements,
  obstacles,
  markers,
  speedZones: [
    { name: 'Market Street 20 zone', mph: 20, x0: -60, x1: 262, z0: -8, z1: 8 },
    { name: 'Church Street 20 zone', mph: 20, x0: 130, x1: 150, z0: 3.8, z1: 175 },
    { name: 'Sheep Street 20 zone', mph: 20, x0: 70, x1: 90, z0: 3.8, z1: 95 },
    { name: 'Ashby Road', mph: 30, x0: -200, x1: -60, z0: -8, z1: 8 },
    { name: 'Ashby Road (national speed limit)', mph: 60, x0: -425, x1: -200, z0: -8, z1: 8 },
    { name: 'Mill Lane', mph: 30, x0: 30, x1: 50, z0: -310, z1: -3.8 },
    { name: 'Tannery Road', mph: 30, x0: -170, x1: -150, z0: -310, z1: -3.8 },
    { name: 'Back Lane', mph: 30, x0: -170, x1: 125, z0: -310, z1: -290 }
  ],
  lanes: [MAIN, MILL, CHURCH, BACK, TANNERY],
  start: { x: 40 - H + 1.15, z: -40, heading: S },
  bays: [],
  markings,
  signs,
  junctions,
  doubleWhite: [{ x0: -150, x1: -90, z0: -H, z1: H }],
  yellow,
  noEntry: [{ ...SHEEP, z0: H + 0.8, into: N }],
  bends: [{ x0: -180, x1: -140, z0: -320, z1: -268 }]
};

/** Kerb-side parking positions for starts (heading, and where the car sits). */
export const STARTS = {
  millSouth: (z: number) => ({ x: 40 - H + 1.15, z, heading: S }),
  millNorth: (z: number) => ({ x: 40 + H - 1.15, z, heading: N }),
  churchSouth: (z: number) => ({ x: 140 - H + 1.15, z, heading: S }),
  mainEast: (x: number) => ({ x, z: -H + 1.15, heading: E }),
  mainWest: (x: number) => ({ x, z: H - 1.15, heading: W })
};

export const HEADINGS = { E, W, N, S };
