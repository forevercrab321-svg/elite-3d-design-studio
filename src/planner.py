from __future__ import annotations

from typing import Any, Dict, List

from schema import (
    CharacterSpec,
    DirectorBrief,
    ReferenceAsset,
    RenderManifest,
    ScenePlanItem,
    ShotPlanItem,
    VisualBible,
)
from utils import ensure_list, infer_pacing, infer_resolution, normalize_duration, pick_first_non_empty, shot_priority, unique_preserve_order


DEFAULT_CONTINUITY_PRIORITIES = [
    "identity",
    "wardrobe",
    "prop ownership",
    "handedness",
    "camera axis",
    "spatial orientation",
    "action state",
    "time-of-day logic",
    "emotional progression",
]


DEFAULT_DO_NOT_BREAK = [
    "Do not jump directly from loose user text to raw generation",
    "Do not change face identity without an explicit story reason",
    "Do not change wardrobe unless the script says so",
    "Do not change props or prop ownership without motivation",
    "Do not change handedness unless shown on screen",
    "Do not use vague prompt language without shot-level specifics",
    "Do not rerender repeatedly without diagnosed failure causes",
]


def build_director_brief(request: Dict[str, Any]) -> DirectorBrief:
    duration = normalize_duration(request.get("target_duration"), default=8)
    aspect_ratio = pick_first_non_empty(request.get("target_aspect_ratio"), request.get("aspect_ratio"), default="16:9")
    platform = pick_first_non_empty(request.get("target_platform"), default="streaming")
    genre = pick_first_non_empty(request.get("genre"), default="cinematic drama")
    tone = pick_first_non_empty(request.get("emotional_tone"), default="controlled cinematic tension")
    realism = pick_first_non_empty(request.get("realism_level"), default="photorealistic")
    pacing = pick_first_non_empty(request.get("pacing"), default=infer_pacing(duration))

    do_not_break = unique_preserve_order(DEFAULT_DO_NOT_BREAK + ensure_list(request.get("do_not_break_rules")))
    continuity_priorities = unique_preserve_order(
        ensure_list(request.get("continuity_priorities")) or DEFAULT_CONTINUITY_PRIORITIES
    )

    return DirectorBrief(
        project_title=pick_first_non_empty(request.get("project_title"), default="Untitled Cinema Sequence"),
        genre=genre,
        emotional_tone=tone,
        realism_level=realism,
        pacing=pacing,
        target_aspect_ratio=aspect_ratio,
        target_duration=duration,
        target_platform=platform,
        do_not_break_rules=do_not_break,
        continuity_priorities=continuity_priorities,
    )


def build_visual_bible(request: Dict[str, Any], brief: DirectorBrief) -> VisualBible:
    style_notes = ensure_list(request.get("style_notes"))
    idea = str(request.get("idea", "")).lower()

    color_world = pick_first_non_empty(
        request.get("color_world"),
        "desaturated grounded palette with motivated highlight contrast" if "suspense" in brief.genre.lower() else "naturalistic color separation with believable contrast",
    )
    lighting_logic = pick_first_non_empty(
        request.get("lighting_logic"),
        "motivated practicals, directional key, and controlled shadow falloff" if "dark" in idea or "hallway" in idea else "motivated source lighting with realistic bounce",
    )
    lens_language = pick_first_non_empty(
        request.get("lens_language"),
        "35mm to 50mm subject-first coverage with continuity-safe eyelines",
    )
    movement_language = pick_first_non_empty(
        request.get("movement_language"),
        "restrained camera movement, intentional dolly work, minimal handheld drift",
    )

    return VisualBible(
        art_direction=pick_first_non_empty(request.get("art_direction"), f"{brief.genre} with disciplined cinematic realism"),
        color_world=color_world,
        lighting_logic=lighting_logic,
        lens_language=lens_language,
        movement_language=movement_language,
        texture_rules=unique_preserve_order([
            "preserve believable skin texture",
            "avoid synthetic sheen unless stylization is explicitly requested",
            *style_notes,
        ]),
        environment_rules=unique_preserve_order([
            "preserve room layout across connected shots",
            "maintain environmental state unless change is motivated on screen",
        ]),
        wardrobe_rules=unique_preserve_order([
            "keep wardrobe anchors stable across contiguous action",
            "avoid spontaneous accessory drift",
        ]),
        props_rules=unique_preserve_order([
            "hero props must remain visible during key action beats",
            "prop ownership may only change when shown or explained",
        ]),
        realism_rules=unique_preserve_order([
            f"maintain {brief.realism_level} image behavior",
            "reject contradictory stylization unless directly requested",
        ]),
    )


