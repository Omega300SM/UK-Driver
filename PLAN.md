# Drive England: 30 Days to Expert — Plan

A mobile-first, installable PWA that takes a complete beginner to a confident driver on English roads over 30 daily lessons. It is taught by **Margaret "Maggie" Hale**: an unflappable ex-DVSA examiner from the Midlands with a cardigan, reading glasses and a flask of tea. She is warm, patient and drily funny, and never condescending.

> This is a learning aid. It does not replace lessons with a DVSA-approved driving instructor (ADI). You need a provisional licence to drive on public roads, and the Highway Code is the legal reference. Content is written for **England**.

---

## 1. Architecture

```
            ┌──────────── content/ (pure data: lessons, quizzes, rule refs, badges) ─────────────┐
            │                                                                                      │
 app/ (router + screens) ──► LessonRunner ──► engine/ (Three.js renderer, loop, cameras)            │
      │                          │                 ▲                                               │
      │                          ├──► sim/ (car model, input state) ──events──► rules/ (checks) ──► Faults
      │                          │                                               │                 │
      │                          └──► instructor/ (Maggie, dialogue, subtitles, speech)            │
      │                                                                          scoring/ (DVSA tally, %, stars, XP, unlock, streaks, badges)
      └──► platform/ (storage, audio, speech, motion, iOS shell) — every browser API sits behind these adapters (Capacitor-ready)
```

- **Vite + TypeScript (strict) + Three.js.** Vanilla DOM for UI (no framework), which keeps the bundle small and avoids layers between touch events and the game.
- **Data/engine separation.** Lessons are typed TS data files (`src/content/`). Guided drives are lists of `{ say, await }` steps, where `await` is a trigger ID that the runner resolves against the sim/rules state. Quizzes and rule references are data too.
- **Rules engine is event-driven and pure.** The sim emits `DriveEvent`s (`mirror`, `shoulder`, `signal`, `moveOff`, `stop`, `kerb`, `tick`, `handbrake`, …). Each check is a small object that receives events and may return `Fault`s. That makes every rule unit-testable with synthetic event streams. No Three.js imports in `rules/` or `scoring/`.
- **Scoring is DVSA-like.** Driving faults (minor), serious and dangerous. More than 15 driving faults or any serious/dangerous fault fails the test drive. A dangerous fault ends the drive immediately (kindly).
- **Platform adapters** (`src/platform/*`) wrap localStorage, Web Audio, speechSynthesis, DeviceMotion and iOS shell fixes. Capacitor can later swap these for native plugins.
- **PWA.** `vite-plugin-pwa` (Workbox) precaches the build for offline play. Relative `base` so it works from any path or a Capacitor `file://` shell.

## 2. Folder structure

```
src/
  main.ts              boot, router, first-gesture unlock of audio + speech
  app/                 router.ts, screens/*.ts (onboarding, home, briefing, drill, drive, quiz, debrief, settings, replay)
  platform/            storage, audio (synthesised sounds; no audio files), speech, motion, ios
  engine/              renderer (DPR ≤ 2, fog, 1 light, no shadow maps), loop
  world/               road + props builders (InstancedMesh), signs (procedural canvas), scenes/carPark.ts
  sim/                 car.ts (kinematic bicycle model, automatic), controls.ts (input state)
  rules/               types, RulesEngine, checks/*, recorder (ring buffer for replays)
  scoring/             dvsa.ts, lessonScore.ts, progress.ts (unlock, streaks, XP, badges)
  instructor/          maggie.ts (avatar SVG + moods), lines.ts (dialogue variety), bubble.ts (subtitles)
  ui/                  hud/* (wheel, pedals, stalk, mirrors, buttons), confetti, styles.css
  content/             schema.ts, curriculum.ts (all 30 days), lessons/day01.ts, ruleRefs.ts, badges.ts
tests/unit             Vitest: rules, scoring, progress, storage
tests/e2e              Playwright (iPhone 13 portrait + landscape): launch, lesson loop, unlock, save/load
```

