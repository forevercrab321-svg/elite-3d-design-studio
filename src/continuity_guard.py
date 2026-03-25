from __future__ import annotations

from typing import Any, Dict, Optional

from schema import ContinuityIssue, ContinuityReport, ShotPlanItem
from utils import unique_preserve_order


def run_continuity_check(
    previous_shot: Optional[ShotPlanItem],
    current_shot: ShotPlanItem,
    previous_state: Optional[Dict[str, Any]] = None,
) -> ContinuityReport:
    previous_state = previous_state or {}
    checked_locks = unique_preserve_order((previous_shot.continuity_locks if previous_shot else []) + current_shot.continuity_locks)
    issues = []

    if previous_shot:
        if "right hand" in previous_shot.end_pose.lower() and "left hand" in current_shot.start_pose.lower():
            issues.append(
                ContinuityIssue(
                    code="HANDEDNESS_SWAP",
                    severity="HARD_FAIL",
                    message="Detected a right-hand to left-hand switch across the cut without explicit motivation.",
                    recommended_fix="Restate prop ownership, show the transfer, or keep the prop in the original hand.",
                )
            )
        if "door open" in previous_shot.end_pose.lower() and "door closed" in current_shot.start_pose.lower():
            issues.append(
                ContinuityIssue(
                    code="DOOR_RESET",
                    severity="HARD_FAIL",
                    message="Door state resets across a contiguous cut.",
                    recommended_fix="Use extension mode, show the close action, or motivate a time cut.",
                )
            )
        if previous_shot.scene_id == current_shot.scene_id and previous_shot.transition_intent == "match cut" and current_shot.camera_motion == "static":
            issues.append(
                ContinuityIssue(
                    code="CAMERA_ENERGY_DROP",
                    severity="SOFT_FAIL",
                    message="Camera energy drops unexpectedly after a match-cut intent.",
                    recommended_fix="Preserve movement character or motivate the static reset.",
                )
            )

    state_snapshot = {
        "shot_id": current_shot.shot_id,
        "scene_id": current_shot.scene_id,
        "end_pose": current_shot.end_pose,
        "must_show": current_shot.must_show,
        "continuity_locks": current_shot.continuity_locks,
        **previous_state,
    }

    status = "PASS"
    if any(issue.severity == "HARD_FAIL" for issue in issues):
        status = "HARD_FAIL"
    elif issues:
        status = "SOFT_FAIL"

    return ContinuityReport(
        status=status,
        checked_locks=checked_locks,
        issues=issues,
        state_snapshot=state_snapshot,
    )
