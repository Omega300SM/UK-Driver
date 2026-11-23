import type { RuleRef } from './schema';

const HC = 'https://www.gov.uk/guidance/the-highway-code';

/**
 * Highway Code references. Text paraphrased from gov.uk, checked 23 Nov 2026.
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
