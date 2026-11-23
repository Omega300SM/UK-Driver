import type { LessonContent } from '../content/schema';
import type { Fault } from '../rules/types';
import type { Frame } from '../rules/recorder';

export type Stage = 'briefing' | 'drill' | 'guided' | 'free' | 'test' | 'quiz' | 'debrief';

export interface FaultClip {
  fault: Fault;
  frames: Frame[];
}

/** One run through a lesson. Lives only in memory; results go to the save. */
export class LessonSession {
  stages: Stage[];
  index = 0;
  guidedCompletion = 0;
  testFaults: Fault[] = [];
  clips: FaultClip[] = [];
  testEndedEarly = false;
  quizCorrect = 0;
  quizTotal = 0;
  /** Seat belt carries over from the drill into the guided drive. */
  beltOn = false;

  constructor(readonly lesson: LessonContent) {
    this.stages = [
      'briefing',
      ...(lesson.drill ? (['drill'] as Stage[]) : []),
      ...(lesson.guided ? (['guided'] as Stage[]) : []),
      ...(lesson.free ? (['free'] as Stage[]) : []),
      'test',
      'quiz',
      'debrief'
    ];
    // Boss levels have no guided drive; they don't lose marks for it.
    if (!lesson.guided) this.guidedCompletion = 1;
  }

  get stage(): Stage {
    return this.stages[this.index];
  }

  advance(): Stage {
    this.index = Math.min(this.index + 1, this.stages.length - 1);
    return this.stage;
  }

  jump(stage: Stage): void {
    const i = this.stages.indexOf(stage);
    if (i >= 0) this.index = i;
  }

  /** Retry the test (and quiz) without redoing the briefing. */
  resetForRetest(): void {
    this.testFaults = [];
    this.clips = [];
    this.testEndedEarly = false;
    this.quizCorrect = 0;
    this.quizTotal = 0;
    this.jump('test');
  }
}
