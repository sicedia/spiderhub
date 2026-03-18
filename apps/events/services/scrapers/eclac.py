"""Scraper for ECLAC (CEPAL) events.

List: https://www.cepal.org/en/events
Pagination: ?content_type=cepal_event&tab=next&page=N

Each event is an <article class="py-3 mb-3 ..."> with:
  - Title/link:  h4 a or h3 a (href like /en/events/...)
  - Date + type: div[data-component-id="eclacstrap_base:header-date"]
  - Summary:     p.pb-3
The detail page provides an image and fuller description.
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
_DATE_RE = re.compile(
    r"(?P<date_part>.+?)\s*\|\s*(?P<type_part>.+)",
    re.DOTALL,
)


class EclacScraper(BaseScraper):
    def __init__(self) -> None:
        super().__init__("eclac")

    def parse_list(self) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        base = self.source.base_url.rstrip("/")
        seen_urls: set[str] = set()

        for page in range(_MAX_PAGES):
            url = (
                f"{base}/en/events"
                if page == 0
                else f"{base}/en/events?content_type=cepal_event&tab=next&page={page}"
            )
            try:
                soup = self.fetch(url)
            except Exception:
                logger.exception("Failed to fetch ECLAC page %s", url)
                break

            articles = soup.select("article.py-3.mb-3")
            if not articles:
                break

            for art in articles:
                try:
                    ev = self._parse_article(art, base)
                    if ev and ev["source_url"] not in seen_urls:
                        seen_urls.add(ev["source_url"])
                        events.append(ev)
                except Exception:
                    logger.exception("Error parsing ECLAC article")

        return events

    def _parse_article(self, art, base: str) -> dict[str, Any] | None:
        title_el = art.select_one("h4 a[href], h3 a[href], h2 a[href]")
        if not title_el:
            return None

        href = title_el.get("href", "")
        if not href or "/events/" not in href:
            return None
        source_url = href if href.startswith("http") else urljoin(base, href)

        title = title_el.get_text(strip=True)
        if not title:
            return None

        date_div = art.select_one("div[data-component-id='eclacstrap_base:header-date']")
        start_at = None
        end_at = None
        event_type = ""
        tags: list[str] = ["ECLAC"]

        if date_div:
            raw_text = date_div.get_text(" ", strip=True)
            start_at, end_at, event_type = self._parse_date_block(raw_text)
            if event_type:
                tags.append(event_type)

        desc_el = art.select_one("p.pb-3, p")
        summary = desc_el.get_text(strip=True)[:500] if desc_el else ""

        image_url = self._fetch_image(source_url)

        modality = None
        combined = f"{title} {summary}".lower()
        if "virtual" in combined or "online" in combined or "webinar" in combined:
            modality = "virtual"
        elif "hybrid" in combined or "híbrido" in combined:
            modality = "hybrid"
        elif "in person" in combined or "presencial" in combined:
            modality = "presencial"

        return {
            "source_url": source_url,
            "external_id": "",
            "title": title[:500],
            "summary": summary,
            "description": summary,
            "start_at": start_at,
            "end_at": end_at,
            "location_text": "",
            "organizer": "ECLAC",
            "image_url": image_url[:500] if image_url else "",
            "modality": modality,
            "language": "en",
            "tags_raw": tags,
            "raw_data": {"event_type": event_type},
        }

    @staticmethod
    def _parse_date_block(raw: str) -> tuple:
        """Parse date text like '21 Apr 2026, 09:00 - 11:30 | Event (Meetings ...)'.

        Returns (start_at, end_at, event_type).
        """
        event_type = ""
        date_part = raw.strip()

        m = _DATE_RE.match(raw)
        if m:
            date_part = m.group("date_part").strip()
            type_raw = m.group("type_part").strip()
            type_raw = re.sub(r"^Event\s*", "", type_raw).strip()
            type_raw = re.sub(r"^\(|\)$", "", type_raw).strip()
            event_type = type_raw

        date_part = re.sub(r",?\s*All\s*day", "", date_part, flags=re.I).strip()
        date_part = re.sub(r"\s+", " ", date_part).strip()

        # Handle range dates: "21 - 24 Apr 2026" or "28 - 30 Oct 2026"
        range_match = re.match(
            r"(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(\w+)\s+(\d{4})",
            date_part,
        )
        if range_match:
            d1, d2, month, year = range_match.groups()
            start_at = dateparser.parse(f"{d1} {month} {year}")
            end_at = dateparser.parse(f"{d2} {month} {year}")
            return start_at, end_at, event_type

        # Handle "13 - 16 Apr 2026, ..." with time
        range_time = re.match(
            r"(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(\w+)\s+(\d{4}),?\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})",
            date_part,
        )
        if range_time:
            d1, d2, month, year, t1, t2 = range_time.groups()
            start_at = dateparser.parse(f"{d1} {month} {year} {t1}")
            end_at = dateparser.parse(f"{d2} {month} {year} {t2}")
            return start_at, end_at, event_type

        # Single date: "21 Apr 2026, 09:00 - 11:30"
        single_time = re.match(
            r"(\d{1,2}\s+\w+\s+\d{4}),?\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})",
            date_part,
        )
        if single_time:
            date_str, t1, t2 = single_time.groups()
            start_at = dateparser.parse(f"{date_str} {t1}")
            end_at = dateparser.parse(f"{date_str} {t2}")
            return start_at, end_at, event_type

        # Fallback: just parse the whole thing
        start_at = dateparser.parse(date_part)
        return start_at, None, event_type

    def _fetch_image(self, detail_url: str) -> str:
        """Fetch the detail page and extract the event image if present."""
        try:
            soup = self.fetch(detail_url)
            img = soup.select_one(
                ".field--name-field-image img, "
                "article img[src*='/events/'], "
                "main img[src*='/events/']"
            )
            if img:
                src = img.get("src") or img.get("data-src") or ""
                if src:
                    if not src.startswith("http"):
                        src = urljoin(self.source.base_url, src)
                    return src
        except Exception:
            logger.debug("Could not fetch ECLAC detail image for %s", detail_url)
        return ""
