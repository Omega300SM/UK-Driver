/**
 * Scripted careful drives of the Week 3 (Devon Run) test routes: country
 * lane with a passing place, the A386 in the rain, Okement Cross and the A30,
 * the M5 (joining, keeping left, leaving), the smart motorway, night driving,
 * and the coast run. They must finish with zero faults.
 */
import { OKEMENT, rbPath, nbLane, NB2, NB3, LW, Z, CX, AH } from '../../src/world/scenes/devonLayout';

type Pt = [number, number, number];
type Step =
  | { act: 'belt' | 'handbrake' | 'mirror' | 'look' | 'signal' | 'gear' | 'lights' | 'wipers'; arg?: string }
  | { brake: boolean }
  | { wait: number }
  | { drive: Pt[] }
  | { waitGap: Array<[number, number]>; secs?: number }
  | { waitLane: number }
  | { waitFinishAsked: true }
  | { moveOff: 'left' | 'right' };

const secure: Step[] = [{ waitFinishAsked: true }, { brake: true }, { act: 'handbrake' }, { act: 'gear', arg: 'P' }, { act: 'signal', arg: 'off' }];
const pullIn = (pts: Pt[]): Step[] => [{ act: 'mirror', arg: 'interior' }, { act: 'mirror', arg: 'left' }, { act: 'signal', arg: 'left' }, { drive: pts }];
/** Change lanes: mirrors, glance, signal, move (the first point), cancel the signal, then carry on (the rest). */
const laneChange = (dir: 'left' | 'right', pts: Pt[]): Step[] => [
  { waitLane: pts[0][0] },
  { act: 'mirror', arg: 'interior' },
  { act: 'mirror', arg: dir },
  { act: 'look', arg: dir },
  { act: 'signal', arg: dir },
  { drive: pts.slice(0, 1) },
  { act: 'signal', arg: 'off' },
  ...(pts.length > 1 ? [{ drive: pts.slice(1) } as Step] : [])
];

const A1 = CX + AH / 2; // A386 northbound lane
const L1 = NB3 - LW / 2;
const L2 = NB3 - 1.5 * LW;
const EXIT = NB3 + LW / 2;
const SV = Z.seaview - AH / 2;
const SLIP = NB2 + LW / 2;

/** Combe Lane to the give way, meeting the van at the passing place on section C, then left onto the A386. */
const combeLane = (meetVan: boolean, night = false): Step[] => [
  { moveOff: 'right' },
  { drive: [[800.4, -5, 5]] },
  { act: 'signal', arg: 'off' },
  // At night: main beam along the empty first straight, dipped (main → off → dipped) before the van appears.
  ...(night ? ([{ act: 'lights' }, { drive: [[800, 60, 8], [800, 300, 8.5]] }, { act: 'lights' }, { act: 'lights' }] as Step[]) : []),
  { drive: [...(night ? [] : [[800, 60, 8] as Pt]), [800, 370, 8.5], [800, 398, 6], [800, 413, 4.5], [798.6, 419, 4.5], [793, 420.2, 5], [782, 420, 6], [700, 420, 8], [640, 420, 6], [627, 420, 4.5], [621.2, 421.6, 4.5], [620, 427, 4.5], [620, 438, 5], [620, 480, 7]] },
  ...(meetVan
    ? ([
        { act: 'mirror', arg: 'interior' },
        { act: 'mirror', arg: 'left' },
        { drive: [[620, 506, 4], [620.6, 514, 3], [622.6, 521, 2.5], [623.1, 528, 0]] },
        { waitGap: [[620, 548], [620, 560]], secs: 60 },
        { moveOff: 'right' },
        { drive: [[622.6, 538, 3], [621.2, 546, 3.5], [620, 556, 5]] },
        { act: 'signal', arg: 'off' }
      ] as Step[])
    : []),
  { drive: [[620, 860, 9], [620, 884, 6], [620, 893, 4.5], [618.6, 899, 4.5], [613, 900.2, 5], [602, 900, 6], [560, 900, 8], [440, 900, 7]] },
  // Give way onto the A386, turning left.
  { act: 'mirror', arg: 'interior' },
  { act: 'mirror', arg: 'left' },
  { act: 'signal', arg: 'left' },
  { drive: [[414, 900, 4], [406.4, 900, 0]] },
  { act: 'look', arg: 'right' },
  { act: 'look', arg: 'left' },
  { waitGap: [[A1, 900], [CX - AH / 2, 900]], secs: 7 },
  { act: 'look', arg: 'right' },
  { act: 'look', arg: 'left' },
  { drive: [[404.4, 900.4, 3], [402.6, 903, 3.5], [A1, 910, 5], [A1, 940, 9]] },
  { act: 'signal', arg: 'off' }
];

