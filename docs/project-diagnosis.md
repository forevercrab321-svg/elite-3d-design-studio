# Project Diagnosis

_Last updated: 2026-09-23_

## State

**Active project: GROW EVERYTHING (browser game): complete MVP run, from the alley to warehouse destruction.** The studio model pipeline is also operational.

The repository is `forevercrab321-svg/elite-3d-design-studio` (renamed from `cinema-video-director-1.0.0`). The previous AI-video skill content was removed and is recoverable from commit `b18f1f5`.

## Pipeline map

| Item | Current state |
| --- | --- |
| Modeling / scene code | TypeScript + Three.js r184 (`src/`), procedural-first, driven by `model-spec.yaml` |
| Rendering | Three.js WebGL, ACES tone mapping, PCF soft shadows; headless Chromium (SwiftShader) for review captures |
| Review output | `renders/review/<view>.png` for every spec camera plus orthographic top / front / right |
| Geometry QA | `src/scene/qa.ts` → `renders/review/qa-report.json`. Validated by fault injection (7/7 injected defects caught) |
| Export | GLB via GLTFExporter, stripped of references, lights and cameras, then round-trip parsed |
| Tooling | Node 22, Vite 8, Playwright 1.56.1 (matches the pre-installed Chromium), `tools/studio.mjs` driver |
| Other DCC tools | None committed. Blender, Rhino and others are adopted per project when a brief requires them |
| Installed skills | `studio-3d-design` (model work) + `threejs-game-skills` (9, all auto-invocable since the game started). See `docs/skill-integration.md` |
| External generation keys | TRIPO / GEMINI / ELEVENLABS all MISSING in the cloud session (optional) |
| Game | `game/`: complete MVP. Zones A–E plus the back lot, 40 object types, a staged warehouse climax, tiers 1–4, destruction VFX, procedural audio, and a HUD with objective and end card. `npm run playtest` plays the full run (24/24 on 3 seeds); `npm run art:review` covers 16 fixed shots; `npm run inspect:game`. Desktop render budget held |
| Studio scene content | Ground datum + scale references only |

## Next step

1. Human playtest of the full run (Creative Director): validate the ÷1.7 bot-speed assumption, the feel of the destruction, and the audio mix.
2. Mobile tier: fit the 300k-triangle and 40-texture budget; add touch controls.
3. Post-MVP scope, only if approved: class 8–10 buildings and tier 5 (City Recycler), more worlds (§66).
