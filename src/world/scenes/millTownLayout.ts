/**
 * Mill Town, Greater Manchester (Week 2). Pure data; see src/world/layout.ts.
 *
 *                 Ringway (z = 180) ───────── M1 (mini) ──────────────┐
 *                 │                              │ Canal Street          │ Ringway
 *  Mill Road ─ T ─┴──────────────── R1 ─────────────────────── R2 (2-lane, spiral) ── Mill Road E
 *  (x −250)   (x −150)              (0,0)   │ Station Road          (200,0)
 *                                           └── Canal Side (z −130) ── T ── Southway
 *                                                                      │
 *                                                        Magic Roundabout (ring of minis)
 *
 * Roundabouts circulate clockwise seen from above: heading = θ − π/2 at polar
 * angle θ, so the island is on your right.
 */
import type { AiPath, Crossing, Junction, Lane, Marker, Marking, Obstacle, Rect, Roundabout, SceneLayout, SignalController, SignPlacement, StopLine } from '../layout';

export const H = 3.8;
export const LANE = 1.9;
const PAVE = 2.6;
const E = Math.PI / 2;
const W = -Math.PI / 2;
const N = 0;
const S = Math.PI;

// ---- Roundabouts -----------------------------------------------------------
export const R1: Roundabout = {
  id: 'R1',
  name: 'Mill Road roundabout',
  x: 0,
  z: 0,
  island: 8,
  outer: 16,
  lanes: 1,
  arms: [
    { id: 'N', angle: N, name: 'Canal Street' },
    { id: 'E', angle: E, name: 'Mill Road (Ringway)' },
    { id: 'S', angle: S, name: 'Station Road' },
    { id: 'W', angle: W, name: 'Mill Road (town centre)' }
  ]
};

export const R2: Roundabout = {
  id: 'R2',
  name: 'Ringway roundabout',
  x: 200,
  z: 0,
  island: 12,
  outer: 24,
  lanes: 2,
  spiral: true,
  arms: [
    { id: 'N', angle: N, name: 'Ringway' },
    { id: 'E', angle: E, name: 'Mill Road East' },
    { id: 'S', angle: S, name: 'Southway' },
    { id: 'W', angle: W, name: 'Mill Road', entryLanes: 2 }
  ]
};

export const M1: Roundabout = {
  id: 'M1',
  name: 'Canal Street mini-roundabout',
  x: 0,
  z: 180,
  island: 1.8,
  outer: 9,
  mini: true,
  lanes: 1,
  arms: [
    { id: 'E', angle: E, name: 'Ringway (east)' },
    { id: 'S', angle: S, name: 'Canal Street' },
    { id: 'W', angle: W, name: 'Ringway (west)' }
  ]
};

// The Magic Roundabout: a square ring road round a central island, with a mini
// at three of its sides. Treat each mini separately (rules 189 and 190).
const MAGIC_C = { x: 200, z: -215 };
const MAGIC_HALF = 40;
const mini = (id: string, x: number, z: number, arms: Roundabout['arms']): Roundabout => ({ id, name: `Magic Roundabout (${id})`, x, z, island: 1.8, outer: 9, mini: true, lanes: 1, arms });
export const MAGIC: Roundabout[] = [
  mini('MN', MAGIC_C.x, MAGIC_C.z + MAGIC_HALF, [
    { id: 'N', angle: N, name: 'Southway' },
    { id: 'E', angle: E, name: 'Ring' },
    { id: 'W', angle: W, name: 'Ring' }
  ]),
  mini('ME', MAGIC_C.x + MAGIC_HALF, MAGIC_C.z, [
    { id: 'N', angle: N, name: 'Ring' },
    { id: 'E', angle: E, name: 'Gasworks Lane' },
    { id: 'S', angle: S, name: 'Ring' }
  ]),
  mini('MW', MAGIC_C.x - MAGIC_HALF, MAGIC_C.z, [
    { id: 'N', angle: N, name: 'Ring' },
    { id: 'S', angle: S, name: 'Ring' },
    { id: 'W', angle: W, name: 'Wharf Street' }
  ])
];

// ---- Straight roads --------------------------------------------------------
const lx = (name: string, centre: number, x0: number, x1: number): Lane => ({ name, axis: 'x', centre, x0, x1, z0: centre - H, z1: centre + H });
const lz = (name: string, centre: number, z0: number, z1: number): Lane => ({ name, axis: 'z', centre, z0, z1, x0: centre - H, x1: centre + H });

export const ROADS = {
  millW: lx('Mill Road', 0, -250, -14),
  millMid: lx('Mill Road', 0, 14, 178),
  millE: lx('Mill Road East', 0, 222, 300),
  canal: lz('Canal Street', 0, 14, 172),
  ringway: lx('Ringway', 180, -153.8, 203.8),
  ringwayW: lz('Ringway', -150, H, 183.8),
  ringwayE: lz('Ringway', 200, 22, 183.8),
  station: lz('Station Road', 0, -133.8, -14),
  canalSide: lx('Canal Side', -130, -3.8, 196.2),
  southway: lz('Southway', 200, MAGIC_C.z + MAGIC_HALF + 7, -22),
  ringN: lx('Ring', MAGIC_C.z + MAGIC_HALF, MAGIC_C.x - MAGIC_HALF - H, MAGIC_C.x + MAGIC_HALF + H),
  ringS: lx('Ring', MAGIC_C.z - MAGIC_HALF, MAGIC_C.x - MAGIC_HALF - H, MAGIC_C.x + MAGIC_HALF + H),
  ringE: lz('Ring', MAGIC_C.x + MAGIC_HALF, MAGIC_C.z - MAGIC_HALF - H, MAGIC_C.z + MAGIC_HALF + H),
  ringWst: lz('Ring', MAGIC_C.x - MAGIC_HALF, MAGIC_C.z - MAGIC_HALF - H, MAGIC_C.z + MAGIC_HALF + H),
  gasworks: lx('Gasworks Lane', MAGIC_C.z, MAGIC_C.x + MAGIC_HALF + 7, 300),
  wharf: lx('Wharf Street', MAGIC_C.z, 100, MAGIC_C.x - MAGIC_HALF - 7),
  bridge: lz('Bridge Street', 100, MAGIC_C.z, -40)
};

