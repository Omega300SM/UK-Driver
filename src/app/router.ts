import { stopSpeech } from '../platform/speech';

export interface Screen {
  el: HTMLElement;
  /** Needs landscape (drive screens). */
  landscape?: boolean;
  destroy?: () => void;
  onShow?: () => void;
}

let current: Screen | null = null;

export function show(screen: Screen): void {
  const root = document.getElementById('app')!;
  stopSpeech();
  current?.destroy?.();
  root.replaceChildren(screen.el);
  document.body.classList.toggle('needs-landscape', !!screen.landscape);
  current = screen;
  screen.onShow?.();
}

/** Tiny hyperscript helper to keep screens readable. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...children: Array<Node | string | null | undefined | false>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}
