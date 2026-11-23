/**
 * Optional en-GB voiceover via speechSynthesis. Subtitles are always shown,
 * so speech is best-effort: if no voice works nothing breaks.
 *
 * iOS Safari rules this module is built around:
 * 1. Speech is locked until speak() is called synchronously inside a user
 *    gesture (touchend/click). After one utterance has started, speech can
 *    be triggered from timers too.
 * 2. Never cancel and then defer: a deferred speak() runs outside the
 *    gesture and is silently dropped while speech is still locked. So we
 *    speak synchronously, and only cancel when something is really playing.
 * 3. The silent unlock utterance must not be cancelled before it starts, or
 *    the unlock never happens. Real lines queue behind it instead.
 * 4. Keep references to utterances so they aren't garbage-collected.
 * 5. A chosen voice can fail (not downloaded); fall back to the default.
 */
let voice: SpeechSynthesisVoice | null = null;
let voiceFailed = false;
let enabled = true;
let unlocked = false;
let unlockInFlight: SpeechSynthesisUtterance | null = null;
let current: SpeechSynthesisUtterance | null = null;
const live = new Set<SpeechSynthesisUtterance>();

/** Recent events, shown in Settings → Voice check. */
export const speechLog: string[] = [];
function log(msg: string): void {
  speechLog.push(`${new Date().toLocaleTimeString('en-GB')} ${msg}`);
  if (speechLog.length > 12) speechLog.shift();
}

const PREFERRED = ['Serena', 'Kate', 'Martha', 'Stephanie', 'Google UK English Female', 'Microsoft Libby', 'Microsoft Sonia', 'Arthur', 'Daniel'];

function synth(): SpeechSynthesis | null {
  return (globalThis as { speechSynthesis?: SpeechSynthesis }).speechSynthesis ?? null;
}

function gbVoices(): SpeechSynthesisVoice[] {
  return (synth()?.getVoices() ?? []).filter((v) => v.lang?.replace('_', '-').toLowerCase().startsWith('en-gb'));
}

function pickVoice(): void {
  if (voiceFailed) return;
  const gb = gbVoices();
  voice = PREFERRED.map((n) => gb.find((v) => v.name.includes(n))).find(Boolean) ?? gb.find((v) => v.localService) ?? gb[0] ?? null;
}

export function initSpeech(): void {
  const s = synth();
  if (!s) return;
  pickVoice();
  s.addEventListener?.('voiceschanged', pickVoice);
  let tries = 0;
  const iv = setInterval(() => {
    if (voice || ++tries > 20) return clearInterval(iv);
    pickVoice();
  }, 250);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') s.resume?.();
  });
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopSpeech();
}

export function isSpeechUnlocked(): boolean {
  return unlocked;
}

function track(u: SpeechSynthesisUtterance, label: string, onEnd?: () => void): void {
  live.add(u);
  u.onstart = () => {
    unlocked = true;
    log(`start: ${label}`);
  };
  u.onend = () => {
    live.delete(u);
    if (current === u) current = null;
    if (unlockInFlight === u) unlockInFlight = null;
    unlocked = true;
    onEnd?.();
  };
  u.onerror = (e) => {
    live.delete(u);
    if (current === u) current = null;
    if (unlockInFlight === u) unlockInFlight = null;
    const code = (e as SpeechSynthesisErrorEvent).error ?? 'unknown';
    // 'canceled'/'interrupted' just mean Maggie was cut off (e.g. a screen change).
    log(code === 'canceled' || code === 'interrupted' ? `stopped: ${label}` : `error: ${code} (${label})`);
    onEnd?.();
  };
}

