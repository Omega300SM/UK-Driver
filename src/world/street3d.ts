import * as THREE from 'three';
import type { Crossing, SceneLayout } from './layout';
import { instanced, lambert, baseBox, type Placement } from './props';
import type { Aspect, StreetControl } from '../sim/street';

const Y = 0.014;
const PED_MAX = 24;

/**
 * Crossings, traffic signals, box junctions, bus lanes and pedestrians in 3D.
 * Static paint is built once; `update` lights the lamps and moves the people.
 */
export function buildStreet(root: THREE.Group, L: SceneLayout) {
  const box = baseBox();
  const white: Placement[] = [];
  const yellow: Placement[] = [];
  const studs: Placement[] = [];

  // ---- Bus lanes: red surface, solid white line, BUS LANE lettering.
  for (const b of L.busLanes ?? []) {
    const red = new THREE.Mesh(new THREE.PlaneGeometry(b.x1 - b.x0, b.z1 - b.z0), lambert(0x8f3a30));
    red.rotation.x = -Math.PI / 2;
    red.position.set((b.x0 + b.x1) / 2, Y * 0.6, (b.z0 + b.z1) / 2);
    root.add(red);
    const alongX = b.x1 - b.x0 > b.z1 - b.z0;
    // Solid line on the traffic side (wide: 250 mm).
    if (alongX) white.push({ x: (b.x0 + b.x1) / 2, y: Y, z: b.z0 + 0.12, sx: b.x1 - b.x0, sy: 0.01, sz: 0.25 });
    else white.push({ x: b.x0 + 0.12, y: Y, z: (b.z0 + b.z1) / 2, sx: 0.25, sy: 0.01, sz: b.z1 - b.z0 });
    const words = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 5.2), new THREE.MeshBasicMaterial({ map: roadWords('BUS', 'LANE'), transparent: true }));
    words.rotation.set(-Math.PI / 2, 0, b.heading + Math.PI);
    const cx = (b.x0 + b.x1) / 2;
    const cz = (b.z0 + b.z1) / 2;
    const end = alongX ? (Math.sin(b.heading) < 0 ? b.x1 - 10 : b.x0 + 10) : 0;
    words.position.set(alongX ? end : cx, Y * 1.4, alongX ? cz : Math.cos(b.heading) < 0 ? b.z1 - 10 : b.z0 + 10);
    root.add(words);
  }

  // ---- Box junctions: yellow border and criss-cross lines (rule 174).
  for (const b of L.boxes ?? []) {
    const w = b.x1 - b.x0;
    const d = b.z1 - b.z0;
    const cx = (b.x0 + b.x1) / 2;
    const cz = (b.z0 + b.z1) / 2;
    yellow.push({ x: cx, y: Y, z: b.z0 + 0.1, sx: w, sy: 0.01, sz: 0.2 }, { x: cx, y: Y, z: b.z1 - 0.1, sx: w, sy: 0.01, sz: 0.2 });
    yellow.push({ x: b.x0 + 0.1, y: Y, z: cz, sx: 0.2, sy: 0.01, sz: d }, { x: b.x1 - 0.1, y: Y, z: cz, sx: 0.2, sy: 0.01, sz: d });
    // Diagonals both ways, clipped to the box by sampling short pieces.
    for (const dir of [1, -1]) {
      for (let k = -w - d; k <= w + d; k += 1.6) {
        for (let s = 0; s < 40; s += 0.5) {
          const x = b.x0 + s / Math.SQRT2;
          const z = (dir > 0 ? b.z0 : b.z1) + (dir * s) / Math.SQRT2 + k;
          if (x > b.x0 + 0.2 && x < b.x1 - 0.2 && z > b.z0 + 0.2 && z < b.z1 - 0.2) yellow.push({ x, y: Y, z, ry: dir * (Math.PI / 4), sx: 0.12, sy: 0.01, sz: 0.72 });
        }
      }
    }
  }

  // ---- Crossings.
  const beacons: THREE.Mesh[] = [];
  const beaconMat = new THREE.MeshLambertMaterial({ color: 0xf2a20c, emissive: 0x000000 });
  for (const c of L.crossings ?? []) {
    const a = c.area;
    if (c.kind === 'zebra') {
      // Stripes run with the traffic, alternating across the road.
      const across = c.axis === 'x' ? [a.z0, a.z1] : [a.x0, a.x1];
      for (let p = across[0] + 0.25; p < across[1] - 0.2; p += 1.0) {
        if (c.axis === 'x') white.push({ x: (a.x0 + a.x1) / 2, y: Y, z: p + 0.25, sx: a.x1 - a.x0, sy: 0.01, sz: 0.5 });
        else white.push({ x: p + 0.25, y: Y, z: (a.z0 + a.z1) / 2, sx: 0.5, sy: 0.01, sz: a.z1 - a.z0 });
      }
      for (const [bx, bz] of beaconSpots(c)) {
        const pole = instancedPole(bx, bz);
        root.add(pole);
        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), beaconMat);
        globe.position.set(bx, 2.7, bz);
        root.add(globe);
        beacons.push(globe);
      }
    } else if (c.kind === 'informal' || c.kind === 'patrol') {
      // Dropped kerbs with buff tactile paving either side; no road markings.
      const tactile = new THREE.MeshLambertMaterial({ color: 0xc9a27a });
      const spots: Array<[number, number, number, number]> =
        c.axis === 'z'
          ? [
              [a.x0 - 1.0, (a.z0 + a.z1) / 2, 1.2, a.z1 - a.z0],
              [a.x1 + 1.0, (a.z0 + a.z1) / 2, 1.2, a.z1 - a.z0]
            ]
          : [
              [(a.x0 + a.x1) / 2, a.z0 - 1.0, a.x1 - a.x0, 1.2],
              [(a.x0 + a.x1) / 2, a.z1 + 1.0, a.x1 - a.x0, 1.2]
            ];
      for (const [x, z, w, d] of spots) {
        const m = new THREE.Mesh(box, tactile);
        m.scale.set(w, 0.14, d);
        m.position.set(x, 0, z);
        root.add(m);
      }
    } else {
      // Signal-controlled crossing: two lines of square studs either side.
      if (c.axis === 'z') {
        for (const z of [a.z0, a.z1]) for (let x = a.x0 + 0.3; x < a.x1; x += 0.6) studs.push({ x, y: Y, z, sx: 0.2, sy: 0.02, sz: 0.2 });
      } else {
        for (const x of [a.x0, a.x1]) for (let z = a.z0 + 0.3; z < a.z1; z += 0.6) studs.push({ x, y: Y, z, sx: 0.2, sy: 0.02, sz: 0.2 });
      }
    }
    // Zig-zags along both kerbs and the centre of each approach.
    for (const zz of c.zigzag) addZigzags(white, zz, c.axis);
  }
  // School Keep Clear: yellow zig-zags along the kerb.
  for (const r of L.schoolZigzags ?? []) {
    const alongZ = r.z1 - r.z0 > r.x1 - r.x0;
    const zz: Placement[] = [];
    addZigzags(zz, alongZ ? { ...r, x0: r.x1 - 0.7, x1: r.x1 } : { ...r, z0: r.z1 - 0.7, z1: r.z1 }, alongZ ? 'z' : 'x', true);
    yellow.push(...zz);
  }
  if (white.length) root.add(instanced(box, new THREE.MeshLambertMaterial({ color: 0xf4f4f0 }), white));
  if (yellow.length) root.add(instanced(box, new THREE.MeshLambertMaterial({ color: 0xf2c21b }), yellow));
  if (studs.length) root.add(instanced(box, new THREE.MeshLambertMaterial({ color: 0xdcdcd6 }), studs));

  // ---- Signal heads: grey pole, black housing, three lamps with their own materials.
  type Head = { ctrl: string; group: string; lamps: { red: THREE.MeshLambertMaterial; amber: THREE.MeshLambertMaterial; green: THREE.MeshLambertMaterial } };
  const heads: Head[] = [];
  const poleMat = lambert(0x5d6166);
  const housingMat = lambert(0x161718);
  const lampGeo = new THREE.SphereGeometry(0.13, 10, 8);
  for (const s of L.signals ?? []) {
    for (const h of s.heads) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(box, poleMat);
      pole.scale.set(0.12, 2.6, 0.12);
      g.add(pole);
      const housing = new THREE.Mesh(box, housingMat);
      housing.scale.set(0.38, 1.05, 0.26);
      housing.position.y = 2.25;
      g.add(housing);
      const mk = (hex: number) => new THREE.MeshLambertMaterial({ color: 0x2a2a2a, emissive: 0x000000, userData: { on: hex } } as THREE.MeshLambertMaterialParameters);
      const lamps = { red: mk(0xff2a1a), amber: mk(0xffa514), green: mk(0x2bff6a) };
      (['red', 'amber', 'green'] as const).forEach((k, i) => {
        const lamp = new THREE.Mesh(lampGeo, lamps[k]);
        // Facing the driver: the lamp sits on the housing face towards -faces.
        lamp.position.set(0, 3.08 - i * 0.32, -0.15);
        g.add(lamp);
      });
      g.position.set(h.x, 0, h.z);
      g.rotation.y = h.faces;
      root.add(g);
      heads.push({ ctrl: s.id, group: h.group, lamps });
    }
  }

  // ---- School crossing patrols: hi-vis coat, cap and a 'Stop for children' lollipop.
  type Patrol = { id: string; g: THREE.Group; kerb: [number, number]; road: [number, number]; faces: number };
  const patrols: Patrol[] = [];
  for (const c of L.crossings ?? []) {
    if (c.kind !== 'patrol') continue;
    const g = new THREE.Group();
    const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 1.0, 10), lambert(0xd6f22b));
    coat.position.y = 1.1;
    g.add(coat);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), lambert(0xd8b08c));
    head.position.y = 1.78;
    g.add(head);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 10), lambert(0xf4f4f0));
    cap.position.y = 1.9;
    g.add(cap);
    for (const side of [-0.1, 0.1]) {
      const leg = new THREE.Mesh(box, lambert(0x1d2733));
      leg.scale.set(0.14, 0.62, 0.14);
      leg.position.set(side, 0, 0);
      g.add(leg);
    }
    const pole = new THREE.Mesh(box, lambert(0xf4f4f0));
    pole.scale.set(0.05, 2.1, 0.05);
    pole.position.set(0.4, 0.2, 0);
    g.add(pole);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ map: lollipop(), side: THREE.DoubleSide }));
    disc.position.set(0.4, 2.5, 0);
    g.add(disc);
    root.add(g);
    const a = c.area;
    const mid: [number, number] = [(a.x0 + a.x1) / 2, (a.z0 + a.z1) / 2];
    const kerb: [number, number] = c.axis === 'z' ? [a.x1 + 0.9, mid[1]] : [mid[0], a.z1 + 0.9];
    patrols.push({ id: c.id, g, kerb, road: mid, faces: c.axis === 'z' ? 0 : Math.PI / 2 });
  }

  // ---- Pedestrians: instanced bodies, heads and legs.
  const bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.25, 0.85, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }), PED_MAX);
  const headsM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 10, 8), lambert(0xd8b08c), PED_MAX);
  const legs = new THREE.InstancedMesh(box, lambert(0x2c2f36), PED_MAX * 2);
  for (const m of [bodies, headsM, legs]) {
    m.count = 0;
    m.frustumCulled = false;
    root.add(m);
  }
  const dummy = new THREE.Object3D();
  const colour = new THREE.Color();

  const setLamp = (m: THREE.MeshLambertMaterial, on: boolean) => {
    const hex = (m.userData as { on: number }).on;
    m.emissive.setHex(on ? hex : 0x000000);
    m.color.setHex(on ? hex : 0x2a2a2a);
  };

  return {
    update(street: StreetControl | null, t: number) {
      const flashOn = Math.floor(t * 1.6) % 2 === 0;
      beaconMat.emissive.setHex(flashOn ? 0xc87a00 : 0x000000);
      for (const p of patrols) {
        const out = !!street?.patrolActive(p.id);
        const [x, z] = out ? p.road : p.kerb;
        p.g.position.x += (x - p.g.position.x) * 0.08;
        p.g.position.z += (z - p.g.position.z) * 0.08;
        // Holding the sign up to traffic when out in the road.
        p.g.rotation.y = out ? p.faces + Math.PI / 2 : p.faces;
      }
      if (!street) return;
      for (const h of heads) {
        const a: Aspect = street.aspect(h.ctrl, h.group);
        setLamp(h.lamps.red, a === 'red' || a === 'redAmber');
        setLamp(h.lamps.amber, a === 'amber' || a === 'redAmber' || (a === 'flashAmber' && flashOn));
        setLamp(h.lamps.green, a === 'green');
      }
      const peds = street.peds.slice(0, PED_MAX);
      peds.forEach((p, i) => {
        const moving = p.state !== 'wait';
        const swing = moving ? Math.sin(t * 7 + p.id) * 0.35 : 0;
        const k = p.child ? 0.68 : 1;
        dummy.rotation.set(0, p.heading, 0);
        dummy.scale.set(k, k, k);
        dummy.position.set(p.x, 1.25 * k, p.z);
        dummy.updateMatrix();
        bodies.setMatrixAt(i, dummy.matrix);
        bodies.setColorAt(i, colour.setHex(p.colour));
        dummy.position.set(p.x, 1.82 * k, p.z);
        dummy.updateMatrix();
        headsM.setMatrixAt(i, dummy.matrix);
        for (const side of [-1, 1]) {
          const fx = Math.sin(p.heading);
          const fz = Math.cos(p.heading);
          const off = side * 0.1;
          dummy.position.set(p.x + fz * off + fx * swing * side * 0.25, 0, p.z - fx * off + fz * swing * side * 0.25);
          dummy.rotation.set(swing * side, p.heading, 0);
          dummy.scale.set(0.13, 0.82 * k, 0.14);
          dummy.updateMatrix();
          legs.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), dummy.matrix);
        }
      });
      bodies.count = headsM.count = peds.length;
      legs.count = peds.length * 2;
      for (const m of [bodies, headsM, legs]) m.instanceMatrix.needsUpdate = true;
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    }
  };
}