const CORNER_R = 5;
/** Stepped quarter-circle fillets at the corners where a side road (along z) meets an edge. */
function filletsZ(centreX: number, edge: number, dir: 1 | -1, r = CORNER_R, steps = 5, sides: 'both' | 'low' | 'high' = 'both'): Rect[] {
  const out: Rect[] = [];
  for (let i = 0; i < steps; i++) {
    const d0 = (i * r) / steps;
    const d1 = ((i + 1) * r) / steps;
    const dm = (d0 + d1) / 2;
    const w = r - Math.sqrt(Math.max(0, r * r - (r - dm) * (r - dm)));
    const z0 = Math.min(edge + dir * d0, edge + dir * d1);
    const z1 = Math.max(edge + dir * d0, edge + dir * d1);
    if (sides !== 'high') out.push({ x0: centreX - H - w, x1: centreX - H, z0, z1 });
    if (sides !== 'low') out.push({ x0: centreX + H, x1: centreX + H + w, z0, z1 });
  }
  return out;
}
/** Same for a side road along x meeting an edge at x = edge. */
function filletsX(centreZ: number, edge: number, dir: 1 | -1, r = CORNER_R, steps = 5, sides: 'both' | 'low' | 'high' = 'both'): Rect[] {
  return filletsZ(centreZ, edge, dir, r, steps, sides).map((q) => ({ x0: q.z0, x1: q.z1, z0: q.x0, z1: q.x1 }));
}
const bend = (x: number, z: number): Rect => ({ x0: x - H, x1: x + H, z0: z - H, z1: z + H });

/** Mill Road widens to two lanes on the approach to R2 (left lane: left/ahead; right lane: right/ahead). */
export const R2_FLARE: Rect = { x0: 140, x1: 180, z0: -H - 3.8, z1: -H };

/** Bridge Street traffic lights (J1), with a yellow box junction. */
export const J1 = { x: 100, z: -130 };
/** Albion Retail Park car park, off Bridge Street (Day 12): two rows of bays either side of an aisle. */
export const CAR_PARK: Rect = { x0: 46, x1: 92, z0: -100, z1: -70 };
export const CAR_PARK_ENTRANCE: Rect = { x0: 91.9, x1: 100 - H + 0.1, z0: -85 - H, z1: -85 + H };
const BAY_W = 2.5;
const BAY_D = 4.8;
/** Bays: south row S1–S15 (z −100…−95.2), north row N1–N15 (z −74.8…−70), numbered west to east. */
export const BAYS: Array<Rect & { id: string }> = [];
for (let i = 0; i < 15; i++) {
  const x0 = 50 + i * BAY_W;
  BAYS.push({ id: `S${i + 1}`, x0, x1: x0 + BAY_W, z0: CAR_PARK.z0, z1: CAR_PARK.z0 + BAY_D });
  BAYS.push({ id: `N${i + 1}`, x0, x1: x0 + BAY_W, z0: CAR_PARK.z1 - BAY_D, z1: CAR_PARK.z1 });
}
/** Bridge Street north: a quiet dead end with a gap between two parked cars for parallel parking. */
export const PARALLEL_GAP: Rect = { x0: 101.2, x1: 100 + H, z0: -75.8, z1: -66.2 };

/** Westbound bus lane on Canal Side, at the kerb (rule 141). */
export const BUS_LANE: Rect = { x0: 120, x1: 186, z0: -130 + H, z1: -130 + H + 3.8 };

const drivable: Rect[] = [
  ...Object.values(ROADS),
  R2_FLARE,
  bend(-150, 180),
  bend(200, 180),
  bend(0, -130),
  bend(100, MAGIC_C.z),
  BUS_LANE,
  CAR_PARK,
  CAR_PARK_ENTRANCE,
  ...filletsX(-85, 100 - H, -1, 4), // rounded kerbs at the car park entrance
  // Junction mouths and bends get rounded kerbs.
  ...filletsZ(-150, H, 1), // Ringway (west) meets Mill Road
  ...filletsX(-130, 200 - H, -1), // Canal Side meets Southway
  ...filletsZ(-150, 180 - H, -1, CORNER_R, 5, 'high'), // inside of the north-west bend
  ...filletsZ(200, 180 - H, -1, CORNER_R, 5, 'low'), // inside of the north-east bend
  ...filletsZ(0, -130 + H, 1, CORNER_R, 5, 'high'), // inside of the Station Road / Canal Side bend
  ...filletsZ(100, -130 + H, 1), // Bridge Street lights: north corners
  ...filletsZ(100, -130 - H, -1), // and south corners
  ...filletsZ(100, MAGIC_C.z + H, 1, CORNER_R, 5, 'high'), // inside of the Bridge Street / Wharf Street bend
  // Magic ring corners (inside and outside).
  ...[
    [MAGIC_C.x - MAGIC_HALF, MAGIC_C.z + MAGIC_HALF],
    [MAGIC_C.x + MAGIC_HALF, MAGIC_C.z + MAGIC_HALF],
    [MAGIC_C.x - MAGIC_HALF, MAGIC_C.z - MAGIC_HALF],
    [MAGIC_C.x + MAGIC_HALF, MAGIC_C.z - MAGIC_HALF]
  ].flatMap(([x, z]) => {
    // Rounded kerb on the inside of each ring corner (the side facing the central island).
    const sx = Math.sign(MAGIC_C.x - x);
    const sz = Math.sign(MAGIC_C.z - z);
    return [bend(x, z), ...filletsZ(x, z + sz * H, sz as 1 | -1, CORNER_R, 5, sx > 0 ? 'high' : 'low')];
  })
];

