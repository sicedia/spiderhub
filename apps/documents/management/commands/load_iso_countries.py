# apps/documents/management/commands/load_iso_countries.py
from django.core.management.base import BaseCommand
from apps.documents.models import Country
import pycountry

class Command(BaseCommand):
    help = "Carga catálogo ISO 3166-1 en la tabla Country."

    def handle(self, *args, **opts):
        # Truncate Country and City tables
        Country.objects.all().delete()

        created_cnt = 0
        for c in pycountry.countries:
            _, created = Country.objects.get_or_create(
                iso3=c.alpha_3,
                defaults=dict(iso2=c.alpha_2, name=c.name),
            )
            if created:
                created_cnt += 1

        # País/organismo especial UE (EUU)
        Country.objects.get_or_create(
            iso3="EUU",
            defaults=dict(iso2=None, name="European Union"),
        )

        self.stdout.write(
            self.style.SUCCESS(f"{created_cnt} países creados o actualizados.")
        )
