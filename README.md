# cinema-video-director-1.0.0

Production-grade OpenClaw skill for cinematic AI video generation.

## What it does

This skill converts raw ideas, scripts, references, and shot notes into a structured video production pipeline:
- director brief
- visual bible
- character bible
- scene plan
- shot plan
- render manifest
- layered prompts
- continuity checks
- QC and retry decisions

## Setup

This starter implementation uses the Python standard library only.

Run with `PYTHONPATH=src` so local modules resolve cleanly.

## Basic usage

```bash
cd /Users/monsterlee/skills/cinema-video-director-1.0.0
PYTHONPATH=src python - <<'PY'
from planner import (
    build_director_brief,
    build_visual_bible,
    build_character_bible,
    build_scene_plan,
    build_shot_plan,
    build_render_manifest,
)
from prompt_builder import build_generation_prompt
from provider_router import render_video

request = {
    "project_title": "Hallway Key",
    "idea": "A tense woman waits in a dim apartment hallway holding a silver key.",
    "genre": "suspense",
    "target_duration": 6,
    "references": [{"id": "char_ref_1", "type": "image", "role": "character"}],
    "characters": [{
        "id": "lead",
        "name": "Mira",
        "age_range": "late 20s",
        "gender_presentation": "woman",
        "face_geometry": "oval face, sharp cheekbones",
        "hair": "blunt black bob",
        "body_type": "slim",
        "wardrobe_anchors": ["charcoal overcoat", "black trousers"],
        "signature_gesture": "tight grip on key",
        "motion_style": "controlled, careful",
        "emotional_baseline": "tense restraint",
    }],
}

brief = build_director_brief(request)
visual = build_visual_bible(request, brief)
characters = build_character_bible(request, brief)
scenes = build_scene_plan(request, brief, visual, characters)
shots = build_shot_plan(request, brief, visual, characters, scenes)
manifest = build_render_manifest(request, brief, shots)
prompt = build_generation_prompt(shots[0], brief, visual, characters, scenes)
result = render_video(prompt, manifest)
print(result.to_dict())
PY
```

## Notes

- Provider adapters are placeholders by default.
- Planning remains provider-agnostic.
- Rendering returns normalized output for downstream QC.
- Templates and examples are included for quick bootstrapping.
