import type { Car } from './car';
import type { Traffic } from './traffic';
import type { Recorder } from '../rules/recorder';
import type { StreetControl } from './street';
import { ROAD_USER_SIZE } from './traffic';
import { carriagewayAt, laneNumber } from '../world/layout';
import type { LightsState } from '../world/conditions';
import type { DriveEvent, SignalState } from '../rules/types';
import { mph } from '../rules/types';
import { angleDiff } from '../rules/checks';
import { inRect, grow, junctionBoxAt, laneAt, roundaboutAt, polarAngle, distTo, circulationHeading, type Rect, type Roundabout, type SceneLayout } from '../world/layout';

type Emit = (ev: DriveEvent) => void;

/**
 * Works out the road situation around the player's car each tick and turns
 * it into rule events: passing parked cars, junction lines, conflicts with
 * traffic, completed turns, roundabouts and where the car is pulled up.
 * Pure of rendering, so it can be reasoned about (and tested) on its own.
 */
export class RoadAnalyser {
  constructor(
    private L: SceneLayout,
    private car: Car,
    private traffic: Traffic,
    private recorder: Recorder
  ) {}

  /** Signals and crossings, when the scene has them. */
  street: StreetControl | null = null;

  // ---------- Each tick: situation facts for the rules ----------
  situation(t: number, limit: number, o: { pullingUp: boolean; movedOffAt: number }) {
    const { L, car, traffic } = this;
    const [fx, fz] = car.forward;
    const [rx, rz] = car.right;
    let passingObstruction = false;
    let clearance: number | null = null;
    for (const ob of L.obstacles) {
      if (ob.kind !== 'car' && ob.kind !== 'van') continue;
      const dx = (ob.x0 + ob.x1) / 2 - car.x;
      const dz = (ob.z0 + ob.z1) / 2 - car.z;
      const along = dx * fx + dz * fz;
      const across = dx * rx + dz * rz; // negative = on our left
      const halfLen = Math.max(ob.x1 - ob.x0, ob.z1 - ob.z0) / 2;
      const halfWid = Math.min(ob.x1 - ob.x0, ob.z1 - ob.z0) / 2;
      if (across < 0 && across > -4.6 && along > -halfLen - 2 && along < halfLen + 9) {
        passingObstruction = true;
        if (Math.abs(along) < halfLen + 2) {
          const gap = -across - halfWid - car.width / 2;
          clearance = clearance === null ? gap : Math.min(clearance, gap);
        }
      }
    }
    // Overtaking a cyclist or horse rider counts as passing something on our side (rule 163).
    for (const c of traffic.cars) {
      if (c.kind !== 'bike' && c.kind !== 'horse') continue;
      const dx = c.x - car.x;
      const dz = c.z - car.z;
      const along = dx * fx + dz * fz;
      const across = dx * rx + dz * rz;
      if (Math.cos(c.heading - car.heading) > 0.7 && across < 0.5 && across > -4.6 && along > -6 && along < 14) passingObstruction = true;
    }
    const oncomingM = passingObstruction ? traffic.oncoming(car.x, car.z, car.heading) : null;
    const inDoubleWhite = (L.doubleWhite ?? []).some((r) => inRect(r, car.x, car.z));
    const inNoEntry = (L.noEntry ?? []).some((r) => inRect(r, car.x, car.z) && Math.cos(car.heading - r.into) > 0.5);
    const v = mph(car.speed);
    let clearAhead = !traffic.cars.some((c) => {
      const dx = c.x - car.x;
      const dz = c.z - car.z;
      const along = dx * fx + dz * fz;
      const across = Math.abs(dx * rx + dz * rz);
      return along > 0 && along < 45 && across < 2.5 && Math.cos(c.heading - car.heading) > 0.5;
    });
    const nearJunction =
      (L.junctions ?? []).some((j) => inRect(grow(j.box, 35), car.x, car.z)) ||
      !!roundaboutAt(L, car.x, car.z, 40) ||
      (L.stopLines ?? []).some((l) => Math.hypot(l.x - car.x, l.z - car.z) < 35);
    const nearParked = L.obstacles.some((ob) => (ob.kind === 'car' || ob.kind === 'van') && Math.hypot((ob.x0 + ob.x1) / 2 - car.x, (ob.z0 + ob.z1) / 2 - car.z) < 30);
    if (passingObstruction || nearParked) clearAhead = false;
    const undulySlow = v > 1 && v < limit * 0.4 && clearAhead && !nearJunction && !o.pullingUp && t - o.movedOffAt > 12;

    // Roundabouts: direction of travel and mini-roundabout centres.
    let rbWrongWay = false;
    let onMiniCentre: string | null = null;
    const rb = roundaboutAt(L, car.x, car.z);
    if (rb && Math.abs(car.speed) > 1 && distTo(rb, car.x, car.z) > rb.island + 0.5) {
      rbWrongWay = Math.cos(car.heading - circulationHeading(rb, car.x, car.z)) < -0.3;
    }
    for (const m of L.roundabouts ?? []) {
      if (!m.mini) continue;
      // Any wheel position (corner sample) on the painted centre.
      if (car.corners().some(([px, pz]) => distTo(m, px, pz) < m.island - 0.2)) onMiniCentre = m.id;
    }
    const onRoundabout = !!roundaboutAt(L, car.x, car.z, 18);
    const inBusLane = Math.abs(car.speed) > 1 && (L.busLanes ?? []).some((b) => inRect(b, car.x, car.z) && Math.cos(car.heading - b.heading) > 0.5);
    return { passingObstruction, clearance, oncomingM, inDoubleWhite, inNoEntry, undulySlow, rbWrongWay, onMiniCentre, onRoundabout, inBusLane };
  }

