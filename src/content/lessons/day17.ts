import type { LessonContent, ScriptedCar } from '../schema';
import { DV_STARTS, DV_HEADINGS, CX, AH, OKEMENT, nbLane, rbPath, NB2 } from '../../world/scenes/devonLayout';

/**
 * Day 17 — Dual carriageways and overtaking (rules 133, 137, 162–169).
 * Through Okement Cross roundabout onto the A30, past a lorry, and into a lay-by.
 */
const L1 = CX + AH / 2;
export const DUAL_ROUTE: Array<[number, number]> = [
  [L1, 2200],
  [L1, 2420],
  ...rbPath(OKEMENT, 'S', 'N'),
  [nbLane(1), 2520],
  [nbLane(1), 3280],
  [NB2 + 1.2, 3305],
  [NB2 + 1.4, 3330]
];

/** A slow lorry in lane 1, released as you leave the roundabout. */
export const LORRY: ScriptedCar = { when: { x0: CX - 30, x1: CX + 30, z0: 2440, z1: 2490 }, from: { x: nbLane(1), z: 2600, heading: DV_HEADINGS.N }, speed: 21, kind: 'lorry', colour: 0x1d4f9c };

export const day17: LessonContent = {
  day: 17,
  world: 3,
  title: 'Dual carriageways and overtaking',
  subtitle: 'Devon: Okement Cross and the A30',
  sceneId: 'devon',
  checks: 'devon',
  rules: [137, 133, 162, 163, 166, 167, 168],

  briefing: [
    {
      title: 'Dual carriageways',
      say: 'A dual carriageway has a central reservation between you and the oncoming traffic. The national speed limit for a car here is seventy. On a two-lane dual carriageway, stay in the left-hand lane. Use the right-hand lane to overtake or turn right, then move back to the left when it’s safe. Rule one-three-seven.',
      points: ['National speed limit: 70 mph', 'Keep to the left-hand lane (rule 137)', 'Right-hand lane: overtaking or turning right'],
      diagram: 'lane-discipline',
      signs: [{ kind: 'dual-ahead' }]
    },
    {
      title: 'Overtaking: is it safe?',
      say: 'Before you overtake: is the road clear far enough ahead? Is anyone already overtaking you? Is there a gap to pull back into? Never overtake approaching a bend, a junction, the brow of a hill, or anywhere you can’t see far enough to be sure. Rules one-six-two, one-six-six and one-six-seven.',
      points: ['Clear ahead, nobody overtaking you, a gap to return to', 'Not near bends, junctions or hill brows', 'Any doubt? Don’t'],
      diagram: 'none'
    },
    {
      title: 'Mirror, signal, move',
      say: 'Hang back from the vehicle you want to pass, especially a lorry, so you can see past it. Mirrors, signal right, a quick glance over your shoulder for the blind spot, then move out and pass briskly. Don’t cut in: move back once you can see the lorry in your interior mirror. Rules one-three-three, one-six-three and one-six-four.',
      points: ['Drop back from lorries to see past', 'Mirrors, signal, blind spot, move', 'Return when you can see it in your mirror'],
      diagram: 'overtake'
    }
  ],

  guided: {
    intro: 'We’re on the A386, just before Okement Cross roundabout. Off we go.',
    parked: true,
    start: DV_STARTS.a386North(2200),
    traffic: 'light',
    scripted: [LORRY],
    hint: DUAL_ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off. Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. At the roundabout, straight on: the second exit, onto the A30. Look right as we get there.', await: 'rbEnter.OK', highlight: 'look-right' },
      { say: 'Past the first exit: signal left to leave.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Onto the dual carriageway. Stay in the left-hand lane and build up speed. The limit here is seventy.', await: 'rbExit.OK' },
      { say: 'A lorry ahead. Hang back so you can see past it. When the right lane is clear: mirrors first.', await: 'mirror.interior', highlight: 'mirror-interior', nudge: 'Check your mirrors before overtaking.' },
      { say: 'Signal right, glance over your right shoulder, and move into the right-hand lane.', await: 'zone.dual-lane2', highlight: 'stalk', nudge: 'Signal right and move out when it’s clear.' },
      { say: 'Pass the lorry briskly. When you can see it in your interior mirror: signal left and move back.', await: 'zone.dual-lane1', highlight: 'mirror-interior', nudge: 'Move back to the left lane once you’re past and can see the lorry in your mirror.' },
      { say: 'Lovely: back in lane one. There’s a lay-by ahead on the left: mirror, signal, and pull in at the marker.', await: 'stoppedAt.LB2', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'A clean overtake and straight back to the left. That’s lane discipline.'
  },

  free: {
    intro: 'Free drive on the A30. Practise overtaking the lorry and moving back. Tap Test when you’re ready.',
    start: DV_STARTS.a386North(2200),
    parked: true,
    traffic: 'light',
    scripted: [LORRY],
    hint: DUAL_ROUTE,
    hints: [
      'Keep left on a dual carriageway; the right lane is for overtaking. Rule 137.',
      'Mirrors, signal, glance, move. Rule 133.',
      'Drop back from lorries to see past them. Rule 164.',
      'Move back when you can see the vehicle you passed in your interior mirror.',
      'Never overtake if there’s any doubt. Rule 166.'
    ]
  },

  test: {
    intro: 'Test drive. We’re on the A386 at Okement Cross. Move off when it’s safe.',
    start: DV_STARTS.a386North(2200),
    parked: true,
    traffic: 'light',
    scripted: [LORRY],
    hint: DUAL_ROUTE,
    directions: [
      { at: { x0: CX, x1: CX + AH, z0: 2250, z1: 2330 }, say: 'At the roundabout, follow the road ahead: second exit, the A30.' },
      { at: { x0: 401, x1: 409, z0: 2490, z1: 2560 }, say: 'Follow the dual carriageway. Overtake the lorry when it’s safe.' },
      { at: { x0: 401, x1: 409, z0: 3120, z1: 3240 }, say: 'Pull into the lay-by on the left, at the marker.', marker: 'LB2' }
    ],
    finishMarker: 'LB2',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 420,
    pullUp: true
  },

  quiz: [
    {
      id: 'd17q1',
      question: 'You’re on a two-lane dual carriageway. Which lane should you normally use?',
      sign: { kind: 'dual-ahead' },
      options: ['The right-hand lane', 'The left-hand lane', 'Either, whichever is emptier', 'The centre of both'],
      answer: 1,
      explain: 'Rule 137: on a two-lane dual carriageway stay in the left-hand lane. Use the right-hand lane for overtaking or turning right, then move back to the left when it’s safe.',
      rules: [137]
    },
    {
      id: 'd17q2',
      question: 'What should you do before changing lane to overtake?',
      options: ['Signal and go', 'Use your mirrors and, if necessary, take a quick sideways glance, then signal when safe', 'Sound your horn', 'Flash your headlights'],
      answer: 1,
      explain: 'Rule 133: use your mirrors and if necessary take a quick sideways glance so you won’t force anyone to change course or speed. When it’s safe, signal, then move over.',
      rules: [133]
    },
    {
      id: 'd17q3',
      question: 'Why should you drop back from a large lorry before overtaking it?',
      options: ['To save fuel', 'To get a better view of the road ahead, and so the driver can see you', 'It’s required by law', 'To make it go faster'],
      answer: 1,
      explain: 'Rule 164: drop back to increase your ability to see ahead and to let the driver of the large vehicle see you in their mirrors.',
      rules: [164]
    },
    {
      id: 'd17q4',
      question: 'Someone is overtaking you. What should you do?',
      options: ['Speed up', 'Keep a steady course and speed, slowing down if necessary to let them pass', 'Move towards the centre', 'Flash your lights'],
      answer: 1,
      explain: 'Rule 168: if a driver is trying to overtake you, maintain a steady course and speed, slowing down if necessary. Never obstruct them.',
      rules: [168]
    }
  ]
};