/** Call synchronously from a tap. Safe to call on every tap. */
export function unlockSpeech(): void {
  const s = synth();
  if (!s || unlocked || unlockInFlight) return;
  try {
    s.resume?.();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    u.lang = 'en-GB';
    unlockInFlight = u;
    track(u, 'unlock');
    s.speak(u);
    log('unlock requested');
    // If the browser never reports start/end for the silent line, stop
    // treating it as in flight so Maggie's lines can interrupt each other.
    setTimeout(() => {
      if (unlockInFlight === u) unlockInFlight = null;
    }, 1500);
  } catch (e) {
    log(`unlock failed: ${String(e)}`);
  }
}

/** Strip things that read badly aloud. */
function forSpeech(text: string): string {
  return text
    .replace(/–|—/g, ', ')
    .replace(/\bmph\b/g, 'miles an hour')
    .replace(/\bMSM\b/g, 'mirror, signal, manoeuvre')
    .replace(/[“”]/g, '');
}

function makeUtterance(text: string, useVoice: boolean): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(forSpeech(text));
  u.lang = 'en-GB';
  if (useVoice && voice) u.voice = voice;
  u.rate = 1.0;
  u.pitch = 1.05;
  u.volume = 1;
  return u;
}

export function speak(text: string, onEnd?: () => void, opts: { defaultVoice?: boolean } = {}): void {
  const s = synth();
  if (!s || !enabled) {
    onEnd?.();
    return;
  }
  try {
    s.resume?.();
    // Interrupt Maggie's previous line, but never while the unlock utterance
    // is still queued: cancel() would kill it and speech would stay locked.
    if (current && !unlockInFlight && (s.speaking || s.pending)) s.cancel();
    const useVoice = !opts.defaultVoice && !voiceFailed;
    const u = makeUtterance(text, useVoice);
    let started = false;
    track(u, text.slice(0, 24), onEnd);
    const prevStart = u.onstart;
    u.onstart = (ev) => {
      started = true;
      prevStart?.call(u, ev);
    };
    const prevErr = u.onerror;
    u.onerror = (ev) => {
      prevErr?.call(u, ev);
      // A chosen voice that isn't installed fails: retry once with the default.
      const code = (ev as SpeechSynthesisErrorEvent).error;
      if (useVoice && voice && code !== 'interrupted' && code !== 'canceled') {
        voiceFailed = true;
        voice = null;
        log('falling back to the default voice');
        speak(text, undefined, { defaultVoice: true });
      }
    };
    current = u;
    s.speak(u);
    // Watchdog: if nothing started (dropped by the browser), retry once.
    setTimeout(() => {
      if (!started && current === u && !s.speaking && !s.pending && unlocked) {
        log('retrying dropped line');
        const r = makeUtterance(text, false);
        track(r, 'retry');
        current = r;
        s.speak(r);
      }
    }, 900);
  } catch (e) {
    log(`speak failed: ${String(e)}`);
    onEnd?.();
  }
}

export function stopSpeech(): void {
  try {
    const s = synth();
    // Only cancel Maggie's own lines, only if something is playing, and never
    // while the unlock utterance is queued.
    if (s && current && !unlockInFlight && (s.speaking || s.pending)) s.cancel();
    current = null;
  } catch {
    /* ignore */
  }
}

export function hasEnGbVoice(): boolean {
  return !!voice;
}

export function voiceName(): string | null {
  return voice?.name ?? null;
}

export function speechSupported(): boolean {
  return !!synth();
}

/** Snapshot for the Settings voice check. */
export function speechStatus(): Record<string, string> {
  const s = synth();
  if (!s) return { 'Speech support': 'No' };
  const all = s.getVoices();
  return {
    'Speech support': 'Yes',
    'Voices on this device': String(all.length),
    'English (UK) voices': gbVoices().map((v) => v.name).join(', ') || 'none found',
    'Maggie’s voice': voice ? voice.name : voiceFailed ? 'device default (chosen voice failed)' : 'device default',
    Unlocked: unlocked ? 'yes' : 'not yet (tap anything)',
    State: `${s.speaking ? 'speaking' : 'idle'}${s.pending ? ', queued' : ''}${s.paused ? ', paused' : ''}`
  };
}