  // ---------- Junction give way / stop lines ----------
  private lineState = new Map<string, { before: boolean; minSpeed: number }>();
  junctionLines(t: number, emit: Emit): void {
    const { L, car } = this;
    const [fx, fz] = car.forward;
    const front = { x: car.x + fx * 2.05, z: car.z + fz * 2.05 };
    for (const j of L.junctions ?? []) {
      const ax = Math.sin(j.approach);
      const az = Math.cos(j.approach);
      const cx = (j.line.x0 + j.line.x1) / 2;
      const cz = (j.line.z0 + j.line.z1) / 2;
      const sAlong = (front.x - cx) * ax + (front.z - cz) * az;
      const lateral = Math.abs((front.x - cx) * az - (front.z - cz) * ax);
      const halfW = Math.max(j.line.x1 - j.line.x0, j.line.z1 - j.line.z0) / 2;
      const st = this.lineState.get(j.id) ?? { before: false, minSpeed: Infinity };
      const aligned = Math.cos(car.heading - j.approach) > 0.5;
      if (lateral < halfW + 1.2 && aligned && sAlong < 0 && sAlong > -8) {
        st.before = true;
        st.minSpeed = Math.min(st.minSpeed, Math.abs(car.speed));
      } else if (st.before && sAlong >= 0 && lateral < halfW + 2) {
        emit({ type: 'emerge', t, junction: j.id, kind: j.kind, minSpeed: st.minSpeed });
        st.before = false;
        st.minSpeed = Infinity;
      } else if (sAlong < -8 || lateral > halfW + 4) {
        st.before = false;
        st.minSpeed = Infinity;
      }
      this.lineState.set(j.id, st);
    }
  }

