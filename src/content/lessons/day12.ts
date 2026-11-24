import type { LessonContent } from '../schema';
import { MT_STARTS } from '../../world/scenes/millTownLayout';

/**
 * Day 12 — Parking and manoeuvres: reversing into a bay and parallel parking
 * (rules 200–203, 239). Albion Retail Park car park and the quiet north end
 * of Bridge Street.
 */
const GUIDED_ROUTE: Array<[number, number]> = [
  [98.1, -62],
  [98.1, -76],
  [97.6, -81],
  [95, -84.4],
  [90, -85.5],
  [55, -85.5]
];

const TEST_ROUTE: Array<[number, number]> = [
  [98.1, -62],
  [98.1, -76],
  [97.6, -81],
  [95, -84.4],
  [90, -85.5],
  [61, -85.5]
];

export const day12: LessonContent = {
  day: 12,
  world: 2,
  title: 'Parking and manoeuvres',
  subtitle: 'Mill Town: Albion Retail Park and Bridge Street',
  sceneId: 'millTown',
  checks: 'millTown',
  rules: [200, 201, 202, 203, 239],

  briefing: [
    {
      title: 'The manoeuvres',
      say: 'On your test you’ll be asked to do one manoeuvre: parallel park at the side of the road, park in a bay, or pull up on the right and reverse a couple of car lengths. Today we’ll practise the two you’ll use every day: reversing into a bay, and parallel parking. Choose a safe, quiet place to manoeuvre. Rule two hundred.',
      points: ['Reverse into a bay, drive out', 'Parallel park at the kerb', 'Pick a safe, quiet place (rule 200)'],
      diagram: 'bay-park'
    },
    {
      title: 'Look all round',
      say: 'Before you reverse: all your mirrors, and look over both shoulders for the blind spots. Then reverse slowly, looking mainly out of the back window, and keep checking all around. The front of the car swings out as you turn. If anyone comes near, stop and let them pass. Rule two-oh-two.',
      points: ['Mirrors and both shoulders before you reverse', 'Walking pace, looking mainly backwards', 'Someone coming? Stop and wait'],
      diagram: 'none'
    },
    {
      title: 'Reversing into a bay',
      say: 'Drive past the bay you want and stop about a car length beyond it. Select reverse, look all round, then reverse slowly with the wheel turned towards the bay. As the car straightens in the bay, take the lock off. Reversing in means you can drive out forwards, which is safer. Rule two-oh-one.',
      points: ['Stop about a car length past the bay', 'Full lock towards the bay, slowly', 'Straighten up, stop inside the lines'],
      diagram: 'bay-park'
    },
    {
      title: 'Parallel parking',
      say: 'Stop alongside the car in front of the gap, about a metre out. Reverse slowly until your back wheels are level with its back bumper. Steer towards the kerb, then, when you’re at about forty-five degrees, steer the other way to bring the front in. Finish close to the kerb and straight, facing the way the traffic flows. Rule two-three-nine.',
      points: ['Alongside the car in front, a metre out', 'Steer in, then steer out to straighten', 'Close to the kerb, facing the traffic flow'],
      diagram: 'parallel-park'
    }
  ],

  guided: {
    intro: 'We’re on Bridge Street. First we’ll reverse into a bay in the car park, then parallel park.',
    parked: true,
    start: MT_STARTS.bridgeSouth(-50),
    traffic: 'none',
    hint: GUIDED_ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. We’re turning left into the car park. Mirror, signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Slow right down and turn in.', await: 'zone.car-park', nudge: 'Turn left into the car park.' },
      { say: 'See the yellow bay on the left? N5. Drive past it and stop about a car length beyond it.', await: 'stoppedAt.n5-setup', highlight: 'brake', nudge: 'Stop a car length past the yellow bay.' },
      { say: 'Select reverse.', await: 'gear.R', highlight: 'gear' },
      { say: 'Mirrors, then look over your left shoulder…', await: 'look.left', highlight: 'look-left' },
      { say: '…and your right. All clear?', await: 'look.right', highlight: 'look-right' },
      { say: 'Reverse slowly, steering left to swing the back into the bay. Then straighten up inside the lines.', await: 'parkedIn.N5', nudge: 'Gently does it. Straighten up as the car comes into the bay.' },
      { say: 'Lovely. Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' },
      { say: 'Now parallel parking. Select D, handbrake off, and drive forwards out of the bay.', await: 'zone.car-park', highlight: 'gear' },
      { say: 'At the exit, turn right onto Bridge Street. Mirror, signal right.', await: 'signal.right', highlight: 'stalk' },
      { say: 'See the gap between the blue and red cars on our left? Stop alongside the red car, about a metre out.', await: 'stoppedAt.pp-setup', highlight: 'brake', nudge: 'Pull up alongside the red car, past the gap.' },
      { say: 'Select reverse, and look all round, especially over your left shoulder.', await: 'look.left', highlight: 'look-left' },
      { say: 'Reverse slowly. As our back wheels pass the red car, steer left. At about forty-five degrees, steer right to bring the front in.', await: 'parkedIn.PP1', nudge: 'Slowly. Steer in, then out, and stop close to the kerb.' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'A bay and a parallel park. Take your time with these: slow hands, lots of looking.'
  },

  free: {
    intro: 'Free practice. Try reversing into the yellow bays and parallel parking in the gap on Bridge Street. Tap Test when you’re ready.',
    start: MT_STARTS.bridgeSouth(-50),
    parked: true,
    traffic: 'none',
    hint: GUIDED_ROUTE,
    hints: [
      'Before reversing: mirrors and both shoulders. Rule 202.',
      'Reverse at walking pace. It’s fine to stop and shunt.',
      'Bay: stop a car length past it, then full lock towards it.',
      'Parallel: steer in until about 45 degrees, then steer the other way.',
      'Finish inside the lines, straight, handbrake on.'
    ]
  },

  test: {
    intro: 'Test drive: a manoeuvre. We’re on Bridge Street. Move off when you’re ready.',
    start: MT_STARTS.bridgeSouth(-50),
    parked: true,
    traffic: 'none',
    hint: TEST_ROUTE,
    directions: [
      { at: { x0: 96, x1: 100, z0: -62, z1: -52 }, say: 'Take the next left, into the car park.' },
      { at: { x0: 80, x1: 92, z0: -92, z1: -78 }, say: 'I’d like you to reverse into the bay marked in yellow, on the right. Finish inside the lines.', marker: 'S7' }
    ],
    finishMarker: 'S7',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 300,
    manoeuvre: 'bay'
  },

  quiz: [
    {
      id: 'd12q1',
      question: 'What should you do before you start reversing?',
      options: ['Check the interior mirror only', 'Use all your mirrors and check the blind spots behind you', 'Sound your horn', 'Switch your hazard lights on'],
      answer: 1,
      explain: 'Rule 202: use all your mirrors, check the blind spot behind you, and look for pedestrians (particularly children), cyclists and obstructions.',
      rules: [202]
    },
    {
      id: 'd12q2',
      question: 'While reversing, where should you mainly be looking?',
      options: ['At the dashboard', 'Through the rear window, checking all around', 'In the door mirrors only', 'Straight ahead'],
      answer: 1,
      explain: 'Rule 202: reverse slowly while checking all around and looking mainly through the rear window. Remember the front swings out as you turn.',
      rules: [202]
    },
    {
      id: 'd12q3',
      question: 'Using a driveway, which is the safer way to do it?',
      options: ['Drive in, reverse out', 'Reverse in, drive out', 'It makes no difference', 'Reverse in and out'],
      answer: 1,
      explain: 'Rule 201: when using a driveway, reverse in and drive out if you can. Never reverse from a side road into a main road.',
      rules: [201]
    },
    {
      id: 'd12q4',
      question: 'How far may you reverse?',
      options: ['As far as you like', 'No further than necessary', 'Up to 100 metres', 'Only in car parks'],
      answer: 1,
      explain: 'Rule 203: you MUST NOT reverse your vehicle further than necessary.',
      rules: [203]
    },
    {
      id: 'd12q5',
      question: 'You’ve parallel parked on the road. Which is correct?',
      options: ['Facing against the traffic flow is fine', 'Close to the kerb, facing the direction of traffic', 'Half on the pavement', 'Leave the engine running'],
      answer: 1,
      explain: 'Rule 239: don’t park facing against the traffic flow, stop as close as you can to the side, and switch off the engine and apply the handbrake before leaving the vehicle.',
      rules: [239]
    }
  ]
};
