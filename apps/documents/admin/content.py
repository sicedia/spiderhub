"""
Content Admin Classes
Admin interfaces for content-specific models (PracticalApplication, Commitment, KPI, SourceFile)
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from django.forms import Textarea, TextInput
from ..models import (
    PracticalApplication, Commitment, CommitmentDetail, KPI, SourceFile
)
from .mixins import TimestampReadonlyMixin, StandardFormFieldOverridesMixin
from .utils import format_file_size


@admin.register(PracticalApplication)
class PracticalApplicationAdmin(TimestampReadonlyMixin, admin.ModelAdmin):
    """Admin interface for PracticalApplication model"""
    list_display = ('description_preview', 'document_title', 'created_at')
    list_display_links = ('description_preview',)
    list_filter = ('document', 'created_at')
    search_fields = ('description', 'document__title')
    autocomplete_fields = ('document',)
    readonly_fields = ('created_at', 'updated_at', 'description_normalized', 'search_vector')
    list_per_page = 25
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 6, 'cols': 80})},
    }
    
    def description_preview(self, obj):
        preview = obj.description[:100] + "..." if len(obj.description) > 100 else obj.description
        return format_html('<div style="max-width: 300px;">{}</div>', preview)
    description_preview.short_description = 'Description'
    
    def document_title(self, obj):
        return obj.document.title[:40] + "..." if len(obj.document.title) > 40 else obj.document.title
    document_title.short_description = 'Document'


@admin.register(Commitment)
class CommitmentAdmin(TimestampReadonlyMixin, admin.ModelAdmin):
    """Admin interface for Commitment model"""
    list_display = ('text_preview', 'document_title', 'created_at')
    list_display_links = ('text_preview',)
    list_filter = ('document', 'created_at')
    search_fields = ('text', 'document__title')
    autocomplete_fields = ('document',)
    readonly_fields = ('created_at', 'updated_at', 'text_normalized', 'search_vector')
    list_per_page = 25
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 6, 'cols': 80})},
    }
    
    def text_preview(self, obj):
        preview = obj.text[:100] + "..." if len(obj.text) > 100 else obj.text
        return format_html('<div style="max-width: 300px;">{}</div>', preview)
    text_preview.short_description = 'Commitment Text'
    
    def document_title(self, obj):
        return obj.document.title[:40] + "..." if len(obj.document.title) > 40 else obj.document.title
    document_title.short_description = 'Document'


@admin.register(CommitmentDetail)
class CommitmentDetailAdmin(TimestampReadonlyMixin, admin.ModelAdmin):
    """Admin interface for CommitmentDetail model"""
    list_display = ('text_preview', 'commitment_class_badge', 'commitment_preview', 'created_at')
    list_display_links = ('text_preview',)
    list_filter = ('commitment_class', 'commitment', 'created_at')
    search_fields = ('text', 'commitment_class', 'commitment__text')
    autocomplete_fields = ('commitment',)
    readonly_fields = ('created_at', 'updated_at', 'text_normalized', 'search_vector')
    list_per_page = 25
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 80})},
    }
    
    def text_preview(self, obj):
        preview = obj.text[:80] + "..." if len(obj.text) > 80 else obj.text
        return format_html('<div style="max-width: 250px;">{}</div>', preview)
    text_preview.short_description = 'Detail Text'
    
    def commitment_class_badge(self, obj):
        return format_html(
            '<span style="background-color: #6f42c1; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">{}</span>',
            obj.commitment_class
        )
    commitment_class_badge.short_description = 'Class'
    
    def commitment_preview(self, obj):
        preview = obj.commitment.text[:50] + "..." if len(obj.commitment.text) > 50 else obj.commitment.text
        return format_html('<div style="max-width: 200px;">{}</div>', preview)
    commitment_preview.short_description = 'Related Commitment'


@admin.register(KPI)
class KPIAdmin(TimestampReadonlyMixin, StandardFormFieldOverridesMixin, admin.ModelAdmin):
    """Admin interface for KPI model"""
    list_display = ('metric_name_display', 'kpi_type_badge', 'target_display', 'sector_display', 'document_title', 'created_at')
    list_display_links = ('metric_name_display',)
    list_filter = ('kpi_type', 'sector', 'document', 'created_at')
    search_fields = ('metric_name', 'kpi_text', 'sector', 'document__title')
    autocomplete_fields = ('document',)
    readonly_fields = ('created_at', 'updated_at', 'metric_name_normalized', 'kpi_text_normalized', 'search_vector')
    list_per_page = 25
    
    fieldsets = (
        ('📊 Basic Information', {
            'fields': ('document', 'metric_name', 'kpi_text', 'kpi_type'),
            'classes': ('wide',)
        }),
        ('🎯 Target & Measurement', {
            'fields': ('target_value', 'target_description', 'unit', 'timeframe', 'measurement_method'),
            'classes': ('wide',)
        }),
        ('🏢 Implementation', {
            'fields': ('responsible_entity', 'sector'),
            'classes': ('wide',)
        }),
        ('🏷️ Metadata', {
            'fields': ('created_at', 'updated_at', 'metric_name_normalized', 'kpi_text_normalized', 'search_vector'),
            'classes': ('collapse',)
        }),
    )
    
    def metric_name_display(self, obj):
        return format_html('<strong style="color: #007cba;">{}</strong>', obj.metric_name)
    metric_name_display.short_description = 'Metric Name'
    
    def kpi_type_badge(self, obj):
        colors = {
            'Quantitative': '#28a745',
            'Qualitative': '#007bff',
            'Binary': '#dc3545'
        }
        color = colors.get(obj.kpi_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">{}</span>',
            color, obj.kpi_type
        )
    kpi_type_badge.short_description = 'Type'
    
    def target_display(self, obj):
        if obj.target_value:
            return format_html('<strong>{}</strong> {}', obj.target_value, obj.unit or '')
        return '-'
    target_display.short_description = 'Target'
    
    def sector_display(self, obj):
        if obj.sector:
            return format_html(
                '<span style="background-color: #17a2b8; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">{}</span>',
                obj.sector
            )
        return '-'
    sector_display.short_description = 'Sector'
    
    def document_title(self, obj):
        return obj.document.title[:40] + "..." if len(obj.document.title) > 40 else obj.document.title
    document_title.short_description = 'Document'


@admin.register(SourceFile)
class SourceFileAdmin(admin.ModelAdmin):
    """Admin interface for SourceFile model"""
    list_display = ('filename_display', 'document_title', 'file_type_badge', 'file_size_display', 'link_display', 'upload_date', 'description_preview')
    list_display_links = ('filename_display',)
    list_filter = ('file_type', 'upload_date', 'document')
    search_fields = ('filename', 'description', 'document__title', 'external_link')
    autocomplete_fields = ('document',)
    readonly_fields = ('filename_display', 'file_type_display', 'file_size', 'upload_date', 'created_at', 'updated_at')
    list_per_page = 25
    actions = ['extract_filenames_from_pdfs', 'regenerate_filenames']
    
    fieldsets = (
        ('📎 File Information', {
            'fields': ('document', 'file', 'filename_display', 'file_type_display'),
            'classes': ('wide',)
        }),
        ('📝 Details', {
            'fields': ('description', 'external_link', 'file_size', 'upload_date'),
            'classes': ('wide',)
        }),
        ('🏷️ Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 3, 'cols': 80, 'style': 'max-width: 100%;'})},
        models.CharField: {'widget': TextInput(attrs={'size': '60', 'style': 'max-width: 100%;'})},
        models.URLField: {'widget': TextInput(attrs={'size': '80', 'style': 'max-width: 100%;', 'placeholder': 'https://...'})},
    }
    
    class Media:
        css = {
            'all': ('admin/css/sourcefile_admin.css',)
        }
    
    def filename_display(self, obj):
        """Display filename as read-only label with truncation"""
        if obj.filename:
            display_name = obj.filename
            if len(display_name) > 40:
                display_name = display_name[:37] + "..."
            
            return format_html(
                '<span style="background-color: #e8f5e8; padding: 2px 6px; border-radius: 4px; font-size: 12px; max-width: 300px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="{}">📄 {}</span>', 
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
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">{}</span>',
                color, obj.file_type.upper()
            )
        return '-'
    file_type_display.short_description = 'Type (Auto-detected)'
    
    def document_title(self, obj):
        return obj.document.title[:50] + "..." if len(obj.document.title) > 50 else obj.document.title
    document_title.short_description = 'Document'
    
    def file_type_badge(self, obj):
        colors = {
            'pdf': '#dc3545',
            'doc': '#007bff',
            'docx': '#007bff',
            'txt': '#28a745',
            'html': '#fd7e14',
            'other': '#6c757d'
        }
        color = colors.get(obj.file_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">{}</span>',
            color, obj.file_type.upper()
        )
    file_type_badge.short_description = 'Type'
    
    def file_size_display(self, obj):
        return format_file_size(obj.file_size)
    file_size_display.short_description = 'Size'
    
    def description_preview(self, obj):
        if obj.description:
            preview = obj.description[:60] + "..." if len(obj.description) > 60 else obj.description
            return format_html('<div style="max-width: 200px;">{}</div>', preview)
        return '-'
    description_preview.short_description = 'Description'
    
    def link_display(self, obj):
        if obj.external_link:
            return format_html('<a href="{}" target="_blank" title="{}">🔗 Link</a>', obj.external_link, obj.external_link)
        return '-'
    link_display.short_description = 'External Link'
    
    def extract_filenames_from_pdfs(self, request, queryset):
        """Admin action to extract filenames from PDF metadata for selected files."""
        count = 0
        for source_file in queryset:
            if source_file.file_type == 'pdf' and source_file.file:
                try:
                    if source_file.recalculate_metadata():
                        count += 1
                except Exception as e:
                    self.message_user(
                        request,
                        f'Error processing {source_file.filename}: {str(e)}',
                        level='error'
                    )
        
        self.message_user(
            request,
            f'Successfully extracted filenames for {count} PDF file(s).'
        )
    extract_filenames_from_pdfs.short_description = "📄 Extract filenames from PDF metadata"
    
    def regenerate_filenames(self, request, queryset):
        """Admin action to regenerate filenames for selected files."""
        count = 0
        for source_file in queryset:
            if source_file.file:
                try:
                    if source_file.recalculate_metadata():
                        count += 1
                except Exception as e:
                    self.message_user(
                        request,
                        f'Error processing {source_file.filename}: {str(e)}',
                        level='error'
                    )
        
        self.message_user(
            request,
            f'Successfully regenerated filenames for {count} file(s).'
        )
    regenerate_filenames.short_description = "🔄 Regenerate filenames (all file types)"

