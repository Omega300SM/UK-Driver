import * as THREE from 'three';
import type { BuiltScene } from './carPark';
import { DEVON, COMBE, PASSING_PLACES, OKEMENT, GANTRIES, CARRIAGEWAYS, EMERGENCY, Z, CX, AH, TH, NB0, NB3, SB0, SB1, LW } from './devonLayout';
import { instanced, lambert, baseBox, roofPrism, rng, type Placement } from '../props';
import { canvasTexture } from '../signs';
import { markerMeshes, hintPathFactory, flat, addMarkings, signPost } from '../common';
import { addRoundabout } from './millTown';
import type { GantrySign } from '../layout';

/**
 * The Devon Run: a hedged single-track lane out of Ashcombe, the A386 across
 * open farmland with Dartmoor's tors to the west, the A30 dual carriageway,
 * and the M5 north to Seaview and the sea.
 */
export function buildDevon(): BuiltScene {
  const L = DEVON;
  const root = new THREE.Group();
  const box = baseBox();
  const r = rng(41);

  root.add(new THREE.HemisphereLight(0xe2ecf5, 0x5b6f45, 1.2));
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.45);
  sun.position.set(80, 120, -60);
  root.add(sun);

  // Ground: one big field, with a patchwork of other greens on top.
  // Ground and fields are pushed back in the depth buffer so roads always win (long, nearly coplanar surfaces).
  const behind = (m: THREE.Material) => Object.assign(m, { polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 8 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 9400, 30, 94), behind(lambert(0x6f9a52)));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(500, -0.03, 3700);
  root.add(ground);
  const fields: Placement[] = [];
  for (let i = 0; i < 160; i++) {
    const x = -600 + r() * 2000;
    const z = -500 + r() * 8200;
    // Keep the roads clear.
    if (Math.abs(x - CX) < 60 || (x > 560 && x < 860 && z < 960)) continue;
    fields.push({ x, y: -0.02, z, sx: 60 + r() * 120, sy: 0.01, sz: 60 + r() * 140, color: [0x7aa85a, 0x8fb35f, 0x6d9447, 0xa7b86a, 0x90a956][i % 5] });
  }
  root.add(instanced(box, behind(lambert(0xffffff)), fields));

  // Roads.
  const tarmac = lambert(0x4e5257);
  const motorway = lambert(0x5a5e63);
  const lane = lambert(0x55585a);
  // Long roads are drawn in tiles of up to 150 m (big triangles lose depth precision on some GPUs).
  const tiles = (r: { x0: number; x1: number; z0: number; z1: number }, mat: THREE.Material, y: number) => {
    const alongZ = r.z1 - r.z0 >= r.x1 - r.x0;
    const [a0, a1] = alongZ ? [r.z0, r.z1] : [r.x0, r.x1];
    for (let a = a0; a < a1; a += 150) {
      const b = Math.min(a1, a + 150);
      root.add(flat(alongZ ? { ...r, z0: a, z1: b } : { ...r, x0: a, x1: b }, mat, y));
    }
  };
  for (const d of L.drivable) tiles(d, tarmac, 0);
  for (const c of CARRIAGEWAYS) if (c.kind === 'motorway') tiles(c, motorway, 0.01);
  for (const c of COMBE) tiles(c, lane, 0.01);
  for (const p of PASSING_PLACES) root.add(flat(p, lambert(0x66696b), 0.003));
  root.add(flat(EMERGENCY, lambert(0xd8762b), 0.004));
  addRoundabout(root, OKEMENT);
  addMarkings(root, L.markings ?? []);

  // Central reservation: grass and a steel barrier, from the roundabout to the north.
  tiles({ x0: SB1, x1: NB0, z0: Z.dualStart, z1: Z.north + 10 }, lambert(0x6a8f4a), 0.012);
  const barrier: Placement[] = [];
  for (let z = Z.dualStart + 4; z < Z.north; z += 8) barrier.push({ x: CX, y: 0.45, z: z + 4, sx: 0.12, sy: 0.3, sz: 8 });
  root.add(instanced(box, lambert(0xa8adb2), barrier));
  // Verge barriers and marker posts on the motorway.
  const posts: Placement[] = [];
  for (let z = Z.motorwayStart; z < Z.north; z += 50) {
    posts.push({ x: NB3 + LW + 2.5, z, sx: 0.12, sy: 1.0, sz: 0.12 }, { x: SB0 - 5, z, sx: 0.12, sy: 1.0, sz: 0.12 });
  }
  root.add(instanced(box, lambert(0xf2f2ec), posts));

  // Combe Lane: tall Devon hedgebanks either side (they hide what's round the bend).
  const hedges: Placement[] = [];
  const hedgeAlong = (x0: number, x1: number, z0: number, z1: number) => {
    const alongZ = z1 - z0 > x1 - x0;
    const len = alongZ ? z1 - z0 : x1 - x0;
    for (let u = 0; u < len; u += 6) {
      const l = Math.min(6, len - u);
      if (alongZ) hedges.push({ x: (x0 + x1) / 2, z: z0 + u + l / 2, sx: x1 - x0, sy: 2.4 + r() * 0.6, sz: l, color: r() < 0.5 ? 0x3f6b2e : 0x4a7a36 });
      else hedges.push({ x: x0 + u + l / 2, z: (z0 + z1) / 2, sx: l, sy: 2.4 + r() * 0.6, sz: z1 - z0, color: r() < 0.5 ? 0x3f6b2e : 0x4a7a36 });
    }
  };
  const gapsAt = (z: number, isX: boolean) =>
    PASSING_PLACES.some((p) => (isX ? z >= p.x0 - 1 && z <= p.x1 + 1 : z >= p.z0 - 1 && z <= p.z1 + 1));
  // Section A and C (along z) and B and D (along x): a hedge 1.5 m off each edge, skipping passing places.
  for (const [cx, z0, z1] of [
    [800, 15, 416],
    [620, 426, 896]
  ] as const) {
    for (const side of [-1, 1]) {
      let start = z0;
      for (let z = z0; z <= z1; z += 2) {
        const blocked = gapsAt(z, false) && PASSING_PLACES.some((p) => Math.sign((p.x0 + p.x1) / 2 - cx) === side && z >= p.z0 - 1 && z <= p.z1 + 1);
        if (blocked || z >= z1) {
          if (z - start > 2) hedgeAlong(cx + side * (TH + (side > 0 ? 0.3 : 1.5)) - (side > 0 ? 0 : 0), cx + side * (TH + (side > 0 ? 1.5 : 0.3)), start, z);
          start = z + 2;
        }
      }
    }
  }
  for (const [cz, x0, x1] of [
    [420, 624, 796],
    [900, 412, 616]
  ] as const) {
    for (const side of [-1, 1]) {
      let start = x0;
      for (let x = x0; x <= x1; x += 2) {
        const blocked = PASSING_PLACES.some((p) => Math.sign((p.z0 + p.z1) / 2 - cz) === side && x >= p.x0 - 1 && x <= p.x1 + 1);
        if (blocked || x >= x1) {
          if (x - start > 2) hedgeAlong(start, x, Math.min(cz + side * (TH + 0.3), cz + side * (TH + 1.5)), Math.max(cz + side * (TH + 0.3), cz + side * (TH + 1.5)));
          start = x + 2;
        }
      }
    }
  }
  // Field hedgerows along the A386 and the dual carriageway.
  for (let z = 0; z < Z.motorwayStart; z += 60) {
    if (Math.abs(z - 900) < 20 || Math.abs(z - Z.rbt) < 40 || (z > 1130 && z < 1230) || (z > 2130 && z < 2230)) continue;
    hedges.push({ x: CX + 18, z: z + 30, sx: 1.4, sy: 1.6, sz: 58, color: 0x4a7a36 }, { x: CX - 18, z: z + 30, sx: 1.4, sy: 1.6, sz: 58, color: 0x3f6b2e });
  }
  root.add(instanced(box, lambert(0xffffff), hedges));

  // Trees scattered over the fields and along the lane.
  const trunks: Placement[] = [];
  const crowns: Placement[] = [];
  const tree = (x: number, z: number, s = 0.9 + r() * 0.8) => {
    trunks.push({ x, z, sx: 0.45 * s, sy: 3 * s, sz: 0.45 * s });
    crowns.push({ x, y: 2.5 * s, z, sx: 4.2 * s, sy: 4.4 * s, sz: 4.2 * s, color: r() < 0.5 ? 0x4c7a34 : 0x5d8a3c });
  };
  for (let i = 0; i < 420; i++) {
    const x = -300 + r() * 1400;
    const z = -400 + r() * 8100;
    if (Math.abs(x - CX) < 26 || (x > 590 && x < 830 && z > -160 && z < 930 && (Math.abs(x - 800) < 8 || Math.abs(x - 620) < 8 || Math.abs(z - 420) < 8 || Math.abs(z - 900) < 8))) continue;
    if (Math.abs(z - Z.j1) < 10 || Math.abs(z - Z.j2Link) < 10 || Math.abs(z - Z.j2Entry) < 10 || Math.abs(z - Z.seaview) < 12) continue;
    tree(x, z);
  }
  root.add(instanced(box, lambert(0x5b4330), trunks));
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 0).translate(0, 0.6, 0), lambert(0xffffff, { flatShading: true }), crowns));

  // Dartmoor's tors on the western skyline, and rolling hills to the east.
  const hills: Placement[] = [];
  for (let i = 0; i < 26; i++) {
    const z = -600 + i * 330 + r() * 150;
    hills.push({ x: -700 - r() * 300, z, sx: 260 + r() * 200, sy: 60 + r() * 70, sz: 260 + r() * 200, color: r() < 0.5 ? 0x7d7a56 : 0x6b7f4a });
    hills.push({ x: 1600 + r() * 300, z, sx: 300 + r() * 200, sy: 35 + r() * 40, sz: 300 + r() * 200, color: 0x6b8f4a });
  }
  // Distant hills ignore the fog on a clear day (they'd vanish), but take it in rain and fog (see conditions.ts).
  const hillMat = lambert(0xffffff, { flatShading: true, fog: false });
  hillMat.userData.distant = true;
  root.add(instanced(new THREE.ConeGeometry(0.5, 1, 6).translate(0, 0.5, 0), hillMat, hills));
  const tors: Placement[] = [];
  for (let i = 0; i < 6; i++) tors.push({ x: -520 - r() * 120, y: 50 + r() * 30, z: 200 + i * 900 + r() * 200, sx: 18, sy: 14, sz: 14, color: 0x8b8a82 });
  root.add(instanced(box, lambert(0xffffff), tors));

  // Ashcombe: a few white cottages and a church round the start of the lane.
  const walls: Placement[] = [];
  const roofs: Placement[] = [];
  const cottage = (x: number, z: number, ry: number) => {
    walls.push({ x, z, ry, sx: 9, sy: 5, sz: 6, color: [0xf1ece0, 0xe8e0cc, 0xf5f0e6][Math.floor(r() * 3)] });
    roofs.push({ x, y: 5, z, ry, sx: 9.2, sy: 2.4, sz: 6.6, color: r() < 0.4 ? 0xb89a5c : 0x4a4f57 });
  };
  for (let i = 0; i < 6; i++) {
    cottage(800 + 12, -140 + i * 22, Math.PI / 2);
    cottage(800 - 12, -130 + i * 22, Math.PI / 2);
  }
  // Seaview: a terrace facing the sea.
  for (let x = 700; x < 990; x += 11) cottage(x, Z.seaview - AH - 10, 0);
  root.add(instanced(box, lambert(0xffffff), walls));
  root.add(instanced(roofPrism(), lambert(0xffffff), roofs));
  const church = new THREE.Mesh(box, lambert(0x9c9688));
  church.scale.set(8, 14, 8);
  church.position.set(830, 0, -60);
  root.add(church);

  // The sea and a beach beyond Seaview, with a lighthouse on the headland.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 900), lambert(0x3f7f9a));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(500, -0.01, Z.seaview + 480);
  root.add(sea);
  root.add(flat({ x0: -200, x1: 1300, z0: Z.seaview + 14, z1: Z.seaview + 40 }, lambert(0xe6d6a8), -0.005));
  const lighthouse = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3, 22, 12), lambert(0xf2f2ee));
  lighthouse.position.set(1050, 11, Z.seaview + 60);
  root.add(lighthouse);
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3, 12), lambert(0xc0392b));
  lamp.position.set(1050, 23.5, Z.seaview + 60);
  root.add(lamp);

  // Gantries over the smart motorway: a steel frame and one signal per lane.
  for (const g of GANTRIES) {
    const c = CARRIAGEWAYS.find((q) => q.id === g.carriageway)!;
    const frame = new THREE.Group();
    const steel = lambert(0x6d737a);
    const beam = new THREE.Mesh(box, steel);
    beam.scale.set(c.x1 - c.x0 + 6, 0.8, 0.6);
    beam.position.set((c.x0 + c.x1) / 2, 6.6, g.z);
    frame.add(beam);
    for (const x of [c.x0 - 2.5, c.x1 + 2.5]) {
      const leg = new THREE.Mesh(box, steel);
      leg.scale.set(0.5, 7, 0.5);
      leg.position.set(x, 0, g.z);
      frame.add(leg);
    }
    g.signs.forEach((sg, i) => {
      const x = c.heading === 0 ? c.x1 - (i + 0.5) * c.laneWidth : c.x0 + (i + 0.5) * c.laneWidth;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: gantryTexture(sg) }));
      face.position.set(x, 6.3, g.z - 0.32);
      face.rotation.y = Math.PI; // facing northbound drivers (looking +z)
      frame.add(face);
    });
    root.add(frame);
  }

  // The broken-down van in lane 1, hazard lights flashing.
  const vanBody = new THREE.Mesh(box, lambert(0xe8e4da));
  const van = L.obstacles.find((o) => o.kind === 'van')!;
  vanBody.scale.set(van.x1 - van.x0, 2.3, van.z1 - van.z0);
  vanBody.position.set((van.x0 + van.x1) / 2, 0.2, (van.z0 + van.z1) / 2);
  root.add(vanBody);
  const hazardMat = new THREE.MeshBasicMaterial({ color: 0x5a3c10 });
  for (const [dx, dz] of [
    [-0.8, -2.6],
    [0.8, -2.6],
    [-0.8, 2.6],
    [0.8, 2.6]
  ]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), hazardMat);
    h.position.set((van.x0 + van.x1) / 2 + dx, 0.9, (van.z0 + van.z1) / 2 + dz);
    root.add(h);
  }

  // Lay-bys get a short kerb, the link roads a gate at their far end.
  for (const s of L.signs ?? []) root.add(signPost(s));
  for (const o of L.obstacles) {
    if (o.kind !== 'gate') continue;
    const m = new THREE.Mesh(box, lambert(0x9b968a));
    m.scale.set(o.x1 - o.x0, 1.2, o.z1 - o.z0);
    m.position.set((o.x0 + o.x1) / 2, 0, (o.z0 + o.z1) / 2);
    root.add(m);
  }

  // Clouds.
  const clouds: Placement[] = [];
  for (let i = 0; i < 70; i++) clouds.push({ x: -800 + r() * 2600, y: 70 + r() * 30, z: -600 + r() * 9000, sx: 30 + r() * 30, sy: 7 + r() * 5, sz: 18 + r() * 18 });
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshBasicMaterial({ color: 0xf2f4f6, fog: false }), clouds));

  const mk = markerMeshes(root, L);
  return {
    layout: L,
    root,
    markers: mk.markers,
    setMarker: mk.setMarker,
    setHintPath: hintPathFactory(root),
    update: (t: number) => {
      mk.update(t);
      hazardMat.color.setHex(Math.floor(t * 1.5) % 2 ? 0xffa514 : 0x5a3c10);
    }
  };
}

