from .base import BaseScraper  # noqa: F401
from .oas import OasScraper  # noqa: F401
from .itu import ItuScraper  # noqa: F401
from .caf import CafScraper  # noqa: F401
from .idrc import IdrcScraper  # noqa: F401
from .iesalc import IesalcScraper  # noqa: F401
from .eucelac import EucelacScraper  # noqa: F401
from .iadb import IadbScraper  # noqa: F401
from .eclac import EclacScraper  # noqa: F401

SCRAPER_REGISTRY: dict[str, type[BaseScraper]] = {
    "oas": OasScraper,
    "itu": ItuScraper,
    "caf": CafScraper,
    "idrc": IdrcScraper,
    "iesalc": IesalcScraper,
    "eucelac": EucelacScraper,
    "iadb": IadbScraper,
    "eclac": EclacScraper,
}

# ─────────────────────────────────────────────────────────────────────
# Quick-start reference
# ─────────────────────────────────────────────────────────────────────
#
# 1. Apply migrations (includes the seed of EventSource rows):
#        python manage.py migrate events
#
# 2. Verify the three sources were seeded:
#        python manage.py shell -c "from apps.events.models import EventSource; print(list(EventSource.objects.values_list('slug', flat=True)))"
#
# 3. Run individual scrapers:
#        python manage.py scrape_oas
#        python manage.py scrape_itu
#        python manage.py scrape_caf
#
#    Or run all at once / by slug:
#        python manage.py scrape_events --all
#        python manage.py scrape_events --source=oas
#
# 4. Browse events at:
#        /events/                       (public list page)
#        /api/v1/events/                (API – paginated JSON)
#        /admin/events/event/           (Django admin)
# ─────────────────────────────────────────────────────────────────────
