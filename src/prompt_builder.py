from __future__ import annotations

from typing import List

from schema import CharacterSpec, DirectorBrief, PromptPackage, ScenePlanItem, ShotPlanItem, VisualBible
from utils import unique_preserve_order


def build_generation_prompt(
    shot: ShotPlanItem,
    brief: DirectorBrief,
    visual: VisualBible,
    characters: List[CharacterSpec],
    scenes: List[ScenePlanItem],
) -> PromptPackage:
    scene = next((item for item in scenes if item.scene_id == shot.scene_id), None)
    lead = characters[0] if characters else None

    subject = _build_subject_line(lead, shot)
    setting = _build_setting_line(scene, visual)
    action = f"Key action: {shot.key_action}. Start pose: {shot.start_pose}. End pose: {shot.end_pose}. Subject motion: {shot.subject_motion}."
    camera = f"Shot type: {shot.shot_type}. Framing: {shot.framing}. Lens: {shot.lens}. Camera motion: {shot.camera_motion}. Preserve axis and readable screen direction."
    lighting = f"Lighting logic: {visual.lighting_logic}. Color world: {visual.color_world}. Keep tonal behavior aligned with {brief.emotional_tone}."
    style = f"Art direction: {visual.art_direction}. Lens language: {visual.lens_language}. Movement language: {visual.movement_language}. Realism target: {brief.realism_level}."

    negative_constraints = unique_preserve_order([
        "no identity drift",
        "no wardrobe drift",
        "no prop ownership drift",
        "no handedness swap without visible motivation",
        "no camera-axis break unless intentional",
        "no anatomy distortions",
        "no muddy background that obscures the key action",
        *shot.must_not_change,
    ])

    output_intent = (
        f"Render a continuity-safe {shot.duration}-second shot for {brief.target_platform} in {brief.target_aspect_ratio}. "
        f"Prioritize action readability, emotional clarity, and seamless downstream editing."
    )

    final_prompt = " ".join([
        subject,
        setting,
        action,
        camera,
        lighting,
        style,
        f"Continuity locks: {'; '.join(shot.continuity_locks)}.",
        f"Must show: {'; '.join(shot.must_show) if shot.must_show else 'maintain planned visual salience'}.",
        f"Negative constraints: {'; '.join(negative_constraints)}.",
        output_intent,
    ])

    return PromptPackage(
        subject=subject,
        setting=setting,
        action=action,
        camera=camera,
        lighting=lighting,
        style=style,
        continuity_locks=shot.continuity_locks,
        negative_constraints=negative_constraints,
        output_intent=output_intent,
        final_prompt=final_prompt,
    )


def _build_subject_line(lead: CharacterSpec | None, shot: ShotPlanItem) -> str:
    if not lead:
        return "Subject: preserve the established protagonist identity and keep the action legible."

    wardrobe = ", ".join(lead.wardrobe_anchors) if lead.wardrobe_anchors else "established wardrobe"
    return (
        f"Subject: {lead.name}, {lead.age_range}, {lead.gender_presentation}, face geometry {lead.face_geometry}, "
        f"hair {lead.hair}, body type {lead.body_type}, wardrobe {wardrobe}, signature gesture {lead.signature_gesture}. "
        f"Maintain emotional baseline {lead.emotional_baseline} while performing {shot.key_action}."
    )


def _build_setting_line(scene: ScenePlanItem | None, visual: VisualBible) -> str:
    if not scene:
        return f"Setting: maintain the established environment according to {visual.art_direction}."
    return (
        f"Setting: {scene.environment_state}. Purpose: {scene.purpose}. Emotional beat: {scene.emotional_beat}. "
        f"Environment rules: {'; '.join(visual.environment_rules)}."
    )