  // ---------- Being in another car's path inside a junction box ----------
  conflicts(t: number, emit: Emit): void {
    const { L, car, traffic } = this;
    const [fx, fz] = car.forward;
    for (const p of [
      { x: car.x, z: car.z },
      { x: car.x + fx * 2, z: car.z + fz * 2 }
    ]) {
      const j = junctionBoxAt(L, p.x, p.z);
      if (!j) continue;
      for (const c of traffic.cars) {
        // A car waiting at its own give way line or lights isn't coming (AI waits for you).
        if (c.waiting || c.speed < 0.5 || traffic.willGiveWay(c)) continue;
        if (Math.abs(Math.cos(c.heading - car.heading)) > 0.75 && Math.cos(c.heading - car.heading) > 0) continue;
        const cfx = Math.sin(c.heading);
        const cfz = Math.cos(c.heading);
        const dx = p.x - c.x;
        const dz = p.z - c.z;
        const along = dx * cfx + dz * cfz;
        const across = Math.abs(dx * cfz - dz * cfx);
        if (along > 0 && along < 60 && across < 1.7) {
          const ttc = Math.max(0, along - 2.1 - 2.1) / Math.max(c.cruise, 0.5);
          emit({ type: 'conflict', t, ttc, junction: j.id });
        }
      }
    }
  }

  // ---------- Roundabouts: entry, exit, and pulling out in front of circulating traffic ----------
  private rbNow: Roundabout | null = null;
  private rbEntry: { rb: Roundabout; arm: string; angle: number; t: number; signal: SignalState; lane: 'left' | 'right' | null; onRing: Set<number> } | null = null;
  roundabouts(t: number, signal: SignalState, emit: Emit): void {
    const { L, car, traffic } = this;
    const rb = roundaboutAt(L, car.x, car.z);
    if (rb && rb !== this.rbNow) {
      // Entered: which arm did we come from?
      const a = polarAngle(rb, car.x, car.z);
      const arm = nearestArm(rb, a);
      let lane: 'left' | 'right' | null = null;
      if ((arm.entryLanes ?? 1) === 2) {
        // Lateral offset from the arm's centre line, measured to the inbound driver's left.
        const lx = -Math.cos(arm.angle);
        const lz = Math.sin(arm.angle);
        const lat = (car.x - rb.x) * lx + (car.z - rb.z) * lz;
        lane = lat > 3.8 ? 'left' : 'right';
      }
      const onRing = new Set(traffic.cars.filter((c) => distTo(rb, c.x, c.z) < rb.outer - 0.5).map((c) => c.id));
      this.rbEntry = { rb, arm: arm.id, angle: arm.angle, t, signal, lane, onRing };
      emit({ type: 'rbEnter', t, rb: rb.id, arm: arm.id, signal, lane, mini: !!rb.mini });
    } else if (!rb && this.rbNow && this.rbEntry && this.rbEntry.rb === this.rbNow) {
      const prev = this.rbNow;
      const a = polarAngle(prev, car.x, car.z);
      const arm = nearestArm(prev, a);
      let turn = this.rbEntry.angle - arm.angle;
      while (turn <= 0.3) turn += Math.PI * 2;
      if (turn > Math.PI * 2 + 0.3) turn -= Math.PI * 2;
      emit({ type: 'rbExit', t, rb: prev.id, fromArm: this.rbEntry.arm, toArm: arm.id, turn, signalAtEntry: this.rbEntry.signal, signalAtExit: signal, lane: this.rbEntry.lane, mini: !!prev.mini });
      this.rbEntry = null;
    }
    this.rbNow = rb;

    // Just joined: anyone already on the ring who now has to reach us soon?
    if (rb && this.rbEntry && t - this.rbEntry.t < 3) {
      for (const c of traffic.cars) {
        if (!this.rbEntry.onRing.has(c.id)) continue;
        const ttc = traffic.pathTimeTo(c, car.x, car.z, 2.4, 60);
        if (ttc < Infinity) emit({ type: 'conflict', t, ttc, junction: rb.id, roundabout: true });
      }
    }
  }

