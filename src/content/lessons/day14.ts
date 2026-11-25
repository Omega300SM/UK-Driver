import type { LessonContent } from '../schema';
import { MT_STARTS, R1, R2, rbArc, route } from '../../world/scenes/millTownLayout';

/**
 * Day 14 — BOSS: Rush Hour. A short, intense, marked drive through Mill Town
 * in busy traffic, against a 3-minute clock: a right exit at the Mill Road
 * roundabout, lane choice at the Ringway roundabout, a left turn past a bus
 * lane, the Bridge Street lights and box junction, a zebra and a pelican.
 */
const r2Left = rbArc(R2, 'W', 'S');
const ROUTE = route(
  [
    [-1.9, 115],
    [-1.9, 30]
  ],
  rbArc(R1, 'N', 'E'),
  [
    [30, -1.9],
    [138, -1.9],
    [148, -5.7]
  ],
  [[r2Left[0][0], -5.7], ...r2Left.slice(1)],
  [
    [198.1, -120],
    [197.4, -124.5],
    [194, -127.6],
    [188, -128.1],
    [8, -128.1],
    [3.4, -127.5],
    [1.9, -124],
    [1.9, -95],
    [2.65, -86]
  ]
);


export const day14: LessonContent = {
  day: 14,
  world: 2,
  title: 'BOSS: Rush Hour',
  subtitle: 'Three minutes through Mill Town at its busiest, marked like the real thing',
  sceneId: 'millTown',
  checks: 'millTown',
  boss: true,
  badge: 'roundabout-royalty',
  rules: [185, 186, 141, 174, 175, 195, 196],

  briefing: [
    {
      title: 'Rush Hour',
      say: 'End of week two, and it’s rush hour in Mill Town. Busy roads and people everywhere. No guided drive, no hints, and you’ve got three minutes to get to Station Road. I’ll give you directions and mark you like an examiner. Three minutes is plenty if you drive steadily: never rush a junction to beat the clock.',
      points: ['No guided drive, no hints', 'Three minutes on the clock', 'Busy traffic and pedestrians'],
      diagram: 'rush-hour'
    },
    {
      title: 'What’s on the route',
      say: 'Down Canal Street, right at the Mill Road roundabout, then left at the Ringway roundabout, in the correct lane. Down Southway, onto Canal Side past the bus lane, through the Bridge Street lights and their box, over a zebra and a pelican, and pull up on Station Road.',
      points: ['Two roundabouts: lanes and signals', 'Bus lane, lights and the box junction', 'A zebra and a pelican crossing'],
      diagram: 'none',
      signs: [{ kind: 'warn-roundabout' }, { kind: 'bus-lane' }, { kind: 'warn-signals' }, { kind: 'warn-pedestrians' }]
    }
  ],

  test: {
    intro: 'This is the Rush Hour test, and the clock is running: three minutes. We’re on Canal Street. Move off when it’s safe.',
    start: MT_STARTS.canalSouth(120),
    parked: true,
    traffic: 'busy',
    hint: ROUTE,
    directions: [
      { at: { x0: -4, x1: 0, z0: 70, z1: 112 }, say: 'At the roundabout, turn right: the third exit, towards the Ringway roundabout.' },
      { at: { x0: 40, x1: 120, z0: -4, z1: 4 }, say: 'At the next roundabout, take the first exit, Southway. Get into the left-hand lane.' },
      { at: { x0: 194, x1: 204, z0: -90, z1: -40 }, say: 'Take the next road on the left, Canal Side.' },
      { at: { x0: 130, x1: 186, z0: -130, z1: -122 }, say: 'At the traffic lights, go straight on, then follow the road round to the right.' },
      { at: { x0: -4, x1: 4, z0: -130, z1: -116 }, say: 'Pull up on the left at the marker, after the crossing.', marker: 'ST2' }
    ],
    finishMarker: 'ST2',
    finishSay: 'Thank you. Secure the car, please. That’s the end of your test.',
    timeLimitS: 180,
    timed: true,
    pullUp: true
  },

  quiz: [
    {
      id: 'd14q1',
      question: 'You’re taking the third exit (to the right) at a roundabout. How should you signal?',
      options: ['Left on approach', 'Right on approach, then left after passing the exit before yours', 'No signal at all', 'Right all the way round'],
      answer: 1,
      explain: 'Rule 186: signal right on the approach, keep to the right, and signal left after you have passed the exit before the one you want.',
      rules: [186]
    },
    {
      id: 'd14q2',
      question: 'The lights are green but the road beyond the yellow box is jammed. What should you do?',
      options: ['Enter the box and wait', 'Wait behind the stop line until your exit is clear', 'Sound your horn', 'Use the bus lane to get round'],
      answer: 1,
      explain: 'Rule 174: you MUST NOT enter the box until your exit road or lane is clear (unless turning right and only blocked by oncoming traffic).',
      rules: [174]
    },
    {
      id: 'd14q3',
      question: 'A pelican crossing shows flashing amber and a man is still crossing. What MUST you do?',
      options: ['Go: flashing amber means go', 'Give way to him', 'Sound your horn', 'Edge forward to hurry him'],
      answer: 1,
      explain: 'Rule 196: when the amber light is flashing, you MUST give way to any pedestrians on the crossing.',
      rules: [196]
    },
    {
      id: 'd14q4',
      question: 'Traffic is queuing past a bus lane that operates ‘at any time’. May you use it to get ahead?',
      options: ['Yes, if no bus is coming', 'No: keep out of it during its operating times', 'Yes, at under 20 mph', 'Only to overtake cyclists'],
      answer: 1,
      explain: 'Rule 141: unless otherwise indicated, you should not drive in a bus lane during its period of operation.',
      rules: [141]
    },
    {
      id: 'd14q5',
      question: 'Turning left into a side road, you see a pedestrian waiting to cross it. What should you do?',
      options: ['Turn before they step out', 'Give way to them', 'Flash your lights', 'Stop in the junction'],
      answer: 1,
      explain: 'Rule H2: at a junction you should give way to pedestrians crossing or waiting to cross a road into which or from which you are turning.',
      rules: [902]
    }
  ]
};
