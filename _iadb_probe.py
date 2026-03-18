"""Probe IDB events for API endpoints."""
import requests
from bs4 import BeautifulSoup
import re
import json

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

# Check main page for JS/API clues
r = requests.get("https://events.iadb.org/calendar/?lang=en", headers=UA, timeout=20)
soup = BeautifulSoup(r.text, "lxml")
print(f"Status: {r.status_code}")

# Find script tags with API URLs
for script in soup.find_all("script"):
    src = script.get("src", "")
    text = script.string or ""
    if "api" in src.lower() or "api" in text.lower()[:500] or "events" in text.lower()[:500]:
        print(f"\nScript src: {src[:100]}")
        if text:
            print(f"  Content preview: {text[:500]}")

# Check for data attributes
for el in soup.find_all(attrs={"data-url": True}):
    print(f"data-url: {el.get('data-url')}")

# Try common API patterns
api_urls = [
    "https://events.iadb.org/api/events",
    "https://events.iadb.org/api/v1/events",
    "https://events.iadb.org/calendar/api/events",
    "https://events.iadb.org/cal/api/events",
    "https://events.iadb.org/api/calendar",
    "https://events.iadb.org/calendar/events.json",
    "https://events.iadb.org/calendar/?format=json",
    "https://events.iadb.org/api/event/search",
]

for url in api_urls:
    try:
        r2 = requests.get(url, headers=UA, timeout=10)
        ct = r2.headers.get("content-type", "")
        print(f"\n{r2.status_code} | {ct[:40]} | {url}")
        if r2.status_code == 200 and "json" in ct:
            data = r2.json()
            if isinstance(data, list):
                print(f"  Array of {len(data)} items")
                if data:
                    print(f"  First keys: {list(data[0].keys())[:10]}")
            elif isinstance(data, dict):
                print(f"  Keys: {list(data.keys())[:10]}")
                if "results" in data:
                    print(f"  results: {len(data['results'])} items")
            print(f"  Preview: {json.dumps(data, default=str)[:400]}")
    except Exception as e:
        print(f"  ERR | {url} | {e}")

# Check all script src URLs
print("\n=== All script sources ===")
for script in soup.find_all("script", src=True):
    print(f"  {script['src'][:120]}")