// ---- Pavements (decorative; the road edge is what counts for kerbs) -------
function pavementsAlong(l: Lane, gaps: Array<[number, number]> = []): Rect[] {
  const out: Rect[] = [];
  const [a0, a1] = l.axis === 'x' ? [l.x0, l.x1] : [l.z0, l.z1];
  for (const side of [-1, 1]) {
    let cur = a0;
    for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) {
      if (g0 > cur) out.push(stripOf(l, side, cur, g0));
      cur = Math.max(cur, g1);
    }
    if (cur < a1) out.push(stripOf(l, side, cur, a1));
  }
  return out;
}
function stripOf(l: Lane, side: number, a: number, b: number): Rect {
  const c0 = side < 0 ? l.centre - H - PAVE : l.centre + H;
  const c1 = side < 0 ? l.centre - H : l.centre + H + PAVE;
  return l.axis === 'x' ? { x0: a, x1: b, z0: c0, z1: c1 } : { z0: a, z1: b, x0: c0, x1: c1 };
}
const mouthGap = (c: number): [number, number] => [c - H - CORNER_R - 0.3, c + H + CORNER_R + 0.3];
const pavements: Rect[] = [
  ...pavementsAlong(ROADS.millW, [mouthGap(-150)]),
  ...pavementsAlong(ROADS.millMid, [[136, 180]]),
  { x0: 136, x1: 177, z0: -H - 3.8 - PAVE, z1: -H - 3.8 },
  { x0: 136, x1: 177, z0: H, z1: H + PAVE },
  ...pavementsAlong(ROADS.millE),
  ...pavementsAlong(ROADS.canal),
  ...pavementsAlong(ROADS.station),
  ...pavementsAlong({ ...ROADS.ringwayW, z0: H + CORNER_R + 0.3, z1: 180 - H - PAVE }),
  ...pavementsAlong({ ...ROADS.ringwayE, z1: 180 - H - PAVE }),
  ...pavementsAlong({ ...ROADS.ringway, x0: -150 + H + PAVE, x1: -9 }),
  ...pavementsAlong({ ...ROADS.ringway, x0: 9, x1: 200 - H - PAVE }),
  // Canal Side: the north pavement steps back behind the bus lane.
  ...pavementsAlong({ ...ROADS.canalSide, x0: H + PAVE, x1: 200 - H - CORNER_R - 0.3 }, [mouthGap(100)]).filter((r) => r.z0 < -130),
  ...[
    [H + PAVE, 100 - H - CORNER_R - 0.3],
    [100 + H + CORNER_R + 0.3, BUS_LANE.x0],
    [BUS_LANE.x1, 200 - H - CORNER_R - 0.3]
  ].map(([x0, x1]) => ({ x0, x1, z0: -130 + H, z1: -130 + H + PAVE })),
  { x0: BUS_LANE.x0, x1: BUS_LANE.x1, z0: BUS_LANE.z1, z1: BUS_LANE.z1 + PAVE },
  ...pavementsAlong({ ...ROADS.bridge, z0: MAGIC_C.z + H + CORNER_R + 0.3 }, [mouthGap(-130)]).filter((r) => r.x0 > 100 || r.z1 < -100),
  // West side of Bridge Street north: pavement either side of the car park entrance.
  { x0: 100 - H - PAVE, x1: 100 - H, z0: -126.2 + CORNER_R + 0.3, z1: CAR_PARK_ENTRANCE.z0 - 4.3 },
  { x0: 100 - H - PAVE, x1: 100 - H, z0: CAR_PARK_ENTRANCE.z1 + 4.3, z1: -40 },
  ...pavementsAlong({ ...ROADS.southway, z1: -24 }, [mouthGap(-130)])
];

// ---- Junctions ---------------------------------------------------------------
const junctions: Junction[] = [
  {
    id: 'ringway-mill',
    kind: 'giveway',
    main: 'Mill Road',
    approach: S,
    line: { x0: -150 - H, x1: -150, z0: H, z1: H + 0.6 },
    box: { x0: -150 - H - 4, x1: -150 + H + 4, z0: -H, z1: H }
  },
  {
    id: 'canalside-southway',
    kind: 'giveway',
    main: 'Southway',
    approach: E,
    line: { x0: 200 - H - 0.6, x1: 200 - H, z0: -130 - H, z1: -130 },
    box: { x0: 200 - H, x1: 200 + H, z0: -130 - H - 4, z1: -130 + H + 4 }
  }
];

// ---- AI paths ---------------------------------------------------------------
const ALL_RBS = [R1, R2, M1, ...MAGIC];
type P = [number, number];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const dirOf = (h: number): P => [Math.sin(h), Math.cos(h)];
const leftOf = (h: number): P => [Math.cos(h), -Math.sin(h)];
const scale = (a: P, k: number): P => [a[0] * k, a[1] * k];

/** Point where the inbound (or outbound) left-hand lane of an arm meets the roundabout's outer edge. */
function armPoint(rb: Roundabout, angle: number, inbound: boolean, extra = 0, lateral = LANE): P {
  const centre: P = [rb.x, rb.z];
  const out = add(centre, scale(dirOf(angle), rb.outer + extra));
  const travel = inbound ? angle + Math.PI : angle;
  return add(out, scale(leftOf(travel), lateral));
}

/** Circulating radius: the outer lane for left turns and ahead, inner for right turns on 2-lane roundabouts. */
function circRadius(rb: Roundabout, turn: number): number {
  if (rb.mini) return rb.island + 2.6;
  if (rb.lanes === 2) return turn > Math.PI * 1.25 ? rb.island + 3 : rb.outer - 3;
  return (rb.island + rb.outer) / 2;
}

