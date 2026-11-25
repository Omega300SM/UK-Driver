/**
 * The Devon Run (Week 3). Pure data; see src/world/layout.ts.
 *
 * Everything runs north (+z) towards the coast. In this world +x is on your
 * LEFT when you face north, so the left-hand (lane 1) side of a northbound
 * carriageway is its highest x.
 *
 *   z 7700  ── J3 ─── Seaview Road ── Seaview (sea beyond)
 *   z 5800–7900  M5 smart motorway (all-lane running, gantries, red X, emergency area)
 *   z 5200–5800  J2: exit slip, link roads, entry slip (lane gain)
 *   z 3600–5200  M5 (two lanes + hard shoulder); J1 entry slip from the east at z 3760
 *   z 2470–3600  A30 dual carriageway (lay-by at z 3100)
 *   z 2450       Okement Cross roundabout
 *   z −400–2426  A386 single carriageway, national speed limit (lay-by at z 1150)
 *   z 900        Combe Lane T-junction (from the east)
 *   x 620–800    Combe Lane: single track with passing places, from Ashcombe (800, 0)
 */
import type { AiPath, Carriageway, Gantry, Junction, Lane, Marker, Marking, Obstacle, Rect, Roundabout, SceneLayout, SignPlacement } from '../layout';

const N = 0;
const S = Math.PI;
const E = Math.PI / 2;
const W = -Math.PI / 2;

/** A-road and local roads: 3.65 m lanes. */
export const AH = 3.65;
/** Motorway / dual carriageway lane width. */
export const LW = 3.65;
/** Single-track lane half-width. */
export const TH = 1.8;

/** Main corridor centre line. */
export const CX = 400;
/** Northbound carriageway: x from its right edge (by the central reserve) outwards. */
export const NB0 = 401.5;
export const NB2 = NB0 + 2 * LW; // 408.8: edge of lane 1 (two lanes)
export const NB3 = NB0 + 3 * LW; // 412.45: edge of lane 1 with all-lane running
export const SB1 = 398.5; // southbound right edge (central reserve)
export const SB0 = SB1 - 2 * LW; // 391.2

export const Z = {
  aSouth: -400,
  rbt: 2450,
  dualStart: 2470,
  motorwayStart: 3600,
  j1: 3760,
  j1Solid: 4000,
  j1End: 4300,
  j2Exit: 5200,
  j2Link: 5500,
  j2Entry: 5560,
  j2Solid: 5650,
  smartStart: 5800,
  emergency: 6550,
  van: 7050,
  closed0: 7000,
  closed1: 7300,
  j3Exit: 7400,
  seaview: 7700,
  north: 7900
};

// ---- Roundabout -------------------------------------------------------------
export const OKEMENT: Roundabout = {
  id: 'OK',
  name: 'Okement Cross roundabout',
  x: CX,
  z: Z.rbt,
  island: 12,
  outer: 24,
  lanes: 2,
  arms: [
    { id: 'N', angle: N, name: 'A30 (dual carriageway)', entryLanes: 2 },
    { id: 'E', angle: E, name: 'Okehampton' },
    { id: 'S', angle: S, name: 'A386' },
    { id: 'W', angle: W, name: 'Moretonhampstead' }
  ]
};
/** Lateral offset of the lane used on each arm (the dual carriageway's lane 1 is further out). */
const ARM_LAT: Record<string, number> = { N: NB2 - LW / 2 - CX, E: AH / 2, S: AH / 2, W: AH / 2 };

// ---- Roads ------------------------------------------------------------------
const lx = (name: string, centre: number, x0: number, x1: number, h = AH): Lane => ({ name, axis: 'x', centre, x0, x1, z0: centre - h, z1: centre + h });
const lz = (name: string, centre: number, z0: number, z1: number, h = AH): Lane => ({ name, axis: 'z', centre, z0, z1, x0: centre - h, x1: centre + h });

