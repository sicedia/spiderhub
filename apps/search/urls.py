from django.urls import path
from .views import (
    DocumentSearchAPIView,
    SuggestAPIView
)

app_name = 'search'
urlpatterns = [
    path('documents/', DocumentSearchAPIView.as_view(), name='doc-search'),
    path('suggest/',    SuggestAPIView.as_view(),    name='doc-suggest'),
]
