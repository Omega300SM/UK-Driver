import * as THREE from 'three';
import { lambert } from './props';
import { lPlate, fascia } from './signs';

export interface PlayerCarMesh {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  frontWheels: THREE.Object3D[];
  indicators: { left: THREE.Mesh[]; right: THREE.Mesh[] };
  /** Roof, pillars and roof sign: hidden in the driver's-seat camera. */
  upper: THREE.Object3D[];
  brakeLights: THREE.Mesh[];
  headlights: THREE.Mesh[];
}

/**
 * Generic hatchback in "Hale's School of Motoring" green, with L plates and a
 * roof sign. No real-world make or logo. Faces +z.
 */
export function buildPlayerCar(): PlayerCarMesh {
  const g = new THREE.Group();
  const paint = lambert(0x2f8a5f);
  const trim = lambert(0x22262b);
  const glass = lambert(0x9fc3d6, { transparent: true, opacity: 0.55 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.62, 4.1), paint);
  body.position.y = 0.58;
  g.add(body);
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.22, 0.2), trim);
  bumperF.position.set(0, 0.36, 2.05);
  const bumperR = bumperF.clone();
  bumperR.position.z = -2.05;
  g.add(bumperF, bumperR);

  // Cabin: open-bottomed so the cockpit camera can see out.
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.6, 2.2), glass);
  cabin.position.set(0, 1.19, -0.25);
  g.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.06, 2.0), paint);
  roof.position.set(0, 1.5, -0.3);
  g.add(roof);
  const upper: THREE.Object3D[] = [cabin, roof];
  // Pillars.
  for (const [x, z] of [
    [0.78, 0.82],
    [-0.78, 0.82],
    [0.78, -1.32],
    [-0.78, -1.32]
  ]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 0.09), paint);
    p.position.set(x, 1.19, z);
    g.add(p);
    upper.push(p);
  }

  // Roof sign (fictional driving school).
  const signMat = [trim, trim, trim, trim, new THREE.MeshBasicMaterial({ map: fascia('HALE’S  L', '#1f6f4a') }), new THREE.MeshBasicMaterial({ map: fascia('HALE’S  L', '#1f6f4a') })];
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.12), signMat);
  sign.position.set(0, 1.65, -0.3);
  g.add(sign);
  upper.push(sign);

  // L plates front and back.
  const lMat = new THREE.MeshBasicMaterial({ map: lPlate() });
  const lf = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), lMat);
  lf.position.set(0.45, 0.62, 2.07);
  const lr = lf.clone();
  lr.position.set(-0.45, 0.62, -2.07);
  lr.rotation.y = Math.PI;
  g.add(lf, lr);

  // Wheels.
  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = lambert(0x1b1b1d);
  const wheels: THREE.Mesh[] = [];
  const frontWheels: THREE.Object3D[] = [];
  for (const [x, z] of [
    [0.82, 1.3],
    [-0.82, 1.3],
    [0.82, -1.3],
    [-0.82, -1.3]
  ]) {
    const pivot = new THREE.Object3D();
    pivot.position.set(x, 0.33, z);
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    pivot.add(w);
    g.add(pivot);
    wheels.push(w);
    if (z > 0) frontWheels.push(pivot);
  }

  // Lights. Note: car faces +z, so the car's left is +x.
  const amber = () => new THREE.MeshBasicMaterial({ color: 0x6b4a12 });
  const mk = (x: number, z: number, w: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.05), mat);
    m.position.set(x, 0.72, z);
    g.add(m);
    return m;
  };
  const indicators = {
    left: [mk(0.8, 2.06, 0.14, amber()), mk(0.8, -2.06, 0.14, amber())],
    right: [mk(-0.8, 2.06, 0.14, amber()), mk(-0.8, -2.06, 0.14, amber())]
  };
  const brakeLights = [mk(0.62, -2.06, 0.26, new THREE.MeshBasicMaterial({ color: 0x5a1010 })), mk(-0.62, -2.06, 0.26, new THREE.MeshBasicMaterial({ color: 0x5a1010 }))];
  const headlights = [mk(0.6, 2.06, 0.3, new THREE.MeshBasicMaterial({ color: 0xd8d8cc })), mk(-0.6, 2.06, 0.3, new THREE.MeshBasicMaterial({ color: 0xd8d8cc }))];

  // Fake soft shadow.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 4.6),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow);

  return { group: g, wheels, frontWheels, indicators, brakeLights, headlights, upper };
}

export function setLamp(meshes: THREE.Mesh[], on: boolean, onColor: number, offColor: number): void {
  for (const m of meshes) (m.material as THREE.MeshBasicMaterial).color.setHex(on ? onColor : offColor);
}