/** Two-way roads with a centre line (used for keep-left checks). */
export const ROADS = {
  a386: lz('A386', CX, Z.aSouth, Z.rbt - 24 + 1),
  okeE: lx('Okehampton Road', Z.rbt, CX + 23, 520),
  okeW: lx('Moretonhampstead Road', Z.rbt, 280, CX - 23),
  j1Road: lx('B3260', Z.j1, NB2 + LW, 700),
  j2Out: lx('B3215 (exit)', Z.j2Link, NB2 + LW, 760),
  j2In: lx('B3215', Z.j2Entry, NB2 + LW, 760),
  seaview: lx('Seaview Road', Z.seaview, NB3 + LW, 1000)
};

/** Combe Lane: single track (no centre line), from Ashcombe to the A386. */
export const COMBE: Rect[] = [
  { x0: 800 - TH, x1: 800 + TH, z0: -150, z1: 420 + TH },
  { x0: 620 - TH, x1: 800 + TH, z0: 420 - TH, z1: 420 + TH },
  { x0: 620 - TH, x1: 620 + TH, z0: 420 - TH, z1: 900 + TH },
  { x0: CX + AH - 0.5, x1: 620 + TH, z0: 900 - TH, z1: 900 + TH }
];
/** Passing places: [x0, x1, z0, z1]. */
const PASSING: Rect[] = [
  // Section A (northbound, left = +x)
  { x0: 800 + TH, x1: 800 + TH + 3, z0: 60, z1: 80 },
  { x0: 800 - TH - 3, x1: 800 - TH, z0: 160, z1: 180 },
  { x0: 800 + TH, x1: 800 + TH + 3, z0: 260, z1: 280 },
  { x0: 800 - TH - 3, x1: 800 - TH, z0: 350, z1: 370 },
  // Section B (westbound, left = +z)
  { x0: 690, x1: 710, z0: 420 + TH, z1: 420 + TH + 3 },
  // Section C (northbound)
  { x0: 620 + TH, x1: 620 + TH + 3, z0: 520, z1: 540 },
  { x0: 620 - TH - 3, x1: 620 - TH, z0: 630, z1: 650 },
  { x0: 620 + TH, x1: 620 + TH + 3, z0: 740, z1: 760 },
  // Section D (westbound)
  { x0: 520, x1: 540, z0: 900 + TH, z1: 900 + TH + 3 },
  { x0: 450, x1: 470, z0: 900 - TH - 3, z1: 900 - TH }
];
export const PASSING_PLACES = PASSING;

// ---- One-way carriageways ------------------------------------------------------
const cw = (id: string, kind: Carriageway['kind'], x0: number, x1: number, z0: number, z1: number, heading: number, lanes: number, name: string): Carriageway => ({
  id,
  kind,
  x0,
  x1,
  z0,
  z1,
  heading,
  lanes,
  laneWidth: LW,
  name
});
export const CARRIAGEWAYS: Carriageway[] = [
  cw('a30-nb', 'dual', NB0, NB2, Z.dualStart, Z.motorwayStart, N, 2, 'A30'),
  cw('a30-sb', 'dual', SB0, SB1, Z.dualStart, Z.motorwayStart, S, 2, 'A30'),
  cw('m5-nb', 'motorway', NB0, NB2, Z.motorwayStart, Z.smartStart, N, 2, 'M5'),
  cw('m5-nb-smart', 'motorway', NB0, NB3, Z.smartStart, Z.north, N, 3, 'M5'),
  cw('m5-sb', 'motorway', SB0, SB1, Z.motorwayStart, Z.north, S, 2, 'M5'),
  cw('j1-slip', 'slip', NB2, NB2 + LW, Z.j1, Z.j1End, N, 1, 'J1 entry slip'),
  cw('j2-exit', 'slip', NB2, NB2 + LW, Z.j2Exit, Z.j2Link, N, 1, 'J2 exit slip'),
  cw('j2-slip', 'slip', NB2, NB2 + LW, Z.j2Entry, Z.smartStart, N, 1, 'J2 entry slip'),
  cw('j3-exit', 'slip', NB3, NB3 + LW, Z.j3Exit, Z.seaview, N, 1, 'J3 exit slip')
];
const HARD_SHOULDERS: Rect[] = [
  { x0: NB2, x1: NB2 + 3.3, z0: Z.j1End, z1: Z.j2Exit },
  { x0: SB0 - 3.3, x1: SB0, z0: Z.motorwayStart, z1: Z.north }
];
const EMERGENCY_AREA: Rect = { x0: NB3, x1: NB3 + 3.6, z0: Z.emergency, z1: Z.emergency + 100 };
export const EMERGENCY = EMERGENCY_AREA;
const CLOSED: Rect[] = [{ x0: NB2, x1: NB3, z0: Z.closed0, z1: Z.closed1 }];
const VAN: Obstacle = { kind: 'van', x0: NB2 + 0.6, x1: NB3 - 0.6, z0: Z.van - 2.6, z1: Z.van + 2.6, color: 0xe8e4da };

