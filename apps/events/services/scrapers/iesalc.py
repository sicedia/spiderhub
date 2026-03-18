"""Scraper for UNESCO-IESALC events.

Source page: https://www.iesalc.unesco.org/es/node/104
HTML structure per teaser:
  <article class="node teaser ... unesco-type--event">
    <a data-trk='{"content":{...JSON with title, tags, dates...}}'
       href="https://www.iesalc.unesco.org/es/articles/..."
       title="...">
      <div><img class="w-100" src="..." /></div>
      <div>
        <div class="section-text-small">Evento</div>
        <div class="category">Cat VII – Seminar and training</div>
        <div class="h5">TITLE</div>
      </div>
    </a>
  </article>

Each detail page exposes:
  <time class="datetime" datetime="2026-02-24T07:30:00Z">...</time>
  <div class="field--name-field-location">Location: City, Country</div>
  <div class="field--name-field-description">Description text</div>
"""

from __future__ import annotations

import json
import logging
import time as _time
from datetime import datetime, timezone as dt_tz
from typing import Any

import dateparser
from bs4 import Tag

from .base import BaseScraper

logger = logging.getLogger(__name__)

_DETAIL_DELAY = 1.5  # seconds between detail-page fetches


class IesalcScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__("iesalc")
        self.session.headers.update({
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        })

    def parse_list(self) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []

        try:
            soup = self.fetch(self.source.events_url)
        except Exception:
            logger.exception("Failed to fetch IESALC events page")
            return events

        teasers = soup.select("article.unesco-type--event")
        for teaser in teasers:
            try:
                ev = self._parse_teaser(teaser)
                if ev:
                    events.append(ev)
            except Exception:
                logger.exception("Error parsing IESALC teaser")

        return events

    def _parse_teaser(self, article: Tag) -> dict[str, Any] | None:
        link = article.select_one("a[href]")
        if not link:
            return None

        source_url = link.get("data-canonical") or link.get("href", "")
        if not source_url:
            return None

        title = link.get("title", "")
        if not title:
            h5 = article.select_one(".h5")
            title = h5.get_text(strip=True) if h5 else ""
        if not title:
            return None

        # Image
        image_url = ""
        img = article.select_one("img")
        if img:
            image_url = img.get("src", "")

        # Category from <div class="category">
        category_tag = article.select_one("div.category")
        category_text = category_tag.get_text(strip=True) if category_tag else ""

        # Rich metadata from data-trk JSON attribute
        tags_raw = []
        pub_timestamp = None
        trk_str = link.get("data-trk", "")
        if trk_str:
            try:
                trk = json.loads(trk_str)
                content = trk.get("content", {})
                tags_raw = [t for t in content.get("tags", []) if t]
                ts = content.get("date", {}).get("publication")
                if ts:
                    pub_timestamp = datetime.fromtimestamp(ts, tz=dt_tz.utc)
            except (json.JSONDecodeError, KeyError, TypeError):
                pass

        if category_text:
            tags_raw.insert(0, category_text)

        # Fetch detail page for dates and location
        start_at, end_at, location, description = None, None, "", ""
        try:
            _time.sleep(_DETAIL_DELAY)
            detail_soup = self.fetch(source_url)
            start_at, end_at = self._extract_dates(detail_soup)
            location = self._extract_location(detail_soup)
            description = self._extract_description(detail_soup)
        except Exception:
            logger.warning("Could not fetch detail page: %s", source_url)
            start_at = pub_timestamp

        return {
            "source_url": source_url,
            "external_id": "",
            "title": title[:500],
            "summary": description[:2000] if description else "",
            "start_at": start_at,
            "end_at": end_at,
            "location_text": location[:255],
            "organizer": "UNESCO-IESALC",
            "image_url": image_url,
            "modality": self._guess_modality(title, description, location),
            "language": "es",
            "tags_raw": tags_raw[:20],
            "raw_data": {"category_text": category_text},
        }

    @staticmethod
    def _extract_dates(soup) -> tuple:
        time_els = soup.select("time.datetime[datetime]")
        if not time_els:
            time_els = soup.select("time[datetime]")

        start_at, end_at = None, None
        if time_els:
            start_at = dateparser.parse(time_els[0]["datetime"])
            if len(time_els) > 1:
                end_at = dateparser.parse(time_els[-1]["datetime"])
        return start_at, end_at

    @staticmethod
    def _extract_location(soup) -> str:
        loc_field = soup.select_one(".field--name-field-location")
        if loc_field:
            label = loc_field.select_one(".field__label")
            if label:
                label.decompose()
            return loc_field.get_text(strip=True)[:255]
        return ""

    @staticmethod
    def _extract_description(soup) -> str:
        desc_field = soup.select_one(".field--name-field-description")
        if desc_field:
            return desc_field.get_text(strip=True)[:2000]
        return ""

    @staticmethod
    def _guess_modality(title: str, description: str, location: str) -> str:
        blob = f"{title} {description} {location}".lower()
        if "virtual" in blob or "online" in blob or "webinar" in blob or "seminario web" in blob:
            return "virtual"
        if "hybrid" in blob or "híbrido" in blob:
            return "hybrid"
        return "presencial"