  // ---------- Completed turns (signal and mirror checks) ----------
  private lastTurnT = -Infinity;
  private lastTurnCheck = 0;
  detectTurn(t: number, emit: Emit): void {
    const { L, car, recorder } = this;
    if (t - this.lastTurnCheck < 0.2) return;
    this.lastTurnCheck = t;
    if (Math.abs(car.speed) < 0.5) return;
    const frames = recorder.frames.filter((f) => f.t >= Math.max(t - 9, this.lastTurnT));
    if (frames.length < 5) return;
    const h0 = frames[0].heading;
    if (Math.abs(angleDiff(car.heading, h0)) < 1.2) return;
    let i = frames.length - 1;
    while (i > 0 && Math.abs(angleDiff(frames[i].heading, car.heading)) < 1.05) i--;
    while (i > 0 && Math.abs(angleDiff(frames[i].heading, frames[i - 1].heading)) > 0.02) i--;
    const startF = frames[i];
    this.lastTurnT = t;
    if ((L.bends ?? []).some((b) => inRect(b, startF.x, startF.z))) return; // the road bends
    // Roundabouts are judged by their own rules (rule 186), not as turns.
    if (frames.slice(i).some((f) => roundaboutAt(L, f.x, f.z, 6))) return;
    // Reversing manoeuvres, and moving about inside a car park, aren't road turns.
    if (frames.slice(i).some((f) => f.speed < -0.1)) return;
    if ((L.carParks ?? []).some((r) => inRect(r, startF.x, startF.z))) return;
    const turnDh = angleDiff(car.heading, startF.heading);
    emit({ type: 'turn', t, dir: turnDh > 0 ? 'left' : 'right', startT: startF.t, signalAtStart: startF.signal });
  }

