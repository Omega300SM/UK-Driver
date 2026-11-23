import { h } from '../router';
import type { FaultClip } from '../session';
import { CAR_PARK, type Rect } from '../../world/scenes/carParkLayout';
import { rule } from '../../content/ruleRefs';
import { ruleChips } from './common';
import { maggieSvg } from '../../instructor/maggie';
import { speak } from '../../platform/speech';
import { mph } from '../../rules/types';

/**
 * "Here's what happened": a top-down 2D replay of the seconds around a fault,
 * drawn from the recorder's frames on the same layout data as the 3D world.
 */
export function openReplay(clip: FaultClip): void {
  const L = CAR_PARK;
  const cv = h('canvas', { 'data-testid': 'replay-canvas' }) as HTMLCanvasElement;
  const caption = h('div', { class: 'small-print', style: { fontWeight: '800', minHeight: '18px' } });
  const r0 = clip.fault.rules[0];
  const ref = r0 ? rule(r0) : null;
  let raf = 0;
  const close = () => {
    cancelAnimationFrame(raf);
    ov.remove();
  };
  const ov = h(
    'div',
    { class: 'overlay replay', 'data-testid': 'replay', onclick: (e: Event) => e.target === ov && close() },
    h(
      'div',
      { class: 'card scroll', style: { maxWidth: '760px', textAlign: 'left', maxHeight: '92vh' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, h('h2', { style: { fontSize: '18px' } }, 'Here’s what happened'), h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, '✕')),
      cv,
      caption,
      h('div', { class: 'bubble-wrap' }, h('div', { html: maggieSvg('neutral', 44) }), h('div', { class: 'bubble' }, h('span', { class: 'who' }, clip.fault.category), clip.fault.message)),
      ref ? h('div', { class: 'explain' }, h('b', {}, `Highway Code rule ${ref.rule}: ${ref.title}. `), ref.summary, h('div', { style: { marginTop: '6px' } }, ruleChips(clip.fault.rules))) : null,
      h('button', { class: 'btn secondary', onclick: () => (t0 = performance.now()) }, '↻ Watch again')
    )
  );
  document.body.append(ov);
  speak(clip.fault.message);

  const frames = clip.frames.length ? clip.frames : [{ t: clip.fault.t, x: L.start.x, z: L.start.z, heading: L.start.heading, speed: 0, steer: 0, signal: 'off' as const, brake: 0 }];
  // Fit the view around the path with some context.
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  for (const f of frames) {
    minX = Math.min(minX, f.x);
    maxX = Math.max(maxX, f.x);
    minZ = Math.min(minZ, f.z);
    maxZ = Math.max(maxZ, f.z);
  }
  const pad = 14;
  minX -= pad;
  maxX += pad;
  minZ -= pad;
  maxZ += pad;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let t0 = performance.now();
  const dur = Math.max(1, frames[frames.length - 1].t - frames[0].t);

  const draw = (now: number) => {
    raf = requestAnimationFrame(draw);
    const W = cv.clientWidth || 600;
    const H = cv.clientHeight || 340;
    if (cv.width !== W * dpr) {
      cv.width = W * dpr;
      cv.height = H * dpr;
    }
    const c = cv.getContext('2d')!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // World (x right, z down on screen → flip so north is up: screen y = −z).
    const sx = W / (maxX - minX);
    const sy = H / (maxZ - minZ);
    const s = Math.min(sx, sy);
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const X = (x: number) => W / 2 + (x - cx) * s;
    const Y = (z: number) => H / 2 - (z - cz) * s;
    const rect = (r: Rect, fill: string) => {
      c.fillStyle = fill;
      c.fillRect(X(r.x0), Y(r.z1), (r.x1 - r.x0) * s, (r.z1 - r.z0) * s);
    };
    c.fillStyle = '#78a656';
    c.fillRect(0, 0, W, H);
    for (const r of L.drivable) rect(r, '#50545a');
    for (const r of L.pavements) rect(r, '#b9b5aa');
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 1;
    for (const b of L.bays) {
      for (const dx of [-b.w / 2, b.w / 2]) {
        c.beginPath();
        c.moveTo(X(b.x + dx), Y(b.z - b.d / 2));
        c.lineTo(X(b.x + dx), Y(b.z + b.d / 2));
        c.stroke();
      }
    }
    c.setLineDash([3 * s, 6 * s]);
    c.beginPath();
    c.moveTo(X(34), Y(0));
    c.lineTo(X(148), Y(0));
    c.stroke();
    c.setLineDash([]);
    for (const o of L.obstacles) rect(o, o.kind === 'car' ? '#' + (o.color ?? 0x888888).toString(16).padStart(6, '0') : o.kind === 'shelter' ? '#3c7d63' : '#cfc6a8');

    // Path so far.
    const k = Math.min(1, (now - t0) / 1000 / dur);
    const tNow = frames[0].t + k * dur;
    c.strokeStyle = '#ffd23f';
    c.lineWidth = 3;
    c.beginPath();
    let cur = frames[0];
    frames.forEach((f, i) => {
      if (f.t > tNow) return;
      cur = f;
      if (i === 0) c.moveTo(X(f.x), Y(f.z));
      else c.lineTo(X(f.x), Y(f.z));
    });
    c.stroke();

    // Fault location.
    const ff = frames.reduce((a, b) => (Math.abs(b.t - clip.fault.t) < Math.abs(a.t - clip.fault.t) ? b : a), frames[0]);
    const atFault = tNow >= clip.fault.t;
    c.strokeStyle = atFault ? '#c8102e' : 'rgba(200,16,46,0.35)';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(X(ff.x), Y(ff.z), 4.5 * s, 0, Math.PI * 2);
    c.stroke();

    // Car (top-down).
    c.save();
    c.translate(X(cur.x), Y(cur.z));
    // Screen y is world −z, so a heading h maps straight onto a canvas rotation of h (front = up).
    c.rotate(cur.heading);
    c.fillStyle = '#2f8a5f';
    c.fillRect((-1.8 / 2) * s, (-4.1 / 2) * s, 1.8 * s, 4.1 * s);
    c.fillStyle = '#9fc3d6';
    c.fillRect((-1.4 / 2) * s, -1.6 * s, 1.4 * s, 1.1 * s);
    if (cur.signal !== 'off' && Math.floor(tNow * 3) % 2 === 0) {
      c.fillStyle = '#ffb020';
      const side = cur.signal === 'left' ? 1 : -1;
      c.fillRect(side * 0.9 * s - 0.25 * s, -2.05 * s, 0.5 * s, 0.5 * s);
      c.fillRect(side * 0.9 * s - 0.25 * s, 1.55 * s, 0.5 * s, 0.5 * s);
    }
    c.restore();

    caption.textContent = `${atFault ? '⚠ ' : ''}${Math.round(mph(cur.speed))} mph${cur.signal !== 'off' ? ` · signalling ${cur.signal}` : ''}${cur.brake > 0.05 ? ' · braking' : ''}`;
  };
  raf = requestAnimationFrame(draw);
}
