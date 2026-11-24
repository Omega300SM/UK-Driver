import type { LessonContent } from '../schema';
import { MT_STARTS } from '../../world/scenes/millTownLayout';

/**
 * Day 10 — Pedestrian crossings: zebra, pelican and puffin (rules 191–199).
 * Mill Town's south side: the Canal Side zebra, the Station Road pelican and
 * the Bridge Street puffin, joined by the Bridge Street traffic lights.
 */
const GUIDED_ROUTE: Array<[number, number]> = [
  [98.1, -60],
  [98.1, -120],
  [97.4, -125],
  [94, -128.1],
  [60, -128.1],
  [5, -128.1],
  [1.9, -125],
  [1.9, -90],
  [2.65, -86]
];

const TEST_ROUTE: Array<[number, number]> = [
  [-1.9, -45],
  [-1.9, -124],
  [-1.4, -129.6],
  [2, -131.9],
  [93, -131.9],
  [96.5, -132.6],
  [98.1, -135],
  [98.1, -190],
  [97.35, -199]
];

export const day10: LessonContent = {
  day: 10,
  world: 2,
  title: 'Pedestrian crossings',
  subtitle: 'Mill Town: zebra, pelican and puffin crossings',
  sceneId: 'millTown',
  checks: 'millTown',
  rules: [191, 192, 194, 195, 196, 198, 199],

  briefing: [
    {
      title: 'Spot the crossing early',
      say: 'Crossings are where people walk out in front of you on purpose, so we spot them early. Look for the zig-zag lines, the flashing beacons and the lights. On the zig-zags you MUST NOT park, and you MUST NOT overtake the car nearest the crossing. Rule one-nine-one.',
      points: ['Zig-zags mean a crossing ahead', 'No parking or overtaking on the zig-zags (rule 191)', 'Keep crossings clear in queues (rule 192)'],
      diagram: 'zebra',
      signs: [{ kind: 'warn-pedestrians' }]
    },
    {
      title: 'Zebra crossings',
      say: 'A zebra has black and white stripes and flashing amber beacons, but no lights for you. If someone is waiting, be ready to slow down and let them cross. Once they’ve stepped onto it, you MUST give way. And don’t wave them across or flash your lights: that could be dangerous if another car is coming. Rule one-nine-five.',
      points: ['Someone waiting? Be ready to stop', 'Someone on it? You MUST give way', 'Don’t wave, flash or hoot people across'],
      diagram: 'zebra'
    },
    {
      title: 'Pelican, puffin and toucan',
      say: 'Signal crossings have traffic lights. A pelican has a flashing amber after the red: you MUST give way to anyone still on the crossing, and can go if it’s clear. Puffins and toucans work like ordinary lights: red, red and amber, then green. Whatever the light, give way to anyone still crossing. Rules one-nine-six to one-nine-nine.',
      points: ['Pelican: flashing amber, give way to anyone on it', 'Puffin and toucan: just like traffic lights', 'Anyone still crossing on green? Let them finish'],
      diagram: 'signal-crossings'
    },
    {
      title: 'Be patient',
      say: 'Give people plenty of time, especially older people, children and anyone with a pushchair or a stick. Don’t rev your engine or creep forward to hurry them. Rule one-nine-four. A crossing is not a race.',
      points: ['Plenty of time for everyone', 'No revving or edging forward (rule 194)', 'Look out for people approaching from the side'],
      diagram: 'none'
    }
  ],

  guided: {
    intro: 'We’re on Bridge Street, heading for the traffic lights. Then we’ll meet a zebra and a pelican crossing.',
    parked: true,
    start: MT_STARTS.bridgeSouth(-55),
    traffic: 'light',
    hint: GUIDED_ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and off we go.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. Traffic lights ahead: we’re turning left at them. Mirror, then signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'If they’re red, stop behind the white line. Only go on green.', await: 'zone.j1-approach-s', highlight: 'brake' },
      { say: 'When it’s green and clear, turn left onto Canal Side.', await: 'turned.left', nudge: 'Wait for green, then turn left.' },
      { say: 'See the zig-zags and flashing beacons? A zebra crossing. Mirror, and look for anyone waiting on the pavement.', await: 'zone.z1-approach-w', highlight: 'mirror-interior' },
      { say: 'If someone is waiting or on the crossing, stop at the line and let them cross. Be patient.', await: 'line.Z1-w', nudge: 'Go when the crossing is clear.' },
      { say: 'Well done. Follow the road round to the right, onto Station Road.', await: 'zone.p1-approach-n' },
      { say: 'A pelican crossing. Red means stop. Flashing amber means give way to anyone still on it.', await: 'line.P1-n', nudge: 'Wait for the lights, and for anyone still crossing.' },
      { say: 'Lovely. Pull up on the left at the marker, past the zig-zags. Mirror, signal.', await: 'stoppedAt.ST2', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'A zebra, a pelican and a set of lights, and nobody was hurried. That’s how you share a town.'
  },

  free: {
    intro: 'Free drive. Try all three crossings: the zebra on Canal Side, the pelican on Station Road and the puffin on Bridge Street. Tap Test when you’re ready.',
    start: MT_STARTS.stationSouth(-40),
    parked: true,
    traffic: 'light',
    hint: TEST_ROUTE,
    hints: [
      'Zebra: give way to anyone waiting, and you MUST stop for anyone on it. Rule 195.',
      'Pelican: on flashing amber, give way to anyone on the crossing. Rule 196.',
      'Puffin: red, red and amber, then green, like traffic lights. Rule 199.',
      'Never stop on the crossing or its zig-zags. Rules 191 and 192.',
      'Don’t wave people across or flash your lights at them.'
    ]
  },

  test: {
    intro: 'Test drive. We’re on Station Road. Move off when you’re ready, and follow the road ahead.',
    start: MT_STARTS.stationSouth(-40),
    parked: true,
    traffic: 'light',
    hint: TEST_ROUTE,
    directions: [
      { at: { x0: -4, x1: 0, z0: -60, z1: -48 }, say: 'Follow the road ahead, round to the left.' },
      { at: { x0: 20, x1: 60, z0: -134, z1: -130 }, say: 'At the traffic lights, turn left onto Bridge Street.' },
      { at: { x0: 96, x1: 100, z0: -160, z1: -140 }, say: 'Pull up on the left at the marker, after the crossing.', marker: 'BS1' }
    ],
    finishMarker: 'BS1',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 420,
    pullUp: true
  },

  quiz: [
    {
      id: 'd10q1',
      question: 'Someone has just stepped onto a zebra crossing ahead. What MUST you do?',
      options: ['Sound your horn so they know you’re there', 'Give way to them', 'Carry on if you were there first', 'Flash your lights to wave them across'],
      answer: 1,
      explain: 'Rule 195: you MUST give way when a pedestrian has moved onto a zebra crossing. Don’t wave, flash or hoot people across.',
      rules: [195]
    },
    {
      id: 'd10q2',
      question: 'The amber light is flashing at a pelican crossing. What does it mean?',
      options: ['Stop and wait for green', 'Speed up before it turns red', 'Give way to anyone on the crossing; go if it’s clear', 'The crossing is out of order'],
      answer: 2,
      explain: 'Rule 196: when the amber light is flashing you MUST give way to any pedestrians on the crossing. If it’s clear, you may go with caution.',
      rules: [196]
    },
    {
      id: 'd10q3',
      question: 'How is a puffin crossing different from a pelican crossing?',
      options: ['It has no lights at all', 'There’s no flashing amber: the lights run like traffic lights', 'Only cyclists can use it', 'You may park on its zig-zags'],
      answer: 1,
      explain: 'Rule 199: toucan, puffin and equestrian crossings have no flashing amber phase. The sequence is the same as at traffic lights.',
      rules: [199]
    },
    {
      id: 'd10q4',
      question: 'You’re queuing in slow traffic near a pedestrian crossing. What should you do?',
      options: ['Stop on the crossing to keep up with the queue', 'Keep the crossing clear: only go onto it if you can get right across', 'Use the zig-zags to overtake', 'Sound your horn at people crossing between cars'],
      answer: 1,
      explain: 'Rule 192: keep crossings completely clear in queuing traffic. Don’t go onto one unless you can clear it completely.',
      rules: [192]
    },
    {
      id: 'd10q5',
      question: 'Your light has turned green, but someone is still crossing in front of you. What should you do?',
      options: ['Edge forward to hurry them', 'Rev the engine', 'Give way and let them finish crossing', 'Go: green means go'],
      answer: 2,
      explain: 'Rules 194 and 198: give way to anyone still crossing after your light turns green, and don’t harass them by revving or edging forward.',
      rules: [194, 198]
    }
  ]
};
