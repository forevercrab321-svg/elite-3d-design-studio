# Progression & Balance

All numbers live in `game/src/config/` (`growth.ts`, `classes.ts`, `objects.ts`). This page explains them. Change the config, not this page, then re-run `npm run playtest` and update the tables.

## Growth model

- **Power** is the collector's diameter in metres. An object is absorbable when `power ≥ requiredPower`, which defaults to the class threshold.
- `diameter = 0.35 m × (mass / 5 kg)^(1/3)`: a cube-root, volume-honest law, so doubling in size costs 8× the mass.
- Rendered size eases toward the target (`visualGrowthRate` 6/s), so every pickup is a visible swell.
- Not linear in scale (§08):

| Stat | Formula | Effect |
| --- | --- | --- |
| Top speed | 3.4 m/s × (d/d₀)^0.36 | Faster in m/s, much slower in body lengths per second (heavy) |
| Acceleration time | 0.16 s × (1 + 0.35·ln(m/m₀)) | Heavier machines take longer to spin up |
| Turn rate | 11 rad/s ÷ (1 + 0.3·ln(m/m₀)) | Turning gets heavier; sharp turns slow the machine |
| Magnet reach | d/2 + 0.6·d + 0.3 m (× 2.6 for debris < 8 % of d) | Pull radius grows with size; far vacuum for tiny debris |
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

- **Classes 0–4:** scrap 0.14, can 0.28, bottle 0.36, brick 0.48, small box 0.65, pallet 14, cardboard box 2.4, trash bag 2.8, cone 2.2, chair 12.5, café table 15, shopping cart 16, trash can 19.5, bicycle 21, hoarding panel 35, utility cabinet 60, pallet stack 70, motorcycle 75, jersey barrier 85, vending machine 110, dumpster 140.
- **Class 5:** pipe stack 270, generator 300, scaffold 320, car 380, van 480.
- **Class 6:** sign 900, container 1,100, site cabin 1,100, pallet rack 1,100, delivery truck 1,200, tipper 1,700, excavator 2,400.
- **Class 7:** gable panel 3,000, wall panel 3,600, garage row 4,500, storage tank 5,000, roof bay 6,000 (end bays 6,500).
- The warehouse back wall, gables and roof require 9.6 m of power (≈103 t). All content below that power totals 125 t.

Rule of thumb: each absorbed object should add roughly 3–10% of the player's mass at the moment it becomes available. Tuning history is in `playtest-notes.md`.

## Pacing — measured (bot, 3 seeds) vs target

| Beat | Human target (§49) | Bot window (÷1.7, assumption) | Seed 7 | Seed 2026 | Seed 1337 |
| --- | --- | --- | --- | --- | --- |
| First collection | < 5 s | ≤ 2.9 s | 0.5 | 0.4 | 0.7 |
| First growth (tier 2) | 10–20 s | 5.9–11.8 s | 8.7 | 7.7 | 8.1 |
| Medium objects (class 3) | 30–60 s | 17.6–35.3 s | 22.7 | 21.3 | 20.1 |
| Clearly larger object (class 4 absorbed) | ≤ 75 s | ≤ 44.1 s | ~30 | ~28 | ~27 |
| Vehicles (class 5 absorbed) | 1.5–3 min | 52.9–105.9 s | 67.7 | 66.9 | 67.9 |
| Structures (class 7 absorbed) | 3–6 min | 105.9–211.8 s | 158.2 | 168.3 | 164.0 |
| Warehouse destroyed | 5–8 min | 176.5–282.4 s | 195.2 | 205.3 | 201.0 |