const LAYBYS: Rect[] = [
  { x0: CX + AH, x1: CX + AH + 3, z0: 1150, z1: 1210 },
  { x0: CX + AH, x1: CX + AH + 3, z0: 2150, z1: 2210 },
  { x0: NB2, x1: NB2 + 3, z0: 3300, z1: 3360 }
];

const bend = (x: number, z: number, h: number): Rect => ({ x0: x - h, x1: x + h, z0: z - h, z1: z + h });

const drivable: Rect[] = [
  ...Object.values(ROADS),
  ...COMBE,
  ...PASSING,
  ...CARRIAGEWAYS,
  ...HARD_SHOULDERS,
  EMERGENCY_AREA,
  ...LAYBYS,
  // Lay-by tapers.
  { x0: CX + AH, x1: CX + AH + 1.5, z0: 1140, z1: 1150 },
  { x0: CX + AH, x1: CX + AH + 1.5, z0: 1210, z1: 1220 },
  { x0: CX + AH, x1: CX + AH + 1.5, z0: 2140, z1: 2150 },
  { x0: CX + AH, x1: CX + AH + 1.5, z0: 2210, z1: 2220 },
  { x0: NB2, x1: NB2 + 1.5, z0: 3290, z1: 3300 },
  { x0: NB2, x1: NB2 + 1.5, z0: 3360, z1: 3370 },
  // Corners where slip roads meet their link roads (left turns off / on).
  bend(NB2 + LW / 2, Z.j1, AH),
  bend(NB2 + LW / 2, Z.j2Link, AH),
  bend(NB2 + LW / 2, Z.j2Entry, AH),
  bend(NB3 + LW / 2, Z.seaview, AH),
  // Inside corners of those bends, a little rounded.
  { x0: NB2 + LW, x1: NB2 + LW + 3, z0: Z.j1 + AH, z1: Z.j1 + AH + 3 },
  { x0: NB2 + LW, x1: NB2 + LW + 3, z0: Z.j2Entry + AH, z1: Z.j2Entry + AH + 3 },
  { x0: NB2 + LW, x1: NB2 + LW + 3, z0: Z.j2Link - AH - 3, z1: Z.j2Link - AH },
  { x0: NB3 + LW, x1: NB3 + LW + 3, z0: Z.seaview - AH - 3, z1: Z.seaview - AH },
  // Combe Lane corners, a little wider on the inside so you can see round them.
  { x0: 800 - TH - 2, x1: 800 - TH, z0: 418.2 - 2, z1: 418.2 },
  { x0: 620 + TH, x1: 620 + TH + 2, z0: 421.8, z1: 421.8 + 2 },
  { x0: 620 - TH - 2, x1: 620 - TH, z0: 898.2 - 2, z1: 898.2 },
  // Where Combe Lane meets the A386: a wider mouth.
  { x0: CX + AH - 0.5, x1: CX + AH + 6, z0: 900 - TH - 2, z1: 900 + TH + 2 },
  // Ends of the motorway past Seaview and the A386 south (AI comes and goes here).
  { x0: SB0 - 3.3, x1: NB3, z0: Z.north, z1: Z.north + 10 }
];

