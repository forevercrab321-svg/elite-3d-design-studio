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
    main.ts / app.ts / story.ts  shared setup; mode select (arena default, ?mode=story or #story)
    arena/                    ArenaGame (multi-actor sim), ArenaSession (lobby, host authority, sync),
                              ArenaBot (AI rival), ArenaUi (Chinese-first lobby/HUD/results), progress (coins, unlocks)
    net/Net.ts                transports: RoomNet (claude.ai room + user), LocalNet (BroadcastChannel), SoloNet
    config/arena.ts, vehicles.ts  round rules, rewards/penalties, vehicle stats
    world/city.ts, cities/    CityDef + parametric city kit; shanghai.ts, newyork.ts, paris.ts, scrap.ts
    world/cityProps.ts        city props, destructible building styles, landmark kits
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

- Shadows: one PCF directional shadow map (4096 × 2048), focused ahead of the camera and texel-snapped to avoid shimmer. The extent grows with size. The orthographic window is fitted to the receivers' light-space footprint: ±extent horizontally, ±extent·sin(sun elevation) plus roof height vertically. A caster is rendered only if its shadow can land in view, and texel density is about 3× higher than with a square window.
- `renderer.info.autoReset = false`, so counts include every pass of a frame.
- IBL: `public/hdri/pedestrian_overpass_1k.hdr` (CC0) → PMREM, `scene.environmentRotation` aligns its sun with `SUN_DIRECTION`. If it fails to load, the environment is baked from the procedural sky dome.
- Tone mapping: AgX by default (`?tonemap=agx|aces|neutral`, `?exposure=`). Grade, vignette, grain and chromatic aberration run inside the output pass (`CinematicOutputPass`).
- Surface shaders are injected with `onBeforeCompile` plus `customProgramCacheKey`: `weathering()` (wall/ground/prop) and `interiorMapping()` (window and shop glass, per-window `roomCenter` attribute).
- Set dressing (`world/dressing.ts`) is 3 merged meshes: trunks+pits+sign pole (vertex colour), leaf canopies (alpha-tested, wind sway, custom depth material for shadows), and weeds+decals sharing one atlas texture.
- **Props render through `BatchedMesh`, one per material role and size set** (`world/World.ts`). Every object type that uses a role shares one multi-draw call (`WEBGL_multi_draw`). Instances are frustum-culled per camera by BatchedMesh, for both the view and the sun's shadow camera. Per frame, `World.cull()` hides instances smaller than about 3 px and swaps in a far **LOD** beyond 9 object sizes. LODs come from `world/lod.ts`: the role geometry is welded, edge-collapsed to about 28 % with `SimplifyModifier`, then its creased normals and UV convention are rebuilt. This is done once per heavy geometry at load. The switch is `setGeometryIdAt`. BatchedMesh keeps instance data in small float textures (2–3 per batch).
- **Render layers** (`art/layers.ts`): small props (class ≤ 5), FX, alpha-tested foliage, weeds, decals, the sky and the player live on `LAYER_NO_AO`, which the GTAO pre-pass skips. Foliage cards would otherwise read as solid quads in the normal pass. The main camera and the shadow camera see both layers.
- The world is data-driven: object kit in `world/props.ts` (street) and `world/heavyProps.ts` (site, yard, warehouse), shared authoring in `world/propKit.ts`. Supports, collapses and the climax are driven by placement tags (`supports`) and `destructionType`; nothing is special-cased per object.
- Audio: `audio/AudioEngine.ts` is a WebAudio synth driven by `Game.onEvent` (presentation only; it never runs in test mode).
- QA hooks: `__GROW__.meshStats()`, `grant(kg)`, `teleport(x, z, heading)`; `__GROW_DEBUG__` (test mode) exposes `{ game, renderer, pipeline }`; `tools/mesh-stats.mjs` prints the per-mesh table.

### Measured (2026-09-23, high tier, 1600×900)

| View | Draw calls | Triangles | Geometries | Textures |
| --- | --- | --- | --- | --- |
| Spawn (gameplay camera), MVP with all zones | 187 | 591k | 76 | 60 image + 84 data |
| Worst review view (alley mouth → lot, 24 vehicles) | 171 | ≤ 745k → trimmed by LOD 12 → 9 sizes | 76 | 60 + 84 |
| Tier-4 machine / climax tear-down | 220–230 | 646–675k | 104–106 | ≤ 60 + 84 |
| Bot run end state (all 3 seeds) | 199–203 | 298–304k | — | — |
| Desktop budget | ≤ 300 | ≤ 750k | ≤ 300 | ≤ 60 image textures |
| Mobile (medium tier, iPhone 13 viewport) | 131 / ≤ 150 ✔ | 319k / ≤ 300k ✘ | 76 ✔ | 54 / ≤ 40 image ✘ |

The inspector's `textures` row counts every GPU texture, so it reads 144 against a limit of 60 on desktop. `tools/inspect-game.mjs` leaves that row as the inspector reports it and adds an `imageTextures` row that excludes BatchedMesh data textures. Desktop is within budget by that row (60/60).

How the full MVP world fits the budget (first integration: 600 calls and 1.41M triangles):

| Step | Calls | Triangles |
| --- | --- | --- |
| New content on InstancedMesh per (type × role) | 600 | 1.41M |
| GTAO skips small props, FX, foliage and sky; lighter wheels | 471 | 864k |
| BatchedMesh per role and size set (multi-draw, per-camera culling) | 211 | 844k |
| Shadow window fitted to the receivers' light-space footprint | 211 | 799k |
| Far LOD (SimplifyModifier, 28 %) | 211 | 558k |
| Player off the GTAO pass | 187 at spawn / 220 at tier 4 | 591k / 675k |

Realism-pass trims to stay inside the budget: bicycle wheels (fewer torus segments and spokes), bin lathes (28 → 22), no shadow casting for tyre/trim roles below class 5, the dark brick reusing the red brick's normal/roughness maps, and weeds living in the decal atlas. Draw calls were cut earlier from ~400 to under 300 by merging player parts per material, per-axle wheel groups, folding trim/lamp/chrome roles and merging untextured arch metals. Startup in the cloud CPU renderer is ~13 s, dominated by first-frame shader compilation (31 programs); on a real GPU this should be ~1 s, which is **not yet measured**.

## Performance (earlier notes)

58 draw calls and about 28k triangles in the start area (shadow pass included). In the cloud session, measured FPS comes from SwiftShader (a CPU renderer), so it **is not performance evidence**; FPS must be measured on real hardware. Phase 7 items:
- ~~Per-instance frustum culling~~: done with BatchedMesh and per-camera culling (MVP).
- Mobile tier: triangles 319k vs 300k and image textures 54 vs 40. Next steps are a coarser LOD at medium quality and 256² textures on touch devices.
- Code-splitting the shared three.js chunk (562 kB, 142 kB gzipped).
- Distance-based physics states (§39).

## Online arena (multiplayer)

- **Transport.** `RoomNet` wraps the artifact `room` capability: *presence* carries each player's machine state (`WireState`, 12 numbers, ~30 Hz, coalesced) and the host's AI rivals; *events* carry `match` (phase/roster/seed beacon, host only), `claim`/`grant` (object ownership), `eat`/`eaten` (player kills) and refills (`grant.r`). All five topics are declared `interact` so shared players can send them. Every payload is validated as untrusted input.
- **Authority.** Host = lowest peer id among joined players (in a match: roster players still present). Migration needs no negotiation; AI ownership moves with it. Grants are first-come with a 5% size slack for lag; eats are checked for size, distance and a respawn cooldown.
- **Client prediction.** Each client simulates its own machine and pulls objects optimistically; an object is absorbed only once the host grants it to that machine (re-claimed after 1.5 s if the grant is lost). Remote machines are extrapolated 150 ms and eased.
- **Presence.** `{ep, s: WireState, b: [[slot, ...WireState]] | null}`, sent at ≤ 20 Hz and only on change. The flags bitfield carries alive / eliminated / invulnerable / shield / speed / magnet, so every client, and the host's eat validation, sees power-ups.
- **Wire format.** Machines are referenced by roster slot (0–3) in `claim` / `grant` / `eat` / `eaten`. The host's 1 Hz `match` beacon also carries `abs`, a base64 bitset of absorbed objects. Late joiners rebuild the city state from it, and every client repairs drift caused by dropped messages. It skips objects this client is pulling into its own machine, and anything it absorbed in the last 4 s.
- **Determinism.** The city layout, object ids and AI names derive from the match seed, so every client builds the same world.
- **Tests.** `?net=local&room=X` runs the same code over BroadcastChannel between tabs; `?net=solo` plays against AI. Test hooks: `window.__ARENA__` (`session`, `game()`, `step(s)`, `autopilot(on)`, `summary()`, `stats()`).
