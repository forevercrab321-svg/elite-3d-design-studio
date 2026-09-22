---
name: studio-3d-design
description: "Entry point for all 3D design and modeling work in this studio repository: buildings, sites, landscapes, products, vehicles, equipment, infrastructure, procedural systems, reference-image reconstruction, review renders, geometry QA, and GLB export. Use for any request to create, modify, review, fix, render, or export a 3D model, and for design feedback such as 'too steep', 'too fat', 'wrong scale', 'match this image'. Routes to the threejs-* specialist skills where they help."
---

# Studio 3D Design

The studio's production workflow. `CLAUDE.md` defines the team, the standards, and the rules; this skill defines **how work moves through the repository**. When they disagree, `CLAUDE.md` and the Creative Director's latest instruction win.

## Pipeline at a glance

```text
brief ─► requirements (§04) ─► model-spec.yaml ─► src/generators/<system>.ts ─► npm run studio:check
                                                                                 ├─ renders/review/*.png   (look at them)
                                                                                 ├─ renders/review/qa-report.json
                                                                                 └─ exports/glb/<PROJECT>.glb
      ◄──────────────── six-review loop (§15) · docs/design-decisions.md · commit ◄┘
```

| Command | What it does |
| --- | --- |
| `npm run studio:check` | render + QA + export in one pass; non-zero exit on QA errors, blank renders, or page errors |
| `npm run render:review` | every `camera.views` entry plus orthographic `top` / `front` / `right` → `renders/review/<view>.png` |
| `npm run qa:geometry` | Geometry QA → `renders/review/qa-report.json` |
| `npm run export:glb` | GLB of the project hierarchy (references, lights, cameras stripped), re-parsed to prove it loads |
| `npm run dev` | interactive orbit viewer at http://127.0.0.1:5190 |
| `npm run typecheck` | TypeScript check of `src/` |
| `node tools/studio.mjs render --views review_persp,top` | render a subset |

First run in a fresh checkout: `npm install`. In cloud sessions Chromium is pre-installed at `/opt/pw-browsers`; never run `playwright install` there.

## Step 1 — Requirements

Translate the brief into the §04 block (REQUIRED / INFERRED / OPTIONAL per §03) before touching geometry. Write the numbers into `model-spec.yaml`:

- `project` — name (becomes the root node and GLB file name), type, units.
- `systems.<key>` — one parameter block per procedural system. Every dimension a reviewer might ask to change lives here, never as a literal in generator code.
- `camera.views` — physical cameras (position, target, lens mm, sensor mm). Set `locked: true` when approved; a locked view is never edited without an explicit instruction.
- `delivery.performance` — triangle / draw-call / texture budgets when the target is web or real-time.

Record approvals, locks, and corrections in `docs/design-decisions.md` as they happen.

## Step 2 — Modeling

Code lives in `src/`, scene units follow `model-spec.yaml` (Y up, glTF convention):

| Folder | Holds |
| --- | --- |
| `src/generators/` | one file per procedural system, registered in `src/generators/index.ts` under its `systems` key |
| `src/geometry/` | reusable parametric parts (profiles, frames, kit-of-parts pieces) |
| `src/materials/library.ts` | the shared PBR material library — reuse, never duplicate materials per object |
| `src/scene/` | pipeline internals (spec loader, hierarchy, lighting, cameras, QA, export) — change only to improve the pipeline |

Generator rules:

1. Add output under the right `CLAUDE.md` §08 collection via `hierarchy.collection('ARCHITECTURE')` etc. Empty collections are pruned on export.
2. Name every object for its function (`Roof_Truss_03`, `PV_Module_R02_C14`). QA flags `Cube.001`-style names.
3. Build on the ground datum (y = 0). Anything intentionally elevated, buried, or open must say so with a reason: `userData.allowFloat`, `userData.belowGround`, `userData.openSurface`.
4. Repeated elements → `THREE.InstancedMesh` or shared geometry + material (§10, §24).
5. Choose the modeling method per element (§02-B). Hand-authored hero geometry, procedural systems, and generated assets can coexist in one scene.

## Step 3 — Specialist skills

Use a specialist only when its output is better than working directly. Always read its `SKILL.md` and the references it names for the phase you are in.

| Need | Skill | Studio caveat |
| --- | --- | --- |
| Premium materials, lighting, tone mapping, shaders, instancing/LOD, render budgets, visual scorecard | `threejs-aaa-graphics-builder` | Ignore game-only surfaces (HUD, pickups). Its scorecard complements the §15 reviews; it does not replace them |
| Hero objects that procedural code cannot reach (vehicles, robots, sculptural pieces), text/image → 3D, format conversion | `threejs-3d-generator` | Needs `TRIPO_API_KEY`. Output is raw material: re-scale to real dimensions, re-origin, rename, then run QA |
| Concept sheets, image-to-3D inputs, texture references, sky/background plates | `threejs-image-generator` | Needs `GEMINI_API_KEY` |
| Blank canvas, loading failures, performance profiling (draw calls, triangles, memory) | `threejs-debug-profiler` | — |
| Production build and browser verification of an interactive web deliverable | `threejs-qa-release` | Only for interactive deliverables; `npm run studio:check` covers model review |
| Interactive experience, configurator, walkthrough, or game | `threejs-game-director` (and gameplay / UI / audio siblings) | Not auto-invoked in this repo; call `/threejs-game-director` explicitly only when the Creative Director asks for interactivity |

Before any external generation: `bash .claude/skills/threejs-game-director/scripts/probe_asset_credentials.sh` (prints SET/MISSING only). Keys never enter the repo. Generated files go to `assets/models/<name>/`; job checkpoints to `artifacts/` (git-ignored).

## Step 4 — Verify (never skip)

1. `npm run studio:check`. It must exit 0.
2. **Open and look at every PNG in `renders/review/`.** A passing script is not a passing model (§17). Check silhouette, proportion, contact with the ground, shadow direction against `lighting`, and scale against `REF_ScaleFigure_1750mm` and `REF_CalibrationCube_1m`.
3. Read `renders/review/qa-report.json`. Fix every `error`. Each remaining `warning` needs either a fix or a written reason (a `userData` flag with a comment).
4. Run the six reviews in `CLAUDE.md` §15 against the renders, then audit every REQUIRED item from Step 1.
5. Fix what the reviews find and repeat. Only then report, using DONE / IN PROGRESS / NEEDS REVIEW / BLOCKED (§29).

The QA engine's detection was validated by fault injection: generic names, floating geometry, below-ground geometry, duplicated or coplanar geometry, mirrored transforms, open meshes, and unregistered systems are all caught. It does **not** judge design quality, detect self-intersections inside a single mesh, or check UV stretching. Those remain human-eye review items.

## Step 5 — Commit and report

- Commit review renders together with the change they document, so the history shows how the design evolved. Commit exports only when they are a deliverable.
- Use one logical commit per unit of work, with message style `feat: build parametric photovoltaic array` (§28).
- Report to the Creative Director in Chinese: what changed, why, what was verified (attach or link the review renders), and what still needs attention.

## Feedback handling

Feedback changes **parameters**, not individual objects (§18). For a comment like "panels too steep", find the controlling value in `model-spec.yaml`, change it, regenerate, re-verify, and log the change in `docs/design-decisions.md` → *User corrections log*. Before finishing, check that no LOCKED element moved.
