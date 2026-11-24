/**
 * Scripted careful drives of the Week 2 (Mill Town) test routes. Like
 * routes.ts, but roundabout arcs come from the same helpers the lessons use.
 */
import { R1, R2, M1, MAGIC, rbArc } from '../../src/world/scenes/millTownLayout';

const [MN, ME, MW] = MAGIC;

type Pt = [number, number, number];
type Step =
  | { act: 'belt' | 'handbrake' | 'mirror' | 'look' | 'signal' | 'gear'; arg?: string }
  | { brake: boolean }
  | { wait: number }
  | { drive: Pt[] }
  | { reverse: Pt[] }
  | { waitGap: Array<[number, number]>; secs?: number }
  | { waitFinishAsked: true }
  | { moveOff: 'left' | 'right' };

const secure: Step[] = [{ waitFinishAsked: true }, { brake: true }, { act: 'handbrake' }, { act: 'gear', arg: 'P' }, { act: 'signal', arg: 'off' }];
const pullIn = (pts: Pt[]): Step[] => [{ act: 'mirror', arg: 'interior' }, { act: 'mirror', arg: 'left' }, { act: 'signal', arg: 'left' }, { drive: pts }];

/**
 * Drive across a roundabout: stop at the give way line, look right, wait for
 * a gap, look again, go. Signal left at `signalLeftAt` (fraction of the arc)
 * when leaving by an exit after the first.
 */
function roundabout(rb: typeof R1, from: string, to: string, opts: { signalLeftAt?: number; speed?: number; startAt?: [number, number] } = {}): Step[] {
  const arc = rbArc(rb, from, to);
  if (opts.startAt) arc[0] = opts.startAt;
  const [sx, sz] = arc[0];
  // Stop with the front of the car just short of the give way line.
  const [nx, nz] = arc[1];
  const len = Math.hypot(nx - sx, nz - sz);
  const ux = (nx - sx) / len;
  const uz = (nz - sz) / len;
  const stop: Pt = [sx - ux * 0.6, sz - uz * 0.6, 0];
  const v = opts.speed ?? (rb.mini ? 3.5 : 5);
  const body = arc.slice(1).map(([x, z]) => [x, z, v] as Pt);
  const merge: Array<[number, number]> = arc.slice(1, 4).map(([x, z]) => [x, z]);
  const steps: Step[] = [{ drive: [[sx - ux * 8, sz - uz * 8, 4], stop] }, { act: 'look', arg: 'right' }, { waitGap: merge, secs: 4 }, { act: 'look', arg: 'right' }];
  if (opts.signalLeftAt !== undefined) {
    const k = Math.max(1, Math.round(body.length * opts.signalLeftAt));
    steps.push({ drive: body.slice(0, k) }, { act: 'mirror', arg: 'left' }, { act: 'signal', arg: 'left' }, { drive: body.slice(k) });
  } else steps.push({ drive: body });
  // Clear the roundabout straight along the exit road, then cancel the signal (gentle exits don't self-cancel).
  const [bx, bz] = arc[arc.length - 1];
  const out = rb.arms.find((a) => a.id === to)!.angle;
  steps.push({ drive: [[bx + Math.sin(out) * 7, bz + Math.cos(out) * 7, v + 1]] }, { act: 'signal', arg: 'off' });
  return steps;
}

