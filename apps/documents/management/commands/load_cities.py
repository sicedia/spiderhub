# filepath: c:\Projects\spider-web\apps\documents\management\commands\load_cities.py
import geonamescache
import logging
from django.core.management.base import BaseCommand
from apps.documents.models import City, Country

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Load cities from geonamescache"

    def handle(self, *args, **opts):
        logger.info("Starting cities loading process...")
        self.stdout.write("Loading cities from geonamescache...")
        
        gc = geonamescache.GeonamesCache()
        cities = gc.get_cities()  # dict of all cities
        total_cities = len(cities)
        
        logger.info(f"Found {total_cities} cities to process")
        self.stdout.write(f"Found {total_cities} cities to process")

        created = 0
        skipped_no_country = 0
        already_exists = 0
        processed = 0
        
        for c in cities.values():
            processed += 1
            iso2 = c['countrycode']
            name = c['name']
            
            # Log progress every 1000 cities
            if processed % 1000 == 0:
                progress_percent = (processed / total_cities) * 100
                logger.info(f"Progress: {processed}/{total_cities} ({progress_percent:.1f}%) - Created: {created}, Skipped: {skipped_no_country}, Existing: {already_exists}")
                self.stdout.write(f"Progress: {processed}/{total_cities} ({progress_percent:.1f}%)")
            
            try:
                country = Country.objects.get(iso2=iso2)
                logger.debug(f"Processing city: {name} in {country.name} ({iso2})")
            except Country.DoesNotExist:
                logger.warning(f"Country with ISO2 code '{iso2}' not found for city '{name}' - skipping")
                skipped_no_country += 1
                continue
            
            obj, is_new = City.objects.get_or_create(
                name=name, country=country
            )
            
            if is_new:
                created += 1
                logger.debug(f"Created new city: {name} in {country.name}")
            else:
                already_exists += 1
                logger.debug(f"City already exists: {name} in {country.name}")

        # Final summary
        logger.info(f"Cities loading completed! Created: {created}, Already existed: {already_exists}, Skipped (no country): {skipped_no_country}")
        self.stdout.write(self.style.SUCCESS(f"Cities loading completed!"))
        self.stdout.write(f"  - Created: {created} new cities")
        self.stdout.write(f"  - Already existed: {already_exists} cities")
        self.stdout.write(f"  - Skipped (no country): {skipped_no_country} cities")
        self.stdout.write(f"  - Total processed: {processed} cities")

# then: python manage.py load_cities