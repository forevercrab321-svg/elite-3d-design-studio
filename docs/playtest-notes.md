# Playtest Notes

Harness: `npm run playtest [-- --seed N]`, output in `renders/review/game/`.

## Method

- **Bot run.** A deterministic, game-time bot with local obstacle avoidance. It targets the nearest absorbable object and favours bigger rewards and the newest unlocked class, the way a player reacts to the unlock banner.
- **Smoke test.** Real keyboard input on the live loop: W, then Space, then R.
- **Screenshots.** Captured at: spawn, first collection, tier 2, class 3, class 4, first large object, 60 s, and live input.

**Assumption (unvalidated):** the bot plays about 1.7× faster than a first-time human, so bot pass windows are the §49 human targets ÷ 1.7. **This must be checked with a real player** by timing the first growth and the dumpster moment, then correcting `BOT_SPEEDUP` in `tools/playtest.mjs`.

## 2026-09-23 — Phase 1 greybox

### Tuning history

| Pass | Tier 2 | Class 3 | Class 4 absorbed | Finding → fix |
| --- | --- | --- | --- | --- |
| 1 | 3.9 s | 9.5 s | 26.7 s | Far too fast, and content ran out by 40 s → halved rewards for classes 0–3, added street content |
| 2 | 5.0 s | 16.9 s | 36.1 s | Early game still fast → class 0/1 rewards ×0.8, class-2 threshold 0.55 → 0.6 m |
| 3 (3 seeds) | 7.6–8.4 s | 17.9–19.5 s | 39–46 s | Dumpster late on 2 seeds. The trace showed the bot unlocking class 4 and still grazing class 3 → the bot now favours the newest class (human-like) |
| 4 | — | — | 45.9 s (seed 7) | The trace found **dead zones**: mass flat for 5–7 s after class 3/4 unlocks because class-3 content sat at the street ends, and the bot shoved the vending machine along the sidewalk → added a class-3 spill at the alley mouth plus local avoidance in the bot |
| 5 (final, 3 seeds) | 7.6–8.4 s | 18.2–20.4 s | 29.8–35.3 s | All gates pass, 0 stuck events |

### Final result (seeds 7, 2026, 1337)

All 16 assertions pass on each seed: spawn, move, collect, mass, ≥3× growth, class unlocks, class-4 absorb, four pacing gates, stuck ≤ 3, keyboard W moves, R restarts, draw calls ≤ 80, no page/console errors.

### Visual review findings (fixed)

- The spawn frame showed no player: the model was not placed until the first step.
- The player read as a black blob on asphalt: added orange paint panels.
- Over-darkened locked objects made cars read black.
- Windows looked like holes; the pulse ring was an opaque disc.
- A brick pile sat between the camera and the player at spawn.
- The crane landmark was hidden behind the alley walls.

### Open issues

| Issue | Severity | Plan |
| --- | --- | --- |
| Content runs out at about 1,300 kg by ~55 s; cars need 3,149 kg | High for the vertical slice, out of scope for the 60 s prototype | Phase 2: class-4/5 transition content |
| No human playtest yet; the 1.7× bot factor is an assumption | High | Creative Director or a first-time player plays `npm run game` and times the two moments |
| No audio (§45–46) | Medium | Phase 6. Gameplay already has the event points (absorb, class unlock, tier up, bump, dash) |
| Toast and banner screenshots in the test harness can show stale or half-faded text, because DOM animations run on wall-clock time while the harness compresses game time | Low (harness artifact, not a game bug) | Accept, or drive HUD animations from game time |
| No FPS evidence (software renderer in the cloud) | Medium | Measure on a real GPU |