// ---- Junctions --------------------------------------------------------------------
const junctions: Junction[] = [
  {
    id: 'combe-a386',
    kind: 'giveway',
    main: 'A386',
    approach: W,
    line: { x0: CX + AH, x1: CX + AH + 0.6, z0: 900 - TH, z1: 900 + TH },
    box: { x0: CX - AH, x1: CX + AH, z0: 900 - AH - 2, z1: 900 + AH + 2 }
  }
];

// ---- AI paths ------------------------------------------------------------------------
type P = [number, number];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const dirOf = (h: number): P => [Math.sin(h), Math.cos(h)];
const leftOf = (h: number): P => [Math.cos(h), -Math.sin(h)];
const scale = (a: P, k: number): P => [a[0] * k, a[1] * k];

function armPoint(rb: Roundabout, arm: string, inbound: boolean, extra = 0): P {
  const a = rb.arms.find((q) => q.id === arm)!;
  const out = add([rb.x, rb.z], scale(dirOf(a.angle), rb.outer + extra));
  const travel = inbound ? a.angle + Math.PI : a.angle;
  return add(out, scale(leftOf(travel), ARM_LAT[arm]));
}
/** Path across the roundabout from one arm to another (clockwise). */
export function rbPath(rb: Roundabout, from: string, to: string): P[] {
  const fa = rb.arms.find((q) => q.id === from)!.angle;
  const ta = rb.arms.find((q) => q.id === to)!.angle;
  let turn = fa - ta;
  while (turn <= 0.01) turn += 2 * Math.PI;
  const rc = turn > Math.PI * 1.25 ? rb.island + 3 : rb.outer - 4;
  const a0 = fa - 0.36;
  const a1 = fa - turn + 0.36;
  const pts: P[] = [armPoint(rb, from, true, 2)];
  const steps = Math.max(4, Math.round(((a0 - a1) * rc) / 3));
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps);
    pts.push([rb.x + rc * Math.sin(a), rb.z + rc * Math.cos(a)]);
  }
  pts.push(armPoint(rb, to, false, 1));
  return pts;
}

const aiPaths: AiPath[] = [];
let pid = 0;
const path = (points: P[], opts: Partial<AiPath> = {}) => aiPaths.push({ id: `d${pid++}`, points, ...opts });
const nbLane = (n: number, lanes = 2) => NB0 + (lanes - n + 0.5) * LW; // centre x of northbound lane n
const sbLane = (n: number) => SB0 + (n - 0.5) * LW;
// A386 both ways, through the roundabout to and from the A30.
path([[CX + AH / 2, Z.aSouth], armPoint(OKEMENT, 'S', true, 2)], { spawn: true, heavy: true });
path([armPoint(OKEMENT, 'S', false, 1), [CX - AH / 2, Z.aSouth]], { heavy: true });
path(rbPath(OKEMENT, 'S', 'N'), { yieldTo: 'OK' });
path(rbPath(OKEMENT, 'N', 'S'), { yieldTo: 'OK' });
// A30 / M5 northbound: lane 1 from the roundabout, lane 2 appearing just after it.
path([armPoint(OKEMENT, 'N', false, 1), [nbLane(1), Z.north]], { heavy: true });
path([[nbLane(2), Z.dualStart + 60], [nbLane(2), Z.north]], { spawn: true });
// Southbound: from the far north down to the roundabout (lane 1) or fading out (lane 2).
path([[sbLane(1), Z.north], armPoint(OKEMENT, 'N', true, 2)], { spawn: true, heavy: true });
path([[sbLane(2), Z.north], [sbLane(2), Z.dualStart + 60]], { spawn: true });

