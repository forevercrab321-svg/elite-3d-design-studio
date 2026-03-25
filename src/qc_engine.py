from __future__ import annotations

from typing import Dict, Optional

from schema import ContinuityReport, QCCategoryResult, QCReport, RenderResult, ShotPlanItem


QC_CATEGORIES = [
    "identity_consistency",
    "costume_consistency",
    "object_continuity",
    "action_completion",
    "camera_adherence",
    "framing_correctness",
    "motion_stability",
    "anatomy_sanity",
    "prompt_adherence",
    "emotional_tone_match",
    "scene_transition_logic",
]


def run_qc(
    render_result: RenderResult,
    shot: ShotPlanItem,
    continuity_report: Optional[ContinuityReport] = None,
) -> QCReport:
    metadata = render_result.qc_ready_metadata or {}
    simulated_findings: Dict[str, str] = metadata.get("simulated_findings", {})
    categories: Dict[str, QCCategoryResult] = {}

    for category in QC_CATEGORIES:
        status = simulated_findings.get(category, "PASS")
        notes = _default_note(category, status, shot)
        categories[category] = QCCategoryResult(status=status, notes=notes)

    if continuity_report:
        if continuity_report.status == "HARD_FAIL":
            categories["object_continuity"] = QCCategoryResult(
                status="HARD_FAIL",
                notes="Continuity guard detected a blocking continuity break.",
            )
            categories["scene_transition_logic"] = QCCategoryResult(
                status="HARD_FAIL",
                notes="Scene transition logic broke across adjacent shots.",
            )
        elif continuity_report.status == "SOFT_FAIL":
            categories["scene_transition_logic"] = QCCategoryResult(
                status="SOFT_FAIL",
                notes="Continuity guard found repairable transition drift.",
            )

    overall = _overall_status(categories)
    recommended_action = _recommended_action(overall, categories)

    return QCReport(
        shot_id=shot.shot_id,
        overall=overall,
        categories=categories,
        recommended_action=recommended_action,
    )


def _overall_status(categories: Dict[str, QCCategoryResult]) -> str:
    statuses = [result.status for result in categories.values()]
    if "HARD_FAIL" in statuses:
        return "HARD_FAIL"
    if "SOFT_FAIL" in statuses:
        return "SOFT_FAIL"
    return "PASS"


def _recommended_action(overall: str, categories: Dict[str, QCCategoryResult]) -> str:
    if overall == "PASS":
        return "Approve shot or use as continuity anchor for extension"
    if overall == "SOFT_FAIL":
        return "Attempt local repair or short rerender with tighter shot constraints"
    if categories["identity_consistency"].status == "HARD_FAIL":
        return "Escalate to hero model with stronger face references and stricter identity locks"
    return "Rewrite prompt with stricter continuity and action constraints before rerender"


def _default_note(category: str, status: str, shot: ShotPlanItem) -> str:
    if status == "PASS":
        if category == "action_completion":
            return f"Shot preserves the planned action beat: {shot.key_action}."
        if category == "camera_adherence":
            return f"Camera instruction remains aligned with {shot.camera_motion}."
        return "No blocking issue detected by the current automated QC layer."
    if status == "SOFT_FAIL":
        return "Minor drift detected; local repair is preferred over full rerender."
    return "Blocking issue detected; prompt or render strategy must be tightened before retry."