def build_character_bible(request: Dict[str, Any], brief: DirectorBrief) -> List[CharacterSpec]:
    characters: List[CharacterSpec] = []
    raw_characters = ensure_list(request.get("characters"))

    if not raw_characters:
        raw_characters = [{
            "id": "lead",
            "name": "Lead",
            "age_range": "adult",
            "gender_presentation": "unspecified",
            "face_geometry": "keep identity stable from provided references",
            "hair": "preserve from references",
            "body_type": "preserve from references",
            "wardrobe_anchors": ["preserve wardrobe from references"],
            "signature_gesture": "action-specific gesture derived from the shot plan",
            "motion_style": brief.pacing,
            "emotional_baseline": brief.emotional_tone,
            "forbidden_drift_list": [
                "do not change facial structure",
                "do not change hair silhouette",
                "do not change wardrobe silhouette",
            ],
        }]

    for index, raw in enumerate(raw_characters, start=1):
        characters.append(
            CharacterSpec(
                id=pick_first_non_empty(raw.get("id"), default=f"character_{index:02d}"),
                name=pick_first_non_empty(raw.get("name"), default=f"Character {index}"),
                age_range=pick_first_non_empty(raw.get("age_range"), default="adult"),
                gender_presentation=pick_first_non_empty(raw.get("gender_presentation"), default="unspecified"),
                ethnicity=raw.get("ethnicity"),
                face_geometry=pick_first_non_empty(raw.get("face_geometry"), default="preserve from reference assets"),
                hair=pick_first_non_empty(raw.get("hair"), default="preserve from reference assets"),
                body_type=pick_first_non_empty(raw.get("body_type"), default="preserve from reference assets"),
                wardrobe_anchors=ensure_list(raw.get("wardrobe_anchors")) or ["preserve wardrobe anchors from reference assets"],
                signature_gesture=pick_first_non_empty(raw.get("signature_gesture"), default="controlled gesture tied to action beat"),
                motion_style=pick_first_non_empty(raw.get("motion_style"), default=brief.pacing),
                emotional_baseline=pick_first_non_empty(raw.get("emotional_baseline"), default=brief.emotional_tone),
                forbidden_drift_list=ensure_list(raw.get("forbidden_drift_list")) or [
                    "do not change face identity",
                    "do not change hair silhouette",
                    "do not change wardrobe silhouette",
                ],
            )
        )

    return characters