/** Path across a roundabout from one arm to another (clockwise: θ decreasing). */
export function roundaboutPath(rb: Roundabout, fromAngle: number, toAngle: number): P[] {
  let turn = fromAngle - toAngle;
  while (turn <= 0.01) turn += 2 * Math.PI;
  const rc = circRadius(rb, turn);
  const delta = rb.mini ? 0.55 : 0.28;
  const a0 = fromAngle - delta;
  const a1 = fromAngle - turn + delta;
  // Start 2 m back from the ring: that's where a car waits to give way.
  const pts: P[] = [armPoint(rb, fromAngle, true, 2)];
  const steps = Math.max(3, Math.round(((a0 - a1) * rc) / 3));
  for (let i = 0; i <= steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps);
    pts.push([rb.x + rc * Math.sin(a), rb.z + rc * Math.cos(a)]);
  }
  pts.push(armPoint(rb, toAngle, false));
  return pts;
}

const aiPaths: AiPath[] = [];
let pid = 0;
const path = (points: P[], opts: Partial<AiPath> = {}) => aiPaths.push({ id: `p${pid++}`, points, ...opts });

/** Lane centre line from a to b (straight), offset to the left of travel. */
function laneLine(a: P, b: P): P[] {
  const h = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const l = scale(leftOf(h), LANE);
  return [add(a, l), add(b, l)];
}

// Roundabout connectors (every arm to every other arm, plus full circles are not used by AI).
for (const rb of [R1, R2, M1]) {
  for (const a of rb.arms) for (const b of rb.arms) if (a !== b) path(roundaboutPath(rb, a.angle, b.angle), { yieldTo: rb.id });
}
const centreOf = (rb: Roundabout, angle: number): P => add([rb.x, rb.z], scale(dirOf(angle), rb.outer));
/** Where an approach lane ends: 2 m before the ring (the give way line). */
const centreIn = (rb: Roundabout, angle: number): P => add([rb.x, rb.z], scale(dirOf(angle), rb.outer + 2));
// Mill Road: west end ↔ R1 ↔ R2 ↔ east end (passing the Ringway junction).
path([...laneLine([-250, 0], centreIn(R1, W))], { spawn: true });
path([...laneLine(centreOf(R1, W), [-250, 0])]);
path(laneLine(centreOf(R1, E), centreIn(R2, W)));
path(laneLine(centreOf(R2, W), centreIn(R1, E)));
path(laneLine(centreOf(R2, E), [300, 0]));
path(laneLine([300, 0], centreIn(R2, E)), { spawn: true });
// Canal Street: R1 ↔ M1.
path(laneLine(centreOf(R1, N), centreIn(M1, S)));
path(laneLine(centreOf(M1, S), centreIn(R1, N)));
// Ringway east: M1 ↔ bend ↔ R2 north arm.
{
  const a = laneLine(centreOf(M1, E), [200, 180]);
  const b = laneLine([200, 180], centreIn(R2, N));
  path([a[0], [200 - LANE - 4, 180 - LANE], [200 - LANE, 180 - LANE - 4], b[1]]);
  const c = laneLine(centreOf(R2, N), [200, 180]);
  const d = laneLine([200, 180], centreIn(M1, E));
  path([c[0], [200 + LANE, 180 - LANE - 4], [200 - 4, 180 + LANE], d[1]]);
}
// Ringway west from M1: AI leaves the map here (quiet residential).
path(laneLine(centreOf(M1, W), [-120, 180]));
path(laneLine([-120, 180], centreIn(M1, W)), { spawn: true });

/** Left-lane line along a centre-line polyline, with corners chamfered so cars turn smoothly. */
function lanePath(centre: P[], chamfer = 3.4): P[] {
  const segs = centre.slice(1).map((b, i) => {
    const a = centre[i];
    const h = Math.atan2(b[0] - a[0], b[1] - a[1]);
    return { a, b, h, l: scale(leftOf(h), LANE) };
  });
  const out: P[] = [add(segs[0].a, segs[0].l)];
  for (let i = 1; i < segs.length; i++) {
    const p = segs[i - 1];
    const n = segs[i];
    const m = scale(add(p.l, n.l), 0.5);
    const k = (LANE * LANE) / (m[0] * m[0] + m[1] * m[1]);
    const v = add(p.b, scale(m, k));
    out.push(add(v, scale(dirOf(p.h), -chamfer)), add(v, scale(dirOf(n.h), chamfer)));
  }
  const last = segs[segs.length - 1];
  out.push(add(last.b, last.l));
  return out;
}

// Magic Roundabout: Southway down to MN; the ring between the three minis; Gasworks Lane and Wharf Street.
{
  const [mn, me, mw] = MAGIC;
  const cx = MAGIC_C.x;
  const cz = MAGIC_C.z;
  const hf = MAGIC_HALF;
  path(laneLine([200, -142], centreIn(mn, N)));
  path(laneLine(centreOf(mn, N), [200, -142]));
  const ring: Array<[P[], boolean?]> = [
    [[centreOf(mn, W), [cx - hf, cz + hf], centreIn(mw, N)]],
    [[centreOf(mw, N), [cx - hf, cz + hf], centreIn(mn, W)]],
    [[centreOf(mn, E), [cx + hf, cz + hf], centreIn(me, N)]],
    [[centreOf(me, N), [cx + hf, cz + hf], centreIn(mn, E)]],
    [[centreOf(me, S), [cx + hf, cz - hf], [cx - hf, cz - hf], centreIn(mw, S)]],
    [[centreOf(mw, S), [cx - hf, cz - hf], [cx + hf, cz - hf], centreIn(me, S)]],
    [[centreOf(me, E), [298, cz]]],
    [[[298, cz], centreIn(me, E)], true],
  ];
  for (const [pts, spawn] of ring) path(lanePath(pts), spawn ? { spawn: true } : {});
  for (const rb of MAGIC) {
    for (const a of rb.arms) for (const b of rb.arms) if (a !== b) path(roundaboutPath(rb, a.angle, b.angle), { yieldTo: rb.id });
  }
}

