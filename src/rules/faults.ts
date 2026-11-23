import type { Fault, Severity } from './types';

/**
 * Fault catalogue. Severities are game decisions modelled on DVSA marking
 * (see NEEDS_REVIEW.md). Messages are Maggie's words.
 */
export interface FaultDef {
  severity: Severity;
  category: string;
  message: string;
  rules: number[];
}

export const FAULTS = {
  'seatbelt-off': {
    severity: 'serious',
    category: 'Precautions – seat belt',
    message: 'We moved off without your seat belt on. That’s a legal requirement, so it’s a serious fault, I’m afraid. Belt first, always.',
    rules: [99]
  },
  'moveoff-mirrors': {
    severity: 'minor',
    category: 'Observation – moving off',
    message: 'You moved off without checking your mirrors first. A quick glance in the interior and right mirror before you go.',
    rules: [159, 161]
  },
  'moveoff-blindspot': {
    severity: 'minor',
    category: 'Observation – moving off',
    message: 'No look over your right shoulder before moving off. The blind spot is where cyclists love to hide.',
    rules: [159]
  },
  'signal-no-mirror': {
    severity: 'minor',
    category: 'Use of mirrors – signalling',
    message: 'You signalled before checking your mirror. It’s Mirror, then Signal: see what’s behind before you tell everyone your plans.',
    rules: [161]
  },
  'signal-not-cancelled': {
    severity: 'minor',
    category: 'Signals – cancel after use',
    message: 'Your indicator was left ticking away. A forgotten signal can mislead other people, so cancel it once you’re done.',
    rules: [103]
  },
  'handbrake-drive': {
    severity: 'minor',
    category: 'Control – parking brake',
    message: 'We tried to drive with the handbrake still on. I could smell it from here! Release it before moving off.',
    rules: [97]
  },
  'speed-minor': {
    severity: 'minor',
    category: 'Use of speed',
    message: 'A touch over the limit there. Keep an eye on the speedo, especially when you’re still getting the feel of the pedals.',
    rules: [126]
  },
  'speed-serious': {
    severity: 'serious',
    category: 'Use of speed',
    message: 'That was well over the limit for this area. Far too quick to stop for anyone stepping out.',
    rules: [126]
  },
  'kerb-minor': {
    severity: 'minor',
    category: 'Control – steering',
    message: 'We clipped the kerb. Not to worry, it happens to everyone. Look further ahead and make small steering movements.',
    rules: [160]
  },
  'kerb-serious': {
    severity: 'serious',
    category: 'Control – steering',
    message: 'We mounted the kerb at speed. That could have hurt someone on the pavement, so it’s a serious one.',
    rules: [160]
  },
  'collision-serious': {
    severity: 'serious',
    category: 'Control – steering',
    message: 'We gave that a little bump. Slow right down near obstacles and steer early.',
    rules: [126]
  },
  'collision-dangerous': {
    severity: 'dangerous',
    category: 'Control – collision',
    message: 'That was a proper collision, so I had to step in. Don’t worry, that’s exactly what car parks are for. Let’s look at what happened.',
    rules: [126]
  },
  'lane-position': {
    severity: 'minor',
    category: 'Positioning – normal driving',
    message: 'We drifted over the centre line. Keep to the left unless you’re passing something.',
    rules: [160]
  },
  'harsh-brake': {
    severity: 'minor',
    category: 'Control – footbrake',
    message: 'That was a bit of an emergency stop when we didn’t need one. Squeeze the brake gently and early.',
    rules: [126]
  },
  'horn-stationary': {
    severity: 'minor',
    category: 'Signals – horn',
    message: 'A toot while we were stationary. The horn is for warning others while you’re moving, not for saying hello.',
    rules: [112]
  },
  'not-secured': {
    severity: 'minor',
    category: 'Control – securing the car',
    message: 'At the end, the car wasn’t secured. Handbrake on and into Park every time you stop for more than a moment.',
    rules: [239]
  }
} satisfies Record<string, FaultDef>;

export type FaultCode = keyof typeof FAULTS;

export function makeFault(code: FaultCode, t: number): Fault {
  const d: FaultDef = FAULTS[code];
  return { code, severity: d.severity, category: d.category, message: d.message, rules: d.rules, t };
}
