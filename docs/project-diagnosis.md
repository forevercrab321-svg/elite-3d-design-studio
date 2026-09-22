# Project Diagnosis

_Last updated: 2026-09-22_

## State

**Fresh studio repository — no model work yet.**

The repository previously held `cinema-video-director-1.0.0`, an unrelated AI-video pipeline skill (Python). All of that content was removed at the Creative Director's request; it remains recoverable from git history (commit `b18f1f5`).

## Pipeline map

| Item | Current state |
| --- | --- |
| 3D software | None committed yet. Default web pipeline: Three.js (via installed skills). Blender/Rhino/etc. adopted per project. |
| Rendering engine | Three.js / WebGL for previews and web delivery (scaffold available in `threejs-gameplay-systems`). |
| Asset formats | GLB (primary web delivery); FBX / USD exports as needed. |
| Runtime | Node + Vite + TypeScript (when a web viewer is created); Python for generator/tooling scripts. |
| Existing models | None. |
| Existing scripts | Only the skill-pack helpers under `.claude/skills/`. |
| Spec / memory | `model-spec.yaml`, `docs/design-decisions.md` initialised empty. |
| Installed skills | `threejs-game-skills` (9 skills) — see `docs/skill-integration.md`. |

## Next step

Receive the first design brief → requirement extraction (CLAUDE.md §04) → fill `model-spec.yaml` → production.
