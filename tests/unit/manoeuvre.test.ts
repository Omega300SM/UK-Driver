import { describe, it, expect } from 'vitest';
import { RulesEngine } from '../../src/rules/RulesEngine';
import { manoeuvreChecks } from '../../src/rules/checks/manoeuvre';
import type { DriveEvent, ParkResult } from '../../src/rules/types';

const codes = (evs: DriveEvent[]) => {
  const r = new RulesEngine(manoeuvreChecks(), 'test');
  for (const e of evs) r.emit(e);
  return r.faults.map((f) => f.code);
};
const finish = (parked: ParkResult): DriveEvent => ({ type: 'finish', t: 30, handbrake: true, gear: 'P', parked });

describe('reversing', () => {
  it('looking all round first is fine', () => {
    expect(codes([{ type: 'mirror', t: 1, which: 'interior' }, { type: 'shoulder', t: 2, side: 'left' }, { type: 'shoulder', t: 2.5, side: 'right' }, { type: 'reverse', t: 4 }])).toEqual([]);
  });
  it('reversing without a look round is a fault (rule 202)', () => {
    expect(codes([{ type: 'mirror', t: 1, which: 'interior' }, { type: 'reverse', t: 4 }])).toEqual(['reverse-observation']);
    expect(codes([{ type: 'shoulder', t: 1, side: 'left' }, { type: 'reverse', t: 20 }])).toEqual(['reverse-observation']);
  });
});

describe('parking accuracy', () => {
  it('neatly in the bay: no faults', () => {
    expect(codes([finish({ kind: 'bay', inside: true, angleErr: 0.05, kerbGap: null, reversedIn: true })])).toEqual([]);
  });
  it('over the lines, or crooked', () => {
    expect(codes([finish({ kind: 'bay', inside: false, angleErr: 0.05, kerbGap: null, reversedIn: true })])).toEqual(['park-accuracy']);
    expect(codes([finish({ kind: 'bay', inside: true, angleErr: 0.4, kerbGap: null, reversedIn: true })])).toEqual(['park-angle']);
  });
  it('parallel: too far from the kerb', () => {
    expect(codes([finish({ kind: 'parallel', inside: true, angleErr: 0.05, kerbGap: 0.9, reversedIn: false })])).toEqual(['park-parallel-kerb']);
    expect(codes([finish({ kind: 'parallel', inside: true, angleErr: 0.05, kerbGap: 0.3, reversedIn: false })])).toEqual([]);
  });
});
