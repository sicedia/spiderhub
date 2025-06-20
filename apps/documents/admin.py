from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.db import models
from django.forms import Textarea, TextInput
from .models import (
    Country, City,    
    Theme, Actor, BeneficiaryGroup, BeneficiaryGroupRaw, SDG, Document,
    DocumentTheme, DocumentActor, DocumentBeneficiaryGroupRaw,
    PracticalApplication, Commitment, CommitmentDetail, KPI
)

# Custom admin site configuration
admin.site.site_header = "Spider Document Management System"
admin.site.site_title = "Spider Admin"
admin.site.index_title = "Welcome to Spider Administration"

# -----------------------------------------------------------------------------
# Register ISO Country & City models
# -----------------------------------------------------------------------------
@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('iso3', 'iso2', 'name', 'created_at')
    search_fields = ('iso3', 'iso2', 'name')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'created_at')
    list_display_links = ('name',)
    list_filter = ('country',)
    search_fields = ('name', 'country__name')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50

@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ('label_display', 'category_badge', 'description_preview', 'created_at')
    list_display_links = ('label_display',)
    list_filter = ('category', 'created_at')
    search_fields = ('label', 'description')
    ordering = ('category', 'label')
    readonly_fields = ('created_at', 'updated_at', 'label_normalized', 'search_vector')
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('label', 'category', 'description'),
            'classes': ('wide',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'label_normalized', 'search_vector'),
            'classes': ('collapse',)
        }),
    )
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 80})},
        models.CharField: {'widget': TextInput(attrs={'size': '60'})},
    }
    
    def label_display(self, obj):
        return format_html('<strong>{}</strong>', obj.label)
    label_display.short_description = 'Label'
    
    def category_badge(self, obj):
        colors = {
            'Environment': '#28a745',
            'Social': '#007bff', 
            'Economic': '#ffc107',
            'Governance': '#6f42c1'
        }
        color = colors.get(obj.category, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">{}</span>',
            color, obj.category
        )
    category_badge.short_description = 'Category'
    
    def description_preview(self, obj):
        if obj.description:
            return obj.description[:100] + "..." if len(obj.description) > 100 else obj.description
        return "-"
    description_preview.short_description = 'Description Preview'

@admin.register(Actor)
class ActorAdmin(admin.ModelAdmin):
    list_display = ('label_display', 'category_badge', 'description_preview', 'created_at')
    list_display_links = ('label_display',)
    list_filter = ('category', 'created_at')
    search_fields = ('label', 'description')
    ordering = ('category', 'label')
    readonly_fields = ('created_at', 'updated_at', 'label_normalized', 'search_vector')
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('label', 'category', 'description'),
            'classes': ('wide',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'label_normalized', 'search_vector'),
            'classes': ('collapse',)
        }),
    )
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 80})},
        models.CharField: {'widget': TextInput(attrs={'size': '60'})},
    }
    
    def label_display(self, obj):
        return format_html('<strong>{}</strong>', obj.label)
    label_display.short_description = 'Label'
    
    def category_badge(self, obj):
        colors = {
            'Government': '#dc3545',
            'NGO': '#28a745',
            'Private': '#007bff',
            'Academic': '#6f42c1',
            'International': '#fd7e14'
        }
        color = colors.get(obj.category, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">{}</span>',
            color, obj.category
        )
    category_badge.short_description = 'Category'
    
    def description_preview(self, obj):
        if obj.description:
            return obj.description[:100] + "..." if len(obj.description) > 100 else obj.description
        return "-"
    description_preview.short_description = 'Description Preview'

