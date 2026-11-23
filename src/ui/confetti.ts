const COLOURS = ['#ffd23f', '#2f8a5f', '#c8102e', '#2e5c8a', '#ffffff', '#f2a71b'];

/** Lightweight canvas confetti burst; removes itself when done. */
export function confetti(durationMs = 2200, count = 120): void {
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const c = cv.getContext('2d');
  if (!c) return cv.remove();
  c.scale(dpr, dpr);
  const parts = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 9,
    vy: -6 - Math.random() * 8,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    col: COLOURS[Math.floor(Math.random() * COLOURS.length)]
  }));
  const t0 = performance.now();
  const frame = (t: number) => {
    const k = (t - t0) / durationMs;
    c.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      c.save();
      c.globalAlpha = Math.max(0, 1 - k * k);
      c.translate(p.x, p.y);
      c.rotate(p.r);
      c.fillStyle = p.col;
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      c.restore();
    }
    if (k < 1) requestAnimationFrame(frame);
    else cv.remove();
  };
  requestAnimationFrame(frame);
}
