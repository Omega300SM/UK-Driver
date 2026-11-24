import type { LessonContent } from '../schema';
import { MT_STARTS, R1, R2, M1, MAGIC, rbArc, route } from '../../world/scenes/millTownLayout';

/**
 * Day 9 — Roundabouts II: lane choice on a two-lane roundabout, spiral
 * markings, long vehicles and cyclists (rules 184–187), then a lap of the
 * Magic Roundabout, a ring of mini-roundabouts treated one at a time
 * (rules 188–190).
 */
const [MN, ME, MW] = MAGIC;

/** R2 from the west in the left-hand lane of the flare. */
const r2LeftLane = (to: string): Array<[number, number]> => {
  const arc = rbArc(R2, 'W', to);
  return [[arc[0][0], -5.7], ...arc.slice(1)];
};

const GUIDED_ROUTE = route(
  [
    [100, -1.9],
    [172, -1.9]
  ],
  rbArc(R2, 'W', 'N'),
  [
    [201.9, 174],
    [200.8, 180.4],
    [196, 181.9],
    [12, 181.9]
  ],
  rbArc(M1, 'E', 'S'),
  [[-1.9, 30]],
  rbArc(R1, 'N', 'E'),
  [
    [30, -1.9],
    [138, -1.9],
    [148, -5.7]
  ],
  r2LeftLane('S'),
  [
    [198.1, -40],
    [197.35, -86]
  ]
);

const TEST_ROUTE = route(
  [
    [198.1, -60],
    [198.1, -160]
  ],
  rbArc(MN, 'N', 'E'),
  [
    [234, -176.9],
    [238.1, -181]
  ],
  rbArc(ME, 'N', 'S'),
  [
    [238.1, -250],
    [234, -253.1],
    [166, -253.1],
    [161.9, -249]
  ],
  rbArc(MW, 'S', 'N'),
  [
    [161.9, -181],
    [166, -176.9]
  ],
  rbArc(MN, 'W', 'N'),
  [
    [201.9, -120],
    [202.65, -86]
  ]
);

