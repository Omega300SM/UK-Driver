import type { LessonContent } from '../schema';
import { STARTS } from '../../world/scenes/townLayout';

/** Day 4 — Speed limits, the national speed limit, 20 and 30 zones, and speed cameras. Ashby Road into town. */
const ROUTE: Array<[number, number]> = [
  [-398, -2.4],
  [-380, -1.9],
  [26, -1.9],
  [33, -2.6],
  [37, -6],
  [38.1, -12],
  [38.1, -90],
  [37.4, -104]
];

export const day04: LessonContent = {
  day: 4,
  world: 1,
  title: 'Speed limits and cameras',
  subtitle: 'Ashby Road into Little Ashby: 60, 30, then the 20 zone',
  sceneId: 'town',
  checks: 'town',
  rules: [124, 125, 146],

  briefing: [
    {
      title: 'Know the limit',
      say: 'Today we drive into town from the countryside, and the speed limit changes three times. Rule one-two-four: you MUST NOT exceed the limit. In England, roads with street lights are generally thirty unless a sign says otherwise.',
      points: ['You MUST NOT exceed the limit', 'Street lights usually mean 30', 'Signs tell you when it changes'],
      diagram: 'speed-limits'
    },
    {
      title: 'The national speed limit',
      say: 'A white circle with a black diagonal stripe means the national speed limit applies. For a car on a single carriageway, that’s sixty. But it’s a maximum, not a target. Rule one-two-five: the limit doesn’t mean it’s safe to drive at that speed. Out in the lanes today, aim for a sensible forty to fifty when it’s clear.',
      points: ['National limit: 60 for cars on a single carriageway', 'A maximum, not a target (rule 125)', 'Don’t dawdle on a clear road either'],
      diagram: 'none',
      signs: [{ kind: 'nsl' }, { kind: 'limit', value: 30 }, { kind: 'limit', value: 60, caption: 'A posted 60 limit' }]
    },
    {
      title: '20 zones and cameras',
      say: 'Market Street is a twenty zone. The limit is set by the local council, so it varies from town to town in England. The zone sign tells you where it starts, and another tells you where it ends. Speed cameras are marked by a camera sign. But the camera isn’t the point: children and cyclists are.',
      points: ['20 zones are set locally', 'Zone signs mark the start and end', 'Camera signs warn of enforcement'],
      diagram: 'none',
      signs: [{ kind: 'zone20' }, { kind: 'zone20-end' }, { kind: 'camera' }]
    }
  ],

  guided: {
    intro: 'We’ve pulled into a gateway on Ashby Road, out in the country. Belt’s on. Let’s move off.',
    parked: true,
    start: STARTS.mainEast(-400),
    traffic: 'light',
    hint: ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors, and over your right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. This is a national speed limit road. Build up smoothly to about forty.', await: 'speedAbove.38', highlight: 'accel', nudge: 'Gently press GO and hold it. Watch the speedo.' },
      { say: 'Lovely. Watch for the change ahead: street lights and a thirty sign.', await: 'zone.thirty' },
      { say: 'Thirty now. Ease off. There’s a speed camera sign too. Keep an eye on the speedo.', await: 'zone.zone', nudge: 'Keep it at or under thirty, then twenty in the zone.' },
      { say: 'Twenty zone. Twenty is the maximum here. Take the next road on the left: Mill Lane. Mirror first.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Slow right down, and turn in, keeping to the left.', await: 'turned.left', nudge: 'Slow to walking pace and steer left into Mill Lane.' },
      { say: 'Mill Lane is a thirty. Pull up at the marker on the left. Mirror, signal.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Stop in the yellow box.', await: 'stoppedAt.S1', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Sixty, thirty, twenty, thirty, and you matched every one. Lovely.'
  },

  free: {
    intro: 'Drive into town on your own. Watch every sign. Tap the Test button when you’re ready.',
    start: STARTS.mainEast(-400),
    parked: true,
    traffic: 'light',
    hint: ROUTE,
    hints: [
      'White circle, black diagonal: national speed limit. 60 for a car on a single carriageway.',
      'Street lights usually mean 30 unless signs say otherwise. Rule 124.',
      'The limit is a maximum, not a target. Rule 125.',
      'On a clear road, don’t crawl. Too slow holds others up.',
      'Brake before the limit sign, so you’re at the new speed as you pass it.'
    ]
  },

  test: {
    intro: 'Test drive. Move off when it’s safe and follow the road ahead into town. Keep to the speed limits.',
    start: STARTS.mainEast(-400),
    parked: true,
    traffic: 'light',
    hint: ROUTE,
    directions: [
      { at: { x0: -40, x1: 0, z0: -4, z1: 4 }, say: 'Take the next road on the left, please: Mill Lane.' },
      { at: { x0: 32, x1: 48, z0: -60, z1: -15 }, say: 'Pull up on the left at the marker, please.', marker: 'S1' }
    ],
    finishMarker: 'S1',
    finishSay: 'And secure the car.',
    timeLimitS: 360,
    pullUp: true
  },

  quiz: [
    {
      id: 'd4q1',
      question: 'What is the national speed limit for a car on a single carriageway road?',
      sign: { kind: 'nsl' },
      options: ['50 mph', '60 mph', '70 mph', '40 mph'],
      answer: 1,
      explain: 'Rule 124 table: cars on single carriageways, 60 mph. On dual carriageways and motorways it’s 70 mph.',
      rules: [124]
    },
    {
      id: 'd4q2',
      question: 'You’re on a road with street lights and no speed limit signs. What is the limit, generally?',
      options: ['20 mph', '30 mph', '40 mph', 'The national speed limit'],
      answer: 1,
      explain: 'Rule 124: a 30 mph limit generally applies to all roads with street lights (excluding motorways) unless signs show otherwise. In Wales it’s generally 20 mph.',
      rules: [124]
    },
    {
      id: 'd4q3',
      question: 'The limit is 60 mph but the road is narrow and twisty. What should you do?',
      options: ['Drive at 60, as that’s the limit', 'Drive at a speed that suits the conditions, which may be well below 60', 'Drive at 70 to get through quickly', 'Stop and wait for it to widen'],
      answer: 1,
      explain: 'Rules 125 and 146: the limit is the absolute maximum, not a target. Adapt your speed to the road and traffic conditions.',
      rules: [125, 146]
    },
    {
      id: 'd4q4',
      question: 'What does this sign mean?',
      sign: { kind: 'zone20' },
      options: ['End of a 20 mph zone', 'Entry to a 20 mph zone', 'Minimum speed 20 mph', 'Recommended speed 20 mph'],
      answer: 1,
      explain: 'It’s the entry to a 20 mph zone. The limit applies until you pass an end-of-zone sign. In England these are set by local councils.',
      rules: [124]
    },
    {
      id: 'd4q5',
      question: 'Which sign means speed cameras are used to enforce the limit?',
      sign: { kind: 'camera' },
      options: ['This one: a camera symbol on a rectangular sign', 'A red triangle', 'A blue circle', 'A brown sign'],
      answer: 0,
      explain: 'A rectangular sign with a camera symbol warns that cameras are used to enforce traffic regulations. Speed limits are enforced by the police (rule 124).',
      rules: [124]
    }
  ]
};
