"""Scraper for IDB (Inter-American Development Bank) events.

Uses the internal EmmaWebApi JSON API:
  - Listing:  GET {base}/EmmaWebApi/v10a/events/en/all?startDate=...&endDate=...&pageSize=100
  - Detail:   GET {base}/EmmaWebApi/v10a/events/en/{eventId}

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

_API_PATH = "/EmmaWebApi/v10a"
_CALENDAR_PATH = "/calendar/event"


class IadbScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__("iadb")
        self.session.headers.update({"Accept": "application/json"})
        base = self.source.base_url.rstrip("/")
        self._api_base = f"{base}{_API_PATH}"
        self._calendar_base = f"{base}{_CALENDAR_PATH}"

    # ── list ──────────────────────────────────────────────────────────

    def parse_list(self) -> list[dict[str, Any]]:
        url = f"{self._api_base}/events/en/all"
        params = {
            "startDate": "2026-01-01",
            "endDate": "2026-12-31",
            "pageSize": "100",
        }

        logger.info("Fetching IDB events list: %s", url)
        resp = self.session.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        if not isinstance(data, list):
            logger.error("IDB API returned unexpected type: %s", type(data).__name__)
            return []

        events: list[dict[str, Any]] = []
        for item in data:
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

        source_url = f"{self._calendar_base}/{event_id}?lang=en"
        start_at = self._parse_dt(item.get("startDate"))
        end_at = self._parse_dt(item.get("endDate"))
        image_url = item.get("imageUrl") or ""
        country_name = item.get("country") or ""

        detail = self._fetch_detail(event_id)

        description = ""
        location_text = ""
        tz = "UTC"
        registration_url = ""
        tags: set[str] = {"IDB"}
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
                tags.add(event_type["name"])

            for cls in detail.get("classifications") or []:
                cls_name = cls.get("name") or cls.get("code") or ""
                if cls_name:
                    tags.add(cls_name)

            if detail.get("imageUrl"):
                image_url = image_url or detail["imageUrl"]

        # Modality: check location text first, then list-level country
        loc_check = (location_text or country_name).lower()
        if "virtual" in loc_check or "online" in loc_check:
            modality = "virtual"
        elif any(k in name.lower() for k in ("hybrid", "híbrido")):
            modality = "hybrid"
        elif loc_check:
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
            "image_url": image_url[:500],
            "modality": modality,
            "language": "en",
            "registration_url": registration_url[:500],
            "tags_raw": sorted(tags),
            "raw_data": {"api_id": event_id},
        }

    # ── helpers ───────────────────────────────────────────────────────

    def _fetch_detail(self, event_id: int) -> dict | None:
        url = f"{self._api_base}/events/en/{event_id}"
        try:
            resp = self.session.get(url, timeout=20)
            if resp.status_code == 200:
                return resp.json()
            logger.warning("IDB detail returned %d for id=%s", resp.status_code, event_id)
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
