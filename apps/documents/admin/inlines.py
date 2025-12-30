"""
Admin Inlines
InlineModelAdmin classes for Document relationships
"""
from django.contrib import admin
from django.forms import Textarea, TextInput
from django.db import models
from ..models import (
    SourceFile, DocumentTheme, DocumentActor, DocumentSDG,
    PracticalApplication, Commitment, KPI
)


class SourceFileInline(admin.TabularInline):
    """Inline admin for SourceFile model"""
    model = SourceFile
    extra = 0
    fields = ('file', 'filename_display', 'file_type_display', 'external_link', 'description')
    classes = ('collapse',)
    verbose_name = "Source File"
    verbose_name_plural = "Source Files"
    readonly_fields = ('filename_display', 'file_type_display', 'file_size', 'upload_date')
    can_delete = True
    show_change_link = True
    
    class Media:
        css = {
            'all': ('admin/css/sourcefile_admin.css',)
        }
    
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        
        class CustomSourceFileForm(formset.form):
            class Meta(formset.form.Meta):
                widgets = {
                    'external_link': TextInput(attrs={'size': '50', 'placeholder': 'https://...'}),
                    'description': Textarea(attrs={'rows': 2, 'cols': '50', 'placeholder': 'Optional description'}),
                }
        
        formset.form = CustomSourceFileForm
        formset.validate_min = False
        formset.validate_max = False
        return formset
    
    def filename_display(self, obj):
        """Display filename as read-only label with truncation"""
        if obj.filename:
            display_name = obj.filename
            if len(display_name) > 30:
                display_name = display_name[:27] + "..."
            
            from django.utils.html import format_html
            return format_html(
                '<span style="background-color: #e8f5e8; padding: 2px 6px; border-radius: 4px; font-size: 12px; max-width: 200px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="{}">📄 {}</span>', 
                obj.filename, display_name
            )
        return '-'
    filename_display.short_description = 'Filename (Auto-generated)'
    
    def file_type_display(self, obj):
        """Display file type as read-only label"""
        if obj.file_type:
            colors = {
                'pdf': '#dc3545',
                'doc': '#007bff',
                'docx': '#007bff',
                'txt': '#28a745',
                'html': '#fd7e14',
                'other': '#6c757d'
            }
            color = colors.get(obj.file_type, '#6c757d')
            from django.utils.html import format_html
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">{}</span>',
                color, obj.file_type.upper()
            )
        return '-'
    file_type_display.short_description = 'Type (Auto-detected)'


class DocumentThemeInline(admin.TabularInline):
    """Inline admin for DocumentTheme relationship"""
    model = DocumentTheme
    extra = 1  # Show one empty form for quick addition
    fields = ('theme', 'is_top', 'relevance_score', 'justification')
    autocomplete_fields = ('theme',)
    # Not collapsed by default - themes are most commonly edited
    verbose_name = "Theme"
    verbose_name_plural = "Themes"
    max_num = 50
    can_delete = True
    show_change_link = True
    
    class Media:
        css = {
            'all': ('admin/css/sourcefile_admin.css',)
        }
    
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        
        class CustomThemeForm(formset.form):
            class Meta(formset.form.Meta):
                widgets = {
                    'justification': Textarea(attrs={'rows': 2, 'cols': '50', 'placeholder': 'Optional justification'}),
                    'relevance_score': TextInput(attrs={'size': '10', 'placeholder': '0-100'}),
                }
        
        formset.form = CustomThemeForm
        formset.validate_min = False
        formset.validate_max = False
        return formset


class DocumentActorInline(admin.TabularInline):
    """Inline admin for DocumentActor relationship"""
    model = DocumentActor
    extra = 1  # Show one empty form for quick addition
    fields = ('actor', 'is_top', 'relevance_score', 'justification')
    autocomplete_fields = ('actor',)
    # Not collapsed by default - actors are frequently edited
    verbose_name = "Actor"
    verbose_name_plural = "Actors"
    max_num = 50
    can_delete = True
    show_change_link = True
    
    class Media:
        css = {
            'all': ('admin/css/sourcefile_admin.css',)
        }
    
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        
        class CustomActorForm(formset.form):
            class Meta(formset.form.Meta):
                widgets = {
                    'justification': Textarea(attrs={'rows': 2, 'cols': '50', 'placeholder': 'Optional justification'}),
                    'relevance_score': TextInput(attrs={'size': '10', 'placeholder': '0-100'}),
                }
        
        formset.form = CustomActorForm
        formset.validate_min = False
        formset.validate_max = False
        return formset


