"""Scraper for ITU (International Telecommunication Union) events.

Source: https://www.itu.int/en/events/Pages/Calendar-Events.aspx
SharePoint-rendered table. Each data row has 9 cells (td.ms-vb):
  [0] Number/link to Event-Details  [1] Calendar link
  [2] Start (YYYY-MM-DD)           [3] End (YYYY-MM-DD)
  [4] Sector (ITU-T/ITU-D/ITU-R)   [5] Group (with optional link)
  [6] Title                         [7] Place
  [8] Status (Confirmed/Planned/Cancelled)
"""

from __future__ import annotations

import logging
import re
from typing import Any

import dateparser

from .base import BaseScraper

logger = logging.getLogger(__name__)


class ItuScraper(BaseScraper):
    CALENDAR_URL = "https://www.itu.int/en/events/Pages/Calendar-Events.aspx"

    def __init__(self) -> None:
        super().__init__("itu")

    def parse_list(self) -> list[dict[str, Any]]:
        soup = self.fetch(self.CALENDAR_URL)
        events: list[dict[str, Any]] = []

        # Find rows that contain Event-Details links
        detail_links = soup.select('a[href*="Event-Details"]')
        for link in detail_links:
            row = link.find_parent("tr")
            if not row:
                continue
            try:
                ev = self._parse_row(row, link)
                if ev:
                    events.append(ev)
            except Exception:
                logger.exception("Error parsing ITU row")

        return events

    def _parse_row(self, row, detail_link) -> dict[str, Any] | None:
        cells = row.select("td")
        if len(cells) < 9:
            return None

        # Cells: [0]=number/link [1]=calendar [2]=start [3]=end [4]=sector
        #         [5]=group [6]=title [7]=place [8]=status
        start_text = cells[2].get_text(strip=True)
        end_text = cells[3].get_text(strip=True)
        sector = cells[4].get_text(strip=True)
        group = cells[5].get_text(strip=True)
        title = cells[6].get_text(strip=True)
        place = cells[7].get_text(strip=True)
        status_text = cells[8].get_text(strip=True).lower()

        if not title:
            return None

        source_url = detail_link.get("href", "")
        event_id = ""
        m = re.search(r"eventid=(\d+)", source_url, re.IGNORECASE)
        if m:
            event_id = m.group(1)

        start_at = dateparser.parse(start_text) if start_text else None
        end_at = dateparser.parse(end_text) if end_text else None

        tags = [t for t in [sector, group] if t]

        event_status = "cancelled" if status_text == "cancelled" else "published"

        return {
            "source_url": source_url,
            "external_id": event_id,
            "title": title[:500],
            "summary": f"{sector} – {group}".strip(" –") if (sector or group) else "",
            "start_at": start_at,
            "end_at": end_at,
            "location_text": place[:255] if place else "",
            "organizer": "ITU",
            "modality": self._guess_modality(place),
            "language": "en",
            "tags_raw": tags,
            "raw_data": {
                "sector": sector,
                "group": group,
                "itu_status": status_text,
            },
            "status": event_status,
        }

    @staticmethod
    def _guess_modality(place: str) -> str:
        lower = place.lower()
        if "e-meeting" in lower or "virtual" in lower or "online" in lower:
            return "virtual"
        if "hybrid" in lower:
            return "hybrid"
        return "presencial"
