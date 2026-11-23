import * as THREE from 'three';
import { h, type Screen } from '../router';
import type { LessonSession, Stage } from '../session';
import { app, setSetting } from '../state';
import { goHome, next } from '../nav';
import { stageLabel, toast } from './common';
import { Renderer } from '../../engine/renderer';
import { buildCarPark } from '../../world/scenes/carPark';
import { inRect, markerAt, speedLimitAt } from '../../world/scenes/carParkLayout';
import { buildPlayerCar, setLamp } from '../../world/playerCar';
import { speedRoundelSvg } from '../../world/signs';
import { Car } from '../../sim/car';
import { Autopilot, type Waypoint } from '../../sim/autopilot';
import { RulesEngine } from '../../rules/RulesEngine';
import { day1Checks, angleDiff } from '../../rules/checks';
import { Recorder } from '../../rules/recorder';
import { mph, type DriveEvent, type Fault, type Gear, type MirrorId, type Side, type SignalState } from '../../rules/types';
import { SpeechBubble } from '../../instructor/bubble';
import { SteeringWheel, Pedal } from '../../ui/hud/wheel';
import { sfx, engineStart, engineStop, engineUpdate } from '../../platform/audio';
import { requestMotionPermission, startTilt, stopTilt, tilt } from '../../platform/motion';
import type { GuidedStep, Trigger } from '../../content/schema';

type DriveMode = Extract<Stage, 'guided' | 'free' | 'test'>;

const HINT_PATHS: Record<DriveMode, Array<[number, number]>> = {
  guided: [
    [-30, -7.2],
    [-14, -6.2],
    [6, -7]
  ],
  free: [],
  test: [
    [-30, -7.2],
    [0, -6.5],
    [22, -3],
    [40, -2.6],
    [104, -2.8]
  ]
};

