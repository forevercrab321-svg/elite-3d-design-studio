from __future__ import annotations

from typing import Dict, List

from schema import QCReport, RenderManifest, RetryDecision, ShotPlanItem


def decide_retry_strategy(qc_report: QCReport, manifest: RenderManifest, shot: ShotPlanItem) -> RetryDecision:
    if qc_report.overall == "PASS":
        return RetryDecision(
            action="approve",
            reason="QC passed all required thresholds.",
            prompt_adjustments=[],
            manifest_adjustments={},
            next_operation="complete",
        )

    failed = {name: result.status for name, result in qc_report.categories.items() if result.status != "PASS"}
    adjustments: List[str] = []
    manifest_adjustments: Dict[str, object] = {"retry_count": manifest.retry_count + 1}
    action = "targeted_edit"
    reason = "Diagnosed repairable QC issues."
    next_operation = "edit"

    if "identity_consistency" in failed:
        adjustments.extend([
            "Front-load face identity description in the subject layer",
            "Increase salience of character reference reuse",
            "Reduce competing background motion",
            "Tighten framing around the face and action-critical gesture",
        ])
        manifest_adjustments["model"] = "sora-2-pro"
        action = "strict_rerender"
        reason = "Face drift requires stronger identity control."
        next_operation = "rerender"

    if "object_continuity" in failed or "scene_transition_logic" in failed:
        adjustments.extend([
            "Restate prop ownership and end-state continuity locks explicitly",
            "Prefer extension or targeted edit instead of full reset",
            "Show the continuity-critical object earlier in the clip",
        ])

    if "action_completion" in failed:
        adjustments.extend([
            "Foreground the missing action in the first half of the clip",
            "Shorten shot duration to reduce action dilution",
            "Reduce secondary motion competing with the key beat",
        ])
        manifest_adjustments["duration"] = max(2, shot.duration - 1)

    if "camera_adherence" in failed or "framing_correctness" in failed:
        adjustments.extend([
            "Rewrite camera layer with exact framing and motion language",
            "Remove ambiguous style phrases that compete with shot geometry",
        ])

    if "motion_stability" in failed or "anatomy_sanity" in failed:
        adjustments.extend([
            "Reduce motion complexity",
            "Use cleaner staging with fewer articulated limb interactions",
        ])

    if qc_report.overall == "HARD_FAIL" and action != "strict_rerender":
        action = "strict_rerender"
        reason = "Blocking QC failure requires prompt tightening and rerender."
        next_operation = "rerender"
        manifest_adjustments["model"] = manifest.model if manifest.model == "sora-2-pro" else "sora-2-pro"

    return RetryDecision(
        action=action,
        reason=reason,
        prompt_adjustments=adjustments,
        manifest_adjustments=manifest_adjustments,
        next_operation=next_operation,
    )
