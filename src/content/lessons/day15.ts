import type { LessonContent, ScriptedCar } from '../schema';
import { DV_STARTS, DV_HEADINGS } from '../../world/scenes/devonLayout';

/**
 * Day 15 — Country lanes and passing places (rules 154–156, 160). Combe Lane:
 * single track between high Devon hedgebanks, from Ashcombe to the A386.
 */
export const COMBE_ROUTE: Array<[number, number]> = [
  [800.6, -10],
  [800, 30],
  [800, 405],
  [798, 418],
  [790, 420],
  [632, 420],
  [622, 422],
  [620, 432],
  [620, 885],
  [618, 898],
  [608, 900],
  [410, 900],
  [404, 899],
  [402.2, 905],
  [401.8, 1140],
  [404.5, 1158],
  [405, 1180]
];

/** A car coming the other way down Combe Lane (guided drive: meet it near the passing place at z 270). */
const ONCOMING_A: ScriptedCar = { when: { x0: 790, x1: 810, z0: 120, z1: 160 }, from: { x: 800, z: 390, heading: DV_HEADINGS.S }, speed: 6.5, colour: 0xb8352f };
/** Test drive: a van comes down the second straight. */
const ONCOMING_C: ScriptedCar = { when: { x0: 610, x1: 630, z0: 440, z1: 470 }, from: { x: 620, z: 690, heading: DV_HEADINGS.S }, speed: 6.5, colour: 0xe8e4da };