  // ---------- Fast roads: lanes, gaps, motorway rules, lights (Week 3) ----------
  private lastCw: { id: string; lane: number; kind: string } | null = null;
  private passingRight = new Map<number, number>();
  private reversedOnMotorway = false;
  fastRoads(t: number, lights: LightsState, cond: { dark: boolean; wet: boolean; poorVisibility: boolean }, emit: Emit) {
    const { L, car, traffic } = this;
    const [fx, fz] = car.forward;
    const [rx, rz] = car.right;
    const v = Math.abs(car.speed);
    const cw = carriagewayAt(L, car.x, car.z);
    const laneNo = cw && Math.cos(car.heading - cw.heading) > 0.5 ? laneNumber(cw, car.x) : null;

    // Vehicles around us, in our frame (along = ahead, across = to our right).
    const rel = traffic.cars.map((c) => {
      const dx = c.x - car.x;
      const dz = c.z - car.z;
      return { c, along: dx * fx + dz * fz, across: dx * rx + dz * rz, same: Math.cos(c.heading - car.heading) > 0.7, opposite: Math.cos(c.heading - car.heading) < -0.7, len: ROAD_USER_SIZE[c.kind ?? 'car'].len };
    });
    // Time gap to the vehicle ahead in our lane (rule 126).
    let gapM = Infinity;
    let ahead: (typeof rel)[number] | null = null;
    for (const o of rel) {
      if (!o.same || Math.abs(o.across) > 1.7 || o.along <= 0) continue;
      const g = o.along - o.len / 2 - car.length / 2;
      if (g < gapM) {
        gapM = g;
        ahead = o;
      }
    }
    const followGapS = v > 8 && gapM < 160 ? Math.max(0, gapM) / v : null;
    const overtaking = !!ahead && gapM < 120 && ahead.c.speed < v - 1;

    // Lane discipline: is the lane to our left clear for a good way ahead?
    let leftLaneClear = false;
    if (cw && laneNo && laneNo > 1) {
      leftLaneClear = !rel.some((o) => o.same && o.across < -1.9 && o.across > -1.9 - cw.laneWidth * 1.2 && o.along > -25 && o.along < 140);
    }

    // Lane changes and merges.
    if (cw && laneNo && v > 3) {
      const now = { id: cw.id, lane: laneNo, kind: cw.kind };
      const prev = this.lastCw;
      if (prev && (prev.id !== now.id || prev.lane !== now.lane)) {
        const sideways = prev.id === now.id ? (now.lane > prev.lane ? 'right' : 'left') : cw.kind === 'slip' ? 'left' : 'right';
        emit({ type: 'laneChange', t, dir: sideways, from: `${prev.id}:${prev.lane}`, to: `${now.id}:${now.lane}` });
        if (prev.kind === 'slip' && cw.kind !== 'slip') {
          // Joining from a slip road (rule 259): who's coming up behind in lane 1, and how close is the car ahead?
          let ttcBehind = Infinity;
          let gapAhead = Infinity;
          for (const o of rel) {
            if (!o.same || Math.abs(o.across) > 1.9) continue;
            if (o.along < 0) {
              const closing = o.c.speed - v;
              const gap = -o.along - o.len / 2 - car.length / 2;
              if (closing > 0.3) ttcBehind = Math.min(ttcBehind, Math.max(0, gap) / closing);
              else if (gap < 2) ttcBehind = 0;
            } else gapAhead = Math.min(gapAhead, o.along - o.len / 2 - car.length / 2);
          }
          const solid = (L.solidMerges ?? []).some((m) => car.z >= m.z0 && car.z <= m.z1);
          emit({ type: 'merge', t, ttcBehind, gapAhead, speed: v, crossedSolid: solid });
        }
      }
      this.lastCw = now;
    } else if (!cw) this.lastCw = null;

    // Undertaking: going past a moving vehicle that's in the lane to our right (rule 268).
    if (cw && cw.kind !== 'slip') {
      for (const o of rel) {
        if (!o.same || o.across < 1.9 || o.across > 1.9 + cw.laneWidth * 1.3 || o.c.speed < 12) continue;
        const was = this.passingRight.get(o.c.id);
        if (was !== undefined && was < 0 && o.along < -o.len / 2 - 2 && v > o.c.speed + 1.5) emit({ type: 'undertake', t });
        this.passingRight.set(o.c.id, o.along);
      }
    }

    const inRectAny = (rs: Rect[] | undefined) => (rs ?? []).some((r) => inRect(r, car.x, car.z));
    const onMotorway = inRectAny(L.motorways);
    if (onMotorway && car.speed < -0.5 && !this.reversedOnMotorway) {
      this.reversedOnMotorway = true;
      emit({ type: 'motorwayReverse', t });
    }
    if (car.speed >= 0) this.reversedOnMotorway = false;
    const queue = !!ahead && gapM < 40;
    const slow = (L.slowZones ?? []).find((r) => inRect(r, car.x, car.z));
    // Dazzle: main beam with someone close ahead, or oncoming on a two-way road (rules 114, 115).
    const twoWay = !cw;
    const dazzling =
      lights === 'main' &&
      (cond.dark || cond.poorVisibility) &&
      rel.some((o) => (o.same && o.along > 0 && o.along < 70 && Math.abs(o.across) < 4) || (twoWay && o.opposite && o.along > 0 && o.along < 160 && Math.abs(o.across) < 10));
    return {
      followGapS,
      laneNo,
      leftLaneClear,
      overtaking,
      inHardShoulder: v > 3 && inRectAny(L.hardShoulders),
      inClosedLane: v > 3 && inRectAny(L.closedLanes),
      onMotorway,
      wrongWayCarriageway: !!cw && v > 2 && Math.cos(car.heading - cw.heading) < -0.5,
      slowZoneMph: slow ? slow.mph : null,
      stoppedOnMotorway: onMotorway && v < 0.5 && !queue,
      lights,
      dark: cond.dark,
      wet: cond.wet,
      poorVisibility: cond.poorVisibility,
      dazzling
    };
  }

