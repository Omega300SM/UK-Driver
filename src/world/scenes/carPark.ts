import * as THREE from 'three';
import type { StreetControl } from '../../sim/street';
import { CAR_PARK, type SceneLayout, type Rect } from './carParkLayout';
import { instanced, lambert, baseBox, roofPrism, rng, type Placement } from '../props';
import { speedRoundel, namePlate, fascia } from '../signs';

export interface BuiltScene {
  layout: SceneLayout;
  root: THREE.Group;
  markers: Record<string, THREE.Object3D>;
  setMarker(id: string | null): void;
  setHintPath(points: Array<[number, number]> | null): void;
  update(t: number): void;
  /** Signal lamps, beacons and pedestrians (scenes with crossings). */
  updateStreet?(street: StreetControl | null, t: number): void;
}

const BRICKS = [0xa4513a, 0x9a4a33, 0xb5634a, 0x8e4433, 0xae5a3e, 0xc0846a];
const DOORS = [0x1d3f6e, 0x7a1f2b, 0x2f5d3a, 0x222222, 0xd9b44a, 0x5a8fa8];

/**
 * Little Ashby: a leisure centre car park opening onto Church Lane, a row of
 * red-brick terraces, a hedgerow, a red post box and a phone box, and a
 * church at the end of the lane. Everything repeated is instanced.
 */
