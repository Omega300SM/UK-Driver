import * as THREE from 'three';
import type { BuiltScene } from './carPark';
import { TOWN, ROAD_HALF as H, PAVE } from './townLayout';
import type { Marking, Rect, SignPlacement } from '../layout';
import { instanced, lambert, baseBox, roofPrism, rng, type Placement } from '../props';
import { signTexture, fascia } from '../signs';
import { signAspect } from '../signSvg';
import { markerMeshes, hintPathFactory } from '../common';

const BRICKS = [0xa4513a, 0x9a4a33, 0xb5634a, 0x8e4433, 0xae5a3e, 0xc0846a];
const RENDER = [0xefe6d2, 0xd9e3e8, 0xe9d7c3, 0xf2efe6, 0xcfd9c4, 0xe8cfcf];
const DOORS = [0x1d3f6e, 0x7a1f2b, 0x2f5d3a, 0x222222, 0xd9b44a, 0x5a8fa8];
const AWNINGS = [0x2f8a5f, 0xb8352f, 0x1d3f6e, 0xd9a22e, 0x7a4f9a];

/**
 * Little Ashby: Market Street shops, red-brick terraces, a church and green,
 * an old tannery, and Ashby Road running out into hedged countryside.
 */
export function buildTown(): BuiltScene {
  const L = TOWN;
  const root = new THREE.Group();
  const box = baseBox();
  const r = rng(11);

  root.add(new THREE.HemisphereLight(0xe8f2ff, 0x5f7a44, 1.25));
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
  sun.position.set(-60, 90, -40);
  root.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900), lambert(0x78a656));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(-80, -0.02, -120);
  root.add(ground);

  // Roads and pavements.
  const tarmac = lambert(0x50545a);
  for (const d of L.drivable) root.add(flat(d, tarmac, 0));
  root.add(instanced(box, lambert(0xb9b5aa), L.pavements.map((p) => ({ x: (p.x0 + p.x1) / 2, z: (p.z0 + p.z1) / 2, sx: p.x1 - p.x0, sy: 0.13, sz: p.z1 - p.z0 }))));
  // Kerb stones: a thin lighter edge on the road side of each pavement.
  // (Visual only; the physics treats anything outside the road as kerb.)

  // Village green by Church Street.
  root.add(flat({ x0: 100, x1: 132, z0: 24, z1: 100 }, lambert(0x8cc063), 0.01));

  addMarkings(root, L.markings ?? []);

  // ---- Buildings ---------------------------------------------------------
  const walls: Placement[] = [];
  const roofs: Placement[] = [];
  const chimneys: Placement[] = [];
  const windows: Placement[] = [];
  const doors: Placement[] = [];
  const shopfronts: Placement[] = [];
  const awnings: Placement[] = [];

  /** A terrace along x (facing the road at z = face, building extends away by depth sign). */
  const terraceX = (x0: number, x1: number, face: number, dir: 1 | -1, opts: { shop?: boolean; h?: number; depth?: number; palette?: number[] } = {}) => {
    const depth = opts.depth ?? 9;
    for (let x = x0; x + 5 <= x1; x += 5.6) {
      const h = (opts.h ?? 6.4) + (r() < 0.25 ? 0.8 : 0);
      const zc = face + (dir * depth) / 2;
      const pal = opts.palette ?? BRICKS;
      walls.push({ x: x + 2.8, z: zc, sx: 5.6, sy: h, sz: depth, color: pal[Math.floor(r() * pal.length)] });
      roofs.push({ x: x + 2.8, y: h, z: zc, sx: 5.7, sy: 2.4, sz: depth + 0.4 });
      if (r() < 0.5) chimneys.push({ x: x + (r() < 0.5 ? 0.6 : 5), y: h + 1.2, z: zc, sx: 0.8, sy: 1.8, sz: 1.2 });
      const fz = face + dir * -0.05;
      windows.push({ x: x + 1.6, y: 3.9, z: fz, sx: 1.3, sy: 1.3, sz: 0.12 }, { x: x + 4, y: 3.9, z: fz, sx: 1.3, sy: 1.3, sz: 0.12 });
      if (opts.shop) {
        shopfronts.push({ x: x + 2.8, y: 0.3, z: fz, sx: 4.6, sy: 2.2, sz: 0.14 });
        awnings.push({ x: x + 2.8, y: 2.7, z: face - dir * 0.6, sx: 4.8, sy: 0.25, sz: 1.3, color: AWNINGS[Math.floor(r() * AWNINGS.length)] });
      } else {
        windows.push({ x: x + 4, y: 1.0, z: fz, sx: 1.4, sy: 1.3, sz: 0.12 });
        doors.push({ x: x + 1.4, y: 0, z: fz, sx: 1.0, sy: 2.1, sz: 0.14, color: DOORS[Math.floor(r() * DOORS.length)] });
      }
    }
  };
  /** A terrace along z (facing the road at x = face). */
  const terraceZ = (z0: number, z1: number, face: number, dir: 1 | -1, opts: { h?: number; depth?: number } = {}) => {
    const depth = opts.depth ?? 9;
    for (let z = z0; z + 5 <= z1; z += 5.6) {
      const h = (opts.h ?? 6.2) + (r() < 0.2 ? 0.6 : 0);
      const xc = face + (dir * depth) / 2;
      walls.push({ x: xc, z: z + 2.8, sx: depth, sy: h, sz: 5.6, color: BRICKS[Math.floor(r() * BRICKS.length)] });
      roofs.push({ x: xc, y: h, z: z + 2.8, sx: 5.7, sy: 2.4, sz: depth + 0.4, ry: Math.PI / 2 });
      if (r() < 0.5) chimneys.push({ x: xc, y: h + 1.2, z: z + (r() < 0.5 ? 0.6 : 5), sx: 1.2, sy: 1.8, sz: 0.8 });
      const fx = face - dir * 0.05;
      windows.push({ x: fx, y: 3.9, z: z + 1.6, sx: 0.12, sy: 1.3, sz: 1.3 }, { x: fx, y: 3.9, z: z + 4, sx: 0.12, sy: 1.3, sz: 1.3 }, { x: fx, y: 1.0, z: z + 4, sx: 0.12, sy: 1.3, sz: 1.4 });
      doors.push({ x: fx, y: 0, z: z + 1.4, sx: 0.14, sy: 2.1, sz: 1.0, color: DOORS[Math.floor(r() * DOORS.length)] });
    }
  };

  const fS = -H - PAVE - 0.4; // south face of Market Street
  const fN = H + PAVE + 0.4;
  // Market Street shops (painted render and brick), with gaps for side roads.
  terraceX(-56, 30, fS, -1, { shop: true, h: 7.6, palette: [...RENDER, ...BRICKS] });
  terraceX(50, 255, fS, -1, { shop: true, h: 7.6, palette: [...RENDER, ...BRICKS] });
  terraceX(-56, 70, fN, 1, { shop: true, h: 7.6, palette: [...RENDER, ...BRICKS] });
  terraceX(90, 130, fN, 1, { shop: true, h: 7.6, palette: [...RENDER, ...BRICKS] });
  terraceX(150, 255, fN, 1, { shop: true, h: 7.6, palette: [...RENDER, ...BRICKS] });
  // Ashby Road semis, set back behind front gardens.
  terraceX(-196, -170, -16, -1, { h: 6.6 });
  terraceX(-140, -64, -16, -1, { h: 6.6 });
  terraceX(-196, -64, 16, 1, { h: 6.6 });
  // Mill Lane terraces.
  terraceZ(-282, -20, 40 - H - PAVE - 0.4, -1);
  terraceZ(-282, -20, 40 + H + PAVE + 0.4, 1);
  // Church Street houses north of the green and church.
  terraceZ(104, 166, 140 - H - PAVE - 0.4, -1);
  terraceZ(104, 166, 140 + H + PAVE + 0.4, 1);
  // Sheep Street.
  terraceZ(20, 88, 80 - H - PAVE - 0.4, -1, { h: 5.8 });
  terraceZ(20, 88, 80 + H + PAVE + 0.4, 1, { h: 5.8 });
  // Tannery Road: houses on the east side.
  terraceZ(-290, -14, -160 + H + PAVE + 0.4, 1);
  // Back Lane cottages.
  terraceX(-148, 24, -300 + H + PAVE + 0.4, 1, { h: 5.6 });

  root.add(instanced(box, lambert(0xffffff), walls));
  root.add(instanced(roofPrism(), lambert(0x4a4f57), roofs));
  root.add(instanced(box, lambert(0x8e4433), chimneys));
  root.add(instanced(box, lambert(0x3d4d5c), windows));
  root.add(instanced(box, lambert(0xffffff), doors));
  root.add(instanced(box, lambert(0x2b3a45), shopfronts));
  root.add(instanced(box, lambert(0xffffff), awnings));

  // The pub on the corner of Mill Lane.
  const pub = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.9), new THREE.MeshBasicMaterial({ map: fascia('THE PLOUGH', '#22262b') }));
  pub.position.set(24, 3.0, fS - 0.1);
  root.add(pub);

  // The old tannery works: a tall brick mill with a chimney stack.
  const works = new THREE.Mesh(box, lambert(0x8e4433));
  works.scale.set(28, 12, 90);
  works.position.set(-184, 0, -170);
  root.add(works);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 26, 8), lambert(0x7a3b2c));
  stack.position.set(-190, 13, -135);
  root.add(stack);
  const worksSign = new THREE.Mesh(new THREE.PlaneGeometry(16, 1.6), new THREE.MeshBasicMaterial({ map: fascia('ASHBY TANNERY WORKS 1868', '#4a3326') }));
  worksSign.position.set(-169.9, 9, -170);
  worksSign.rotation.y = Math.PI / 2;
  root.add(worksSign);

  // St Mary's church and the green.
  const church = new THREE.Group();
  const nave = new THREE.Mesh(box, lambert(0xb7ab92));
  nave.scale.set(14, 9, 30);
  const navRoof = new THREE.Mesh(roofPrism(), lambert(0x585d63));
  navRoof.scale.set(30.5, 4.5, 14.6);
  navRoof.rotation.y = Math.PI / 2;
  navRoof.position.y = 9;
  const tower = new THREE.Mesh(box, lambert(0xa99e86));
  tower.scale.set(6, 18, 6);
  tower.position.z = -17;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.4, 12, 4), lambert(0x585d63));
  spire.rotation.y = Math.PI / 4;
  spire.position.set(0, 24, -17);
  church.add(nave, navRoof, tower, spire);
  church.position.set(165, 0, 78);
  root.add(church);
  const memorial = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, 4, 4), lambert(0xc9c4b6));
  memorial.position.set(116, 2, 62);
  root.add(memorial);

  // ---- Countryside along Ashby Road --------------------------------------
  const hedge: Placement[] = [];
  for (let x = -420; x < -204; x += 2.6) {
    hedge.push({ x, z: -H - 1.4, sx: 2.8, sy: 1.6 + r() * 0.6, sz: 1.8 });
    hedge.push({ x, z: H + 1.4, sx: 2.8, sy: 1.6 + r() * 0.6, sz: 1.8 });
  }
  // Back Lane south side and allotments.
  for (let x = -150; x < 118; x += 2.6) hedge.push({ x, z: -300 - H - PAVE - 1.2, sx: 2.8, sy: 1.5 + r() * 0.5, sz: 1.6 });
  // Front-garden hedges on Ashby Road.
  for (let x = -198; x < -62; x += 2.6) {
    if (x > -172 && x < -148) continue;
    hedge.push({ x, z: -H - PAVE - 0.9, sx: 2.8, sy: 0.9, sz: 0.9 });
    hedge.push({ x, z: H + PAVE + 0.9, sx: 2.8, sy: 0.9, sz: 0.9 });
  }
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 0).translate(0, 0.5, 0), lambert(0x3f6b2e, { flatShading: true }), hedge));

  const stones: Placement[] = [];
  for (let x = -420; x < -210; x += 1.2) {
    stones.push({ x, z: -H - 9, sx: 1.25, sy: 1.0 + r() * 0.15, sz: 0.7, color: 0x9b968a });
    stones.push({ x, z: H + 12, sx: 1.25, sy: 1.0 + r() * 0.15, sz: 0.7, color: 0xa39e92 });
  }
  root.add(instanced(box, lambert(0xffffff, { flatShading: true }), stones));

  const trunks: Placement[] = [];
  const crowns: Placement[] = [];
  const tree = (x: number, z: number, s = 0.8 + r() * 0.7) => {
    trunks.push({ x, z, sx: 0.4 * s, sy: 2.4 * s, sz: 0.4 * s });
    crowns.push({ x, y: 2 * s, z, sx: 3.4 * s, sy: 3.6 * s, sz: 3.4 * s, color: r() < 0.5 ? 0x4c7a34 : 0x5d8a3c });
  };
  for (let i = 0; i < 40; i++) tree(-420 + r() * 210, (r() < 0.5 ? -1 : 1) * (16 + r() * 60));
  for (let i = 0; i < 14; i++) tree(102 + r() * 28, 28 + r() * 68);
  for (let i = 0; i < 24; i++) tree(-150 + r() * 260, -330 - r() * 60);
  for (let i = 0; i < 20; i++) tree(-60 + r() * 80, -60 - r() * 200);
  root.add(instanced(box, lambert(0x5b4330), trunks));
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 0).translate(0, 0.6, 0), lambert(0xffffff, { flatShading: true }), crowns));

  // A barn in the fields.
  const barn = new THREE.Mesh(box, lambert(0x7a2f26));
  barn.scale.set(16, 7, 10);
  barn.position.set(-330, 0, 40);
  root.add(barn);
  const barnRoof = new THREE.Mesh(roofPrism(), lambert(0x585d63));
  barnRoof.scale.set(16.4, 3.5, 10.6);
  barnRoof.position.set(-330, 7, 40);
  root.add(barnRoof);

  // ---- Street furniture -----------------------------------------------------
  const poles: Placement[] = [];
  const lampAlong = (axis: 'x' | 'z', from: number, to: number, at: number, step = 32) => {
    for (let a = from; a <= to; a += step) poles.push(axis === 'x' ? { x: a, z: at } : { x: at, z: a });
  };
  // Street lights only where the limit is 20 or 30 (rule 124: lit roads are generally 30 mph).
  lampAlong('x', -196, 250, -H - PAVE + 0.4);
  lampAlong('x', -180, 250, H + PAVE - 0.4, 32);
  lampAlong('z', -290, -20, 40 + H + PAVE - 0.4, 36);
  lampAlong('z', 20, 160, 140 - H - PAVE + 0.4, 36);
  lampAlong('z', -290, -20, -160 + H + PAVE - 0.4, 36);
  lampAlong('x', -140, 110, -300 + H + PAVE - 0.4, 36);
  root.add(instanced(box, lambert(0x3a3f45), poles.map((p) => ({ ...p, sx: 0.14, sy: 6, sz: 0.14 }))));
  root.add(instanced(box, lambert(0xf4f1d0), poles.map((p) => ({ ...p, y: 6, sx: 0.5, sy: 0.18, sz: 0.5 }))));

  // Speed camera (yellow box on a pole) on Ashby Road.
  const cam = new THREE.Group();
  const camPole = new THREE.Mesh(box, lambert(0x6d757c));
  camPole.scale.set(0.2, 3.2, 0.2);
  const camBox = new THREE.Mesh(box, lambert(0xffcc1a));
  camBox.scale.set(0.8, 0.9, 1.0);
  camBox.position.y = 3.2;
  cam.add(camPole, camBox);
  cam.position.set(-150, 0, -H - 1.6);
  root.add(cam);

  // Red post box and phone box on Market Street.
  const red = lambert(0xc8102e);
  const pbBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.3, 12), red);
  pbBody.position.set(12, 0.78, -H - 1.6);
  const pbCap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0x111111));
  pbCap.position.set(12, 1.56, -H - 1.6);
  const phone = new THREE.Mesh(box, red);
  phone.scale.set(1, 2.5, 1);
  phone.position.set(-30, 0.13, H + 1.5);
  root.add(pbBody, pbCap, phone);

  // Signs.
  for (const s of L.signs ?? []) root.add(signPost(s));

  // Parked cars and vans.
  addParked(root, box);

  // Clouds.
  const clouds: Placement[] = [];
  for (let i = 0; i < 22; i++) clouds.push({ x: -500 + r() * 800, y: 60 + r() * 30, z: -450 + r() * 700, sx: 20 + r() * 24, sy: 5 + r() * 4, sz: 10 + r() * 12 });
  root.add(instanced(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), clouds));

  const mk = markerMeshes(root, L);
  const setHintPath = hintPathFactory(root);
  return { layout: L, root, markers: mk.markers, setMarker: mk.setMarker, setHintPath, update: mk.update };
}

