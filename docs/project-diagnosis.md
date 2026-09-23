# Project Diagnosis

_Last updated: 2026-09-22_

## State

**Active project: GROW EVERYTHING (browser game), Phase 1 greybox playable.** Studio model pipeline also operational.

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
| Game | `game/`: 60 s prototype (Scrap City alley/street), bot playtest `npm run playtest` passes on 3 seeds. See `docs/technical-architecture.md` |
| Studio scene content | Ground datum + scale references only |

## Next step

1. Human playtest of the 60 s prototype (Creative Director), to validate the bot-speed assumption.
2. Phase 2 vertical slice: class-4/5 transition content so vehicles unlock in 1.5–3 min, then the first car destruction.
