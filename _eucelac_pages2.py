import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "Mozilla/5.0"}
base = "https://www.eucelac-platform.eu"

def titles(url):
    soup = BeautifulSoup(requests.get(url, headers=UA, timeout=20).text, "lxml")
    out = []
    for c in soup.select("div.card.mb-5"):
        a = c.select_one("b a")
        if a:
            out.append(a.get_text(strip=True)[:50])
    return out

for p in range(0, 7):
    url = f"{base}/events?page={p}" if p else f"{base}/events"
    t = titles(url)
    print(f"page {p}: {len(t)} cards, first={t[0] if t else 'NONE'}")
