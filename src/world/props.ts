import * as THREE from 'three';

export interface Placement {
  x: number;
  y?: number;
  z: number;
  ry?: number;
  sx?: number;
  sy?: number;
  sz?: number;
  color?: number;
}

const dummy = new THREE.Object3D();
const col = new THREE.Color();

/** One draw call for many copies of a shape. Per-instance colour is optional. */
export function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, items: Placement[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
  mesh.count = items.length;
  items.forEach((p, i) => {
    dummy.position.set(p.x, p.y ?? 0, p.z);
    dummy.rotation.set(0, p.ry ?? 0, 0);
    dummy.scale.set(p.sx ?? 1, p.sy ?? 1, p.sz ?? 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (p.color !== undefined) mesh.setColorAt(i, col.setHex(p.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.matrixAutoUpdate = false;
  return mesh;
}

export const lambert = (color: number, extra: THREE.MeshLambertMaterialParameters = {}) =>
  new THREE.MeshLambertMaterial({ color, ...extra });

/** Unit box with its base at y=0 (so scale.y = height). */
export function baseBox(): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(1, 1, 1);
  g.translate(0, 0.5, 0);
  return g;
}

/** Triangular prism roof, ridge along x, base at y=0, unit size. */
export function roofPrism(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0.5, 0);
  shape.lineTo(0, 1);
  shape.lineTo(-0.5, 0);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  g.rotateY(Math.PI / 2);
  return g;
}

/** Simple seeded RNG so the world looks the same every time. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
