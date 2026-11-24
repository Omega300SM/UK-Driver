import * as THREE from 'three';
import type { BuiltScene } from './carPark';
import { MILL_TOWN, ROADS, R1, R2, M1, MAGIC, MAGIC_CENTRE, MAGIC_HALF_SIZE, R2_FLARE, H, CAR_PARK } from './millTownLayout';
import { isDrivable, type Lane, type Roundabout } from '../layout';
import { buildStreet } from '../street3d';
import { instanced, lambert, baseBox, roofPrism, rng, type Placement } from '../props';
import { fascia } from '../signs';
import { markerMeshes, hintPathFactory, flat, addMarkings, signPost } from '../common';

const BRICKS = [0x9a4a33, 0x8e4433, 0xa4513a, 0x7d3b2b, 0xb5634a, 0x86412f];
const DOORS = [0x1d3f6e, 0x7a1f2b, 0x2f5d3a, 0x222222, 0xd9b44a, 0x5a8fa8];
const AWNINGS = [0x2f8a5f, 0xb8352f, 0x1d3f6e, 0xd9a22e, 0x7a4f9a];
const PAVE = 2.6;

/**
 * Mill Town: red-brick terraces, an old cotton mill, a canal with narrowboats,
 * roundabouts with planted islands, and the Pennines on the skyline.
 */