def build_scene_plan(
    request: Dict[str, Any],
    brief: DirectorBrief,
    visual: VisualBible,
    characters: List[CharacterSpec],
) -> List[ScenePlanItem]:
    raw_shots = ensure_list(request.get("shot_list"))
    scene_ids = unique_preserve_order([shot.get("scene_id", "scene_01") for shot in raw_shots]) or ["scene_01"]
    primary_character = characters[0].id if characters else "lead"
    idea = pick_first_non_empty(request.get("idea"), default="Cinematic sequence")

    scenes: List[ScenePlanItem] = []
    for position, scene_id in enumerate(scene_ids, start=1):
        scene_shots = [shot for shot in raw_shots if shot.get("scene_id", "scene_01") == scene_id]
        first_action = pick_first_non_empty(*(shot.get("key_action") for shot in scene_shots), default=idea)
        final_action = pick_first_non_empty(*(reversed([shot.get("key_action") for shot in scene_shots]) if scene_shots else []), default=first_action)
        scenes.append(
            ScenePlanItem(
                scene_id=scene_id,
                purpose=pick_first_non_empty(request.get("scene_purpose"), default=f"Advance story intent through {first_action.lower()}"),
                emotional_beat=brief.emotional_tone,
                continuity_dependencies=[scene.scene_id for scene in scenes[-1:]],
                entrance_state=pick_first_non_empty(request.get("entrance_state"), default=f"{primary_character} enters in established emotional baseline"),
                exit_state=pick_first_non_empty(request.get("exit_state"), default=f"Scene resolves on {final_action.lower()}"),
                environment_state=pick_first_non_empty(request.get("environment_state"), default=f"Environment obeys visual bible: {visual.art_direction}"),
                props_state=_build_props_state(request),
                character_state={character.id: character.emotional_baseline for character in characters},
                camera_strategy=pick_first_non_empty(request.get("camera_strategy"), default=visual.movement_language),
                audio_strategy=pick_first_non_empty(request.get("audio_strategy"), default="Preserve believable diegetic texture and avoid contradictory score cues"),
            )
        )
    return scenes


def build_shot_plan(
    request: Dict[str, Any],
    brief: DirectorBrief,
    visual: VisualBible,
    characters: List[CharacterSpec],
    scenes: List[ScenePlanItem],
) -> List[ShotPlanItem]:
    raw_shots = ensure_list(request.get("shot_list"))
    if not raw_shots:
        raw_shots = [{
            "scene_id": scenes[0].scene_id if scenes else "scene_01",
            "shot_id": "shot_01",
            "shot_type": "medium shot",
            "key_action": request.get("idea", "Primary action beat"),
        }]

    character = characters[0] if characters else None
    must_preserve = ensure_list(request.get("constraints", {}).get("must_preserve"))
    must_show_global = ensure_list(request.get("constraints", {}).get("must_show"))

    shots: List[ShotPlanItem] = []
    for index, raw in enumerate(raw_shots, start=1):
        shot_type = pick_first_non_empty(raw.get("shot_type"), default="medium shot")
        key_action = pick_first_non_empty(raw.get("key_action"), default=request.get("idea", "Primary action"))
        framing = pick_first_non_empty(raw.get("framing"), default=_default_framing_for_shot(shot_type))
        lens = pick_first_non_empty(raw.get("lens"), default=_default_lens_for_shot(shot_type, visual.lens_language))
        continuity_locks = unique_preserve_order([
            *must_preserve,
            *(character.forbidden_drift_list if character else []),
            "preserve room layout",
            "preserve camera axis unless intentionally broken",
        ])

        shots.append(
            ShotPlanItem(
                shot_id=pick_first_non_empty(raw.get("shot_id"), default=f"shot_{index:02d}"),
                scene_id=pick_first_non_empty(raw.get("scene_id"), default=scenes[0].scene_id if scenes else "scene_01"),
                shot_type=shot_type,
                framing=framing,
                lens=lens,
                camera_motion=pick_first_non_empty(raw.get("camera_motion"), default=_default_camera_motion(shot_type, visual)),
                subject_motion=pick_first_non_empty(raw.get("subject_motion"), default=character.motion_style if character else "controlled motion"),
                key_action=key_action,
                start_pose=pick_first_non_empty(raw.get("start_pose"), default=f"Start on stable pose that clearly sets up: {key_action}"),
                end_pose=pick_first_non_empty(raw.get("end_pose"), default=f"End on readable completion or anticipation of: {key_action}"),
                continuity_locks=continuity_locks,
                must_show=unique_preserve_order(must_show_global + ensure_list(raw.get("must_show")) + _infer_must_show(key_action)),
                must_not_change=unique_preserve_order(ensure_list(raw.get("must_not_change")) + [
                    "identity",
                    "wardrobe anchors",
                    "prop continuity",
                    "screen direction without motivation",
                ]),
                duration=normalize_duration(raw.get("duration"), default=max(3, round(brief.target_duration / max(len(raw_shots), 1)))),
                transition_intent=pick_first_non_empty(raw.get("transition_intent"), default="cut with continuity-safe spatial logic"),
                priority=pick_first_non_empty(raw.get("priority"), default=shot_priority(shot_type)),
            )
        )
    return shots


