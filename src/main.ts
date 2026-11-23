import './ui/styles.css';
import { installIosShell } from './platform/ios';
import { initSpeech, unlockSpeech } from './platform/speech';
import { unlockAudio } from './platform/audio';
import { app, applySettings, persist } from './app/state';
import { goHome, goOnboarding, startLesson, runStage } from './app/nav';
import * as nav from './app/nav';

installIosShell();
initSpeech();
applySettings();

// iOS only allows audio/speech after a user gesture. WebKit counts touchend
// and click (not always pointerdown) as gestures, so listen to all of them, on
// every tap: unlocking is idempotent, and iOS can re-suspend audio after a call.
for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) {
  window.addEventListener(
    ev,
    () => {
      unlockAudio();
      unlockSpeech();
    },
    { capture: true, passive: true }
  );
}

if (app.save.onboarded) goHome();
else goOnboarding();

// Offline support (production builds only).
if (import.meta.env.PROD && 'serviceWorker' in navigator && !app.e2e) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {});
}

// Test hooks (enabled with ?e2e). Harmless in normal play.
if (app.e2e) {
  (window as unknown as Record<string, unknown>).__DE = {
    app,
    persist,
    startLesson,
    goHome,
    runStage,
    get session() {
      return nav.activeSession;
    },
    setNow(iso: string) {
      app.nowOverride = new Date(iso).getTime();
    }
  };
}
