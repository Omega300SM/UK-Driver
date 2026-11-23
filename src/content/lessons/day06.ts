import type { LessonContent } from '../schema';
import { STARTS } from '../../world/scenes/townLayout';

/** Day 6 — Junctions: T-junctions, give way, stop signs and emerging. */
const GUIDED_ROUTE: Array<[number, number]> = [
  [42.4, -78],
  [41.9, -60],
  [41.9, -8],
  [44, -3.2],
  [50, -1.9],
  [124, -1.9],
  [134, -0.6],
  [139.5, 3.5],
  [141.9, 12],
  [142.4, 38]
];

const TEST_ROUTE: Array<[number, number]> = [
  [137.6, 98],
  [138.1, 88],
  [138.1, 8],
  [135.5, 3.2],
  [128, 1.9],
  [52, 1.9],
  [44, 0.6],
  [40, -3.5],
  [38.1, -10],
  [38.1, -90],
  [37.4, -104]
];

export const day06: LessonContent = {
  day: 6,
  world: 1,
  title: 'Junctions and emerging',
  subtitle: 'Mill Lane, Market Street and Church Street, with traffic',
  sceneId: 'town',
  checks: 'town',
  rules: [170, 171, 172, 179, 180, 182],

  briefing: [
    {
      title: 'Give way or stop?',
      say: 'At a T-junction you’re joining a main road, so the traffic on it has priority. Broken double lines mean give way: slow down, look, and only go if it’s clear, rule one-seven-two. A solid line with a STOP sign means your wheels MUST stop, every time, even if it’s clear, rule one-seven-one.',
      points: ['Broken lines: give way (rule 172)', 'Solid line + STOP: MUST stop (rule 171)', 'Main-road traffic has priority'],
      diagram: 'giveway-stop'
    },
    {
      title: 'Emerging',
      say: 'Approaching the junction: mirror, signal, slow right down. At the line, look right, left, and right again. Wait for a gap big enough that nobody on the main road has to slow down for you. Use the eye buttons, or swipe, to look. Rule one-seven-zero.',
      points: ['Mirror, signal, slow down', 'Look right, left, right again', 'Wait for a big enough gap'],
      diagram: 'emerging'
    },
    {
      title: 'Turning off a main road',
      say: 'Turning left: mirror, signal left, slow down, and keep close to the left. Turning right: mirror, signal right, and position just left of the middle of the road. Then wait for a safe gap in the oncoming traffic, and don’t cut the corner. Rules one-seven-nine to one-eight-two.',
      points: ['Left: keep to the left', 'Right: just left of centre, wait for a gap', 'Don’t cut the corner'],
      diagram: 'turn-right'
    }
  ],

  guided: {
    intro: 'We’re on Mill Lane facing the main road. There’s traffic today. Move off when ready.',
    parked: true,
    start: STARTS.millNorth(-80),
    traffic: 'light',
    hint: GUIDED_ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors, and look over your right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right, and off we go.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. T-junction ahead with give way lines. We’re turning left. Mirror first.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Slow right down as you reach the line.', await: 'zone.mill-line', highlight: 'brake' },
      { say: 'Look right.', await: 'look.right', highlight: 'look-right' },
      { say: 'Look left.', await: 'look.left', highlight: 'look-left' },
      { say: 'And right again. When there’s a safe gap, go.', await: 'turned.left', nudge: 'Wait for a gap where nobody has to slow down for you, then turn left.' },
      { say: 'Lovely. Next we turn right into Church Street. Mirror.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Signal right, and ease towards the middle of the road.', await: 'signal.right', highlight: 'stalk' },
      { say: 'Wait for a gap in the oncoming traffic, then turn. Don’t cut the corner.', await: 'turned.right', nudge: 'Stop just left of the centre line if there’s traffic, and go when it’s clear.' },
      { say: 'Pull up at the marker on the left, please. Mirror, signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Stop in the yellow box.', await: 'stoppedAt.C1', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Two junctions with traffic, and you judged both gaps. That’s a big step.'
  },

  free: {
    intro: 'Practise the junctions around Mill Lane and Market Street on your own. Tap the Test button when you’re ready.',
    start: STARTS.millNorth(-80),
    parked: true,
    traffic: 'light',
    hint: GUIDED_ROUTE,
    hints: [
      'Give way lines: slow down, look, go only when it’s clear. Rule 172.',
      'STOP sign: the wheels MUST stop at the line, every time. Rule 171.',
      'Look right, left, right again before you emerge. Rule 170.',
      'Turning right: position just left of the centre line and wait for a gap. Rules 179 and 180.',
      'If you have to make someone slow down for you, the gap was too small.'
    ]
  },

  test: {
    intro: 'Test drive. We’re on Church Street. Move off when it’s safe, and follow the road to the junction.',
    start: STARTS.churchSouth(100),
    parked: true,
    traffic: 'light',
    hint: TEST_ROUTE,
    directions: [
      { at: { x0: 130, x1: 150, z0: 30, z1: 90 }, say: 'At the end of the road, turn left, please.' },
      { at: { x0: 60, x1: 125, z0: 0, z1: 4 }, say: 'Take the next road on the right: Mill Lane.' },
      { at: { x0: 32, x1: 48, z0: -60, z1: -15 }, say: 'Pull up on the left at the marker, please.', marker: 'S1' }
    ],
    finishMarker: 'S1',
    finishSay: 'And secure the car, please.',
    timeLimitS: 420,
    pullUp: true
  },

  quiz: [
    {
      id: 'd6q1',
      question: 'You reach a junction with a STOP sign and a solid white line. The road is clear. What must you do?',
      sign: { kind: 'stop' },
      options: ['Slow down and drive on', 'Stop behind the line, then go when it’s safe', 'Sound your horn and go', 'Stop only if traffic is coming'],
      answer: 1,
      explain: 'Rule 171: you MUST stop behind the line, even if the road is clear, then wait for a safe gap.',
      rules: [171]
    },
    {
      id: 'd6q2',
      question: 'What do broken double white lines across the end of a side road mean?',
      sign: { kind: 'giveway' },
      options: ['You have priority', 'Give way to traffic on the main road', 'No entry', 'Stop for at least 3 seconds'],
      answer: 1,
      explain: 'Rule 172: you MUST give way to traffic on the main road when emerging from a junction with broken white lines across the road.',
      rules: [172]
    },
    {
      id: 'd6q3',
      question: 'Before emerging from a junction, what should you do?',
      options: ['Look only to the right', 'Look all around, and only go when there’s a safe gap', 'Rely on your mirrors', 'Go quickly to get out of the way'],
      answer: 1,
      explain: 'Rule 170: look all around before emerging. Do not cross or join a road until there is a gap large enough to do so safely.',
      rules: [170]
    },
    {
      id: 'd6q4',
      question: 'You want to turn right into a side road. Where should you position your car?',
      options: ['Close to the left kerb', 'Just left of the middle of the road', 'On the right-hand side of the road', 'Straddling the centre line'],
      answer: 1,
      explain: 'Rule 179: well before you turn right, use your mirrors, signal right, and take up a position just left of the middle of the road.',
      rules: [179]
    },
    {
      id: 'd6q5',
      question: 'Before turning left, you should…',
      options: ['Signal, then check your mirrors', 'Use your mirrors and signal left well before you turn', 'Overtake the car in front first', 'Swing out to the right to make the turn easier'],
      answer: 1,
      explain: 'Rule 182: use your mirrors and give a left-turn signal well before you turn left, and watch for cyclists on your left.',
      rules: [182]
    }
  ]
};
