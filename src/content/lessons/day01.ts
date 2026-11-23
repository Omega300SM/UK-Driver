import type { LessonContent } from '../schema';

/**
 * Day 1 — Cockpit drill and controls.
 * Setting: Little Ashby Leisure Centre car park on a quiet Sunday morning,
 * then a short run out onto Church Lane (20 mph).
 * Rules verified on gov.uk: 97, 99, 103, 112, 159, 160, 161, 239.
 */
export const day01: LessonContent = {
  day: 1,
  world: 1,
  title: 'Cockpit drill and controls',
  subtitle: 'Little Ashby Leisure Centre car park, Sunday 8am',
  sceneId: 'carPark',
  rules: [97, 99, 103, 159, 160, 161, 239],
  badge: 'belt-up',

  briefing: [
    {
      title: 'Hello, I’m Maggie',
      say:
        'Right then, hello! I’m Maggie Hale. Thirty-one years as an examiner, so there is very little you can do that I haven’t seen. Today we start at the very beginning: getting comfy, learning the controls, and moving off and stopping in a nice empty car park. No roads, no traffic, no pressure.',
      points: ['An empty car park, then a quiet lane', 'Learn the controls', 'Move off and stop safely'],
      diagram: 'none'
    },
    {
      title: 'The cockpit drill: DSSSM',
      say:
        'Every time you get in, we do the cockpit drill. Doors shut. Seat adjusted so you can press the pedals fully. Steering wheel within easy reach. Seat belt on, which is the law. And mirrors set so you can see behind you. Highway Code rules ninety-seven and ninety-nine.',
      points: ['Doors', 'Seat', 'Steering', 'Seat belt (it’s the law)', 'Mirrors'],
      diagram: 'dsssm'
    },
    {
      title: 'Pedals and the automatic',
      say:
        'Our car is an automatic, so just two pedals. Accelerator on the right, brake in the middle. P is Park, R is Reverse, D is Drive. Automatics creep forward on their own, so keep your foot on the brake until you mean to go. The handbrake holds the car when you’re parked.',
      points: ['Right pedal: accelerator', 'Middle pedal: brake', 'P · R · D', 'Automatics creep: cover the brake'],
      diagram: 'pedals'
    },
    {
      title: 'Mirrors, blind spots and MSM',
      say:
        'Before you move off, check your mirrors, then look over your shoulder for the blind spot, because mirrors don’t show everything. Signal if it would help anyone. Then go when it’s safe. That’s Mirror, Signal, Manoeuvre, rules one-five-nine and one-six-one. We’ll use it for the rest of your driving life.',
      points: ['Mirrors', 'Blind spot: look round', 'Signal if it helps anyone', 'Manoeuvre when safe'],
      diagram: 'msm'
    }
  ],

  drill: {
    intro: 'Let’s do the cockpit drill. Tap each one in order. DSSSM: Doors, Seat, Steering, Seat belt, Mirrors.',
    items: [
      { id: 'doors', label: 'Doors', say: 'First, doors. Give them a check.', done: 'Doors shut. Lovely.' },
      { id: 'seat', label: 'Seat', say: 'Now the seat. Slide it until you can press the pedals all the way down with a slight bend in your knee.', done: 'That’s comfy. Not too close, not too far.' },
      { id: 'steering', label: 'Steering', say: 'Steering wheel next. Wrists should rest on top of the wheel with your shoulders against the seat.', done: 'Perfect reach.' },
      { id: 'seatbelt', label: 'Seat belt', say: 'Seat belt. Not optional, I’m afraid. It’s the law, rule ninety-nine.', done: 'Click. Music to my ears.' },
      { id: 'mirrors', label: 'Mirrors', say: 'Finally, mirrors. Tap the interior mirror, then the left and right door mirrors.', done: 'All three set. Now you can see what’s behind you.' }
    ],
    outro: 'That’s the cockpit drill. Every single time, even if you’re only nipping to the shops.'
  },

  guided: {
    intro: 'Right then, let’s get moving. I’ll talk you through every step. The car’s in Park with the handbrake on.',
    steps: [
      { say: 'Seat belt on first, please.', await: 'seatbelt.on', highlight: 'belt' },
      { say: 'Press and hold the brake, the middle pedal.', await: 'brake.held', highlight: 'brake' },
      { say: 'Keeping your foot on the brake, select D for Drive.', await: 'gear.D', highlight: 'gear' },
      { say: 'Now release the handbrake. Keep holding the brake, automatics like to creep.', await: 'handbrake.off', highlight: 'handbrake' },
      { say: 'Check your interior mirror. Tap it.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'And your right door mirror.', await: 'mirror.right', highlight: 'mirror-right' },
      { say: 'Now the blind spot. Swipe right across the windscreen to look over your right shoulder.', await: 'shoulder.right', highlight: 'look-right', nudge: 'Swipe right on the road view, or tap the eye on the right.' },
      { say: 'Signal right to show you’re moving away from the side.', await: 'signal.right', highlight: 'stalk' },
      { say: 'Lovely. Ease off the brake and gently press the accelerator.', await: 'moving', highlight: 'accel' },
      { say: 'We’re moving! Cancel your signal now.', await: 'signal.off', highlight: 'stalk' },
      { say: 'Keep to the left and head for the trolley shelter. Follow the yellow marker.', await: 'marker.A', nudge: 'Steer with the wheel. Keep it slow, ten miles an hour is plenty.' },
      { say: 'We’ll pull up there. Mirror first, the interior one.', await: 'mirror.interior', highlight: 'mirror-interior' },
      { say: 'Signal left, to show you’re pulling in.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Now brake gently and stop in the yellow box.', await: 'stoppedAt.A', highlight: 'brake', nudge: 'Squeeze the brake gently and stop inside the yellow box.' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' },
      { say: 'Back into P for Park.', await: 'gear.P', highlight: 'gear' },
      { say: 'And cancel that signal.', await: 'signal.off', highlight: 'stalk' }
    ],
    outro: 'Lovely! That’s moving off and stopping. Honestly, that’s the bones of all driving.'
  },

  free: {
    intro: 'Have a little practice on your own. Move off, potter about, stop, and move off again. I won’t mark anything, I’ll just pipe up if I spot something. Tap Finish when you’re ready for your test.',
    hints: [
      'Before you move off: mirrors, blind spot, signal if it helps anyone. Rule 159.',
      'Check your mirror before you signal, not after. Rule 161.',
      'Keep your foot covering the brake. Automatics creep.',
      'Look where you want to go. The car tends to follow your eyes.',
      'Handbrake on and P when you stop for more than a moment.',
      'Small, smooth movements on the wheel. No need to wrestle it.'
    ]
  },

  test: {
    intro:
      'Right, this is your test drive. I’ll mark it like a real examiner. The car is in Park, handbrake on. Get yourself ready, and when it’s safe, move off and follow the car park round to the exit.',
    directions: [
      { atX: 16, say: 'At the end, carry straight on out onto Church Lane. It’s a twenty limit, so keep it gentle, and keep to the left.' },
      { atX: 72, say: 'Pull up on the left just by the post box, please, when it’s safe.' }
    ],
    finishMarker: 'B',
    finishSay: 'And secure the car for me: handbrake on and into Park.',
    timeLimitS: 300
  },

  quiz: [
    {
      id: 'd1q1',
      question: 'What does the cockpit drill DSSSM stand for?',
      options: [
        'Doors, Seat, Steering, Seat belt, Mirrors',
        'Drive, Signal, Steer, Stop, Move',
        'Doors, Speed, Signal, Seat belt, Manoeuvre',
        'Dashboard, Seat, Steering, Speed, Mirrors'
      ],
      answer: 0,
      explain:
        'Doors, Seat, Steering, Seat belt, Mirrors. Rule 97 says you should know where the controls are and have your seat and mirrors adjusted before setting off.',
      rules: [97]
    },
    {
      id: 'd1q2',
      question: 'Before moving off, what should you do?',
      options: [
        'Signal, then go straight away',
        'Use your mirrors, look round for blind spots, signal if necessary, then move off when safe',
        'Sound the horn so others know you’re coming',
        'Only check your interior mirror'
      ],
      answer: 1,
      explain: 'Rule 159: mirrors, look round to check the blind spots, signal if necessary, final look round, and move off only when safe.',
      rules: [159]
    },
    {
      id: 'd1q3',
      question: 'When should you check your mirrors?',
      options: [
        'Only when you hear something behind you',
        'After you’ve signalled',
        'Frequently, and in good time before you signal or change speed or direction',
        'Once at the start of a journey'
      ],
      answer: 2,
      explain: 'Rule 161: use your mirrors frequently, and in good time before you signal or change direction or speed. Mirrors – Signal – Manoeuvre.',
      rules: [161]
    },
    {
      id: 'd1q4',
      question: 'You are parked at the side of the road. When MUST you NOT use your horn?',
      options: [
        'While stationary on the road, unless another road user poses a danger',
        'At any time during the day',
        'Only on motorways',
        'When it’s raining'
      ],
      answer: 0,
      explain:
        'Rule 112: you MUST NOT use your horn while stationary on the road, or when driving in a built-up area between 11.30pm and 7am, except when another road user poses a danger.',
      rules: [112]
    }
  ]
};