export const ROUTES2: Record<number, Step[]> = {
  8: [
    { moveOff: 'right' },
    { drive: [[-110, -1.9, 6]] },
    { act: 'signal', arg: 'off' },
    { drive: [[-45, -1.9, 8.5]] },
    // R1 from the west, third exit (Canal Street): signal right, then left to leave.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    ...roundabout(R1, 'W', 'N', { signalLeftAt: 0.72 }),
    { drive: [[1.9, 40, 6], [1.9, 140, 8]] },
    // Mini-roundabout, second exit (right): signal right.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    ...roundabout(M1, 'S', 'W'),
    { act: 'signal', arg: 'off' },
    { drive: [[-20, 181.9, 6], [-138, 181.9, 8], [-146, 181.2, 4], [-151.6, 176, 4], [-151.9, 168, 6], [-151.9, 30, 8]] },
    // Give way junction onto Mill Road, turning right.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    { drive: [[-151.9, 14, 4], [-151.9, 7, 0]] },
    { act: 'look', arg: 'right' },
    { act: 'look', arg: 'left' },
    { waitGap: [[-150, -1.9], [-150, 1.9]], secs: 7 },
    { act: 'look', arg: 'right' },
    { act: 'look', arg: 'left' },
    { drive: [[-151.2, 2.5, 3], [-148.6, -0.6, 3.5], [-144, -1.9, 5], [-110, -1.9, 7], [-45, -1.9, 8.5]] },
    // R1 again, straight on (second exit): no approach signal, left after the first exit.
    ...roundabout(R1, 'W', 'E', { signalLeftAt: 0.5 }),
    { drive: [[30, -1.9, 7], [62, -1.9, 7]] },
    { act: 'signal', arg: 'off' },
    ...pullIn([[76, -2.4, 4], [82, -2.65, 0]]),
    ...secure
  ]
  ,
  9: [
    { moveOff: 'right' },
    { drive: [[198.1, -70, 6]] },
    { act: 'signal', arg: 'off' },
    { drive: [[198.1, -140, 7], [198.1, -150, 6]] },
    // MN from Southway: turn right (third/last exit), signal right.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    ...roundabout(MN, 'N', 'E'),
    { drive: [[233, -176.9, 6], [236.6, -177.6, 4], [238.1, -181, 4], [238.1, -192, 5]] },
    // ME: straight on, no signal.
    { act: 'mirror', arg: 'interior' },
    ...roundabout(ME, 'N', 'S'),
    { drive: [[238.1, -249, 6], [237.4, -252.4, 4], [234, -253.1, 4], [166, -253.1, 7], [162.6, -252.4, 4], [161.9, -249, 4], [161.9, -236, 5]] },
    // MW: straight on.
    { act: 'mirror', arg: 'interior' },
    ...roundabout(MW, 'S', 'N'),
    { drive: [[161.9, -181, 6], [162.6, -177.6, 4], [166, -176.9, 4], [176, -176.9, 5]] },
    // MN again, from the ring: right, back up Southway.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    ...roundabout(MN, 'W', 'N'),
    { drive: [[201.9, -150, 7], [201.9, -110, 8]] },
    ...pullIn([[202.4, -94, 4], [202.65, -86, 0]]),
    ...secure
  ]
  ,
  // Day 10: pelican, zebra, left at the lights, puffin, pull up. The driver
  // stops for red lights and people on crossings by itself (as AI cars do).
  10: [
    { moveOff: 'right' },
    { drive: [[-1.9, -55, 6]] },
    { act: 'signal', arg: 'off' },
    { act: 'mirror', arg: 'interior' },
    { drive: [[-1.9, -96, 7], [-1.9, -122, 6], [-1.9, -125, 4], [-1.4, -129.6, 4], [2, -131.9, 4], [12, -131.9, 6]] },
    { act: 'mirror', arg: 'interior' },
    { drive: [[38, -131.9, 6], [70, -131.9, 8]] },
    // Left at the lights onto Bridge Street.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'left' },
    { act: 'signal', arg: 'left' },
    { drive: [[88, -131.9, 5], [93.4, -131.9, 3.5], [96.5, -132.7, 3.5], [98.1, -135.5, 3.5], [98.1, -142, 5]] },
    { act: 'signal', arg: 'off' },
    { act: 'mirror', arg: 'interior' },
    { drive: [[98.1, -165, 7], [98.1, -186, 6]] },
    ...pullIn([[97.8, -194, 4], [97.35, -199, 0]]),
    ...secure
  ],
  // Day 11: left onto Canal Side past the bus lane, right at the lights (waiting in the box for oncoming traffic), puffin, pull up.
  11: [
    { moveOff: 'right' },
    { drive: [[198.1, -55, 6]] },
    { act: 'signal', arg: 'off' },
    { drive: [[198.1, -100, 8]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'left' },
    { act: 'signal', arg: 'left' },
    { drive: [[198.1, -114, 5], [198.1, -120, 4], [197.4, -124.5, 3.5], [194, -127.6, 3.5], [188, -128.1, 5]] },
    { act: 'signal', arg: 'off' },
    { drive: [[170, -128.1, 8], [125, -128.1, 8]] },
    // Right at the lights: into the box, wait for oncoming traffic, then turn.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    { drive: [[112, -128.4, 5], [106, -128.6, 3], [101.8, -128.8, 0]] },
    { waitGap: [[104, -131.9], [99, -131.9], [94, -131.9]], secs: 5 },
    { act: 'look', arg: 'right' },
    { drive: [[99.4, -130.6, 3], [98.3, -133.5, 3.5], [98.1, -142, 5]] },
    { act: 'signal', arg: 'off' },
    { act: 'mirror', arg: 'interior' },
    { drive: [[98.1, -165, 7], [98.1, -186, 6]] },
    ...pullIn([[97.8, -194, 4], [97.35, -199, 0]]),
    ...secure
  ]
  ,
  // Day 12: into the car park and reverse into bay S7 (on a 5.5 m arc), looking all round first.
  12: [
    { moveOff: 'right' },
    { drive: [[98.1, -62, 5]] },
    { act: 'signal', arg: 'off' },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'left' },
    { act: 'signal', arg: 'left' },
    { drive: [[98.1, -77, 4], [97.8, -82, 3], [95.2, -84.9, 3], [90, -85.5, 3.5]] },
    { act: 'signal', arg: 'off' },
    { drive: [[70, -85.5, 4], [60.75, -85.5, 0]] },
    { brake: true },
    { act: 'gear', arg: 'R' },
    { act: 'mirror', arg: 'interior' },
    { act: 'look', arg: 'left' },
    { act: 'look', arg: 'right' },
    { reverse: [[63.5, -86.24, 1.2], [65.51, -88.25, 1.2], [66.25, -91, 1.1], [66.25, -94, 1], [66.25, -97.6, 0]] },
    ...secure
  ]
  ,
  // Day 13: left into the Ringway (people crossing go first), overtake the cyclist wide, school patrol, pull up.
  13: [
    { moveOff: 'right' },
    { drive: [[-110, 1.9, 6]] },
    { act: 'signal', arg: 'off' },
    { drive: [[-132, 1.9, 8]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'left' },
    { act: 'signal', arg: 'left' },
    { drive: [[-142, 1.9, 5], [-146.4, 2.7, 3.5], [-148.1, 6, 3.5], [-148.1, 8.2, 3]] },
    { act: 'signal', arg: 'off' },
    { drive: [[-148.1, 18, 5]] },
    // The cyclist is just ahead: check, then pass wide (well over 1.5 m) and pull back in.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    { drive: [[-150.6, 30, 8.6], [-150.6, 64, 8.6]] },
    { act: 'signal', arg: 'off' },
    { act: 'mirror', arg: 'interior' },
    { drive: [[-149.2, 72, 8], [-148.1, 80, 7], [-148.1, 140, 7.5], [-148.1, 168, 6], [-147.6, 174.6, 4], [-145, 177.6, 4], [-136, 178.1, 6]] },
    ...pullIn([[-122, 178, 5], [-112, 177.45, 3], [-108, 177.35, 0]]),
    ...secure
  ]
  ,
  // Day 14 BOSS (busy traffic): Ringway past the cyclist and school, M1 first exit, R1 right, R2 left lane first exit,
  // left onto Canal Side past the bus lane, the lights, the zebra and the pelican, then pull up on Station Road.
  14: [
    { moveOff: 'right' },
    { drive: [[-110, 1.9, 6]] },
    { act: 'signal', arg: 'off' },
    { drive: [[-132, 1.9, 8]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'left' },
    { act: 'signal', arg: 'left' },
    { drive: [[-142, 1.9, 5], [-146.4, 2.7, 3.5], [-148.1, 6, 3.5], [-148.1, 8.2, 3]] },
    { act: 'signal', arg: 'off' },
    { drive: [[-148.1, 18, 5]] },
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    { drive: [[-150.6, 30, 8.6], [-150.6, 64, 8.6]] },
    { act: 'signal', arg: 'off' },
    { act: 'mirror', arg: 'interior' },
    { drive: [[-149.2, 72, 8], [-148.1, 80, 7], [-148.1, 140, 7.5], [-148.1, 168, 6], [-147.6, 174.6, 4], [-145, 177.6, 4], [-136, 178.1, 6], [-40, 178.1, 8.5]] },
    // M1: first exit (left).
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'left' },
    { act: 'signal', arg: 'left' },
    ...roundabout(M1, 'W', 'S'),
    { drive: [[-1.9, 150, 6], [-1.9, 60, 8.5]] },
    // R1: third exit (right).
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'right' },
    { act: 'signal', arg: 'right' },
    ...roundabout(R1, 'N', 'E', { signalLeftAt: 0.78 }),
    { drive: [[60, -1.9, 8.5], [128, -1.9, 8.5]] },
    // R2: left-hand lane, first exit.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'left' },
    { act: 'signal', arg: 'left' },
    { drive: [[141, -1.9, 7], [146, -3.3, 6], [152, -5.7, 6]] },
    ...roundabout(R2, 'W', 'S', { startAt: [rbArc(R2, 'W', 'S')[0][0], -5.7] }),
    { drive: [[198.1, -60, 8], [198.1, -100, 8]] },
    // Left onto Canal Side: keep out of the bus lane.
    { act: 'mirror', arg: 'interior' },
    { act: 'mirror', arg: 'left' },
    { act: 'signal', arg: 'left' },
    { drive: [[198.1, -114, 5], [198.1, -120, 4], [197.4, -124.5, 3.5], [194, -127.6, 3.5], [188, -128.1, 5]] },
    { act: 'signal', arg: 'off' },
    { drive: [[170, -128.1, 8], [125, -128.1, 8]] },
    { act: 'mirror', arg: 'interior' },
    { drive: [[106, -128.1, 6], [94, -128.1, 6.5], [60, -128.1, 8]] },
    { act: 'mirror', arg: 'interior' },
    { drive: [[20, -128.1, 7], [8, -128.1, 5], [3.4, -127.5, 4], [1.9, -124, 4], [1.9, -116, 5]] },
    { act: 'mirror', arg: 'interior' },
    { drive: [[1.9, -100, 6]] },
    ...pullIn([[2.4, -92, 4], [2.65, -86, 0]]),
    ...secure
  ]
};
