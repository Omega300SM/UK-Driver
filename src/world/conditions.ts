import * as THREE from 'three';
import type { Rect } from './layout';
import { inRect } from './layout';

export type TimeOfDay = 'day' | 'dusk' | 'night';
export type Weather = 'clear' | 'rain' | 'fog';
export interface Conditions {
  time?: TimeOfDay;
  weather?: Weather;
  /** Banks of fog in the layout's fogZones (as well as any general weather). */
  fogPatches?: boolean;
}

/** Headlights: off, dipped or main beam. */
export type LightsState = 'off' | 'dipped' | 'main';

const SKY: Record<TimeOfDay, number> = { day: 0xbcd9ea, dusk: 0x9c8aa0, night: 0x0a0f1c };

/**
 * Weather and time of day for a drive: sky and fog colour, light levels,
 * rain streaks round the camera, fog banks you drive into, and the car's
 * headlight beam at night. Purely visual: the rules read the same facts
 * (dark, raining, in fog) from `state()`.
 */
export function applyConditions(scene: THREE.Scene, root: THREE.Object3D, carGroup: THREE.Object3D, cond: Conditions, fogZones: Rect[] = [], active = true) {
  if (!active) {
    // Scenes without weather keep their own sky; nothing to do.
    return {
      inFog: false,
      update() {},
      state: () => ({ dark: false, wet: false, poorVisibility: false }),
      dispose() {}
    };
  }
  const time = cond.time ?? 'day';
  const weather = cond.weather ?? 'clear';
  const dark = time === 'night';
  const lightScale = (time === 'night' ? 0.1 : time === 'dusk' ? 0.55 : 1) * (weather === 'clear' ? 1 : 0.7);
  root.traverse((o) => {
    const l = o as THREE.Light;
    if (l.isLight) l.intensity *= lightScale;
  });
  let base = new THREE.Color(SKY[time]);
  if (weather !== 'clear' && time !== 'night') base = base.lerp(new THREE.Color(0xa4adb4), 0.75);
  scene.background = base.clone();
  const near = weather === 'fog' ? 4 : dark ? 18 : weather === 'rain' ? 40 : 90;
  const far = weather === 'fog' ? 85 : dark ? 230 : weather === 'rain' ? 240 : 400;
  const fog = new THREE.Fog(base.clone(), near, far);
  scene.fog = fog;

  // Headlight beam (dipped / main) for night and poor visibility.
  const beam = new THREE.SpotLight(0xfff4dc, 0, 60, 0.5, 0.6, 1.2);
  beam.position.set(0, 0.8, 1.9);
  beam.target.position.set(0, 0, 22);
  carGroup.add(beam, beam.target);

  // Rain: thin streaks in a box that follows the camera.
  let rain: THREE.InstancedMesh | null = null;
  const drops: Array<[number, number, number]> = [];
  const RAIN_N = 700;
  if (weather === 'rain') {
    rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.6, 0.02), new THREE.MeshBasicMaterial({ color: 0xc8d4de, transparent: true, opacity: 0.55 }), RAIN_N);
    rain.frustumCulled = false;
    for (let i = 0; i < RAIN_N; i++) drops.push([(Math.random() - 0.5) * 40, Math.random() * 16, (Math.random() - 0.5) * 40]);
    scene.add(rain);
  }
  const dummy = new THREE.Object3D();
  let fogMix = 0;

  return {
    /** True while the car is inside a fog bank (or it's foggy everywhere). */
    inFog: false,
    update(dt: number, cam: THREE.Camera, car: { x: number; z: number }, lights: LightsState) {
      // Fog banks: thicken the fog smoothly as you drive in.
      const inPatch = !!cond.fogPatches && fogZones.some((z) => inRect(z, car.x, car.z));
      this.inFog = weather === 'fog' || inPatch;
      fogMix += ((inPatch ? 1 : 0) - fogMix) * Math.min(1, dt * 0.8);
      fog.near = near + (4 - near) * fogMix;
      fog.far = far + (80 - far) * fogMix;
      if (fogMix > 0.01) {
        const grey = new THREE.Color(0xc4c9cc);
        (scene.background as THREE.Color).copy(base).lerp(grey, fogMix);
        fog.color.copy(base).lerp(grey, fogMix);
      }
      // Headlight beam: strong at night, a glow otherwise.
      const on = lights !== 'off';
      beam.intensity = on ? (dark ? (lights === 'main' ? 9 : 5) : 1.2) : 0;
      beam.distance = lights === 'main' ? 150 : 60;
      beam.angle = lights === 'main' ? 0.55 : 0.45;
      beam.target.position.set(0, lights === 'main' ? 0.4 : 0, lights === 'main' ? 40 : 20);
      if (rain) {
        const p = cam.position;
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          d[1] -= dt * 16;
          if (d[1] < 0) {
            d[1] += 16;
            d[0] = (Math.random() - 0.5) * 40;
            d[2] = (Math.random() - 0.5) * 40;
          }
          dummy.position.set(p.x + d[0], d[1], p.z + d[2]);
          dummy.updateMatrix();
          rain.setMatrixAt(i, dummy.matrix);
        }
        rain.instanceMatrix.needsUpdate = true;
      }
    },
    /** Facts the rules use. */
    state() {
      return { dark, wet: weather === 'rain', poorVisibility: this.inFog };
    },
    dispose() {
      if (rain) scene.remove(rain);
      carGroup.remove(beam, beam.target);
    }
  };
}
