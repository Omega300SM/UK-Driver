# Needs Review

Items to check with a human (ideally an ADI) before release. Rule text was checked against the gov.uk Highway Code on **23 November 2026**.

## Verified against gov.uk (Day 1)
| Rule | Topic | Used for |
|------|-------|----------|
| 97 | Before setting off: know the controls; mirrors and seat adjusted; head restraints | Cockpit drill, quiz |
| 99 | You MUST wear a seat belt if fitted | Seat belt check (serious fault), quiz |
| 103 | Signals: clear, in plenty of time, before moving off/stopping; cancel after use | Signal checks |
| 112 | Horn: MUST NOT use while stationary, or in a built-up area 11.30pm–7am, except when another road user poses a danger | Horn coaching |
| 123 | Apply the parking brake and switch off when stationary for more than a couple of minutes | Debrief tip |
| 159 | Before moving off: mirrors, look round for blind spots, signal if necessary, final look round | Move-off checks |
| 160 | Once moving: keep to the left; both hands on the wheel where possible | Lane position |
| 161 | Use mirrors in good time before signalling or changing speed/direction; blind spots; "Mirrors – Signal – Manoeuvre" | Mirror checks |
| 239 | You MUST apply the handbrake before leaving the vehicle | Securing the car at the end |

## Verified against gov.uk (Week 1, Days 2–7)
| Rule | Topic | Used for |
|------|-------|----------|
| 109 | MUST obey signs giving orders; know and act on other signs and markings | No Entry fault, Day 5 |
| 124 | Speed limits; 30 mph generally applies where there are street lights (England); 60 mph for cars on single carriageways | Day 4 |
| 125 | The limit is a maximum, not a target | Day 4 |
| 127 | Broken centre line; longer lines/shorter gaps = hazard warning | Day 5 |
| 129 | Double white lines, solid nearest you: MUST NOT cross or straddle (with listed exceptions) | Double-white fault |
| 146 | Adapt your driving; don’t treat limits as a target | Day 4 |
| 152 | Residential streets: car doors opening, children between parked cars | Clearance fault |
| 163 | Give way to oncoming vehicles before passing obstructions on your side | Meeting faults, Days 3 and 7 |
| 170 | Take extra care at junctions; look all around; wait for a safe gap | Junction observation / pulling out |
| 171 | MUST stop behind the line at a Stop sign | Stop-sign fault |
| 172 | MUST give way to main-road traffic at broken white lines | Give way junctions |
| 179–180 | Turning right: mirrors, signal, just left of centre, wait for a safe gap, don’t cut the corner | Day 6 |
| 182–183 | Turning left: mirrors and signal well before; keep to the left | Day 6, turn checks |
| 238 | Yellow lines: MUST NOT wait during times shown; double yellow = no waiting at any time | Pull-up faults |
| 240 | MUST NOT stop or park on a road marked with double white lines (passenger/loading exceptions) | Pull-up fault, Day 5 |
| 243 | Do not stop or park opposite or within 10 m of a junction | Pull-up fault |
| Traffic signs section | Red circles mostly prohibit; blue circles mostly give positive instruction; triangles mostly warn; direction/information signs mostly rectangular | Day 5 |

## Game-design choices that are *not* Highway Code rules
- **Fault severities.** The game decides which mistakes are minor, serious or dangerous. These mirror the spirit of DVSA marking but are simplified. DVSA examiners judge each fault in context. An ADI should review the table in `src/rules/faults.ts`.
- **"Mirror check within 4 seconds before signalling/moving off."** The Highway Code says "in good time". 4 s is a game tuning value.
- **Signalling to move off in an empty car park.** Rule 159 says "signal if necessary". The game does not fault a missing signal when no one would benefit, but the guided drive teaches it as a habit. Check this framing.
- **Car park speed limit 10 mph.** Private car parks set their own limits; 10 mph is a typical posted limit, not law.
- **DSSSM cockpit drill (Doors, Seat, Steering, Seatbelt, Mirrors).** This is a widely taught instructor mnemonic, not Highway Code wording. Rule 97 covers the substance.
- **Pass mark 80% and star thresholds** are game rules.
- **Week 1 fault severities.** Rolling over a STOP line = serious. Pulling out with another car under ~2.2 s away = serious, under 1 s = dangerous. Passing parked cars on your side with oncoming traffic under 35 m = minor, under 15 m = serious. Passing a parked car with under 0.7 m gap = minor. Crossing a solid double white line = serious. Entering a No Entry road = serious. Pulling up on double yellows, within 10 m of a junction or on double whites = serious; single yellow = minor (we assume the restriction is in force); more than 1.2 m from the kerb = minor. An ADI should sanity-check these against DVSA marking guidance.
- **Turn checks.** A turn is a heading change of more than ~70°. The signal must be on when the turn starts; a mirror check must be within 8 s of the turn, or within 8 s before the signal went on (MSM on the approach). Road bends (Tannery Road/Back Lane) are exempt.
- **Junction look-check.** "Look right and left" means using both shoulder-look controls within 8 s before crossing the give way/stop line.
- **Progress fault.** Below 40% of the limit for 10 s on a clear road (not near junctions, parked cars or a requested stop). DVSA marks undue hesitation and progress, but there is no single Highway Code rule for it, so the fault cites none.
- **Moving-off blind spot.** Required when moving off from a parked position (kerb or handbrake), not when pulling away in a traffic queue.
- **Sign artwork.** Our signs are original drawings following the shapes and colours described in the Highway Code. Please check visually: the national speed limit sign (diagonal from top right to bottom left), the 20 zone entry and end signs, the "50 yds" distance plate under the give way warning, and the No Waiting disc.
- **Town geometry.** Lanes are 3.8 m wide with 5 m kerb radii at junctions. Real roads vary.
- **AI traffic.** AI cars give way to oncoming traffic before passing parked cars on their side and queue behind stopped vehicles. They never run red lights or behave badly, which real traffic sometimes does.

## Still to verify (future days)
- Rule 126 two-second rule wording (Day 16) — fetched; doubled in wet, up to ten times on ice.
- Passing distances (1.5 m up to 30 mph for cyclists; 2 m for horse riders/pedestrians in the road) — Rule 163 / H-rules, to confirm before Week 2.
- Mock theory test format (50 questions, 57 minutes, 43 to pass) and hazard perception (14 clips, 44/75) — confirm on gov.uk before Day 27.
- New-driver rules (6 points within 2 years), ULEZ/CAZ details — confirm before Day 24.
- 20 mph defaults differ in Wales; English 20 mph zones are set by local councils — keep England-only wording.

## Tooling
- `npm audit` reports 4 moderate advisories in `glob`/`minimatch` used only at build time by Workbox. Not shipped to players. Revisit when Workbox updates.
