"""
Event API URLs
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import EventViewSet

router = DefaultRouter()
# Use a non-empty prefix - router will generate URLs like ^$ for list, ^(?P<pk>[^/.]+)/$ for detail
# But we need to match the parent path 'events/', so we use empty string and it should work
router.register(r"", EventViewSet, basename="events")

urlpatterns = router.urls

