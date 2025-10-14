from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.views.generic import TemplateView
from django.http import HttpResponse        # Añadido
from django.views.i18n import JavaScriptCatalog

from apps.core.views import health_check
from apps.documents.urls import api_urlpatterns as documents_api_urls

# URLs that don't need language prefix (API endpoints, health checks, etc.)
urlpatterns = [
    path('api/search/', include('apps.search.urls', namespace='search')),
    path('api/documents/', include(documents_api_urls)),
    path('health/', health_check, name='health_check'),
    path('i18n/', include('django.conf.urls.i18n')),  # Language switching endpoint
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript-catalog'),
]

# URLs with language prefix
urlpatterns += i18n_patterns(
    path('', include('apps.core.urls', namespace='core')),
    path('documents/', include('apps.documents.urls', namespace='documents')),
    path('admin/', admin.site.urls),
    path('admin-panel/', include('apps.admin_panel.urls', namespace='admin-panel')),
    prefix_default_language=True,  # Include language prefix even for default language
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)