def build_render_manifest(
    request: Dict[str, Any],
    brief: DirectorBrief,
    shots: List[ShotPlanItem],
) -> RenderManifest:
    references = [
        ReferenceAsset(
            id=pick_first_non_empty(ref.get("id"), default=f"ref_{index:02d}"),
            type=pick_first_non_empty(ref.get("type"), default="image"),
            role=pick_first_non_empty(ref.get("role"), default="reference"),
            description=pick_first_non_empty(ref.get("description"), default=""),
        )
        for index, ref in enumerate(ensure_list(request.get("references")), start=1)
    ]
    character_reference_ids = [ref.id for ref in references if "character" in ref.role]

    preferred_model = "sora-2-pro" if any(shot.priority == "hero" for shot in shots) else "sora-2"
    if request.get("prefer_multimodal"):
        preferred_model = "seedance-2.0"

    primary_shot = shots[0] if shots else None

    return RenderManifest(
        provider=pick_first_non_empty(request.get("provider"), default="auto"),
        model=pick_first_non_empty(request.get("model"), default=preferred_model),
        resolution=pick_first_non_empty(request.get("resolution"), default=infer_resolution(brief.target_aspect_ratio)),
        duration=primary_shot.duration if primary_shot else brief.target_duration,
        fps=request.get("fps", 24),
        reference_assets=references,
        character_reference_ids=character_reference_ids,
        extension_chain=ensure_list(request.get("extension_chain")),
        edit_chain=ensure_list(request.get("edit_chain")),
        retry_count=int(request.get("retry_count", 0)),
        qc_thresholds=request.get("qc_thresholds", {
            "identity_consistency": "PASS",
            "costume_consistency": "PASS",
            "object_continuity": "PASS",
            "action_completion": "PASS",
            "camera_adherence": "PASS",
        }),
        shot_id=primary_shot.shot_id if primary_shot else None,
        operation=pick_first_non_empty(request.get("operation"), default="text_to_video"),
    )


def _build_props_state(request: Dict[str, Any]) -> Dict[str, str]:
    props = {}
    for item in ensure_list(request.get("constraints", {}).get("must_show")):
        props[item] = "must remain readable"
    return props


def _default_framing_for_shot(shot_type: str) -> str:
    normalized = shot_type.lower()
    if "insert" in normalized:
        return "tight detail framing on the action-critical object or gesture"
    if "close" in normalized:
        return "head-and-shoulders with strong eye-line control"
    if "wide" in normalized or "master" in normalized:
        return "full environment with clear spatial geography"
    return "subject-priority medium framing with readable gesture space"


def _default_lens_for_shot(shot_type: str, lens_language: str) -> str:
    normalized = shot_type.lower()
    if "insert" in normalized:
        return "75mm"
    if "close" in normalized:
        return "85mm"
    if "wide" in normalized or "master" in normalized:
        return "28mm"
    return "50mm" if "50" in lens_language else "35mm"


def _default_camera_motion(shot_type: str, visual: VisualBible) -> str:
    normalized = shot_type.lower()
    if "insert" in normalized:
        return "locked or micro-slider for maximum action clarity"
    if "wide" in normalized:
        return "slow motivated dolly that preserves geography"
    return visual.movement_language


def _infer_must_show(key_action: str) -> List[str]:
    lowered = key_action.lower()
    cues: List[str] = []
    if "key" in lowered:
        cues.append("key")
    if "phone" in lowered:
        cues.append("phone")
    if "bottle" in lowered:
        cues.append("bottle")
    if "door" in lowered or "lock" in lowered:
        cues.append("door hardware")
    return cues