// ---- Markings -----------------------------------------------------------------------
const markings: Marking[] = [];
const seg = (kind: Marking['kind'], x0: number, z0: number, x1: number, z1: number) => markings.push({ kind, x0, z0, x1, z1 });
for (const l of Object.values(ROADS)) {
  if (l.axis === 'x') seg('centre', l.x0 + 4, l.centre, l.x1 - 4, l.centre);
  else seg('centre', l.centre, l.z0 + 4, l.centre, l.z1 - 4);
}
// Lane lines and edge lines on the one-way carriageways.
for (const c of CARRIAGEWAYS) {
  if (c.kind === 'slip') continue;
  for (let i = 1; i < c.lanes; i++) seg('lane', c.x0 + i * c.laneWidth, c.z0 + 2, c.x0 + i * c.laneWidth, c.z1 - 2);
  seg('edge', c.x0 + 0.2, c.z0, c.x0 + 0.2, c.z1);
}
// Left-hand edge lines (the hard-shoulder line), broken at junctions.
seg('edge', NB2 - 0.2, Z.dualStart, NB2 - 0.2, Z.j1);
seg('edge', NB2 - 0.2, Z.j1End, NB2 - 0.2, Z.j2Exit);
seg('lane', NB2, Z.j1Solid, NB2, Z.j1End);
seg('edge', NB2, Z.j1, NB2, Z.j1Solid);
seg('lane', NB2, Z.j2Exit, NB2, Z.j2Exit + 120);
seg('edge', NB2, Z.j2Entry, NB2, Z.j2Solid);
seg('lane', NB2, Z.j2Solid, NB2, Z.smartStart);
seg('edge', NB3 - 0.2, Z.smartStart, NB3 - 0.2, Z.j3Exit);
seg('lane', NB3, Z.j3Exit, NB3, Z.j3Exit + 120);
seg('edge', NB3 - 0.2, Z.j3Exit + 160, NB3 - 0.2, Z.north);
seg('edge', SB0 + 0.2, Z.dualStart, SB0 + 0.2, Z.north);
// Give way line where Combe Lane meets the A386.
seg('giveway', CX + AH + 0.3, 900 - TH, CX + AH + 0.3, 900 + TH);

// ---- Gantries (smart motorway, rules 255–258) --------------------------------------------
const lim = (mph: number) => ({ kind: 'limit' as const, mph });
export const GANTRIES: Gantry[] = [
  { z: 6000, carriageway: 'm5-nb-smart', signs: [lim(60), lim(60), lim(60)] },
  { z: 6400, carriageway: 'm5-nb-smart', signs: [lim(50), lim(50), lim(50)] },
  { z: 6800, carriageway: 'm5-nb-smart', signs: [{ kind: 'arrow' }, lim(50), lim(50)] },
  { z: Z.closed0, carriageway: 'm5-nb-smart', signs: [{ kind: 'x' }, lim(50), lim(50)] },
  { z: Z.closed1, carriageway: 'm5-nb-smart', signs: [{ kind: 'nsl' }, { kind: 'nsl' }, { kind: 'nsl' }] }
];