export const ROUTES3: Record<number, Step[]> = {
  15: [...combeLane(true), { drive: [[A1, 1110, 13]] }, ...pullIn([[A1, 1140, 7], [403.4, 1149, 5], [404.8, 1162, 3], [405.1, 1180, 0]]), ...secure],
  // Rain and fog: wipers and dipped lights, four-second gap behind the car ahead (the scripted driver keeps it).
  16: [
    { act: 'wipers' },
    { act: 'lights' },
    { moveOff: 'right' },
    { drive: [[A1, 1020, 6]] },
    { act: 'signal', arg: 'off' },
    { drive: [[A1, 1480, 18], [A1, 1500, 12], [A1, 1900, 12], [A1, 2110, 17]] },
    ...pullIn([[A1, 2140, 7], [403.4, 2149, 5], [404.8, 2162, 3], [405.1, 2180, 0]]),
    ...secure
  ],
  // Okement Cross straight on, then overtake the slow lorry on the A30 and back to lane 1.
  17: [
    { moveOff: 'right' },
    { drive: [[A1, 2215, 6]] },
    { act: 'signal', arg: 'off' },
    { drive: [[A1, 2330, 13], [A1, 2400, 9]] },
    ...okementAhead(),
    { drive: [[nbLane(1), 2560, 18], [nbLane(1), 2650, 27]] },
    ...laneChange('right', [[nbLane(2), 2740, 29], [nbLane(2), 2990, 30]]),
    ...laneChange('left', [[nbLane(1), 3070, 29]]),
    { drive: [[nbLane(1), 3320, 26], [nbLane(1), 3385, 13]] },
    ...pullIn([[409.6, 3402, 7], [410.2, 3416, 3], [410.3, 3428, 0]]),
    ...secure
  ],
  // Join at J1 (after the solid line), keep left, signal at the countdown markers, leave at J2.
  18: [
    { moveOff: 'right' },
    { drive: [[600, Z.j1 + AH / 2, 6]] },
    { act: 'signal', arg: 'off' },
    { drive: [[440, Z.j1 + AH / 2, 12], [420, Z.j1 + AH / 2, 7], [415, Z.j1 + AH / 2 + 0.4, 5], [412, Z.j1 + 5.5, 5], [SLIP, Z.j1 + 15, 7], [SLIP, 3860, 16], [SLIP, 3995, 25]] },
    ...laneChange('right', [[nbLane(1), 4090, 26], [nbLane(1), 5050, 29]]),
    // Exit 2: signal at the 100-yard marker, into the exit lane, slow down on the slip road.
    ...laneChange('left', [[SLIP, 5250, 25], [SLIP, 5400, 15], [SLIP, 5482, 7]]),
    { drive: [[SLIP, 5489, 5], [412.4, 5495.4, 5], [416.5, 5497.8, 5], [430, Z.j2Link - AH / 2, 10], [560, Z.j2Link - AH / 2, 16]] },
    ...pullIn([[600, Z.j2Link - AH / 2 - 0.4, 5], [612, Z.j2Link - AH + 1.15, 3], [620, Z.j2Link - AH + 1.15, 0]]),
    ...secure
  ],
  // Smart motorway: join at J2 (slip becomes lane 1), 60 then 50, out of lane 1 before the red X, off at J3 to Seaview.
  19: [
    { moveOff: 'right' },
    { drive: [[640, Z.j2Entry + AH / 2, 6]] },
    { act: 'signal', arg: 'off' },
    ...smartRun()
  ],
  // Night: dipped to move off, main beam on the empty lane, dip before the van, then the A386 dipped.
  20: [
    { act: 'lights' },
    ...combeLane(true, true),
    { drive: [[A1, 1110, 13]] },
    ...pullIn([[A1, 1140, 7], [403.4, 1149, 5], [404.8, 1162, 3], [405.1, 1180, 0]]),
    ...secure
  ],
  // Boss: the whole run in the rain.
  21: [
    { act: 'wipers' },
    { act: 'lights' },
    ...combeLane(true),
    { drive: [[A1, 1480, 17], [A1, 2330, 17], [A1, 2400, 9]] },
    ...okementAhead(),
    { drive: [[nbLane(1), 2560, 18], [nbLane(1), 3600, 27], [nbLane(1), 5560, 29], [nbLane(1), 5810, 26]] },
    // The A30's lane 1 becomes lane 2 where junction 2's slip road becomes lane 1: move back left.
    ...laneChange('left', [[L1, 5900, 26]]),
    ...smartRun(true)
  ]
};

