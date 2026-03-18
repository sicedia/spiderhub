import requests
from bs4 import BeautifulSoup
import re

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
base = "https://www.eucelac-platform.eu"
r = requests.get(f"{base}/events", headers=UA, timeout=30)
soup = BeautifulSoup(r.text, "lxml")

cards = soup.select(".card")
print(f"Cards: {len(cards)}")
for i, c in enumerate(cards[:3]):
    print(f"\n=== CARD {i} ===")
    print(str(c)[:2500])

# Pagination
pager = soup.select("a[href*='page=']")
print("\nPager links:", [(a.get("href"), a.get_text(strip=True)) for a in pager[:6]])
