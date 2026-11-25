import type { LessonContent, ScriptedCar } from '../schema';
import { DV_STARTS, DV_HEADINGS, CX, AH } from '../../world/scenes/devonLayout';
import { COMBE_ROUTE } from './day15';

/**
 * Day 20 — Night driving and lights (rules 113–116, 115 dazzle). Combe Lane
 * and the A386 after dark: dipped and main beam, and dipping for others.
 */
/** Oncoming cars after dark: one on the lane, one on the A386. */
const NIGHT_LANE: ScriptedCar = { when: { x0: 610, x1: 630, z0: 478, z1: 500 }, from: { x: 620, z: 770, heading: DV_HEADINGS.S }, speed: 6.5, colour: 0xe8e4da };
const NIGHT_A386: ScriptedCar = { when: { x0: CX - 8, x1: CX + 8, z0: 905, z1: 940 }, from: { x: CX - AH / 2, z: 1260, heading: DV_HEADINGS.S }, speed: 18, colour: 0x9aa3ab };

export const day20: LessonContent = {
  day: 20,
  world: 3,
  title: 'Night driving and lights',
  subtitle: 'Devon: Combe Lane and the A386 after dark',
  sceneId: 'devon',
  checks: 'devon',
  rules: [113, 114, 115, 116, 155],

  briefing: [
    {
      title: 'Lights at night',
      say: 'Week three’s last lesson before the big run, and it’s dark. At night you MUST have your sidelights and number plate lights on, and you should use headlights on any road without street lights. Out here there are none, so headlights on before we move. Things look very different at night: distances are harder to judge, and you can only see as far as your lights reach. Rule one-one-three.',
      points: ['Headlights on unlit roads at night (rule 113)', 'Lights on before you move off', 'Drive so you can stop within the beam'],
      diagram: 'night-lights'
    },
    {
      title: 'Dipped and main beam',
      say: 'Main beam lights up the road far ahead: use it on empty, unlit roads. But you MUST NOT dazzle anyone, including walkers, cyclists and horse riders. Dip your lights as soon as you see an oncoming vehicle, and when you’re following someone. If you’re dazzled yourself, don’t look into the lights: slow down, or stop. Rules one-one-four and one-one-five.',
      points: ['Main beam on empty, dark roads', 'Dip for oncoming traffic and when following', 'Dazzled? Slow down or stop'],
      diagram: 'night-lights'
    },
    {
      title: 'Hazard lights',
      say: 'Hazard warning lights are for when you’re stopped and temporarily obstructing traffic. You MUST NOT use them while driving, except briefly on a motorway or unrestricted dual carriageway to warn of a hazard ahead. Rule one-one-six.',
      points: ['Hazards: stationary and obstructing', 'Not while driving (except briefly on motorways)', 'Never an excuse for bad parking'],
      diagram: 'none'
    }
  ],

  guided: {
    intro: 'It’s dark in Ashcombe. Let’s get the lights sorted before we go anywhere.',
    parked: true,
    start: DV_STARTS.ashcombe(),
    traffic: 'light',
    conditions: { time: 'night' },
    scripted: [NIGHT_LANE, NIGHT_A386],
    hint: COMBE_ROUTE,
    steps: [
      { say: 'Headlights on: dipped beam.', await: 'lights.dipped', highlight: 'lights' },
      { say: 'Brake, D, handbrake off. Mirrors and right shoulder.', await: 'look.right', highlight: 'look-right' },
      { say: 'Signal right and move off.', await: 'moving', highlight: 'accel' },
      { say: 'Cancel the signal. Nobody about, no street lights: main beam on, to see further.', await: 'lights.main', highlight: 'lights' },
      { say: 'Round the bend, slowly. Keep your speed so you can stop within the beam.', await: 'zone.combe-c' },
      { say: 'Headlights coming towards us! Dip your lights now.', await: 'lights.dipped', highlight: 'lights', nudge: 'Dip your headlights for the oncoming car.' },
      { say: 'And pull into the passing place on the left to let them by.', await: 'stoppedAt.PPC', highlight: 'brake' },
      { say: 'When they’ve gone, mirrors and right shoulder, and off we go. Main beam back on when it’s clear.', await: 'lights.main', highlight: 'lights' },
      { say: 'The A386 ahead. We’re turning left. Mirror, signal left.', await: 'signal.left', highlight: 'stalk' },
      { say: 'Look right, left and right, and go when it’s clear.', await: 'turned.left' },
      { say: 'Another car coming: dip your lights.', await: 'lights.dipped', highlight: 'lights', nudge: 'Dip for the oncoming car.' },
      { say: 'Pull into the lay-by on the left at the marker.', await: 'stoppedAt.LB1', highlight: 'brake' },
      { say: 'Handbrake on.', await: 'handbrake.on', highlight: 'handbrake' }
    ],
    outro: 'Dipping in good time is good manners and good safety. Well driven.'
  },

  free: {
    intro: 'Free drive at night. Practise main beam and dipping for oncoming cars. Tap Test when you’re ready.',
    start: DV_STARTS.ashcombe(),
    parked: true,
    traffic: 'light',
    conditions: { time: 'night' },
    scripted: [NIGHT_LANE, NIGHT_A386],
    hint: COMBE_ROUTE,
    hints: [
      'Headlights on unlit roads at night. Rule 113.',
      'Dip for oncoming traffic and when following someone. Rules 114 and 115.',
      'Tap the light button: off, dipped, main beam.',
      'Drive so you can stop within the distance your lights show.',
      'Dazzled? Slow down, and stop if you need to.'
    ]
  },

  test: {
    intro: 'Test drive at night. We’re in Ashcombe. Lights, then move off when you’re ready.',
    start: DV_STARTS.ashcombe(),
    parked: true,
    traffic: 'light',
    conditions: { time: 'night' },
    scripted: [NIGHT_LANE, NIGHT_A386],
    hint: COMBE_ROUTE,
    directions: [
      { at: { x0: 795, x1: 806, z0: 20, z1: 60 }, say: 'Follow the lane all the way, please.' },
      { at: { x0: 440, x1: 560, z0: 896, z1: 904 }, say: 'At the end of the lane, turn left onto the A386.' },
      { at: { x0: 398, x1: 405, z0: 960, z1: 1080 }, say: 'Pull into the lay-by on the left, at the marker.', marker: 'LB1' }
    ],
    finishMarker: 'LB1',
    finishSay: 'Thank you. Secure the car, please.',
    timeLimitS: 480,
    pullUp: true
  },

  quiz: [
    {
      id: 'd20q1',
      question: 'You’re driving at night on an unlit country road. Which lights should you use?',
      options: ['Sidelights only', 'Headlights', 'Fog lights', 'Hazard lights'],
      answer: 1,
      explain: 'Rule 113: use headlights at night, except on roads with lit street lighting.',
      rules: [113]
    },
    {
      id: 'd20q2',
      question: 'You’re on main beam and see an oncoming car. What should you do?',
      options: ['Keep main beam so you can see', 'Dip your headlights', 'Switch your lights off', 'Flash them to warn the driver'],
      answer: 1,
      explain: 'Rule 114: you MUST NOT use lights in a way that would dazzle other road users. Dip for oncoming traffic.',
      rules: [114]
    },
    {
      id: 'd20q3',
      question: 'You’re dazzled by oncoming headlights. What should you do?',
      options: ['Flash your lights back', 'Slow down, and stop if necessary', 'Speed up to get past', 'Look straight at the lights'],
      answer: 1,
      explain: 'Rule 115: slow down, and if necessary stop, if you are dazzled by oncoming headlights.',
      rules: [115]
    },
    {
      id: 'd20q4',
      question: 'When may you use hazard warning lights while driving?',
      options: ['When parking on double yellows', 'On a motorway or unrestricted dual carriageway, briefly, to warn of a hazard ahead', 'Whenever it rains', 'To say thank you'],
      answer: 1,
      explain: 'Rule 116: you MUST NOT use hazard lights while driving unless you are on a motorway or unrestricted dual carriageway and need to warn drivers behind of a hazard ahead.',
      rules: [116]
    }
  ]
};
