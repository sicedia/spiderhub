"""Probe ECLAC events page structure."""
import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

# Upcoming events page
url = "https://www.cepal.org/en/events"
r = requests.get(url, headers=UA, timeout=20)
print(f"Status: {r.status_code}, len: {len(r.text)}")
soup = BeautifulSoup(r.text, "lxml")

# Look for event items in upcoming section
print("\n=== Upcoming activities section ===")
upcoming = soup.select(".view-upcoming-activities .views-row, .view-upcoming-activities article, .upcoming-activities article")
print(f"Upcoming items: {len(upcoming)}")
for item in upcoming[:3]:
    print(f"\n  Tag: {item.name}, classes: {item.get('class')}")
    print(f"  Text: {item.get_text(strip=True)[:200]}")

# Look for the main event list
print("\n=== Main event list ===")
# Try different selectors
for sel in [
    ".views-row",
    "article",
    ".view-content .views-row",
    ".view-activities .views-row",
    "li.views-row",
    ".event-item",
    ".list-item",
    ".node--type-event",
    ".node--type-course",
]:
    items = soup.select(sel)
    if items:
        print(f"\n  Selector '{sel}': {len(items)} items")
        for it in items[:2]:
            print(f"    classes: {it.get('class')}")
            links = it.select("a[href]")
            for link in links[:2]:
                print(f"    link: {link.get('href')} -> {link.get_text(strip=True)[:80]}")

# Try the filtered URL for upcoming events
print("\n\n=== Filtered upcoming events ===")
url2 = "https://www.cepal.org/en/events?field_date_event_start_value=2026-03-18&field_date_event_start_value_1=2026-12-31&type=event"
r2 = requests.get(url2, headers=UA, timeout=20)
soup2 = BeautifulSoup(r2.text, "lxml")
rows = soup2.select(".views-row")
print(f"Filtered rows: {len(rows)}")
for row in rows[:3]:
    title_el = row.select_one("h3 a, h4 a, .views-field-title a, a")
    date_el = row.select_one(".date-display-single, .views-field-field-date-event time, time, .date")
    print(f"\n  Title: {title_el.get_text(strip=True)[:100] if title_el else 'N/A'}")
    print(f"  Link: {title_el.get('href', '') if title_el else 'N/A'}")
    print(f"  Date: {date_el.get_text(strip=True)[:60] if date_el else 'N/A'}")
    if date_el:
        print(f"  datetime attr: {date_el.get('datetime', 'N/A')}")
    print(f"  HTML snippet: {str(row)[:500]}")
