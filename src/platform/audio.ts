/**
 * All sounds are synthesised with Web Audio, so there are no audio files to
 * download or cache. The context must be created/resumed from a user gesture
 * on iOS: call `unlockAudio()` from a tap handler.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

let engineOsc: OscillatorNode | null = null;
let engineOsc2: OscillatorNode | null = null;
let engineGain: GainNode | null = null;
let engineFilter: BiquadFilterNode | null = null;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (master) master.gain.value = on ? 0.6 : 0;
}

/**
 * iOS treats web audio as "ambient" by default, so the ring/silent switch
 * mutes it. Safari 16.4+ lets a page ask for "playback" instead, which plays
 * like a video or music app would. Older iOS ignores this harmlessly.
 */
function preferPlaybackSession(): void {
  try {
    const nav = navigator as unknown as { audioSession?: { type: string } };
    if (nav.audioSession && nav.audioSession.type !== 'playback') nav.audioSession.type = 'playback';
  } catch {
    /* not supported */
  }
}

export function unlockAudio(): void {
  preferPlaybackSession();
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? 0.6 : 0;
      master.connect(ctx.destination);
      // A silent blip fully unlocks iOS output.
      const b = ctx.createBuffer(1, 1, 22050);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(master);
      s.start(0);
    }
    // iOS can also leave the context 'interrupted' after a call or backgrounding.
    if (ctx.state !== 'running') void ctx.resume();
  } catch {
    /* audio is optional */
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, when = 0, slideTo?: number): void {
  if (!ctx || !master || !enabled) return;
  const t0 = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  tap: () => tone(660, 0.06, 'triangle', 0.15),
  tick: () => tone(1800, 0.025, 'square', 0.08),
  tock: () => tone(1300, 0.025, 'square', 0.06),
  good: () => {
    tone(784, 0.12, 'triangle', 0.25);
    tone(1175, 0.18, 'triangle', 0.22, 0.09);
  },
  fault: () => tone(330, 0.25, 'sine', 0.18, 0, 260),
  star: (i: number) => tone(880 * Math.pow(1.26, i), 0.25, 'triangle', 0.25),
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.22, i * 0.11));
  },
  pop: () => tone(500, 0.08, 'sine', 0.2, 0, 900),
  horn: () => {
    tone(420, 0.35, 'square', 0.12);
    tone(530, 0.35, 'square', 0.1);
  },
  handbrake: () => {
    for (let i = 0; i < 5; i++) tone(2200 - i * 120, 0.02, 'square', 0.05, i * 0.03);
  },
  belt: () => {
    tone(1500, 0.03, 'square', 0.1);
    tone(900, 0.05, 'square', 0.1, 0.05);
  }
};

/** Continuous engine hum. `rpm01` in 0..1. */
export function engineStart(): void {
  if (!ctx || !master || engineOsc) return;
  engineOsc = ctx.createOscillator();
  engineOsc2 = ctx.createOscillator();
  engineGain = ctx.createGain();
  engineFilter = ctx.createBiquadFilter();
  engineOsc.type = 'sawtooth';
  engineOsc2.type = 'square';
  engineFilter.type = 'lowpass';
  engineFilter.frequency.value = 300;
  engineGain.gain.value = 0.0;
  engineOsc.connect(engineFilter);
  engineOsc2.connect(engineFilter);
  engineFilter.connect(engineGain).connect(master);
  engineOsc.start();
  engineOsc2.start();
}

export function engineUpdate(rpm01: number, load: number): void {
  if (!ctx || !engineOsc || !engineOsc2 || !engineGain || !engineFilter) return;
  const t = ctx.currentTime;
  const f = 38 + rpm01 * 95;
  engineOsc.frequency.setTargetAtTime(f, t, 0.08);
  engineOsc2.frequency.setTargetAtTime(f * 0.5, t, 0.08);
  engineFilter.frequency.setTargetAtTime(220 + rpm01 * 700 + load * 300, t, 0.1);
  engineGain.gain.setTargetAtTime(enabled ? 0.05 + load * 0.05 : 0, t, 0.1);
}

export function engineStop(): void {
  try {
    engineOsc?.stop();
    engineOsc2?.stop();
  } catch {
    /* already stopped */
  }
  engineOsc = engineOsc2 = null;
  engineGain = null;
  engineFilter = null;
}
