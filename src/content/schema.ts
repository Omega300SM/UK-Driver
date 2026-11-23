import type { Rect, SignKind } from '../world/layout';

/**
 * Content schema. Lessons, quizzes and rule references are pure data so they
 * can be reviewed and updated without touching the engine.
 */

export type WorldId = 1 | 2 | 3 | 4;

/** A Highway Code rule reference, verified against gov.uk (see NEEDS_REVIEW.md). */
export interface RuleRef {
  rule: number;
  title: string;
  /** Faithful one-line paraphrase. Words in capitals mirror the Code's MUST / MUST NOT. */
  summary: string;
  url: string;
}


/** Inline SVG diagram ids drawn by `src/ui/diagrams.ts`. */
export type DiagramId =
  | 'dsssm'
  | 'pedals'
  | 'mirrors'
  | 'msm'
  | 'moveoff'
  | 'normal-stop'
  | 'road-position'
  | 'meeting'
  | 'speed-limits'
  | 'sign-shapes'
  | 'road-lines'
  | 'yellow-lines'
  | 'giveway-stop'
  | 'emerging'
  | 'turn-right'
  | 'boss'
  | 'none';

/** A road sign drawn from the procedural sign set. */
export interface SignRef {
  kind: SignKind;
  value?: number;
  caption?: string;
}

export interface BriefingSlide {
  title: string;
  /** What Maggie says (also shown as subtitles). */
  say: string;
  /** Short bullet points shown on the slide. */
  points: string[];
  diagram: DiagramId;
  /** Signs shown alongside (or instead of) the diagram. */
  signs?: SignRef[];
}

/**
 * A trigger the guided drive waits for. The lesson runner resolves these
 * against live car/control state.
 */
export type Trigger =
  | 'seatbelt.on'
  | 'brake.held'
  | 'gear.D'
  | 'gear.P'
  | 'handbrake.off'
  | 'handbrake.on'
  | 'mirror.interior'
  | 'mirror.left'
  | 'mirror.right'
  | 'shoulder.right'
  | 'shoulder.left'
  | 'signal.right'
  | 'signal.left'
  | 'signal.off'
  | 'moving'
  | 'look.right'
  | 'look.left'
  | 'turned.left'
  | 'turned.right'
  | `speedAbove.${number}`
  | `zone.${string}`
  | `marker.${string}`
  | `stoppedAt.${string}`;

export interface GuidedStep {
  say: string;
  await: Trigger;
  /** Shown if the player hasn't done it after a while. */
  nudge?: string;
  /** Pointer to highlight a HUD control (data-hud id). */
  highlight?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  /** Optional sign shown with the question. */
  sign?: SignRef;
  options: string[];
  answer: number;
  explain: string;
  rules: number[];
}

export interface DrillItem {
  id: 'doors' | 'seat' | 'steering' | 'seatbelt' | 'mirrors';
  label: string;
  say: string;
  done: string;
}

export interface TestDirection {
  /** Given when the car first enters this area. */
  at: Rect;
  say: string;
  /** Show this marker from now on (e.g. where to pull up). */
  marker?: string;
}

export type TrafficLevel = 'none' | 'light' | 'busy';

/** A one-off AI car released when the player reaches an area (e.g. to meet them in a narrow street). */
export interface ScriptedCar {
  when: Rect;
  from: { x: number; z: number; heading: number };
  speed: number;
  /** Stop and wait here if the way ahead is blocked by the player. */
  colour?: number;
}

export interface DriveSetup {
  start?: { x: number; z: number; heading: number };
  traffic?: TrafficLevel;
  scripted?: ScriptedCar[];
  /** Green route-hint dashes. */
  hint?: Array<[number, number]>;
  /** Start parked at the kerb with belt off, handbrake on, in P (true), or ready to go. */
  parked?: boolean;
}

export interface LessonContent {
  day: number;
  world: WorldId;
  title: string;
  subtitle: string;
  sceneId: 'carPark' | 'town';
  /** Which rule set marks the drives. */
  checks: 'carPark' | 'town';
  boss?: boolean;
  briefing: BriefingSlide[];
  drill?: { intro: string; items: DrillItem[]; outro: string };
  guided?: { intro: string; steps: GuidedStep[]; outro: string } & DriveSetup;
  free?: { intro: string; hints: string[] } & DriveSetup;
  test: {
    intro: string;
    directions: TestDirection[];
    /** Marker id the candidate must stop at to finish. */
    finishMarker: string;
    finishSay: string;
    timeLimitS: number;
    /** Judge where they pulled up (yellow lines, near junctions). */
    pullUp?: boolean;
  } & DriveSetup;
  quiz: QuizQuestion[];
  /** Rules this lesson cites; used in briefing and debrief. */
  rules: number[];
  badge?: string;
}

export interface CurriculumDay {
  day: number;
  world: WorldId;
  title: string;
  boss?: boolean;
  /** True when the lesson content exists in this build. */
  available: boolean;
}

export interface WorldInfo {
  id: WorldId;
  name: string;
  tagline: string;
  /** Pin on the stylised England map (viewBox 0 0 200 270). */
  pin: { x: number; y: number };
  place: string;
}
