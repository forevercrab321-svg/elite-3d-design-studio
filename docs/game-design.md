# GROW EVERYTHING — Game Design

Brief: [`game/CLAUDE.md`](../game/CLAUDE.md). Balance: [`progression.md`](progression.md). Status: **Phase 1 (greybox), 60-second prototype.**

## Design brief

| | |
| --- | --- |
| Player promise | Something that looked enormous at the start ends up looking tiny. |
| Target feeling | Scale transformation: "wait, I got bigger" → "now I can collect THAT". |
| Primary verb | Roll into things to absorb them (magnetic intake). |
| Secondary verbs | Dash (Space); shove objects that are almost absorbable; bump into objects that are too big (they teach the next goal). |
| Repeats every 5–30 s | Sweep a cluster, gain mass, see the collector swell, see the next class light up. |
| Changes over 1–5 min | Size class: alley debris → street furniture → dumpsters → (Phase 2+) vehicles, structures, warehouse. |
| Lose / learn / restart | No fail state in the MVP. The pressure is the pacing: the locked class you keep bumping into. R restarts instantly. |
| Rewarded | Efficient routes through dense clusters; going for the newly unlocked class. |
| Better players | Chain clusters without stopping, use dash between clusters, read locked colours to plan the route. |
| Next decision communicated by | Locked objects are desaturated; the HUD shows `NEXT: <class> · <kg>`; a bump shows `TOO BIG · GROW TO X KG`. |
| Non-goals (this slice) | Destruction physics, audio, production art, mobile, zones C–G gameplay. |

## Core loop contract

The player **rolls into objects** to **absorb them and grow** while **locked, oversized objects block the way** and create the desire to grow. Success gives **mass, visible size, and new object classes**. The "failure" state is being too small, which costs **a detour and shows exactly how much mass is needed**.

| Clause | Implemented as |
| --- | --- |
| Verb mapped to real input | WASD/arrows camera-relative, Space dash, mouse-drag orbit, R restart (`core/Input.ts`). Verified by the keyboard smoke test. |
| Objective visible | HUD mass, growth bar, `NEXT:` class; locked objects desaturated; onboarding beacon on the first collectible. |
| Pressure in the first minute | The dumpster (class 4) blocks half the alley and every car is locked; bumping shows the mass required. |
| Reward changes state | Mass → diameter (cube-root law) → power → new classes, speed and camera. |
| Failure teaches | Bump toast names the object and the kg needed. |
| Fast restart | R resets the seeded world in one frame. |

## Level plan — Scrap City (current build)

The layout data lives in `game/src/world/scrapCity.ts`. −Z points downtown.

| Zone | Status | Content | Role |
| --- | --- | --- | --- |
| A Alley (x ±3.5, z 0–36) | playable | scrap, cans, bottles, bricks, small boxes → boxes, bags, cones → a first dumpster | Start, first growth, first "impossible" object |
| Alley mouth / B street | playable | café tables and chairs, bins, bikes, a vending machine, a second dumpster, cones, bags | Class 3–4 payoff, milestone |
| B street / C parking lot | visible, locked | 3 street cars, 8 lot cars, a delivery truck | Promises: "cars feel impossible" |
| Construction (crane) | visible landmark | a 38 m tower crane in the alley's sight line | Promise |
| Warehouse (z −67…−97) | visible, locked (class 8) | 48 × 30 × 16 m | The MVP climax, visible from the first frame |

- **Start:** the player spawns at z 32 facing downtown. The alley frames the street cars, the crane and the warehouse.
- **First decision:** within one body length.
- **First reward:** the beacon-marked can cluster.
- **Landmarks:** crane, warehouse, dumpster.

## Current verdict (60-second milestone)

| Requirement (§62) | Status | Evidence |
| --- | --- | --- |
| Spawn | DONE | `00-spawn.png` |
| Move | DONE | Keyboard smoke test: W moved the player 2.2 m in 40 frames |
| Collect tiny objects | DONE | First collection at 0.4–0.7 s (bot) |
| Gain mass | DONE | 5 → ~1,300 kg over 90 s |
| Visibly grow | DONE | 0.35 → 2.2 m diameter (6.4×), plus tier-2 parts unfold |
| Unlock larger objects | DONE | Classes 2, 3 and 4 unlock with banners |
| Collect one clearly larger object | DONE | Dumpster / vending machine at 29.8–35.3 s (bot), ≈50–60 s estimated for a human |
| "Wait, I got bigger" for a new player | NEEDS REVIEW | Requires a human playtest (see `playtest-notes.md`) |
