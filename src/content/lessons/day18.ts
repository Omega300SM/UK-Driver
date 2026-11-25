import type { LessonContent } from '../schema';
import { DV_STARTS, Z, NB2, LW, nbLane, AH } from '../../world/scenes/devonLayout';

/**
 * Day 18 — Motorways I: joining, lane discipline, leaving (rules 253, 259–264,
 * 267–269, 273). Onto the M5 at J1, off at J2.
 */
const SLIP = NB2 + LW / 2;
export const M5_J1_J2: Array<[number, number]> = [
  [620, Z.j1 + AH / 2],
  [SLIP + 6, Z.j1 + AH / 2],
  [SLIP, Z.j1 + 6],
  [SLIP, Z.j1Solid + 60],
  [nbLane(1), Z.j1End - 40],
  [nbLane(1), Z.j2Exit + 20],
  [SLIP, Z.j2Exit + 90],
  [SLIP, Z.j2Link - 6],
  [SLIP + 6, Z.j2Link - AH / 2],
  [610, Z.j2Link - AH / 2],
  [620, Z.j2Link - AH + 1.15]
];

export const day18: LessonContent = {
  day: 18,
  world: 3,
  title: 'Motorways I',
  subtitle: 'Devon: onto the M5 at junction 1, off at junction 2',
  sceneId: 'devon',
  checks: 'devon',
  rules: [253, 259, 264, 267, 268, 269, 271, 273],

  briefing: [
    {
      title: 'Learners on motorways',
      say: 'Since twenty-eighteen, learners can drive on motorways, but only with an approved driving instructor in a car with dual controls. That’s me, and this car. Motorways are actually our safest roads: everyone’s going the same way, there are no junctions to cross, and no bikes or walkers. The national speed limit is seventy. Rule two-five-three.',
      points: ['Learners: only with an ADI and dual controls (rule 253)', 'National speed limit: 70 mph', 'One-way, no crossing traffic'],
      diagram: 'none',
      signs: [{ kind: 'motorway' }]
    },
    {
      title: 'Joining',
      say: 'You join from a slip road on the left. Traffic on the motorway has priority. Use the slip road to build up speed, check the traffic in lane one with mirrors and a glance over your right shoulder, signal right, and slot into a gap. Don’t cross the solid white line, and never use the hard shoulder. Rule two-five-nine.',
      points: ['Motorway traffic has priority', 'Match your speed to lane 1', 'Not across the solid line; never the hard shoulder'],
      diagram: 'motorway-join'
    },
    {
      title: 'On the motorway',
      say: 'Keep in the left-hand lane unless you’re overtaking, then come back when it’s safe. Overtake only on the right. Never stop on the carriageway or the hard shoulder except in an emergency, and never reverse. Missed your exit? Carry on to the next. Rules two-six-three to two-seven-one.',
      points: ['Keep left unless overtaking (rule 264)', 'Overtake on the right only (rules 267, 268)', 'No stopping, no reversing (rules 263, 271)'],
      diagram: 'lane-discipline'
    },
    {
      title: 'Leaving',
      say: 'Watch for the signs for your exit: one mile, half a mile, then the countdown markers at three hundred, two hundred and a hundred yards. Be in lane one well before. Signal left at about the three-hundred-yard marker, move into the exit lane, and slow down on the slip road. Check your speedo: fifty can feel like thirty after the motorway. Rule two-seven-three.',
      points: ['Lane 1 well before your exit', 'Signal left at the 300-yard marker', 'Slow down on the slip road, check the speedo'],
      diagram: 'none',
      signs: [{ kind: 'countdown', value: 3 }, { kind: 'countdown', value: 2 }, { kind: 'countdown', value: 1 }]
    }
  ],

  guided: {
    intro: 'We’re on the B3260 at junction 1. We’ll join the M5 northbound and leave at junction 2.',
    parked: true,
    start: DV_STARTS.j1Road(620),
    traffic: 'light',
    hint: M5_J1_J2,
    steps: [
      { say: 'Brake, D, handbrake off. Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. Follow the road round to the left, onto the slip road.', await: 'zone.j1-slip' },
      { say: 'Build up your speed. Check lane one: mirrors, and a glance over your right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right. When the line is broken and there’s a gap, move into lane one.', await: 'zone.m5-lane1', highlight: 'stalk', nudge: 'Match your speed to lane 1 and slot into a gap.' },
      { say: 'We’re on the motorway. Cancel the signal, settle in lane one, and build up to a steady speed.', await: 'speedAbove.55' },
      { say: 'Look for the exit two signs, and the countdown markers. At the three-hundred-yard marker: mirror and signal left.', await: 'signal.left', highlight: 'stalk', nudge: 'Signal left for the exit.' },
      { say: 'Move into the exit lane, then slow down. Check your speedo.', await: 'zone.j2-exit' },
      { say: 'Follow the slip road round to the left, then pull up on the left at the marker.', await: 'stoppedAt.J2L', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Your first motorway. Joined smoothly, kept left, left in good time. Brilliant.'
  },

  free: {
    intro: 'Free drive: join at junction 1 and practise lane discipline. Leave at junction 2 or carry on. Tap Test when you’re ready.',
    start: DV_STARTS.j1Road(620),
    parked: true,
    traffic: 'light',
    hint: M5_J1_J2,
    hints: [
      'Give priority to traffic already on the motorway, and match your speed. Rule 259.',
      'Don’t cross the solid white line from the slip road.',
      'Keep left unless overtaking. Rule 264.',
      'Never use the hard shoulder except in an emergency. Rule 269.',
      'Signal left at the 300-yard countdown marker for your exit. Rule 273.'
    ]
  },

  test: {
    intro: 'Test drive. We’re at junction 1 of the M5. Move off when it’s safe.',
    start: DV_STARTS.j1Road(620),
    parked: true,
    traffic: 'light',
    hint: M5_J1_J2,
    directions: [
      { at: { x0: 440, x1: 600, z0: Z.j1 - AH, z1: Z.j1 + AH }, say: 'Join the M5 northbound, please.' },
      { at: { x0: 401, x1: 409, z0: 4400, z1: 4600 }, say: 'Leave the motorway at the next junction, junction 2.' },
      { at: { x0: 412, x1: 500, z0: Z.j2Link - AH, z1: Z.j2Link + AH }, say: 'Pull up on the left at the marker.', marker: 'J2L' }
    ],
    finishMarker: 'J2L',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 480,
    pullUp: true
  },

  quiz: [
    {
      id: 'd18q1',
      question: 'You’re joining a motorway from a slip road. Who has priority?',
      sign: { kind: 'motorway' },
      options: ['You do', 'Traffic already on the motorway', 'Whoever is faster', 'Lorries only'],
      answer: 1,
      explain: 'Rule 259: give priority to traffic already on the motorway, and match your speed to fit safely into the flow in the left-hand lane.',
      rules: [259]
    },
    {
      id: 'd18q2',
      question: 'Which lane should you normally drive in on a motorway?',
      options: ['The right-hand lane', 'The middle lane', 'The left-hand lane, unless overtaking', 'Whichever is fastest'],
      answer: 2,
      explain: 'Rule 264: keep in the left lane unless overtaking, and return to it when it’s safe.',
      rules: [264]
    },
    {
      id: 'd18q3',
      question: 'You’ve missed your exit. What should you do?',
      options: ['Reverse along the hard shoulder', 'Stop and wait for a gap to turn round', 'Carry on to the next exit', 'Cross the central reservation'],
      answer: 2,
      explain: 'Rule 263: you MUST NOT reverse, cross the central reservation or drive against the traffic flow. If you’ve missed your exit, carry on to the next one.',
      rules: [263]
    },
    {
      id: 'd18q4',
      question: 'You see a sign with three diagonal white bars on a blue background. What does it mean?',
      sign: { kind: 'countdown', value: 3 },
      options: ['300 yards to the next exit', 'Three lanes ahead', 'Speed limit 30', 'Three miles to services'],
      answer: 0,
      explain: 'Countdown markers show 300, 200 and 100 yards to the start of the exit slip road (rule 273: watch for the signs letting you know you’re getting near your exit).',
      rules: [273]
    }
  ]
};
