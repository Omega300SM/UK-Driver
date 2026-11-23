import { loadSave, writeSave } from '../platform/storage';
import { setVoiceEnabled } from '../platform/speech';
import { setSoundEnabled } from '../platform/audio';
import type { SaveData, Settings } from '../scoring/progress';

/** Single in-memory copy of the save, persisted on every change. */
export const app = {
  save: loadSave() as SaveData,
  /** Test hooks speed up the sim; never set in normal play. */
  timeScale: 1,
  e2e: new URLSearchParams(location.search).has('e2e'),
  debug: new URLSearchParams(location.search).has('debug'),
  /** Override "now" for tests (ms since epoch). */
  nowOverride: null as number | null
};

export function now(): Date {
  return new Date(app.nowOverride ?? Date.now());
}

export function persist(): void {
  writeSave(app.save);
}

export function setSetting<K extends keyof Settings>(k: K, v: Settings[K]): void {
  app.save.settings[k] = v;
  applySettings();
  persist();
}

export function applySettings(): void {
  setVoiceEnabled(app.save.settings.voice);
  setSoundEnabled(app.save.settings.sound);
}
