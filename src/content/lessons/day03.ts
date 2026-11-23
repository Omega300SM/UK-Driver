import type { LessonContent, ScriptedCar } from '../schema';
import { STARTS, HEADINGS } from '../../world/scenes/townLayout';

/** Day 3 — Driving on the left: road position, steering and narrow roads. Mill Lane. */
const ROUTE: Array<[number, number]> = [
  [37.6, -42],
  [38.1, -100],
  [40.4, -111],
  [40.4, -125],
  [38.1, -136],
  [38.1, -158],
  [40.5, -165],
  [40.5, -190],
  [38.1, -200],
  [37.4, -268]
];

/** A car comes up Mill Lane just as you reach the parked cars on your side. */
const ONCOMING: ScriptedCar[] = [{ when: { x0: 30, x1: 50, z0: -125, z1: -108 }, from: { x: 41.9, z: -228, heading: HEADINGS.N }, speed: 7, colour: 0x2e5c8a }];

export const day03: LessonContent = {
  day: 3,
  world: 1,
  title: 'Driving on the left',
  subtitle: 'Mill Lane: parked cars, a narrow stretch, and oncoming traffic',
  sceneId: 'town',
  checks: 'town',
  rules: [152, 160, 163],

  briefing: [
    {
      title: 'Keep left',
      say: 'Here in England we drive on the left. Rule one-six-zero: keep to the left unless signs or markings say otherwise, or you’re passing something. As a rough guide, keep about a metre from the kerb. Too close and you’ll clip it; too far out and you’re in the way of oncoming traffic.',
      points: ['Keep to the left (rule 160)', 'About a metre from the kerb', 'Both hands on the wheel'],
      diagram: 'road-position'
    },
    {
      title: 'Steering',
      say: 'Look well ahead, where you want to go, and the car follows your eyes. Small, smooth movements on the wheel. On our screen, drag the wheel round and let it settle back. On right-hand bends, keep well to the left so you can see further round.',
      points: ['Look well ahead', 'Small, smooth steering', 'Keep left on right-hand bends'],
      diagram: 'none'
    },
    {
      title: 'Narrow roads and parked cars',
      say: 'When parked cars are on your side, the oncoming traffic has priority. Rule one-six-three: give way to oncoming vehicles before passing parked vehicles or other obstructions on your side. Hold back well before the gap so they can come through. Then pass with a door’s width of space, because car doors open and children step out. That’s rule one-five-two.',
      points: ['Obstruction on your side? You give way', 'Wait back from the gap', 'Leave a door’s width'],
      diagram: 'meeting'
    }
  ],

  guided: {
    intro: 'We’re on Mill Lane again, belt on. Today it’s all about where the car sits on the road. Move off when ready.',
    parked: true,
    start: STARTS.millSouth(-40),
    hint: ROUTE,
    scripted: ONCOMING,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Look over your right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right, and off we go.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal, and settle about a metre from the kerb.', await: 'signal.off', highlight: 'stalk' },
      { say: 'Parked car ahead on our left. Ease out and leave a door’s width.', await: 'zone.narrow', nudge: 'Steer out gently round the parked car, then back in.' },
      { say: 'More parked cars on our side, and a car coming towards us. They have priority. Slow down and wait well back.', await: 'stoppedAt.narrow', highlight: 'brake', nudge: 'Brake gently and wait before the parked cars. Let the blue car through.' },
      { say: 'Lovely, that’s right. Let them come through.', await: 'zone.narrow-passed', nudge: 'Once the blue car has passed, check your mirror and go round the parked cars.' },
      { say: 'Back in to the left. Pull up at the marker please. Mirror.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'And stop in the yellow box.', await: 'stoppedAt.S3', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Very good. You held back and let them through. That’s good manners and good driving.'
  },

  free: {
    intro: 'Have a go on your own. Keep left, mind the parked cars, and give way when they’re on your side. Tap the Test button when you’re happy.',
    start: STARTS.millSouth(-40),
    parked: true,
    hint: ROUTE,
    scripted: ONCOMING,
    hints: [
      'Keep about a metre from the kerb. Rule 160.',
      'Parked cars on your side? Oncoming traffic goes first. Rule 163.',
      'Wait back from the parked cars, not right next to them, so the other driver has room.',
      'Leave a door’s width when you pass parked cars. Rule 152.',
      'Look where you want to go, not at the kerb.'
    ]
  },

  test: {
    intro: 'Test drive. We’re on Mill Lane. Move off when it’s safe, and follow the road ahead.',
    start: STARTS.millSouth(-40),
    parked: true,
    hint: ROUTE,
    scripted: ONCOMING,
    directions: [
      { at: { x0: 30, x1: 50, z0: -205, z1: -190 }, say: 'Pull up on the left at the marker, please, just before the junction.', marker: 'S3' }
    ],
    finishMarker: 'S3',
    finishSay: 'And secure the car, please.',
    timeLimitS: 300,
    pullUp: true
  },

  quiz: [
    {
      id: 'd3q1',
      question: 'Once moving, where should you normally drive?',
      options: ['In the middle of the road', 'Keep to the left, unless signs or markings say otherwise', 'As close to the kerb as possible', 'Wherever there’s most space'],
      answer: 1,
      explain: 'Rule 160: keep to the left unless road signs or markings indicate otherwise, except when overtaking, turning right or passing parked vehicles or pedestrians in the road.',
      rules: [160]
    },
    {
      id: 'd3q2',
      question: 'There are parked cars on your side of the road and a car is coming towards you. What should you do?',
      options: ['Speed up to get past first', 'Flash your lights so they stop', 'Give way to the oncoming car before passing the parked cars', 'Sound your horn and carry on'],
      answer: 2,
      explain: 'Rule 163: give way to oncoming vehicles before passing parked vehicles or other obstructions on your side of the road.',
      rules: [163]
    },
    {
      id: 'd3q3',
      question: 'Why should you leave room when passing parked cars in a residential street?',
      options: ['To avoid scratching your paint', 'Doors may open and children may run out', 'It’s quicker', 'So you can read house numbers'],
      answer: 1,
      explain: 'Rule 152: in residential streets look out for car doors opening and children running out from between parked cars.',
      rules: [152]
    },
    {
      id: 'd3q4',
      question: 'On a right-hand bend, where should you position your car?',
      options: ['Keep well to the left', 'Move towards the centre line', 'Straddle the centre line', 'It doesn’t matter'],
      answer: 0,
      explain: 'Rule 160: keep well to the left on right-hand bends. You’ll see further round and avoid oncoming traffic.',
      rules: [160]
    }
  ]
};
