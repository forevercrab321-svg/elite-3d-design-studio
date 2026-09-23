# Design Decisions — Studio Memory

Single place for settled decisions (CLAUDE.md §19–20). Update on every approval or correction. Newest entry wins.

## Active project

**GROW EVERYTHING**: browser 3D growth/destruction game. Brief: `game/CLAUDE.md`. Status: Phase 1 greybox, 60-second prototype DONE (bot-verified), human playtest pending.

### Decisions (2026-09-23)

| Decision | Choice | Type | Reversible |
| --- | --- | --- | --- |
| Stack | Existing Vite + TS + three.js (no React/R3F) | INFERRED (§35 "use the existing stack") | Yes: systems are framework-agnostic |
| Physics | Custom circle-vs-box collision in Phase 1, Rapier from Phase 4 | INFERRED (§61 don't overbuild) | Yes |
| Power | Power = collector diameter (m); mass → diameter by a cube-root law | INFERRED | Tunable in `game/src/config` |
| Class thresholds | 0 / 0.3 / 0.6 / 0.9 / 1.5 / 3 / 5 / 8 / 14 / 25 / 50 m | INFERRED | Config |
| Tier unlocks | T2 at class 2, T3 at class 5 (vehicles), T4 at class 7, T5 at class 9 | INFERRED from §42 example | Config |
| Player identity | Grey metal plus safety-orange paint and amber intake glow | INFERRED (§27) | Phase 5 art pass |
| World orientation | Alley faces downtown (−Z); warehouse and crane in the spawn sight line | REQUIRED (§21–22 promises) | — |
| Art pass (2026-09-23) | "更加真实高端的3D": procedural PBR kit, authored props/architecture/player, sky env + GTAO + bloom; no external generation (no API keys) | REQUIRED (Creative Director) → INFERRED implementation | Yes: props/architecture are data-driven; GLB swap path documented |
| Quality tiers | high (GTAO+bloom), medium (bloom), low (none); touch devices default to medium | INFERRED | Yes |
| Sidewalk height | Raised 0.12 m visually, collision unchanged | INFERRED (realism) | Yes |
| Realism pass (2026-09-23) | "整体视觉更真实，不要像低端3D游戏": HDRI IBL + golden-hour sun, AgX + cinematic output, weathering, interior-mapped windows, trees/weeds/decals | REQUIRED (Creative Director) → INFERRED implementation | Yes: each layer is a separate module/flag (`?tonemap`, `?quality`) |

## Locked elements

| Element | Value | Approved on | Notes |
| --- | --- | --- | --- |
| — | — | — | — |

## Approved dimensions / proportions

| Element | Value | Source (REQUIRED / INFERRED) |
| --- | --- | --- |
| — | — | — |

## Approved materials

| Material | Parameters | Used on |
| --- | --- | --- |
| — | — | — |

## Camera settings

| Camera | Location | Rotation | Lens | Sensor | Aspect | Resolution | Locked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — | — | — |

## User corrections log

| Date | Feedback | Controlling parameter changed | Result |
| --- | --- | --- | --- |
| 2026-09-23 | 更加真实高端的3D | Procedural PBR kit, authored models | Phase 5 art pass |
| 2026-09-23 | 整体视觉像低端3D游戏 | Lighting (HDRI, sun 20°, AgX), post grade, surface shaders, dressing | Realism pass; budgets held |

## Pending issues

- Plaster facade still flat and yellow in direct sun.
- Skyline towers are simple boxes.
- VFX and HUD are below premium (Phase 6).
- Photoscanned textures would need a reachable asset host or user-supplied files.