/** Smooth lane curve from a (heading ha) to b (heading hb), for turns through a junction. */
function curve(a: P, ha: number, b: P, hb: number, n = 8): P[] {
  const k = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.55;
  const c1 = add(a, scale(dirOf(ha), k));
  const c2 = add(b, scale(dirOf(hb), -k));
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
      u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]
    ]);
  }
  return out;
}

// South side: Station Road – Canal Side – Bridge Street lights (J1) – Southway, and Bridge Street down to Wharf Street.
{
  const J: P = [100, -130];
  const ARM = 12;
  /** Lane point on an arm: `out` = leaving the junction along `angle`, else arriving from that arm. */
  const armLane = (angle: number, out: boolean): P => {
    const h = out ? angle : angle + Math.PI;
    return add(add(J, scale(dirOf(angle), ARM)), scale(leftOf(h), LANE));
  };
  // Arms with AI traffic (Bridge Street north is a dead end for now).
  const arms = [W, E, S];
  for (const a of arms) {
    for (const b of arms) {
      if (a === b) continue;
      const hin = a + Math.PI;
      let turn = b - hin;
      while (turn > Math.PI) turn -= 2 * Math.PI;
      while (turn < -Math.PI) turn += 2 * Math.PI;
      // Straight on or left only (no right turns across oncoming traffic for AI).
      if (Math.abs(turn) < 0.1) path([armLane(a, false), armLane(b, true)]);
      else if (Math.abs(turn - Math.PI / 2) < 0.1) path(curve(armLane(a, false), hin, armLane(b, true), b));
    }
  }
  // West arm ↔ Canal Side ↔ Station Road ↔ R1.
  path(lanePath([centreOf(R1, S), [0, -130], [J[0] - ARM, J[1]]]));
  path(lanePath([[J[0] - ARM, J[1]], [0, -130], centreIn(R1, S)]));
  // East arm ↔ Southway (T-junction: Canal Side gives way).
  path(lanePath([[J[0] + ARM, J[1]], [188, -130]]));
  path(lanePath([[188, -130], [J[0] + ARM, J[1]]]));
  const tIn = add([188, -130], scale(leftOf(E), LANE)); // eastbound, arriving at the T
  const tOut = add([188, -130], scale(leftOf(W), LANE)); // westbound, leaving the T
  const swSouthN = add([200, -118], scale(leftOf(S), LANE)); // Southway southbound, north of the T
  const swSouthS = add([200, -142], scale(leftOf(S), LANE)); // Southway southbound, south of the T
  path(curve(tIn, E, swSouthS, S), { giveWay: true });
  path(curve(swSouthN, S, tOut, W));
  // Southway through the T.
  path(laneLine(centreOf(R2, S), [200, -118]));
  path(laneLine([200, -118], [200, -142]));
  path(laneLine([200, -142], [200, -118]));
  path(laneLine([200, -118], centreIn(R2, S)), { spawn: true });
  // South arm ↔ Bridge Street ↔ Wharf Street ↔ MW.
  const mw = MAGIC[2];
  path(lanePath([[J[0], J[1] - ARM], [100, MAGIC_C.z], centreIn(mw, W)]));
  path(lanePath([centreOf(mw, W), [100, MAGIC_C.z], [J[0], J[1] - ARM]]));
}

// ---- Markings ----------------------------------------------------------------
const markings: Marking[] = [];
const seg = (kind: Marking['kind'], x0: number, z0: number, x1: number, z1: number) => markings.push({ kind, x0, z0, x1, z1 });
for (const l of Object.values(ROADS)) {
  if (l.axis === 'x') seg('centre', l.x0 + 4, l.centre, l.x1 - 4, l.centre);
  else seg('centre', l.centre, l.z0 + 4, l.centre, l.z1 - 4);
}
// Give way lines across each roundabout entry (rule 185: give way to traffic from the right).
for (const rb of ALL_RBS) {
  for (const a of rb.arms) {
    const lanes = a.entryLanes ?? 1;
    const from = armPoint(rb, a.angle, true, 0.4, 0.2);
    const to = armPoint(rb, a.angle, true, 0.4, H * (lanes === 2 ? 1.5 : 1) - 0.2);
    seg('giveway', from[0], from[1], to[0], to[1]);
  }
}
for (const j of junctions) {
  const l = j.line;
  if (l.x1 - l.x0 > l.z1 - l.z0) seg('giveway', l.x0, (l.z0 + l.z1) / 2, l.x1, (l.z0 + l.z1) / 2);
  else seg('giveway', (l.x0 + l.x1) / 2, l.z0, (l.x0 + l.x1) / 2, l.z1);
}

