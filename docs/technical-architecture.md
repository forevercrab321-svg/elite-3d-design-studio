# Technical Architecture

## Stack decision

The brief prefers React + R3F + Rapier and also says to *use the existing repository stack if an equivalent professional setup exists*. This repo already runs **Vite + TypeScript + three.js r184** (the studio pipeline and the installed `threejs-*` skills use the same stack), so the game uses plain three.js modules without React:
- The frame loop and fixed timestep are explicit and deterministic (required for the playtest bot).
- There is no reconciler overhead for hundreds of instanced objects.
- It matches the skill scaffold and QA tooling.

This is reversible: systems are framework-agnostic classes. If the Creative Director wants R3F, the `Game` class can be mounted inside a `<Canvas>`.

**Physics:** Phase 1 uses custom collision (player circle vs oriented boxes, in `core/collision.ts`). This is level 1 of the skill's physics ladder: authored feel, deterministic, cheap. **Rapier** (`@dimforge/rapier3d-compat`) comes in Phase 4, when destruction needs rigid bodies, sleeping and debris.

## Layout

```text
game/
  index.html                  entry (/game/)
  CLAUDE.md                   the game brief
  src/
    main.ts                   renderer, RAF loop (fixed 60 Hz, clamped accumulator), test hooks
    config/                   ALL balance: growth.ts, classes.ts, objects.ts
    core/                     Input (keyboard/mouse → intents), collision, seeded RNG
    game/Game.ts              simulation step: move → collide → collect → grow → FX/camera/HUD
    systems/                  growth maths, CameraRig, Effects (pooled particles, rings, shake)
    entities/PlayerModel.ts   tiered collector model (parts unfold per tier)
    world/                    scrapCity.ts (layout data), World.ts (instancing, colliders), shapes.ts
    ui/Hud.ts                 DOM HUD
    debug/bot.ts              playtest agent
    art/                      textures.ts (procedural PBR kit), materials.ts (roles), uv.ts, environment.ts (sky + env map), postfx.ts (render tiers)
    world/props.ts            production prop models by material role
    world/architecture.ts     static city: facades, ground, furniture, crane, skyline
tools/playtest.mjs            headless bot run + real keyboard smoke test + screenshots
tools/art-review.mjs          fixed-camera art review shots → renders/review/game/art/
tools/inspect-game.mjs        threejs-qa-release canvas inspector (pixel metrics + render budget) on the game
```

## Key rules

- **Deterministic.** All randomness goes through `createSeededRandom`; the simulation advances only in `FIXED_DT` steps. The same seed gives the same run.
- **Data-driven.** Gameplay reads `OBJECT_TYPES` and `SIZE_CLASSES`; there is no per-object code.
- **Instancing.** One `InstancedMesh` per object type (17 types → 17 draw calls). Absorbed objects scale to 0.
- **Pooling.** 160 debris particles and 4 pulse rings, allocated once.
- **Test hooks.** `window.__GROW__` (`state`, `step`, `runBot`, `reset`, `render`, `perf`) and `window.__THREE_GAME_DIAGNOSTICS__` (live snapshot every frame). `?test=1` disables the RAF loop so the harness controls time; `?seed=N` selects the layout.

## Commands

| | |
| --- | --- |
| `npm run game` | Play it: http://127.0.0.1:5190/game/ |
| `npm run playtest` | Bot run + keyboard smoke test + milestone screenshots → `renders/review/game/`; exits non-zero on failure |
| `npm run art:review` | Nine fixed review cameras → `renders/review/game/art/*.png` + per-view renderer counts |
| `npm run inspect:game` | Canvas inspector: colour entropy, edge density, contrast, render-budget rows |
| `npm run typecheck` / `npm run build` | TS check / production build (studio + game) |

## Render pipeline

`?quality=high|medium|low` (default: high on desktop, medium on touch):

| Tier | Pipeline | Textures |
| --- | --- | --- |
| high | MSAA 4× HalfFloat target → GTAO (radius follows player size) → bloom (0.14 / 0.35 / 1.25, authored emissives only) → CinematicOutputPass | 512² |
| medium | MSAA 4× → bloom → CinematicOutputPass | 512² |
| low | Direct render, native antialias | 256² |

- Shadows: one PCF directional shadow map (4096²) focused ahead of the camera, texel-snapped to avoid shimmer; the extent grows with size.
- `renderer.info.autoReset = false`, so counts include every pass of a frame.
- IBL: `public/hdri/pedestrian_overpass_1k.hdr` (CC0) → PMREM, `scene.environmentRotation` aligns its sun with `SUN_DIRECTION`. If it fails to load, the environment is baked from the procedural sky dome.
- Tone mapping: AgX by default (`?tonemap=agx|aces|neutral`, `?exposure=`). Grade, vignette, grain and chromatic aberration run inside the output pass (`CinematicOutputPass`).
- Surface shaders are injected with `onBeforeCompile` plus `customProgramCacheKey`: `weathering()` (wall/ground/prop) and `interiorMapping()` (window and shop glass, per-window `roomCenter` attribute).
- Set dressing (`world/dressing.ts`) is 3 merged meshes: trunks+pits+sign pole (vertex colour), leaf canopies (alpha-tested, wind sway, custom depth material for shadows), and weeds+decals sharing one atlas texture.
- `__GROW__.meshStats()` returns a per-mesh triangle/instance/shadow table for budget work.

### Measured (2026-09-23, high tier, 1600×900)

| View | Draw calls | Triangles | Geometries | Textures |
| --- | --- | --- | --- | --- |
| Spawn (gameplay camera), realism pass | 290 | 686k | 94 | 60 |
| Worst review view (cafe street / chase cam) | 290 | 686k | 94 | 60 |
| Bot run end state (all 3 seeds) | 284 | 659k | — | — |
| Desktop budget | ≤ 300 | ≤ 750k | ≤ 300 | ≤ 60 |
| Mobile (medium tier, iPhone 13 viewport) | 136 / ≤ 150 ✔ | 316k / ≤ 300k ✘ | 92 ✔ | 54 / ≤ 40 ✘ |

Realism-pass trims to stay inside the budget: bicycle wheels (fewer torus segments and spokes), bin lathes (28 → 22), no shadow casting for tyre/trim roles below class 5, the dark brick reusing the red brick's normal/roughness maps, and weeds living in the decal atlas. Draw calls were cut earlier from ~400 to under 300 by merging player parts per material, per-axle wheel groups, folding trim/lamp/chrome roles and merging untextured arch metals. Startup in the cloud CPU renderer is ~13 s, dominated by first-frame shader compilation (31 programs); on a real GPU this should be ~1 s, which is **not yet measured**.

## Performance (earlier notes)

58 draw calls and about 28k triangles in the start area (shadow pass included). In the cloud session, measured FPS comes from SwiftShader (a CPU renderer), so it **is not performance evidence**; FPS must be measured on real hardware. Phase 7 items:
- Per-instance frustum culling (instanced meshes currently span the map).
- Code-splitting the shared three.js chunk (562 kB, 142 kB gzipped).
- Distance-based physics states (§39).
