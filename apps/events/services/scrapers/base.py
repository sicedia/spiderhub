"""Abstract base class for all event scrapers."""

from __future__ import annotations

import abc
import logging
from typing import Any

import requests
from bs4 import BeautifulSoup
from django.utils import timezone

from apps.events.models import Event, EventSource
from apps.events.services.classification import (
    classify_event,
    is_relevant_for_spider,
    score_networking,
)

logger = logging.getLogger(__name__)

_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
}

REQUEST_TIMEOUT = 30


class BaseScraper(abc.ABC):
    """Skeleton every concrete scraper must follow."""

    def __init__(self, source_slug: str) -> None:
        self.source: EventSource = EventSource.objects.get(slug=source_slug)
        self.session = requests.Session()
        self.session.headers.update(_DEFAULT_HEADERS)

    # ── helpers ──────────────────────────────────────────────────────

    def fetch(self, url: str) -> BeautifulSoup:
        """GET *url* and return a parsed BeautifulSoup tree."""
        logger.info("Fetching %s", url)
        resp = self.session.get(url, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")

    # ── abstract ─────────────────────────────────────────────────────

    @abc.abstractmethod
    def parse_list(self) -> list[dict[str, Any]]:
        """Return a list of raw event dicts scraped from the source."""

    # ── pipeline ─────────────────────────────────────────────────────

    def normalize(self, raw: dict[str, Any]) -> dict[str, Any]:
        """Apply classification, scoring, and relevance; return dict ready for upsert."""
        raw.setdefault("category", classify_event(raw))
        raw.setdefault("networking_score", score_networking(raw))
        raw.setdefault("is_relevant", is_relevant_for_spider(raw))
        raw.setdefault("is_published", True)
        raw.setdefault("status", "published")
        return raw

    def upsert(self, data: dict[str, Any]) -> tuple[Event, bool]:
        """Insert or update an Event by *source_url*. Returns (event, created)."""
        source_url = data.pop("source_url")
        data["last_seen_at"] = timezone.now()
        data["source"] = self.source

        event, created = Event.objects.update_or_create(
            source_url=source_url,
            defaults=data,
        )
        return event, created

    def _is_eligible(self, data: dict[str, Any]) -> bool:
        """Only keep events in 2026 whose start_at >= now."""
        start = data.get("start_at")
        if start is None:
            return False
        now = timezone.now()
        if hasattr(start, "year"):
            if start.year != 2026:
                return False
            if timezone.is_naive(start):
                start = timezone.make_aware(start)
            return start >= now
        return False

    def run(self) -> dict[str, int]:
        """Orchestrate: parse → skip existing → normalize → filter → insert new only.
        Events already in DB (by source_url) are not re-ingested or updated."""
        logger.info("Starting scraper for source '%s'", self.source.slug)
        raw_items = self.parse_list()
        stats: dict[str, int] = {
            "found": len(raw_items),
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "existing": 0,
        }

        for raw in raw_items:
            try:
                source_url = raw.get("source_url")
                if not source_url:
                    continue
                # Do not re-ingest: skip if we already have this event
                if Event.objects.filter(source=self.source, source_url=source_url).exists():
                    stats["existing"] += 1
                    continue

                data = self.normalize(raw)
                if not self._is_eligible(data):
                    stats["skipped"] += 1
                    continue
                _event, created = self.upsert(data)
                stats["created" if created else "updated"] += 1
            except Exception:
                logger.exception("Error upserting event: %s", raw.get("source_url", "?"))

        logger.info(
            "Scraper '%s' done — found=%d created=%d updated=%d skipped=%d existing=%d",
            self.source.slug,
            stats["found"],
            stats["created"],
            stats["updated"],
            stats["skipped"],
            stats["existing"],
        )
        return stats
