"""Scraper for EU-CELAC Platform events.

List: https://www.eucelac-platform.eu/events
Each item is a Drupal card (div.card.mb-5) with:
  - Title/link: b > a[href^="/news-and-events/events/"]
  - Dates: .date-display-start / .date-display-end / .date-display-single (content=ISO datetime)
  - Venue badge: .card-text small (e.g. Online, city name)
  - Image: .card-image img[src]
Pagination: /events then /events?page=1 … until no cards.
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urljoin

from django.utils.dateparse import parse_datetime

from .base import BaseScraper

logger = logging.getLogger(__name__)

_MAX_PAGES = 20


class EucelacScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__("eucelac")

    def parse_list(self) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        base = self.source.base_url.rstrip("/")
        seen_urls: set[str] = set()

        for page in range(_MAX_PAGES):
            url = f"{base}/events" if page == 0 else f"{base}/events?page={page}"
            try:
                soup = self.fetch(url)
            except Exception:
                logger.exception("Failed to fetch EU-CELAC page %s", url)
                break

            cards = soup.select("div.card.mb-5")
            if not cards:
                break

            for card in cards:
                try:
                    ev = self._parse_card(card, base)
                    if ev and ev["source_url"] not in seen_urls:
                        seen_urls.add(ev["source_url"])
                        events.append(ev)
                except Exception:
                    logger.exception("Error parsing EU-CELAC card")

        return events

    def _parse_card(self, card, base: str) -> dict[str, Any] | None:
        link = card.select_one("b a[href], .card-text a[href]")
        if not link:
            return None
        href = link.get("href", "")
        if "/news-and-events/events/" not in href:
            return None
        if not href.startswith("http"):
            href = urljoin(base + "/", href.lstrip("/"))

        title = link.get_text(strip=True)
        if not title:
            return None

        start_el = card.select_one(".date-display-start[content]")
        end_el = card.select_one(".date-display-end[content]")
        single_el = card.select_one(".date-display-single[content]")

        start_at = None
        end_at = None
        if start_el and start_el.get("content"):
            start_at = parse_datetime(start_el["content"])
        if end_el and end_el.get("content"):
            end_at = parse_datetime(end_el["content"])
        if single_el and single_el.get("content"):
            start_at = parse_datetime(single_el["content"])

        badge = card.select_one(".card-text small")
        location = badge.get_text(strip=True) if badge else ""

        image_url = ""
        img = card.select_one(".card-image img[src], img.adaptive-image")
        if img:
            src = img.get("src", "")
            if src:
                image_url = src if src.startswith("http") else urljoin(base + "/", src.lstrip("/"))

        modality = "virtual" if location.lower() == "online" else "presencial"
        if "hybrid" in title.lower() or "híbrido" in title.lower():
            modality = "hybrid"

        return {
            "source_url": href,
            "external_id": "",
            "title": title[:500],
            "summary": "",
            "start_at": start_at,
            "end_at": end_at,
            "location_text": location[:255] if location else "",
            "organizer": "EU-CELAC",
            "image_url": image_url,
            "modality": modality,
            "language": "en",
            "tags_raw": ["EU-CELAC", "EU-LAC", "Research infrastructures"],
            "raw_data": {"page_path": href},
        }
