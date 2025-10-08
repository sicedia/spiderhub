from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import HttpResponse        # Añadido

from apps.core.views import health_check
from apps.documents.urls import api_urlpatterns as documents_api_urls

urlpatterns = [
    path('', include('apps.core.urls', namespace='core')),
    path('documents/', include('apps.documents.urls', namespace='documents')),
    path('admin/', admin.site.urls),
    path('admin-panel/', include('apps.admin_panel.urls', namespace='admin-panel')),
    path('api/search/', include('apps.search.urls', namespace='search')),
    path('api/documents/', include(documents_api_urls)),
    path('health/', health_check, name='health_check'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)