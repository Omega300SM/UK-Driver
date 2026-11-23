import { maggieSvg, type Mood } from './maggie';
import { speak, stopSpeech } from '../platform/speech';

/**
 * Maggie's speech bubble. Subtitles are always on; voice is optional.
 * `say()` replaces the current line immediately (live driving instructions
 * must never queue up behind old ones).
 */
export class SpeechBubble {
  readonly el: HTMLElement;
  private face: HTMLElement;
  private text: HTMLElement;
  private current = '';

  constructor(opts: { size?: number; mood?: Mood } = {}) {
    this.el = document.createElement('div');
    this.el.className = 'bubble-wrap';
    this.face = document.createElement('div');
    this.face.innerHTML = maggieSvg(opts.mood ?? 'happy', opts.size ?? 56);
    const b = document.createElement('div');
    b.className = 'bubble';
    b.setAttribute('role', 'status');
    b.setAttribute('aria-live', 'polite');
    b.innerHTML = '<span class="who">Maggie</span><span class="txt"></span>';
    this.text = b.querySelector('.txt')!;
    this.el.append(this.face, b);
  }

  say(line: string, mood: Mood = 'happy', voice = true, onDone?: () => void): void {
    if (line === this.current && !onDone) return;
    this.current = line;
    this.text.textContent = line;
    this.face.innerHTML = maggieSvg(mood, Number(this.face.querySelector('svg')?.getAttribute('width') ?? 56));
    const b = this.text.parentElement!;
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
    if (voice) speak(line, onDone);
    else onDone?.();
  }

  get line(): string {
    return this.current;
  }

  stop(): void {
    stopSpeech();
  }
}