// ---- Signs -----------------------------------------------------------------------------
const signs: SignPlacement[] = [
  { kind: 'nsl', x: 800 + TH + 1.2, z: 30, faces: N },
  { kind: 'name', text: 'Combe Lane', x: 800 - TH - 1.6, z: 10, faces: N },
  { kind: 'warn-bend', x: 800 + TH + 1.2, z: 360, faces: N, size: 0.9 },
  { kind: 'warn-bend', x: 620 + TH + 1.2, z: 840, faces: N, size: 0.9 },
  ...PASSING.map((p): SignPlacement => {
    const alongZ = p.z1 - p.z0 > p.x1 - p.x0;
    if (alongZ) {
      const centre = p.x0 > 700 ? 800 : 620;
      return { kind: 'passing-place', x: p.x0 > centre ? p.x1 + 0.6 : p.x0 - 0.6, z: p.z0 - 1, faces: N, size: 0.8 };
    }
    const centre = p.z0 > 600 ? 900 : 420;
    return { kind: 'passing-place', x: p.x1 + 1, z: p.z0 > centre ? p.z1 + 0.6 : p.z0 - 0.6, faces: W, size: 0.8 };
  }),
  { kind: 'giveway', x: CX + AH + 1.4, z: 900 + TH + 1.2, faces: W },
  { kind: 'direction', x: CX + AH + 2.4, z: 860, faces: N, size: 2, value: 2, text: 'A386|Okement Cross' },
  { kind: 'dual-ahead', x: CX + AH + 1.6, z: 2330, faces: N },
  { kind: 'roundabout-map', x: CX + AH + 2.6, z: 2360, faces: N, size: 1.6, map: { exits: [{ rel: -90, label: 'Okehampton' }, { rel: 0, label: 'A30 · M5' }, { rel: 90, label: 'Moreton' }] } },
  { kind: 'nsl', x: NB2 + 1.4, z: Z.dualStart + 40, faces: N },
  { kind: 'direction', x: NB2 + 3, z: 3400, faces: N, size: 2.2, value: 2, text: 'M5|The North Coast' },
  { kind: 'motorway', x: NB2 + 1.6, z: Z.motorwayStart, faces: N, size: 1.3 },
  { kind: 'motorway', x: ROADS.j1Road.x0 + 30, z: Z.j1 + AH + 1.6, faces: W, size: 1.2 },
  { kind: 'direction', x: NB2 + 4, z: 4500, faces: N, size: 2.4, value: 1, text: 'Exit 2|Hatherleigh' },
  ...[3, 2, 1].map((n): SignPlacement => ({ kind: 'countdown', value: n, x: NB2 + 3.3 + 1, z: Z.j2Exit - n * 91, faces: N, size: 1.4 })),
  { kind: 'motorway', x: ROADS.j2In.x0 + 30, z: Z.j2Entry + AH + 1.6, faces: W, size: 1.2 },
  { kind: 'emergency-area', x: NB3 + 1.2, z: Z.emergency - 300, faces: N, size: 1.2 },
  { kind: 'emergency-area', x: NB3 + 4.4, z: Z.emergency + 2, faces: N, size: 1.2 },
  { kind: 'direction', x: NB3 + 3, z: 6900, faces: N, size: 2.4, value: 1, text: 'Exit 3|Seaview' },
  ...[3, 2, 1].map((n): SignPlacement => ({ kind: 'countdown', value: n, x: NB3 + 1.2, z: Z.j3Exit - n * 91, faces: N, size: 1.4 })),
  { kind: 'name', text: 'Seaview Road', x: NB3 + LW + 30, z: Z.seaview - AH - 1.6, faces: E },
  { kind: 'limit', value: 30, x: 700, z: Z.seaview - AH - 1.4, faces: E },
  { kind: 'limit', value: 30, x: 800 + TH + 1.2, z: -100, faces: S }
];