/** From J2 (or lane 1 at the smart section) to Seaview: obey the gantries, avoid the red X, leave at J3. */
function smartRun(onMotorway = false): Step[] {
  return [
    ...(onMotorway
      ? []
      : ([{ drive: [[440, Z.j2Entry + AH / 2, 12], [420, Z.j2Entry + AH / 2, 7], [415, Z.j2Entry + AH / 2 - 0.4, 5], [412, Z.j2Entry + 5.5, 5], [L1, Z.j2Entry + 15, 7], [L1, 5700, 18], [L1, 5900, 25]] }] as Step[])),
    { drive: [[L1, 5985, 21], [L1, 6380, 21], [L1, 6600, 20]] },
    ...laneChange('right', [[L2, 6700, 20], [L2, 7310, 20]]),
    ...laneChange('left', [[L1, 7385, 21]]),
    ...laneChange('left', [[EXIT, 7470, 19], [EXIT, 7580, 14], [EXIT, 7670, 9]]),
    { drive: [[EXIT, 7689, 5], [EXIT + 1.8, SV - 2.8, 5], [EXIT + 5.9, SV - 0.4, 5], [430, SV, 10], [780, SV, 12]] },
    ...pullIn([[815, SV - 0.4, 5], [828, Z.seaview - AH + 1.15, 3], [840, Z.seaview - AH + 1.15, 0]]),
    ...secure
  ];
}

/** Okement Cross from the A386, straight on (second exit) to the A30: stop, look right, wait, go; left signal after the first exit. */
function okementAhead(): Step[] {
  const arc = rbPath(OKEMENT, 'S', 'N');
  const [sx, sz] = arc[0];
  const k = Math.round(arc.length * 0.45);
  return [
    { drive: [[sx, sz - 10, 5], [sx, sz - 0.4, 0]] },
    { act: 'look', arg: 'right' },
    { waitGap: arc.slice(1, 5).map(([x, z]) => [x, z] as [number, number]), secs: 4 },
    { act: 'look', arg: 'right' },
    { drive: arc.slice(1, k).map(([x, z]) => [x, z, 6] as Pt) },
    { act: 'mirror', arg: 'left' },
    { act: 'signal', arg: 'left' },
    { drive: [...arc.slice(k).map(([x, z]) => [x, z, 6] as Pt), [nbLane(1), Z.dualStart + 12, 8]] },
    { act: 'signal', arg: 'off' }
  ];
}

export { OKEMENT, rbPath, nbLane, NB3, Z, SLIP, A1, laneChange, combeLane, pullIn, secure };
