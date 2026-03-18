"""Keyword-based classification and networking score for events."""

from __future__ import annotations

import re
from typing import Any

# ── Category rules ───────────────────────────────────────────────────
# Each tuple: (category_slug, keywords).  First match wins.

_CATEGORY_RULES: list[tuple[str, list[str]]] = [
    (
        "digital_transformation",
        [
            "digital", "govtech", "\\bai\\b", "artificial intelligence",
            "datos", "data", "conectividad", "connectivity",
            "ciberseguridad", "cybersecurity", "\\btic\\b", "\\bict\\b",
            "technology", "tecnología", "e-government", "smart city",
        ],
    ),
    (
        "innovation",
        ["innovation", "innovación", "startup", "accelerator", "innovation lab"],
    ),
    (
        "environment_climate",
        [
            "climate", "clima", "green", "biodiversity", "biodiversidad",
            "adaptation", "adaptación", "carbon", "carbono",
            "environment", "medio ambiente", "sustainability", "sostenibilidad",
        ],
    ),
    (
        "financing_development",
        [
            "finance", "finanzas", "development bank", "banco de desarrollo",
            "investment", "inversión", "funding", "financiamiento",
        ],
    ),
    (
        "governance_public_policy",
        [
            "governance", "gobernanza", "public policy", "política pública",
            "ministerial", "government", "gobierno", "regulation", "regulación",
        ],
    ),
]

# Pre-compile a single pattern per category for speed
_COMPILED_RULES: list[tuple[str, re.Pattern[str]]] = [
    (cat, re.compile("|".join(kws), re.IGNORECASE))
    for cat, kws in _CATEGORY_RULES
]


def _build_text_blob(data: dict[str, Any]) -> str:
    """Concatenate searchable fields into a single lowercase blob."""
    parts = [
        str(data.get("title", "")),
        str(data.get("summary", "")),
        str(data.get("description", "")),
    ]
    tags = data.get("tags_raw") or []
    if isinstance(tags, list):
        parts.extend(str(t) for t in tags)
    return " ".join(parts).lower()


def classify_event(data: dict[str, Any]) -> str:
    """Return the first matching category slug, or ``'other'``."""
    blob = _build_text_blob(data)
    for cat, pattern in _COMPILED_RULES:
        if pattern.search(blob):
            return cat
    return "other"


# ── Networking score ─────────────────────────────────────────────────

_HIGH_VALUE_EVENTS = re.compile(
    r"summit|forum|dialogue|roundtable|ministerial|conference",
    re.IGNORECASE,
)
_ENGAGEMENT_KEYWORDS = re.compile(
    r"registration|partners|partnership",
    re.IGNORECASE,
)
_PREMIUM_ORGANIZERS = re.compile(
    r"\b(OAS|OEA|ITU|UIT|CAF|CEPAL|ECLAC|IDB|BID)\b",
    re.IGNORECASE,
)


def score_networking(data: dict[str, Any]) -> int:
    """Return a 0–100 networking score based on heuristic rules."""
    score = 0

    modality = str(data.get("modality", "")).lower()
    if modality == "presencial":
        score += 25
    elif modality == "hybrid":
        score += 15

    blob = _build_text_blob(data)
    if _HIGH_VALUE_EVENTS.search(blob):
        score += 20
    if _ENGAGEMENT_KEYWORDS.search(blob):
        score += 10

    organizer = str(data.get("organizer", ""))
    if _PREMIUM_ORGANIZERS.search(organizer):
        score += 10

    return min(score, 100)
