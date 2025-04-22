from django.urls import path
from . import views

app_name = 'admin_panel'
urlpatterns = [
    path('', views.redirect_to_upload, name='home'),
    path('upload/', views.UploadView.as_view(), name='upload'),
    path('metadata/', views.MetadataListView.as_view(), name='metadata'),
    path('stats/', views.StatsView.as_view(), name='stats'),
    path('settings/', views.SettingsView.as_view(), name='settings'),
]
