/**
 * Optional tilt steering. On iOS 13+ DeviceMotionEvent.requestPermission()
 * MUST be called from a tap handler; we never call it otherwise.
 */
type PermissionFn = () => Promise<'granted' | 'denied'>;

export async function requestMotionPermission(): Promise<boolean> {
  const DME = globalThis.DeviceMotionEvent as unknown as { requestPermission?: PermissionFn } | undefined;
  if (!DME) return false;
  if (typeof DME.requestPermission === 'function') {
    try {
      return (await DME.requestPermission()) === 'granted';
    } catch {
      return false;
    }
  }
  return true; // Android/desktop: no permission step
}

let tiltValue = 0;
let listening = false;

function onMotion(e: DeviceMotionEvent): void {
  const g = e.accelerationIncludingGravity;
  if (!g || g.y == null) return;
  // In landscape the phone's y axis runs across the screen, like a steering wheel.
  const angle = (screen.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 90) as number;
  const sign = angle === 90 ? 1 : angle === -90 || angle === 270 ? -1 : 0;
  const raw = (sign * g.y) / 4.5; // ~27° of tilt = full lock
  tiltValue = Math.max(-1, Math.min(1, raw));
}

export function startTilt(): void {
  if (listening) return;
  listening = true;
  window.addEventListener('devicemotion', onMotion);
}

export function stopTilt(): void {
  listening = false;
  tiltValue = 0;
  window.removeEventListener('devicemotion', onMotion);
}

/** −1 (full left) .. +1 (full right). */
export function tilt(): number {
  return tiltValue;
}
