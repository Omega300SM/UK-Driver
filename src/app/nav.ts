import { show } from './router';
import { LessonSession } from './session';
import { getLesson } from '../content/curriculum';
import { onboardingScreen } from './screens/onboarding';
import { homeScreen } from './screens/home';
import { settingsScreen } from './screens/settings';
import { briefingScreen } from './screens/briefing';
import { drillScreen } from './screens/drill';
import { driveScreen } from './screens/drive';
import { quizScreen } from './screens/quiz';
import { debriefScreen } from './screens/debrief';

export let activeSession: LessonSession | null = null;

export function goOnboarding(): void {
  show(onboardingScreen());
}

export function goHome(): void {
  activeSession = null;
  show(homeScreen());
}

export function goSettings(back: () => void = goHome): void {
  show(settingsScreen(back));
}

export function startLesson(day: number): void {
  const lesson = getLesson(day);
  if (!lesson) return;
  activeSession = new LessonSession(lesson);
  runStage(activeSession);
}

export function runStage(s: LessonSession): void {
  activeSession = s;
  switch (s.stage) {
    case 'briefing':
      return show(briefingScreen(s));
    case 'drill':
      return show(drillScreen(s));
    case 'guided':
    case 'free':
    case 'test':
      return show(driveScreen(s, s.stage));
    case 'quiz':
      return show(quizScreen(s));
    case 'debrief':
      return show(debriefScreen(s));
  }
}

export function next(s: LessonSession): void {
  s.advance();
  runStage(s);
}
