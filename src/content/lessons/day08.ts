import type { LessonContent } from '../schema';
import { MT_STARTS, R1, M1, rbArc, route } from '../../world/scenes/millTownLayout';

/**
 * Day 8 — Roundabouts I: going round clockwise, giving way to the right, and
 * signalling (rules 184–186, 188). Mill Town: the Mill Road roundabout (R1)
 * and the Canal Street mini-roundabout (M1).
 */
const GUIDED_ROUTE = route(
  [
    [2.4, -88],
    [1.9, -60]
  ],
  rbArc(R1, 'S', 'W'),
  [
    [-140, 1.9],
    [-145.5, 3],
    [-148.1, 8],
    [-148.1, 170],
    [-146.5, 176.5],
    [-140, 178.1],
    [-12, 178.1]
  ],
  rbArc(M1, 'W', 'S'),
  [[-1.9, 150]],
  rbArc(R1, 'N', 'S'),
  [
    [-1.9, -70],
    [-2.65, -86]
  ]
);

const TEST_ROUTE = route(
  [
    [-118, -2.4],
    [-40, -1.9]
  ],
  rbArc(R1, 'W', 'N'),
  [[1.9, 160]],
  rbArc(M1, 'S', 'W'),
  [
    [-140, 181.9],
    [-148, 181],
    [-151.9, 174],
    [-151.9, 8],
    [-150.5, 1],
    [-146, -1.9],
    [-40, -1.9]
  ],
  rbArc(R1, 'W', 'E'),
  [
    [60, -1.9],
    [82, -2.65]
  ]
);

