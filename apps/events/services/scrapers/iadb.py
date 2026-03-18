"""Scraper for IDB (Inter-American Development Bank) events.

Uses the internal EmmaWebApi JSON API:
  - Listing:  GET /EmmaWebApi/v10a/events/en/all?startDate=...&endDate=...&pageSize=100
  - Detail:   GET /EmmaWebApi/v10a/events/en/{eventId}

Each list item provides: id, name, startDate, endDate, country, imageUrl.
The detail endpoint adds: timezone, venueLocation, description, registrationLink,
eventType, classifications.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import dateparser
from bs4 import BeautifulSoup

from .base import BaseScraper

logger = logging.getLogger(__name__)

_API_BASE = "https://events.iadb.org/EmmaWebApi/v10a"
_CALENDAR_URL = "https://events.iadb.org/calendar/event"


class IadbScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__("iadb")
        self.session.headers.update({"Accept": "application/json"})

    # ── list ──────────────────────────────────────────────────────────

    def parse_list(self) -> list[dict[str, Any]]:
        url = f"{_API_BASE}/events/en/all"
        params = {
            "startDate": "2026-01-01",
            "endDate": "2026-12-31",
            "pageSize": "100",
        }

        logger.info("Fetching IDB events list: %s", url)
        resp = self.session.get(url, params=params, timeout=30)
        resp.raise_for_status()
        items: list[dict] = resp.json()

        events: list[dict[str, Any]] = []
        for item in items:
            try:
                parsed = self._parse_item(item)
                if parsed:
                    events.append(parsed)
            except Exception:
                logger.exception("Error parsing IDB item id=%s", item.get("id"))
        return events

    # ── parse one list item + fetch detail ────────────────────────────

    def _parse_item(self, item: dict) -> dict[str, Any] | None:
        event_id = item.get("id")
        name = (item.get("name") or "").strip()
        if not event_id or not name:
            return None

        source_url = f"{_CALENDAR_URL}/{event_id}?lang=en"
        start_at = self._parse_dt(item.get("startDate"))
        end_at = self._parse_dt(item.get("endDate"))
        image_url = item.get("imageUrl") or ""

        detail = self._fetch_detail(event_id)

        description = ""
        location_text = ""
        tz = "UTC"
        registration_url = ""
        tags: list[str] = ["IDB"]
        modality = None

        if detail:
            raw_desc = detail.get("description") or ""
            if raw_desc:
                description = BeautifulSoup(raw_desc, "lxml").get_text(separator=" ", strip=True)

            tz = detail.get("timezone") or "UTC"

            venue = detail.get("venueLocation") or {}
            location_text = self._build_location(venue)

            registration_url = detail.get("registrationLink") or ""

            event_type = detail.get("eventType") or {}
            if event_type.get("name"):
                tags.append(event_type["name"])

            for cls in detail.get("classifications") or []:
                cls_name = cls.get("name") or cls.get("code") or ""
                if cls_name:
                    tags.append(cls_name)

            if detail.get("imageUrl"):
                image_url = image_url or detail["imageUrl"]

        if location_text:
            loc_lower = location_text.lower()
            if "virtual" in loc_lower or "online" in loc_lower:
                modality = "virtual"
            elif any(k in name.lower() for k in ("hybrid", "híbrido")):
                modality = "hybrid"
            else:
                modality = "presencial"

        return {
            "source_url": source_url,
            "external_id": str(event_id),
            "title": name[:500],
            "summary": description[:500] if description else "",
            "description": description,
            "start_at": start_at,
            "end_at": end_at,
            "timezone": tz,
            "location_text": location_text[:255],
            "organizer": "IDB",
            "image_url": image_url,
            "modality": modality,
            "language": "en",
            "registration_url": registration_url,
            "tags_raw": tags,
            "raw_data": {"api_id": event_id},
        }

    # ── helpers ───────────────────────────────────────────────────────

    def _fetch_detail(self, event_id: int) -> dict | None:
        url = f"{_API_BASE}/events/en/{event_id}"
        try:
            resp = self.session.get(url, timeout=20)
            if resp.status_code == 200:
                return resp.json()
        except Exception:
            logger.warning("Could not fetch IDB detail for id=%s", event_id)
        return None

    @staticmethod
    def _parse_dt(value: str | None) -> datetime | None:
        if not value:
            return None
        return dateparser.parse(value)

    @staticmethod
    def _build_location(venue: dict) -> str:
        v = venue.get("venue") or {}
        parts: list[str] = []
        if v.get("name"):
            parts.append(v["name"])
        city = v.get("city") or {}
        if city.get("name"):
            parts.append(city["name"])
        country = city.get("country") or {}
        if country.get("name"):
            parts.append(country["name"])
        return ", ".join(parts)
