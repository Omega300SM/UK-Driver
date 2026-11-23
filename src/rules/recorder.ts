import type { SignalState } from './types';

export interface Frame {
  t: number;
  x: number;
  z: number;
  heading: number;
  speed: number;
  steer: number;
  signal: SignalState;
  brake: number;
}

/** Fixed-rate ring buffer of car state, used to build "here's what happened" replays. */
export class Recorder {
  private buf: Frame[] = [];
  private lastT = -Infinity;

  constructor(
    private hz = 10,
    private seconds = 14
  ) {}

  push(f: Frame): void {
    if (f.t - this.lastT < 1 / this.hz) return;
    this.lastT = f.t;
    this.buf.push(f);
    const max = this.hz * this.seconds;
    if (this.buf.length > max) this.buf.splice(0, this.buf.length - max);
  }

  /** Frames from `before` seconds before `t` up to now. */
  clip(t: number, before = 8): Frame[] {
    return this.buf.filter((f) => f.t >= t - before).map((f) => ({ ...f }));
  }

  get frames(): readonly Frame[] {
    return this.buf;
  }
}