class DocumentSDGInline(admin.TabularInline):
    """Inline admin for DocumentSDG relationship"""
    model = DocumentSDG
    extra = 0
    fields = ('sdg', 'relevance_score', 'justification')
    autocomplete_fields = ('sdg',)
    classes = ('collapse',)
    verbose_name = "SDG Relationship"
    verbose_name_plural = "SDG Relationships"
    max_num = 17
    can_delete = True
    show_change_link = True
    
    class Media:
        css = {
            'all': ('admin/css/sourcefile_admin.css',)
        }
    
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        
        class CustomSDGForm(formset.form):
            class Meta(formset.form.Meta):
                widgets = {
                    'justification': Textarea(attrs={'rows': 2, 'cols': '50', 'placeholder': 'Optional justification'}),
                    'relevance_score': TextInput(attrs={'size': '10', 'placeholder': '0.0-1.0'}),
                }
        
        formset.form = CustomSDGForm
        formset.validate_min = False
        formset.validate_max = False
        return formset


class PracticalApplicationInline(admin.StackedInline):
    """Inline admin for PracticalApplication model"""
    model = PracticalApplication
    extra = 0
    fields = ('description',)
    classes = ('collapse',)
    verbose_name = "Practical Application"
    verbose_name_plural = "Practical Applications"
    max_num = 50
    can_delete = True
    show_change_link = True
    
    class Media:
        css = {
            'all': ('admin/css/sourcefile_admin.css',)
        }
    
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        
        class CustomPracticalForm(formset.form):
            class Meta(formset.form.Meta):
                widgets = {
                    'description': Textarea(attrs={'rows': 3, 'cols': '80', 'style': 'max-width: 100%;', 'placeholder': 'Describe practical applications...'}),
                }
        
        formset.form = CustomPracticalForm
        formset.validate_min = False
        formset.validate_max = False
        return formset


class CommitmentInline(admin.StackedInline):
    """Inline admin for Commitment model"""
    model = Commitment
    extra = 1  # Show one empty form for quick addition
    fields = ('text',)
    # Not collapsed by default - commitments are core content
    verbose_name = "Commitment"
    verbose_name_plural = "Commitments"
    max_num = 50
    can_delete = True
    show_change_link = True
    
    class Media:
        css = {
            'all': ('admin/css/sourcefile_admin.css',)
        }
    
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        
        class CustomCommitmentForm(formset.form):
            class Meta(formset.form.Meta):
                widgets = {
                    'text': Textarea(attrs={'rows': 3, 'cols': '80', 'style': 'max-width: 100%;', 'placeholder': 'Enter commitment text...'}),
                }
        
        formset.form = CustomCommitmentForm
        formset.validate_min = False
        formset.validate_max = False
        return formset


class KPIInline(admin.TabularInline):
    """Inline admin for KPI model"""
    model = KPI
    extra = 0
    fields = ('metric_name', 'kpi_type', 'target_value', 'target_description', 'unit', 'sector')
    classes = ('collapse',)
    verbose_name = "Key Performance Indicator"
    verbose_name_plural = "Key Performance Indicators"
    can_delete = True
    show_change_link = True
    
    class Media:
        css = {
            'all': ('admin/css/sourcefile_admin.css',)
        }
    
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        
        class CustomKPIForm(formset.form):
            class Meta(formset.form.Meta):
                widgets = {
                    'metric_name': TextInput(attrs={'size': '30', 'placeholder': 'Metric name'}),
                    'target_value': TextInput(attrs={'size': '15', 'placeholder': 'Target value'}),
                    'target_description': TextInput(attrs={'size': '40', 'placeholder': 'Target description'}),
                    'unit': TextInput(attrs={'size': '15', 'placeholder': 'Unit'}),
                    'sector': TextInput(attrs={'size': '20', 'placeholder': 'Sector'}),
                }
        
        formset.form = CustomKPIForm
        formset.validate_min = False
        formset.validate_max = False
        return formset