function flat(r: Rect, mat: THREE.Material, y: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
  return m;
}

/** Painted lines: white dashes, hazard lines, double whites, give way / stop lines, yellow lines. */
function addMarkings(root: THREE.Group, ms: Marking[]): void {
  const white: Placement[] = [];
  const yellow: Placement[] = [];
  const Y = 0.012;
  for (const m of ms) {
    const len = Math.hypot(m.x1 - m.x0, m.z1 - m.z0);
    const ry = Math.atan2(m.x1 - m.x0, m.z1 - m.z0);
    const ux = (m.x1 - m.x0) / len;
    const uz = (m.z1 - m.z0) / len;
    // Perpendicular offset vector.
    const px = uz;
    const pz = -ux;
    const dashes = (dash: number, gap: number, width: number, off = 0, out = white) => {
      for (let s = 0; s < len; s += dash + gap) {
        const d = Math.min(dash, len - s);
        const c = s + d / 2;
        out.push({ x: m.x0 + ux * c + px * off, y: Y, z: m.z0 + uz * c + pz * off, ry, sx: width, sy: 0.01, sz: d });
      }
    };
    const solid = (width: number, off = 0, out = white) => out.push({ x: (m.x0 + m.x1) / 2 + px * off, y: Y, z: (m.z0 + m.z1) / 2 + pz * off, ry, sx: width, sy: 0.01, sz: len });
    switch (m.kind) {
      case 'centre':
        dashes(3, 6, 0.12);
        break;
      case 'hazard':
        dashes(6, 2, 0.14);
        break;
      case 'double-solid':
        solid(0.12, 0.16);
        solid(0.12, -0.16);
        break;
      case 'edge':
        solid(0.12);
        break;
      case 'giveway':
        dashes(0.6, 0.3, 0.2, 0.18);
        dashes(0.6, 0.3, 0.2, -0.18);
        break;
      case 'stop':
        solid(0.35);
        break;
      case 'double-yellow':
        solid(0.08, 0.1, yellow);
        solid(0.08, -0.1, yellow);
        break;
      case 'single-yellow':
        solid(0.1, 0, yellow);
        break;
    }
  }
  root.add(instanced(baseBox(), new THREE.MeshBasicMaterial({ color: 0xe9e9e2 }), white));
  root.add(instanced(baseBox(), new THREE.MeshBasicMaterial({ color: 0xf2c230 }), yellow));
}

