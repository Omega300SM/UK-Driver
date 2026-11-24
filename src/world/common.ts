import * as THREE from 'three';
import type { Marking, Rect, SceneLayout, SignPlacement } from './layout';
import { baseBox, instanced, lambert, type Placement } from './props';
import { signTexture } from './signs';
import { signAspect } from './signSvg';

/** Pulsing yellow target boxes for markers; only one shows at a time. */
export function markerMeshes(root: THREE.Group, layout: SceneLayout, ids?: string[]) {
  const box = baseBox();
  const markers: Record<string, THREE.Object3D> = {};
  for (const m of layout.markers) {
    if (ids && !ids.includes(m.id)) continue;
    if (!m.label) continue; // zone-only markers are never drawn
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
    grp.position.set((m.x0 + m.x1) / 2, 0.04, (m.z0 + m.z1) / 2);
    grp.visible = false;
    markers[m.id] = grp;
    root.add(grp);
  }
  let active: string | null = null;
  return {
    markers,
    setMarker(id: string | null) {
      active = id;
      for (const [k, o] of Object.entries(markers)) o.visible = k === id;
    },
    update(t: number) {
      if (!active || !markers[active]) return;
      const b = markers[active].getObjectByName('beacon');
      if (b) {
        b.position.y = 3 + Math.sin(t * 3) * 0.35;
        b.rotation.y = t * 1.5;
      }
    }
  };
}

/** Green dashed route-hint line along a polyline. */
export function hintPathFactory(root: THREE.Group) {
  const box = baseBox();
  const mat = new THREE.MeshBasicMaterial({ color: 0x5be37d, transparent: true, opacity: 0.75, depthWrite: false });
  let mesh: THREE.InstancedMesh | null = null;
  return (pts: Array<[number, number]> | null) => {
    if (mesh) {
      root.remove(mesh);
      mesh.dispose();
      mesh = null;
    }
    if (!pts || pts.length < 2) return;
    const dashes: Placement[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const ry = Math.atan2(bx - ax, bz - az);
      for (let s = 0; s < len; s += 2.6) {
        const k = s / len;
        dashes.push({ x: ax + (bx - ax) * k, y: 0.035, z: az + (bz - az) * k, ry, sx: 0.35, sy: 0.01, sz: 1.2 });
      }
    }
    mesh = instanced(box, mat, dashes);
    root.add(mesh);
  };
}

export function flat(r: Rect, mat: THREE.Material, y: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
  return m;
}

/** Painted lines: white dashes, hazard lines, double whites, give way / stop lines, yellow lines. */
export function addMarkings(root: THREE.Group, ms: Marking[]): void {
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

export function signPost(s: SignPlacement): THREE.Group {
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
  const spec = { kind: s.kind, value: s.value, text: s.text, map: s.map };
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