export const day08: LessonContent = {
  day: 8,
  world: 2,
  title: 'Roundabouts I',
  subtitle: 'Mill Town: the Mill Road roundabout and a mini-roundabout',
  sceneId: 'millTown',
  checks: 'millTown',
  rules: [184, 185, 186, 188],

  briefing: [
    {
      title: 'Welcome to Mill Town',
      say: 'Right then, new town, new challenge. Mill Town has roundabouts, and lots of people find them scary. They needn’t be. Today we’ll learn the three things that matter: which way you go round, who you give way to, and how you signal. By the end of the week you’ll be gliding round them.',
      points: ['Go round clockwise, island on your right', 'Give way to traffic from your right', 'Signal so others know your exit'],
      diagram: 'none',
      signs: [{ kind: 'warn-roundabout' }, { kind: 'mini-roundabout' }]
    },
    {
      title: 'Give way to the right',
      say: 'Approaching a roundabout: mirrors, decide your exit early, signal, and slow down. At the line, give priority to traffic coming from your right. Look right, and go when there’s a safe gap. Rule one-eight-five. Don’t forget to look ahead too, in case the car in front hasn’t gone.',
      points: ['Decide your exit early (rule 184)', 'Look right: traffic from the right goes first (rule 185)', 'Look ahead before you go'],
      diagram: 'roundabout-giveway'
    },
    {
      title: 'Signals: left, ahead, right',
      say: 'First exit: signal left on the approach and keep it on. Going straight on: usually no signal on the approach, then signal left once you’ve passed the exit before yours. Going right: signal right on the approach, stay on the inside, then signal left after the exit before yours. That’s rule one-eight-six.',
      points: ['Left: signal left all the way', 'Ahead: no signal, then left to leave', 'Right: signal right, then left to leave'],
      diagram: 'roundabout-signals'
    },
    {
      title: 'Mini-roundabouts',
      say: 'A mini-roundabout is just a painted circle, but the same rules apply, and you MUST drive round the painting, not over it. Rule one-eight-eight. There’s less room and less time, so slow right down and signal early.',
      points: ['Same rules, smaller space', 'MUST pass round the painted centre (rule 188)', 'Slow down, signal early'],
      diagram: 'none',
      signs: [{ kind: 'mini-roundabout' }]
    }
  ],

  guided: {
    intro: 'We’re parked on Station Road, facing the Mill Road roundabout. Belt’s on. Let’s move off.',
    parked: true,
    start: MT_STARTS.stationNorth(-90),
    traffic: 'light',
    hint: GUIDED_ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and off we go.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. At the roundabout we want the third exit, right, to the town centre. Mirror first.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Signal right, and keep to the right of our lane.', await: 'signal.right', highlight: 'stalk' },
      { say: 'Slow down for the give way line.', await: 'zone.r1-approach-s', highlight: 'brake' },
      { say: 'Look right. Anything coming round? Wait for a gap.', await: 'look.right', highlight: 'look-right' },
      { say: 'When it’s clear, go. Keep the island on your right.', await: 'rbEnter.R1', nudge: 'Go when nothing is coming from your right.' },
      { say: 'Past the first exit, past the second… now signal left.', await: 'signal.left', highlight: 'stalk', nudge: 'Signal left after you pass the exit before ours.' },
      { say: 'And leave at this exit.', await: 'rbExit.R1' },
      { say: 'Lovely! Take the next road on the left, the Ringway. Mirror and signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Slow down and turn in.', await: 'turned.left', nudge: 'Slow right down and turn left into the Ringway.' },
      { say: 'Follow the road round. A mini-roundabout ahead: we’ll take the first exit, left. Signal left early.', await: 'zone.m1-approach-e', nudge: 'Follow the Ringway to the mini-roundabout.' },
      { say: 'Signal left, and look right.', await: 'look.right', highlight: 'look-right' },
      { say: 'Round the painted circle, not over it.', await: 'rbExit.M1' },
      { say: 'Back to the big roundabout, straight on this time: second exit. No signal on the approach.', await: 'zone.r1-approach-n' },
      { say: 'Look right, and go when it’s clear.', await: 'rbEnter.R1', highlight: 'look-right' },
      { say: 'Past the first exit: signal left now.', await: 'signal.left', highlight: 'stalk' },
      { say: 'And off we go, onto Station Road.', await: 'rbExit.R1' },
      { say: 'Pull up on the left at the marker. Mirror, signal.', await: 'stoppedAt.ST1', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Three roundabouts, three different exits, and all the right signals. See? Nothing to be scared of.'
  },

  free: {
    intro: 'Have a go on your own. Try different exits on the big roundabout and the mini. Tap the Test button when you’re ready.',
    start: MT_STARTS.stationNorth(-90),
    parked: true,
    traffic: 'light',
    hint: GUIDED_ROUTE,
    hints: [
      'Give priority to traffic from your right. Rule 185.',
      'First exit: signal left. Right: signal right. Ahead: no signal, then left to leave. Rule 186.',
      'Signal left after passing the exit before the one you want.',
      'On a mini-roundabout, go round the painted centre, never over it. Rule 188.',
      'Decide your exit early: the map sign before the roundabout shows where each exit goes.'
    ]
  },

  test: {
    intro: 'Test drive. We’re on Mill Road. Move off when it’s safe, and follow the road ahead to the roundabout.',
    start: MT_STARTS.millEast(-120),
    parked: true,
    traffic: 'light',
    hint: TEST_ROUTE,
    directions: [
      { at: { x0: -110, x1: -70, z0: -4, z1: 4 }, say: 'At the roundabout, take the third exit: Canal Street.' },
      { at: { x0: -4, x1: 4, z0: 60, z1: 130 }, say: 'At the mini-roundabout, take the second exit.' },
      { at: { x0: -156, x1: -144, z0: 30, z1: 120 }, say: 'At the end of the road, turn right.' },
      { at: { x0: -120, x1: -60, z0: -4, z1: 0 }, say: 'At the roundabout, follow the road ahead: second exit. Then pull up on the left at the marker.', marker: 'MR1' }
    ],
    finishMarker: 'MR1',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 480,
    pullUp: true
  },

  quiz: [
    {
      id: 'd8q1',
      question: 'When you reach a roundabout, who should you normally give priority to?',
      sign: { kind: 'warn-roundabout' },
      options: ['Traffic approaching from your left', 'Traffic approaching from your right', 'Whoever arrives first', 'Large vehicles only'],
      answer: 1,
      explain: 'Rule 185: give priority to traffic approaching from your right, unless signs, road markings or traffic lights say otherwise.',
      rules: [185]
    },
    {
      id: 'd8q2',
      question: 'You’re taking the first exit, to the left. What should you do?',
      options: ['Signal right on approach', 'No signal at all', 'Signal left on approach, keep left, and keep signalling left to leave', 'Signal left only as you leave'],
      answer: 2,
      explain: 'Rule 186: for the first exit, signal left and approach in the left-hand lane, keep to the left on the roundabout and continue signalling left to leave.',
      rules: [186]
    },
    {
      id: 'd8q3',
      question: 'You’re going straight on at a roundabout (an intermediate exit). When should you signal left?',
      options: ['On the approach', 'After passing the exit before the one you want', 'Only if there’s traffic behind', 'Never'],
      answer: 1,
      explain: 'Rule 186: for intermediate exits you should not normally need to signal on approach; signal left after you have passed the exit before the one you want.',
      rules: [186]
    },
    {
      id: 'd8q4',
      question: 'What MUST you do at a mini-roundabout?',
      sign: { kind: 'mini-roundabout' },
      options: ['Drive straight over the painted centre if it’s quicker', 'Pass round the central markings', 'Always stop', 'Give way to traffic from the left'],
      answer: 1,
      explain: 'Rule 188: all vehicles MUST pass round the central markings, except large vehicles physically incapable of doing so.',
      rules: [188]
    }
  ]
};