export const day15: LessonContent = {
  day: 15,
  world: 3,
  title: 'Country lanes and passing places',
  subtitle: 'Devon: Combe Lane, from Ashcombe to the A386',
  sceneId: 'devon',
  checks: 'devon',
  rules: [154, 155, 156, 160, 124],

  briefing: [
    {
      title: 'Welcome to Devon',
      say: 'Welcome to week three. We’ve swapped town for the open road: lanes, the A road, a dual carriageway, and later the motorway to the coast. Today it’s Combe Lane, a single-track lane between high Devon hedges. Out here the national speed limit applies, sixty for a car on a road like this, but that’s a limit, not a target.',
      points: ['National speed limit: 60 mph on single carriageways', 'A limit, not a target', 'Country lanes need much lower speeds'],
      diagram: 'none',
      signs: [{ kind: 'nsl' }]
    },
    {
      title: 'See it, stop for it',
      say: 'Hedges hide what’s round the bend: a tractor, a horse, a walker. So drive at a speed where you can stop well within the distance you can see to be clear. Slow down before bends, not in them. Rule one-five-four.',
      points: ['Stop within the distance you can see (rule 154)', 'Slow down before the bend', 'Expect walkers, horses, tractors, mud'],
      diagram: 'none',
      signs: [{ kind: 'warn-bend' }]
    },
    {
      title: 'Passing places',
      say: 'A single-track road is only wide enough for one vehicle. When someone comes the other way, pull into a passing place on your left, or wait opposite one on your right, and let them by. If you’ve just passed one, you may need to reverse back to it. And never park in a passing place. Rules one-five-five and one-five-six.',
      points: ['Passing place on your left: pull in', 'On your right: wait opposite it', 'Never park in one (rule 156)'],
      diagram: 'none',
      signs: [{ kind: 'passing-place' }]
    }
  ],

  guided: {
    intro: 'We’re in Ashcombe, at the start of Combe Lane. Belt on. Let’s go.',
    parked: true,
    start: DV_STARTS.ashcombe(),
    traffic: 'light',
    scripted: [ONCOMING_A],
    hint: COMBE_ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and off we go.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. Single track: drive in the middle, at a speed where you can stop in the distance you can see.', await: 'signal.off', highlight: 'stalk' },
      { say: 'A car’s coming towards us. There’s a passing place on our left just ahead: mirror, signal left, and pull in and stop.', await: 'stoppedAt.PPA', highlight: 'brake', nudge: 'Pull into the passing place on the left and wait.' },
      { say: 'Let them come through. When they’ve gone, mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'And move off again, back into the middle.', await: 'moving', highlight: 'accel' },
      { say: 'Sharp bend ahead. Slow right down before it: you can’t see what’s round it.', await: 'zone.combe-bend1', highlight: 'brake' },
      { say: 'Lovely. Keep it steady along here.', await: 'zone.combe-c' },
      { say: 'The lane ends at the A386. We’re turning left. Mirror, signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Slow right down, look right, left and right again, and go when it’s clear.', await: 'turned.left', nudge: 'Look both ways and turn left when it’s clear.' },
      { say: 'This is the A386: national speed limit. Build your speed up smoothly. There’s a lay-by on the left soon: mirror, signal, and pull in at the marker.', await: 'stoppedAt.LB1', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Hedges, bends and a passing place: you’re a country driver now.'
  },

  free: {
    intro: 'Free drive. Practise Combe Lane: slow for the bends and use the passing places. Tap Test when you’re ready.',
    start: DV_STARTS.ashcombe(),
    parked: true,
    traffic: 'light',
    scripted: [ONCOMING_A, ONCOMING_C],
    hint: COMBE_ROUTE,
    hints: [
      'Drive so you can stop well within the distance you can see. Rule 154.',
      'Meeting someone? Passing place on your left: pull in. On your right: wait opposite. Rule 155.',
      'Slow down before bends, not in them.',
      'National speed limit is 60 here, but lanes like this need far less.',
      'Never park in a passing place. Rule 156.'
    ]
  },

  test: {
    intro: 'Test drive. We’re in Ashcombe. Move off when you’re ready, and follow Combe Lane.',
    start: DV_STARTS.ashcombe(),
    parked: true,
    traffic: 'light',
    scripted: [ONCOMING_C],
    hint: COMBE_ROUTE,
    directions: [
      { at: { x0: 795, x1: 806, z0: 20, z1: 60 }, say: 'Follow the lane all the way. It’s single track: use the passing places if you meet anyone.' },
      { at: { x0: 440, x1: 560, z0: 896, z1: 904 }, say: 'At the end of the lane, turn left onto the A386.' },
      { at: { x0: 398, x1: 405, z0: 960, z1: 1080 }, say: 'Pull into the lay-by on the left, at the marker.', marker: 'LB1' }
    ],
    finishMarker: 'LB1',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 480,
    pullUp: true
  },

  quiz: [
    {
      id: 'd15q1',
      question: 'You’re on a narrow country lane approaching a blind bend. What should you do?',
      sign: { kind: 'warn-bend' },
      options: ['Keep to the speed limit', 'Slow down so you can stop within the distance you can see to be clear', 'Sound your horn and carry on', 'Move to the middle of the road'],
      answer: 1,
      explain: 'Rule 154: reduce your speed on approaches to bends, which can be sharper than they appear, and make sure you can stop within the distance you can see to be clear.',
      rules: [154]
    },
    {
      id: 'd15q2',
      question: 'On a single-track road a car is coming towards you. The nearest passing place is on your right. What should you do?',
      sign: { kind: 'passing-place' },
      options: ['Pull into it', 'Wait opposite it so the other car can use it', 'Flash your lights', 'Reverse into a field'],
      answer: 1,
      explain: 'Rule 155: pull into a passing place on your left, or wait opposite a passing place on your right.',
      rules: [155]
    },
    {
      id: 'd15q3',
      question: 'Where must you never park on a single-track road?',
      options: ['In a passing place', 'At the side of the road in a village', 'In a lay-by', 'In a car park'],
      answer: 0,
      explain: 'Rule 156: do not park in passing places.',
      rules: [156]
    },
    {
      id: 'd15q4',
      question: 'What’s the national speed limit for a car on a single carriageway road?',
      sign: { kind: 'nsl' },
      options: ['50 mph', '60 mph', '70 mph', 'There isn’t one'],
      answer: 1,
      explain: 'The national speed limit for cars is 60 mph on single carriageways and 70 mph on dual carriageways and motorways (rule 124, speed limits table). It’s a maximum, not a target.',
      rules: [124]
    }
  ]
};
