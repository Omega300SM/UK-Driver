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
import type { AiPath, Junction, Lane, Marker, Marking, Obstacle, Rect, Roundabout, SceneLayout, SignPlacement } from '../layout';

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
  wharf: lx('Wharf Street', MAGIC_C.z, 110, MAGIC_C.x - MAGIC_HALF - 7)
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

const drivable: Rect[] = [
  ...Object.values(ROADS),
  R2_FLARE,
  bend(-150, 180),
  bend(200, 180),
  bend(0, -130),
  // Junction mouths and bends get rounded kerbs.
  ...filletsZ(-150, H, 1), // Ringway (west) meets Mill Road
  ...filletsX(-130, 200 - H, -1), // Canal Side meets Southway
  ...filletsZ(-150, 180 - H, -1, CORNER_R, 5, 'high'), // inside of the north-west bend
  ...filletsZ(200, 180 - H, -1, CORNER_R, 5, 'low'), // inside of the north-east bend
  ...filletsZ(0, -130 + H, 1, CORNER_R, 5, 'high'), // inside of the Station Road / Canal Side bend
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
  ...pavementsAlong({ ...ROADS.canalSide, x0: H + PAVE, x1: 200 - H - CORNER_R - 0.3 }),
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
// Station Road and Southway stubs.
path(laneLine(centreOf(R1, S), [0, -110]));
path(laneLine([0, -110], centreIn(R1, S)), { spawn: true });
path(laneLine(centreOf(R2, S), [200, -110]));
path(laneLine([200, -110], centreIn(R2, S)), { spawn: true });

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
  path(laneLine([200, -110], centreIn(mn, N)));
  path(laneLine(centreOf(mn, N), [200, -110]));
  const ring: Array<[P[], boolean?]> = [
    [[centreOf(mn, W), [cx - hf, cz + hf], centreIn(mw, N)]],
    [[centreOf(mw, N), [cx - hf, cz + hf], centreIn(mn, W)]],
    [[centreOf(mn, E), [cx + hf, cz + hf], centreIn(me, N)]],
    [[centreOf(me, N), [cx + hf, cz + hf], centreIn(mn, E)]],
    [[centreOf(me, S), [cx + hf, cz - hf], [cx - hf, cz - hf], centreIn(mw, S)]],
    [[centreOf(mw, S), [cx - hf, cz - hf], [cx + hf, cz - hf], centreIn(me, S)]],
    [[centreOf(me, E), [298, cz]]],
    [[[298, cz], centreIn(me, E)], true],
    [[centreOf(mw, W), [112, cz]]],
    [[[112, cz], centreIn(mw, W)], true]
  ];
  for (const [pts, spawn] of ring) path(lanePath(pts), spawn ? { spawn: true } : {});
  for (const rb of MAGIC) {
    for (const a of rb.arms) for (const b of rb.arms) if (a !== b) path(roundaboutPath(rb, a.angle, b.angle), { yieldTo: rb.id });
  }
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
  { id: 'mn-approach-n', label: '', x0: 196, x1: 200 + H, z0: -165, z1: -125 },
  { id: 'southway-s', label: '', x0: 200 - H, x1: 200, z0: -120, z1: -40 }
];

const obstacles: Obstacle[] = [
  { kind: 'gate', x0: -252, x1: -250, z0: -H, z1: H },
  { kind: 'gate', x0: 300, x1: 302, z0: -H, z1: H },
  { kind: 'gate', x0: 300, x1: 302, z0: MAGIC_C.z - H, z1: MAGIC_C.z + H },
  { kind: 'gate', x0: 108, x1: 110, z0: MAGIC_C.z - H, z1: MAGIC_C.z + H }
];

export const MILL_TOWN: SceneLayout = {
  name: 'Mill Town',
  drivable,
  pavements,
  obstacles,
  markers,
  speedZones: [
    { name: 'Magic Roundabout 20 zone', mph: 20, x0: 100, x1: 305, z0: -265, z1: -160 },
    { name: 'Mill Town', mph: 30, x0: -300, x1: 320, z0: -300, z1: 220 }
  ],
  lanes: Object.values(ROADS),
  start: { x: H - 1.15, z: -90, heading: N },
  bays: [],
  markings,
  signs,
  junctions,
  bends: [grow2(bend(-150, 180), 14), grow2(bend(200, 180), 14), grow2(bend(0, -130), 14), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => grow2(bend(MAGIC_C.x + sx * MAGIC_HALF, MAGIC_C.z + sz * MAGIC_HALF), 12)))],
  roundabouts: ALL_RBS,
  aiPaths
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
