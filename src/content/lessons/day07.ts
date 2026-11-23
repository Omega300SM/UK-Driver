import type { LessonContent, ScriptedCar } from '../schema';
import { STARTS, HEADINGS } from '../../world/scenes/townLayout';

/** Day 7 — BOSS: the Market Town Test. A long, marked drive using everything from Week 1. */
const ROUTE: Array<[number, number]> = [
  [42.4, -198],
  [41.9, -190],
  [41.9, -8],
  [40, -1],
  [33, 1.9],
  [-146, 1.9],
  [-154, 0.5],
  [-159, -3.5],
  [-161.9, -12],
  [-161.9, -290],
  [-158, -298.5],
  [-150, -301.9],
  [28, -301.9],
  [36, -300.6],
  [40.6, -296.5],
  [41.9, -290],
  [41.9, -246],
  [39.6, -241],
  [39.6, -228],
  [41.9, -222],
  [41.9, -8],
  [44, -3.2],
  [50, -1.9],
  [124, -1.9],
  [134, -0.6],
  [139.5, 3.5],
  [141.9, 12],
  [142.4, 38]
];

/** On the way back up Mill Lane, a car comes down towards the parked cars on its side. */
const SCRIPTED: ScriptedCar[] = [{ when: { x0: 38, x1: 46, z0: -292, z1: -272 }, from: { x: 38.1, z: -120, heading: HEADINGS.S }, speed: 7, colour: 0xb8352f }];

export const day07: LessonContent = {
  day: 7,
  world: 1,
  title: 'BOSS: Market Town Test',
  subtitle: 'A full drive round Little Ashby, marked like the real thing',
  sceneId: 'town',
  checks: 'town',
  boss: true,
  badge: 'market-town',
  rules: [159, 161, 163, 124, 129, 170, 171, 172, 179, 182, 243],

  briefing: [
    {
      title: 'The Market Town Test',
      say: 'Right then, end of week one, and it’s test day. No guided drive, no hints. Just you, me, and Little Ashby. I’ll give you directions as we go, and mark you exactly as I would have when I was an examiner: driving faults, serious faults and dangerous faults.',
      points: ['No guided drive, no hints', 'Marked like the real test', 'Directions from me as we go'],
      diagram: 'boss'
    },
    {
      title: 'What’s on the route',
      say: 'You’ll move off, emerge at give way junctions, and turn right across traffic. You’ll drive out of the twenty zone and past double white lines, then down Tannery Road, along Back Lane and back up Mill Lane, where you’ll meet parked cars and oncoming traffic. Then into Church Street to pull up. Take your time. Steady and safe beats fast every single time.',
      points: ['Junctions with traffic', 'Speed limit changes', 'Parked cars and meeting', 'A safe stop at the end'],
      diagram: 'none',
      signs: [{ kind: 'giveway' }, { kind: 'zone20-end' }, { kind: 'limit', value: 30 }, { kind: 'no-entry' }]
    }
  ],

  test: {
    intro: 'This is the Market Town Test. When you’re ready, move off, and follow the road to the end, then turn right.',
    start: STARTS.millNorth(-200),
    parked: true,
    traffic: 'light',
    scripted: SCRIPTED,
    hint: ROUTE,
    directions: [
      { at: { x0: -60, x1: 30, z0: -4, z1: 4 }, say: 'Follow the road ahead, please, out of town.' },
      { at: { x0: -125, x1: -100, z0: -4, z1: 4 }, say: 'Take the next road on the right: Tannery Road.' },
      { at: { x0: -170, x1: -150, z0: -160, z1: -100 }, say: 'Follow the road round at the bottom.' },
      { at: { x0: -120, x1: -40, z0: -306, z1: -294 }, say: 'Take the next road on the right: Mill Lane.' },
      { at: { x0: 36, x1: 48, z0: -120, z1: -60 }, say: 'At the end of the road, turn left.' },
      { at: { x0: 60, x1: 110, z0: -4, z1: 0 }, say: 'Take the next road on the right, Church Street, and pull up on the left at the marker.', marker: 'C1' }
    ],
    finishMarker: 'C1',
    finishSay: 'Thank you. Secure the car, please. That’s the end of your test.',
    timeLimitS: 600,
    pullUp: true
  },

  quiz: [
    {
      id: 'd7q1',
      question: 'Before moving off from the side of the road, you should…',
      options: ['Signal and go', 'Use all mirrors, look round for blind spots, signal if necessary, and go when safe', 'Sound your horn', 'Check only the interior mirror'],
      answer: 1,
      explain: 'Rule 159.',
      rules: [159]
    },
    {
      id: 'd7q2',
      question: 'What does this sign mean?',
      sign: { kind: 'nsl' },
      options: ['No entry', 'National speed limit applies', 'End of all restrictions', 'No stopping'],
      answer: 1,
      explain: 'White circle with a black diagonal stripe: the national speed limit applies (60 mph for cars on a single carriageway, rule 124).',
      rules: [124]
    },
    {
      id: 'd7q3',
      question: 'Parked cars are on the other side of the road, and an oncoming car is approaching them. Who should normally give way?',
      options: ['You should', 'The oncoming car, because the obstruction is on its side', 'Whoever is faster', 'Neither, both carry on'],
      answer: 1,
      explain: 'Rule 163 asks drivers to give way to oncoming vehicles before passing obstructions on their side. Here the obstruction is on their side. But never assume: be ready to slow down.',
      rules: [163]
    },
    {
      id: 'd7q4',
      question: 'Can you stop on a road marked with double white lines?',
      options: ['Yes, anywhere', 'Only to pick up or set down passengers, or to load or unload', 'Only at night', 'Only if the broken line is on your side'],
      answer: 1,
      explain: 'Rule 240: you MUST NOT stop or park on a road marked with double white lines, even if a broken line is on your side, except to pick up or set down passengers, or to load or unload goods.',
      rules: [240]
    },
    {
      id: 'd7q5',
      question: 'You’re turning right from a main road. An oncoming car is close. What do you do?',
      options: ['Turn quickly before it arrives', 'Wait just left of the centre line until there’s a safe gap', 'Flash your headlights and turn', 'Stop in the middle of the junction'],
      answer: 1,
      explain: 'Rule 180: wait until there is a safe gap between you and any oncoming vehicle, then make the turn without cutting the corner.',
      rules: [180]
    }
  ]
};