export function buildMillTown(): BuiltScene {
  const L = MILL_TOWN;
  const root = new THREE.Group();
  const box = baseBox();
  const r = rng(23);

  root.add(new THREE.HemisphereLight(0xe2ecf5, 0x5b6f45, 1.2));
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.45);
  sun.position.set(80, 90, -60);
  root.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), lambert(0x6f9a52));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(20, -0.02, -40);
  root.add(ground);

  // Roads.
  const tarmac = lambert(0x4e5257);
  for (const d of L.drivable) root.add(flat(d, tarmac, 0));
  root.add(instanced(box, lambert(0xb5b1a6), L.pavements.map((p) => ({ x: (p.x0 + p.x1) / 2, z: (p.z0 + p.z1) / 2, sx: p.x1 - p.x0, sy: 0.13, sz: p.z1 - p.z0 }))));

  // Roundabouts: tarmac discs, raised planted islands, painted minis.
  for (const rb of L.roundabouts ?? []) addRoundabout(root, rb);
  // The Magic Roundabout's central island.
  const magicIsland = new THREE.Mesh(box, lambert(0x7fb35a));
  const inner = MAGIC_HALF_SIZE - H;
  magicIsland.scale.set(inner * 2, 0.25, inner * 2);
  magicIsland.position.set(MAGIC_CENTRE.x, 0, MAGIC_CENTRE.z);
  root.add(magicIsland);
  const magicSign = new THREE.Mesh(new THREE.PlaneGeometry(14, 1.8), new THREE.MeshBasicMaterial({ map: fascia('THE MAGIC ROUNDABOUT', '#1d4f9c'), side: THREE.DoubleSide }));
  magicSign.position.set(MAGIC_CENTRE.x, 2.4, MAGIC_CENTRE.z + inner - 3);
  root.add(magicSign);

  addMarkings(root, L.markings ?? []);
  const street = buildStreet(root, L);
  addSpiral(root, R2);
  addLaneArrows(root);

  // ---- Buildings -------------------------------------------------------------
  const walls: Placement[] = [];
  const roofs: Placement[] = [];
  const chimneys: Placement[] = [];
  const windows: Placement[] = [];
  const doors: Placement[] = [];
  const shopfronts: Placement[] = [];
  const awnings: Placement[] = [];
  /** Terraces along one side of a lane between a and b (along its axis). */
  const terrace = (l: Lane, side: -1 | 1, a: number, b: number, opts: { shop?: boolean; h?: number } = {}) => {
    const depth = 9;
    const face = l.centre + side * (H + PAVE + 0.4);
    for (let u = a; u + 5 <= b; u += 5.6) {
      const h = (opts.h ?? 6.6) + (r() < 0.25 ? 0.8 : 0);
      const c = face + (side * depth) / 2;
      const col = BRICKS[Math.floor(r() * BRICKS.length)];
      const fo = face - side * 0.05;
      if (l.axis === 'x') {
        walls.push({ x: u + 2.8, z: c, sx: 5.6, sy: h, sz: depth, color: col });
        roofs.push({ x: u + 2.8, y: h, z: c, sx: 5.7, sy: 2.4, sz: depth + 0.4 });
        if (r() < 0.55) chimneys.push({ x: u + (r() < 0.5 ? 0.6 : 5), y: h + 1.2, z: c, sx: 0.8, sy: 1.8, sz: 1.2 });
        windows.push({ x: u + 1.6, y: 3.9, z: fo, sx: 1.3, sy: 1.3, sz: 0.12 }, { x: u + 4, y: 3.9, z: fo, sx: 1.3, sy: 1.3, sz: 0.12 });
        if (opts.shop) {
          shopfronts.push({ x: u + 2.8, y: 0.3, z: fo, sx: 4.6, sy: 2.2, sz: 0.14 });
          awnings.push({ x: u + 2.8, y: 2.7, z: face + side * 0.6 * -1, sx: 4.8, sy: 0.25, sz: 1.3, color: AWNINGS[Math.floor(r() * AWNINGS.length)] });
        } else {
          windows.push({ x: u + 4, y: 1.0, z: fo, sx: 1.4, sy: 1.3, sz: 0.12 });
          doors.push({ x: u + 1.4, y: 0, z: fo, sx: 1.0, sy: 2.1, sz: 0.14, color: DOORS[Math.floor(r() * DOORS.length)] });
        }
      } else {
        walls.push({ x: c, z: u + 2.8, sx: depth, sy: h, sz: 5.6, color: col });
        roofs.push({ x: c, y: h, z: u + 2.8, sx: 5.7, sy: 2.4, sz: depth + 0.4, ry: Math.PI / 2 });
        if (r() < 0.55) chimneys.push({ x: c, y: h + 1.2, z: u + (r() < 0.5 ? 0.6 : 5), sx: 1.2, sy: 1.8, sz: 0.8 });
        windows.push({ x: fo, y: 3.9, z: u + 1.6, sx: 0.12, sy: 1.3, sz: 1.3 }, { x: fo, y: 3.9, z: u + 4, sx: 0.12, sy: 1.3, sz: 1.3 }, { x: fo, y: 1.0, z: u + 4, sx: 0.12, sy: 1.3, sz: 1.4 });
        doors.push({ x: fo, y: 0, z: u + 1.4, sx: 0.14, sy: 2.1, sz: 1.0, color: DOORS[Math.floor(r() * DOORS.length)] });
      }
    }
  };
  // Mill Road: shops in the town centre (west), terraces towards the Ringway.
  terrace(ROADS.millW, -1, -245, -165, { shop: true, h: 8 });
  terrace(ROADS.millW, 1, -245, -165, { shop: true, h: 8 });
  terrace(ROADS.millW, -1, -136, -30, { shop: true, h: 8 });
  terrace(ROADS.millW, 1, -136, -30, { shop: true, h: 8 });
  terrace(ROADS.millMid, -1, 30, 130);
  terrace(ROADS.millMid, 1, 30, 130);
  terrace(ROADS.millE, -1, 236, 296);
  terrace(ROADS.millE, 1, 236, 296);
  // Station Road terraces (west side) and Ringway West.
  terrace(ROADS.station, -1, -120, -30);
  terrace(ROADS.ringwayW, -1, 20, 166);
  terrace(ROADS.ringwayW, 1, 20, 166);
  terrace(ROADS.ringway, 1, -136, -20);
  terrace(ROADS.ringway, 1, 20, 186);
  terrace(ROADS.ringwayE, 1, 40, 166);
  terrace(ROADS.canalSide, -1, 20, 86);
  terrace(ROADS.canalSide, -1, 114, 180);
  terrace(ROADS.bridge, -1, -205, -142);
  terrace(ROADS.bridge, 1, -205, -142, { shop: true, h: 8 });
  terrace(ROADS.bridge, 1, -116, -46);
  root.add(instanced(box, lambert(0xffffff), walls));
  root.add(instanced(roofPrism(), lambert(0x4a4f57), roofs));
  root.add(instanced(box, lambert(0x7a3b2c), chimneys));
  root.add(instanced(box, lambert(0x3d4d5c), windows));
  root.add(instanced(box, lambert(0xffffff), doors));
  root.add(instanced(box, lambert(0x2b3a45), shopfronts));
  root.add(instanced(box, lambert(0xffffff), awnings));

  // Albion Mill: a big red-brick cotton mill with rows of windows and a tall chimney.
  const mill = new THREE.Group();
  const millBody = new THREE.Mesh(box, lambert(0x8e4433));
  millBody.scale.set(70, 20, 22);
  mill.add(millBody);
  const millWin: Placement[] = [];
  for (let fl = 0; fl < 5; fl++) for (let i = 0; i < 16; i++) millWin.push({ x: -32 + i * 4.3, y: 1.8 + fl * 3.6, z: 11.05, sx: 2.2, sy: 2.1, sz: 0.1 });
  mill.add(instanced(box, lambert(0x2d3a44), millWin));
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 42, 10), lambert(0x7a3b2c));
  stack.position.set(40, 21, 0);
  mill.add(stack);
  const millSign = new THREE.Mesh(new THREE.PlaneGeometry(22, 2.4), new THREE.MeshBasicMaterial({ map: fascia('ALBION MILL 1879', '#4a3326') }));
  millSign.position.set(0, 17, 11.1);
  mill.add(millSign);
  mill.position.set(80, 0, 60);
  mill.rotation.y = Math.PI;
  root.add(mill);

  // The canal along Canal Street (east side), with a towpath and narrowboats.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(10, 150), lambert(0x3f6f7e));
  water.rotation.x = -Math.PI / 2;
  water.position.set(H + PAVE + 9, 0.02, 95);
  root.add(water);
  const boats: Placement[] = [];
  const cabins: Placement[] = [];
  for (const [z, col] of [
    [60, 0x2f5d3a],
    [92, 0x7a1f2b],
    [130, 0x1d3f6e]
  ] as const) {
    boats.push({ x: H + PAVE + 7, y: 0, z, sx: 2.1, sy: 0.9, sz: 18, color: col });
    cabins.push({ x: H + PAVE + 7, y: 0.9, z: z - 1, sx: 1.8, sy: 1.0, sz: 12, color: 0xd9b44a });
  }
  root.add(instanced(box, lambert(0xffffff), boats));
  root.add(instanced(box, lambert(0xffffff), cabins));

  // Station building on Station Road (east side).
  const station = new THREE.Mesh(box, lambert(0xb5634a));
  station.scale.set(14, 7, 30);
  station.position.set(H + PAVE + 8, 0, -70);
  root.add(station);
  const stationSign = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.4), new THREE.MeshBasicMaterial({ map: fascia('MILL TOWN STATION', '#b8352f') }));
  stationSign.position.set(H + PAVE + 0.9, 5, -70);
  stationSign.rotation.y = -Math.PI / 2;
  root.add(stationSign);

  // Gasholder by Gasworks Lane (open frame of columns and rings).
  const gas = new THREE.Group();
  const cols: Placement[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    cols.push({ x: Math.sin(a) * 16, z: Math.cos(a) * 16, sx: 0.6, sy: 22, sz: 0.6 });
  }
  gas.add(instanced(box, lambert(0x5b6670), cols));
  for (const y of [7, 14, 21.5]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(16, 0.35, 4, 24), lambert(0x5b6670));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    gas.add(ring);
  }
  gas.position.set(275, 0, -250);
  root.add(gas);

  // Pennine hills on the horizon.
  const hills: Placement[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    hills.push({ x: 20 + Math.sin(a) * (430 + r() * 60), z: -40 + Math.cos(a) * (430 + r() * 60), sx: 120 + r() * 80, sy: 40 + r() * 50, sz: 120 + r() * 80, color: r() < 0.5 ? 0x6b7f4a : 0x7d7a56 });
  }
  root.add(instanced(new THREE.ConeGeometry(0.5, 1, 6).translate(0, 0.5, 0), lambert(0xffffff, { flatShading: true, fog: false }), hills));

  // Trees and street lights.
  const trunks: Placement[] = [];
  const crowns: Placement[] = [];
  const tree = (x: number, z: number, s = 0.8 + r() * 0.6) => {
    if (isDrivable(L, x, z) || isDrivable(L, x + 2, z) || isDrivable(L, x - 2, z) || isDrivable(L, x, z + 2) || isDrivable(L, x, z - 2)) return;
    trunks.push({ x, z, sx: 0.4 * s, sy: 2.4 * s, sz: 0.4 * s });
    crowns.push({ x, y: 2 * s, z, sx: 3.4 * s, sy: 3.6 * s, sz: 3.4 * s, color: r() < 0.5 ? 0x4c7a34 : 0x5d8a3c });
  };
  for (let i = 0; i < 10; i++) tree(MAGIC_CENTRE.x - 25 + r() * 50, MAGIC_CENTRE.z - 25 + r() * 50);
  for (let i = 0; i < 30; i++) tree(-60 + r() * 52, -40 - r() * 80);
  for (let i = 0; i < 20; i++) tree(220 + r() * 70, 30 + r() * 140);
  root.add(instanced(box, lambert(0x5b4330), trunks));
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 0).translate(0, 0.6, 0), lambert(0xffffff, { flatShading: true }), crowns));

  const poles: Placement[] = [];
  for (const l of Object.values(ROADS)) {
    const [a, b] = l.axis === 'x' ? [l.x0, l.x1] : [l.z0, l.z1];
    for (let u = a + 10; u < b - 10; u += 34) {
      const off = l.centre - H - PAVE + 0.4;
      poles.push(l.axis === 'x' ? { x: u, z: off } : { x: off, z: u });
    }
  }
  root.add(instanced(box, lambert(0x3a3f45), poles.map((p) => ({ ...p, sx: 0.14, sy: 6, sz: 0.14 }))));
  root.add(instanced(box, lambert(0xf4f1d0), poles.map((p) => ({ ...p, y: 6, sx: 0.5, sy: 0.18, sz: 0.5 }))));

  for (const s of L.signs ?? []) root.add(signPost(s));
  for (const o of L.obstacles) {
    if (o.kind !== 'gate') continue;
    const m = new THREE.Mesh(box, lambert(0x9b968a));
    m.scale.set(o.x1 - o.x0, 1.2, o.z1 - o.z0);
    m.position.set((o.x0 + o.x1) / 2, 0, (o.z0 + o.z1) / 2);
    root.add(m);
  }

  // Albion Retail Park: a supermarket behind the car park, and parked cars.
  const shop = new THREE.Mesh(box, lambert(0xd9d4c7));
  shop.scale.set(40, 7, 16);
  shop.position.set((CAR_PARK.x0 + CAR_PARK.x1) / 2, 0, CAR_PARK.z1 + PAVE + 8.5);
  root.add(shop);
  const shopSign = new THREE.Mesh(new THREE.PlaneGeometry(16, 1.8), new THREE.MeshBasicMaterial({ map: fascia('ALBION FOODSTORE', '#2f8a5f') }));
  shopSign.position.set((CAR_PARK.x0 + CAR_PARK.x1) / 2, 5.4, CAR_PARK.z1 + PAVE + 0.45);
  shopSign.rotation.y = Math.PI;
  root.add(shopSign);
  root.add(instanced(box, lambert(0xb5b1a6), [{ x: (CAR_PARK.x0 + CAR_PARK.x1) / 2, z: CAR_PARK.z1 + PAVE / 2, sx: CAR_PARK.x1 - CAR_PARK.x0, sy: 0.13, sz: PAVE }]));
  const parked = L.obstacles.filter((o) => o.kind === 'car');
  const along = (o: (typeof parked)[number]) => o.z1 - o.z0 > o.x1 - o.x0;
  root.add(
    instanced(
      box,
      lambert(0xffffff),
      parked.map((o) => ({ x: (o.x0 + o.x1) / 2, y: 0.3, z: (o.z0 + o.z1) / 2, sx: along(o) ? 1.8 : 4.1, sy: 0.62, sz: along(o) ? 4.1 : 1.8, color: o.color ?? 0x888888 }))
    )
  );
  root.add(instanced(box, lambert(0x9fc3d6), parked.map((o) => ({ x: (o.x0 + o.x1) / 2, y: 0.92, z: (o.z0 + o.z1) / 2, sx: along(o) ? 1.6 : 2.2, sy: 0.55, sz: along(o) ? 2.2 : 1.6 }))));

  // Low grey Pennine cloud.
  const clouds: Placement[] = [];
  for (let i = 0; i < 22; i++) clouds.push({ x: -400 + r() * 800, y: 55 + r() * 25, z: -450 + r() * 800, sx: 24 + r() * 26, sy: 6 + r() * 4, sz: 14 + r() * 14 });
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshBasicMaterial({ color: 0xeef0f2, fog: false }), clouds));

  const mk = markerMeshes(root, L);
  return { layout: L, root, markers: mk.markers, setMarker: mk.setMarker, setHintPath: hintPathFactory(root), update: mk.update, updateStreet: street.update };
}