@admin.register(BeneficiaryGroup)
class BeneficiaryGroupAdmin(admin.ModelAdmin):
    list_display = ('label_display', 'category_badge', 'description_preview', 'created_at')
    list_display_links = ('label_display',)
    list_filter = ('category', 'created_at')
    search_fields = ('label', 'description')
    ordering = ('category', 'label')
    readonly_fields = ('created_at', 'updated_at', 'label_normalized', 'search_vector')
    list_per_page = 25
    
    def label_display(self, obj):
        return format_html('<strong>{}</strong>', obj.label)
    label_display.short_description = 'Label'
    
    def category_badge(self, obj):
        return format_html(
            '<span style="background-color: #17a2b8; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">{}</span>',
            obj.category
        )
    category_badge.short_description = 'Category'
    
    def description_preview(self, obj):
        if obj.description:
            return obj.description[:100] + "..." if len(obj.description) > 100 else obj.description
        return "-"
    description_preview.short_description = 'Description Preview'

@admin.register(BeneficiaryGroupRaw)
class BeneficiaryGroupRawAdmin(admin.ModelAdmin):
    list_display = ('name_display', 'created_at')
    list_display_links = ('name_display',)
    search_fields = ('name',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at', 'name_normalized', 'search_vector')
    list_per_page = 25
    
    def name_display(self, obj):
        return format_html('<strong>{}</strong>', obj.name)
    name_display.short_description = 'Name'

@admin.register(SDG)
class SDGAdmin(admin.ModelAdmin):
    list_display = ('number_badge', 'label_display', 'created_at')
    list_display_links = ('label_display',)
    search_fields = ('label',)
    ordering = ('number',)
    readonly_fields = ('created_at', 'updated_at', 'label_normalized', 'search_vector')
    list_per_page = 17  # All 17 SDGs fit on one page
    
    def number_badge(self, obj):
        return format_html(
            '<span style="background-color: #e83e8c; color: white; padding: 5px 10px; border-radius: 50%; font-weight: bold;">{}</span>',
            obj.number
        )
    number_badge.short_description = 'SDG #'
    
    def label_display(self, obj):
        return format_html('<strong>{}</strong>', obj.label)
    label_display.short_description = 'Label'

# Enhanced Inline classes for Document
class DocumentThemeInline(admin.TabularInline):
    model = DocumentTheme
    extra = 1
    fields = ('theme', 'is_top', 'relevance_score', 'justification')
    autocomplete_fields = ('theme',)
    classes = ('collapse',)
    verbose_name = "Theme Relationship"
    verbose_name_plural = "Theme Relationships"

class DocumentActorInline(admin.TabularInline):
    model = DocumentActor
    extra = 1
    fields = ('actor', 'is_top', 'relevance_score', 'justification')
    autocomplete_fields = ('actor',)
    classes = ('collapse',)
    verbose_name = "Actor Relationship"
    verbose_name_plural = "Actor Relationships"

class PracticalApplicationInline(admin.StackedInline):
    model = PracticalApplication
    extra = 1
    fields = ('description',)
    classes = ('collapse',)
    verbose_name = "Practical Application"
    verbose_name_plural = "Practical Applications"
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 3, 'cols': 80})},
    }

class CommitmentInline(admin.StackedInline):
    model = Commitment
    extra = 1
    fields = ('text',)
    classes = ('collapse',)
    verbose_name = "Commitment"
    verbose_name_plural = "Commitments"
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 3, 'cols': 80})},
    }

