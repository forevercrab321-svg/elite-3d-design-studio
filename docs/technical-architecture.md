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
tools/playtest.mjs            headless bot run + real keyboard smoke test + screenshots
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
| `npm run typecheck` / `npm run build` | TS check / production build (studio + game) |

## Performance (current)

58 draw calls and about 28k triangles in the start area (shadow pass included). In the cloud session, measured FPS comes from SwiftShader (a CPU renderer), so it **is not performance evidence**; FPS must be measured on real hardware. Phase 7 items:
- Per-instance frustum culling (instanced meshes currently span the map).
- Code-splitting the shared three.js chunk (562 kB, 142 kB gzipped).
- Distance-based physics states (§39).
