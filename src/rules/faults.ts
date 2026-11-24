import type { Fault, Severity } from './types';

/**
 * Fault catalogue. Severities are game decisions modelled on DVSA marking
 * (see NEEDS_REVIEW.md). Messages are Maggie's words.
 */
export interface FaultDef {
  severity: Severity;
  category: string;
  message: string;
  rules: number[];
}

export const FAULTS = {
  'seatbelt-off': {
    severity: 'serious',
    category: 'Precautions – seat belt',
    message: 'We moved off without your seat belt on. That’s a legal requirement, so it’s a serious fault, I’m afraid. Belt first, always.',
    rules: [99]
  },
  'moveoff-mirrors': {
    severity: 'minor',
    category: 'Observation – moving off',
    message: 'You moved off without checking your mirrors first. A quick glance in the interior and right mirror before you go.',
    rules: [159, 161]
  },
  'moveoff-blindspot': {
    severity: 'minor',
    category: 'Observation – moving off',
    message: 'No look over your right shoulder before moving off. The blind spot is where cyclists love to hide.',
    rules: [159]
  },
  'signal-no-mirror': {
    severity: 'minor',
    category: 'Use of mirrors – signalling',
    message: 'You signalled before checking your mirror. It’s Mirror, then Signal: see what’s behind before you tell everyone your plans.',
    rules: [161]
  },
  'signal-not-cancelled': {
    severity: 'minor',
    category: 'Signals – cancel after use',
    message: 'Your indicator was left ticking away. A forgotten signal can mislead other people, so cancel it once you’re done.',
    rules: [103]
  },
  'handbrake-drive': {
    severity: 'minor',
    category: 'Control – parking brake',
    message: 'We tried to drive with the handbrake still on. I could smell it from here! Release it before moving off.',
    rules: [97]
  },
  'speed-minor': {
    severity: 'minor',
    category: 'Use of speed',
    message: 'A touch over the limit there. Keep an eye on the speedo, especially when you’re still getting the feel of the pedals.',
    rules: [126]
  },
  'speed-serious': {
    severity: 'serious',
    category: 'Use of speed',
    message: 'That was well over the limit for this area. Far too quick to stop for anyone stepping out.',
    rules: [126]
  },
  'kerb-minor': {
    severity: 'minor',
    category: 'Control – steering',
    message: 'We clipped the kerb. Not to worry, it happens to everyone. Look further ahead and make small steering movements.',
    rules: [160]
  },
  'kerb-serious': {
    severity: 'serious',
    category: 'Control – steering',
    message: 'We mounted the kerb at speed. That could have hurt someone on the pavement, so it’s a serious one.',
    rules: [160]
  },
  'collision-serious': {
    severity: 'serious',
    category: 'Control – steering',
    message: 'We gave that a little bump. Slow right down near obstacles and steer early.',
    rules: [126]
  },
  'collision-dangerous': {
    severity: 'dangerous',
    category: 'Control – collision',
    message: 'That was a proper collision, so I had to step in. Don’t worry, that’s exactly what car parks are for. Let’s look at what happened.',
    rules: [126]
  },
  'lane-position': {
    severity: 'minor',
    category: 'Positioning – normal driving',
    message: 'We drifted over the centre line. Keep to the left unless you’re passing something.',
    rules: [160]
  },
  'harsh-brake': {
    severity: 'minor',
    category: 'Control – footbrake',
    message: 'That was a bit of an emergency stop when we didn’t need one. Squeeze the brake gently and early.',
    rules: [126]
  },
  'horn-stationary': {
    severity: 'minor',
    category: 'Signals – horn',
    message: 'A toot while we were stationary. The horn is for warning others while you’re moving, not for saying hello.',
    rules: [112]
  },
  'turn-no-signal': {
    severity: 'minor',
    category: 'Signals – necessary',
    message: 'We turned without a signal. Even if you can’t see anyone, someone may be watching: a pedestrian, a cyclist, a car you haven’t spotted.',
    rules: [103, 182]
  },
  'turn-wrong-signal': {
    severity: 'minor',
    category: 'Signals – correctly',
    message: 'The indicator was showing the wrong way for that turn. A wrong signal is worse than none, because people act on it.',
    rules: [103]
  },
  'turn-no-mirror': {
    severity: 'minor',
    category: 'Use of mirrors – change direction',
    message: 'No mirror check before that turn. Mirrors first, every time: Mirror, Signal, Manoeuvre.',
    rules: [161, 179, 182]
  },
  'stop-not-stopped': {
    severity: 'serious',
    category: 'Junctions – stop sign',
    message: 'That was a STOP sign, and we rolled over the line. At a stop line the wheels MUST stop completely, even if the road looks clear.',
    rules: [171]
  },
  'junction-observation': {
    severity: 'minor',
    category: 'Junctions – observation',
    message: 'We emerged without a proper look both ways. Right, left, and right again before you commit.',
    rules: [170]
  },
  'junction-pulled-out': {
    severity: 'serious',
    category: 'Junctions – emerging',
    message: 'We pulled out in front of another car and made it slow down. Wait for a gap big enough that nobody has to change speed for you.',
    rules: [170, 172]
  },
  'junction-pulled-out-dangerous': {
    severity: 'dangerous',
    category: 'Junctions – emerging',
    message: 'We pulled out right in front of a car. That’s the kind of thing that causes real collisions, so I had to step in.',
    rules: [170, 172]
  },
  meeting: {
    severity: 'minor',
    category: 'Meeting traffic',
    message: 'The parked cars were on our side, so the oncoming car had priority. Hang back and let them through first.',
    rules: [163]
  },
  'meeting-serious': {
    severity: 'serious',
    category: 'Meeting traffic',
    message: 'We pulled out round the parked cars with another car coming straight at us. With an obstruction on your side, you give way.',
    rules: [163]
  },
  clearance: {
    severity: 'minor',
    category: 'Clearance – obstructions',
    message: 'We passed that parked car a bit close. Leave room for a door to open, about a car door’s width.',
    rules: [152]
  },
  'double-white': {
    severity: 'serious',
    category: 'Road markings',
    message: 'We crossed the double white lines where the line on our side was solid. You MUST NOT cross or straddle those.',
    rules: [129]
  },
  'no-entry': {
    severity: 'serious',
    category: 'Traffic signs',
    message: 'We drove into a No Entry road. Red circle, white bar: it’s an order, not a suggestion.',
    rules: [109]
  },
  progress: {
    severity: 'minor',
    category: 'Progress – appropriate speed',
    message: 'We were dawdling well under the limit on a clear road. Too slow holds others up and tempts them into silly overtakes. Make sensible progress.',
    rules: []
  },
  'park-double-yellow': {
    severity: 'serious',
    category: 'Normal stops',
    message: 'We pulled up on double yellow lines. They mean no waiting at any time.',
    rules: [238]
  },
  'park-single-yellow': {
    severity: 'minor',
    category: 'Normal stops',
    message: 'We pulled up on a single yellow line. Check the plate for the times; if you can’t see one, choose somewhere else.',
    rules: [238]
  },
  'park-junction': {
    severity: 'serious',
    category: 'Normal stops',
    message: 'We stopped within ten metres of a junction. That blocks other drivers’ view and their way in and out.',
    rules: [243]
  },
  'park-double-white': {
    severity: 'serious',
    category: 'Normal stops',
    message: 'We stopped on a road with double white lines. You MUST NOT stop or park there, except to pick up or drop off passengers or to load or unload.',
    rules: [240]
  },
  'park-kerb-far': {
    severity: 'minor',
    category: 'Normal stops',
    message: 'We stopped a long way out from the kerb. Pull in close and parallel to the side so others can pass.',
    rules: [239]
  },
  'rb-observation': {
    severity: 'minor',
    category: 'Roundabouts – observation',
    message: 'We joined the roundabout without a proper look to the right. Traffic from the right has priority, so that’s where your eyes go.',
    rules: [185]
  },
  'rb-pulled-out': {
    severity: 'serious',
    category: 'Roundabouts – give way',
    message: 'We pulled onto the roundabout in front of a car already on it. Give priority to traffic from your right.',
    rules: [185]
  },
  'rb-pulled-out-dangerous': {
    severity: 'dangerous',
    category: 'Roundabouts – give way',
    message: 'We pulled out right in front of a car on the roundabout. That would have been a collision, so I had to step in.',
    rules: [185]
  },
  'rb-signal-approach': {
    severity: 'minor',
    category: 'Roundabouts – signals',
    message: 'The signal on the approach didn’t match where we went. Left for the first exit, right for exits past twelve o’clock, usually none for straight on.',
    rules: [186]
  },
  'rb-signal-exit': {
    severity: 'minor',
    category: 'Roundabouts – signals',
    message: 'No left signal as we left the roundabout. Signal left after passing the exit before the one you want.',
    rules: [186]
  },
  'rb-lane': {
    severity: 'minor',
    category: 'Roundabouts – lane choice',
    message: 'Wrong lane for that exit. Left lane for left or ahead, right lane for right, unless the arrows say otherwise.',
    rules: [184, 186]
  },
  'rb-wrong-way': {
    severity: 'dangerous',
    category: 'Roundabouts – direction',
    message: 'We went the wrong way round the roundabout. Always go round with the island on your right.',
    rules: [184, 185]
  },
  'mini-centre': {
    severity: 'serious',
    category: 'Roundabouts – mini-roundabout',
    message: 'We drove over the painted centre of the mini-roundabout. You MUST pass round the central markings.',
    rules: [188]
  },
  'red-light': {
    severity: 'serious',
    category: 'Response to signals – traffic lights',
    message: 'We crossed the stop line on a red light. Red, and red with amber, both mean stop. Wait behind the line for green.',
    rules: [175, 176]
  },
  'amber-light': {
    severity: 'minor',
    category: 'Response to signals – traffic lights',
    message: 'The lights turned amber with plenty of room to stop, and we carried on. Amber means stop, unless you’re so close that stopping might cause a collision.',
    rules: [175]
  },
  'zebra-give-way': {
    severity: 'serious',
    category: 'Pedestrian crossings',
    message: 'Someone had stepped onto the zebra crossing and we didn’t stop. You MUST give way once a pedestrian is on the crossing.',
    rules: [195]
  },
  'zebra-waiting': {
    severity: 'minor',
    category: 'Pedestrian crossings',
    message: 'Somebody was waiting at the zebra and we drove on. Look out for people waiting, and be ready to slow down and let them cross.',
    rules: [195]
  },
  'crossing-ped': {
    severity: 'serious',
    category: 'Pedestrian crossings',
    message: 'There was still someone on the crossing when we drove over it. Give way to anyone still crossing, even if your light is green.',
    rules: [196, 198]
  },
  'crossing-ped-dangerous': {
    severity: 'dangerous',
    category: 'Pedestrian crossings',
    message: 'We drove across right where someone was walking. I had to step in there: that’s the most vulnerable person on the road.',
    rules: [195, 198]
  },
  'crossing-blocked': {
    severity: 'minor',
    category: 'Pedestrian crossings',
    message: 'We stopped on the crossing in the queue. Keep crossings clear: only go onto one if you can get right across.',
    rules: [192]
  },
  'box-junction': {
    severity: 'serious',
    category: 'Junctions – box junction',
    message: 'We stopped in the yellow box. You MUST NOT enter the box until your exit is clear, unless you’re turning right and only oncoming traffic is stopping you.',
    rules: [174]
  },
  'bus-lane': {
    severity: 'minor',
    category: 'Positioning – lane discipline',
    message: 'We drove along the bus lane while it was in operation. Keep out of bus lanes during their hours, unless the signs say you may use them.',
    rules: [141]
  },
  'park-zigzag': {
    severity: 'serious',
    category: 'Normal stops',
    message: 'We stopped on the zig-zag lines by the crossing. You MUST NOT stop or park there: it hides people crossing.',
    rules: [191, 240]
  },
  'reverse-observation': {
    severity: 'minor',
    category: 'Reverse parking – observation',
    message: 'We started reversing without a proper look all round. Mirrors and both shoulders first, then keep looking, mainly out of the back window.',
    rules: [202]
  },
  'park-accuracy': {
    severity: 'minor',
    category: 'Reverse parking – accuracy',
    message: 'We finished over the lines of the space. Take it slowly: a little shunt to straighten up is fine.',
    rules: [239]
  },
  'park-angle': {
    severity: 'minor',
    category: 'Reverse parking – control',
    message: 'We ended up at quite an angle in the space. Straighten up before you stop.',
    rules: [239]
  },
  'park-parallel-kerb': {
    severity: 'minor',
    category: 'Reverse parking – accuracy',
    message: 'We finished a long way out from the kerb. Aim to be close and parallel, about a drain cover’s width away.',
    rules: [239]
  },
  'pass-cyclist-close': {
    severity: 'serious',
    category: 'Clearance – cyclists',
    message: 'We passed that cyclist too close. Leave at least a metre and a half at up to 30 mph, and more when faster. If there isn’t room, wait behind.',
    rules: [163, 212]
  },
  'pass-cyclist-dangerous': {
    severity: 'dangerous',
    category: 'Clearance – cyclists',
    message: 'We squeezed right past that cyclist. Any wobble and we’d have hit them. I had to step in.',
    rules: [163, 212, 901]
  },
  'pass-horse': {
    severity: 'serious',
    category: 'Clearance – horse riders',
    message: 'We passed the horse rider too fast or too close. Slow to 10 mph or less and leave at least two metres. Horses can spook.',
    rules: [163, 215]
  },
  'patrol-stop': {
    severity: 'serious',
    category: 'Response to signals – school crossing patrol',
    message: 'The school crossing patrol was holding up the Stop for children sign. You MUST stop for that.',
    rules: [210]
  },
  'junction-ped': {
    severity: 'serious',
    category: 'Junctions – pedestrians',
    message: 'Someone was crossing the road we were turning into, and we didn’t give way. People crossing at a junction have priority.',
    rules: [902]
  },
  'junction-ped-waiting': {
    severity: 'minor',
    category: 'Junctions – pedestrians',
    message: 'Someone was waiting to cross the side road we turned into. Give way to people waiting to cross at a junction, too.',
    rules: [902]
  },
  'park-school': {
    severity: 'serious',
    category: 'Normal stops',
    message: 'We stopped on the School Keep Clear markings. Don’t stop or park near a school entrance: children need to see and be seen.',
    rules: [243]
  },
  'not-secured': {
    severity: 'minor',
    category: 'Control – securing the car',
    message: 'At the end, the car wasn’t secured. Handbrake on and into Park every time you stop for more than a moment.',
    rules: [239]
  }
} satisfies Record<string, FaultDef>;

export type FaultCode = keyof typeof FAULTS;

export function makeFault(code: FaultCode, t: number): Fault {
  const d: FaultDef = FAULTS[code];
  return { code, severity: d.severity, category: d.category, message: d.message, rules: d.rules, t };
}