export function buildCarPark(): BuiltScene {
  const L = CAR_PARK;
  const root = new THREE.Group();
  const box = baseBox();

  // Sky, light, fog: a bright, slightly hazy English Sunday morning.
  const hemi = new THREE.HemisphereLight(0xe8f2ff, 0x5f7a44, 1.25);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
  sun.position.set(-60, 90, -40);
  root.add(hemi, sun);

  // Ground.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), lambert(0x78a656));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(50, -0.02, 0);
  root.add(ground);

  // Tarmac.
  const tarmac = lambert(0x50545a);
  for (const r of L.drivable) root.add(flat(r, tarmac, 0));
  // Pavements, raised.
  const paving = lambert(0xb9b5aa);
  root.add(
    instanced(
      box,
      paving,
      L.pavements.map((r) => ({ x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, sx: r.x1 - r.x0, sy: 0.13, sz: r.z1 - r.z0 }))
    )
  );
  // Kerbs around the car park (leaving the exit gap) and along the lane.
  const kerbs: Placement[] = [];
  const kerbLine = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    kerbs.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, sx: x1 === x0 ? 0.25 : len, sy: 0.15, sz: x1 === x0 ? len : 0.25 });
  };
  kerbLine(-42, -16, 30, -16);
  kerbLine(-42, 16, 30, 16);
  kerbLine(-42, -16, -42, 16);
  kerbLine(30, -16, 30, -5);
  kerbLine(30, 5, 30, 16);
  root.add(instanced(box, lambert(0xd8d4c8), kerbs));

  // Bay lines and the yellow hatched area by the trolley shelter.
  const lines: Placement[] = [];
  for (const b of L.bays) {
    for (const dx of [-b.w / 2, b.w / 2]) lines.push({ x: b.x + dx, y: 0.01, z: b.z, sx: 0.12, sy: 0.01, sz: b.d });
  }
  // Car park edge lines.
  lines.push({ x: -6, y: 0.01, z: 10, sx: 72, sy: 0.01, sz: 0.12 }, { x: -6, y: 0.01, z: -10, sx: 72, sy: 0.01, sz: 0.12 });
  // Church Lane: centre line (short dashes, long gaps) and edge lines.
  for (let x = 34; x < 146; x += 9) lines.push({ x, y: 0.01, z: 0, sx: 3, sy: 0.01, sz: 0.12 });
  root.add(instanced(box, new THREE.MeshBasicMaterial({ color: 0xe9e9e2 }), lines));
  // "SLOW" style chevrons would go here; keep the car park calm and readable.

  // Parked cars (instanced body + cabin + shadow).
  const cars = L.obstacles.filter((o) => o.kind === 'car');
  const bodyP: Placement[] = [];
  const cabP: Placement[] = [];
  const shP: Placement[] = [];
  for (const c of cars) {
    const x = (c.x0 + c.x1) / 2;
    const z = (c.z0 + c.z1) / 2;
    bodyP.push({ x, y: 0.3, z, sx: 1.8, sy: 0.62, sz: 4.1, color: c.color });
    cabP.push({ x, y: 0.92, z: z + (z > 0 ? 0.25 : -0.25), sx: 1.6, sy: 0.55, sz: 2.2 });
    shP.push({ x, y: 0.015, z, sx: 2.2, sy: 0.01, sz: 4.5 });
  }
  root.add(instanced(box, lambert(0xffffff), bodyP));
  root.add(instanced(box, lambert(0x2b3440), cabP));
  root.add(instanced(box, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }), shP));

  // Trolley shelter.
  const shelter = L.obstacles.find((o) => o.kind === 'shelter')!;
  const steel = lambert(0x8d959c);
  const posts: Placement[] = [];
  for (const x of [shelter.x0 + 0.1, shelter.x1 - 0.1]) for (const z of [shelter.z0 + 0.1, shelter.z1 - 0.1]) posts.push({ x, z, sx: 0.1, sy: 2.2, sz: 0.1 });
  root.add(instanced(box, steel, posts));
  const sRoof = new THREE.Mesh(new THREE.BoxGeometry(shelter.x1 - shelter.x0 + 0.3, 0.08, shelter.z1 - shelter.z0 + 0.3), lambert(0x3c7d63));
  sRoof.position.set((shelter.x0 + shelter.x1) / 2, 2.25, (shelter.z0 + shelter.z1) / 2);
  root.add(sRoof);
  const trolleys: Placement[] = [];
  for (let i = 0; i < 6; i++) trolleys.push({ x: shelter.x0 + 0.8 + i * 0.75, z: (shelter.z0 + shelter.z1) / 2, sx: 0.6, sy: 0.95, sz: 1.1 });
  root.add(instanced(box, lambert(0xb7bcc0), trolleys));

  // Leisure centre (north of the car park).
  const lc = new THREE.Mesh(box, lambert(0xd9cdb4));
  lc.scale.set(46, 8, 18);
  lc.position.set(-12, 0, 30);
  root.add(lc);
  const lcGlass = new THREE.Mesh(box, lambert(0x5e7f93));
  lcGlass.scale.set(44, 3, 0.3);
  lcGlass.position.set(-12, 0.6, 20.9);
  root.add(lcGlass);
  const lcSign = new THREE.Mesh(new THREE.PlaneGeometry(18, 2.2), new THREE.MeshBasicMaterial({ map: fascia('LITTLE ASHBY LEISURE CENTRE') }));
  lcSign.position.set(-12, 5.8, 20.95);
  lcSign.rotation.y = Math.PI;
  root.add(lcSign);

  // Red phone box by the entrance and a bench.
  const red = lambert(0xc8102e);
  const phone = new THREE.Mesh(box, red);
  phone.scale.set(1, 2.5, 1);
  phone.position.set(18, 0, 18.5);
  root.add(phone);
  const phoneTop = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.55, 0.35, 4), red);
  phoneTop.rotation.y = Math.PI / 4;
  phoneTop.position.set(18, 2.65, 18.5);
  root.add(phoneTop);

  // Church Lane: terraced houses on the south side.
  const r = rng(7);
  const houses: Placement[] = [];
  const roofs: Placement[] = [];
  const chimneys: Placement[] = [];
  const windows: Placement[] = [];
  const doors: Placement[] = [];
  for (let x = 34; x < 144; x += 5.4) {
    const h = 6.2 + (r() < 0.2 ? 0.4 : 0);
    houses.push({ x: x + 2.7, z: -13, sx: 5.4, sy: h, sz: 8, color: BRICKS[Math.floor(r() * BRICKS.length)] });
    roofs.push({ x: x + 2.7, y: h, z: -13, sx: 5.5, sy: 2.6, sz: 8.6 });
    if (Math.round(x / 5.4) % 2 === 0) chimneys.push({ x: x + 5.4, y: h + 1.4, z: -13, sx: 0.8, sy: 1.8, sz: 1.2 });
    for (const wy of [1.0, 3.8]) windows.push({ x: x + 3.7, y: wy, z: -8.95, sx: 1.5, sy: 1.4, sz: 0.1 });
    windows.push({ x: x + 1.2, y: 3.8, z: -8.95, sx: 1.2, sy: 1.4, sz: 0.1 });
    doors.push({ x: x + 1.2, y: 0, z: -8.95, sx: 1.0, sy: 2.1, sz: 0.12, color: DOORS[Math.floor(r() * DOORS.length)] });
  }
  root.add(instanced(box, lambert(0xffffff), houses));
  root.add(instanced(roofPrism(), lambert(0x4a4f57), roofs));
  root.add(instanced(box, lambert(0x8e4433), chimneys));
  root.add(instanced(box, lambert(0xf2f0ea), windows.map((w) => ({ ...w, sx: (w.sx ?? 1) + 0.2, sy: (w.sy ?? 1) + 0.2 }))));
  root.add(instanced(box, lambert(0x3d4d5c), windows.map((w) => ({ ...w, z: w.z + 0.04 }))));
  root.add(instanced(box, lambert(0xffffff), doors));
  // Front garden walls.
  root.add(instanced(box, lambert(0x9a4a33), [{ x: 90, z: -8.6, sx: 112, sy: 0.6, sz: 0.3 }]));

  // Hedgerow along the north side of the lane, with trees in the field behind.
  const hedge: Placement[] = [];
  for (let x = 31; x < 148; x += 2.6) hedge.push({ x, z: 8.8, sx: 2.8, sy: 1.5 + r() * 0.7, sz: 1.6 + r() * 0.4 });
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 0).translate(0, 0.5, 0), lambert(0x3f6b2e, { flatShading: true }), hedge.map((h) => ({ ...h, sx: (h.sx ?? 1) * 1.0, sy: (h.sy ?? 1) * 1.2 }))));
  const trunks: Placement[] = [];
  const crowns: Placement[] = [];
  const treeSpots: Array<[number, number]> = [];
  for (let i = 0; i < 26; i++) treeSpots.push([40 + r() * 110, 16 + r() * 50]);
  for (let i = 0; i < 18; i++) treeSpots.push([-70 + r() * 25, -40 + r() * 80]);
  for (let i = 0; i < 12; i++) treeSpots.push([-40 + r() * 70, -26 - r() * 25]);
  for (const [x, z] of treeSpots) {
    const s = 0.8 + r() * 0.7;
    trunks.push({ x, z, sx: 0.4 * s, sy: 2.4 * s, sz: 0.4 * s });
    crowns.push({ x, y: 2 * s, z, sx: 3.4 * s, sy: 3.6 * s, sz: 3.4 * s, color: r() < 0.5 ? 0x4c7a34 : 0x5d8a3c });
  }
  root.add(instanced(box, lambert(0x5b4330), trunks));
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 0).translate(0, 0.6, 0), lambert(0xffffff, { flatShading: true }), crowns));

  // Drystone wall along the west and south edges of the car park.
  const stones: Placement[] = [];
  for (let z = -18; z <= 18; z += 1.2) stones.push({ x: -44, z, sx: 0.7, sy: 1.0 + r() * 0.15, sz: 1.25, color: 0x9b968a + Math.floor(r() * 3) * 0x050505 });
  for (let x = -44; x <= 28; x += 1.2) stones.push({ x, z: -18.5, sx: 1.25, sy: 1.0 + r() * 0.15, sz: 0.7, color: 0x9b968a + Math.floor(r() * 3) * 0x050505 });
  root.add(instanced(box, lambert(0xffffff, { flatShading: true }), stones));

  // Lamp posts.
  const poles: Placement[] = [];
  for (const x of [-30, -10, 10]) poles.push({ x, z: 16.8 }, { x, z: -17 });
  for (let x = 40; x < 150; x += 28) poles.push({ x, z: -6.8 });
  root.add(instanced(box, lambert(0x3a3f45), poles.map((p) => ({ ...p, sx: 0.14, sy: 6, sz: 0.14 }))));
  root.add(instanced(box, lambert(0xf4f1d0), poles.map((p) => ({ ...p, y: 6, sx: 0.4, sy: 0.18, sz: 0.7 }))));

  // Red post box at marker B (on the pavement).
  const pb = new THREE.Group();
  const pbBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.3, 12), red);
  pbBody.position.y = 0.65 + 0.13;
  const pbCap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0x111111));
  pbCap.position.y = 1.43 + 0.13;
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), lambert(0x111111));
  slot.position.set(0, 1.15, 0.29);
  pb.add(pbBody, pbCap, slot);
  pb.position.set(104, 0, -6.2);
  root.add(pb);

  // Signs.
  root.add(signPost(speedRoundel(10), -20, -17.2, -Math.PI / 2, 0.9)); // car park limit, seen when heading east
  root.add(signPost(speedRoundel(20), 33, -6.4, -Math.PI / 2, 0.75));
  root.add(signPost(speedRoundel(20), 33, 6.4, -Math.PI / 2, 0.75));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: namePlate('Church Lane') }));
  plate.position.set(34, 0.9, -8.5);
  root.add(plate);

  // Field gate at the end of the lane, and the church beyond.
  const gate = new THREE.Mesh(box, lambert(0xcfc6a8));
  gate.scale.set(0.3, 1.3, 10);
  gate.position.set(149, 0, 0);
  root.add(gate);
  const church = new THREE.Group();
  const nave = new THREE.Mesh(box, lambert(0xb7ab92));
  nave.scale.set(18, 8, 9);
  const navRoof = new THREE.Mesh(roofPrism(), lambert(0x585d63));
  navRoof.scale.set(18.5, 4, 9.6);
  navRoof.position.y = 8;
  const tower = new THREE.Mesh(box, lambert(0xa99e86));
  tower.scale.set(5, 16, 5);
  tower.position.x = -10;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(2.8, 9, 4), lambert(0x585d63));
  spire.rotation.y = Math.PI / 4;
  spire.position.set(-10, 20.5, 0);
  church.add(nave, navRoof, tower, spire);
  church.position.set(178, 0, 8);
  root.add(church);

  // Clouds.
  const clouds: Placement[] = [];
  for (let i = 0; i < 14; i++) clouds.push({ x: -120 + r() * 360, y: 55 + r() * 25, z: -140 + r() * 280, sx: 18 + r() * 20, sy: 5 + r() * 3, sz: 10 + r() * 10 });
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), clouds));

  // Marker boxes (yellow, pulsing) for guided/test drives.
  const markers: Record<string, THREE.Object3D> = {};
  for (const m of L.markers) {
    const grp = new THREE.Group();
    const w = m.x1 - m.x0;
    const d = m.z1 - m.z0;
    const yellow = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.9 });
    const edges: Placement[] = [
      { x: 0, z: -d / 2, sx: w, sy: 0.02, sz: 0.25 },
      { x: 0, z: d / 2, sx: w, sy: 0.02, sz: 0.25 },
      { x: -w / 2, z: 0, sx: 0.25, sy: 0.02, sz: d },
      { x: w / 2, z: 0, sx: 0.25, sy: 0.02, sz: d }
    ];
    grp.add(instanced(box, yellow, edges));
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.18, depthWrite: false }));
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = 0.03;
    grp.add(fill);
    const beacon = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 4), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    beacon.rotation.x = Math.PI;
    beacon.position.y = 3;
    beacon.name = 'beacon';
    grp.add(beacon);
    grp.position.set((m.x0 + m.x1) / 2, 0.02, (m.z0 + m.z1) / 2);
    grp.visible = false;
    markers[m.id] = grp;
    root.add(grp);
  }

  // Hint path (dashed racing-line style guide).
  const hintMat = new THREE.MeshBasicMaterial({ color: 0x5be37d, transparent: true, opacity: 0.75, depthWrite: false });
  let hint: THREE.InstancedMesh | null = null;
  const setHintPath = (pts: Array<[number, number]> | null) => {
    if (hint) {
      root.remove(hint);
      hint.dispose();
      hint = null;
    }
    if (!pts || pts.length < 2) return;
    const dashes: Placement[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const ry = Math.atan2(bx - ax, bz - az);
      for (let s = 0; s < len; s += 2.4) {
        const k = s / len;
        dashes.push({ x: ax + (bx - ax) * k, y: 0.035, z: az + (bz - az) * k, ry, sx: 0.35, sy: 0.01, sz: 1.2 });
      }
    }
    hint = instanced(box, hintMat, dashes);
    root.add(hint);
  };

  let active: string | null = null;
  return {
    layout: L,
    root,
    markers,
    setMarker(id) {
      active = id;
      for (const [k, o] of Object.entries(markers)) o.visible = k === id;
    },
    setHintPath,
    update(t) {
      if (!active) return;
      const m = markers[active];
      const b = m.getObjectByName('beacon');
      if (b) {
        b.position.y = 3 + Math.sin(t * 3) * 0.35;
        b.rotation.y = t * 1.5;
      }
    }
  };
}

function flat(r: Rect, mat: THREE.Material, y: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
  return m;
}

function signPost(tex: THREE.Texture, x: number, z: number, ry: number, size: number): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), lambert(0x8d959c));
  pole.position.y = 1.1;
  const face = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 24), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  face.position.y = 2.2 + size / 2 - 0.1;
  const back = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 24), lambert(0x8d959c));
  back.rotation.y = Math.PI;
  back.position.copy(face.position);
  back.position.z -= 0.01;
  g.add(pole, face, back);
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  return g;
}