class KPIInline(admin.TabularInline):
    model = KPI
    extra = 1
    fields = ('metric_name', 'kpi_type', 'target_value', 'unit', 'sector')
    classes = ('collapse',)
    verbose_name = "Key Performance Indicator"
    verbose_name_plural = "Key Performance Indicators"

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    # 0) Orden por defecto: scores de mayor a menor
    ordering = ('-score',)

    list_display = (
        'title_display', 'document_type_badge', 'location_info', 'event_date',
        'summary_file_link', 'score_display', 'created_by', 'created_at'
    )
    list_display_links = ('title_display',)
    list_filter = (
        'document_type', 'coverage_scope', 'legal_bindingness',
        ('event_date', admin.DateFieldListFilter),
        'themes__category', 'actors__category'
    )

    search_fields = (
        'title', 'executive_summary',
        'themes__label', 'actors__label'
    )
    date_hierarchy = 'event_date'
    filter_horizontal = ('beneficiary_groups', 'sdgs')
    readonly_fields = ('created_at', 'updated_at', 'title_normalized', 'executive_summary_normalized', 'search_vector')
    autocomplete_fields = ('created_by', 'event_city', 'event_country')
    list_per_page = 20
    
    inlines = [
        DocumentThemeInline,
        DocumentActorInline,
        PracticalApplicationInline,
        CommitmentInline,
        KPIInline
    ]

    fieldsets = (
        ('📄 Basic Information', {
            'fields': ('title', 'executive_summary', 'event_date', 'summary_file'),
            'classes': ('wide',)
        }),
        ('📋 Document Classification', {
            'fields': ('document_type', 'coverage_scope', 'legal_bindingness'),
            'classes': ('wide',)
        }),
        ('🌍 Location', {
            'fields': ('event_city', 'event_country'),
            'classes': ('wide',)
        }),
        ('⭐ Assessment', {
            'fields': ('score', 'extra'),
            'classes': ('wide',)
        }),
        ('🔗 Direct Relationships', {
            'fields': ('beneficiary_groups', 'sdgs'),
            'classes': ('wide',)
        }),
        ('👤 Admin Fields', {
            'fields': ('created_by', 'admin_notes'),
            'classes': ('collapse',)
        }),
        ('🏷️ Metadata', {
            'fields': ('created_at', 'updated_at', 'title_normalized', 'executive_summary_normalized', 'search_vector'),
            'classes': ('collapse',)
        }),
    )
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 6, 'cols': 100})},
        models.CharField: {'widget': TextInput(attrs={'size': '80'})},
    }

    def title_display(self, obj):
        return format_html('<strong style="color: #007cba;">{}</strong>', obj.title[:60] + "..." if len(obj.title) > 60 else obj.title)
    title_display.short_description = 'Title'
    
    def document_type_badge(self, obj):
        colors = {
            'Policy': '#28a745',
            'Report': '#007bff',
            'Agreement': '#dc3545',
            'Plan': '#ffc107',
            'Law': '#6f42c1'
        }
        color = colors.get(obj.document_type, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">{}</span>',
            color, obj.document_type
        )
    document_type_badge.short_description = 'Type'
    
    def location_info(self, obj):
        event_location = ""
        if obj.event_city and obj.event_country:
            event_location = f"{obj.event_city}, {obj.event_country}"
        elif obj.event_city:
            event_location = str(obj.event_city)
        elif obj.event_country:
            event_location = str(obj.event_country)
        else:
            event_location = "-"
        
        return format_html('🏙️ {}', event_location)
    location_info.short_description = 'Location'
    
    def score_display(self, obj):
        if obj.score is not None:
            if obj.score >= 80:
                color = '#28a745'  # Green
                icon = '🟢'
            elif obj.score >= 60:
                color = '#ffc107'  # Yellow
                icon = '🟡'
            else:
                color = '#dc3545'  # Red
                icon = '🔴'
            return format_html(
                '{} <span style="color: {}; font-weight: bold;">{}</span>',
                icon, color, obj.score
            )
        return '-'
    score_display.short_description = 'Score'
    # 1) Permitir ordenarlo haciendo click en la cabecera
    score_display.admin_order_field = 'score'

    def summary_file_link(self, obj):
        if obj.summary_file:
            return format_html('<a href="{}" target="_blank">Download</a>', obj.summary_file.url)
        return '-'
    summary_file_link.short_description = 'Summary File'

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if not request.user.is_superuser:
            return [fs for fs in fieldsets if fs[0] not in ['👤 Admin Fields', '🏷️ Metadata']]
        return fieldsets

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            readonly.extend(['score', 'extra'])
        return readonly

    def save_model(self, request, obj, form, change):
        if not change and not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    # 1) Pre-join these FKs in the changelist
    list_select_related = ('event_city', 'event_country', 'created_by')

    # 2) If you still need to prefetch M2M for any custom display, do it once here:
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return (
            qs
            .select_related('event_city', 'event_country', 'created_by')
            .select_related('event_city__country')  # AÑADIR esta línea
            # .prefetch_related('themes', 'actors')  # only if you display those on list
        )

