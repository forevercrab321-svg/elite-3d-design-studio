# Skill Integration — `threejs-game-skills`

| | |
| --- | --- |
| Source | https://github.com/majidmanzarpour/threejs-game-skills |
| Pinned commit | `e5f301d548bb18c530afbece78cd25082f4cda9c` (2026-09-05) |
| License | MIT — copy at `.claude/skills/THREEJS-GAME-SKILLS-LICENSE` |
| Installed to | `.claude/skills/` (project scope; Claude Code auto-discovers these in every session on this repo) |
| Install method | upstream `install.sh --claude` with `CLAUDE_SKILLS_DIR=.claude/skills` |

To update: clone upstream, re-run `CLAUDE_SKILLS_DIR=$PWD/.claude/skills ./install.sh --claude --force`, review the diff, bump the pinned commit above, then **re-apply the local modifications below** (the installer overwrites them).

## Studio entry point

**`.claude/skills/studio-3d-design/`** is the studio's own skill and the entry point for all 3D design work. It defines the repository pipeline (`model-spec.yaml` → `src/generators/` → `npm run studio:check` → review renders / QA report / GLB) and routes to the `threejs-*` specialists below only where they add value.

## Local modifications to the vendored pack

| Skill | Change | Reason |
| --- | --- | --- |
| `threejs-game-director` | `disable-model-invocation: true` | Its trigger words ("premium", "AAA", "high-fidelity", "showcase") match ordinary design requests and would pull 3D design work into a game workflow. Still callable explicitly as `/threejs-game-director`. The folder stays in place because sibling skills reference its credential probe script |
| `threejs-gameplay-systems` | `disable-model-invocation: true` | Game loop / scoring / level design is outside the studio scope unless an interactive deliverable is requested |
| `threejs-game-ui-designer` | `disable-model-invocation: true` | HUDs and menus are game-only |
| `threejs-audio-generator` | `disable-model-invocation: true` | Audio is not part of model production |

Auto-invocable for 3D design: `threejs-aaa-graphics-builder`, `threejs-3d-generator`, `threejs-image-generator`, `threejs-debug-profiler`, `threejs-qa-release`.

## What the pack is

Nine skills built for **Three.js browser games**. Our studio is a 3D design and modeling studio, so the pack is used as the **real-time / web delivery toolchain** and asset-generation layer, not as the definition of our scope. The studio prompt in `CLAUDE.md` governs; skill defaults that assume "game" (core loop, HUD, scoring) apply only when the deliverable is actually interactive.

## Agent → skill mapping

| Studio agent (CLAUDE.md §02) | Skill(s) | Used for |
| --- | --- | --- |
| A. Design Director | `threejs-aaa-graphics-builder` → `references/visual-scorecard.md` | 10-category visual scorecard as one input to design review (never a substitute for design judgment) |
| B. 3D Modeling Director | `threejs-aaa-graphics-builder` (`authoring-recipes.md`), `threejs-3d-generator` | Choosing per-surface source: procedural Three.js vs. Tripo-generated vs. image-to-3D hybrid |
| C. Architectural / Spatial | `threejs-aaa-graphics-builder` (model factories, world prop kits) | Procedural building / kit-of-parts code in `src/generators/` |
| D. Hard-Surface & Industrial | `threejs-3d-generator` (Tripo text/image→3D, `--geometry-quality detailed`) | Hero objects: vehicles, robots, equipment — then QA'd and re-scaled to real dimensions |
| E. Parametric & Computational | `threejs-aaa-graphics-builder` (`technical-art.md`: instancing/LOD) | Parameter-driven generators reading `model-spec.yaml` |
| F. Environment & Landscape | `threejs-aaa-graphics-builder`, `threejs-image-generator` (skies, ground textures) | Terrain, vegetation instancing, sky/background plates |
| G. Material & LookDev | `threejs-aaa-graphics-builder` (material library, `shader-cookbook.md`), `threejs-image-generator` (texture refs, decals) | PBR material kit in `src/materials/` |
| H. Lighting & Visualization | Studio pipeline `npm run render:review` (locked spec cameras + orthographic QA views); `threejs-aaa-graphics-builder` for tone mapping, shadows, post | Review captures into `renders/review/` |
| I. Geometry QA | Studio pipeline `npm run qa:geometry` (primary); `threejs-debug-profiler` | Topology, naming, floating / buried / coincident geometry, budgets; renderer and loading bugs |
| J. Scale & Realism | Studio pipeline: `REF_ScaleFigure_1750mm` and `REF_CalibrationCube_1m` in every review render | Visual scale check against known dimensions, plus the numbers in `model-spec.yaml` |
| K. Performance / Real-time | `threejs-debug-profiler`, `threejs-aaa-graphics-builder/references/technical-art.md` | Draw calls, triangles, textures, memory, render budgets, LOD, instancing |
| L. Technical Pipeline | `threejs-3d-generator` (`conversion` postprocess, `references/threejs-integration.md`), `threejs-gameplay-systems` (Vite + TS + Three.js scaffold) | GLB/FBX import/export, web viewer scaffold |
| M. GitHub / Version Control | — | Handled by studio rules (§27–28) |
| (interactive deliverables only, explicit `/` invocation) | `threejs-game-director`, `threejs-gameplay-systems`, `threejs-game-ui-designer`, `threejs-audio-generator` | Only when the user asks for an interactive experience, configurator, walkthrough, or game |

## Conventions adopted

1. **Output paths.** Skills default to `artifacts/` and `assets/models/<name>`. In this repo: generated/sourced models → `assets/models/<name>/`, review captures → `renders/review/`, evidence and progress notes → `docs/` (e.g. `docs/progress.md` instead of `artifacts/game-progress.md`). Job checkpoints (`*-job.json`) may live in `artifacts/`, which is git-ignored.
2. **Credentials.** External generation (Tripo / Gemini / ElevenLabs) is optional. Before assuming keys exist, run `bash .claude/skills/threejs-game-director/scripts/probe_asset_credentials.sh` (prints SET/MISSING only). Never commit keys.
3. **Generated models are raw material, not deliverables.** Every Tripo output goes through Scale & Realism and Geometry QA review, is re-scaled to real-world units, renamed per CLAUDE.md §08, and has its origin/pivot corrected before it is used.
4. **Procedural first** (CLAUDE.md §10). Repeated systems are always procedural; generation is reserved for hero surfaces where procedural code cannot reach the quality bar.
5. **Verification.** `npm run studio:check` is the studio's standard gate. Skill checks (`inspect-threejs-canvas.mjs`, `check_evidence.py`) establish artifact coverage, not design quality. Neither replaces the six-review loop in CLAUDE.md §15.
6. **Browser.** In the cloud environment Chromium is pre-installed; do not run `playwright install`.
