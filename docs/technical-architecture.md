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
| high | MSAA 4× render target → GTAO (radius follows player size) → bloom (threshold 0.92, authored emissives only) → OutputPass | 512² |
| medium | MSAA 4× → bloom → OutputPass | 512² |
| low | Direct render, native antialias | 256² |

- Shadows: one PCF directional shadow map (2048²) following the player; the extent grows with size.
- `renderer.info.autoReset = false`, so counts include every pass of a frame.
- The environment map is baked once from the sky dome (PMREM).

### Measured (2026-09-23, high tier, 1600×900)

| View | Draw calls | Triangles | Geometries | Textures |
| --- | --- | --- | --- | --- |
| Spawn (gameplay camera) | 262 | 632k | 92 | 60 |
| Worst measured: 60 s bot run, T2 player in the lot | 286 | 636k | — | — |
| Desktop budget | ≤ 300 | ≤ 750k | ≤ 300 | ≤ 60 |
| Mobile (medium tier, iPhone 13 viewport) | 136 / ≤ 150 ✔ | 316k / ≤ 300k ✘ | 92 ✔ | 54 / ≤ 40 ✘ |

Draw calls were cut from ~400 to under 300 by merging player parts per material, per-axle wheel groups, folding trim/lamp/chrome roles and merging untextured arch metals. Startup in the cloud CPU renderer is ~13 s, dominated by first-frame shader compilation (31 programs); on a real GPU this should be ~1 s, which is **not yet measured**.

## Performance (earlier notes)

58 draw calls and about 28k triangles in the start area (shadow pass included). In the cloud session, measured FPS comes from SwiftShader (a CPU renderer), so it **is not performance evidence**; FPS must be measured on real hardware. Phase 7 items:
- Per-instance frustum culling (instanced meshes currently span the map).
- Code-splitting the shared three.js chunk (562 kB, 142 kB gzipped).
- Distance-based physics states (§39).
