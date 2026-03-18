"""Scraper for OAS (Organization of American States) events.

Source page: https://www.oas.org/ext/en/main/oas/events
HTML structure per card:
  <a href="/ext/en/main/calendar/event?id=XXXX">
    <div class="headerimg_h"><img .../></div>
    <div class="subtitle">EVENT TITLE</div>
    <div class="body event-summary">SUMMARY TEXT</div>
    <div class="meta ...">
      <div>Sep 2, 2026 - Sep 4, 2026</div>
      <div>VENUE</div>
      <div>COUNTRY / LOCATION</div>
    </div>
  </a>
Pagination via ?page=N.
"""

from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import urljoin

import dateparser

from .base import BaseScraper

logger = logging.getLogger(__name__)

_MAX_PAGES = 5


class OasScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__("oas")

    def parse_list(self) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        base = self.source.events_url

        for page_num in range(1, _MAX_PAGES + 1):
            url = f"{base}?page={page_num}" if page_num > 1 else base
            try:
                soup = self.fetch(url)
            except Exception:
                logger.exception("Failed to fetch OAS page %d", page_num)
                break

            cards = soup.select('a[href*="/calendar/event"]')
            if not cards:
                break

            for card in cards:
                try:
                    ev = self._parse_card(card)
                    if ev:
                        events.append(ev)
                except Exception:
                    logger.exception("Error parsing OAS card")

            if not soup.select_one(f'a[href*="page={page_num + 1}"]'):
                break

        return events

    def _parse_card(self, card) -> dict[str, Any] | None:
        href = card.get("href", "")
        if not href:
            return None

        source_url = urljoin(self.source.base_url, href)
        event_id = ""
        id_match = re.search(r"id=(\d+)", href)
        if id_match:
            event_id = id_match.group(1)

        # Image from <div class="headerimg_h"><img src="..."/>
        image_url = ""
        img_el = card.select_one("img")
        if img_el:
            img_src = img_el.get("src", "")
            if img_src:
                image_url = urljoin(self.source.base_url, img_src)

        # Title lives in <div class="subtitle">
        title_el = card.select_one("div.subtitle")
        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            return None

        # Summary in <div class="body"> or <div class="event-summary">
        summary_el = card.select_one("div.body, div.event-summary")
        summary = summary_el.get_text(strip=True) if summary_el else ""

        # Dates and location in <div class="meta"> child divs
        start_at, end_at, location = None, None, ""
        meta = card.select_one("div.meta, div[class*='meta']")
        if meta:
            divs = meta.select("div")
            for div in divs:
                text = div.get_text(strip=True)
                if not text:
                    continue
                if not start_at and re.search(r"[A-Z][a-z]{2,8}\s+\d", text):
                    start_at, end_at = self._parse_date_range(text)
                elif not location and text:
                    location = text

        return {
            "source_url": source_url,
            "external_id": event_id,
            "title": title[:500],
            "summary": summary[:2000],
            "start_at": start_at,
            "end_at": end_at,
            "location_text": location[:255],
            "organizer": "OAS",
            "image_url": image_url,
            "modality": self._guess_modality(title, summary, location),
            "language": "en",
            "tags_raw": ["OAS", "Americas"],
            "raw_data": {"href": href},
        }

    @staticmethod
    def _parse_date_range(text: str):
        range_match = re.search(
            r"([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})\s*[-–]\s*"
            r"([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})",
            text,
        )
        if range_match:
            start = dateparser.parse(range_match.group(1))
            end = dateparser.parse(range_match.group(2))
            return start, end

        single = re.search(r"([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})", text)
        if single:
            return dateparser.parse(single.group(1)), None

        return None, None

    @staticmethod
    def _guess_modality(title: str, summary: str, location: str) -> str:
        blob = f"{title} {summary} {location}".lower()
        if "virtual" in blob or "online" in blob or "webinar" in blob:
            return "virtual"
        if "hybrid" in blob:
            return "hybrid"
        return "presencial"
