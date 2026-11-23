/**
 * Optional en-GB voiceover via speechSynthesis. Subtitles are always shown,
 * so speech is best-effort: if no voice exists nothing breaks.
 * iOS requires the first `speak()` to happen inside a user gesture, so
 * `unlockSpeech()` is called from the first tap.
 */
let voice: SpeechSynthesisVoice | null = null;
let enabled = true;
let unlocked = false;

const PREFERRED = ['Serena', 'Kate', 'Martha', 'Stephanie', 'Google UK English Female', 'Microsoft Libby', 'Microsoft Sonia', 'Daniel'];

function pickVoice(): void {
  const synth = globalThis.speechSynthesis;
  if (!synth) return;
  const voices = synth.getVoices().filter((v) => v.lang?.replace('_', '-').toLowerCase().startsWith('en-gb'));
  if (!voices.length) return;
  voice = PREFERRED.map((n) => voices.find((v) => v.name.includes(n))).find(Boolean) ?? voices[0];
}

export function initSpeech(): void {
  const synth = globalThis.speechSynthesis;
  if (!synth) return;
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopSpeech();
}

export function unlockSpeech(): void {
  const synth = globalThis.speechSynthesis;
  if (!synth || unlocked) return;
  unlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

/** Strip things that read badly aloud. */
function forSpeech(text: string): string {
  return text.replace(/–|—/g, ', ').replace(/\bmph\b/g, 'miles an hour').replace(/\bMSM\b/g, 'mirror, signal, manoeuvre');
}

export function speak(text: string, onEnd?: () => void): void {
  const synth = globalThis.speechSynthesis;
  if (!synth || !enabled) {
    onEnd?.();
    return;
  }
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(forSpeech(text));
    u.lang = 'en-GB';
    if (voice) u.voice = voice;
    u.rate = 1.02;
    u.pitch = 1.05;
    if (onEnd) {
      u.onend = () => onEnd();
      u.onerror = () => onEnd();
    }
    synth.speak(u);
  } catch {
    onEnd?.();
  }
}

export function stopSpeech(): void {
  try {
    globalThis.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

export function hasEnGbVoice(): boolean {
  return !!voice;
}
