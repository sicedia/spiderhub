"""
Django settings for config project.
This file should only import from the appropriate settings module.
"""

import os
from pathlib import Path

# Determine which settings module to use
settings_module = os.environ.get('DJANGO_SETTINGS_MODULE')

if not settings_module or 'development' in settings_module:
    from .settings.development import *
elif 'production' in settings_module:
    from .settings.production import *
elif 'testing' in settings_module:
    from .settings.testing import *
else:
    # Por defecto usar development
    from .settings.development import *