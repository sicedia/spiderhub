from django.contrib import admin
from .models import (
    Location, ThemeCategory, Theme, ActorCategory, Actor, AgreementType, 
    BeneficiaryCategory, BeneficiaryGroup, Country, SdgGoal, Document, DocumentFile,
    Characteristic, PracticalApplication, Commitment, KPI
)

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)

@admin.register(ThemeCategory)
class ThemeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)

@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('name', 'category__name')
    autocomplete_fields = ('category',)
    ordering = ('category__name', 'name')

@admin.register(ActorCategory)
class ActorCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)

@admin.register(Actor)
class ActorAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('name', 'category__name')
    autocomplete_fields = ('category',)
    ordering = ('category__name', 'name')

@admin.register(AgreementType)
class AgreementTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)

@admin.register(BeneficiaryCategory)
class BeneficiaryCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)

@admin.register(BeneficiaryGroup)
class BeneficiaryGroupAdmin(admin.ModelAdmin):
    list_display = ('label', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('label', 'category__name')
    autocomplete_fields = ('category',)
    ordering = ('category__name', 'label')

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('iso', 'created_at')
    search_fields = ('iso',)
    ordering = ('iso',)

@admin.register(SdgGoal)
class SdgGoalAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)

# Inline classes for Document
class DocumentFileInline(admin.TabularInline):
    model = DocumentFile
    extra = 1
    fields = ('name', 'file', 'url')

class CharacteristicInline(admin.TabularInline):
    model = Characteristic
    extra = 0
    fields = ('text',)

class PracticalApplicationInline(admin.TabularInline):
    model = PracticalApplication
    extra = 0
    fields = ('text',)

class CommitmentInline(admin.TabularInline):
    model = Commitment
    extra = 0
    fields = ('text', 'commitment_class')

class KPIInline(admin.TabularInline):
    model = KPI
    extra = 0
    fields = ('kpi_text', 'kpi_type', 'metric_name', 'target_value', 'unit')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'location', 'date', 'status', 'document_type', 'score', 
        'legal_bindingness', 'coverage_scope', 'created_by', 'created_at'
    )
    list_filter = (
        'status', 'date', 'location', 'document_type', 'legal_bindingness', 'coverage_scope',
        'actors__category', 'themes__category', 'agreement_types',
        'countries', 'sdg_alignments'
    )
    search_fields = (
        'title', 'executive_summary', 'lead_country_iso',
        'actors__name', 'themes__name', 'characteristics__text',
        'practical_applications__text', 'commitments__text'
    )
    date_hierarchy = 'date'
    filter_horizontal = (
        'actors', 'themes', 'agreement_types', 
        'beneficiary_groups', 'countries', 'sdg_alignments'
    )
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('location', 'created_by')
    
    inlines = [
        DocumentFileInline,
        CharacteristicInline,
        PracticalApplicationInline,
        CommitmentInline,
        KPIInline
    ]

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'executive_summary', 'location', 'date', 'status', 'document_type')
        }),
        ('Document Details', {
            'fields': (
                'score', 'lead_country_iso', 'legal_bindingness', 
                'coverage_scope', 'review_schedule', 'start_date', 'end_date'
            )
        }),
        ('Quality Metrics', {
            'fields': ('faithfulness', 'consistency', 'completeness', 'accuracy'),
            'classes': ('collapse',)
        }),
        ('Relationships', {
            'fields': (
                'actors', 'themes', 'agreement_types', 
                'beneficiary_groups', 'countries', 'sdg_alignments'
            )
        }),
        ('Admin Fields', {
            'fields': ('created_by', 'admin_notes'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if not request.user.is_superuser:
            # Remove admin-only fieldsets for non-superusers
            return [fs for fs in fieldsets if fs[0] not in ['Admin Fields', 'Quality Metrics']]
        return fieldsets

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            readonly.extend(['score', 'faithfulness', 'consistency', 'completeness', 'accuracy'])
        return readonly

    def save_model(self, request, obj, form, change):
        if not change and not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

# Register individual models for the related objects
@admin.register(DocumentFile)
class DocumentFileAdmin(admin.ModelAdmin):
    list_display = ('name', 'document', 'created_at')
    list_filter = ('document',)
    search_fields = ('name', 'document__title')
    autocomplete_fields = ('document',)

@admin.register(Characteristic)
class CharacteristicAdmin(admin.ModelAdmin):
    list_display = ('text_short', 'document', 'created_at')
    list_filter = ('document',)
    search_fields = ('text', 'document__title')
    autocomplete_fields = ('document',)
    
    def text_short(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_short.short_description = 'Text'

@admin.register(PracticalApplication)
class PracticalApplicationAdmin(admin.ModelAdmin):
    list_display = ('text_short', 'document', 'created_at')
    list_filter = ('document',)
    search_fields = ('text', 'document__title')
    autocomplete_fields = ('document',)
    
    def text_short(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_short.short_description = 'Text'

@admin.register(Commitment)
class CommitmentAdmin(admin.ModelAdmin):
    list_display = ('text_short', 'commitment_class', 'document', 'created_at')
    list_filter = ('commitment_class', 'document')
    search_fields = ('text', 'commitment_class', 'document__title')
    autocomplete_fields = ('document',)
    
    def text_short(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_short.short_description = 'Text'

@admin.register(KPI)
class KPIAdmin(admin.ModelAdmin):
    list_display = ('metric_name', 'kpi_type', 'target_value', 'unit', 'sector', 'document', 'created_at')
    list_filter = ('kpi_type', 'sector', 'document')
    search_fields = ('metric_name', 'kpi_text', 'sector', 'document__title')
    autocomplete_fields = ('document',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('document', 'kpi_text', 'kpi_type', 'metric_name')
        }),
        ('Target & Measurement', {
            'fields': ('target_value', 'unit', 'target_description', 'baseline_value')
        }),
        ('Implementation', {
            'fields': ('timeframe', 'measurement_method', 'responsible_entity', 'sector')
        }),
    )