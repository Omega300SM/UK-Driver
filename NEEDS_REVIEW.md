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

## Game-design choices that are *not* Highway Code rules
- **Fault severities.** The game decides which mistakes are minor, serious or dangerous. These mirror the spirit of DVSA marking but are simplified. DVSA examiners judge each fault in context. An ADI should review the table in `src/rules/faults.ts`.
- **"Mirror check within 4 seconds before signalling/moving off."** The Highway Code says "in good time". 4 s is a game tuning value.
- **Signalling to move off in an empty car park.** Rule 159 says "signal if necessary". The game does not fault a missing signal when no one would benefit, but the guided drive teaches it as a habit. Check this framing.
- **Car park speed limit 10 mph.** Private car parks set their own limits; 10 mph is a typical posted limit, not law.
- **DSSSM cockpit drill (Doors, Seat, Steering, Seatbelt, Mirrors).** This is a widely taught instructor mnemonic, not Highway Code wording. Rule 97 covers the substance.
- **Pass mark 80% and star thresholds** are game rules.

## Still to verify (future days)
- Rule 124 speed table values for each vehicle type (Day 4) — fetched but not yet transcribed into content.
- Rule 126 two-second rule wording (Day 16) — fetched; doubled in wet, up to ten times on ice.
- Passing distances (1.5 m up to 30 mph for cyclists; 2 m for horse riders/pedestrians in the road) — Rule 163 / H-rules, to confirm before Week 2.
- Mock theory test format (50 questions, 57 minutes, 43 to pass) and hazard perception (14 clips, 44/75) — confirm on gov.uk before Day 27.
- New-driver rules (6 points within 2 years), ULEZ/CAZ details — confirm before Day 24.
- 20 mph defaults differ in Wales; English 20 mph zones are set by local councils — keep England-only wording.

## Tooling
- `npm audit` reports 4 moderate advisories in `glob`/`minimatch` used only at build time by Workbox. Not shipped to players. Revisit when Workbox updates.