// ---- Signs -------------------------------------------------------------------
const signs: SignPlacement[] = [
  { kind: 'warn-roundabout', x: -60, z: -H - 1.6, faces: E },
  { kind: 'warn-roundabout', x: 60, z: H + 1.6, faces: W },
  { kind: 'warn-roundabout', x: 140, z: -H - 1.6 - 3.8, faces: E },
  { kind: 'warn-roundabout', x: H + 1.6, z: -60, faces: N },
  { kind: 'mini-roundabout', x: -H - 1.2, z: 165, faces: N },
  { kind: 'mini-roundabout', x: 15, z: 180 + H + 1.2, faces: W },
  { kind: 'mini-roundabout', x: 200 + H + 1.2, z: MAGIC_C.z + MAGIC_HALF + 14, faces: S },
  { kind: 'giveway', x: -150 - H - 1.2, z: H + 2.2, faces: S },
  { kind: 'giveway', x: 200 - H - 2.2, z: -130 - H - 1.2, faces: E },
  { kind: 'name', text: 'Mill Road', x: -40, z: H + 2.2, faces: E },
  { kind: 'name', text: 'Canal Street', x: H + 1.4, z: 30, faces: N },
  { kind: 'name', text: 'Station Road', x: -H - 1.4, z: -30, faces: S },
  { kind: 'name', text: 'Ringway', x: 186, z: H + 22, faces: N },
  { kind: 'zone20', x: 200 - H - 1.2, z: -158, faces: S },
  { kind: 'zone20-end', x: 200 + H + 1.2, z: -158, faces: N },
  { kind: 'warn-signals', x: 70, z: -130 - H - 1.6, faces: E },
  { kind: 'warn-signals', x: 135, z: BUS_LANE.z1 + 1.6, faces: W },
  { kind: 'warn-signals', x: 100 + H + 1.6, z: -152, faces: N },
  { kind: 'warn-pedestrians', x: 20, z: -130 - H - 1.6, faces: E },
  { kind: 'warn-pedestrians', x: 75, z: -130 + H + 1.6, faces: W },
  { kind: 'bus-lane', x: 189, z: -130 + H + 1.4, faces: W, text: 'At any time' },
  { kind: 'name', text: 'Bridge Street', x: 100 + H + 1.6, z: -146, faces: N },
  { kind: 'name', text: 'Canal Side', x: 30, z: -130 + H + 1.6, faces: W },
  { kind: 'name', text: 'Wharf Street', x: 125, z: MAGIC_C.z + H + 1.6, faces: W },
  { kind: 'zone20', x: 140, z: MAGIC_C.z - H - 1.2, faces: E },
  { kind: 'zone20-end', x: 140, z: MAGIC_C.z + H + 1.2, faces: W },
  { kind: 'name', text: 'The Magic Roundabout', x: 200 - H - 1.6, z: MAGIC_C.z + MAGIC_HALF + 16, faces: S }
];
// Advance direction signs ("map" signs) on the approaches to R1 and R2.
signs.push(
  {
    kind: 'roundabout-map',
    x: -48,
    z: -H - 2.6,
    faces: E,
    size: 1.6,
    map: { exits: [{ rel: -90, label: 'Station' }, { rel: 0, label: 'Ringway' }, { rel: 90, label: 'Canal St' }] }
  },
  {
    kind: 'roundabout-map',
    x: 118,
    z: -H - 3.8 - 2.6,
    faces: E,
    size: 1.6,
    map: { exits: [{ rel: -90, label: 'Southway' }, { rel: 0, label: 'Mill Rd E' }, { rel: 90, label: 'Ringway' }] }
  },
  {
    kind: 'roundabout-map',
    x: H + 2.6,
    z: -48,
    faces: N,
    size: 1.6,
    map: { exits: [{ rel: -90, label: 'Ringway' }, { rel: 0, label: 'Canal St' }, { rel: 90, label: 'Town Centre' }] }
  }
);

// ---- Markers ---------------------------------------------------------------------
const markers: Marker[] = [
  { id: 'ST1', label: 'Station Road, on the left', x0: -H, x1: -H + 2.8, z0: -95, z1: -77 },
  { id: 'MR1', label: 'Mill Road, on the left', x0: 70, x1: 95, z0: -H, z1: -H + 2.8 },
  { id: 'CS1', label: 'Canal Street, on the left', x0: -H, x1: -H + 2.8, z0: 80, z1: 98 },
  { id: 'SW1', label: 'Southway, on the left', x0: 200 + H - 2.8, x1: 200 + H, z0: -95, z1: -77 },
  { id: 'SW2', label: 'Southway, on the left', x0: 200 - H, x1: 200 - H + 2.8, z0: -95, z1: -77 },
  { id: 'MW1', label: 'Mill Road, on the left', x0: -112, x1: -88, z0: H - 2.8, z1: H },
  { id: 'r2-right-lane', label: '', x0: 140, x1: 176, z0: -H, z1: 0 },
  { id: 'r2-left-lane', label: '', x0: 140, x1: 176, z0: -H - 3.8, z1: -H },
  // Zones for guided prompts (never drawn).
  { id: 'r1-approach-s', label: '', x0: -1, x1: H, z0: -60, z1: -16 },
  { id: 'r1-approach-n', label: '', x0: -H, x1: 1, z0: 16, z1: 60 },
  { id: 'r1-approach-w', label: '', x0: -60, x1: -16, z0: -H, z1: 1 },
  { id: 'r1-approach-e', label: '', x0: 16, x1: 60, z0: -1, z1: H },
  { id: 'r2-approach-w', label: '', x0: 130, x1: 176, z0: -H - 3.8, z1: 1 },
  { id: 'm1-approach-s', label: '', x0: -1, x1: H, z0: 130, z1: 171 },
  { id: 'm1-approach-e', label: '', x0: 9, x1: 60, z0: 179, z1: 180 + H },
  { id: 'ringway-w', label: '', x0: -153.8, x1: -146.2, z0: 60, z1: 170 },
  { id: 'ringway-mill-approach', label: '', x0: -153.8, x1: -150, z0: H, z1: 40 },
  { id: 'magic', label: '', x0: 150, x1: 250, z0: -265, z1: -165 },
  { id: 'BS1', label: 'Bridge Street, on the left', x0: 100 - H, x1: 100 - H + 2.8, z0: -206, z1: -192 },
  { id: 'j1-approach-e', label: '', x0: 60, x1: 94.5, z0: -130 - H, z1: -130 },
  { id: 'j1-approach-w', label: '', x0: 105.5, x1: 150, z0: -130, z1: -130 + H },
  { id: 'j1-approach-s', label: '', x0: 100 - H, x1: 100, z0: -124.5, z1: -80 },
  { id: 'z1-approach-e', label: '', x0: 8, x1: 41.8, z0: -130 - H, z1: -130 },
  { id: 'z1-approach-w', label: '', x0: 48.2, x1: 85, z0: -130, z1: -130 + H },
  { id: 'p1-approach-n', label: '', x0: 0, x1: H, z0: -128, z1: -113.5 },
  { id: 'p1-approach-s', label: '', x0: -H, x1: 0, z0: -106.5, z1: -60 },
  { id: 'u1-approach-s', label: '', x0: 100 - H, x1: 100, z0: -171.5, z1: -140 },
  { id: 'bus-lane-alongside', label: '', x0: 120, x1: 186, z0: -130, z1: -130 + H },
  // Only the practice bays get a drawn marker; the rest are zones.
  ...BAYS.map((b) => ({ id: b.id, label: b.id === 'S7' || b.id === 'N5' ? `Bay ${b.id}` : '', x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 })),
  { id: 'PP1', label: 'The gap between the parked cars', ...PARALLEL_GAP },
  { id: 'car-park', label: '', ...CAR_PARK },
  { id: 'n5-setup', label: '', x0: 50, x1: 58.5, z0: -89, z1: -80 },
  { id: 's7-setup', label: '', x0: 57, x1: 64, z0: -89, z1: -80 },
  { id: 'pp-setup', label: '', x0: 99, x1: 101.6, z0: -67, z1: -59 },
  { id: 'bridge-north', label: '', x0: 100, x1: 100 + H, z0: -100, z1: -40 },
  { id: 'mn-approach-n', label: '', x0: 196, x1: 200 + H, z0: -165, z1: -125 },
  { id: 'southway-s', label: '', x0: 200 - H, x1: 200, z0: -120, z1: -40 }
];

