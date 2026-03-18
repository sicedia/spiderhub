"""Scraper for IDRC (International Development Research Centre) events.

Source page: https://idrc-crdi.ca/es/eventos
HTML structure per card:
  <a class="card card-variant--link-card ...">
    <div class="card-image-container">
      <img data-src="/sites/default/files/styles/card/..." src="..." />
    </div>
    <div class="card-body">
      <div class="field--name-field-event-time-and-date">
        <time datetime="2026-03-20T09:00:00-05:00">...</time>
        - <time datetime="2026-03-20T12:30:00-05:00">...</time>
      </div>
      <div class="card-text">TITLE</div>
    </div>
  </a>
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urljoin

import dateparser

from .base import BaseScraper

logger = logging.getLogger(__name__)


class IdrcScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__("idrc")

    def parse_list(self) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []

        try:
            soup = self.fetch(self.source.events_url)
        except Exception:
            logger.exception("Failed to fetch IDRC events page")
            return events

        cards = soup.select("a.card")
        for card in cards:
            try:
                ev = self._parse_card(card)
                if ev:
                    events.append(ev)
            except Exception:
                logger.exception("Error parsing IDRC card")

        return events

    def _parse_card(self, card) -> dict[str, Any] | None:
        href = card.get("href", "")
        if not href or "/eventos/" not in href:
            return None

        source_url = href if href.startswith("http") else urljoin(self.source.base_url, href)

        # Title
        title_el = card.select_one("div.card-text")
        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            return None

        # Dates from <time datetime="..."> elements
        start_at, end_at = None, None
        time_els = card.select("time[datetime]")
        if time_els:
            start_at = dateparser.parse(time_els[0]["datetime"])
            if len(time_els) > 1:
                end_at = dateparser.parse(time_els[-1]["datetime"])

        # Image (prefer data-src for full size, fallback to src)
        image_url = ""
        img_el = card.select_one("div.card-image-container img")
        if img_el:
            img_src = img_el.get("data-src") or img_el.get("src", "")
            if img_src:
                image_url = urljoin(self.source.base_url, img_src)

        return {
            "source_url": source_url,
            "external_id": "",
            "title": title[:500],
            "summary": "",
            "start_at": start_at,
            "end_at": end_at,
            "location_text": "",
            "organizer": "IDRC",
            "image_url": image_url,
            "modality": self._guess_modality(title),
            "language": "es",
            "tags_raw": ["IDRC", "Research", "Development"],
            "raw_data": {"href": href},
        }

    @staticmethod
    def _guess_modality(title: str) -> str:
        blob = title.lower()
        if "virtual" in blob or "online" in blob or "webinar" in blob:
            return "virtual"
        if "hybrid" in blob or "híbrido" in blob:
            return "hybrid"
        return "presencial"
