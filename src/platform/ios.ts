/**
 * iOS Safari shell fixes: no pinch/double-tap zoom, no rubber-banding, and a
 * helper for orientation. Safe-area padding is done in CSS with env().
 */
export function installIosShell(): void {
  // Pinch zoom (Safari ignores user-scalable=no since iOS 10).
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  }
  // Double-tap zoom.
  let lastTouch = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      const target = e.target as HTMLElement | null;
      const isField = target?.closest('input, textarea, select');
      if (now - lastTouch < 350 && !isField) e.preventDefault();
      lastTouch = now;
    },
    { passive: false }
  );
  // Rubber-banding: only allow touchmove inside explicitly scrollable areas.
  document.addEventListener(
    'touchmove',
    (e) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest('.scroll')) e.preventDefault();
    },
    { passive: false }
  );
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  setVh();
  window.addEventListener('resize', setVh);
}

export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight;
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