function addRoundabout(root: THREE.Group, rb: Roundabout): void {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(rb.outer + 0.3, 48), lambert(0x4e5257));
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(rb.x, 0.004, rb.z);
  root.add(disc);
  if (rb.mini) {
    // Painted white dome: you MUST pass round it (rule 188).
    const paint = new THREE.Mesh(new THREE.CircleGeometry(rb.island, 32), new THREE.MeshBasicMaterial({ color: 0xf2f2ec }));
    paint.rotation.x = -Math.PI / 2;
    paint.position.set(rb.x, 0.02, rb.z);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(rb.island, 20, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xeeeeea }));
    dome.scale.y = 0.06;
    dome.position.set(rb.x, 0.01, rb.z);
    root.add(paint, dome);
    return;
  }
  // Raised island with a kerb, grass and planting.
  const kerb = new THREE.Mesh(new THREE.CylinderGeometry(rb.island, rb.island, 0.18, 40), lambert(0xd8d4c8));
  kerb.position.set(rb.x, 0.09, rb.z);
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(rb.island - 0.35, rb.island - 0.35, 0.3, 40), lambert(0x7fb35a));
  grass.position.set(rb.x, 0.15, rb.z);
  root.add(kerb, grass);
  const beds: Placement[] = [];
  const rr = rng(rb.island * 100);
  for (let i = 0; i < 28; i++) {
    const a = rr() * Math.PI * 2;
    const d = rb.island * (0.35 + rr() * 0.5);
    beds.push({ x: rb.x + Math.sin(a) * d, y: 0.25, z: rb.z + Math.cos(a) * d, sx: 0.9, sy: 0.5, sz: 0.9, color: [0xd23c5a, 0xf2c230, 0xffffff, 0x9b59b6][i % 4] });
  }
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 0), lambert(0xffffff, { flatShading: true }), beds));
  const t = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), lambert(0x4c7a34, { flatShading: true }));
  t.position.set(rb.x, 3.2, rb.z);
  const trunk = new THREE.Mesh(baseBox(), lambert(0x5b4330));
  trunk.scale.set(0.5, 2.4, 0.5);
  trunk.position.set(rb.x, 0.2, rb.z);
  root.add(t, trunk);
}

