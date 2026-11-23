/**
 * Scripted "good driver" runs of each Week 1 test route, used by the e2e
 * tests (expect a clean pass) and for screenshots. Steps go through the same
 * actions as the touch controls (see ScriptStep in src/app/screens/drive.ts).
 */
type Step =
  | { act: 'belt' | 'handbrake' | 'mirror' | 'look' | 'signal' | 'gear'; arg?: string }
  | { brake: boolean }
  | { wait: number }
  | { drive: Array<[number, number, number]> }
  | { waitGap: Array<[number, number]>; secs?: number }
  | { waitFinishAsked: true }
  | { moveOff: 'left' | 'right' };

const secure: Step[] = [{ waitFinishAsked: true }, { brake: true }, { act: 'handbrake' }, { act: 'gear', arg: 'P' }, { act: 'signal', arg: 'off' }];
const pullIn = (pts: Array<[number, number, number]>): Step[] => [{ act: 'mirror', arg: 'interior' }, { act: 'mirror', arg: 'left' }, { act: 'signal', arg: 'left' }, { drive: pts }];
const stopHere: Step[] = [{ brake: true }, { act: 'handbrake' }, { act: 'signal', arg: 'off' }, { wait: 1.2 }];
const offSignal: Step = { act: 'signal', arg: 'off' };

