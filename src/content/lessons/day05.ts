import type { LessonContent } from '../schema';
import { STARTS } from '../../world/scenes/townLayout';

/** Day 5 — Road signs and markings, including yellow and white lines. Market Street to Ashby Road (westbound). */
const ROUTE: Array<[number, number]> = [
  [228, 2.4],
  [212, 1.9],
  [118, 1.9],
  [114, 0.2],
  [99, 0.2],
  [95, 1.9],
  [-150, 1.9],
  [-188, 2.4]
];

export const day05: LessonContent = {
  day: 5,
  world: 1,
  title: 'Road signs and markings',
  subtitle: 'Market Street and Ashby Road: a sign safari',
  sceneId: 'town',
  checks: 'town',
  rules: [109, 127, 129, 171, 172, 238, 240, 243],

  briefing: [
    {
      title: 'Shapes first',
      say: 'Signs make sense once you know the shapes. Circles give orders, and red circles mostly tell you what you mustn’t do. Triangles warn you of something ahead. Rectangles give information. Blue circles mostly tell you what you must do. Rule one-zero-nine: you MUST obey signs giving orders, and know and act on the others. Learn the shapes and you can read most signs before you can read the words on them.',
      points: ['Circles: orders (red = mostly prohibitions)', 'Triangles: warnings', 'Rectangles: information'],
      diagram: 'sign-shapes',
      signs: [{ kind: 'no-entry' }, { kind: 'stop' }, { kind: 'giveway' }, { kind: 'warn-tjunction' }]
    },
    {
      title: 'White lines',
      say: 'A broken white line marks the middle of the road. When the lines get longer and the gaps shorter, that’s a hazard warning. Double white lines with a solid line on your side: you MUST NOT cross or straddle them, rule one-two-nine. And you mustn’t stop on that road either, rule two-four-zero.',
      points: ['Broken: centre line', 'Longer dashes: hazard ahead', 'Solid on your side: MUST NOT cross, MUST NOT stop'],
      diagram: 'road-lines'
    },
    {
      title: 'Yellow lines and stopping',
      say: 'Yellow lines along the kerb are about waiting. Double yellows: no waiting at any time. A single yellow: there’s a time plate nearby, so check it. Today I’ll ask you to pull up somewhere safe and legal. That means no yellow lines, no double whites, and not within ten metres of a junction.',
      points: ['Double yellow: no waiting at any time', 'Single yellow: check the plate', 'Not within 10 m of a junction (rule 243)'],
      diagram: 'yellow-lines',
      signs: [{ kind: 'no-waiting' }]
    }
  ],

  guided: {
    intro: 'We’re parked on Market Street. Today I’ll point out signs and markings as we go. Move off when ready.',
    parked: true,
    start: STARTS.mainWest(230),
    traffic: 'light',
    hint: ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal if it helps, and move off.', await: 'moving', highlight: 'accel' },
      { say: 'On the left, Church Street has a STOP sign and a solid white line. Anyone coming out MUST stop.', await: 'zone.d5-church' },
      { say: 'Parked cars on our side ahead, and Sheep Street beyond has No Entry signs: red circle, white bar. Give way to anything coming, and don’t turn in.', await: 'zone.d5-sheep' },
      { say: 'Single yellow lines here: check the plate before stopping. Look for the zone end sign ahead.', await: 'zone.d5-zone-end' },
      { say: 'End of the twenty zone, and double yellow lines on both sides. No waiting at any time.', await: 'zone.d5-double-white' },
      { say: 'Double white lines, solid on our side. We MUST NOT cross them, and we mustn’t stop here either.', await: 'zone.d5-pull-up' },
      { say: 'Junction on the right, with double yellows round it. Once we’re past, find a safe, legal place to pull up on the left. Mirror, signal.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Pull up on the left, past the yellow lines.', await: 'stoppedAt.P5', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Lovely. That’s a whole high street’s worth of signs. You’ll start spotting them everywhere now.'
  },

  free: {
    intro: 'Drive the route on your own and spot the signs. Tap the Test button when you’re ready.',
    start: STARTS.mainWest(230),
    parked: true,
    traffic: 'light',
    hint: ROUTE,
    hints: [
      'Red circles mostly tell you what you mustn’t do. Triangles warn. Rectangles inform.',
      'Double white lines with solid on your side: don’t cross, don’t stop. Rules 129 and 240.',
      'Double yellow lines mean no waiting at any time. Rule 238.',
      'Never stop within 10 metres of a junction. Rule 243.',
      'No Entry: red circle with a white bar. It’s an order.'
    ]
  },

  test: {
    intro: 'Test drive. Move off when it’s safe and follow the road ahead. I’ll ask you to pull up later.',
    start: STARTS.mainWest(230),
    parked: true,
    traffic: 'light',
    hint: ROUTE,
    directions: [
      { at: { x0: -62, x1: -30, z0: -4, z1: 4 }, say: 'When you find a safe and legal place, pull up on the left, please.', marker: 'P5' }
    ],
    finishMarker: 'P5',
    finishSay: 'Thank you. Handbrake on, into Park.',
    timeLimitS: 360,
    pullUp: true
  },

  quiz: [
    {
      id: 'd5q1',
      question: 'What does a red circle on a road sign usually mean?',
      sign: { kind: 'no-entry' },
      options: ['It gives information', 'It warns of a hazard', 'It gives an order, usually telling you what you must not do', 'It shows a tourist attraction'],
      answer: 2,
      explain: 'Signs with red circles are mostly prohibitive. You MUST obey traffic signs giving orders (rule 109). This one is No Entry.',
      rules: [109]
    },
    {
      id: 'd5q2',
      question: 'You’re driving with double white lines in the middle of the road, and the line nearest you is solid. What does this mean?',
      options: ['You may cross it to overtake if it’s clear', 'You MUST NOT cross or straddle it, except in the cases the rule lists', 'It marks a cycle lane', 'It means a bus stop ahead'],
      answer: 1,
      explain: 'Rule 129: where the line nearer to you is solid, you MUST NOT cross or straddle it, except for the specific cases listed, such as passing a stationary vehicle.',
      rules: [129]
    },
    {
      id: 'd5q3',
      question: 'What do double yellow lines along the edge of the road mean?',
      options: ['No waiting at any time', 'Parking allowed after 6pm', 'Loading only', 'Bus lane'],
      answer: 0,
      explain: 'Double yellow lines mean no waiting at any time unless signs show seasonal restrictions (rule 238 and the road markings section).',
      rules: [238]
    },
    {
      id: 'd5q4',
      question: 'What must you do at this sign?',
      sign: { kind: 'stop' },
      options: ['Slow down and go if clear', 'Stop behind the line, then go when it’s safe', 'Stop only if there’s traffic', 'Sound your horn'],
      answer: 1,
      explain: 'Rule 171: you MUST stop behind the line at a junction with a Stop sign and a solid white line across the road, then wait for a safe gap.',
      rules: [171]
    },
    {
      id: 'd5q5',
      question: 'The centre line changes to long dashes with short gaps. What does that tell you?',
      options: ['You may overtake', 'There’s a hazard ahead', 'The speed limit has changed', 'You’re entering a 20 zone'],
      answer: 1,
      explain: 'Rule 127: when the broken white line lengthens and the gaps shorten, there is a hazard ahead.',
      rules: [127]
    }
  ]
};
