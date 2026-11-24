import type { LessonContent } from '../schema';
import { MT_STARTS, MT_HEADINGS } from '../../world/scenes/millTownLayout';

/**
 * Day 13 — Vulnerable road users: the hierarchy (H1–H3), pedestrians at
 * junctions, cyclists and horse riders (rules 163, 204–215), and a school
 * crossing patrol (rule 210). Ringway West, past St Anne's Primary School.
 */
const ROUTE: Array<[number, number]> = [
  [-110, 1.9],
  [-143, 1.9],
  [-146.5, 2.6],
  [-148.1, 6],
  [-148.1, 170],
  [-147.6, 174.6],
  [-145, 177.6],
  [-120, 178.1],
  [-108, 177.35]
];

/** Released as you turn into the Ringway. */
const BIKE = { when: { x0: -154, x1: -146, z0: 13, z1: 22 }, from: { x: -147.0, z: 30, heading: MT_HEADINGS.N }, speed: 3.5, kind: 'bike' as const };
const HORSE = { when: { x0: -154, x1: -146, z0: 13, z1: 22 }, from: { x: -147.2, z: 38, heading: MT_HEADINGS.N }, speed: 2.4, kind: 'horse' as const };

export const day13: LessonContent = {
  day: 13,
  world: 2,
  title: 'Vulnerable road users',
  subtitle: 'Mill Town: the Ringway, St Anne’s school, cyclists and a horse',
  sceneId: 'millTown',
  checks: 'millTown',
  rules: [901, 902, 903, 163, 204, 207, 208, 210, 211, 212, 213, 215],
  badge: 'good-neighbour',

  briefing: [
    {
      title: 'The hierarchy of road users',
      say: 'Since twenty twenty-two, the Highway Code has a hierarchy. Everyone must look out for each other, but the bigger and faster you are, the more responsibility you carry. In a car, that means us. Pedestrians, cyclists and horse riders come first. Rule H1.',
      points: ['Most harm possible = most responsibility (H1)', 'Pedestrians, cyclists and horse riders are most at risk', 'Children and older people may misjudge your speed'],
      diagram: 'hierarchy'
    },
    {
      title: 'People crossing at junctions',
      say: 'When you turn into or out of a side road, you should give way to people crossing it, or waiting to cross. They have priority. And don’t cut across a cyclist or horse rider going straight ahead: wait for them to pass. Rules H2 and H3.',
      points: ['Turning? People crossing the side road go first (H2)', 'Don’t cut across cyclists going ahead (H3)', 'Look before you turn: they’re easy to miss (rule 211)'],
      diagram: 'h2-junction'
    },
    {
      title: 'Passing cyclists and horses',
      say: 'Give cyclists at least a metre and a half when you pass at up to thirty, and more if you’re faster. Horses: slow to ten miles an hour or less, pass wide, at least two metres, and never rev or hoot. If there isn’t room, wait behind. Cyclists may ride in the middle of the lane on narrow roads, for their own safety. Rules one-six-three, two-one-two, two-one-three and two-one-five.',
      points: ['Cyclists: 1.5 m or more', 'Horses: under 10 mph, 2 m or more', 'No room? Wait behind'],
      diagram: 'passing-distances'
    },
    {
      title: 'Schools',
      say: 'Near schools, drive slowly and expect children to dash out. At twenty miles an hour a child you hit will very probably survive; at forty, they very probably won’t. When a school crossing patrol shows the Stop for children sign, you MUST stop. Rules two-oh-seven, two-oh-eight and two-ten.',
      points: ['Slow down near schools (rule 208)', 'Lollipop sign up? You MUST stop (rule 210)', 'Never stop on School Keep Clear zig-zags'],
      diagram: 'none',
      signs: [{ kind: 'warn-school' }]
    }
  ],

  guided: {
    intro: 'We’re on Mill Road. We’ll turn up the Ringway, past St Anne’s school. There’s a horse rider out this morning.',
    parked: true,
    start: MT_STARTS.millWest(-100),
    traffic: 'light',
    scripted: [HORSE],
    hint: ROUTE,
    steps: [
      { say: 'Brake, D, handbrake off.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. Next left is the Ringway. Mirror, signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'As you turn, look for anyone crossing the Ringway. People crossing the road we’re turning into go first. Rule H2.', await: 'turned.left', nudge: 'Give way to anyone crossing, then turn left.' },
      { say: 'A horse rider ahead. Slow right down, ten miles an hour or less. No revving.', await: 'passed.horse', nudge: 'When nothing’s coming, pass wide and slow: at least two metres. Otherwise wait behind.' },
      { say: 'Lovely, wide and slow. A school ahead, and a twenty limit. Watch for the crossing patrol.', await: 'zone.k1-approach-n' },
      { say: 'If the patrol steps out with the lollipop, you MUST stop. Wait until they’re back on the pavement.', await: 'line.K1-n', nudge: 'Wait for the patrol to step back, then go.' },
      { say: 'Follow the road round to the right, then pull up on the left at the marker. Mirror, signal.', await: 'stoppedAt.RW1', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'That’s driving like a good neighbour: patient with people, generous with space.'
  },

  free: {
    intro: 'Free drive. A cyclist and a horse rider are out on the Ringway, and school’s just finishing. Tap Test when you’re ready.',
    start: MT_STARTS.millWest(-100),
    parked: true,
    traffic: 'light',
    scripted: [BIKE, { ...HORSE, from: { ...HORSE.from, z: 120 } }],
    hint: ROUTE,
    hints: [
      'Cyclists: at least 1.5 m when passing at up to 30 mph. Rule 163.',
      'Horses: slow to 10 mph or less and leave 2 m. Rule 215.',
      'No room to pass safely? Wait behind.',
      'Turning? People crossing the side road go first. Rule H2.',
      'School crossing patrol sign up? You MUST stop. Rule 210.'
    ]
  },

  test: {
    intro: 'Test drive. We’re on Mill Road. Move off when you’re ready, and follow the road ahead.',
    start: MT_STARTS.millWest(-100),
    parked: true,
    traffic: 'light',
    scripted: [BIKE],
    hint: ROUTE,
    directions: [
      { at: { x0: -125, x1: -105, z0: 0, z1: 4 }, say: 'Take the next road on the left, the Ringway.' },
      { at: { x0: -154, x1: -146, z0: 44, z1: 70 }, say: 'Follow the road ahead, past the school.' },
      { at: { x0: -154, x1: -146, z0: 140, z1: 165 }, say: 'Follow the road round to the right, then pull up on the left at the marker.', marker: 'RW1' }
    ],
    finishMarker: 'RW1',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 420,
    pullUp: true
  },

  quiz: [
    {
      id: 'd13q1',
      question: 'Under the hierarchy of road users, who has the greatest responsibility to reduce danger?',
      options: ['Pedestrians', 'Cyclists', 'Those driving vehicles that can cause the most harm', 'Whoever is going fastest'],
      answer: 2,
      explain: 'Rule H1: those in charge of vehicles that can cause the greatest harm bear the greatest responsibility to take care and reduce the danger they pose to others.',
      rules: [901]
    },
    {
      id: 'd13q2',
      question: 'You’re turning left into a side road. Someone is waiting to cross it. What should you do?',
      options: ['Turn quickly before they step out', 'Give way to them', 'Sound your horn', 'Wave them back'],
      answer: 1,
      explain: 'Rule H2: at a junction you should give way to pedestrians crossing or waiting to cross a road into which or from which you are turning.',
      rules: [902]
    },
    {
      id: 'd13q3',
      question: 'As a guide, how much room should you leave when overtaking a cyclist at up to 30 mph?',
      options: ['At least 0.5 metres', 'At least 1 metre', 'At least 1.5 metres', 'Just enough not to touch'],
      answer: 2,
      explain: 'Rule 163: leave at least 1.5 metres when overtaking cyclists at speeds of up to 30 mph, and give them more space at higher speeds.',
      rules: [163]
    },
    {
      id: 'd13q4',
      question: 'How should you pass a horse rider?',
      options: ['Quickly, to get it over with', 'At under 10 mph, leaving at least 2 metres', 'Sound your horn first', 'Close, so you don’t cross the centre line'],
      answer: 1,
      explain: 'Rules 163 and 215: slow down to a maximum of 10 mph, be patient, and when it’s safe pass wide and slow, allowing at least 2 metres.',
      rules: [163, 215]
    },
    {
      id: 'd13q5',
      question: 'A school crossing patrol steps out holding a ‘Stop for children’ sign. What MUST you do?',
      options: ['Slow down and go round them', 'Stop', 'Sound your horn', 'Carry on if no children are on the crossing yet'],
      answer: 1,
      explain: 'Rule 210: you MUST stop when a school crossing patrol shows a ‘Stop for children’ sign.',
      rules: [210]
    }
  ]
};
