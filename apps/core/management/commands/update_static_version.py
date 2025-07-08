"""
Comando para generar una nueva versión de archivos estáticos
"""
import time
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Genera una nueva versión para cache busting de archivos estáticos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--version',
            type=str,
            help='Versión específica a usar (por defecto usa timestamp)',
        )

    def handle(self, *args, **options):
        version = options['version'] or str(int(time.time()))
        
        # En development, esta información se puede usar para logging
        self.stdout.write(
            self.style.SUCCESS(f'Nueva versión generada: {version}')
        )
        
        if not settings.DEBUG:
            self.stdout.write(
                self.style.WARNING(
                    'Para usar en producción, actualiza la variable de entorno STATIC_VERSION='
                    f'{version}'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    'En modo desarrollo, la versión se genera automáticamente '
                    'basada en la fecha de modificación de los archivos.'
                )
            )
