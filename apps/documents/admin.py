from django.contrib import admin
from .models import (
    Actor, Location, Theme, Tag, Document, DocumentFile,
    Characteristic, PracticalApplication, ResultingCommitment,
    Commitment, KPITarget, AgreementType, BeneficiaryGroup,
    Country, SdgGoal
)

@admin.register(Actor)
class ActorAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    model = Location
    extra = 1
    max_num = 10  # Maximum number of forms
    min_num = 0   # Minimum number of forms
    show_change_link = True  # Provides a link to edit the related object

class TagInline(admin.TabularInline):
    model = Tag
    extra = 1
    max_num = 10  # Maximum number of forms
    min_num = 0   # Minimum number of forms
    autocomplete_fields = ('theme',)  # Use autocomplete for foreign keys
    show_change_link = True  # Provides a link to edit the related object

@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')
    inlines = [TagInline]

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'theme')
    list_filter = ('theme',)
    search_fields = ('name',)
    autocomplete_fields = ('theme',)

class CharacteristicInline(admin.TabularInline):
    model = Characteristic
    extra = 1

class PracticalApplicationInline(admin.TabularInline):
    model = PracticalApplication
    extra = 1

class ResultingCommitmentInline(admin.TabularInline):
    model = ResultingCommitment
    extra = 1

class CommitmentInline(admin.TabularInline):
    model = Commitment
    extra = 1

class KPITargetInline(admin.TabularInline):
    model = KPITarget
    extra = 1

class DocumentFileInline(admin.TabularInline):
    model = DocumentFile
    extra = 1

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'location', 'date',
        'status', 'score',
        'created_by', 'created_at', 'is_ai_generated'
    )
    list_filter = (
        'date', 'location', 'status',
        'is_ai_generated',
        'actors', 'themes', 'tags',
        'agreement_types', 'beneficiary_groups',
        'countries', 'sdg_alignments'
    )
    search_fields = (
        'title', 'executive_summary',
        'characteristics__text',
        'practical_applications__text',
        'resulting_commitments__text',
        'commitments__text',
        'kpis__kpi'
    )
    date_hierarchy = 'date'
    filter_horizontal = (
        'actors', 'themes', 'tags',
        'agreement_types', 'beneficiary_groups',
        'countries', 'sdg_alignments'
    )
    readonly_fields = ('created_at', 'updated_at')
    inlines = [
        DocumentFileInline,
        CharacteristicInline,
        PracticalApplicationInline,
        ResultingCommitmentInline,
        CommitmentInline,
        KPITargetInline
    ]

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'location', 'date', 'status', 'score')
        }),
        ('Content', {
            'fields': (
                'executive_summary',
                # hiding raw lists in favor of inlines
            )
        }),
        ('Relationships', {
            'fields': (
                'actors', 'themes', 'tags',
                'agreement_types', 'beneficiary_groups',
                'countries', 'sdg_alignments'
            )
        }),
        ('Analysis and AI', {
            'fields': ('is_ai_generated', 'confidence_level'),
            'classes': ('collapse',)
        }),
        ('Admin Only', {
            'fields': ('admin_notes',),
            'classes': ('collapse',),
            'description': 'Visible solo para administradores'
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_fieldsets(self, request, obj=None):
        fsets = super().get_fieldsets(request, obj)
        if not request.user.is_superuser:
            return [fs for fs in fsets if fs[0] != 'Admin Only']
        return fsets

    def get_readonly_fields(self, request, obj=None):
        r = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            r.append('confidence_level')
        return r

    def save_model(self, request, obj, form, change):
        if not change and not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)