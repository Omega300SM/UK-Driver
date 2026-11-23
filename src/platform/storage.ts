import { DEFAULT_SETTINGS, newSave, type SaveData } from '../scoring/progress';

export const SAVE_KEY = 'drive-england.save';

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

function defaultKV(): KV | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // Safari private mode or blocked storage
  }
}

/** Parse and migrate saved data. Unknown or corrupt data falls back to a fresh save. */
export function parseSave(raw: string | null): SaveData {
  if (!raw) return newSave();
  try {
    const data = JSON.parse(raw) as Partial<SaveData>;
    if (data.version !== 1) return newSave();
    const base = newSave();
    return {
      ...base,
      ...data,
      settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
      streak: { ...base.streak, ...(data.streak ?? {}) },
      days: data.days ?? {},
      badges: data.badges ?? []
    } as SaveData;
  } catch {
    return newSave();
  }
}

export function loadSave(kv: KV | null = defaultKV()): SaveData {
  try {
    return parseSave(kv?.getItem(SAVE_KEY) ?? null);
  } catch {
    return newSave();
  }
}

export function writeSave(data: SaveData, kv: KV | null = defaultKV()): void {
  try {
    kv?.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked: the game still works, it just won't remember */
  }
}

export function resetSave(kv: KV | null = defaultKV()): void {
  try {
    kv?.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
