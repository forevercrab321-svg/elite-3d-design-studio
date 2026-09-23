# Progression & Balance

All numbers live in `game/src/config/` (`growth.ts`, `classes.ts`, `objects.ts`). This page explains them. Change the config, not this page, then re-run `npm run playtest` and update the tables.

## Growth model

- **Power** is the collector's diameter in metres. An object is absorbable when `power ≥ requiredPower`, which defaults to the class threshold.
- `diameter = 0.35 m × (mass / 5 kg)^(1/3)`: a cube-root, volume-honest law, so doubling in size costs 8× the mass.
- Rendered size eases toward the target (`visualGrowthRate` 6/s), so every pickup is a visible swell.
- Not linear in scale (§08):

| Stat | Formula | Effect |
| --- | --- | --- |
| Top speed | 3.4 m/s × (d/d₀)^0.45 | Faster in m/s, slower in body lengths per second |
| Acceleration time | 0.16 s × (1 + 0.35·ln(m/m₀)) | Heavier machines take longer to spin up |
| Turn rate | 11 rad/s ÷ (1 + 0.3·ln(m/m₀)) | Turning gets heavier; sharp turns slow the machine |
| Magnet reach | d/2 + 0.6·d + 0.3 m | Pull radius grows with size |
| Camera | distance 1.25 + 4.2·d, height 0.5 + 2.0·d, FOV 56° → 64° | Eased, never snapped |
| Push | Objects needing ≤ 1/0.72 of current power can be shoved | "Now I can move it" |

## Size classes and tiers

| Class | Label | Power (m) | Mass needed | Tier on unlock |
| --- | --- | --- | --- | --- |
| 0 | Dust & scrap | 0 | — | — |
| 1 | Cans & bricks | 0.30 | start | 1 Scrap Collector |
| 2 | Boxes & bags | 0.60 | 26 kg | **2 Intake Chassis** |
| 3 | Bins & street furniture | 0.90 | 85 kg | — |
| 4 | Dumpsters & machines | 1.50 | 394 kg | — |
| 5 | Vehicles | 3.0 | 3,149 kg | **3 Reinforced Hauler** |
| 6 | Trucks & containers | 5.0 | 14,578 kg | — |
| 7 | Walls & garages | 8.0 | 59,700 kg | **4 Industrial Recycler** |
| 8 | Buildings | 14 | ~320 t | — |
| 9 | Large buildings | 25 | ~1,820 t | **5 City Recycler** |
| 10 | City blocks | 50 | ~14,600 t | — |

## Reward table (kg)

scrap 0.14 · can 0.28 · bottle 0.36 · brick 0.48 · small box 0.65 · cardboard box 2.4 · trash bag 2.8 · cone 2.2 · chair 12.5 · café table 15 · trash can 19.5 · bicycle 21 · vending machine 110 · dumpster 140 · compact car 520 · delivery truck 1,800 · warehouse 40,000.

Rule of thumb: each absorbed object should add roughly 3–10% of the player's mass at the moment it becomes available. Tuning history is in `playtest-notes.md`.

## Pacing — measured (bot, 3 seeds) vs target

| Beat | Human target (§49) | Bot window (÷1.7, assumption) | Seed 7 | Seed 2026 | Seed 1337 |
| --- | --- | --- | --- | --- | --- |
| First collection | < 5 s | ≤ 2.9 s | 0.5 | 0.4 | 0.7 |
| First growth (tier 2) | 10–20 s | 5.9–11.8 s | 8.4 | 7.6 | 7.8 |
| Medium objects (class 3) | 30–60 s | 17.6–35.3 s | 19.4 | 20.4 | 18.2 |
| Clearly larger object (class 4 absorbed) | ≤ 75 s | ≤ 44.1 s | 34.6 | 35.3 | 29.8 |
| Vehicles | 1.5–3 min | — | not reachable in this build | | |

## Known gap (Phase 2 work)

After the class-4 milestone, reachable content runs out at about 1,300 kg by ~55 s, and cars need 3,149 kg. Phase 2 must add about 2,000 kg of class-4/5-transition material (motorcycles, utility boxes, shopping carts, barriers, kiosks) in the street and parking lot, so that vehicles unlock in the 1.5–3 min window.
