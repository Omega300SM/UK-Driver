import * as THREE from 'three';
import type { SceneLayout } from './layout';
import { baseBox, instanced, type Placement } from './props';

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
