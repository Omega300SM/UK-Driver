import type { LessonContent } from '../schema';
import { DV_STARTS, Z, NB2, NB3, LW, AH } from '../../world/scenes/devonLayout';

/**
 * Day 19 — Motorways II: smart motorways (rules 255–258, 261, 269–271, 275).
 * All-lane running from junction 2, variable limits, a red X over a
 * broken-down van, an emergency area, and off at junction 3 for Seaview.
 */
const SLIP = NB2 + LW / 2;
const L1 = NB3 - LW / 2; // lane 1 with all-lane running
const L2 = NB3 - 1.5 * LW;
const EXIT = NB3 + LW / 2;
export const SMART_ROUTE: Array<[number, number]> = [
  [680, Z.j2Entry + AH / 2],
  [SLIP + 6, Z.j2Entry + AH / 2],
  [SLIP, Z.j2Entry + 6],
  [L1, Z.smartStart + 40],
  [L1, 6760],
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

export const day19: LessonContent = {
  day: 19,
  world: 3,
  title: 'Motorways II: smart motorways',
  subtitle: 'Devon: the M5 from junction 2 to Seaview',
  sceneId: 'devon',
  checks: 'devon',
  rules: [255, 257, 258, 261, 269, 270, 275],

  briefing: [
    {
      title: 'Smart motorways',
      say: 'Some motorways are smart motorways. Here the hard shoulder has become a permanent lane, called all-lane running. Overhead gantries show speed limits and lane signals for each lane. A speed in a red circle is the law: you MUST NOT go over it. Rules two-five-five, two-five-six and two-six-one.',
      points: ['All-lane running: no hard shoulder', 'Red-ringed speed on a gantry is mandatory (rule 261)', 'Signals can apply to one lane or all'],
      diagram: 'smart-motorway'
    },
    {
      title: 'Red X',
      say: 'A red X over a lane means it’s closed: there may be a broken-down car, or people, in it. You MUST NOT drive in a lane under a red X. A diagonal arrow before it tells you to move over. The lane opens again when you see a speed limit or END. Rule two-five-eight.',
      points: ['Red X: lane closed, you MUST NOT use it (rule 258)', 'Diagonal arrow: move over', 'Open again after a speed limit or END'],
      diagram: 'smart-motorway'
    },
    {
      title: 'If you break down',
      say: 'If something goes wrong, try to get to a place of relative safety: ideally leave at the next exit or services. On a smart motorway, use an emergency area: blue signs with an orange SOS phone, and orange surfacing. Hazard lights on. Emergency areas are for emergencies only. Rules two-seven-zero and two-seven-five.',
      points: ['Aim for an exit, services or an emergency area (rule 275)', 'Emergency areas: blue sign, orange SOS phone (rule 270)', 'Hazard lights on, get out on the side away from traffic'],
      diagram: 'none',
      signs: [{ kind: 'emergency-area' }]
    }
  ],

  guided: {
    intro: 'We’re on the B3215 at junction 2. We’ll join the smart motorway and leave at junction 3 for Seaview.',
    parked: true,
    start: DV_STARTS.j2Road(680),
    traffic: 'light',
    hint: SMART_ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off. Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal, and round to the left onto the slip road. This one carries straight on as lane one, so stay in your lane: no need to merge.', await: 'zone.smart' },
      { say: 'Watch the gantries. A speed in a red circle is mandatory. Sixty… now fifty. Check your speed.', await: 'zone.red-x' },
      { say: 'See the arrow over lane one? The lane is closed ahead. Mirrors, signal right, and move into lane two.', await: 'zone.lane2-smart', highlight: 'stalk', nudge: 'Move out of lane 1 before the red X.' },
      { say: 'There’s the red X, and the broken-down van. Never drive under a red X. Give them plenty of room.', await: 'zone.smart-end' },
      { say: 'National speed limit again, and all lanes open. Exit three is next: mirror, signal left, and move back to lane one.', await: 'signal.left', highlight: 'stalk' },
      { say: 'At the countdown markers, into the exit lane, and slow down. Check your speedo.', await: 'zone.j3-exit' },
      { say: 'Follow the slip road round to Seaview. Thirty limit: pull up on the left at the marker.', await: 'stoppedAt.SV1', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Gantries read, red X obeyed, and here’s the sea. Lovely.'
  },

  free: {
    intro: 'Free drive on the smart motorway. Watch the gantries. Tap Test when you’re ready.',
    start: DV_STARTS.j2Road(680),
    parked: true,
    traffic: 'light',
    hint: SMART_ROUTE,
    hints: [
      'A speed in a red circle on a gantry is the law. Rule 261.',
      'Red X: lane closed. You MUST NOT drive in it. Rule 258.',
      'A diagonal arrow means move over, the lane ahead is closing.',
      'Emergency areas are for emergencies only. Rule 270.',
      'Leaving: lane 1, signal at the countdown markers, slow down on the slip road.'
    ]
  },

  test: {
    intro: 'Test drive. We’re at junction 2. Join the motorway when it’s safe.',
    start: DV_STARTS.j2Road(680),
    parked: true,
    traffic: 'light',
    hint: SMART_ROUTE,
    directions: [
      { at: { x0: 440, x1: 640, z0: Z.j2Entry - AH, z1: Z.j2Entry + AH }, say: 'Join the M5 northbound, please.' },
      { at: { x0: 401, x1: 413, z0: 7320, z1: 7380 }, say: 'Leave at the next exit, junction 3, for Seaview.' },
      { at: { x0: NB3 + LW, x1: 760, z0: Z.seaview - AH, z1: Z.seaview + AH }, say: 'Pull up on the left at the marker.', marker: 'SV1' }
    ],
    finishMarker: 'SV1',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 480,
    pullUp: true
  },

  quiz: [
    {
      id: 'd19q1',
      question: 'A red X is shown above your lane on a smart motorway. What does it mean?',
      options: ['Slow down to 40 mph', 'The lane is closed: you MUST NOT drive in it', 'Lane open to buses only', 'End of the motorway'],
      answer: 1,
      explain: 'Rule 258: a red X identifies a closed lane in which people, stopped vehicles or other hazards may be present. You MUST NOT drive in a closed lane.',
      rules: [258]
    },
    {
      id: 'd19q2',
      question: 'A gantry shows 50 in a red circle. What does that mean?',
      options: ['Advisory speed', 'A mandatory speed limit', 'Minimum speed', 'Distance to the next exit'],
      answer: 1,
      explain: 'Rule 261: you MUST NOT exceed a speed limit displayed within a red circle on a sign.',
      rules: [261]
    },
    {
      id: 'd19q3',
      question: 'What’s an emergency area for?',
      sign: { kind: 'emergency-area' },
      options: ['A quick phone call', 'Emergencies only', 'A rest break', 'Overtaking lorries'],
      answer: 1,
      explain: 'Rule 270: emergency areas, marked by blue signs with an orange SOS telephone, MUST only be used in an emergency.',
      rules: [270]
    },
    {
      id: 'd19q4',
      question: 'Your car develops a problem on the motorway. Where’s the safest place to stop?',
      options: ['In lane 1', 'On the verge', 'A service area, or the next exit', 'Under a bridge'],
      answer: 2,
      explain: 'Rule 275: stop in a place of relative safety. On motorways the safest place is a service area; others include emergency areas and hard shoulders.',
      rules: [275]
    }
  ]
};
