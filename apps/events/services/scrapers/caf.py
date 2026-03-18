"""Scraper for CAF (Development Bank of Latin America and the Caribbean) events.

Source: https://www.caf.com/es/actualidad/eventos/
HTML structure:
  <article class="card">
    <a href="/es/actualidad/eventos/SLUG/"><img .../></a>
    <h3 class="card__title ..."><a ...>TITLE</a></h3>
    <p class="p-body-m ...">29 abril 2026 - 30 abril 2026</p>
    <p class="p-body-m ...">Presencial</p>
    <a href="...">Inscríbete al evento</a>
    <a href="/es/paises/colombia/">Colombia</a>
    <a href="?taxonomy=TAG">TAG</a>
  </article>

Note: caf.com has SSL issues from some environments, so we use verify=False.
"""

from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import urljoin

import dateparser

from .base import BaseScraper

logger = logging.getLogger(__name__)


class CafScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__("caf")
        self.session.verify = False

        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    def parse_list(self) -> list[dict[str, Any]]:
        soup = self.fetch(self.source.events_url)
        events: list[dict[str, Any]] = []

        cards = soup.select("article.card")
        if not cards:
            cards = soup.select("article")
        logger.info("CAF: found %d article cards", len(cards))

        for card in cards:
            try:
                ev = self._parse_card(card)
                if ev:
                    events.append(ev)
            except Exception:
                logger.exception("Error parsing CAF card")

        return events

    def _parse_card(self, card) -> dict[str, Any] | None:
        # Title in <h3 class="card__title"><a>TEXT</a></h3>
        h3 = card.select_one("h3")
        if not h3:
            return None
        title = h3.get_text(strip=True)
        if not title:
            return None

        source_url = self._extract_link(card)
        start_at, end_at = self._extract_dates(card)
        modality = self._extract_modality(card)
        tags = self._extract_tags(card)
        country = self._extract_country(card)
        image_url = self._extract_image(card)

        return {
            "source_url": source_url,
            "external_id": "",
            "title": title[:500],
            "summary": "",
            "start_at": start_at,
            "end_at": end_at,
            "location_text": country[:255] if country else "",
            "organizer": "CAF",
            "image_url": image_url,
            "modality": modality,
            "language": "es",
            "tags_raw": tags,
            "raw_data": {"country_tag": country},
        }

    def _extract_link(self, card) -> str:
        # First link with /eventos/ in href that isn't the main listing
        for a in card.select('a[href*="/eventos/"]'):
            href = a.get("href", "")
            if href and href != "/es/actualidad/eventos/" and "/eventos/" in href:
                return urljoin(self.source.base_url, href)
        # Fallback: first link
        a = card.select_one("a[href]")
        if a:
            return urljoin(self.source.base_url, a.get("href", ""))
        return ""

    @staticmethod
    def _extract_dates(card):
        # Dates in <p class="p-body-m"> containing "YYYY" or month names
        for p in card.select("p"):
            text = p.get_text(strip=True)
            if re.search(r"\d{4}", text) and re.search(r"\d{1,2}\s+\w+", text):
                return CafScraper._parse_date_text(text)
        return None, None

    @staticmethod
    def _parse_date_text(text: str):
        range_match = re.search(
            r"(\d{1,2}\s+\w+\s+\d{4})\s*[-–]\s*(\d{1,2}\s+\w+\s+\d{4})",
            text,
        )
        if range_match:
            start = dateparser.parse(
                range_match.group(1), languages=["es", "en"],
            )
            end = dateparser.parse(
                range_match.group(2), languages=["es", "en"],
            )
            return start, end

        single = re.search(r"(\d{1,2}\s+\w+\s+\d{4})", text)
        if single:
            return dateparser.parse(single.group(1), languages=["es", "en"]), None

        return None, None

    @staticmethod
    def _extract_modality(card) -> str:
        for p in card.select("p"):
            text = p.get_text(strip=True).lower()
            if text in ("presencial", "online", "virtual", "híbrido", "hybrid"):
                if text in ("online", "virtual"):
                    return "virtual"
                if text in ("híbrido", "hybrid"):
                    return "hybrid"
                return "presencial"
        return "presencial"

    @staticmethod
    def _extract_tags(card) -> list[str]:
        tags: list[str] = []
        for a in card.select('a[href*="taxonomy="]'):
            t = a.get_text(strip=True)
            if t and t not in tags:
                tags.append(t)
        tags.append("CAF")
        return tags

    @staticmethod
    def _extract_image(card) -> str:
        img = card.select_one("img")
        if img:
            src = img.get("src", "")
            if src:
                if src.startswith("/"):
                    return "https://www.caf.com" + src
                return src
        return ""

    @staticmethod
    def _extract_country(card) -> str:
        a = card.select_one('a[href*="/paises/"]')
        if a:
            return a.get_text(strip=True)
        return ""
