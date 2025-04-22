from django.shortcuts import render, redirect
from django.views import View
from django.views.generic import ListView, TemplateView

# Function-based view
def redirect_to_upload(request):
    return redirect('admin_panel:upload')

# Class-based views
class UploadView(View):
    def get(self, request):
        pass
    
    def post(self, request):
        pass

class MetadataListView(ListView):
    template_name = 'admin_panel/metadata.html'
    
    def get_queryset(self):
        pass

class StatsView(TemplateView):
    template_name = 'admin_panel/stats.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add stats to context
        pass
        return context

class SettingsView(View):
    def get(self, request):
        pass
    
    def post(self, request):
        pass