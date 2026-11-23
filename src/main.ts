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

// iOS only allows audio/speech after a user gesture: unlock on the first touch anywhere.
const firstGesture = () => {
  unlockAudio();
  unlockSpeech();
  window.removeEventListener('pointerdown', firstGesture, true);
};
window.addEventListener('pointerdown', firstGesture, true);

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
