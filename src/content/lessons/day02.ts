import type { LessonContent } from '../schema';
import { STARTS } from '../../world/scenes/townLayout';

/** Day 2 — Moving off, stopping and the Mirror–Signal–Manoeuvre routine. Mill Lane, 30 mph. */
const MILL_ROUTE: Array<[number, number]> = [
  [37.6, -42],
  [37.4, -98],
  [39.9, -111],
  [39.9, -125],
  [37.5, -136],
  [37.4, -146]
];

export const day02: LessonContent = {
  day: 2,
  world: 1,
  title: 'Moving off, stopping and MSM',
  subtitle: 'Mill Lane, Little Ashby: a quiet residential street',
  sceneId: 'town',
  checks: 'town',
  rules: [103, 159, 161, 239, 243],

  briefing: [
    {
      title: 'Out on a real road',
      say: 'Right then, out of the car park and onto a real road. Mill Lane is quiet, with houses and parked cars. Today we practise the two things you’ll do on every single journey: moving off from the side of the road, and pulling up again. Get these smooth and everything else gets easier.',
      points: ['A quiet residential road', 'Move off from the kerb', 'Pull up safely on the left'],
      diagram: 'none'
    },
    {
      title: 'Moving off',
      say: 'Before moving off: interior mirror, right door mirror, then look over your right shoulder for the blind spot. Signal right if it would help anyone. If there’s a parked car in front, you’ll need a bit more steering, so check again just as you go. That’s rule one-five-nine.',
      points: ['Mirrors, then blind spot', 'Signal if it helps anyone', 'Behind a parked car? More steering, check again'],
      diagram: 'moveoff'
    },
    {
      title: 'Mirror, Signal, Manoeuvre',
      say: 'Mirror, Signal, Manoeuvre is the routine for every change of speed or direction. Mirror first, so you know what’s behind. Then signal, so others know your plan. Then do it. Signal after checking, never before. Rule one-six-one.',
      points: ['Mirror: what’s behind?', 'Signal: tell others', 'Manoeuvre: do it smoothly'],
      diagram: 'msm'
    },
    {
      title: 'A normal stop',
      say: 'To pull up: mirror, signal left, ease off and brake gently, and stop close and parallel to the kerb. Pick somewhere safe and legal: not on yellow lines, and never within ten metres of a junction. Then handbrake on and cancel your signal.',
      points: ['Mirror, signal left', 'Brake gently, early', 'Close and parallel to the kerb', 'Not within 10 m of a junction'],
      diagram: 'normal-stop'
    }
  ],

  guided: {
    intro: 'We’re parked on Mill Lane, belt on, in Park with the handbrake on. Let’s move off.',
    parked: true,
    start: STARTS.millSouth(-40),
    hint: MILL_ROUTE,
    steps: [
      { say: 'Foot on the brake.', await: 'brake.held', highlight: 'brake' },
      { say: 'Select D.', await: 'gear.D', highlight: 'gear' },
      { say: 'Handbrake off, keeping your foot on the brake.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Interior mirror.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Right door mirror.', await: 'mirror.right', highlight: 'mirror-right' },
      { say: 'And look over your right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right.', await: 'signal.right', highlight: 'stalk' },
      { say: 'All clear. Off we go, gently.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal once you’re moving.', await: 'signal.off', highlight: 'stalk' },
      { say: 'We’ll pull up at the yellow marker on the left. Mirror first.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Ease off and brake gently. Stop close to the kerb in the yellow box.', await: 'stoppedAt.S1', highlight: 'brake', nudge: 'Keep it slow. Aim to stop inside the yellow box, close to the kerb.' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' },
      { say: 'And cancel the signal.', await: 'signal.off', highlight: 'stalk' },
      { say: 'Now there’s a parked car just ahead, so we need more steering. Mirrors and blind spot.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right.', await: 'signal.right', highlight: 'stalk' },
      { say: 'Handbrake off, and steer out round the car, giving it plenty of room.', await: 'moving', highlight: 'handbrake' },
      { say: 'Back to the left once we’re past. Cancel the signal.', await: 'signal.off', highlight: 'stalk' },
      { say: 'Pull up at the next marker. Mirror.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Stop in the yellow box, nice and gentle.', await: 'stoppedAt.S2', highlight: 'brake' },
      { say: 'Handbrake on, signal off.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Lovely. Moving off and stopping, twice, on a real road. You’re a natural.'
  },

  free: {
    intro: 'Practise moving off and pulling up a few times along Mill Lane. I won’t mark anything. Tap the Test button when you’re ready.',
    start: STARTS.millSouth(-40),
    parked: true,
    hint: MILL_ROUTE,
    hints: [
      'Moving off: mirrors, right shoulder, signal if it helps, then go. Rule 159.',
      'Pulling up: mirror, signal left, brake gently, stop close to the kerb.',
      'Behind a parked car you need more steering. Check your blind spot just as you pull out.',
      'Cancel your signal once you’ve moved off or stopped. Rule 103.',
      'Don’t stop within 10 metres of a junction. Rule 243.'
    ]
  },

  test: {
    intro: 'Your test drive. We’re parked on Mill Lane. Get ready, and move off when it’s safe.',
    start: STARTS.millSouth(-40),
    parked: true,
    hint: MILL_ROUTE,
    directions: [
      { at: { x0: 30, x1: 50, z0: -80, z1: -50 }, say: 'Pull up on the left at the yellow marker, please.', marker: 'S1' },
      { at: { x0: 30, x1: 50, z0: -115, z1: -95 }, say: 'Thank you. Move off again when it’s safe, and pull up on the left at the next marker.', marker: 'S2' },
      { at: { x0: 30, x1: 50, z0: -165, z1: -140 }, say: 'Lovely. Last one: move off, and pull up on the left at the marker before the junction.', marker: 'S3' }
    ],
    finishMarker: 'S3',
    finishSay: 'And secure the car: handbrake on, into Park.',
    timeLimitS: 360,
    pullUp: true
  },

  quiz: [
    {
      id: 'd2q1',
      question: 'What is the correct order of the routine you use before changing speed or direction?',
      options: ['Signal, Mirror, Manoeuvre', 'Mirror, Signal, Manoeuvre', 'Manoeuvre, Signal, Mirror', 'Mirror, Manoeuvre, Signal'],
      answer: 1,
      explain: 'Mirrors – Signal – Manoeuvre. Use your mirrors in good time before you signal or change direction or speed (rule 161).',
      rules: [161]
    },
    {
      id: 'd2q2',
      question: 'You are moving off from the side of the road. When should you signal?',
      options: ['Always, for at least five seconds', 'Never: signals are only for junctions', 'If it would help another road user, after checking mirrors and blind spot', 'Only if there’s a car directly behind you'],
      answer: 2,
      explain: 'Rule 159: use all mirrors, look round for blind spots, signal if necessary, and move off only when it is safe.',
      rules: [159]
    },
    {
      id: 'd2q3',
      question: 'What is a blind spot?',
      options: ['A dirty patch on the windscreen', 'An area you can’t see in your mirrors, so you need to look round', 'The area directly in front of the bonnet', 'A dark section of road at night'],
      answer: 1,
      explain: 'Mirrors don’t cover all areas. Rule 159 tells you to look round to check the blind spots before moving off.',
      rules: [159]
    },
    {
      id: 'd2q4',
      question: 'Where should you NOT stop or park?',
      options: ['Close to the kerb on a quiet road', 'In a marked parking bay', 'Opposite or within 10 metres of a junction', 'Outside a house with no yellow lines'],
      answer: 2,
      explain: 'Rule 243: do not stop or park opposite or within 10 metres of a junction, except in an authorised parking space.',
      rules: [243]
    }
  ]
};
