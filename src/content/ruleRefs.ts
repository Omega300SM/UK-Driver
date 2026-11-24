import type { RuleRef } from './schema';

const HC = 'https://www.gov.uk/guidance/the-highway-code';

/**
 * Highway Code references. Text paraphrased from gov.uk, checked 23–24 Nov 2026 (Days 1–13).
 * Add new rules here and cite them by number from lessons and faults.
 */
export const RULES: Record<number, RuleRef> = {
  97: {
    rule: 97,
    title: 'Before setting off',
    summary:
      'Know where all the controls are and how to use them, and have your mirrors and seat adjusted for comfort, full control and maximum vision.',
    url: `${HC}/rules-for-drivers-and-motorcyclists-89-to-102`
  },
  99: {
    rule: 99,
    title: 'Seat belts',
    summary: 'You MUST wear a seat belt in cars, vans and other goods vehicles if one is fitted.',
    url: `${HC}/rules-for-drivers-and-motorcyclists-89-to-102`
  },
  103: {
    rule: 103,
    title: 'Signals',
    summary:
      'Give clear signals in plenty of time, before changing course, stopping or moving off. Cancel them after use, and make sure they won’t confuse others.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  112: {
    rule: 112,
    title: 'The horn',
    summary:
      'Use it only while moving, to warn others you are there. You MUST NOT use it while stationary on the road, or in a built-up area between 11.30pm and 7am, unless another road user poses a danger.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  123: {
    rule: 123,
    title: 'The driver and the environment',
    summary:
      'If you will be stationary for more than a couple of minutes, apply the parking brake and switch off the engine.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  109: {
    rule: 109,
    title: 'Traffic signs and signals',
    summary:
      'You MUST obey all traffic light signals and traffic signs giving orders. Know, understand and act on all other signs and road markings.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  124: {
    rule: 124,
    title: 'Speed limits',
    summary:
      'You MUST NOT exceed the maximum speed limits. In England a 30 mph limit generally applies to roads with street lights unless signs show otherwise; single carriageways are 60 mph for cars unless signed lower.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  125: {
    rule: 125,
    title: 'The speed limit is a maximum',
    summary:
      'The speed limit is the absolute maximum and does not mean it is safe to drive at that speed in all conditions.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  127: {
    rule: 127,
    title: 'Broken white centre line',
    summary:
      'A broken white line marks the centre of the road. When the lines get longer and the gaps shorter, there is a hazard ahead.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  129: {
    rule: 129,
    title: 'Double white lines, solid nearest you',
    summary:
      'Where the line nearer to you is solid, you MUST NOT cross or straddle it, except in the cases the rule lists (such as passing a stationary vehicle when the road is clear).',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  146: {
    rule: 146,
    title: 'Adapt your driving',
    summary:
      'Do not treat speed limits as a target; take road and traffic conditions into account, and be prepared for road users emerging at junctions.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  152: {
    rule: 152,
    title: 'Residential streets',
    summary:
      'Drive slowly and carefully where there are likely to be pedestrians, cyclists and parked cars. Look out for car doors opening and children running out between parked cars.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  163: {
    rule: 163,
    title: 'Overtaking and obstructions',
    summary:
      'Overtake only when safe and legal. Give way to oncoming vehicles before passing parked vehicles or obstructions on your side. As a guide, leave at least 1.5 metres when overtaking cyclists at up to 30 mph (more at higher speeds), and pass horse riders at under 10 mph with at least 2 metres.',
    url: `${HC}/using-the-road-159-to-203`
  },
  170: {
    rule: 170,
    title: 'Take extra care at junctions',
    summary:
      'Watch out for cyclists, motorcyclists and pedestrians; look all around before emerging; do not cross or join a road until there is a gap large enough to do so safely.',
    url: `${HC}/using-the-road-159-to-203`
  },
  171: {
    rule: 171,
    title: 'Stop signs',
    summary:
      'You MUST stop behind the line at a junction with a Stop sign and a solid white line across the road. Wait for a safe gap before you move off.',
    url: `${HC}/using-the-road-159-to-203`
  },
  172: {
    rule: 172,
    title: 'Give way junctions',
    summary:
      'You MUST give way to traffic on the main road when emerging from a junction with broken white lines across the road.',
    url: `${HC}/using-the-road-159-to-203`
  },
  179: {
    rule: 179,
    title: 'Turning right',
    summary:
      'Well before you turn right, use your mirrors, give a right-turn signal and take up a position just left of the middle of the road.',
    url: `${HC}/using-the-road-159-to-203`
  },
  180: {
    rule: 180,
    title: 'Turning right: the gap',
    summary:
      'Wait until there is a safe gap between you and any oncoming vehicle, check mirrors and blind spot again, and do not cut the corner. Mirrors – Signal – Manoeuvre.',
    url: `${HC}/using-the-road-159-to-203`
  },
  182: {
    rule: 182,
    title: 'Turning left',
    summary:
      'Use your mirrors and give a left-turn signal well before you turn left, and watch for cyclists and others coming up on your left.',
    url: `${HC}/using-the-road-159-to-203`
  },
  183: {
    rule: 183,
    title: 'When turning',
    summary:
      'Keep as close to the left as is safe and practicable.',
    url: `${HC}/using-the-road-159-to-203`
  },
  238: {
    rule: 238,
    title: 'Yellow lines',
    summary:
      'You MUST NOT wait or park on yellow lines during the times of operation shown on nearby plates. Double yellow lines mean no waiting at any time.',
    url: `${HC}/waiting-and-parking-238-to-252`
  },
  240: {
    rule: 240,
    title: 'Where you must not stop',
    summary:
      'You MUST NOT stop or park on a pedestrian crossing or its zig-zag lines, or on a road marked with double white lines (except to pick up or set down passengers, or to load or unload), among other places.',
    url: `${HC}/waiting-and-parking-238-to-252`
  },
  243: {
    rule: 243,
    title: 'Where not to stop or park',
    summary:
      'Do not stop or park opposite or within 10 metres of a junction (except in an authorised parking space), on a bend, or near the brow of a hill, among other places.',
    url: `${HC}/waiting-and-parking-238-to-252`
  },
  141: {
    rule: 141,
    title: 'Bus lanes',
    summary:
      'Shown by road markings and signs that say which other vehicles (if any) may use them. Unless otherwise indicated, do not drive in a bus lane during its period of operation. You may enter one to stop, load or unload where that is not prohibited.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  174: {
    rule: 174,
    title: 'Box junctions',
    summary:
      'You MUST NOT enter the yellow criss-cross box until your exit road or lane is clear. You may enter and wait when turning right and only stopped by oncoming traffic or others waiting to turn right.',
    url: `${HC}/using-the-road-159-to-203`
  },
  175: {
    rule: 175,
    title: 'Traffic lights: the stop line',
    summary:
      'You MUST stop behind the white stop line unless the light is green. On amber, go on only if you have already crossed the line or are so close that stopping might cause a collision.',
    url: `${HC}/using-the-road-159-to-203`
  },
  176: {
    rule: 176,
    title: 'Traffic lights: red',
    summary:
      'You MUST NOT move over the white line on red. Go on green only if there is room to clear the junction safely (or you are positioning to turn right). Red and amber also means stop.',
    url: `${HC}/using-the-road-159-to-203`
  },
  177: {
    rule: 177,
    title: 'Green filter arrow',
    summary:
      'A filter lane only: do not enter it unless you want to go in the direction of the arrow. Go when the arrow or the full green shows, giving others (especially cyclists) time and room.',
    url: `${HC}/using-the-road-159-to-203`
  },
  178: {
    rule: 178,
    title: 'Advanced stop lines',
    summary:
      'At amber or red you MUST stop at the first white line, leaving the marked area for cyclists. If you were already over the first line when the light turned red, stop at the second.',
    url: `${HC}/using-the-road-159-to-203`
  },
  191: {
    rule: 191,
    title: 'Pedestrian crossings',
    summary:
      'You MUST NOT park on a crossing or its zig-zag area, and MUST NOT overtake the moving vehicle nearest the crossing or one that has stopped to give way to pedestrians.',
    url: `${HC}/using-the-road-159-to-203`
  },
  192: {
    rule: 192,
    title: 'Keep crossings clear',
    summary: 'In queuing traffic keep crossings completely clear, and do not go onto a crossing unless you can get right across it.',
    url: `${HC}/using-the-road-159-to-203`
  },
  194: {
    rule: 194,
    title: 'Be patient with pedestrians',
    summary: 'Allow pedestrians plenty of time to cross and do not harass them by revving your engine or edging forward.',
    url: `${HC}/using-the-road-159-to-203`
  },
  195: {
    rule: 195,
    title: 'Zebra crossings',
    summary:
      'Look out for people waiting and be ready to stop; you should give way to pedestrians waiting to cross, and you MUST give way once one has moved onto the crossing. Do not wave people across, flash your lights or use your horn.',
    url: `${HC}/using-the-road-159-to-203`
  },
  196: {
    rule: 196,
    title: 'Pelican crossings',
    summary:
      'Signal-controlled crossings where flashing amber follows red. You MUST stop on red; on flashing amber you MUST give way to anyone on the crossing, and may go with caution if it is clear.',
    url: `${HC}/using-the-road-159-to-203`
  },
  198: {
    rule: 198,
    title: 'Anyone still crossing',
    summary: 'Give way to anyone still crossing after the signal for vehicles has changed to green. This applies to all crossings.',
    url: `${HC}/using-the-road-159-to-203`
  },
  199: {
    rule: 199,
    title: 'Toucan, puffin and equestrian crossings',
    summary:
      'Like pelicans but with no flashing amber: the lights run as at traffic lights. Do not go onto the crossing unless you can clear it completely.',
    url: `${HC}/using-the-road-159-to-203`
  },
  200: {
    rule: 200,
    title: 'Choose a safe place to manoeuvre',
    summary: 'If you need to turn round, wait for a safe place. Try not to reverse or turn round in a busy road: find a quiet side road.',
    url: `${HC}/using-the-road-159-to-203`
  },
  201: {
    rule: 201,
    title: 'Reversing into a road or driveway',
    summary: 'Do not reverse from a side road into a main road. When using a driveway, reverse in and drive out if you can.',
    url: `${HC}/using-the-road-159-to-203`
  },
  202: {
    rule: 202,
    title: 'Look carefully when reversing',
    summary:
      'Before reversing use all your mirrors, check the blind spot behind you and look for pedestrians (especially children), cyclists and obstructions. Reverse slowly, checking all around and looking mainly through the rear window; the front swings out as you turn.',
    url: `${HC}/using-the-road-159-to-203`
  },
  203: {
    rule: 203,
    title: 'Don’t reverse too far',
    summary: 'You MUST NOT reverse your vehicle further than necessary.',
    url: `${HC}/using-the-road-159-to-203`
  },
  901: {
    rule: 901,
    label: 'H1',
    title: 'The hierarchy of road users',
    summary:
      'Everyone must be considerate, but those in charge of vehicles that can cause the greatest harm bear the greatest responsibility to take care and reduce the danger they pose to others.',
    url: `${HC}/introduction`
  },
  902: {
    rule: 902,
    label: 'H2',
    title: 'Pedestrians at junctions',
    summary:
      'At a junction you should give way to pedestrians crossing or waiting to cross a road into which or from which you are turning. You MUST give way to pedestrians on a zebra crossing.',
    url: `${HC}/introduction`
  },
  903: {
    rule: 903,
    label: 'H3',
    title: 'Don’t cut across cyclists and horse riders',
    summary:
      'Do not cut across cyclists, horse riders or horse-drawn vehicles going ahead when you turn into or out of a junction or change lane. Don’t turn if it would make them stop or swerve: wait for a safe gap.',
    url: `${HC}/introduction`
  },
  204: {
    rule: 204,
    title: 'Road users most at risk',
    summary:
      'Pedestrians (especially children, older adults and disabled people), cyclists, horse riders and motorcyclists are most at risk. Those who can cause the greatest harm have the greatest responsibility to reduce danger.',
    url: `${HC}/road-users-requiring-extra-care-204-to-225`
  },
  207: {
    rule: 207,
    title: 'Particularly vulnerable pedestrians',
    summary:
      'Children and older people may not judge your speed and could step out. At 40 mph you will probably kill a pedestrian you hit; at 20 mph there is about a 1 in 20 chance. Give older people time; don’t rev or edge forward.',
    url: `${HC}/road-users-requiring-extra-care-204-to-225`
  },
  208: {
    rule: 208,
    title: 'Near schools',
    summary: 'Drive slowly and be particularly aware of young cyclists and pedestrians. A flashing amber signal under a School sign means children may be crossing ahead.',
    url: `${HC}/road-users-requiring-extra-care-204-to-225`
  },
  210: {
    rule: 210,
    title: 'School crossing patrols',
    summary: 'You MUST stop when a school crossing patrol shows a ‘Stop for children’ sign.',
    url: `${HC}/road-users-requiring-extra-care-204-to-225`
  },
  211: {
    rule: 211,
    title: 'Look out for cyclists and motorcyclists',
    summary:
      'They are often hard to see, especially at junctions, alongside you or filtering. Look out for them before you emerge, and don’t turn if it would make a cyclist going ahead stop or swerve.',
    url: `${HC}/road-users-requiring-extra-care-204-to-225`
  },
  212: {
    rule: 212,
    title: 'Give vulnerable road users room',
    summary:
      'Give motorcyclists, cyclists, horse riders and pedestrians walking in the road at least as much room as you would a car when overtaking, and more in bad weather and at night.',
    url: `${HC}/road-users-requiring-extra-care-204-to-225`
  },
  213: {
    rule: 213,
    title: 'Cyclists in the centre of the lane',
    summary:
      'On narrow or quiet roads, at junctions and in slow traffic, cyclists may ride in the centre of the lane, and groups may ride two abreast. Allow them to do so for their safety.',
    url: `${HC}/road-users-requiring-extra-care-204-to-225`
  },
  215: {
    rule: 215,
    title: 'Horse riders',
    summary:
      'Be particularly careful of horse riders. Slow to a maximum of 10 mph, be patient, don’t sound your horn or rev, and when safe pass wide and slow, allowing at least 2 metres.',
    url: `${HC}/road-users-requiring-extra-care-204-to-225`
  },
  184: {
    rule: 184,
    title: 'Approaching a roundabout',
    summary:
      'Use Mirrors – Signal – Manoeuvre at all stages, decide early which exit you need, give an appropriate signal, get into the correct lane, and adjust speed and position for the traffic.',
    url: `${HC}/using-the-road-159-to-203`
  },
  185: {
    rule: 185,
    title: 'Reaching a roundabout',
    summary:
      'Give priority to traffic approaching from your right unless signs, markings or lights say otherwise; still look right before joining; watch for others already on the roundabout.',
    url: `${HC}/using-the-road-159-to-203`
  },
  186: {
    rule: 186,
    title: 'Roundabout signals and position',
    summary:
      'First exit: signal left, approach in the left lane, keep left and keep signalling. Right or full circle: signal right, approach in the right lane, keep right, signal left after passing the exit before yours. Intermediate exits: usually no approach signal; signal left after passing the exit before yours. Give priority to cyclists on the roundabout.',
    url: `${HC}/using-the-road-159-to-203`
  },
  187: {
    rule: 187,
    title: 'Watch out on roundabouts',
    summary:
      'Give plenty of room to pedestrians on approach and exit roads, traffic crossing in front of you, vehicles straddling lanes, motorcyclists and long vehicles.',
    url: `${HC}/using-the-road-159-to-203`
  },
  188: {
    rule: 188,
    title: 'Mini-roundabouts',
    summary:
      'Approach them like normal roundabouts. All vehicles MUST pass round the central markings except large vehicles physically incapable of doing so. There is less time to signal; avoid U-turns.',
    url: `${HC}/using-the-road-159-to-203`
  },
  189: {
    rule: 189,
    title: 'Double mini-roundabouts',
    summary:
      'Treat each roundabout separately and give way to traffic from the right.',
    url: `${HC}/using-the-road-159-to-203`
  },
  190: {
    rule: 190,
    title: 'Multiple roundabouts',
    summary:
      'At complex junctions with a series of mini-roundabouts, treat each one separately and follow the normal rules.',
    url: `${HC}/using-the-road-159-to-203`
  },
  126: {
    rule: 126,
    title: 'Stopping distances',
    summary: 'Drive at a speed that will allow you to stop well within the distance you can see to be clear.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  159: {
    rule: 159,
    title: 'Before moving off',
    summary:
      'Use all mirrors to check the road is clear, look round to check the blind spots, signal if necessary, and take a final look round. Move off only when it is safe.',
    url: `${HC}/using-the-road-159-to-203`
  },
  160: {
    rule: 160,
    title: 'Once moving',
    summary: 'Keep to the left unless signs or markings say otherwise, and keep both hands on the wheel where possible.',
    url: `${HC}/using-the-road-159-to-203`
  },
  161: {
    rule: 161,
    title: 'Mirrors',
    summary:
      'Use your mirrors frequently, and in good time before you signal or change direction or speed. Mirrors don’t cover blind spots, so look round. Mirrors – Signal – Manoeuvre.',
    url: `${HC}/using-the-road-159-to-203`
  },
  239: {
    rule: 239,
    title: 'Parking',
    summary:
      'Use off-street car parks or marked bays wherever possible. On the road: don’t park facing against the traffic flow, stop as close as you can to the side, and you MUST switch off the engine and apply the handbrake before leaving the vehicle.',
    url: `${HC}/waiting-and-parking-238-to-252`
  }
};

export function rule(n: number): RuleRef {
  const r = RULES[n];
  if (!r) throw new Error(`Unknown Highway Code rule ${n}. Add it to src/content/ruleRefs.ts.`);
  return r;
}