/** Belisha beacon positions: on the pavement at each end of a zebra. */
function beaconSpots(c: Crossing): Array<[number, number]> {
  const a = c.area;
  if (c.axis === 'x') {
    const x = a.x0 - 0.4;
    return [
      [x, a.z0 - 0.6],
      [x, a.z1 + 0.6]
    ];
  }
  const z = a.z0 - 0.4;
  return [
    [a.x0 - 0.6, z],
    [a.x1 + 0.6, z]
  ];
}

function instancedPole(x: number, z: number): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(geo, lambert(i % 2 ? 0xf2f2f2 : 0x111111));
    m.position.set(x, 0.2 + i * 0.42, z);
    g.add(m);
  }
  return g;
}

/** White zig-zag lines along a crossing approach: both kerbs and the centre. */
function addZigzags(out: Placement[], r: { x0: number; x1: number; z0: number; z1: number }, axis: 'x' | 'z', single = false): void {
  const len = axis === 'x' ? r.x1 - r.x0 : r.z1 - r.z0;
  const n = Math.max(2, Math.round(len / 1.1));
  const step = len / n;
  const lines = single ? [axis === 'x' ? (r.z0 + r.z1) / 2 : (r.x0 + r.x1) / 2] : axis === 'x' ? [r.z0 + 0.35, (r.z0 + r.z1) / 2, r.z1 - 0.35] : [r.x0 + 0.35, (r.x0 + r.x1) / 2, r.x1 - 0.35];
  const amp = 0.22;
  const piece = Math.hypot(step, amp * 2);
  const ang = Math.atan2(amp * 2, step);
  for (const c of lines) {
    for (let i = 0; i < n; i++) {
      const s = (axis === 'x' ? r.x0 : r.z0) + (i + 0.5) * step;
      const tilt = i % 2 ? ang : -ang;
      if (axis === 'x') out.push({ x: s, y: Y, z: c, ry: Math.PI / 2 + tilt, sx: 0.1, sy: 0.01, sz: piece });
      else out.push({ x: c, y: Y, z: s, ry: tilt, sx: 0.1, sy: 0.01, sz: piece });
    }
  }
}

/** Road lettering (e.g. BUS / LANE) as a transparent texture, read from the driver's seat. */
function roadWords(top: string, bottom: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 416;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f4f4f0';
  g.textAlign = 'center';
  g.font = 'bold 88px Arial';
  // Elongated letters, as painted on the road.
  g.save();
  g.scale(1, 1.8);
  g.fillText(bottom, 64, 100);
  g.fillText(top, 64, 210);
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 'STOP children' lollipop sign face. */
function lollipop(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#d4202b';
  g.beginPath();
  g.arc(64, 64, 62, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(64, 64, 50, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#111';
  g.textAlign = 'center';
  g.font = 'bold 30px Arial';
  g.fillText('STOP', 64, 62);
  g.font = 'bold 16px Arial';
  g.fillText('children', 64, 84);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