/** Spiral lane markings on a two-lane roundabout: dashed lines that lead the inner lane out. */
function addSpiral(root: THREE.Group, rb: Roundabout): void {
  const dashes: Placement[] = [];
  const mid = (rb.island + rb.outer) / 2;
  for (const arm of rb.arms) {
    // From the lane divide just after one entry, spiralling out to the next exit.
    const start = arm.angle - 0.45;
    const end = arm.angle - Math.PI / 2 + 0.12;
    for (let k = 0; k <= 1; k += 0.035) {
      const a = start + (end - start) * k;
      const rad = mid + (rb.outer - 0.6 - mid) * k * k;
      const a2 = a - 0.04;
      const x = rb.x + Math.sin(a) * rad;
      const z = rb.z + Math.cos(a) * rad;
      const x2 = rb.x + Math.sin(a2) * rad;
      const z2 = rb.z + Math.cos(a2) * rad;
      dashes.push({ x: (x + x2) / 2, y: 0.015, z: (z + z2) / 2, ry: Math.atan2(x2 - x, z2 - z), sx: 0.12, sy: 0.01, sz: Math.hypot(x2 - x, z2 - z) });
    }
  }
  root.add(instanced(baseBox(), new THREE.MeshBasicMaterial({ color: 0xe9e9e2 }), dashes));
}

