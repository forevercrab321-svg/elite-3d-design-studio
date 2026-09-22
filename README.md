# Elite 3D Design & Modeling Studio

一个运行在 Claude Code 里的多智能体 3D 设计 / 建模 / 可视化工作室。
A multi-agent 3D design, modeling, visualization, and real-time production studio operated by Claude Code on this repository.

The studio turns design intent — references, sketches, images, dimensions, drawings, written briefs, and iterative feedback — into professional, technically coherent, editable, production-ready 3D models.

## How it works

| File | Role |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | The studio operating prompt: 13 specialist agents, quality bar, workflow rules. Loaded automatically by Claude Code. |
| [`model-spec.yaml`](model-spec.yaml) | Shared numeric source of truth (units, dimensions, parameters, camera). |
| [`docs/design-decisions.md`](docs/design-decisions.md) | Design memory: approvals, locked elements, user corrections, pending issues. |
| [`docs/skill-integration.md`](docs/skill-integration.md) | How the installed skills map onto the studio's agents. |
| [`docs/project-diagnosis.md`](docs/project-diagnosis.md) | Current repository / pipeline state. |
| [`.claude/skills/`](.claude/skills) | Installed skills — [`threejs-game-skills`](https://github.com/majidmanzarpour/threejs-game-skills) (MIT). |

### The team

Design Director · 3D Modeling Director · Architectural/Spatial Specialist · Hard-Surface & Industrial Specialist · Parametric & Computational Specialist · Environment & Landscape Specialist · Material & LookDev Specialist · Lighting & Visualization Director · Geometry QA Engineer · Scale & Realism Reviewer · Performance/Real-time Engineer · Technical Pipeline Engineer · GitHub/Version Control Manager

### Workflow

```text
UNDERSTAND → ANALYZE → DESIGN → MODEL → VERIFY → VISUALIZE → OPTIMIZE → DOCUMENT → ITERATE
```

## Repository layout

```text
assets/      models/ textures/ environment/     source & generated assets
src/         geometry/ generators/ materials/ scene/   procedural code
exports/     glb/ fbx/ usd/                      delivery files
renders/     review/ final/                      review captures & final images
references/                                      user-supplied images, drawings, CAD
docs/                                            design memory & documentation
```

## Optional API keys

External generation is optional (procedural work needs no keys). Set in your shell, never in the repo:
`TRIPO_API_KEY` (text/image → 3D), `GEMINI_API_KEY` (concept / texture images), `ELEVENLABS_API_KEY` (audio).
