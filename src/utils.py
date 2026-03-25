from __future__ import annotations

import json
import re
from typing import Any, Dict, Iterable, List, Sequence


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
    return cleaned.strip("-") or "untitled"


def ensure_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def unique_preserve_order(values: Iterable[Any]) -> List[Any]:
    seen = set()
    ordered: List[Any] = []
    for value in values:
        marker = json.dumps(value, sort_keys=True) if isinstance(value, dict) else value
        if marker in seen:
            continue
        seen.add(marker)
        ordered.append(value)
    return ordered


def pick_first_non_empty(*values: Any, default: Any = "") -> Any:
    for value in values:
        if value not in (None, "", [], {}, ()):
            return value
    return default


def sentence_case(value: str) -> str:
    value = (value or "").strip()
    return value[:1].upper() + value[1:] if value else value


def normalize_duration(raw: Any, default: int = 8) -> int:
    try:
        duration = int(raw)
    except (TypeError, ValueError):
        return default
    return max(1, duration)


def safe_get(data: Dict[str, Any], path: Sequence[str], default: Any = None) -> Any:
    current: Any = data
    for key in path:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current


def json_dumps_pretty(value: Any) -> str:
    return json.dumps(value, indent=2, ensure_ascii=False)


def infer_pacing(duration: int) -> str:
    if duration <= 6:
        return "controlled"
    if duration <= 20:
        return "measured"
    return "deliberate"


def infer_resolution(aspect_ratio: str) -> str:
    mapping = {
        "16:9": "1920x1080",
        "9:16": "1080x1920",
        "1:1": "1080x1080",
        "2.39:1": "2048x858",
    }
    return mapping.get(aspect_ratio, "1920x1080")


def shot_priority(shot_type: str) -> str:
    normalized = (shot_type or "").lower()
    if any(token in normalized for token in ("close", "hero", "insert")):
        return "hero"
    if any(token in normalized for token in ("wide", "master")):
        return "coverage"
    return "standard"
