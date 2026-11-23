/**
 * Touch steering wheel. Drag round the rim to turn; it self-centres when let
 * go (like a real wheel's caster effect, but quicker so thumbs can rest).
 */
export class SteeringWheel {
  readonly el: HTMLElement;
  /** Degrees, −MAX..MAX. Positive = clockwise = right. */
  angle = 0;
  held = false;
  static readonly MAX = 150;
  private svg: SVGSVGElement;
  private lastA = 0;
  private pid: number | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'wheel';
    this.el.dataset.hud = 'wheel';
    this.el.setAttribute('aria-label', 'Steering wheel: drag round to steer');
    this.el.innerHTML = `<svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="44" fill="none" stroke="#1b1f23" stroke-width="10"/>
      <circle cx="50" cy="50" r="44" fill="none" stroke="#3a4148" stroke-width="4"/>
      <path d="M8 50 L36 50 M64 50 L92 50 M50 64 L50 92" stroke="#1b1f23" stroke-width="9" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="15" fill="#22272c" stroke="#3a4148" stroke-width="2"/>
      <rect x="46" y="4" width="8" height="10" rx="2" fill="#ffd23f"/>
    </svg>`;
    this.svg = this.el.querySelector('svg')!;
    this.el.addEventListener('pointerdown', this.down);
    this.el.addEventListener('pointermove', this.move);
    this.el.addEventListener('pointerup', this.up);
    this.el.addEventListener('pointercancel', this.up);
  }

  private pointerAngle(e: PointerEvent): number {
    const r = this.el.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  }

  private down = (e: PointerEvent) => {
    e.preventDefault();
    this.el.setPointerCapture(e.pointerId);
    this.pid = e.pointerId;
    this.held = true;
    this.lastA = this.pointerAngle(e);
  };

  private move = (e: PointerEvent) => {
    if (!this.held || e.pointerId !== this.pid) return;
    const a = this.pointerAngle(e);
    let d = a - this.lastA;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    this.lastA = a;
    this.angle = Math.max(-SteeringWheel.MAX, Math.min(SteeringWheel.MAX, this.angle + d * 1.15));
  };

  private up = (e: PointerEvent) => {
    if (e.pointerId !== this.pid) return;
    this.held = false;
    this.pid = null;
  };

  /** Call every frame. `external` (tilt/keyboard) drives the wheel when not held. */
  update(dt: number, external: number | null): void {
    if (!this.held) {
      if (external !== null) this.angle += (external * SteeringWheel.MAX - this.angle) * Math.min(1, dt * 8);
      else this.angle *= Math.exp(-dt * 3.2);
      if (Math.abs(this.angle) < 0.3) this.angle = 0;
    }
    this.svg.style.transform = `rotate(${this.angle}deg)`;
  }

  get steer(): number {
    return this.angle / SteeringWheel.MAX;
  }
}

/** A hold-to-press pedal whose pressure ramps up the longer it is held. */
export class Pedal {
  readonly el: HTMLElement;
  held = false;
  heldFor = 0;
  private ids = new Set<number>();

  constructor(
    cls: string,
    label: string,
    private base: number,
    private rate: number
  ) {
    this.el = document.createElement('button');
    this.el.className = `pedal ${cls}`;
    this.el.textContent = label;
    this.el.dataset.hud = cls === 'accel' ? 'accel' : 'brake';
    this.el.setAttribute('aria-label', label);
    const on = (e: PointerEvent) => {
      e.preventDefault();
      this.el.setPointerCapture(e.pointerId);
      this.ids.add(e.pointerId);
      this.held = true;
      this.el.classList.add('down');
    };
    const off = (e: PointerEvent) => {
      this.ids.delete(e.pointerId);
      if (this.ids.size === 0) {
        this.held = false;
        this.el.classList.remove('down');
      }
    };
    this.el.addEventListener('pointerdown', on);
    this.el.addEventListener('pointerup', off);
    this.el.addEventListener('pointercancel', off);
  }

  /** Programmatic press (keyboard / scripted tests). */
  set(on: boolean): void {
    this.held = on;
    this.el.classList.toggle('down', on);
  }

  update(dt: number): number {
    this.heldFor = this.held ? this.heldFor + dt : 0;
    return this.held ? Math.min(1, this.base + this.heldFor * this.rate) : 0;
  }
}