## 3. Lesson loop

1. **Briefing** — 60–90 s, 3–5 slides with inline SVG diagrams, Maggie narrates.
2. **Guided drive** — step-by-step prompts; each waits for a trigger. Wrong order gets a gentle nudge, never a penalty.
3. **Free drive** — practice with a Hint button; rules are evaluated but only *coached*, not scored.
4. **Test drive** — scored like the DVSA practical test.
5. **Quiz** — 3–5 Highway Code questions with explanations and rule numbers.
6. **Debrief** — stars, XP, faults list with rule numbers, "here's what happened" replay per fault, retry instantly.

### Scoring (tunable in `src/scoring/lessonScore.ts`)
- Test component % = 100 − 4 × minors − 30 × serious; any dangerous → 0. Clamped 0–100.
- Lesson % = 60% test + 25% quiz + 15% guided completion.
- **Pass = lesson ≥ 80% AND test passed (≤ 15 minors, no serious/dangerous).**
- Stars: 1 = pass; 2 = pass, ≤ 3 minors, quiz ≥ 75%; 3 = pass, 0 minors, quiz 100%.
- XP = 100 base + 50 per star + 25 first-time bonus.

### Unlocks, streaks
- Day *n+1* unlocks once Day *n* is passed **and** either Sprint mode is on, or the local calendar date is later than the date Day *n* was first passed (one new lesson per day).
- Streak counts consecutive local calendar days on which any lesson stage was completed.

## 4. Milestones

| # | Milestone | Contents |
|---|-----------|----------|
| M0 | Shell | Vite/TS/PWA, iOS shell fixes, storage, router, styles, onboarding + disclaimers |
| M1 | Driving core | Renderer, car park scene, car model, touch controls, cameras |
| M2 | Rules + scoring | Event bus, checks, fault model, recorder, DVSA tally, lesson %, unlocks |
| M3 | Instructor | Maggie avatar, subtitles, en-GB speech, dialogue variety |
| M4 | **Day 1 vertical slice** | Briefing → drill → guided → free → test → quiz → debrief + replay |
| M5 | Tests + docs | Vitest + Playwright, README, Vercel guide → **pause for iPhone review** |
| M6 | Week 1 | Days 2–7: town roads, junctions, signs/markings, speed limits, BOSS: Market Town |
| M7 | Week 2 | Roundabouts (incl. bonus "magic"), crossings, lights, parking, vulnerable road users, AI traffic/peds/cyclists, BOSS: Rush Hour |
| M8 | Week 3 | Country lanes, weather + stopping distances, dual carriageways, motorways + smart motorways, night, BOSS: Coast run |
| M9 | Week 4 | Hazard perception clips, special situations, law, eco/EV/warning lights, sat nav + show me/tell me, mock theory + practical, Grand Tour, graduation certificate (shareable PNG) |
| M10 | Stretch | Manual gearbox + clutch, badges polish, map of England art, Capacitor wrapper notes |

## 5. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| iPhone thermal throttling / frame drops | DPR cap 2 (setting for 1.5), no shadow maps, InstancedMesh, merged static geometry, fog to cull distance, `?debug` FPS meter |
| speechSynthesis voice varies or is missing | Subtitles always on; speech is best-effort, en-GB voice picked if present; started only after a tap |
| DeviceMotion permission UX | Requested only from an explicit tap; tilt is optional; wheel always works |
| Thumb ergonomics in landscape | Large hit areas, safe-area padding, multi-touch pointer events, controls layout tested on iPhone 13 mini–Pro Max sizes |
| Highway Code accuracy | Rule text verified from gov.uk while building; uncertain items go in `NEEDS_REVIEW.md` |
| 30 lessons is large | Data-driven lessons + reusable checks/scenes; ship by week |
| Emulation ≠ real device | Playwright emulation for flows; your iPhone review is the real gate after M5 |
| PWA cache staleness | `autoUpdate` service worker; `sw.js` served no-cache on Vercel |
