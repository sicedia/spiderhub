from django.core.management.base import BaseCommand
from django.contrib.postgres.search import SearchVector
from apps.documents.models import Document

class Command(BaseCommand):
    help = "Rebuilds the search_vector for all Document records"

    def handle(self, *args, **options):
        # Construir el vector completo combinando campos con pesos
        vector = SearchVector('title', weight='A') + SearchVector('executive_summary', weight='B')
        total = Document.objects.count()
        # Ejecutar una sola actualización masiva
        updated = Document.objects.update(search_vector=vector)
        self.stdout.write(self.style.SUCCESS(
            f"Search index rebuilt: {updated} of {total} documents updated."
        ))