function signPost(s: SignPlacement): THREE.Group {
  const g = new THREE.Group();
  const size = s.size ?? (s.kind === 'name' ? 0.6 : 0.85);
  const ar = signAspect(s.kind);
  const w = size * ar;
  const h = size;
  const height = s.kind === 'name' ? 0.9 : 2.1;
  if (s.kind !== 'name') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, height, 6), lambert(0x8d959c));
    pole.position.y = height / 2;
    g.add(pole);
  } else {
    for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, height, 5), lambert(0x3a3f45));
      leg.position.set(dx, height / 2, 0);
      g.add(leg);
    }
  }
  const spec = { kind: s.kind, value: s.value, text: s.text };
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: signTexture(spec), transparent: true, alphaTest: 0.2 }));
  face.position.y = height + h / 2 - 0.05;
  face.position.z = 0.03;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: signTexture(spec, true), transparent: true, alphaTest: 0.2 }));
  back.rotation.y = Math.PI;
  back.position.copy(face.position);
  back.position.z = 0.0;
  g.add(face, back);
  g.position.set(s.x, 0, s.z);
  // The face's normal must point back at the approaching driver.
  g.rotation.y = s.faces + Math.PI;
  return g;
}

function addParked(root: THREE.Group, box: THREE.BufferGeometry): void {
  const bodies: Placement[] = [];
  const cabs: Placement[] = [];
  const shadows: Placement[] = [];
  for (const o of TOWN.obstacles) {
    if (o.kind !== 'car' && o.kind !== 'van') continue;
    const x = (o.x0 + o.x1) / 2;
    const z = (o.z0 + o.z1) / 2;
    const alongX = o.x1 - o.x0 > o.z1 - o.z0;
    const len = alongX ? o.x1 - o.x0 : o.z1 - o.z0;
    const wid = alongX ? o.z1 - o.z0 : o.x1 - o.x0;
    const ry = alongX ? Math.PI / 2 : 0;
    if (o.kind === 'van') {
      bodies.push({ x, y: 0.3, z, ry, sx: wid, sy: 1.9, sz: len, color: o.color });
      cabs.push({ x: x + (alongX ? len * 0.38 : 0), y: 1.1, z: z + (alongX ? 0 : len * 0.38), ry, sx: wid * 0.92, sy: 0.6, sz: 0.4 });
    } else {
      bodies.push({ x, y: 0.3, z, ry, sx: wid, sy: 0.62, sz: len, color: o.color });
      cabs.push({ x, y: 0.92, z, ry, sx: wid * 0.88, sy: 0.55, sz: len * 0.52 });
    }
    shadows.push({ x, y: 0.015, z, ry, sx: wid + 0.4, sy: 0.01, sz: len + 0.4 });
  }
  root.add(instanced(box, lambert(0xffffff), bodies));
  root.add(instanced(box, lambert(0x2b3440), cabs));
  root.add(instanced(box, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }), shadows));
  // Dead-end walls.
  for (const o of TOWN.obstacles) {
    if (o.kind !== 'gate') continue;
    const m = new THREE.Mesh(box, lambert(0x9b968a));
    m.scale.set(o.x1 - o.x0, 1.2, o.z1 - o.z0);
    m.position.set((o.x0 + o.x1) / 2, 0, (o.z0 + o.z1) / 2);
    root.add(m);
  }
}
