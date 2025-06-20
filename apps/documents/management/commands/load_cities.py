# filepath: c:\Projects\spider-web\apps\documents\management\commands\load_cities.py
import geonamescache
from django.core.management.base import BaseCommand
from apps.documents.models import City, Country

class Command(BaseCommand):
    help = "Carga ciudades desde geonamescache"

    def handle(self, *args, **opts):
        gc = geonamescache.GeonamesCache()
        cities = gc.get_cities()  # dict de todas las ciudades

        created = 0
        for c in cities.values():
            iso2 = c['countrycode']
            try:
                country = Country.objects.get(iso2=iso2)
            except Country.DoesNotExist:
                continue
            name = c['name']
            obj, is_new = City.objects.get_or_create(
                name=name, country=country
            )
            if is_new:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"{created} ciudades creadas."))

# luego: python manage.py load_cities