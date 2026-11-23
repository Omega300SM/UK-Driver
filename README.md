# Drive England: 30 Days to Expert

A mobile-first driving game that takes a complete beginner to a confident driver on English roads over 30 daily lessons. It's taught by **Maggie Hale**, a patient, drily funny ex-DVSA examiner.

It's an installable PWA (Vite + TypeScript + Three.js). It plays offline once loaded, runs at 60 fps on an iPhone 12 or newer, and saves everything on the device. There's no backend, no accounts and no ads.

> **Important.** This is a learning aid. It does not replace lessons with a DVSA-approved driving instructor. You need a provisional licence to drive on public roads, and the [Highway Code](https://www.gov.uk/guidance/the-highway-code) is the legal reference. Never play while driving. Content is written for England.

**Status:** Day 1 (cockpit drill and controls) is complete end to end, as a vertical slice for review. Days 2–30 are listed in the map and marked "Coming soon". See [PLAN.md](PLAN.md) for the roadmap and [NEEDS_REVIEW.md](NEEDS_REVIEW.md) for accuracy notes.

---

## Quick start

```bash
npm install          # Node 20+; .npmrc sets legacy-peer-deps
npm run dev          # http://localhost:5173 (also on your LAN, for a phone on the same Wi-Fi)
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload, exposed on your network |
| `npm run build` | Type-check and build to `dist/` (with service worker) |
| `npm run preview` | Serve the production build on port 4173 |
| `npm test` | Unit tests (Vitest): rules engine, scoring, unlocks, save/load, car model, content checks |
| `npm run e2e` | Playwright on iPhone 13 emulation, portrait and landscape (builds first). Add `-- --trace off` to skip tracing |
| `node scripts/make-icons.mjs` | Re-render the PNG app icons from `public/icons/icon.svg` |

Add `?debug` to the URL for an FPS counter. `?e2e` exposes test hooks (`window.__DE`, `window.__drive`).

### Desktop keyboard controls (for development)
Arrow keys or W/S steer and drive (Space brakes). **M** interior mirror, **,** and **.** for the left and right door mirrors, **Z**/**X** shoulder checks, **Q**/**E** indicators, **H** handbrake, **B** seat belt, **P**/**R**/**D** gears, **C** camera.

---

## Test it on your iPhone (Vercel preview)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** the repository.
3. Vercel detects Vite. `vercel.json` already sets the build command (`npm run build`) and output directory (`dist`), so just press **Deploy**.
4. Every push to a branch gets its own preview URL. Open it in **Safari** on your iPhone.
5. Tap **Share → Add to Home Screen** to install it as an app. Launched from the home screen, it runs full screen and works offline.
6. Turn the phone sideways for driving. Menus and quizzes also work in portrait.

Tips:
- Sound and Maggie's voice start after your first tap (an iOS rule). If you can't hear her, check the ring/silent switch. Subtitles are always on.
- Tilt steering asks for motion permission when you tap "Try tilt steering". If you said no, re-enable it in iOS Settings → Safari → Motion & Orientation Access.
- After a new deploy, close and reopen the home-screen app once so the service worker picks up the update.

---

## How it's built

```
src/
  content/      ← all lesson text, quizzes, Highway Code refs, badges (pure data)
  rules/        ← event-driven rules engine, fault catalogue, replay recorder (no Three.js)
  scoring/      ← DVSA-style tally, lesson %, stars, XP, unlocks, streaks, badges (no Three.js)
  sim/          ← arcade car model (kinematic bicycle, automatic gearbox), autopilot for tests
  world/        ← Three.js scene builders (InstancedMesh props, procedural signs), pure layout data
  engine/       ← renderer (DPR ≤ 2, fog, no shadow maps, mirror inset via scissor)
  instructor/   ← Maggie's avatar, speech bubble/subtitles, debrief wording
  platform/     ← storage, Web Audio synth, speechSynthesis, DeviceMotion, iOS shell fixes
  app/          ← router, lesson session, screens (onboarding, map, briefing, drill, drive, quiz, debrief, replay, settings)
  ui/           ← styles, steering wheel and pedals, diagrams, confetti
```

- **Rules engine.** The sim and HUD emit events (`mirror`, `shoulder`, `signal`, `moveOff`, `stop`, `kerb`, `collision`, `tick`, …). Each check in `src/rules/checks/` is a small object that turns events into faults. In guided and free drives the engine runs in *coach* mode: Maggie comments, but nothing is scored.
- **Scoring.** More than 15 driving faults, or any serious or dangerous fault, fails the test drive. A dangerous fault stops the drive. Lesson % = 60% test + 25% quiz + 15% guided drive. You need **80% and a passed test** to unlock the next day. All weights live in `src/scoring/lessonScore.ts`.
- **Daily gate.** Day *n* opens the calendar day after Day *n−1* is first passed, unless **Sprint mode** is on in Settings.
- **Replays.** A 10 Hz ring buffer records the car. Each test fault keeps the 8 seconds around it, drawn as a top-down replay with the Highway Code rule.
- **Capacitor-ready.** Relative asset paths, no server, and every browser API sits behind `src/platform/*`, so native plugins can replace them later.

---

## Adding a new lesson

1. **Check the rules first.** Read the relevant [gov.uk Highway Code](https://www.gov.uk/guidance/the-highway-code) pages. Add any new rule to `src/content/ruleRefs.ts` with a faithful one-line summary and its URL. If you're unsure of anything, write it in `NEEDS_REVIEW.md` rather than guessing.
2. **Write the content** in `src/content/lessons/dayNN.ts`, typed as `LessonContent` (see `src/content/schema.ts`). Copy `day01.ts` as a template:
   - `briefing`: 3–5 slides, 60–90 seconds of narration in total (a unit test checks the length), each with a diagram id.
   - `guided.steps`: `{ say, await, highlight?, nudge? }`. `await` is a trigger such as `mirror.interior`, `signal.left`, `moving`, `marker.A` or `stoppedAt.B`. Add new trigger kinds in `triggerMet()` in `src/app/screens/drive.ts`.
   - `free.hints`, `test.directions` (spoken when the car passes an x position), `test.finishMarker`.
   - `quiz`: 3–5 questions, each with `explain` and `rules`.
   - `rules`: the rule numbers the lesson cites.
3. **Register it** in `LESSONS` in `src/content/curriculum.ts`. The day then shows as available on the map.
4. **Scene.** Reuse `carPark`, or add a layout in `src/world/scenes/<name>Layout.ts` (pure data: drivable rects, kerbs, obstacles, markers, speed zones, lanes) plus a Three.js builder beside it.
5. **New rules checks.** Add a check to `src/rules/checks/`, its fault text and severity to `src/rules/faults.ts` (citing rule numbers), and unit tests in `tests/unit/rules.test.ts`.
6. Run `npm test` and `npm run e2e`.

### Writing in Maggie's voice
British English and UK terms (bonnet, boot, kerb, give way, dual carriageway). She's warm, specific and drily funny, and never condescending. Praise briefly ("Lovely."), explain mistakes kindly with the rule number, and always offer another go. Every spoken line is also shown as a subtitle, so keep lines short enough to read in a few seconds.

---

## Accuracy

Rules cited in Day 1 were checked against gov.uk on 23 November 2026: rules 97, 99, 103, 112, 123, 126, 159, 160, 161 and 239. Fault severities, timing windows and pass marks are game-design choices modelled on DVSA marking, and are listed for review in `NEEDS_REVIEW.md`. Road signs are original procedural drawings that follow UK shapes and colours. Cars are generic, with no real brands.
