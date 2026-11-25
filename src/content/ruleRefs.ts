import type { RuleRef } from './schema';

const HC = 'https://www.gov.uk/guidance/the-highway-code';

/**
 * Highway Code references. Text paraphrased from gov.uk, checked 23–25 Nov 2026 (Days 1–21).
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
  113: {
    rule: 113,
    title: 'Lights at night',
    summary:
      'You MUST ensure sidelights and rear number plate lights are lit between sunset and sunrise. Use headlights at night, except on roads with lit street lighting, and when visibility is seriously reduced.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  114: {
    rule: 114,
    title: 'Don’t dazzle',
    summary:
      'You MUST NOT use any lights in a way that would dazzle or cause discomfort to other road users, including pedestrians, cyclists and horse riders. Fog lights only when visibility is seriously reduced.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  115: {
    rule: 115,
    title: 'Dipped headlights',
    summary:
      'Use dipped headlights at night in built-up areas and in dull daytime weather. Keep them dipped when overtaking until you’re level with the other vehicle. Slow down, or stop, if you’re dazzled by oncoming lights.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  133: {
    rule: 133,
    title: 'Changing lanes',
    summary:
      'Before changing lane, use your mirrors and if necessary take a quick sideways glance so you won’t force anyone to change course or speed. When safe, signal, then move over when clear.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  137: {
    rule: 137,
    title: 'Two-lane dual carriageways',
    summary:
      'Stay in the left-hand lane. Use the right-hand lane for overtaking or turning right, then move back to the left-hand lane when it’s safe.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  154: {
    rule: 154,
    title: 'Country roads',
    summary:
      'Take extra care on country roads: slow down for bends, which can be sharper than they look, and for partly hidden junctions. Expect walkers, horse riders, cyclists, farm vehicles and mud. Make sure you can stop within the distance you can see to be clear.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  155: {
    rule: 155,
    title: 'Single-track roads',
    summary:
      'These are only wide enough for one vehicle and may have passing places. If someone comes towards you (or wants to overtake), pull into a passing place on your left, or wait opposite one on your right. Give way to traffic coming uphill when you can; reverse to a passing place if you need to.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  226: {
    rule: 226,
    title: 'Poor visibility',
    summary:
      'You MUST use headlights when visibility is seriously reduced, generally when you can’t see more than 100 metres. You may use fog lights, but MUST switch them off when visibility improves.',
    url: `${HC}/driving-in-adverse-weather-conditions-226-to-237`
  },
  227: {
    rule: 227,
    title: 'Wet weather',
    summary:
      'In the wet, stopping distances are at least double those on dry roads, because your tyres have less grip. Keep well back from the vehicle in front. If the steering goes light, ease off the accelerator and slow down gradually.',
    url: `${HC}/driving-in-adverse-weather-conditions-226-to-237`
  },
  235: {
    rule: 235,
    title: 'Driving in fog',
    summary:
      'Use your lights as required, keep a safe distance, and be able to pull up well within the distance you can see clearly, especially on motorways and dual carriageways.',
    url: `${HC}/driving-in-adverse-weather-conditions-226-to-237`
  },
  253: {
    rule: 253,
    title: 'Who may use motorways',
    summary:
      'Provisional car licence holders MUST NOT drive on a motorway unless accompanied by an approved driving instructor in a car with dual controls and L plates.',
    url: `${HC}/motorways-253-to-273`
  },
  258: {
    rule: 258,
    title: 'Red X and red lights',
    summary:
      'A red X or red flashing lights mean a lane is closed: there may be people or stopped vehicles in it. You MUST move to an open lane as signs direct and MUST NOT drive in a closed lane.',
    url: `${HC}/motorways-253-to-273`
  },
  259: {
    rule: 259,
    title: 'Joining the motorway',
    summary:
      'Give priority to traffic already on the motorway, check it, and match your speed to fit safely into the left-hand lane. Don’t cross solid white lines or use the hard shoulder; stay on the slip road if it continues as an extra lane.',
    url: `${HC}/motorways-253-to-273`
  },
  263: {
    rule: 263,
    title: 'No reversing or U-turns',
    summary:
      'Unless directed by the police or a traffic officer, you MUST NOT reverse along any part of a motorway (including slip roads and hard shoulders), cross the central reservation, or drive against the traffic flow. Missed your exit? Carry on to the next.',
    url: `${HC}/motorways-253-to-273`
  },
  264: {
    rule: 264,
    title: 'Keep left',
    summary:
      'Keep in the left lane unless overtaking, and return to it when it’s safe. Move over to give room to anyone stopped on the hard shoulder or in an emergency area.',
    url: `${HC}/motorways-253-to-273`
  },
  267: {
    rule: 267,
    title: 'Overtaking on the motorway',
    summary:
      'Overtake only on the right, when safe and legal: mirrors, judge speeds, check the lane is clear ahead and behind, a quick sideways glance for the blind spot, then signal in plenty of time and move out.',
    url: `${HC}/motorways-253-to-273`
  },
  268: {
    rule: 268,
    title: 'No overtaking on the left',
    summary:
      'Do not overtake on the left or move to a lane on your left to overtake. In congested traffic you may keep up with your lane even if it passes the lane to your right.',
    url: `${HC}/motorways-253-to-273`
  },
  269: {
    rule: 269,
    title: 'Hard shoulder',
    summary:
      'You MUST NOT use the hard shoulder except in an emergency or if directed by the police, traffic officers or a traffic sign. Where it’s used as a lane, a red X or blank sign above it means you MUST NOT use it.',
    url: `${HC}/motorways-253-to-273`
  },
  270: {
    rule: 270,
    title: 'Emergency areas',
    summary:
      'Emergency areas, marked by blue signs with an orange SOS telephone and often orange surfacing, MUST only be used in an emergency.',
    url: `${HC}/motorways-253-to-273`
  },
  271: {
    rule: 271,
    title: 'No stopping',
    summary:
      'You MUST NOT stop on any carriageway, emergency area, hard shoulder, slip road, central reservation or verge except in an emergency, or when told to by the police, traffic officers, an emergency sign or red flashing lights.',
    url: `${HC}/motorways-253-to-273`
  },
  273: {
    rule: 273,
    title: 'Leaving the motorway',
    summary:
      'Watch for the signs for your exit, move into the left-hand lane well before it, signal left in good time and slow down on the slip road as needed.',
    url: `${HC}/motorways-253-to-273`
  },
  156: {
    rule: 156,
    title: 'Passing places',
    summary: 'Do not park in passing places.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
  },
  162: {
    rule: 162,
    title: 'Before overtaking',
    summary:
      'Make sure the road is sufficiently clear ahead, road users are not beginning to overtake you, and there is a suitable gap in front of the road user you plan to overtake.',
    url: `${HC}/using-the-road-159-to-203`
  },
  164: {
    rule: 164,
    title: 'Overtaking large vehicles',
    summary:
      'Drop back from large vehicles: it improves your view ahead and lets the driver see you in their mirrors. Make sure you have enough room to complete the overtake before committing.',
    url: `${HC}/using-the-road-159-to-203`
  },
  165: {
    rule: 165,
    title: 'When you MUST NOT overtake',
    summary:
      'You MUST NOT overtake if you would have to cross or straddle double white lines with a solid line nearest you, enter an area marked to separate traffic, pass the vehicle nearest a pedestrian crossing, or after a No Overtaking sign.',
    url: `${HC}/using-the-road-159-to-203`
  },
  166: {
    rule: 166,
    title: 'Don’t overtake if in doubt',
    summary:
      'Do not overtake if there is any doubt, or where you cannot see far enough ahead to be sure it’s safe: approaching a bend, a hump bridge or the brow of a hill.',
    url: `${HC}/using-the-road-159-to-203`
  },
  167: {
    rule: 167,
    title: 'Don’t overtake into conflict',
    summary:
      'Do not overtake where you might come into conflict with others: at or approaching junctions, where the road narrows, approaching a school crossing patrol, or where traffic is queuing.',
    url: `${HC}/using-the-road-159-to-203`
  },
  168: {
    rule: 168,
    title: 'Being overtaken',
    summary:
      'If someone is overtaking you, keep a steady course and speed, slowing down if necessary to let them pass. Drop back to a two-second gap if they pull in ahead of you.',
    url: `${HC}/using-the-road-159-to-203`
  },
  255: {
    rule: 255,
    title: 'Motorway signals',
    summary:
      'Signs and signals warn of hazards ahead, such as an incident, fog, a spillage or road workers you may not yet be able to see.',
    url: `${HC}/motorways-253-to-273`
  },
  256: {
    rule: 256,
    title: 'Lane signals',
    summary:
      'A single sign or signal can apply to all lanes; lane-specific signs and signals apply to individual lanes.',
    url: `${HC}/motorways-253-to-273`
  },
  257: {
    rule: 257,
    title: 'Amber flashing lights',
    summary:
      'Amber flashing lights warn of a hazard ahead: reduce your speed and be prepared. Only speed up when you pass a signal that isn’t flashing, or a national speed limit sign or END.',
    url: `${HC}/motorways-253-to-273`
  },
  261: {
    rule: 261,
    title: 'Motorway speed limits',
    summary:
      'You MUST NOT exceed a speed limit displayed within a red circle on a sign, or the maximum speed limit for the road and your vehicle.',
    url: `${HC}/motorways-253-to-273`
  },
  275: {
    rule: 275,
    title: 'Breaking down',
    summary:
      'If you need to stop after a breakdown or incident, try to stop in a place of relative safety: a service area is safest on high-speed roads; others include lay-bys, emergency areas and hard shoulders.',
    url: `${HC}/breakdowns-and-incidents-274-to-287`
  },
  116: {
    rule: 116,
    title: 'Hazard warning lights',
    summary:
      'Use them when stationary to warn you are temporarily obstructing traffic. You MUST NOT use them while driving, unless on a motorway or unrestricted dual carriageway to warn drivers behind of a hazard ahead.',
    url: `${HC}/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158`
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
    summary:
      'Drive at a speed that will allow you to stop well within the distance you can see to be clear. Leave at least a two-second gap on high-speed roads, at least doubled on wet roads and up to ten times on icy roads. Never get closer than the overall stopping distance.',
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
