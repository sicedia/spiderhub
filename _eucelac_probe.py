import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
url = "https://www.eucelac-platform.eu/events"
r = requests.get(url, headers=UA, timeout=30)
print("Status:", r.status_code)
print("Len:", len(r.text))
if r.status_code != 200:
    print(r.text[:500])
    raise SystemExit

soup = BeautifulSoup(r.text, "lxml")
print("Page title:", soup.title.string if soup.title else None)

# List items, articles, cards
for sel in [
    "article",
    ".event",
    "[class*='event']",
    ".views-row",
    ".node",
    ".card",
    "li",
]:
    els = soup.select(sel)
    if 0 < len(els) < 80:
        print(f"{sel}: {len(els)}")

# All external-looking event links
seen = set()
for a in soup.find_all("a", href=True):
    h = a["href"]
    t = a.get_text(strip=True)
    if not t or len(t) < 5:
        continue
    if h in seen:
        continue
    if "/event" in h.lower() or "calendar" in h.lower():
        seen.add(h)
        print("A:", h[:120], "|", t[:80])

# Dump first 8000 chars of body structure
main = soup.find("main") or soup.find("div", id="content") or soup.body
if main:
    print("\n--- MAIN sample ---")
    print(main.get_text(strip=True)[:800])