// ---- Markers and zones -----------------------------------------------------------------------
const markers: Marker[] = [
  { id: 'LB1', label: 'The lay-by, on the left', x0: CX + AH + 0.3, x1: CX + AH + 3, z0: 1158, z1: 1202 },
  { id: 'LB2', label: 'The lay-by, on the left', x0: NB2 + 0.3, x1: NB2 + 3, z0: 3308, z1: 3352 },
  { id: 'LB3', label: 'The lay-by, on the left', x0: CX + AH + 0.3, x1: CX + AH + 3, z0: 2158, z1: 2202 },
  { id: 'fog1', label: '', x0: CX - AH, x1: CX + AH, z0: 1500, z1: 1900 },
  { id: 'es-zone', label: '', x0: CX, x1: CX + AH, z0: 1960, z1: 2030 },
  { id: 'dual-lane1', label: '', x0: NB0 + LW, x1: NB2, z0: 2480, z1: 3290 },
  { id: 'lane2-smart', label: '', x0: NB0 + LW, x1: NB2, z0: 6700, z1: Z.closed0 },
  { id: 'smart-end', label: '', x0: NB0, x1: NB3, z0: Z.closed1, z1: Z.closed1 + 90 },
  { id: 'J2L', label: 'The B3215, on the left', x0: 600, x1: 640, z0: Z.j2Link - AH, z1: Z.j2Link - AH + 2.8 },
  { id: 'SV1', label: 'Seaview Road, on the left', x0: 820, x1: 860, z0: Z.seaview - AH, z1: Z.seaview - AH + 2.8 },
  { id: 'PPA', label: 'The passing place', x0: 800 + TH - 0.8, x1: 800 + TH + 3, z0: 258, z1: 282 },
  { id: 'PPC', label: 'The passing place', x0: 620 + TH - 0.8, x1: 620 + TH + 3, z0: 518, z1: 542 },
  { id: 'combe-a', label: '', x0: 795, x1: 805, z0: 20, z1: 410 },
  { id: 'combe-bend1', label: '', x0: 780, x1: 805, z0: 395, z1: 425 },
  { id: 'combe-c', label: '', x0: 615, x1: 625, z0: 430, z1: 890 },
  { id: 'combe-end', label: '', x0: 404, x1: 440, z0: 897, z1: 903 },
  { id: 'a386-n', label: '', x0: CX, x1: CX + AH, z0: 905, z1: 1100 },
  { id: 'a386-rain', label: '', x0: CX, x1: CX + AH, z0: 1300, z1: 2300 },
  { id: 'rbt-approach', label: '', x0: CX, x1: CX + AH, z0: 2330, z1: 2424 },
  { id: 'dual', label: '', x0: NB0, x1: NB2, z0: 2480, z1: 3050 },
  { id: 'dual-lane2', label: '', x0: NB0, x1: NB0 + LW, z0: 2480, z1: 3290 },
  { id: 'j1-slip', label: '', x0: NB2, x1: NB2 + LW, z0: Z.j1 + 5, z1: Z.j1End },
  { id: 'm5-lane1', label: '', x0: NB0 + LW, x1: NB2, z0: Z.j1End, z1: Z.j2Exit },
  { id: 'm5-lane2', label: '', x0: NB0, x1: NB0 + LW, z0: Z.j1End, z1: Z.j2Exit },
  { id: 'j2-exit', label: '', x0: NB2, x1: NB2 + LW, z0: Z.j2Exit, z1: Z.j2Link },
  { id: 'j2-slip', label: '', x0: NB2, x1: NB2 + LW, z0: Z.j2Entry + 5, z1: Z.smartStart },
  { id: 'smart', label: '', x0: NB0, x1: NB3, z0: Z.smartStart, z1: 6900 },
  { id: 'red-x', label: '', x0: NB0, x1: NB3, z0: 6700, z1: Z.closed1 },
  { id: 'j3-exit', label: '', x0: NB3, x1: NB3 + LW, z0: Z.j3Exit, z1: Z.seaview },
  { id: 'seaview', label: '', x0: NB3 + LW, x1: 1000, z0: Z.seaview - AH, z1: Z.seaview + AH }
];

const obstacles: Obstacle[] = [
  VAN,
  { kind: 'gate', x0: CX - AH, x1: CX + AH, z0: Z.aSouth - 2, z1: Z.aSouth },
  { kind: 'gate', x0: 518, x1: 520, z0: Z.rbt - AH, z1: Z.rbt + AH },
  { kind: 'gate', x0: 280, x1: 282, z0: Z.rbt - AH, z1: Z.rbt + AH },
  { kind: 'gate', x0: 698, x1: 700, z0: Z.j1 - AH, z1: Z.j1 + AH },
  { kind: 'gate', x0: 758, x1: 760, z0: Z.j2Link - AH, z1: Z.j2Link + AH },
  { kind: 'gate', x0: 758, x1: 760, z0: Z.j2Entry - AH, z1: Z.j2Entry + AH }
];

