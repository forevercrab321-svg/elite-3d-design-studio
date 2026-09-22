# Project Diagnosis

_Last updated: 2026-09-22_

## State

**Studio pipeline operational. No client project yet.**

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
| Installed skills | `studio-3d-design` (entry point) + `threejs-game-skills` (9; 4 game-only set to manual invocation). See `docs/skill-integration.md` |
| External generation keys | TRIPO / GEMINI / ELEVENLABS all MISSING in the cloud session (optional) |
| Scene content | Ground datum + scale references only |

## Next step

Receive the first design brief → requirement extraction (CLAUDE.md §04) → fill `model-spec.yaml` → first generator → `npm run studio:check`.