export const ROUTES: Record<number, Step[]> = {
  2: [
    { moveOff: 'right' },
    { drive: [[38.1, -52, 4]] },
    offSignal,
    { drive: [[38.1, -84, 6]] },
    ...pullIn([[37.6, -97, 3], [37.35, -104, 0]]),
    ...stopHere,
    { moveOff: 'right' },
    { drive: [[40.2, -110, 3], [40.2, -125, 5]] },
    offSignal,
    { drive: [[38.1, -134, 5]] },
    ...pullIn([[37.6, -146, 2.5], [37.35, -152, 0]]),
    ...stopHere,
    { moveOff: 'right' },
    { drive: [[40.3, -163, 3], [40.3, -192, 6]] },
    offSignal,
    { drive: [[38.1, -204, 6], [38.1, -250, 7]] },
    ...pullIn([[37.6, -264, 3], [37.35, -271, 0]]),
    ...secure
  ],
  3: [
    { moveOff: 'right' },
    { drive: [[38.1, -52, 4]] },
    offSignal,
    { drive: [[38.1, -100, 7], [40.3, -111, 5], [40.3, -125, 5], [38.1, -134, 5], [38.1, -150, 3], [38.1, -156, 0]] },
    { wait: 9 },
    { act: 'mirror', arg: 'interior' },
    { drive: [[40.3, -164, 3], [40.3, -192, 6], [38.1, -204, 6], [38.1, -250, 7]] },
    ...pullIn([[37.6, -264, 3], [37.35, -271, 0]]),
    ...secure
  ],
  4: [
    { moveOff: 'right' },
    { drive: [[-385, -1.9, 8]] },
    offSignal,
    { drive: [[-250, -1.9, 20], [-215, -1.9, 13], [-80, -1.9, 13], [-66, -1.9, 8.5], [-30, -1.9, 6], [-25, -1.9, 0]] },
    { waitGap: [[-25, 1.9]], secs: 8 },
    { act: 'mirror', arg: 'interior' },
    { drive: [[-16, 0.05, 4], [4, 0.05, 6], [9, -1.9, 7], [18, -1.9, 8.5]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'signal', arg: 'left' },
    { drive: [[30, -1.9, 4], [35.5, -2.6, 3.5], [38.1, -7, 3.5], [38.1, -25, 5], [38.1, -70, 7]] },
    ...pullIn([[37.6, -97, 3], [37.35, -104, 0]]),
    ...secure
  ],
  5: [
    { moveOff: 'right' },
    { drive: [[214, 1.9, 5]] },
    offSignal,
    { drive: [[136, 1.9, 8], [131, 1.9, 3], [129, 1.9, 0]] },
    { waitGap: [[129, -1.9]], secs: 11 },
    { act: 'mirror', arg: 'interior' },
    { drive: [[121, -0.05, 5], [99, -0.05, 6], [94, 1.9, 7], [-52, 1.9, 8.5], [-60, 1.9, 8.5], [-158, 1.9, 13], [-176, 1.9, 7]] },
    ...pullIn([[-184, 2.3, 4], [-190, 2.65, 0]]),
    ...secure
  ],
  6: [
    { moveOff: 'right' },
    { drive: [[138.1, 90, 4]] },
    offSignal,
    { drive: [[138.1, 22, 7]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'signal', arg: 'left' },
    { drive: [[138.1, 10, 3], [138.1, 7.2, 0]] },
    { act: 'look', arg: 'right' },
    { act: 'look', arg: 'left' },
    { act: 'look', arg: 'right' },
    { waitGap: [[140, 1.9], [140, -1.9]], secs: 7 },
    { drive: [[137, 3.4, 3], [133, 2.1, 4], [131, 1.9, 3], [129, 1.9, 0]] },
    { waitGap: [[129, -1.9]], secs: 11 },
    { act: 'mirror', arg: 'interior' },
    { drive: [[121, -0.05, 5], [99, -0.05, 6], [94, 1.9, 7], [60, 1.9, 8]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    { drive: [[50, 1.1, 4], [44.5, 0.6, 0]] },
    { waitGap: [[40, -1.9]], secs: 7 },
    { drive: [[41, -2.4, 3], [38.6, -8, 3.5], [38.1, -20, 6], [38.1, -70, 7]] },
    ...pullIn([[37.6, -97, 3], [37.35, -104, 0]]),
    ...secure
  ],
  7: [
    { moveOff: 'right' },
    { drive: [[41.9, -190, 5]] },
    offSignal,
    { drive: [[41.9, -40, 8]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    { drive: [[41.9, -12, 4], [41.9, -7.6, 0]] },
    { act: 'look', arg: 'right' },
    { act: 'look', arg: 'left' },
    { act: 'look', arg: 'right' },
    { waitGap: [[40, -1.9], [40, 1.9]], secs: 7 },
    { act: 'look', arg: 'right' },
    { act: 'look', arg: 'left' },
    { drive: [[41.4, -3, 3], [39, 0.8, 3], [35, 1.8, 4], [28, 1.9, 6], [-40, 1.9, 8.5], [-62, 1.9, 8.5], [-100, 1.9, 12]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    { drive: [[-140, 0.7, 6], [-151, 0.6, 0]] },
    { waitGap: [[-160, -1.9]], secs: 7 },
    { drive: [[-157, -1.6, 3], [-160.6, -7, 3.5], [-161.9, -20, 6], [-161.9, -278, 9], [-161.9, -288, 5], [-158, -298.5, 4], [-150, -301.9, 5], [-94, -301.9, 7], [-86, -299.7, 5], [-72, -299.7, 6], [-66, -301.9, 7], [10, -301.9, 8]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    { drive: [[25, -300.6, 5], [33, -300.4, 3], [38, -298.5, 3], [40.9, -294, 3], [41.9, -285, 5], [41.9, -258, 6], [41.9, -252, 0]] },
    // Parked cars on our side and the red car coming: wait for it (rule 163).
    { wait: 1 },
    { waitGap: [[38.1, -246]], secs: 16 },
    { act: 'mirror', arg: 'interior' },
    { drive: [[39.6, -244, 4], [39.6, -226, 5], [41.9, -219, 6], [41.9, -150, 7], [41.9, -40, 8]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'signal', arg: 'left' },
    { drive: [[41.9, -12, 4], [41.9, -7.6, 0]] },
    { act: 'look', arg: 'right' },
    { act: 'look', arg: 'left' },
    { act: 'look', arg: 'right' },
    { waitGap: [[40, -1.9]], secs: 7 },
    { act: 'look', arg: 'right' },
    { act: 'look', arg: 'left' },
    { drive: [[42.6, -3.4, 3], [46.5, -2.1, 4], [54, -1.9, 6], [100, -1.9, 8]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    { drive: [[124, -1.9, 7], [131, -0.6, 3], [134.5, -0.5, 0]] },
    { waitGap: [[140, 1.9]], secs: 7 },
    { drive: [[138.6, 1.8, 3], [141.2, 6, 3.5], [141.9, 14, 5], [141.9, 22, 5]] },
    ...pullIn([[142.2, 30, 3], [142.65, 38, 0]]),
    ...secure
  ]
};

/** Guided drives that differ from the test route. Others reuse ROUTES (minus the final securing step). */
export const GUIDED: Record<number, Step[]> = {
  6: [
    { moveOff: 'right' },
    { drive: [[41.9, -66, 4]] },
    offSignal,
    { drive: [[41.9, -40, 7]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'signal', arg: 'left' },
    { drive: [[41.9, -12, 4], [41.9, -7.6, 0]] },
    { act: 'look', arg: 'right' },
    { act: 'look', arg: 'left' },
    { waitGap: [[40, -1.9]], secs: 7 },
    { act: 'look', arg: 'right' },
    { drive: [[42.6, -3.4, 3], [46.5, -2.1, 4], [54, -1.9, 6], [100, -1.9, 8]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'signal', arg: 'right' },
    { drive: [[124, -1.9, 7], [131, -0.6, 3], [134.5, -0.5, 0]] },
    { waitGap: [[140, 1.9]], secs: 7 },
    { drive: [[138.6, 1.8, 3], [141.2, 6, 3.5], [141.9, 14, 5], [141.9, 22, 5]] },
    ...pullIn([[142.2, 30, 3], [142.65, 38, 0]]),
    { brake: true },
    { act: 'handbrake' }
  ]
};

/** The steps for a guided run: the special route, or the test route without waiting for the examiner. */
export function guidedSteps(day: number): Step[] {
  return GUIDED[day] ?? ROUTES[day].filter((st) => !('waitFinishAsked' in st));
}