// ---- Signals, crossings and stop lines (rules 175–178, 191–199) ----------------
const crossings: Crossing[] = [
  {
    id: 'P1',
    kind: 'pelican',
    name: 'Station Road pelican crossing',
    area: { x0: -H, x1: H, z0: -112, z1: -108 },
    axis: 'z',
    controller: 'P1',
    zigzag: [
      { x0: -H, x1: H, z0: -122, z1: -113.7 },
      { x0: -H, x1: H, z0: -106.3, z1: -98 }
    ]
  },
  {
    id: 'Z1',
    kind: 'zebra',
    name: 'Canal Side zebra crossing',
    area: { x0: 43, x1: 47, z0: -130 - H, z1: -130 + H },
    axis: 'x',
    zigzag: [
      { x0: 33, x1: 41.6, z0: -130 - H, z1: -130 + H },
      { x0: 48.4, x1: 57, z0: -130 - H, z1: -130 + H }
    ]
  },
  {
    id: 'U1',
    kind: 'puffin',
    name: 'Bridge Street puffin crossing',
    area: { x0: 100 - H, x1: 100 + H, z0: -177, z1: -173 },
    axis: 'z',
    controller: 'U1',
    zigzag: [
      { x0: 100 - H, x1: 100 + H, z0: -187, z1: -178.7 },
      { x0: 100 - H, x1: 100 + H, z0: -171.3, z1: -163 }
    ]
  }
];
const signals: SignalController[] = [
  {
    id: 'J1',
    kind: 'junction',
    groups: ['ew', 'ns'],
    heads: [
      { x: 91, z: -130 - H - 0.9, faces: E, group: 'ew' },
      { x: 109, z: -130 + H + 0.9, faces: W, group: 'ew' },
      { x: 100 + H + 0.9, z: -139, faces: N, group: 'ns' },
      { x: 100 - H - 0.9, z: -121, faces: S, group: 'ns' }
    ]
  },
  {
    id: 'P1',
    kind: 'pelican',
    groups: ['road'],
    heads: [
      { x: -H - 0.9, z: -105, faces: S, group: 'road' },
      { x: H + 0.9, z: -115, faces: N, group: 'road' }
    ]
  },
  {
    id: 'U1',
    kind: 'puffin',
    groups: ['road'],
    heads: [
      { x: 100 - H - 0.9, z: -170, faces: S, group: 'road' },
      { x: 100 + H + 0.9, z: -180, faces: N, group: 'road' }
    ]
  }
];
const sig = (controller: string, group: string) => ({ controller, group });
const stopLines: StopLine[] = [
  { id: 'J1-e', x: 94.2, z: -130 - LANE, heading: E, signal: sig('J1', 'ew') },
  { id: 'J1-w', x: 105.8, z: -130 + LANE, heading: W, signal: sig('J1', 'ew') },
  { id: 'J1-n', x: 100 + LANE, z: -135.8, heading: N, signal: sig('J1', 'ns') },
  { id: 'J1-s', x: 100 - LANE, z: -124.2, heading: S, signal: sig('J1', 'ns') },
  { id: 'P1-s', x: -LANE, z: -106.3, heading: S, signal: sig('P1', 'road'), crossing: 'P1' },
  { id: 'P1-n', x: LANE, z: -113.7, heading: N, signal: sig('P1', 'road'), crossing: 'P1' },
  { id: 'Z1-e', x: 41.6, z: -130 - LANE, heading: E, crossing: 'Z1' },
  { id: 'Z1-w', x: 48.4, z: -130 + LANE, heading: W, crossing: 'Z1' },
  { id: 'U1-s', x: 100 - LANE, z: -171.3, heading: S, signal: sig('U1', 'road'), crossing: 'U1' },
  { id: 'U1-n', x: 100 + LANE, z: -178.7, heading: N, signal: sig('U1', 'road'), crossing: 'U1' }
];
// No centre line across crossings or the box junction.
{
  const gaps = [...crossings.map((c) => c.area), { x0: 100 - H, x1: 100 + H, z0: -130 - H, z1: -130 + H }].map((r) => grow2(r, 0.6));
  for (const g of gaps) {
    for (let i = markings.length - 1; i >= 0; i--) {
      const m = markings[i];
      if (m.kind !== 'centre') continue;
      const alongX = m.z0 === m.z1;
      if (alongX ? m.z0 < g.z0 || m.z0 > g.z1 : m.x0 < g.x0 || m.x0 > g.x1) continue;
      const [a0, a1] = alongX ? [Math.min(m.x0, m.x1), Math.max(m.x0, m.x1)] : [Math.min(m.z0, m.z1), Math.max(m.z0, m.z1)];
      const [g0, g1] = alongX ? [g.x0, g.x1] : [g.z0, g.z1];
      if (g1 <= a0 || g0 >= a1) continue;
      markings.splice(i, 1);
      const mk = (b0: number, b1: number) => (alongX ? { kind: m.kind, x0: b0, x1: b1, z0: m.z0, z1: m.z0 } : { kind: m.kind, x0: m.x0, x1: m.x0, z0: b0, z1: b1 });
      if (g0 > a0) markings.push(mk(a0, g0));
      if (g1 < a1) markings.push(mk(g1, a1));
    }
  }
}
for (const l of stopLines) {
  // Paint across the lane: solid stop lines at signals, give way dashes at a zebra.
  const fx = Math.sin(l.heading);
  const fz = Math.cos(l.heading);
  const [lx2, lz2] = [fz * LANE, -fx * LANE];
  const kind = l.signal ? 'stop' : 'giveway';
  seg(kind, l.x - lx2, l.z - lz2, l.x + lx2, l.z + lz2);
}

