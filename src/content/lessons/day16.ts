import type { LessonContent, ScriptedCar } from '../schema';
import { DV_STARTS, DV_HEADINGS, CX, AH } from '../../world/scenes/devonLayout';

/**
 * Day 16 — Stopping distances and weather (rules 126, 226, 227, 235). The
 * A386 in the rain, a bank of fog, and a controlled stop.
 */
const L1 = CX + AH / 2;
const ROUTE: Array<[number, number]> = [
  [L1, 1000],
  [L1, 2140],
  [404.5, 2158],
  [405, 2185]
];

/** A car ahead on the A386, doing about 45 mph. */
const LEADER: ScriptedCar = { when: { x0: CX, x1: CX + AH + 3, z0: 990, z1: 1080 }, from: { x: L1, z: 1150, heading: DV_HEADINGS.N }, speed: 20, colour: 0x2e5c8a };

export const day16: LessonContent = {
  day: 16,
  world: 3,
  title: 'Stopping distances and weather',
  subtitle: 'Devon: the A386 in the rain, with fog on the moor',
  sceneId: 'devon',
  checks: 'devon',
  rules: [126, 227, 226, 235, 115],

  briefing: [
    {
      title: 'Stopping distances',
      say: 'Your stopping distance is your thinking distance plus your braking distance, and it grows fast with speed. At thirty, about twenty-three metres. At sixty, about seventy-three. At seventy, around ninety-six: that’s twenty-four car lengths. Drive so you can always stop in the distance you can see to be clear. Rule one-two-six.',
      points: ['Thinking + braking distance', '30 mph ≈ 23 m, 60 mph ≈ 73 m, 70 mph ≈ 96 m', 'Stop within the distance you can see'],
      diagram: 'stopping-distances'
    },
    {
      title: 'The two-second rule',
      say: 'On fast roads, leave at least a two-second gap to the vehicle in front. Watch it pass a sign or a post, then say: only a fool breaks the two-second rule. If you reach the post before you finish, you’re too close. Rule one-two-six.',
      points: ['At least two seconds on fast roads', '“Only a fool breaks the two-second rule”', 'Tailgating is dangerous and intimidating'],
      diagram: 'two-second'
    },
    {
      title: 'Rain and fog',
      say: 'In the wet, stopping distances at least double, so double the gap: four seconds or more. Wipers on, and dipped headlights so others see you. In fog, you MUST use headlights when you can’t see more than about a hundred metres. Slow down, keep well back, and be able to stop within the distance you can see. Rules two-two-six, two-two-seven and two-three-five.',
      points: ['Wet: at least double the gap (rule 227)', 'Fog under 100 m: headlights on, a MUST (rule 226)', 'Slow down before the fog, not in it'],
      diagram: 'none'
    }
  ],

  guided: {
    intro: 'We’re on the A386, and it’s raining. Wipers and lights first, then off we go.',
    parked: true,
    start: DV_STARTS.a386North(1000),
    traffic: 'light',
    scripted: [LEADER],
    conditions: { weather: 'rain', fogPatches: true },
    hint: ROUTE,
    steps: [
      { say: 'It’s raining: wipers on, please.', await: 'wipers.on', highlight: 'wipers' },
      { say: 'And dipped headlights, so others can see us.', await: 'lights.dipped', highlight: 'lights' },
      { say: 'Brake, D, handbrake off. Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off when it’s clear.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal and build up speed. See the car ahead? In the wet, keep at least four seconds behind it.', await: 'zone.a386-rain' },
      { say: 'Count it: watch it pass a post, then “only a fool breaks the two-second rule”, twice over. Drop back if you need to.', await: 'zone.fog1', nudge: 'Keep a four-second gap in the wet.' },
      { say: 'Fog! Ease off, and keep those headlights on. Can you stop within the distance you can see?', await: 'zone.es-zone', highlight: 'brake' },
      { say: 'Out of the fog. In a moment I’ll ask you to stop, as if someone stepped out. When I say stop, brake firmly.', await: 'speedAbove.25' },
      { say: 'Stop!', await: 'stopped', emergencyStop: true, highlight: 'brake' },
      { say: 'Moving off again: mirrors and right shoulder first.', await: 'look.right', highlight: 'look-right' },
      { say: 'And off we go. Pull into the lay-by on the left ahead, at the marker.', await: 'stoppedAt.LB3', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Rain, fog and a controlled stop. Every metre of gap is a metre you might need.'
  },

  free: {
    intro: 'Free drive in the rain. Practise your gaps behind the car ahead, and mind the fog on the moor. Tap Test when you’re ready.',
    start: DV_STARTS.a386North(1000),
    parked: true,
    traffic: 'light',
    scripted: [LEADER],
    conditions: { weather: 'rain', fogPatches: true },
    hint: ROUTE,
    hints: [
      'In the wet, leave at least a four-second gap. Rules 126 and 227.',
      'Fog: headlights on when you can see less than 100 metres. Rule 226.',
      'Slow down before you reach the fog.',
      'Wipers on in the rain, and dipped headlights in dull weather.',
      'At 60 mph a car needs about 73 metres to stop on a dry road.'
    ]
  },

  test: {
    intro: 'Test drive in the rain. We’re on the A386. Get ready, and move off when it’s safe.',
    start: DV_STARTS.a386North(1000),
    parked: true,
    traffic: 'light',
    scripted: [LEADER],
    conditions: { weather: 'rain', fogPatches: true },
    hint: ROUTE,
    directions: [
      { at: { x0: CX, x1: CX + AH, z0: 1080, z1: 1300 }, say: 'Follow the A386 ahead. There’s fog on the moor today.' },
      { at: { x0: CX - AH, x1: CX + AH, z0: 1950, z1: 2080 }, say: 'Pull into the lay-by on the left, at the marker.', marker: 'LB3' }
    ],
    finishMarker: 'LB3',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 480,
    pullUp: true
  },

  quiz: [
    {
      id: 'd16q1',
      question: 'What’s the minimum gap you should leave behind the vehicle in front on a fast, dry road?',
      options: ['One second', 'Two seconds', 'One car length', 'Ten metres'],
      answer: 1,
      explain: 'Rule 126: allow at least a two-second gap between you and the vehicle in front on high-speed roads.',
      rules: [126]
    },
    {
      id: 'd16q2',
      question: 'How much bigger should the gap be on a wet road?',
      options: ['The same', 'At least double', 'Half', 'Ten times'],
      answer: 1,
      explain: 'Rules 126 and 227: stopping distances are at least double in the wet, so the gap should be at least doubled. On icy roads it can be up to ten times greater.',
      rules: [126, 227]
    },
    {
      id: 'd16q3',
      question: 'When MUST you use headlights in the daytime?',
      options: ['Never', 'When visibility is seriously reduced, generally under 100 metres', 'Whenever it rains', 'Only on motorways'],
      answer: 1,
      explain: 'Rule 226: you MUST use headlights when visibility is seriously reduced, generally when you cannot see for more than 100 metres.',
      rules: [226]
    },
    {
      id: 'd16q4',
      question: 'What’s the typical overall stopping distance for a car at 60 mph on a dry road?',
      options: ['About 23 metres', 'About 36 metres', 'About 73 metres', 'About 150 metres'],
      answer: 2,
      explain: 'The Highway Code’s typical stopping distances: 23 m at 30 mph, 36 m at 40, 53 m at 50, 73 m at 60 and 96 m at 70 (thinking plus braking distance). See rule 126.',
      rules: [126]
    }
  ]
};
