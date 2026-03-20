"""
Deployment / static bundle identity (BUILD_ID).

Used for cache invalidation signals and API version checks. No Django models;
safe to import from settings without circular imports.
"""
from __future__ import annotations

import hashlib
import os
from pathlib import Path


def compute_build_id(static_root) -> str:
    """
    Prefer explicit BUILD_ID from the environment, then a digest of
    staticfiles.json (Django manifest after collectstatic), then git hash.

    The manifest digest changes whenever any hashed static file set changes,
    even if GIT_COMMIT_HASH is unchanged.
    """
    env_id = os.environ.get("BUILD_ID", "").strip()
    if env_id:
        return env_id[:64]

    root = Path(static_root)
    manifest = root / "staticfiles.json"
    if manifest.is_file():
        digest = hashlib.md5(manifest.read_bytes()).hexdigest()
        return digest[:16]

    git = os.environ.get("GIT_COMMIT_HASH", "").strip()
    if git:
        return git[:12]

    return "unknown"
