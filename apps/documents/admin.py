from django.contrib import admin
from .models import (
    Theme, Actor, BeneficiaryGroup, BeneficiaryGroupRaw, SDG, Document,
    DocumentTheme, DocumentActor, DocumentBeneficiaryGroupRaw,
    PracticalApplication, Commitment, CommitmentDetail, KPI
)

@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ('label', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('label', 'description')
    ordering = ('category', 'label')
    readonly_fields = ('created_at', 'updated_at', 'label_normalized', 'search_vector')

@admin.register(Actor)
class ActorAdmin(admin.ModelAdmin):
    list_display = ('label', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('label', 'description')
    ordering = ('category', 'label')
    readonly_fields = ('created_at', 'updated_at', 'label_normalized', 'search_vector')

@admin.register(BeneficiaryGroup)
class BeneficiaryGroupAdmin(admin.ModelAdmin):
    list_display = ('label', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('label', 'description')
    ordering = ('category', 'label')
    readonly_fields = ('created_at', 'updated_at', 'label_normalized', 'search_vector')

@admin.register(BeneficiaryGroupRaw)
class BeneficiaryGroupRawAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at', 'name_normalized', 'search_vector')

@admin.register(SDG)
class SDGAdmin(admin.ModelAdmin):
    list_display = ('number', 'label', 'created_at')
    search_fields = ('label',)
    ordering = ('number',)
    readonly_fields = ('created_at', 'updated_at', 'label_normalized', 'search_vector')

# Inline classes for Document
class DocumentThemeInline(admin.TabularInline):
    model = DocumentTheme
    extra = 0
    fields = ('theme', 'is_top', 'relevance_score', 'justification')
    autocomplete_fields = ('theme',)

class DocumentActorInline(admin.TabularInline):
    model = DocumentActor
    extra = 0
    fields = ('actor', 'is_top', 'relevance_score', 'justification')
    autocomplete_fields = ('actor',)

class PracticalApplicationInline(admin.TabularInline):
    model = PracticalApplication
    extra = 0
    fields = ('description',)

class CommitmentInline(admin.TabularInline):
    model = Commitment
    extra = 0
    fields = ('text',)

class KPIInline(admin.TabularInline):
    model = KPI
    extra = 0
    fields = ('metric_name', 'kpi_type', 'target_value', 'unit', 'sector')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'city', 'country', 'event_date', 'score', 'created_by', 'created_at'
    )
    list_filter = (
        'event_date', 'city', 'country', 'score',
        'themes__category', 'actors__category'
    )
    search_fields = (
        'title', 'executive_summary', 'city', 'country',
        'themes__label', 'actors__label'
    )
    date_hierarchy = 'event_date'
    filter_horizontal = ('beneficiary_groups', 'sdgs')
    readonly_fields = ('created_at', 'updated_at', 'title_normalized', 'executive_summary_normalized', 'search_vector')
    autocomplete_fields = ('created_by',)
    
    inlines = [
        DocumentThemeInline,
        DocumentActorInline,
        PracticalApplicationInline,
        CommitmentInline,
        KPIInline
    ]

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'executive_summary', 'event_date')
        }),
        ('Location', {
            'fields': ('city', 'country')
        }),
        ('Document Details', {
            'fields': ('score', 'extra')
        }),
        ('Direct Relationships', {
            'fields': ('beneficiary_groups', 'sdgs')
        }),
        ('Admin Fields', {
            'fields': ('created_by', 'admin_notes'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'title_normalized', 'executive_summary_normalized', 'search_vector'),
            'classes': ('collapse',)
        }),
    )

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if not request.user.is_superuser:
            # Remove admin-only fieldsets for non-superusers
            return [fs for fs in fieldsets if fs[0] not in ['Admin Fields', 'Metadata']]
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

# Register through models for direct editing
@admin.register(DocumentTheme)
class DocumentThemeAdmin(admin.ModelAdmin):
    list_display = ('document', 'theme', 'is_top', 'relevance_score', 'created_at')
    list_filter = ('is_top', 'theme__category')
    search_fields = ('document__title', 'theme__label', 'justification')
    autocomplete_fields = ('document', 'theme')
    readonly_fields = ('created_at', 'updated_at', 'justification_normalized', 'search_vector')

@admin.register(DocumentActor)
class DocumentActorAdmin(admin.ModelAdmin):
    list_display = ('document', 'actor', 'is_top', 'relevance_score', 'created_at')
    list_filter = ('is_top', 'actor__category')
    search_fields = ('document__title', 'actor__label', 'justification')
    autocomplete_fields = ('document', 'actor')
    readonly_fields = ('created_at', 'updated_at', 'justification_normalized', 'search_vector')

@admin.register(DocumentBeneficiaryGroupRaw)
class DocumentBeneficiaryGroupRawAdmin(admin.ModelAdmin):
    list_display = ('document', 'raw_group', 'created_at')
    search_fields = ('document__title', 'raw_group__name')
    autocomplete_fields = ('document', 'raw_group')
    readonly_fields = ('created_at', 'updated_at')

# Register individual models for the related objects
@admin.register(PracticalApplication)
class PracticalApplicationAdmin(admin.ModelAdmin):
    list_display = ('description_short', 'document', 'created_at')
    list_filter = ('document',)
    search_fields = ('description', 'document__title')
    autocomplete_fields = ('document',)
    readonly_fields = ('created_at', 'updated_at', 'description_normalized', 'search_vector')
    
    def description_short(self, obj):
        return obj.description[:50] + "..." if len(obj.description) > 50 else obj.description
    description_short.short_description = 'Description'

@admin.register(Commitment)
class CommitmentAdmin(admin.ModelAdmin):
    list_display = ('text_short', 'document', 'created_at')
    list_filter = ('document',)
    search_fields = ('text', 'document__title')
    autocomplete_fields = ('document',)
    readonly_fields = ('created_at', 'updated_at', 'text_normalized', 'search_vector')
    
    def text_short(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_short.short_description = 'Text'

@admin.register(CommitmentDetail)
class CommitmentDetailAdmin(admin.ModelAdmin):
    list_display = ('text_short', 'commitment_class', 'commitment', 'created_at')
    list_filter = ('commitment_class', 'commitment')
    search_fields = ('text', 'commitment_class', 'commitment__text')
    autocomplete_fields = ('commitment',)
    readonly_fields = ('created_at', 'updated_at', 'text_normalized', 'search_vector')
    
    def text_short(self, obj):
        return obj.text[:50] + "..." if len(obj.text) > 50 else obj.text
    text_short.short_description = 'Text'

@admin.register(KPI)
class KPIAdmin(admin.ModelAdmin):
    list_display = ('metric_name', 'kpi_type', 'target_value', 'unit', 'sector', 'document', 'created_at')
    list_filter = ('kpi_type', 'sector', 'document')
    search_fields = ('metric_name', 'kpi_text', 'sector', 'document__title')
    autocomplete_fields = ('document',)
    readonly_fields = ('created_at', 'updated_at', 'metric_name_normalized', 'kpi_text_normalized', 'search_vector')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('document', 'metric_name', 'kpi_text', 'kpi_type')
        }),
        ('Target & Measurement', {
            'fields': ('target_value', 'target_description', 'unit', 'timeframe', 'measurement_method')
        }),
        ('Implementation', {
            'fields': ('responsible_entity', 'sector')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'metric_name_normalized', 'kpi_text_normalized', 'search_vector'),
            'classes': ('collapse',)
        }),
    )