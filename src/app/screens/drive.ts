import * as THREE from 'three';
import { h, type Screen } from '../router';
import type { LessonSession, Stage } from '../session';
import { app, setSetting } from '../state';
import { goHome, next } from '../nav';
import { stageLabel, toast } from './common';
import { Renderer } from '../../engine/renderer';
import { buildScene } from '../../world/scenes';
import { inRect, speedLimitAt, wrongSideBy as wrongSideAt, laneAt, junctionBoxAt, grow, type Rect } from '../../world/layout';
import { buildPlayerCar, setLamp } from '../../world/playerCar';
import { speedRoundelSvg } from '../../world/signs';
import { signSvg } from '../../world/signSvg';
import { Car } from '../../sim/car';
import { Autopilot, type Waypoint } from '../../sim/autopilot';
import { RulesEngine } from '../../rules/RulesEngine';
import { day1Checks, angleDiff } from '../../rules/checks';
import { townChecks } from '../../rules/checks/town';
import { Traffic } from '../../sim/traffic';
import { instanced, baseBox, lambert } from '../../world/props';
import { Recorder } from '../../rules/recorder';
import { mph, type DriveEvent, type Fault, type Gear, type MirrorId, type Side, type SignalState } from '../../rules/types';
import { SpeechBubble } from '../../instructor/bubble';
import { SteeringWheel, Pedal } from '../../ui/hud/wheel';
import { sfx, engineStart, engineStop, engineUpdate } from '../../platform/audio';
import { isStandalone } from '../../platform/ios';
import { requestMotionPermission, startTilt, stopTilt, tilt } from '../../platform/motion';
import type { DriveSetup, GuidedStep, Trigger } from '../../content/schema';

type DriveMode = Extract<Stage, 'guided' | 'free' | 'test'>;

/** A step for the scripted driver used by e2e tests and screenshots. */
export type ScriptStep =
  | { act: 'belt' | 'handbrake' | 'mirror' | 'look' | 'signal' | 'gear'; arg?: string }
  | { brake: boolean }
  | { wait: number }
  | { drive: Array<[number, number, number]> }
  | { waitGap: Array<[number, number]>; secs?: number }
  | { waitFinishAsked: true }
  | { moveOff: 'left' | 'right' };

