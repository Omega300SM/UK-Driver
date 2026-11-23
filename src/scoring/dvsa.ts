import type { Fault } from '../rules/types';

/** Maximum driving (minor) faults allowed on the DVSA practical test. */
export const MAX_MINORS = 15;

export interface TestTally {
  minors: number;
  serious: number;
  dangerous: number;
  passed: boolean;
}

export function tally(faults: readonly Fault[]): TestTally {
  const minors = faults.filter((f) => f.severity === 'minor').length;
  const serious = faults.filter((f) => f.severity === 'serious').length;
  const dangerous = faults.filter((f) => f.severity === 'dangerous').length;
  return { minors, serious, dangerous, passed: minors <= MAX_MINORS && serious === 0 && dangerous === 0 };
}

/** Group repeated faults for the debrief ("Observation – moving off ×2"). */
export function groupFaults(faults: readonly Fault[]): Array<{ fault: Fault; count: number }> {
  const map = new Map<string, { fault: Fault; count: number }>();
  for (const f of faults) {
    const g = map.get(f.code);
    if (g) g.count++;
    else map.set(f.code, { fault: f, count: 1 });
  }
  const rank = { dangerous: 0, serious: 1, minor: 2 } as const;
  return [...map.values()].sort((a, b) => rank[a.fault.severity] - rank[b.fault.severity]);
}
