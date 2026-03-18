import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "Mozilla/5.0"}
base = "https://www.eucelac-platform.eu"
for u in [f"{base}/events", f"{base}/events?page=0", f"{base}/events?page=1"]:
    r = requests.get(u, headers=UA, timeout=20)
    n = len(BeautifulSoup(r.text, "lxml").select("div.card.mb-5"))
    print(u, "cards", n)