/** The driving screen used for guided, free and test drives. */
export function driveScreen(s: LessonSession, mode: DriveMode): Screen {
  const lesson = s.lesson;
  const settings = app.save.settings;

  // ---------- DOM ----------
  const canvas = h('canvas', { class: 'gl', 'aria-label': 'Road view. Swipe left or right to look over your shoulder.' }) as HTMLCanvasElement;
  const hud = h('div', { class: 'hud' });
  const el = h('div', { class: 'screen drive', 'data-testid': `drive-${mode}` }, canvas, hud);

  const bubble = new SpeechBubble({ size: 46 });
  const wheel = new SteeringWheel();
  const accel = new Pedal('accel', 'GO', 0.22, 0.45);
  const brake = new Pedal('brake', 'BRAKE', 0.35, 1.4);

  const mirrorBtn = (which: MirrorId, label: string, cls: string) =>
    h('button', { class: `mirror-btn ${cls}`, 'data-hud': `mirror-${which}`, 'aria-label': `Check ${which} mirror`, onclick: () => act.mirror(which) }, label);
  const lookBtn = (side: Side) =>
    h('button', { class: 'look-btn', 'data-hud': `look-${side}`, 'aria-label': `Look over your ${side} shoulder`, onclick: () => act.shoulder(side) }, side === 'left' ? '👀↶' : '↷👀');
  const mirrors = h('div', { class: 'mirrors' }, lookBtn('left'), mirrorBtn('left', 'L', 'side'), mirrorBtn('interior', 'MIRROR', 'interior'), mirrorBtn('right', 'R', 'side'), lookBtn('right'));
  const inset = h('div', { class: 'mirror-inset' });

  const speedV = h('span', { class: 'v' }, '0');
  const limitEl = h('span');
  const speedo = h('div', { class: 'speedo', 'data-testid': 'speedo' }, speedV, h('span', { class: 'u' }, 'MPH'), limitEl);

  const beltBtn = h('button', { class: 'hud-btn', 'data-hud': 'belt', onclick: () => act.belt() }, '🔗 Belt');
  const hbBtn = h('button', { class: 'hud-btn', 'data-hud': 'handbrake', onclick: () => act.handbrake() }, '(P) Handbrake');
  const gearBtns: Record<Gear, HTMLButtonElement> = { P: null!, R: null!, D: null! };
  const gearEl = h('div', { class: 'gear', 'data-hud': 'gear' });
  for (const g of ['P', 'R', 'D'] as Gear[]) {
    gearBtns[g] = h('button', { 'aria-label': `Gear ${g}`, onclick: () => act.gear(g) }, g) as HTMLButtonElement;
    gearEl.append(gearBtns[g]);
  }
  const lightsBtn = h('button', { class: 'hud-btn', 'aria-label': 'Headlights', onclick: () => act.lights() }, '💡');
  const wipersBtn = h('button', { class: 'hud-btn', 'aria-label': 'Wipers', onclick: () => act.wipers() }, '🌧');
  const hornBtn = h('button', { class: 'hud-btn', 'aria-label': 'Horn', onclick: () => act.horn() }, '📯');
  const camBtn = h('button', { class: 'hud-btn', 'aria-label': 'Switch camera', onclick: () => act.camera() }, '🎥');
  const tray = h('div', { class: 'tray' }, h('div', { class: 'tray-row' }, beltBtn, hbBtn), h('div', { class: 'tray-row' }, gearEl), h('div', { class: 'tray-row' }, lightsBtn, wipersBtn, hornBtn, camBtn));

  const indL = h('button', { class: 'ind', 'aria-label': 'Indicate left', onclick: () => act.signal('left') }, '◀');
  const indR = h('button', { class: 'ind', 'aria-label': 'Indicate right', onclick: () => act.signal('right') }, '▶');
  const stalk = h('div', { class: 'stalk', 'data-hud': 'stalk' }, h('div', { class: 'row' }, indL, indR));
  const pedals = h('div', { class: 'pedals' }, brake.el, accel.el);

  const stageTag = h('div', { class: 'stage-tag' }, `Day ${lesson.day} · ${stageLabel(mode)}`);
  const quitBtn = h('button', { class: 'hud-btn', 'aria-label': 'Leave lesson', onclick: () => goHome() }, '✕');
  const topLeft = h('div', { class: 'top-left' }, h('div', { class: 'tray-row' }, quitBtn, stageTag));
  hud.append(topLeft, mirrors, inset, speedo, tray, wheel.el, stalk, pedals, bubble.el);

  const actions = h('div', { class: 'tray-row' });
  topLeft.append(actions);
  if (mode === 'free') {
    let hi = 0;
    actions.append(
      h(
        'button',
        {
          class: 'hud-btn',
          'data-testid': 'hint',
          onclick: () => {
            sfx.tap();
            bubble.say(lesson.free.hints[hi++ % lesson.free.hints.length], 'happy', settings.voice);
          }
        },
        '💡 Hint'
      )
    );
  }
  if (mode !== 'test') {
    actions.append(h('button', { class: 'hud-btn', 'data-testid': 'drive-finish', onclick: () => finishStage() }, mode === 'free' ? 'Ready for my test ›' : 'Skip ›'));
  }

  // ---------- World ----------
  const renderer = new Renderer(canvas, settings.lowPower);
  const world = buildCarPark();
  const L = world.layout;
  renderer.scene.add(world.root);
  renderer.scene.background = new THREE.Color(0xbcd9ea);
  renderer.scene.fog = new THREE.Fog(0xcfe0ea, 70, 260);
  const carMesh = buildPlayerCar();
  renderer.scene.add(carMesh.group);
  const mirrorCam = new THREE.PerspectiveCamera(55, 3, 0.3, 200);

  // ---------- Sim + rules ----------
  const car = new Car();
  car.reset(L.start.x, L.start.z, L.start.heading);
  car.gear = 'P';
  car.handbrake = true;
  const rules = new RulesEngine(day1Checks(), mode === 'test' ? 'test' : 'coach');
  const recorder = new Recorder();
  let t = 0;
  let belt = mode === 'guided' ? false : mode === 'free';
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
    hbBtn.textContent = car.handbrake ? '(P) Handbrake on' : 'Handbrake off';
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
  const steps: GuidedStep[] = mode === 'guided' ? lesson.guided.steps : [];
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
      bubble.say(lesson.guided.outro, 'proud', settings.voice);
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
        return stepEvents.has(trig);
      case 'signal':
        return signal === arg;
      case 'moving':
        return car.speed > 0.9;
      case 'marker': {
        const mk = L.markers.find((x) => x.id === arg)!;
        return inRect({ x0: mk.x0 - 10, x1: mk.x1 + 4, z0: mk.z0 - 6, z1: mk.z1 + 6 }, car.x, car.z);
      }
      case 'stoppedAt':
        return markerAt(L, car.x, car.z) === arg && Math.abs(car.speed) < 0.05;
    }
    return false;
  };

  // ---------- Test drive flow ----------
  const directionsGiven = new Set<number>();
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

    const res = ended ? {} : car.step(dt, { throttle, brake: brakeValue, steer }, L);
    if (res.kerb !== undefined) emit({ type: 'kerb', t, speed: res.kerb });
    if (res.collision) emit({ type: 'collision', t, speed: res.collision.speed, what: res.collision.what });

    // Move-off / stop detection.
    const moving = Math.abs(car.speed) > 0.3;
    if (stationary && moving) {
      stationary = false;
      stillFor = 0;
      if (car.speed > 0) emit({ type: 'moveOff', t });
    } else if (!stationary) {
      stillFor = Math.abs(car.speed) < 0.05 ? stillFor + dt : 0;
      if (stillFor > 0.25) {
        stationary = true;
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
    let wrongSideBy: number | null = null;
    for (const lane of L.lanes) {
      if (inRect(lane, car.x, car.z)) {
        const east = Math.cos(car.heading - Math.PI / 2) > 0.5;
        const west = Math.cos(car.heading + Math.PI / 2) > 0.5;
        if (east) wrongSideBy = car.z - lane.centre;
        else if (west) wrongSideBy = lane.centre - car.z;
      }
    }
    emit({ type: 'tick', t, dt, speed: car.speed, accel: car.accel, limitMph: limit, heading: car.heading, dist: Math.abs(car.speed * dt), wrongSideBy, handbrake: car.handbrake, throttle });
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

  const testLogic = (dt: number) => {
    lesson.test.directions.forEach((d, i) => {
      if (!directionsGiven.has(i) && car.x > d.atX) {
        directionsGiven.add(i);
        bubble.say(d.say, 'happy', settings.voice);
        if (i === lesson.test.directions.length - 1) world.setMarker(lesson.test.finishMarker);
      }
    });
    const inFinish = markerAt(L, car.x, car.z) === lesson.test.finishMarker && Math.abs(car.speed) < 0.05;
    finishStoppedFor = inFinish ? finishStoppedFor + dt : 0;
    if (finishStoppedFor > 0.8 && finishAskedAt < 0) {
      finishAskedAt = t;
      bubble.say(lesson.test.finishSay, 'happy', settings.voice);
    }
    if (finishAskedAt >= 0) {
      const secured = car.handbrake && car.gear === 'P';
      if ((secured && t - finishAskedAt > 0.6) || t - finishAskedAt > 12 || (Math.abs(car.speed) > 1 && t - finishAskedAt > 2)) {
        emit({ type: 'finish', t, handbrake: car.handbrake, gear: car.gear });
        endTest(false);
      }
    }
    if (t > lesson.test.timeLimitS) {
      emit({ type: 'finish', t, handbrake: car.handbrake, gear: car.gear });
      endTest(false);
    }
  };

  const assist = (steer: number): number => {
    if (Math.abs(steer) > 0.35 || car.speed < 1) return steer;
    for (const lane of L.lanes) {
      if (!inRect(lane, car.x, car.z)) continue;
      const east = Math.cos(car.heading - Math.PI / 2) > 0.7;
      if (!east) return steer;
      const err = angleDiff(car.heading, Math.PI / 2);
      return Math.max(-1, Math.min(1, steer + err * 1.4 + (car.z - -2.6) * -0.12));
    }
    return steer;
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
    } else {
      tmpV.set(car.x - fx * 7.2, 3.1, car.z - fz * 7.2);
      cam.position.lerp(tmpV, 0.2);
      tmpL.set(car.x + fx * 5, 0.9, car.z + fz * 5);
      cam.lookAt(tmpL);
    }

    world.update(t);

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
        mirrorCam.position.set(car.x + rx * side * 1.05 + fx * 0.8, 1.05, car.z + rz * side * 1.05 + fz * 0.8);
        mirrorCam.lookAt(car.x + rx * side * 3.5 - fx * 25, 0.9, car.z + rz * side * 3.5 - fz * 25);
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
        limitEl.innerHTML = speedRoundelSvg(lim, 40);
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
      emit({ type: 'finish', t, handbrake: car.handbrake, gear: car.gear });
      endTest(false);
    }
  };
  (window as unknown as { __drive?: typeof hooks }).__drive = hooks;

  // ---------- Lifecycle ----------
  const startDrive = () => {
    refreshHud();
    renderer.resize();
    if (settings.lineHints && HINT_PATHS[mode].length) world.setHintPath(HINT_PATHS[mode]);
    engineStart();
    const intro = mode === 'guided' ? lesson.guided.intro : mode === 'free' ? lesson.free.intro : lesson.test.intro;
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

