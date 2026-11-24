import type { RuleRef } from './schema';

const HC = 'https://www.gov.uk/guidance/the-highway-code';

/**
 * Highway Code references. Text paraphrased from gov.uk, checked 23–24 Nov 2026 (Days 1–9).
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
      'Among other things: give way to oncoming vehicles before passing parked vehicles or other obstructions on your side of the road.',
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
      'You MUST NOT stop or park on a road marked with double white lines (except to pick up or set down passengers, or to load or unload), among other places.',
    url: `${HC}/waiting-and-parking-238-to-252`
  },
  243: {
    rule: 243,
    title: 'Where not to stop or park',
    summary:
      'Do not stop or park opposite or within 10 metres of a junction (except in an authorised parking space), on a bend, or near the brow of a hill, among other places.',
    url: `${HC}/waiting-and-parking-238-to-252`
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
    summary: 'You MUST switch off the engine and apply the handbrake before leaving the vehicle.',
    url: `${HC}/waiting-and-parking-238-to-252`
  }
};

export function rule(n: number): RuleRef {
  const r = RULES[n];
  if (!r) throw new Error(`Unknown Highway Code rule ${n}. Add it to src/content/ruleRefs.ts.`);
  return r;
}