/** The driving screen used for guided, free and test drives. */
export function driveScreen(s: LessonSession, mode: DriveMode): Screen {
  const lesson = s.lesson;
  const settings = app.save.settings;
  const setup: DriveSetup = (mode === 'guided' ? lesson.guided : mode === 'free' ? lesson.free : lesson.test) ?? {};
  const town = lesson.checks === 'town';

  // ---------- DOM ----------
  const canvas = h('canvas', { class: 'gl', 'aria-label': 'Road view. Swipe left or right to look over your shoulder.' }) as HTMLCanvasElement;
  const hud = h('div', { class: 'hud' });
  const el = h('div', { class: 'screen drive', 'data-testid': `drive-${mode}` }, canvas, hud);

  const bubble = new SpeechBubble({ size: 46 });
  const wheel = new SteeringWheel();
  const accel = new Pedal('accel', 'GO', 0.22, 0.45);
  const brake = new Pedal('brake', 'BRAKE', 0.35, 1.4);

  /**
   * HUD buttons fire on touch-down, not click: on iOS a tap with one finger
   * while another finger holds a pedal often never produces a click event.
   */
  const btn = (props: Record<string, unknown>, label: string | Node, fn: () => void) => {
    const b = h('button', props, label) as HTMLButtonElement;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    });
    return b;
  };

  const mirrorBtn = (which: MirrorId, label: string, cls: string) =>
    btn({ class: `mirror-btn ${cls}`, 'data-hud': `mirror-${which}`, 'aria-label': `Check ${which} mirror` }, label, () => act.mirror(which));
  const lookBtn = (side: Side) =>
    btn({ class: 'look-btn', 'data-hud': `look-${side}`, 'aria-label': `Look over your ${side} shoulder` }, side === 'left' ? '👀↶' : '↷👀', () => act.shoulder(side));
  const mirrors = h('div', { class: 'mirrors' }, lookBtn('left'), mirrorBtn('left', 'L', 'side'), mirrorBtn('interior', 'MIRROR', 'interior'), mirrorBtn('right', 'R', 'side'), lookBtn('right'));
  const inset = h('div', { class: 'mirror-inset' });

  const speedV = h('span', { class: 'v' }, '0');
  const limitEl = h('span');
  const speedo = h('div', { class: 'speedo', 'data-testid': 'speedo' }, speedV, h('span', { class: 'u' }, 'MPH'), limitEl);

  const beltBtn = btn({ class: 'hud-btn', 'data-hud': 'belt', 'data-testid': 'hud-belt' }, '🔗 Belt', () => act.belt());
  const hbBtn = btn({ class: 'hud-btn', 'data-hud': 'handbrake', 'data-testid': 'hud-handbrake' }, 'Handbrake', () => act.handbrake());
  const gearBtns: Record<Gear, HTMLButtonElement> = { P: null!, R: null!, D: null! };
  const gearEl = h('div', { class: 'gear', 'data-hud': 'gear' });
  for (const g of ['P', 'R', 'D'] as Gear[]) {
    gearBtns[g] = btn({ 'aria-label': `Gear ${g}`, 'data-testid': `hud-gear-${g}` }, g, () => act.gear(g));
    gearEl.append(gearBtns[g]);
  }
  const lightsBtn = btn({ class: 'hud-btn', 'aria-label': 'Headlights' }, '💡', () => act.lights());
  const wipersBtn = btn({ class: 'hud-btn', 'aria-label': 'Wipers' }, '🌧', () => act.wipers());
  const hornBtn = btn({ class: 'hud-btn', 'aria-label': 'Horn' }, '📯', () => act.horn());
  const camBtn = btn({ class: 'hud-btn', 'aria-label': 'Switch camera' }, '🎥', () => act.camera());
  // Car controls on the right (next to the pedals), extras on the left.
  const trayRight = h('div', { class: 'tray tray-right' }, beltBtn, hbBtn, gearEl);
  const trayLeft = h('div', { class: 'tray tray-left' }, lightsBtn, wipersBtn, hornBtn, camBtn);

  const indL = btn({ class: 'ind', 'aria-label': 'Indicate left', 'data-testid': 'hud-ind-left' }, '◀', () => act.signal('left'));
  const indR = btn({ class: 'ind', 'aria-label': 'Indicate right', 'data-testid': 'hud-ind-right' }, '▶', () => act.signal('right'));
  const stalk = h('div', { class: 'stalk', 'data-hud': 'stalk' }, indL, indR);
  const pedals = h('div', { class: 'pedals' }, brake.el, accel.el);

  const stageTag = h('div', { class: 'stage-tag' }, `Day ${lesson.day} · ${stageLabel(mode)}`);
  const quitBtn = btn({ class: 'hud-btn', 'aria-label': 'Leave lesson' }, '✕', () => goHome());
  const topLeft = h('div', { class: 'top-left' }, quitBtn);
  if (mode === 'free') {
    let hi = 0;
    topLeft.append(
      btn({ class: 'hud-btn', 'data-testid': 'hint', 'aria-label': 'Hint' }, h('span', {}, '💡', h('span', { class: 'lbl-long' }, ' Hint')), () => {
        sfx.tap();
        const hints = lesson.free?.hints ?? [];
        if (hints.length) bubble.say(hints[hi++ % hints.length], 'happy', settings.voice);
      })
    );
  }
  if (mode !== 'test') topLeft.append(
      btn(
        { class: 'hud-btn', 'data-testid': 'drive-finish' },
        mode === 'free' ? h('span', {}, h('span', { class: 'lbl-long' }, 'Ready for test ›'), h('span', { class: 'lbl-short' }, 'Test ›')) : 'Skip ›',
        () => finishStage()
      )
    );
  topLeft.append(stageTag);
  hud.append(topLeft, mirrors, inset, speedo, trayLeft, trayRight, wheel.el, stalk, pedals, bubble.el);

  // ---------- World ----------
  const renderer = new Renderer(canvas, settings.lowPower);
  const world = buildScene(lesson.sceneId);
  const L = world.layout;
  renderer.scene.add(world.root);
  renderer.scene.background = new THREE.Color(0xbcd9ea);
  renderer.scene.fog = town ? new THREE.Fog(0xcfe0ea, 90, 340) : new THREE.Fog(0xcfe0ea, 70, 260);
  const carMesh = buildPlayerCar();
  renderer.scene.add(carMesh.group);
  const mirrorCam = new THREE.PerspectiveCamera(55, 3, 0.3, 200);

  // AI cars: one instanced mesh each for bodies, cabins and shadows.
  const AI_MAX = 24;
  const aiBox = baseBox();
  const aiBodies = instanced(aiBox, lambert(0xffffff), Array.from({ length: AI_MAX }, () => ({ x: 0, z: 0, sx: 1.8, sy: 0.62, sz: 4.2, color: 0xffffff })));
  const aiCabs = instanced(aiBox, lambert(0x2b3440), Array.from({ length: AI_MAX }, () => ({ x: 0, z: 0 })));
  const aiShadows = instanced(aiBox, new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.25, depthWrite: false }), Array.from({ length: AI_MAX }, () => ({ x: 0, z: 0 })));
  for (const m of [aiBodies, aiCabs, aiShadows]) {
    m.frustumCulled = false;
    renderer.scene.add(m);
  }
  const aiDummy = new THREE.Object3D();
  const aiColour = new THREE.Color();
  const renderTraffic = () => {
    const cars = traffic.cars.slice(0, AI_MAX);
    cars.forEach((c, i) => {
      aiDummy.rotation.set(0, c.heading, 0);
      aiDummy.position.set(c.x, 0.3, c.z);
      aiDummy.scale.set(1.8, 0.62, 4.2);
      aiDummy.updateMatrix();
      aiBodies.setMatrixAt(i, aiDummy.matrix);
      aiBodies.setColorAt(i, aiColour.setHex(c.colour));
      aiDummy.position.set(c.x, 0.92, c.z);
      aiDummy.scale.set(1.6, 0.55, 2.2);
      aiDummy.updateMatrix();
      aiCabs.setMatrixAt(i, aiDummy.matrix);
      aiDummy.position.set(c.x, 0.015, c.z);
      aiDummy.scale.set(2.2, 0.01, 4.6);
      aiDummy.updateMatrix();
      aiShadows.setMatrixAt(i, aiDummy.matrix);
    });
    for (const m of [aiBodies, aiCabs, aiShadows]) {
      m.count = cars.length;
      m.instanceMatrix.needsUpdate = true;
    }
    if (aiBodies.instanceColor) aiBodies.instanceColor.needsUpdate = true;
  };

  // ---------- Sim + rules ----------
  const car = new Car();
  const start = setup.start ?? L.start;
  car.reset(start.x, start.z, start.heading);
  car.gear = 'P';
  car.handbrake = true;
  const rules = new RulesEngine(town ? townChecks() : day1Checks(), mode === 'test' ? 'test' : 'coach');
  const recorder = new Recorder();
  const traffic = new Traffic(L, setup.traffic ?? 'none', setup.scripted ?? []);
  let t = 0;
  // Day 1 teaches the belt in the guided drive; later lessons start belted except for the test.
  let belt = mode === 'free' || (mode === 'guided' && lesson.day > 1);
  let signal: SignalState = 'off';
  let signalHeading = 0;
  let signalTurned = false;
  let lights = false;
  let wipers = false;
  let cameraMode = settings.camera;
  let stationary = true;
  let stillFor = 0;
  let mirrorUntil = 0;
  let mirrorWhich: MirrorId = 'interior';
  let lookYaw = 0;
  let lookTarget = 0;
  let lookUntil = 0;
  let blinkPhase = 0;
  let ended = false;
  let paused = false;
  let autopilot: Autopilot | null = null;
  let scriptQueue: Array<{ at: number; fn: () => void }> = [];
  const keys = new Set<string>();
  const pendingClips: Array<{ fault: Fault; at: number }> = [];

  rules.seed({ seatbelt: belt, handbrake: true });

  const emit = (ev: DriveEvent) => {
    const faults = rules.emit(ev);
    stepEvents.add(eventKey(ev));
    return faults;
  };

  rules.onFault((f) => {
    if (mode === 'test') {
      sfx.fault();
      showFaultToast(f.severity === 'minor' ? 'Driving fault noted' : f.severity === 'serious' ? 'Serious fault' : 'Dangerous fault');
      if (f.severity === 'dangerous') {
        s.clips.push({ fault: f, frames: recorder.clip(t, 8) });
        endTest(true);
      } else pendingClips.push({ fault: f, at: t + 1.5 });
    } else {
      // Coaching: Maggie mentions it kindly, without marking anything.
      sfx.fault();
      if (mode === 'free') bubble.say(f.message, 'concerned', settings.voice);
      else showFaultToast(f.category);
    }
  });

  const showFaultToast = (text: string) => {
    const tEl = h('div', { class: 'fault-toast' }, text);
    hud.append(tEl);
    setTimeout(() => tEl.remove(), 1800);
  };

  // ---------- Actions (shared by touch, keyboard and scripted tests) ----------
  const act = {
    mirror(which: MirrorId) {
      sfx.tap();
      mirrorWhich = which;
      mirrorUntil = t + 1.3;
      emit({ type: 'mirror', t, which });
    },
    shoulder(side: Side) {
      sfx.tap();
      lookTarget = side === 'right' ? -2.2 : 2.2;
      lookUntil = t + 0.9;
      emit({ type: 'shoulder', t, side });
    },
    signal(dir: Side | 'off') {
      const next: SignalState = dir === 'off' || signal === dir ? 'off' : dir;
      signal = next;
      signalHeading = car.heading;
      signalTurned = false;
      blinkPhase = 0;
      sfx.tick();
      emit({ type: 'signal', t, state: next });
      refreshHud();
    },
    belt() {
      belt = !belt;
      sfx.belt();
      emit({ type: 'seatbelt', t, on: belt });
      refreshHud();
    },
    handbrake() {
      car.handbrake = !car.handbrake;
      if (car.handbrake) handbrakeSinceStop = true;
      sfx.handbrake();
      emit({ type: 'handbrake', t, on: car.handbrake });
      refreshHud();
    },
    gear(g: Gear) {
      if (g === car.gear) return;
      if (Math.abs(car.speed) > 0.3) {
        bubble.say('Let’s stop completely before changing gear.', 'neutral', settings.voice);
        return;
      }
      if (brakeValue < 0.1 && car.gear === 'P') {
        sfx.fault();
        bubble.say('Foot on the brake first, then you can move the gear selector.', 'neutral', settings.voice);
        flash('brake');
        return;
      }
      car.gear = g;
      sfx.tap();
      emit({ type: 'gear', t, gear: g });
      refreshHud();
    },
    lights() {
      lights = !lights;
      sfx.tap();
      refreshHud();
    },
    wipers() {
      wipers = !wipers;
      sfx.tap();
      refreshHud();
    },
    horn() {
      sfx.horn();
      emit({ type: 'horn', t, speed: car.speed });
    },
    camera() {
      cameraMode = cameraMode === 'chase' ? 'cockpit' : 'chase';
      setSetting('camera', cameraMode);
      sfx.tap();
    }
  };

  let brakeValue = 0;
  const flash = (hudId: string) => {
    const e = hud.querySelector(`[data-hud="${hudId}"]`);
    e?.classList.add('hl');
    setTimeout(() => e?.classList.remove('hl'), 1500);
  };

  const refreshHud = () => {
    beltBtn.classList.toggle('on', belt);
    beltBtn.classList.toggle('warn', !belt);
    beltBtn.textContent = belt ? '🔗 Belt on' : '⚠ Belt off';
    hbBtn.classList.toggle('on', car.handbrake);
    hbBtn.textContent = car.handbrake ? 'Handbrake ON' : 'Handbrake off';
    for (const g of ['P', 'R', 'D'] as Gear[]) gearBtns[g].classList.toggle('on', car.gear === g);
    indL.classList.toggle('on', signal === 'left');
    indR.classList.toggle('on', signal === 'right');
    lightsBtn.classList.toggle('on', lights);
    wipersBtn.classList.toggle('on', wipers);
    setLamp(carMesh.headlights, lights, 0xfffbe0, 0xd8d8cc);
  };

  // ---------- Shoulder-check swipe on the road view ----------
  let swipe: { x: number; y: number; t: number; id: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => (swipe = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId }));
  canvas.addEventListener('pointerup', (e) => {
    if (!swipe || swipe.id !== e.pointerId) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && performance.now() - swipe.t < 700) act.shoulder(dx > 0 ? 'right' : 'left');
    swipe = null;
  });

  // ---------- Keyboard (desktop testing) ----------
  const keyMap: Record<string, () => void> = {
    q: () => act.signal('left'),
    e: () => act.signal('right'),
    m: () => act.mirror('interior'),
    ',': () => act.mirror('left'),
    '.': () => act.mirror('right'),
    z: () => act.shoulder('left'),
    x: () => act.shoulder('right'),
    h: () => act.handbrake(),
    b: () => act.belt(),
    p: () => act.gear('P'),
    r: () => act.gear('R'),
    d: () => act.gear('D'),
    c: () => act.camera()
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.type === 'keydown') {
      if (!keys.has(e.key)) keyMap[e.key.toLowerCase()]?.();
      keys.add(e.key);
    } else keys.delete(e.key);
    accel.set(keys.has('ArrowUp') || keys.has('w'));
    brake.set(keys.has('ArrowDown') || keys.has('s') || keys.has(' '));
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);

  // ---------- Guided steps ----------
  const steps: GuidedStep[] = mode === 'guided' ? (lesson.guided?.steps ?? []) : [];
  let stepIdx = -1;
  let stepStart = 0;
  let nudged = false;
  const stepEvents = new Set<string>();

  const eventKey = (ev: DriveEvent): string => {
    switch (ev.type) {
      case 'mirror':
        return `mirror.${ev.which}`;
      case 'shoulder':
        return `shoulder.${ev.side}`;
      case 'turn':
        return `turned.${ev.dir}`;
      default:
        return ev.type;
    }
  };

  const startStep = (i: number) => {
    stepIdx = i;
    stepStart = t;
    nudged = false;
    stepEvents.clear();
    hud.querySelectorAll('.hl').forEach((e) => e.classList.remove('hl'));
    if (i >= steps.length) {
      s.guidedCompletion = 1;
      world.setMarker(null);
      bubble.say(lesson.guided?.outro ?? 'Lovely.', 'proud', settings.voice);
      sfx.fanfare();
      setTimeout(() => finishStage(), 3500 / app.timeScale);
      return;
    }
    const st = steps[i];
    bubble.say(st.say, 'happy', settings.voice);
    if (st.highlight) hud.querySelector(`[data-hud="${st.highlight}"]`)?.classList.add('hl');
    const m = /^(?:marker|stoppedAt)\.(.+)$/.exec(st.await);
    if (m) world.setMarker(m[1]);
  };

  const triggerMet = (trig: Trigger): boolean => {
    const [kind, arg] = trig.split('.') as [string, string];
    switch (kind) {
      case 'seatbelt':
        return belt;
      case 'brake':
        return brakeValue > 0.2;
      case 'gear':
        return car.gear === arg;
      case 'handbrake':
        return arg === 'on' ? car.handbrake : !car.handbrake;
      case 'mirror':
      case 'shoulder':
      case 'turned':
        return stepEvents.has(trig);
      case 'look':
        return stepEvents.has(`shoulder.${arg}`);
      case 'speedAbove':
        return mph(car.speed) >= Number(arg);
      case 'zone': {
        const z = L.markers.find((x) => x.id === arg);
        return !!z && inRect(z, car.x, car.z);
      }
      case 'signal':
        return signal === arg;
      case 'moving':
        return car.speed > 0.9;
      case 'marker': {
        const mk = L.markers.find((x) => x.id === arg)!;
        return inRect(grow(mk, town ? 14 : 8), car.x, car.z);
      }
      case 'stoppedAt': {
        const mk = L.markers.find((x) => x.id === arg);
        return !!mk && inRect(mk, car.x, car.z) && Math.abs(car.speed) < 0.05;
      }
    }
    return false;
  };

  // ---------- Test drive flow ----------
  let nextDir = 0;
  let awaitStop: string | null = null;
  let stopFor = 0;
  let wasInside = false;
  let finishShown = false;
  let finishStoppedFor = 0;
  let finishAskedAt = -1;

  const endTest = (early: boolean) => {
    if (ended) return;
    ended = true;
    s.testEndedEarly = early;
    // Flush any clips still waiting.
    for (const p of pendingClips.splice(0)) s.clips.push({ fault: p.fault, frames: recorder.clip(p.fault.t, 8) });
    s.testFaults = [...rules.faults];
    accel.set(false);
    autopilot = null;
    const title = early ? 'I’m going to stop you there' : 'Test complete';
    const msg = early
      ? 'That was a dangerous fault, so in a real test the examiner would end it here. Don’t worry, we’ll look at exactly what happened.'
      : 'Right, that’s the end of the drive. Let’s pop in a few Highway Code questions, then I’ll give you your result.';
    bubble.say(msg, early ? 'concerned' : 'happy', settings.voice);
    const ov = h(
      'div',
      { class: 'overlay', 'data-testid': 'test-over' },
      h('div', { class: 'card' }, h('h2', {}, title), h('p', {}, msg), h('button', { class: 'btn', 'data-testid': 'to-quiz', onclick: () => finishStage() }, 'On to the quiz'))
    );
    el.append(ov);
    if (!early) sfx.good();
  };

  const finishStage = () => {
    if (mode === 'guided') s.guidedCompletion = Math.max(s.guidedCompletion, Math.max(0, stepIdx) / steps.length);
    if (mode === 'test' && !ended) {
      s.testFaults = [...rules.faults];
    }
    if (mode === 'guided' || mode === 'free') s.beltOn = belt;
    next(s);
  };

  // ---------- Main loop ----------
  let raf = 0;
  let last = performance.now();
  let fpsT = 0;
  let fpsN = 0;
  const fpsEl = app.debug ? h('div', { class: 'fps' }, '-- fps') : null;
  if (fpsEl) el.append(fpsEl);

  const tmpV = new THREE.Vector3();
  const tmpL = new THREE.Vector3();

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const real = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (fpsEl) {
      fpsT += real;
      fpsN++;
      if (fpsT > 0.5) {
        fpsEl.textContent = `${Math.round(fpsN / fpsT)} fps`;
        fpsT = fpsN = 0;
      }
    }
    if (paused) return render();
    let remaining = real * app.timeScale;
    while (remaining > 1e-6) {
      const dt = Math.min(1 / 60, remaining);
      remaining -= dt;
      simStep(dt);
    }
    render();
  };

  const simStep = (dt: number) => {
    t += dt;
    for (const sq of scriptQueue.filter((q) => q.at <= t)) sq.fn();
    scriptQueue = scriptQueue.filter((q) => q.at > t);

    // Input.
    const keySteer = keys.has('ArrowLeft') || keys.has('a') ? -1 : keys.has('ArrowRight') ? 1 : null;
    const ext = keySteer ?? (settings.tilt ? tilt() : null);
    wheel.update(dt, ext);
    let throttle = accel.update(dt);
    brakeValue = brake.update(dt);
    let steer = wheel.steer;
    if (autopilot && !ended) {
      const ap = autopilot.drive(car);
      if (ap) {
        // Scripted driver keeps a safe distance from AI cars ahead (two-second-ish gap).
        const [afx, afz] = car.forward;
        let gap = Infinity;
        for (const c of traffic.cars) {
          const dx = c.x - car.x;
          const dz = c.z - car.z;
          const along = dx * afx + dz * afz;
          const across = Math.abs(dx * afz - dz * afx);
          if (along > 0 && along < 40 && across < 2.2) gap = Math.min(gap, along - 4.2);
        }
        const safe = 3 + Math.abs(car.speed) * 1.6;
        if (gap < safe) {
          ap.throttle = 0;
          ap.brake = Math.max(ap.brake, gap < 2.5 ? 0.6 : Math.min(0.45, (safe - gap) * 0.12));
        }
        throttle = ap.throttle;
        brakeValue = ap.brake;
        steer = ap.steer;
        wheel.angle = steer * SteeringWheel.MAX;
      } else {
        if (autopilot.endsStopped) brake.set(true); // hold the car where the script stopped it
        autopilot = null;
      }
    }
    if (settings.steeringAssist) steer = assist(steer);

    const shape = { x: car.x, z: car.z, heading: car.heading, speed: car.speed, corners: car.corners() };
    if (!ended) traffic.update(dt, shape);
    const res = ended ? {} : car.step(dt, { throttle, brake: brakeValue, steer }, L, traffic.cars.length ? traffic.obstacles() : []);
    if (res.kerb !== undefined) emit({ type: 'kerb', t, speed: res.kerb });
    if (res.collision) emit({ type: 'collision', t, speed: res.collision.speed, what: res.collision.what });

    // Move-off / stop detection.
    const moving = Math.abs(car.speed) > 0.3;
    if (stationary && moving) {
      stationary = false;
      stillFor = 0;
      movedOffAt = t;
      if (car.speed > 0) emit({ type: 'moveOff', t, fromParked: !town || handbrakeSinceStop || kerbGapAtStop < 0.9 });
    } else if (!stationary) {
      stillFor = Math.abs(car.speed) < 0.05 ? stillFor + dt : 0;
      if (stillFor > 0.25) {
        stationary = true;
        handbrakeSinceStop = false;
        kerbGapAtStop = town ? pullUpInfo().kerbGap : 0;
        emit({ type: 'stop', t });
      }
    }

    // Self-cancelling indicator after a turn (like a real stalk).
    if (signal !== 'off') {
      const d = Math.abs(angleDiff(car.heading, signalHeading));
      if (d > 1.0) signalTurned = true;
      if (signalTurned && Math.abs(car.steerAngle) < 0.05 && d > 1.0) {
        signal = 'off';
        emit({ type: 'signal', t, state: 'off' });
        refreshHud();
      }
    }

    const limit = speedLimitAt(L, car.x, car.z);
    const sit = town ? situation(limit) : null;
    const wrongSideBy = sit?.passingObstruction ? null : wrongSideAt(L, car.x, car.z, car.heading);
    emit({
      type: 'tick',
      t,
      dt,
      speed: car.speed,
      accel: car.accel,
      limitMph: limit,
      heading: car.heading,
      dist: Math.abs(car.speed * dt),
      wrongSideBy: sit?.inDoubleWhite ? wrongSideAt(L, car.x, car.z, car.heading) : wrongSideBy,
      handbrake: car.handbrake,
      throttle,
      ...(sit ?? {})
    });
    if (town && !ended) {
      junctionLines();
      conflicts();
      detectTurn();
    }
    recorder.push({ t, x: car.x, z: car.z, heading: car.heading, speed: car.speed, steer, signal, brake: brakeValue });

    for (const p of pendingClips.filter((q) => q.at <= t)) s.clips.push({ fault: p.fault, frames: recorder.clip(p.fault.t, 8) });
    for (let i = pendingClips.length - 1; i >= 0; i--) if (pendingClips[i].at <= t) pendingClips.splice(i, 1);

    // Indicator blink + tick.
    if (signal !== 'off') {
      const prev = blinkPhase;
      blinkPhase = (blinkPhase + dt * 1.5) % 1;
      if (prev < 0.5 && blinkPhase >= 0.5) sfx.tock();
      if (blinkPhase < prev) sfx.tick();
    }

    // Stage logic.
    if (mode === 'guided' && stepIdx >= 0 && stepIdx < steps.length) {
      const st = steps[stepIdx];
      if (triggerMet(st.await)) {
        sfx.good();
        startStep(stepIdx + 1);
      } else if (!nudged && t - stepStart > 12) {
        nudged = true;
        bubble.say(st.nudge ?? `${st.say}`, 'neutral', settings.voice);
        if (st.highlight) flash(st.highlight);
      }
    }
    if (mode === 'test' && !ended) testLogic(dt);

    engineUpdate(Math.min(1, Math.abs(car.speed) / 14 + throttle * 0.35), throttle);
  };

  // ---------- Town situation analysis (fed to the rules each tick) ----------
  let movedOffAt = -Infinity;
  // Whether the next move-off is from a parked position (kerb or handbrake) or pulling away in traffic.
  let handbrakeSinceStop = true;
  let kerbGapAtStop = 0;
  const situation = (limit: number) => {
    const [fx, fz] = car.forward;
    const [rx, rz] = car.right;
    let passingObstruction = false;
    let clearance: number | null = null;
    for (const o of L.obstacles) {
      if (o.kind !== 'car' && o.kind !== 'van') continue;
      const ox = (o.x0 + o.x1) / 2;
      const oz = (o.z0 + o.z1) / 2;
      const dx = ox - car.x;
      const dz = oz - car.z;
      const along = dx * fx + dz * fz;
      const across = dx * rx + dz * rz; // negative = on our left
      const halfLen = Math.max(o.x1 - o.x0, o.z1 - o.z0) / 2;
      const halfWid = Math.min(o.x1 - o.x0, o.z1 - o.z0) / 2;
      if (across < 0 && across > -4.6 && along > -halfLen - 2 && along < halfLen + 9) {
        passingObstruction = true;
        if (Math.abs(along) < halfLen + 2) {
          const gap = -across - halfWid - car.width / 2;
          clearance = clearance === null ? gap : Math.min(clearance, gap);
        }
      }
    }
    const oncomingM = passingObstruction ? traffic.oncoming(car.x, car.z, car.heading) : null;
    const inDoubleWhite = (L.doubleWhite ?? []).some((r) => inRect(r, car.x, car.z));
    const inNoEntry = (L.noEntry ?? []).some((r) => inRect(r, car.x, car.z) && Math.cos(car.heading - r.into) > 0.5);
    // "Unduly slow": well under the limit, on a clear road, not near junctions, not pulling up.
    const v = mph(car.speed);
    // Clear road: no car ahead of us, going our way, within 45 m.
    let clearAhead = !traffic.cars.some((c) => {
      const dx = c.x - car.x;
      const dz = c.z - car.z;
      const along = dx * fx + dz * fz;
      const across = Math.abs(dx * rx + dz * rz);
      return along > 0 && along < 45 && across < 2.5 && Math.cos(c.heading - car.heading) > 0.5;
    });
    const nearJunction = (L.junctions ?? []).some((j) => inRect(grow(j.box, 35), car.x, car.z));
    const pullingUp = mode === 'test' && (finishShown || awaitStop !== null);
    // Parked cars nearby are a good reason to go slowly (rule 152).
    const nearParked = L.obstacles.some((o) => (o.kind === 'car' || o.kind === 'van') && Math.hypot((o.x0 + o.x1) / 2 - car.x, (o.z0 + o.z1) / 2 - car.z) < 30);
    if (passingObstruction || nearParked) clearAhead = false;
    const undulySlow = v > 1 && v < limit * 0.4 && clearAhead && !nearJunction && !pullingUp && t - movedOffAt > 12;
    return { passingObstruction, clearance, oncomingM, inDoubleWhite, inNoEntry, undulySlow };
  };

  // Crossing a give way / stop line.
  const lineState = new Map<string, { before: boolean; minSpeed: number }>();
  const junctionLines = () => {
    const [fx, fz] = car.forward;
    const front = { x: car.x + fx * 2.05, z: car.z + fz * 2.05 };
    for (const j of L.junctions ?? []) {
      const ax = Math.sin(j.approach);
      const az = Math.cos(j.approach);
      const cx = (j.line.x0 + j.line.x1) / 2;
      const cz = (j.line.z0 + j.line.z1) / 2;
      const sAlong = (front.x - cx) * ax + (front.z - cz) * az;
      const lateral = Math.abs((front.x - cx) * az - (front.z - cz) * ax);
      const halfW = Math.max(j.line.x1 - j.line.x0, j.line.z1 - j.line.z0) / 2;
      const st = lineState.get(j.id) ?? { before: false, minSpeed: Infinity };
      const aligned = Math.cos(car.heading - j.approach) > 0.5;
      if (lateral < halfW + 1.2 && aligned && sAlong < 0 && sAlong > -8) {
        st.before = true;
        st.minSpeed = Math.min(st.minSpeed, Math.abs(car.speed));
      } else if (st.before && sAlong >= 0 && lateral < halfW + 2) {
        emit({ type: 'emerge', t, junction: j.id, kind: j.kind, minSpeed: st.minSpeed });
        st.before = false;
        st.minSpeed = Infinity;
      } else if (sAlong < -8 || lateral > halfW + 4) {
        st.before = false;
        st.minSpeed = Infinity;
      }
      lineState.set(j.id, st);
    }
  };

  // Being in another car's path inside a junction box.
  const conflicts = () => {
    const [fx, fz] = car.forward;
    for (const p of [
      { x: car.x, z: car.z },
      { x: car.x + fx * 2, z: car.z + fz * 2 }
    ]) {
      const j = junctionBoxAt(L, p.x, p.z);
      if (!j) continue;
      for (const c of traffic.cars) {
        // Only cars whose path we're crossing or entering (not ones following us).
        if (Math.abs(Math.cos(c.heading - car.heading)) > 0.75 && Math.cos(c.heading - car.heading) > 0) continue;
        const cfx = Math.sin(c.heading);
        const cfz = Math.cos(c.heading);
        const dx = p.x - c.x;
        const dz = p.z - c.z;
        const along = dx * cfx + dz * cfz;
        const across = Math.abs(dx * cfz - dz * cfx);
        if (along > 0 && along < 60 && across < 1.7) {
          const ttc = Math.max(0, along - 2.1 - 2.1) / Math.max(c.cruise, 0.5);
          emit({ type: 'conflict', t, ttc, junction: j.id });
        }
      }
    }
  };

  // Completed turns (for signal and mirror checks).
  let lastTurnT = -Infinity;
  let lastTurnCheck = 0;
  const detectTurn = () => {
    if (t - lastTurnCheck < 0.2) return;
    lastTurnCheck = t;
    if (Math.abs(car.speed) < 0.5) return;
    const frames = recorder.frames.filter((f) => f.t >= Math.max(t - 9, lastTurnT));
    if (frames.length < 5) return;
    const h0 = frames[0].heading;
    const dh = angleDiff(car.heading, h0);
    if (Math.abs(dh) < 1.2) return;
    // Find where this turn actually began: go back to ~60° before the end of
    // the turn, then keep going back while the heading was still changing.
    let i = frames.length - 1;
    while (i > 0 && Math.abs(angleDiff(frames[i].heading, car.heading)) < 1.05) i--;
    while (i > 0 && Math.abs(angleDiff(frames[i].heading, frames[i - 1].heading)) > 0.02) i--;
    const startF = frames[i];
    lastTurnT = t;
    if ((L.bends ?? []).some((b) => inRect(b, startF.x, startF.z))) return; // the road bends; no signal needed
    const turnDh = angleDiff(car.heading, startF.heading);
    emit({ type: 'turn', t, dir: turnDh > 0 ? 'left' : 'right', startT: startF.t, signalAtStart: startF.signal });
  };

  /** Facts about where the car is pulled up (for "pull up on the left" tasks). */
  const pullUpInfo = () => {
    const onYellow = (L.yellow ?? []).find((y) => inRect(y, car.x, car.z))?.kind ?? null;
    const near: Rect[] = [...(L.junctions ?? []).map((j) => j.box), ...(L.noEntry ?? [])];
    let nearJunctionM: number | null = null;
    for (const r of near) {
      const dx = Math.max(r.x0 - car.x, 0, car.x - r.x1);
      const dz = Math.max(r.z0 - car.z, 0, car.z - r.z1);
      const d = Math.hypot(dx, dz) - 2.05;
      nearJunctionM = nearJunctionM === null ? d : Math.min(nearJunctionM, d);
    }
    const onDoubleWhite = (L.doubleWhite ?? []).some((r) => inRect(r, car.x, car.z));
    let kerbGap = 0;
    const lane = laneAt(L, car.x, car.z);
    if (lane) {
      const half = lane.axis === 'x' ? (lane.z1 - lane.z0) / 2 : (lane.x1 - lane.x0) / 2;
      const fx = Math.sin(car.heading);
      const fz = Math.cos(car.heading);
      const w = car.width / 2;
      if (lane.axis === 'x') kerbGap = fx > 0 ? car.z - w - (lane.centre - half) : lane.centre + half - (car.z + w);
      else kerbGap = fz > 0 ? lane.centre + half - (car.x + w) : car.x - w - (lane.centre - half);
    }
    return { onYellow, nearJunctionM, onDoubleWhite, kerbGap };
  };

  const finishEvent = (): DriveEvent => ({ type: 'finish', t, handbrake: car.handbrake, gear: car.gear, pullUp: lesson.test.pullUp ? pullUpInfo() : undefined });

  const testLogic = (dt: number) => {
    // Directions are given in order. A direction with an intermediate marker
    // ("pull up at the marker") waits for the car to stop there first.
    if (awaitStop) {
      const mk = L.markers.find((m) => m.id === awaitStop);
      const inside = !!mk && inRect(mk, car.x, car.z);
      if (inside) wasInside = true;
      stopFor = inside && Math.abs(car.speed) < 0.05 ? stopFor + dt : 0;
      if (stopFor > 0.8) awaitStop = null;
      else if (mk && wasInside && !inRect(grow(mk, 12), car.x, car.z)) {
        awaitStop = null; // drove past it; carry on with the route
        bubble.say('Not to worry, we’ll carry on.', 'neutral', settings.voice);
      }
    } else {
      const d = lesson.test.directions[nextDir];
      if (d && inRect(d.at, car.x, car.z)) {
        nextDir++;
        bubble.say(d.say, 'happy', settings.voice);
        if (d.marker) {
          world.setMarker(d.marker);
          if (d.marker === lesson.test.finishMarker) finishShown = true;
          else {
            awaitStop = d.marker;
            stopFor = 0;
            wasInside = false;
          }
        }
      }
    }
    const fm = L.markers.find((m) => m.id === lesson.test.finishMarker);
    const inFinish = finishShown && !!fm && inRect(fm, car.x, car.z) && Math.abs(car.speed) < 0.05;
    finishStoppedFor = inFinish ? finishStoppedFor + dt : 0;
    if (finishStoppedFor > 0.8 && finishAskedAt < 0) {
      finishAskedAt = t;
      bubble.say(lesson.test.finishSay, 'happy', settings.voice);
    }
    if (finishAskedAt >= 0) {
      const secured = car.handbrake && car.gear === 'P';
      if ((secured && t - finishAskedAt > 0.6) || t - finishAskedAt > 12 || (Math.abs(car.speed) > 1 && t - finishAskedAt > 2)) {
        emit(finishEvent());
        endTest(false);
      }
    }
    if (t > lesson.test.timeLimitS) {
      emit({ type: 'finish', t, handbrake: car.handbrake, gear: car.gear });
      endTest(false);
    }
  };

  /** Gentle lane-keeping: steer towards the middle of the left-hand lane. */
  const assist = (steer: number): number => {
    if (Math.abs(steer) > 0.35 || car.speed < 1) return steer;
    const lane = laneAt(L, car.x, car.z);
    if (!lane || junctionBoxAt(L, car.x, car.z)) return steer;
    const fx = Math.sin(car.heading);
    const fz = Math.cos(car.heading);
    let target: number;
    let axisHeading: number;
    let lateral: number; // positive = too far right
    if (lane.axis === 'x') {
      if (Math.abs(fx) < 0.9) return steer;
      axisHeading = fx > 0 ? Math.PI / 2 : -Math.PI / 2;
      target = lane.centre + (fx > 0 ? -1.9 : 1.9);
      lateral = fx > 0 ? car.z - target : target - car.z;
    } else {
      if (Math.abs(fz) < 0.9) return steer;
      axisHeading = fz > 0 ? 0 : Math.PI;
      target = lane.centre + (fz > 0 ? 1.9 : -1.9);
      lateral = fz > 0 ? target - car.x : car.x - target;
    }
    const err = angleDiff(car.heading, axisHeading); // positive = pointing left
    return Math.max(-1, Math.min(1, steer + err * 1.4 - lateral * 0.12));
  };

  // ---------- Rendering ----------
  const render = () => {
    const [fx, fz] = car.forward;
    const [rx, rz] = car.right;
    const g = carMesh.group;
    g.position.set(car.x, 0, car.z);
    g.rotation.y = car.heading;
    for (const p of carMesh.frontWheels) p.rotation.y = -car.steerAngle;
    for (const w of carMesh.wheels) w.rotation.x += (car.speed / 0.33) * (1 / 60);
    const blinkOn = signal !== 'off' && blinkPhase < 0.5;
    setLamp(carMesh.indicators.left, blinkOn && signal === 'left', 0xffb020, 0x6b4a12);
    setLamp(carMesh.indicators.right, blinkOn && signal === 'right', 0xffb020, 0x6b4a12);
    setLamp(carMesh.brakeLights, brakeValue > 0.05, 0xff2a2a, 0x5a1010);
    indL.classList.toggle('blink', blinkOn && signal === 'left');
    indR.classList.toggle('blink', blinkOn && signal === 'right');

    // Shoulder look easing.
    if (t > lookUntil) lookTarget = 0;
    lookYaw += (lookTarget - lookYaw) * 0.18;
    const looking = Math.abs(lookYaw) > 0.05;

    const cam = renderer.camera;
    if (cameraMode === 'cockpit' || looking) {
      // Driver sits on the right in a UK car.
      tmpV.set(car.x + rx * 0.37 - fx * 0.15, 1.22, car.z + rz * 0.37 - fz * 0.15);
      const yaw = car.heading + lookYaw;
      tmpL.set(tmpV.x + Math.sin(yaw) * 10, 1.0, tmpV.z + Math.cos(yaw) * 10);
      cam.position.copy(tmpV);
      cam.lookAt(tmpL);
      for (const o of carMesh.upper) o.visible = false;
    } else {
      for (const o of carMesh.upper) o.visible = true;
      tmpV.set(car.x - fx * 7.2, 3.1, car.z - fz * 7.2);
      cam.position.lerp(tmpV, 0.2);
      tmpL.set(car.x + fx * 5, 0.9, car.z + fz * 5);
      cam.lookAt(tmpL);
    }

    world.update(t);
    if (traffic.cars.length || aiBodies.count) renderTraffic();

    // Mirror inset.
    let insetView = null;
    if (t < mirrorUntil) {
      const w = Math.min(260, renderer.size.w * 0.32);
      const hgt = w * 0.36;
      const x = (renderer.size.w - w) / 2;
      const y = 58;
      if (mirrorWhich === 'interior') {
        mirrorCam.position.set(car.x + fx * 0.2, 1.35, car.z + fz * 0.2);
        mirrorCam.lookAt(car.x - fx * 25, 1.0, car.z - fz * 25);
      } else {
        const side = mirrorWhich === 'right' ? 1 : -1;
        mirrorCam.position.set(car.x + rx * side * 1.25 + fx * 0.8, 1.05, car.z + rz * side * 1.25 + fz * 0.8);
        mirrorCam.lookAt(car.x + rx * side * 7 - fx * 25, 0.9, car.z + rz * side * 7 - fz * 25);
      }
      insetView = { camera: mirrorCam, rect: { x, y, w, h: hgt } };
      inset.classList.add('show');
      Object.assign(inset.style, { width: `${w + 10}px`, height: `${hgt + 10}px`, top: `${y - 5}px` });
    } else inset.classList.remove('show');

    renderer.render(insetView);

    // HUD numbers.
    const v = Math.round(mph(car.speed));
    speedV.textContent = String(v);
    const lim = speedLimitAt(L, car.x, car.z);
    speedo.classList.toggle('over', v > lim);
    if (settings.speedHud) {
      if (limitEl.dataset.lim !== String(lim)) {
        limitEl.dataset.lim = String(lim);
        const zone = L.speedZones.find((z) => inRect(z, car.x, car.z));
        limitEl.innerHTML = zone?.name.includes('national') ? signSvg({ kind: 'nsl' }, 40, 'National speed limit') : speedRoundelSvg(lim, 40);
      }
    } else limitEl.innerHTML = '';
  };

  const onResize = () => renderer.resize();
  window.addEventListener('resize', onResize);

  // ---------- Scripted driving for e2e tests and screenshots ----------
  const script = {
    at(dtS: number, fn: () => void) {
      scriptQueue.push({ at: t + dtS, fn });
    },
    route(wps: Waypoint[]) {
      autopilot = new Autopilot(wps);
    }
  };

  const perfectMoveOff = (then: number) => {
    const q = (dtS: number, fn: () => void) => script.at(then + dtS, fn);
    q(0.2, () => !belt && act.belt());
    q(0.5, () => brake.set(true));
    q(1.0, () => act.gear('D'));
    q(1.4, () => car.handbrake && act.handbrake());
    q(1.8, () => act.mirror('interior'));
    q(2.2, () => act.mirror('right'));
    q(2.6, () => act.shoulder('right'));
    q(3.0, () => act.signal('right'));
    q(3.6, () => brake.set(false));
  };

  const hooks = {
    car,
    rules,
    act,
    get t() {
      return t;
    },
    get step() {
      return stepIdx;
    },
    /** Drive the guided lesson perfectly. */
    autoGuided() {
      perfectMoveOff(0);
      script.at(3.7, () => script.route([{ x: -20, z: -6.4, v: 2.6 }, { x: -2, z: -6.6, v: 2.6 }]));
      script.at(4.5, () => act.signal('off'));
      const waitPark = () => {
        if (stepIdx >= 11 && stepIdx <= 12) {
          if (stepIdx === 11) act.mirror('interior');
          if (stepIdx === 12) act.signal('left');
          script.at(0.4, waitPark);
          return;
        }
        if (stepIdx === 13) {
          script.route([{ x: 6, z: -7, v: 0 }]);
          script.at(0.4, waitPark);
          return;
        }
        if (stepIdx === 14) {
          brake.set(true);
          act.handbrake();
          script.at(0.3, () => act.gear('P'));
          script.at(0.6, () => act.signal('off'));
          script.at(0.9, () => brake.set(false));
          return;
        }
        script.at(0.4, waitPark);
      };
      script.at(5, waitPark);
    },
    /** Drive the test well (fault-free) or with chosen mistakes. */
    autoTest(opts: { skipMirrors?: boolean; hitSomething?: boolean } = {}) {
      if (opts.skipMirrors) {
        script.at(0.2, () => act.belt());
        script.at(0.5, () => brake.set(true));
        script.at(1.0, () => act.gear('D'));
        script.at(1.4, () => act.handbrake());
        script.at(1.8, () => brake.set(false));
      } else perfectMoveOff(0);
      script.at(opts.skipMirrors ? 2 : 3.7, () =>
        script.route(
          opts.hitSomething
            ? [{ x: -10, z: -6.5, v: 4 }, { x: 6, z: -14, v: 4 }]
            : [
                { x: -18, z: -6.4, v: 4 },
                { x: 0, z: -6.2, v: 4.2 },
                { x: 20, z: -3.4, v: 4.2 },
                { x: 36, z: -2.6, v: 4.2 },
                { x: 80, z: -2.6, v: 7.5 }
              ]
        )
      );
      script.at(5, () => signal !== 'off' && act.signal('off'));
      const approach = () => {
        if (car.x > 82 && !opts.hitSomething) {
          act.mirror('interior');
          script.at(0.4, () => act.signal('left'));
          script.at(0.8, () => script.route([{ x: 103, z: -2.8, v: 0 }]));
          const secure = () => {
            if (finishAskedAt >= 0) {
              brake.set(true);
              act.handbrake();
              script.at(0.3, () => act.gear('P'));
              script.at(0.5, () => act.signal('off'));
              return;
            }
            script.at(0.3, secure);
          };
          script.at(1, secure);
          return;
        }
        script.at(0.3, approach);
      };
      script.at(6, approach);
    },
    setTimeScale(k: number) {
      app.timeScale = k;
    },
    finish: () => finishStage(),
    endTest: () => {
      emit(finishEvent());
      endTest(false);
    },
    traffic,
    /** Put the car somewhere (tests and screenshots). */
    place(x: number, z: number, heading: number) {
      car.reset(x, z, heading);
    },
    get finishAsked() {
      return finishAskedAt >= 0;
    },
    /** Run a list of scripted steps through the same controls the player uses. */
    run(steps: ScriptStep[]) {
      let i = 0;
      const nextStep = (): void => {
        if (ended || i >= steps.length) return;
        const st = steps[i++];
        if ('act' in st) {
          if (st.act === 'belt') act.belt();
          else if (st.act === 'handbrake') act.handbrake();
          else if (st.act === 'mirror') act.mirror((st.arg ?? 'interior') as MirrorId);
          else if (st.act === 'look') act.shoulder((st.arg ?? 'right') as Side);
          else if (st.act === 'signal') act.signal((st.arg ?? 'off') as Side | 'off');
          else if (st.act === 'gear') act.gear((st.arg ?? 'D') as Gear);
          return script.at(0.25, nextStep);
        }
        if ('brake' in st) {
          brake.set(st.brake);
          return script.at(0.25, nextStep);
        }
        if ('wait' in st) return script.at(st.wait, nextStep);
        if ('drive' in st) {
          brake.set(false);
          script.route(st.drive.map(([x, z, v]) => ({ x, z, v })));
          const poll = () => (autopilot ? script.at(0.2, poll) : nextStep());
          return script.at(0.2, poll);
        }
        if ('waitGap' in st) {
          const need = st.secs ?? 6;
          const poll = () => {
            const gap = Math.min(...st.waitGap.map(([x, z]) => traffic.timeToReach(x, z)));
            return gap > need ? nextStep() : script.at(0.2, poll);
          };
          return poll();
        }
        if ('waitFinishAsked' in st) {
          const poll = () => (finishAskedAt >= 0 ? nextStep() : script.at(0.25, poll));
          return poll();
        }
        if ('moveOff' in st) {
          const seq: ScriptStep[] = [
            { brake: true },
            { act: 'gear', arg: 'D' },
            { act: 'handbrake' },
            { act: 'mirror', arg: 'interior' },
            { act: 'mirror', arg: st.moveOff },
            { act: 'look', arg: st.moveOff },
            { act: 'signal', arg: st.moveOff }
          ];
          if (!belt) seq.unshift({ act: 'belt' });
          if (!car.handbrake) seq.splice(seq.findIndex((x) => 'act' in x && x.act === 'handbrake'), 1);
          steps.splice(i, 0, ...seq);
          return nextStep();
        }
      };
      nextStep();
    }
  };
  (window as unknown as { __drive?: typeof hooks }).__drive = hooks;

  // ---------- Lifecycle ----------
  const maybeFullscreenTip = () => {
    const KEY = 'drive-england.fsTipSeen';
    let seen = false;
    try {
      seen = localStorage.getItem(KEY) === '1';
    } catch {
      /* ignore */
    }
    if (seen || isStandalone() || window.innerHeight >= 340 || app.e2e) return;
    const tip = h(
      'div',
      { class: 'fs-tip', role: 'note' },
      'Tip: Share → Add to Home Screen gives you full-screen driving.',
      btn({ 'aria-label': 'Dismiss tip' }, 'OK', () => {
        try {
          localStorage.setItem(KEY, '1');
        } catch {
          /* ignore */
        }
        tip.remove();
      })
    );
    hud.append(tip);
    setTimeout(() => tip.remove(), 9000);
  };

  const startDrive = () => {
    maybeFullscreenTip();
    refreshHud();
    renderer.resize();
    if (settings.lineHints && setup.hint?.length) world.setHintPath(setup.hint);
    engineStart();
    const intro = (mode === 'guided' ? lesson.guided?.intro : mode === 'free' ? lesson.free?.intro : lesson.test.intro) ?? '';
    bubble.say(intro, 'happy', settings.voice);
    if (mode === 'guided') setTimeout(() => stepIdx < 0 && startStep(0), app.e2e ? 50 : 4200);
    if (mode === 'test') {
      setTimeout(() => {
        if (!belt) flash('belt');
      }, 6000);
    }
  };

  const offerTilt = () => {
    paused = true;
    const close = () => {
      setSetting('tiltOffered', true);
      ov.remove();
      paused = false;
      startDrive();
    };
    const ov = h(
      'div',
      { class: 'overlay', 'data-testid': 'tilt-offer' },
      h(
        'div',
        { class: 'card' },
        h('h2', {}, 'Steer by tilting?'),
        h('p', {}, 'You can steer with the on-screen wheel, or by tilting your phone like a steering wheel. You can change this any time in Settings.'),
        h(
          'button',
          {
            class: 'btn',
            onclick: async () => {
              const ok = await requestMotionPermission();
              if (ok) {
                setSetting('tilt', true);
                startTilt();
              } else toast('Motion access wasn’t allowed, so we’ll use the wheel.');
              close();
            }
          },
          'Try tilt steering'
        ),
        h('button', { class: 'btn secondary', 'data-testid': 'tilt-no', onclick: close }, 'No thanks, use the wheel')
      )
    );
    el.append(ov);
  };

  return {
    el,
    landscape: true,
    onShow: () => {
      raf = requestAnimationFrame(frame);
      if (settings.tilt) startTilt();
      if (!settings.tiltOffered && !app.e2e) offerTilt();
      else startDrive();
    },
    destroy: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      engineStop();
      stopTilt();
      bubble.stop();
      renderer.dispose();
      const w = window as unknown as { __drive?: unknown };
      if (w.__drive === hooks) delete w.__drive;
    }
  };
}

