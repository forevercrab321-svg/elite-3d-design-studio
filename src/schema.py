from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


class Serializable:
    """Small helper for consistent JSON-ready output."""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class DirectorBrief(Serializable):
    project_title: str
    genre: str
    emotional_tone: str
    realism_level: str
    pacing: str
    target_aspect_ratio: str
    target_duration: int
    target_platform: str
    do_not_break_rules: List[str] = field(default_factory=list)
    continuity_priorities: List[str] = field(default_factory=list)


@dataclass
class VisualBible(Serializable):
    art_direction: str
    color_world: str
    lighting_logic: str
    lens_language: str
    movement_language: str
    texture_rules: List[str] = field(default_factory=list)
    environment_rules: List[str] = field(default_factory=list)
    wardrobe_rules: List[str] = field(default_factory=list)
    props_rules: List[str] = field(default_factory=list)
    realism_rules: List[str] = field(default_factory=list)


@dataclass
class CharacterSpec(Serializable):
    id: str
    name: str
    age_range: str
    gender_presentation: str
    ethnicity: Optional[str]
    face_geometry: str
    hair: str
    body_type: str
    wardrobe_anchors: List[str] = field(default_factory=list)
    signature_gesture: str = ""
    motion_style: str = ""
    emotional_baseline: str = ""
    forbidden_drift_list: List[str] = field(default_factory=list)


@dataclass
class ScenePlanItem(Serializable):
    scene_id: str
    purpose: str
    emotional_beat: str
    continuity_dependencies: List[str] = field(default_factory=list)
    entrance_state: str = ""
    exit_state: str = ""
    environment_state: str = ""
    props_state: Dict[str, str] = field(default_factory=dict)
    character_state: Dict[str, str] = field(default_factory=dict)
    camera_strategy: str = ""
    audio_strategy: str = ""


@dataclass
class ShotPlanItem(Serializable):
    shot_id: str
    scene_id: str
    shot_type: str
    framing: str
    lens: str
    camera_motion: str
    subject_motion: str
    key_action: str
    start_pose: str
    end_pose: str
    continuity_locks: List[str] = field(default_factory=list)
    must_show: List[str] = field(default_factory=list)
    must_not_change: List[str] = field(default_factory=list)
    duration: int = 4
    transition_intent: str = ""
    priority: str = "standard"


@dataclass
class ReferenceAsset(Serializable):
    id: str
    type: str
    role: str
    description: str = ""


@dataclass
class RenderManifest(Serializable):
    provider: str
    model: str
    resolution: str
    duration: int
    fps: Optional[int]
    reference_assets: List[ReferenceAsset] = field(default_factory=list)
    character_reference_ids: List[str] = field(default_factory=list)
    extension_chain: List[str] = field(default_factory=list)
    edit_chain: List[str] = field(default_factory=list)
    retry_count: int = 0
    qc_thresholds: Dict[str, str] = field(default_factory=dict)
    shot_id: Optional[str] = None
    operation: str = "text_to_video"


@dataclass
class PromptPackage(Serializable):
    subject: str
    setting: str
    action: str
    camera: str
    lighting: str
    style: str
    continuity_locks: List[str] = field(default_factory=list)
    negative_constraints: List[str] = field(default_factory=list)
    output_intent: str = ""
    final_prompt: str = ""


@dataclass
class ContinuityIssue(Serializable):
    code: str
    severity: str
    message: str
    recommended_fix: str


@dataclass
class ContinuityReport(Serializable):
    status: str
    checked_locks: List[str] = field(default_factory=list)
    issues: List[ContinuityIssue] = field(default_factory=list)
    state_snapshot: Dict[str, Any] = field(default_factory=dict)


@dataclass
class QCCategoryResult(Serializable):
    status: str
    notes: str


@dataclass
class QCReport(Serializable):
    shot_id: str
    overall: str
    categories: Dict[str, QCCategoryResult] = field(default_factory=dict)
    recommended_action: str = ""


@dataclass
class RetryDecision(Serializable):
    action: str
    reason: str
    prompt_adjustments: List[str] = field(default_factory=list)
    manifest_adjustments: Dict[str, Any] = field(default_factory=dict)
    next_operation: str = "rerender"


@dataclass
class RenderResult(Serializable):
    status: str
    provider: str
    model: str
    prompt_used: str
    asset_ids: List[str] = field(default_factory=list)
    video_path_or_url: str = ""
    qc_ready_metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProviderCapabilities(Serializable):
    name: str
    models: List[str] = field(default_factory=list)
    supports_text_to_video: bool = True
    supports_image_to_video: bool = True
    supports_character_reference_reuse: bool = True
    supports_video_extension: bool = True
    supports_targeted_edit: bool = False
    supports_audio_conditioning: bool = False
