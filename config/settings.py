"""
Django settings for config project.
This file should only import from the appropriate settings module.
"""

import os
from pathlib import Path

# Determine which settings module to use
settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', 'config.settings.development')

if settings_module == 'config.settings.production':
    from .settings.production import *
elif settings_module == 'config.settings.testing':
    from .settings.testing import *
else:
    from .settings.development import *