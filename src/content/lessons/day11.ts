import type { LessonContent } from '../schema';
import { MT_STARTS } from '../../world/scenes/millTownLayout';

/**
 * Day 11 — Traffic lights, box junctions and bus lanes (rules 141, 174–178).
 * Mill Town's Canal Side: the westbound bus lane and the Bridge Street lights
 * with their yellow box.
 */
const GUIDED_ROUTE: Array<[number, number]> = [
  [198.1, -90],
  [198.1, -120],
  [197.4, -124.5],
  [194, -127.5],
  [188, -128.1],
  [60, -128.1],
  [5, -128.1],
  [1.9, -125],
  [1.9, -90],
  [2.65, -86]
];

const TEST_ROUTE: Array<[number, number]> = [
  [198.1, -45],
  [198.1, -120],
  [197.4, -124.5],
  [194, -127.5],
  [188, -128.1],
  [106, -128.1],
  [101.5, -128.6],
  [99, -130.5],
  [98.1, -134],
  [98.1, -190],
  [97.35, -199]
];

export const day11: LessonContent = {
  day: 11,
  world: 2,
  title: 'Lights, box junctions and bus lanes',
  subtitle: 'Mill Town: the Bridge Street lights and Canal Side',
  sceneId: 'millTown',
  checks: 'millTown',
  rules: [141, 174, 175, 176, 177, 178],

  briefing: [
    {
      title: 'The light sequence',
      say: 'Traffic lights go red, red and amber, green, amber, then red again. Red and amber still means stop: don’t creep off early. On green, go only if it’s clear and there’s room for you on the other side. Rules one-seven-five and one-seven-six.',
      points: ['Red, and red with amber: stop behind the line', 'Green: go if the way is clear', 'Amber: stop, unless you’re too close to stop safely'],
      diagram: 'lights-sequence',
      signs: [{ kind: 'warn-signals' }]
    },
    {
      title: 'Amber: stop or go?',
      say: 'When the green changes to amber, you MUST stop at the line, unless you’ve already crossed it, or you’re so close that stopping might cause a crash. That’s why we don’t race at green lights: approach at a speed where you could stop. Rule one-seven-five.',
      points: ['Expect green to change', 'Amber means stop if you safely can', 'Check your mirror as you approach lights'],
      diagram: 'lights-sequence'
    },
    {
      title: 'Box junctions',
      say: 'Yellow criss-cross lines mark a box junction. You MUST NOT enter the box until your exit is clear. The one exception: turning right, when only oncoming traffic, or cars waiting to turn right, are stopping you. Rule one-seven-four.',
      points: ['Exit clear? Then enter the box', 'Never stop in the box going ahead or left', 'Turning right: you may wait in it for oncoming traffic'],
      diagram: 'box-junction'
    },
    {
      title: 'Bus lanes and filter arrows',
      say: 'Bus lanes are marked with a thick white line and the words BUS LANE. The blue sign tells you the hours: keep out during them. A green filter arrow only lets traffic go the way it points, so don’t use that lane unless you’re going that way. And at advanced stop lines, leave the box for cyclists. Rules one-four-one, one-seven-seven and one-seven-eight.',
      points: ['Bus lane: read the hours, keep out during them (rule 141)', 'Filter arrow: only for traffic going that way (rule 177)', 'Advanced stop line: stop at the first line (rule 178)'],
      diagram: 'bus-lane',
      signs: [{ kind: 'bus-lane', caption: 'Bus lane: times shown' }]
    }
  ],

  guided: {
    intro: 'We’re on Southway. We’ll turn onto Canal Side, past the bus lane, and through the Bridge Street lights.',
    parked: true,
    start: MT_STARTS.southwaySouth(-86),
    traffic: 'light',
    hint: GUIDED_ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. Next left is Canal Side. Mirror, signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Slow down, and turn in.', await: 'turned.left', nudge: 'Turn left onto Canal Side.' },
      { say: 'See the red lane on our left? A bus lane, at any time. We stay out of it, in the right-hand lane.', await: 'zone.bus-lane-alongside' },
      { say: 'Traffic lights ahead, with a yellow box. We’re going straight on. Mirror as you approach.', await: 'zone.j1-approach-w', highlight: 'mirror-interior' },
      { say: 'Red? Stop behind the line. On green, only enter the box if our exit is clear.', await: 'line.J1-w', nudge: 'Wait for green and a clear exit.' },
      { say: 'Good. A zebra crossing next: look for anyone waiting.', await: 'line.Z1-w' },
      { say: 'Follow the road round to the right, onto Station Road.', await: 'zone.p1-approach-n' },
      { say: 'Pelican crossing: watch the lights.', await: 'line.P1-n' },
      { say: 'Pull up on the left at the marker. Mirror, signal.', await: 'stoppedAt.ST2', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Lights, a box junction and a bus lane, all by the book. Mill Town is getting used to you.'
  },

  free: {
    intro: 'Free drive. Try the Bridge Street lights from every direction, and mind the box. Tap Test when you’re ready.',
    start: MT_STARTS.southwaySouth(-86),
    parked: true,
    traffic: 'busy',
    hint: TEST_ROUTE,
    hints: [
      'Red and amber still means stop. Rules 175 and 176.',
      'Amber: stop if you safely can.',
      'Don’t enter the yellow box until your exit is clear, unless turning right. Rule 174.',
      'Keep out of the bus lane during its hours. Rule 141.',
      'Turning right at lights: wait in the box for oncoming traffic, then go when it’s clear.'
    ]
  },

  test: {
    intro: 'Test drive. We’re on Southway. Move off when you’re ready, and follow the road ahead.',
    start: MT_STARTS.southwaySouth(-40),
    parked: true,
    traffic: 'light',
    hint: TEST_ROUTE,
    directions: [
      { at: { x0: 196, x1: 200, z0: -70, z1: -55 }, say: 'Take the next road on the left, Canal Side.' },
      { at: { x0: 140, x1: 180, z0: -130, z1: -126 }, say: 'At the traffic lights, turn right onto Bridge Street.' },
      { at: { x0: 96, x1: 100, z0: -160, z1: -140 }, say: 'Pull up on the left at the marker, after the crossing.', marker: 'BS1' }
    ],
    finishMarker: 'BS1',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 420,
    pullUp: true
  },

  quiz: [
    {
      id: 'd11q1',
      question: 'The traffic lights show red and amber together. What does this mean?',
      options: ['Go if the way is clear', 'Stop: don’t go until green shows', 'Prepare to stop', 'The lights are faulty'],
      answer: 1,
      explain: 'Red and amber also means stop. Do not pass through or start until green shows (rules 175–176, light signals controlling traffic).',
      rules: [175, 176]
    },
    {
      id: 'd11q2',
      question: 'The light turns amber as you approach. You could stop safely. What should you do?',
      options: ['Speed up to get through', 'Stop at the stop line', 'Carry on: amber means go', 'Sound your horn'],
      answer: 1,
      explain: 'Rule 175: on amber you may go on only if you have crossed the stop line or are so close that stopping might cause a collision.',
      rules: [175]
    },
    {
      id: 'd11q3',
      question: 'When may you wait inside a yellow box junction?',
      options: ['Whenever the lights are green', 'When turning right and only oncoming traffic is stopping you', 'When going straight on in a queue', 'Never, under any circumstances'],
      answer: 1,
      explain: 'Rule 174: you MUST NOT enter the box until your exit is clear, but you may enter and wait when turning right and stopped only by oncoming traffic or other vehicles waiting to turn right.',
      rules: [174]
    },
    {
      id: 'd11q4',
      question: 'A bus lane sign shows its times. What should you do during those times?',
      sign: { kind: 'bus-lane', text: 'Mon–Fri 7–10am' },
      options: ['Use it to overtake slow traffic', 'Keep out of it, unless signs say your vehicle may use it', 'Drive in it if no bus is coming', 'Park in it'],
      answer: 1,
      explain: 'Rule 141: unless otherwise indicated, you should not drive in a bus lane during its period of operation. You may enter one to stop, load or unload where that isn’t prohibited.',
      rules: [141]
    },
    {
      id: 'd11q5',
      question: 'You stop at an amber light at a junction with an advanced stop line for cyclists. Where should you stop?',
      options: ['In the cyclists’ box', 'At the first white line', 'At the second white line', 'Wherever there’s room'],
      answer: 1,
      explain: 'Rule 178: at amber or red you MUST stop at the first white line reached, leaving the marked area for cyclists.',
      rules: [178]
    }
  ]
};
