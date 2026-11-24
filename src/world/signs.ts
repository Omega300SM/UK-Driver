import * as THREE from 'three';
import { signAspect, signSvg, type SignSpec } from './signSvg';

/**
 * Original procedural road signs drawn on small canvases. They follow UK
 * sign conventions (shape and colour) without copying any artwork:
 * circles give orders, triangles warn, rectangles inform.
 */
const cache = new Map<string, THREE.Texture>();

function canvasTexture(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): THREE.Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d')!;
  draw(c);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  cache.set(key, tex);
  return tex;
}

/** Red-ringed speed limit roundel. */
export function speedRoundel(mph: number): THREE.Texture {
  return canvasTexture(`limit-${mph}`, 128, 128, (c) => {
    c.clearRect(0, 0, 128, 128);
    c.fillStyle = '#d4202b';
    c.beginPath();
    c.arc(64, 64, 62, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(64, 64, 47, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#111';
    c.font = 'bold 54px "Arial Narrow", Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(mph), 64, 68);
  });
}

/** Rectangular information panel (e.g. "Church Lane" street name plate). */
export function namePlate(text: string, opts: { bg?: string; fg?: string; border?: string } = {}): THREE.Texture {
  const { bg = '#ffffff', fg = '#111111', border = '#111111' } = opts;
  return canvasTexture(`plate-${text}-${bg}`, 256, 64, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, 256, 64);
    c.strokeStyle = border;
    c.lineWidth = 6;
    c.strokeRect(5, 5, 246, 54);
    c.fillStyle = fg;
    c.font = 'bold 30px Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 128, 34);
  });
}

/** Building fascia sign. */
export function fascia(text: string, bg = '#1f6f4a'): THREE.Texture {
  return canvasTexture(`fascia-${text}`, 512, 64, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, 512, 64);
    c.fillStyle = '#fff';
    c.font = 'bold 34px Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 256, 34);
  });
}

/** Red-on-white learner "L" plate. */
export function lPlate(): THREE.Texture {
  return canvasTexture('lplate', 64, 64, (c) => {
    c.fillStyle = '#fff';
    c.fillRect(0, 0, 64, 64);
    c.fillStyle = '#d4202b';
    c.fillRect(18, 10, 10, 44);
    c.fillRect(18, 44, 30, 10);
  });
}

/** SVG markup for HUD/briefing use (same conventions, crisp at any size). */
export function speedRoundelSvg(mph: number, size = 56): string {
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-label="${mph} miles per hour limit" role="img">
  <circle cx="50" cy="50" r="48" fill="#d4202b"/><circle cx="50" cy="50" r="37" fill="#fff"/>
  <text x="50" y="52" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="40" text-anchor="middle" dominant-baseline="middle" fill="#111">${mph}</text></svg>`;
}

/**
 * Texture for any procedural sign. The SVG is rasterised asynchronously
 * (Safari can draw SVG images into a canvas); the texture updates when ready.
 * `back` gives a plain grey silhouette for the rear of the sign.
 */
export function signTexture(spec: SignSpec, back = false): THREE.Texture {
  const key = `svg-${spec.kind}-${spec.value ?? ''}-${spec.text ?? ''}-${spec.map ? JSON.stringify(spec.map) : ''}-${back}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const ar = signAspect(spec.kind);
  const h = spec.kind === 'name' ? 96 : 192;
  const w = Math.round(h * ar);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  cache.set(key, tex);
  const img = new Image();
  img.onload = () => {
    const c = cv.getContext('2d');
    if (!c) return;
    c.clearRect(0, 0, w, h);
    c.drawImage(img, 0, 0, w, h);
    if (back) {
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = '#8d959c';
      c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'source-over';
    }
    tex.needsUpdate = true;
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(signSvg(spec, h))}`;
  return tex;
}