/** A matrix signal face: speed limit roundel, red X, diagonal arrow, national limit or blank. */
function gantryTexture(sg: GantrySign): THREE.Texture {
  const key = `gantry-${JSON.stringify(sg)}`;
  return canvasTexture(key, 128, 128, (c) => {
    c.fillStyle = '#111';
    c.fillRect(0, 0, 128, 128);
    c.lineWidth = 10;
    if (sg.kind === 'limit') {
      c.strokeStyle = '#ff3b2f';
      c.beginPath();
      c.arc(64, 64, 48, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#fff';
      c.font = 'bold 46px Arial';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(String(sg.mph), 64, 67);
    } else if (sg.kind === 'x') {
      c.strokeStyle = '#ff3b2f';
      c.lineWidth = 16;
      c.beginPath();
      c.moveTo(24, 24);
      c.lineTo(104, 104);
      c.moveTo(104, 24);
      c.lineTo(24, 104);
      c.stroke();
    } else if (sg.kind === 'arrow') {
      // Move over (to the right, away from lane 1).
      c.strokeStyle = '#fff';
      c.lineWidth = 12;
      c.beginPath();
      c.moveTo(96, 30);
      c.lineTo(40, 92);
      c.stroke();
      c.fillStyle = '#fff';
      c.beginPath();
      c.moveTo(24, 108);
      c.lineTo(30, 70);
      c.lineTo(62, 100);
      c.fill();
    } else if (sg.kind === 'nsl') {
      c.strokeStyle = '#fff';
      c.lineWidth = 6;
      c.beginPath();
      c.arc(64, 64, 46, 0, Math.PI * 2);
      c.stroke();
      c.lineWidth = 14;
      c.beginPath();
      c.moveTo(96, 32);
      c.lineTo(32, 96);
      c.stroke();
    }
  });
}