  // ---------- Overtaking cyclists and horse riders (rules 163, 212, 215) ----------
  private passing = new Map<number, { minGap: number; maxSpeed: number; alongside: boolean }>();
  vulnerable(t: number, emit: Emit): void {
    const { car, traffic } = this;
    const [fx, fz] = car.forward;
    const [rx, rz] = car.right;
    for (const c of traffic.cars) {
      const kind = c.kind ?? 'car';
      if (kind !== 'bike' && kind !== 'horse') continue;
      const size = ROAD_USER_SIZE[kind];
      const dx = c.x - car.x;
      const dz = c.z - car.z;
      const along = dx * fx + dz * fz;
      const across = dx * rx + dz * rz;
      const st = this.passing.get(c.id) ?? { minGap: Infinity, maxSpeed: 0, alongside: false };
      const reach = car.length / 2 + size.len / 2 + 1.5;
      if (Math.abs(along) < reach && Math.abs(across) < 6 && Math.cos(c.heading - car.heading) > 0.5) {
        st.alongside = true;
        st.minGap = Math.min(st.minGap, Math.abs(across) - car.width / 2 - size.wid / 2);
        st.maxSpeed = Math.max(st.maxSpeed, Math.abs(car.speed));
      } else if (st.alongside && along < -reach) {
        // We've gone past them.
        emit({ type: 'passVulnerable', t, kind, gap: st.minGap, speed: st.maxSpeed });
        st.alongside = false;
        st.minGap = Infinity;
        st.maxSpeed = 0;
      } else if (Math.abs(along) > 40) {
        st.alongside = false;
        st.minGap = Infinity;
        st.maxSpeed = 0;
      }
      this.passing.set(c.id, st);
    }
  }

  // ---------- Signals, crossings and box junctions ----------
  private stopState = new Map<string, { before: boolean; amberAt: { dist: number; speed: number } | null; lastAspect: string | null }>();
  private blocked = new Set<string>();
  private boxStill = 0;
  private boxFlagged = false;
  streetEvents(t: number, dt: number, signal: SignalState, emit: Emit): void {
    const { L, car, street } = this;
    if (!street) return;
    const [fx, fz] = car.forward;
    const front = { x: car.x + fx * 2.05, z: car.z + fz * 2.05 };
    for (const line of L.stopLines ?? []) {
      const ax = Math.sin(line.heading);
      const az = Math.cos(line.heading);
      const sAlong = (front.x - line.x) * ax + (front.z - line.z) * az;
      const lateral = Math.abs((front.x - line.x) * az - (front.z - line.z) * ax);
      const aligned = Math.cos(car.heading - line.heading) > 0.5;
      const st = this.stopState.get(line.id) ?? { before: false, amberAt: null, lastAspect: null };
      const aspect = street.aspectAt(line);
      if (aligned && lateral < 2.4 && sAlong < 0 && sAlong > -70) {
        // Approaching: note where we were when the lights turned amber.
        if (aspect === 'amber' && st.lastAspect !== 'amber') st.amberAt = { dist: -sAlong, speed: Math.abs(car.speed) };
        if (aspect !== 'amber') st.amberAt = null;
        st.before = true;
      } else if (st.before && sAlong >= 0 && lateral < 3) {
        const cr = street.crossing(line.crossing);
        const on = cr ? street.pedsOn(cr.id) : [];
        // Someone in our half of the road, or within a few metres of the car's line.
        const pedInPath = on.some((p) => {
          const dx = p.x - car.x;
          const dz = p.z - car.z;
          const across = Math.abs(dx * fz - dz * fx);
          return across < 3.2;
        });
        emit({
          type: 'stopLine',
          t,
          line: line.id,
          kind: cr ? cr.kind : 'signals',
          aspect,
          amberAt: aspect === 'amber' ? st.amberAt : null,
          pedsOn: on.length,
          pedInPath,
          pedWaiting: cr && (cr.kind === 'zebra' || cr.kind === 'informal' || cr.kind === 'patrol') ? street.pedWaiting(cr.id) : false
        });
        st.before = false;
        st.amberAt = null;
      } else if (sAlong < -70 || lateral > 5 || !aligned) {
        st.before = false;
        st.amberAt = null;
      }
      st.lastAspect = aspect;
      this.stopState.set(line.id, st);
    }

    const still = Math.abs(car.speed) < 0.1;
    // Waiting on a crossing (rule 192).
    for (const cr of L.crossings ?? []) {
      const on = still && car.corners().some(([px, pz]) => inRect(cr.area, px, pz));
      if (on && !this.blocked.has(cr.id)) {
        this.blocked.add(cr.id);
        emit({ type: 'blockCrossing', t, crossing: cr.id });
      } else if (!on && !still) this.blocked.delete(cr.id);
    }
    // Waiting in a box junction (rule 174).
    const box = (L.boxes ?? []).find((b) => inRect(b, car.x, car.z));
    this.boxStill = box && still ? this.boxStill + dt : 0;
    if (!box) this.boxFlagged = false;
    if (box && this.boxStill > 1.5 && !this.boxFlagged) {
      this.boxFlagged = true;
      emit({ type: 'boxStop', t, box: box.id, signal });
    }
  }