const obstacles: Obstacle[] = [
  { kind: 'gate', x0: -252, x1: -250, z0: -H, z1: H },
  { kind: 'gate', x0: 300, x1: 302, z0: -H, z1: H },
  { kind: 'gate', x0: 300, x1: 302, z0: MAGIC_C.z - H, z1: MAGIC_C.z + H },
  { kind: 'gate', x0: 100 - H, x1: 100 + H, z0: -40, z1: -38 },
  // Parked cars: either side of the parallel-parking gap on Bridge Street north…
  { kind: 'car', x0: 102.0, x1: 103.8, z0: -80.2, z1: -76, color: 0x2e5c8a },
  { kind: 'car', x0: 102.0, x1: 103.8, z0: -66, z1: -61.8, color: 0xb8352f },
  // …and in some of the car park bays (S7 and N5 are left free for practice).
  ...['S3', 'S4', 'S6', 'S8', 'S11', 'S12', 'S14', 'N2', 'N4', 'N6', 'N7', 'N10', 'N13'].map((id, i): Obstacle => {
    const b = BAYS.find((q) => q.id === id)!;
    const cx = (b.x0 + b.x1) / 2;
    const cz = (b.z0 + b.z1) / 2;
    return { kind: 'car', x0: cx - 0.9, x1: cx + 0.9, z0: cz - 2.05, z1: cz + 2.05, color: [0x3c3f44, 0xe8e4da, 0x6b8f3a, 0xd9a22e, 0x9aa3ab, 0x7a4f9a][i % 6] };
  })
];
// Bay lines (white), and the car park's edge lines.
for (const b of BAYS) {
  seg('edge', b.x0, b.z0, b.x0, b.z1);
  seg('edge', b.x1, b.z0, b.x1, b.z1);
}

export const MILL_TOWN: SceneLayout = {
  name: 'Mill Town',
  drivable,
  pavements,
  obstacles,
  markers,
  speedZones: [
    { name: 'Magic Roundabout 20 zone', mph: 20, x0: 140, x1: 305, z0: -265, z1: -160 },
    { name: 'Mill Town', mph: 30, x0: -300, x1: 320, z0: -300, z1: 220 }
  ],
  lanes: Object.values(ROADS),
  start: { x: H - 1.15, z: -90, heading: N },
  bays: [],
  markings,
  signs,
  junctions,
  bends: [grow2(bend(-150, 180), 14), grow2(bend(200, 180), 14), grow2(bend(0, -130), 14), grow2(bend(100, MAGIC_C.z), 14), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => grow2(bend(MAGIC_C.x + sx * MAGIC_HALF, MAGIC_C.z + sz * MAGIC_HALF), 12)))],
  roundabouts: ALL_RBS,
  aiPaths,
  stopLines,
  crossings,
  signals,
  carParks: [CAR_PARK],
  boxes: [{ id: 'J1', x0: 100 - H, x1: 100 + H, z0: -130 - H, z1: -130 + H }],
  busLanes: [{ ...BUS_LANE, heading: W, hours: 'At any time' }]
};

function grow2(r: Rect, by: number): Rect {
  return { x0: r.x0 - by, x1: r.x1 + by, z0: r.z0 - by, z1: r.z1 + by };
}

/** Kerb-side starting positions. */
export const MT_STARTS = {
  stationNorth: (z: number) => ({ x: H - 1.15, z, heading: N }),
  stationSouth: (z: number) => ({ x: -H + 1.15, z, heading: S }),
  millEast: (x: number) => ({ x, z: -H + 1.15, heading: E }),
  millWest: (x: number) => ({ x, z: H - 1.15, heading: W }),
  southwayNorth: (z: number) => ({ x: 200 + H - 1.15, z, heading: N }),
  southwaySouth: (z: number) => ({ x: 200 - H + 1.15, z, heading: S }),
  bridgeSouth: (z: number) => ({ x: 100 - H + 1.15, z, heading: S }),
  canalNorth: (z: number) => ({ x: H - 1.15, z, heading: N })
};
export const MT_HEADINGS = { E, W, N, S };
export const MAGIC_CENTRE = MAGIC_C;
export const MAGIC_HALF_SIZE = MAGIC_HALF;

/** Route-hint arc across a roundabout from one arm id to another. */
export function rbArc(rb: Roundabout, from: string, to: string): Array<[number, number]> {
  const a = rb.arms.find((x) => x.id === from)!;
  const b = rb.arms.find((x) => x.id === to)!;
  return roundaboutPath(rb, a.angle, b.angle);
}

/** Join route pieces (point lists) into one hint polyline. */
export function route(...parts: Array<Array<[number, number]>>): Array<[number, number]> {
  return parts.flat();
}