export const DEVON: SceneLayout = {
  name: 'The Devon Run',
  drivable,
  pavements: [],
  obstacles,
  markers,
  speedZones: [
    { name: 'Ashcombe', mph: 30, x0: 760, x1: 860, z0: -160, z1: 10 },
    { name: 'Variable limit 60', mph: 60, x0: NB0, x1: NB3, z0: 6000, z1: 6400 },
    { name: 'Variable limit 50', mph: 50, x0: NB0, x1: NB3, z0: 6400, z1: Z.closed1 },
    { name: 'Seaview', mph: 30, x0: 700, x1: 1010, z0: Z.seaview - 10, z1: Z.seaview + 10 },
    { name: 'national speed limit (dual carriageway and motorway)', mph: 70, x0: SB0 - 4, x1: NB3 + LW + 0.1, z0: Z.dualStart, z1: Z.north + 20 },
    { name: 'national speed limit', mph: 60, x0: 0, x1: 1100, z0: -600, z1: 8200 }
  ],
  lanes: Object.values(ROADS),
  start: { x: 800 + TH - 1.0, z: -20, heading: N },
  bays: [],
  markings,
  signs,
  junctions,
  bends: [
    // Combe Lane corners (the lane bends, no signal needed) and the slip-road corners.
    { x0: 770, x1: 810, z0: 395, z1: 440 },
    { x0: 600, x1: 650, z0: 400, z1: 445 },
    { x0: 600, x1: 640, z0: 875, z1: 915 },
    { x0: NB2 - 2, x1: NB2 + LW + 30, z0: Z.j1 - 10, z1: Z.j1 + 30 },
    { x0: NB2 - 2, x1: NB2 + LW + 30, z0: Z.j2Link - 30, z1: Z.j2Link + 10 },
    { x0: NB2 - 2, x1: NB2 + LW + 30, z0: Z.j2Entry - 10, z1: Z.j2Entry + 30 },
    { x0: NB3 - 2, x1: NB3 + LW + 30, z0: Z.seaview - 30, z1: Z.seaview + 10 }
  ],
  roundabouts: [OKEMENT],
  aiPaths,
  aiNearPlayer: true,
  carriageways: CARRIAGEWAYS,
  hardShoulders: HARD_SHOULDERS,
  closedLanes: CLOSED,
  gantries: GANTRIES,
  solidMerges: [
    { x: NB2, z0: Z.j1, z1: Z.j1Solid },
    { x: NB2, z0: Z.j2Entry, z1: Z.j2Solid }
  ],
  slowZones: [
    { x0: 780, x1: 810, z0: 385, z1: 430, mph: 20 },
    { x0: 610, x1: 650, z0: 410, z1: 455, mph: 20 },
    { x0: 610, x1: 640, z0: 860, z1: 910, mph: 20 }
  ],
  fogZones: [{ x0: CX - 30, x1: CX + 30, z0: 1500, z1: 1900 }],
  motorways: [{ x0: SB0 - 3.4, x1: NB3 + LW + 0.1, z0: Z.motorwayStart, z1: Z.north + 10 }]
};

/** Kerb-side starting positions. */
export const DV_STARTS = {
  ashcombe: (z = -20) => ({ x: 800 + TH - 1.0, z, heading: N }),
  a386North: (z: number) => ({ x: CX + AH - 1.15, z, heading: N }),
  j1Road: (x = 620) => ({ x, z: Z.j1 + AH - 1.15, heading: W }),
  j2Road: (x = 680) => ({ x, z: Z.j2Entry + AH - 1.15, heading: W })
};
export const DV_HEADINGS = { N, S, E, W };
export { nbLane, sbLane };