  /** Near a roundabout entry, junction, signals or crossing: somewhere you stop in traffic, not to park. */
  atControl(): boolean {
    const { L, car } = this;
    if (roundaboutAt(L, car.x, car.z, 12)) return true;
    if ((L.junctions ?? []).some((j) => inRect(grow(j.box, 10), car.x, car.z))) return true;
    return (L.stopLines ?? []).some((l) => Math.hypot(l.x - car.x, l.z - car.z) < 12);
  }

  // ---------- Where the car is pulled up ----------
  pullUpInfo() {
    const { L, car } = this;
    const onYellow = (L.yellow ?? []).find((y) => inRect(y, car.x, car.z))?.kind ?? null;
    const near: Rect[] = [
      ...(L.junctions ?? []).map((j) => j.box),
      ...(L.noEntry ?? []),
      ...(L.roundabouts ?? []).map((r) => ({ x0: r.x - r.outer, x1: r.x + r.outer, z0: r.z - r.outer, z1: r.z + r.outer })),
      ...(L.boxes ?? [])
    ];
    let nearJunctionM: number | null = null;
    for (const r of near) {
      const dx = Math.max(r.x0 - car.x, 0, car.x - r.x1);
      const dz = Math.max(r.z0 - car.z, 0, car.z - r.z1);
      const d = Math.hypot(dx, dz) - 2.05;
      nearJunctionM = nearJunctionM === null ? d : Math.min(nearJunctionM, d);
    }
    const onDoubleWhite = (L.doubleWhite ?? []).some((r) => inRect(r, car.x, car.z));
    let kerbGap = 0;
    const lane = laneAt(L, car.x, car.z);
    if (lane) {
      const half = lane.axis === 'x' ? (lane.z1 - lane.z0) / 2 : (lane.x1 - lane.x0) / 2;
      const fx = Math.sin(car.heading);
      const fz = Math.cos(car.heading);
      const w = car.width / 2;
      if (lane.axis === 'x') kerbGap = fx > 0 ? car.z - w - (lane.centre - half) : lane.centre + half - (car.z + w);
      else kerbGap = fz > 0 ? lane.centre + half - (car.x + w) : car.x - w - (lane.centre - half);
    }
    const onZigzag = (L.crossings ?? []).some((c) => [c.area, ...c.zigzag].some((r) => car.corners().some(([px, pz]) => inRect(r, px, pz))));
    const inBusLane = (L.busLanes ?? []).some((b) => inRect(b, car.x, car.z));
    const onSchoolZigzag = (L.schoolZigzags ?? []).some((r) => car.corners().some(([px, pz]) => inRect(r, px, pz)));
    return { onYellow, nearJunctionM, onDoubleWhite, kerbGap, onZigzag, inBusLane, onSchoolZigzag };
  }
}

function nearestArm(rb: Roundabout, a: number) {
  let best = rb.arms[0];
  let bd = Infinity;
  for (const arm of rb.arms) {
    const d = Math.abs(angleDiff(a, arm.angle));
    if (d < bd) {
      bd = d;
      best = arm;
    }
  }
  return best;
}
