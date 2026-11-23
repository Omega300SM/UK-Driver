/**
 * Optional en-GB voiceover via speechSynthesis. Subtitles are always shown,
 * so speech is best-effort: if no voice exists nothing breaks.
 *
 * iOS Safari quirks handled here:
 * - The first speak() must happen inside a user gesture. `unlockSpeech()` is
 *   called from every tap until an utterance has actually started.
 * - Utterances can be garbage-collected before they play: keep references.
 * - cancel() immediately followed by speak() can drop the new utterance:
 *   wait a moment after cancelling.
 * - The synth can be left "paused" after the app is backgrounded: resume().
 */
let voice: SpeechSynthesisVoice | null = null;
let enabled = true;
let unlocked = false;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
const live = new Set<SpeechSynthesisUtterance>();

const PREFERRED = ['Serena', 'Kate', 'Martha', 'Stephanie', 'Google UK English Female', 'Microsoft Libby', 'Microsoft Sonia', 'Arthur', 'Daniel'];

function synth(): SpeechSynthesis | null {
  return (globalThis as { speechSynthesis?: SpeechSynthesis }).speechSynthesis ?? null;
}

function pickVoice(): void {
  const s = synth();
  if (!s) return;
  const all = s.getVoices();
  const gb = all.filter((v) => v.lang?.replace('_', '-').toLowerCase().startsWith('en-gb'));
  voice = PREFERRED.map((n) => gb.find((v) => v.name.includes(n))).find(Boolean) ?? gb[0] ?? null;
}

export function initSpeech(): void {
  const s = synth();
  if (!s) return;
  pickVoice();
  s.addEventListener?.('voiceschanged', pickVoice);
  // Voices load late on iOS; poll briefly as a fallback.
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

/** Call from inside a user gesture (tap). Safe to call repeatedly. */
export function unlockSpeech(): void {
  const s = synth();
  if (!s || unlocked) return;
  try {
    pickVoice();
    s.resume?.();
    const u = new SpeechSynthesisUtterance('.');
    u.volume = 0;
    u.rate = 2;
    u.lang = 'en-GB';
    u.onstart = () => (unlocked = true);
    u.onend = () => {
      unlocked = true;
      live.delete(u);
    };
    live.add(u);
    s.speak(u);
  } catch {
    /* ignore */
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

export function speak(text: string, onEnd?: () => void): void {
  const s = synth();
  if (!s || !enabled) {
    onEnd?.();
    return;
  }
  try {
    if (pendingTimer) clearTimeout(pendingTimer);
    const busy = s.speaking || s.pending;
    if (busy) s.cancel();
    const go = () => {
      pendingTimer = null;
      s.resume?.();
      const u = new SpeechSynthesisUtterance(forSpeech(text));
      u.lang = 'en-GB';
      if (voice) u.voice = voice;
      u.rate = 1.0;
      u.pitch = 1.05;
      u.volume = 1;
      u.onstart = () => (unlocked = true);
      u.onend = () => {
        live.delete(u);
        onEnd?.();
      };
      u.onerror = () => {
        live.delete(u);
        onEnd?.();
      };
      live.add(u);
      s.speak(u);
    };
    // Speaking synchronously keeps us inside the user gesture when there is one.
    if (busy) pendingTimer = setTimeout(go, 80);
    else go();
  } catch {
    onEnd?.();
  }
}

export function stopSpeech(): void {
  try {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = null;
    synth()?.cancel();
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
