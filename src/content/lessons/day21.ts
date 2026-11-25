import type { LessonContent, ScriptedCar } from '../schema';
import { DV_STARTS, DV_HEADINGS, CX, AH, OKEMENT, nbLane, rbPath, Z, NB3, LW } from '../../world/scenes/devonLayout';
import { COMBE_ROUTE } from './day15';

/**
 * Day 21 — BOSS: the Run to the Coast. Ashcombe to Seaview in the rain:
 * Combe Lane, the A386, Okement Cross, the A30, the M5 (past junction 1's
 * joining traffic and through the smart section's red X), and off at
 * junction 3 for the sea.
 */
const L1 = NB3 - LW / 2;
const L2 = NB3 - 1.5 * LW;
const EXIT = NB3 + LW / 2;
const ROUTE: Array<[number, number]> = [
  ...COMBE_ROUTE.slice(0, 13),
  [CX + AH / 2, 905],
  [CX + AH / 2, 2420],
  ...rbPath(OKEMENT, 'S', 'N'),
  [nbLane(1), 2520],
  [nbLane(1), Z.smartStart],
  [nbLane(1), 6760],
  [L2, 6840],
  [L2, Z.closed1 + 30],
  [L1, Z.closed1 + 80],
  [L1, Z.j3Exit + 10],
  [EXIT, Z.j3Exit + 80],
  [EXIT, Z.seaview - 6],
  [EXIT + 6, Z.seaview - AH / 2],
  [830, Z.seaview - AH / 2],
  [840, Z.seaview - AH + 1.15]
];

/** The van coming down Combe Lane. */
const VAN: ScriptedCar = { when: { x0: 610, x1: 630, z0: 478, z1: 500 }, from: { x: 620, z: 770, heading: DV_HEADINGS.S }, speed: 6.5, colour: 0xe8e4da };

export const day21: LessonContent = {
  day: 21,
  world: 3,
  title: 'BOSS: Motorway Run to the Coast',
  subtitle: 'Ashcombe to Seaview in the rain: lane, A road, dual carriageway and motorway',
  sceneId: 'devon',
  checks: 'devon',
  boss: true,
  badge: 'coast-runner',
  rules: [154, 155, 126, 227, 137, 259, 264, 258, 261, 273],

  briefing: [
    {
      title: 'The Run to the Coast',
      say: 'End of week three, and we’re off to the seaside. Ashcombe to Seaview, in the rain: the lane, the A road, the dual carriageway and the motorway. No guided drive, no hints, marked like a real test. Wipers and lights on, keep your gaps big, and enjoy it: this is what driving’s for.',
      points: ['No guided drive, no hints', 'Rain: double your gaps', 'Lane, A road, dual carriageway, motorway'],
      diagram: 'devon-run'
    },
    {
      title: 'What’s on the route',
      say: 'Combe Lane with a van to meet, then left onto the A386 and straight over Okement Cross onto the A30. It becomes the M5: keep left, and give room to traffic joining at junction one. Through the smart section, obey the gantries and the red X, then leave at junction three and pull up in Seaview.',
      points: ['Passing places on the lane', 'Keep left; room for joining traffic', 'Gantries, red X, exit 3'],
      diagram: 'none',
      signs: [{ kind: 'passing-place' }, { kind: 'motorway' }, { kind: 'countdown', value: 3 }]
    }
  ],

  test: {
    intro: 'This is the Run to the Coast. It’s raining: wipers and dipped headlights, please. Then move off when you’re ready, and follow Combe Lane.',
    start: DV_STARTS.ashcombe(),
    parked: true,
    traffic: 'light',
    scripted: [VAN],
    conditions: { weather: 'rain' },
    hint: ROUTE,
    directions: [
      { at: { x0: 795, x1: 806, z0: 20, z1: 60 }, say: 'Follow the lane all the way, please.' },
      { at: { x0: 440, x1: 560, z0: 896, z1: 904 }, say: 'At the end of the lane, turn left onto the A386.' },
      { at: { x0: CX, x1: CX + AH, z0: 2200, z1: 2330 }, say: 'At the roundabout, follow the road ahead: second exit, the A30.' },
      { at: { x0: 401, x1: 409, z0: 3400, z1: 3560 }, say: 'Follow the road onto the M5, and stay on it past junctions 1 and 2.' },
      { at: { x0: 401, x1: 413, z0: 7320, z1: 7380 }, say: 'Leave at junction 3, for Seaview.' },
      { at: { x0: NB3 + LW, x1: 760, z0: Z.seaview - AH, z1: Z.seaview + AH }, say: 'Pull up on the left at the marker.', marker: 'SV1' }
    ],
    finishMarker: 'SV1',
    finishSay: 'Thank you. Secure the car, please. That’s the end of your test, and there’s the sea.',
    timeLimitS: 1100,
    pullUp: true
  },

  quiz: [
    {
      id: 'd21q1',
      question: 'You meet a car on a single-track road, and a passing place is on your left. What do you do?',
      sign: { kind: 'passing-place' },
      options: ['Wait opposite it', 'Pull into it', 'Flash your lights for them to reverse', 'Drive onto the verge'],
      answer: 1,
      explain: 'Rule 155: pull into a passing place on your left, or wait opposite one on your right.',
      rules: [155]
    },
    {
      id: 'd21q2',
      question: 'How far behind the vehicle in front should you be on a wet motorway?',
      options: ['One second', 'Two seconds', 'At least four seconds', 'Ten metres'],
      answer: 2,
      explain: 'Rules 126 and 227: at least two seconds on high-speed roads, at least doubled in the wet.',
      rules: [126, 227]
    },
    {
      id: 'd21q3',
      question: 'Traffic is joining the motorway from a slip road ahead. You’re in lane 1. What’s considerate?',
      options: ['Speed up to close the gap', 'If it’s safe, move to lane 2 or adjust your speed to let them in', 'Sound your horn', 'Brake hard'],
      answer: 1,
      explain: 'Rule 259 tells joiners to give priority to motorway traffic; good motorway drivers also make room when it’s safe, adjusting speed or moving over (rule 264: be aware of others and move over when safe).',
      rules: [259, 264]
    },
    {
      id: 'd21q4',
      question: 'A gantry shows a red X over lane 1 and 50 in red circles over the others. What must you do?',
      options: ['Stay in lane 1 at 50', 'Move out of lane 1 and keep to 50 mph or less', 'Stop on the hard shoulder', 'Ignore it if lane 1 looks clear'],
      answer: 1,
      explain: 'Rules 258 and 261: you MUST NOT drive in a lane closed by a red X, and you MUST NOT exceed a speed limit in a red circle.',
      rules: [258, 261]
    }
  ]
};