/** Arrows painted in the two lanes approaching R2 from the west. */
function addLaneArrows(root: THREE.Group): void {
  const tex = (kind: 'left-ahead' | 'ahead-right') => {
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 128;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#e9e9e2';
    c.fillRect(28, 40, 8, 84);
    c.beginPath();
    c.moveTo(32, 4);
    c.lineTo(46, 40);
    c.lineTo(18, 40);
    c.fill();
    const dir = kind === 'left-ahead' ? -1 : 1;
    c.fillRect(32 + (dir < 0 ? -22 : 0), 78, 22, 8);
    c.beginPath();
    c.moveTo(32 + dir * 32, 82);
    c.lineTo(32 + dir * 20, 70);
    c.lineTo(32 + dir * 20, 94);
    c.fill();
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  for (const [kind, z] of [
    ['left-ahead', -H - 1.9],
    ['ahead-right', -1.9]
  ] as const) {
    for (const x of [150, 166]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4.5), new THREE.MeshBasicMaterial({ map: tex(kind), transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = -Math.PI / 2; // arrow points along +x (towards the roundabout)
      m.position.set(x, 0.02, z);
      root.add(m);
    }
  }
  // Lane divide for the flare.
  const div: Placement[] = [];
  for (let x = R2_FLARE.x0 + 2; x < R2_FLARE.x1 - 2; x += 4.5) div.push({ x, y: 0.012, z: -H, ry: Math.PI / 2, sx: 0.12, sy: 0.01, sz: 2.2 });
  root.add(instanced(baseBox(), new THREE.MeshBasicMaterial({ color: 0xe9e9e2 }), div));
  void R1;
  void M1;
  void MAGIC;
}