# Enhanced through models for direct editing
@admin.register(DocumentTheme)
class DocumentThemeAdmin(admin.ModelAdmin):
    list_display = ('document_title', 'theme_display', 'is_top_badge', 'relevance_score_display', 'created_at')
    list_display_links = ('document_title',)
    list_filter = ('is_top', 'theme__category', 'relevance_score')
    search_fields = ('document__title', 'theme__label', 'justification')
    autocomplete_fields = ('document', 'theme')
    readonly_fields = ('created_at', 'updated_at', 'justification_normalized', 'search_vector')
    list_per_page = 25
    
    def document_title(self, obj):
        return obj.document.title[:50] + "..." if len(obj.document.title) > 50 else obj.document.title
    document_title.short_description = 'Document'
    
    def theme_display(self, obj):
        return format_html('<strong style="color: #007cba;">{}</strong>', obj.theme.label)
    theme_display.short_description = 'Theme'
    
    def is_top_badge(self, obj):
        if obj.is_top:
            return format_html('<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">⭐ TOP</span>')
        return '-'
    is_top_badge.short_description = 'Priority'
    
    def relevance_score_display(self, obj):
        if obj.relevance_score:
            return format_html('<strong>{}</strong>', obj.relevance_score)
        return '-'
    relevance_score_display.short_description = 'Score'

@admin.register(DocumentActor)
class DocumentActorAdmin(admin.ModelAdmin):
    list_display = ('document_title', 'actor_display', 'is_top_badge', 'relevance_score_display', 'created_at')
    list_display_links = ('document_title',)
    list_filter = ('is_top', 'actor__category', 'relevance_score')
    search_fields = ('document__title', 'actor__label', 'justification')
    autocomplete_fields = ('document', 'actor')
    readonly_fields = ('created_at', 'updated_at', 'justification_normalized', 'search_vector')
    list_per_page = 25
    
    def document_title(self, obj):
        return obj.document.title[:50] + "..." if len(obj.document.title) > 50 else obj.document.title
    document_title.short_description = 'Document'
    
    def actor_display(self, obj):
        return format_html('<strong style="color: #dc3545;">{}</strong>', obj.actor.label)
    actor_display.short_description = 'Actor'
    
    def is_top_badge(self, obj):
        if obj.is_top:
            return format_html('<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">⭐ TOP</span>')
        return '-'
    is_top_badge.short_description = 'Priority'
    
    def relevance_score_display(self, obj):
        if obj.relevance_score:
            return format_html('<strong>{}</strong>', obj.relevance_score)
        return '-'
    relevance_score_display.short_description = 'Score'

@admin.register(DocumentBeneficiaryGroupRaw)
class DocumentBeneficiaryGroupRawAdmin(admin.ModelAdmin):
    list_display = ('document_title', 'raw_group_display', 'created_at')
    list_display_links = ('document_title',)
    search_fields = ('document__title', 'raw_group__name')
    autocomplete_fields = ('document', 'raw_group')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 25
    
    def document_title(self, obj):
        return obj.document.title[:50] + "..." if len(obj.document.title) > 50 else obj.document.title
    document_title.short_description = 'Document'
    
    def raw_group_display(self, obj):
        return format_html('<strong style="color: #17a2b8;">{}</strong>', obj.raw_group.name)
    raw_group_display.short_description = 'Beneficiary Group'

@admin.register(PracticalApplication)
class PracticalApplicationAdmin(admin.ModelAdmin):
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
class CommitmentAdmin(admin.ModelAdmin):
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
class CommitmentDetailAdmin(admin.ModelAdmin):
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
class KPIAdmin(admin.ModelAdmin):
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
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 80})},
        models.CharField: {'widget': TextInput(attrs={'size': '60'})},
    }
    
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