export const day09: LessonContent = {
  day: 9,
  world: 2,
  title: 'Roundabouts II (and the magic one)',
  subtitle: 'Mill Town: lanes, spirals, and the Magic Roundabout',
  sceneId: 'millTown',
  checks: 'millTown',
  rules: [184, 186, 187, 188, 189, 190],
  badge: 'magic-circle',

  briefing: [
    {
      title: 'Two lanes: pick early',
      say: 'Bigger roundabouts have more than one lane. Pick yours early, using the map sign. Turning left, first exit: left-hand lane. Turning right: right-hand lane. Going straight on: usually the left lane, unless the markings say otherwise. Rule one-eight-six.',
      points: ['Left: left lane, signal left', 'Right: right lane, signal right', 'Ahead: left lane unless markings say otherwise'],
      diagram: 'roundabout-lanes',
      signs: [{ kind: 'roundabout-map', map: { exits: [{ rel: -90, label: 'Southway' }, { rel: 0, label: 'Mill Rd E' }, { rel: 90, label: 'Ringway' }] } }]
    },
    {
      title: 'Spiral markings',
      say: 'The Ringway roundabout has spiral markings. The lane lines curl outwards, so if you stay in your lane they lead you to your exit. Follow the lines, and don’t cut across them. Check your left mirror before you move out to leave.',
      points: ['Follow your lane round', 'The lines lead you to your exit', 'Left mirror before you leave'],
      diagram: 'roundabout-lanes'
    },
    {
      title: 'Share the roundabout',
      say: 'Watch out for cyclists and horse riders: they may stay in the left lane even when going right, signalling right. Give them plenty of room. Long lorries may take a different line and need both lanes. Hang back. Rules one-eight-six and one-eight-seven.',
      points: ['Cyclists may stay left while going right', 'Give long vehicles room: they may use both lanes', 'Watch for pedestrians on the exits'],
      diagram: 'none'
    },
    {
      title: 'The Magic Roundabout',
      say: 'Now for the famous one. Our Magic Roundabout is a ring of mini-roundabouts. It looks frightening, but the trick is simple: treat each one separately. Give way to the right at each, go round the painted circle, and take it one at a time. Rules one-eight-nine and one-ninety.',
      points: ['Treat each mini separately', 'Give way to the right at each one', 'Round the paint, never over it'],
      diagram: 'magic',
      signs: [{ kind: 'mini-roundabout' }]
    }
  ],

  guided: {
    intro: 'We’re on Mill Road, heading for the big Ringway roundabout. Belt on. Off we go.',
    parked: true,
    start: MT_STARTS.millEast(100),
    traffic: 'light',
    hint: GUIDED_ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. The map sign says the Ringway is the third exit, right. So we want the right-hand lane. Mirror first.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Signal right, and stay in the right-hand lane.', await: 'signal.right', highlight: 'stalk' },
      { say: 'Slow down for the give way line.', await: 'zone.r2-approach-w', highlight: 'brake' },
      { say: 'Look right. Wait for a gap.', await: 'look.right', highlight: 'look-right' },
      { say: 'Go when it’s clear. Keep to the inside: the spiral will lead us out.', await: 'rbEnter.R2', nudge: 'Go when nothing is coming from your right.' },
      { say: 'Past the second exit: left mirror, and signal left.', await: 'signal.left', highlight: 'stalk', nudge: 'Signal left after the exit before ours.' },
      { say: 'And out onto the Ringway.', await: 'rbExit.R2' },
      { say: 'Follow the Ringway round to the mini-roundabout. We’ll turn right this time, onto Canal Street. Mirror, signal right.', await: 'signal.right', highlight: 'stalk', nudge: 'Signal right for the mini-roundabout.' },
      { say: 'Look right, then go round the paint.', await: 'rbExit.M1', highlight: 'look-right' },
      { say: 'Down Canal Street to the Mill Road roundabout. Right again: third exit. One lane here, so keep to the right of it.', await: 'zone.r1-approach-n' },
      { say: 'Look right and go when it’s clear.', await: 'rbEnter.R1', highlight: 'look-right' },
      { say: 'Signal left after the exit before ours.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Out we go, back onto Mill Road.', await: 'rbExit.R1' },
      { say: 'Back to the Ringway roundabout, and the first exit this time, to Southway. So: left-hand lane. Mirror, signal left, and move into it.', await: 'zone.r2-left-lane', highlight: 'stalk', nudge: 'Move into the left-hand lane for the first exit.' },
      { say: 'Look right, and keep left round the roundabout, still signalling left.', await: 'rbExit.R2', highlight: 'look-right' },
      { say: 'Pull up on the left at the marker.', await: 'stoppedAt.SW2', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Right lane for right, left lane for left. You read that roundabout like a book.'
  },

  free: {
    intro: 'Free drive. Practise your lanes at the Ringway roundabout, then head down Southway and try the Magic Roundabout. Tap Test when you’re ready.',
    start: MT_STARTS.southwaySouth(-86),
    parked: true,
    traffic: 'light',
    hint: TEST_ROUTE,
    hints: [
      'At the Magic Roundabout, treat each mini-roundabout separately. Rules 189 and 190.',
      'Give way to traffic from your right at every mini.',
      'Turning right on a two-lane roundabout: right-hand lane, signal right. Rule 186.',
      'Spiral markings lead you to your exit if you stay in your lane.',
      'Cyclists may stay in the left lane while going right. Give them room.'
    ]
  },

  test: {
    intro: 'Test drive: the Magic Roundabout. We’re on Southway. Move off when it’s safe.',
    start: MT_STARTS.southwaySouth(-60),
    parked: true,
    traffic: 'light',
    hint: TEST_ROUTE,
    directions: [
      { at: { x0: 194, x1: 200, z0: -100, z1: -40 }, say: 'Follow the road ahead to the Magic Roundabout. At the first mini-roundabout, turn right.' },
      { at: { x0: 212, x1: 236, z0: -180, z1: -170 }, say: 'Follow the ring round. At the next mini-roundabout, go straight on.' },
      { at: { x0: 234, x1: 244, z0: -248, z1: -228 }, say: 'Follow the ring round. At the next mini-roundabout, straight on again.' },
      { at: { x0: 156, x1: 166, z0: -205, z1: -185 }, say: 'At the next mini-roundabout, turn right, back up Southway. Then pull up on the left at the marker.', marker: 'SW1' }
    ],
    finishMarker: 'SW1',
    finishSay: 'One lap of the Magic Roundabout. Secure the car, please.',
    timeLimitS: 480,
    pullUp: true
  },

  quiz: [
    {
      id: 'd9q1',
      question: 'You’re turning right at a two-lane roundabout. Which lane should you normally approach in?',
      sign: { kind: 'roundabout-map', map: { exits: [{ rel: -90, label: 'Southway' }, { rel: 0, label: 'Mill Rd E' }, { rel: 90, label: 'Ringway' }] } },
      options: ['The left-hand lane', 'The right-hand lane', 'Either lane, it doesn’t matter', 'Straddle both lanes'],
      answer: 1,
      explain: 'Rule 186: when taking an exit to the right, signal right and approach in the right-hand lane, keeping to the right on the roundabout until you need to change lanes to exit.',
      rules: [186]
    },
    {
      id: 'd9q2',
      question: 'A cyclist on the roundabout is in the left lane but signalling right. What should you do?',
      options: ['Sound your horn', 'Overtake them on the left', 'Give them plenty of room: they may be going right', 'Assume they’ve made a mistake'],
      answer: 2,
      explain: 'Rules 186 and 187: cyclists and horse riders may stay in the left lane when they intend to continue round the roundabout. Give them plenty of room and priority.',
      rules: [186, 187]
    },
    {
      id: 'd9q3',
      question: 'A long lorry is approaching the roundabout alongside you. Why should you hang back?',
      options: ['Lorries always have priority', 'It may need to take a different course and use more than one lane', 'It’s the law to stay behind lorries', 'You shouldn’t: overtake it quickly'],
      answer: 1,
      explain: 'Rule 187: long vehicles may have to take a different course on the approach or on the roundabout, and may need more than one lane. Watch out for their signals.',
      rules: [187]
    },
    {
      id: 'd9q4',
      question: 'How should you deal with a series of mini-roundabouts, like the Magic Roundabout?',
      sign: { kind: 'mini-roundabout' },
      options: ['Treat the whole thing as one big roundabout', 'Treat each mini-roundabout separately and follow the normal rules', 'Give way to traffic from the left', 'Drive across the painted circles to save time'],
      answer: 1,
      explain: 'Rules 189 and 190: at double or multiple mini-roundabouts, treat each one separately and give way to traffic from the right.',
      rules: [189, 190]
    },
    {
      id: 'd9q5',
      question: 'On a roundabout with spiral markings, what do the lane lines do?',
      options: ['Nothing: they’re decoration', 'Lead you to your exit if you stay in your lane', 'Show where to park', 'Mark a cycle lane'],
      answer: 1,
      explain: 'Spiral markings guide you to your exit as you follow your lane round, so you don’t need to cut across other traffic. Rule 184: get into the correct lane and follow it.',
      rules: [184]
    }
  ]
};
