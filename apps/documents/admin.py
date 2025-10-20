from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.db import models
from django.forms import Textarea, TextInput
from .models import (
    Country, City,    
    Theme, Actor, BeneficiaryGroup, BeneficiaryGroupRaw, SDG, Document,
    DocumentTheme, DocumentActor, DocumentBeneficiaryGroupRaw, DocumentSDG,
    PracticalApplication, Commitment, CommitmentDetail, KPI, SourceFile, EUPolicy
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
    search_fields = ('label', 'description', 'category')
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
            'Digital Transformation & Strategy': '#28a745',
            'Technology & Innovation': '#007bff', 
            'Data & Governance': '#ffc107',
            'Inclusion & Social Development': '#6f42c1',
            'Regional & International Cooperation': '#fd7e14',
            'Uncategorised': '#6c757d'
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
            'Political Actors': '#dc3545',
            'Research and Innovation Actors': '#28a745',
            'Economic Actors': '#007bff',
            'Civil Society Actors': '#6f42c1',
            'Uncategorised': '#6c757d'
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
        colors = {
            'SMEs / Businesses': '#dc3545',
            'Start-ups / Innovators': '#28a745',
            'Large Corporations': '#007bff',
            'Researchers & Academia': '#6f42c1',
            'Students & Youth': '#fd7e14',
            'Migrants & Refugees': '#e83e8c',
            'Women & Girls': '#17a2b8',
            'Rural & Remote Communities': '#20c997',
            'Indigenous Peoples & Ethnic Groups': '#6610f2',
            'Persons with Disabilities': '#e74c3c',
            'General Citizens / Consumers': '#f39c12',
            'Public Sector / Governments': '#3498db',
            'Civil Society / NGOs': '#2ecc71',
            'Farmers & Primary Producers': '#27ae60',
            'Health Sector': '#e67e22',
            'Investors & Financial Actors': '#9b59b6',
            'Uncategorised': '#6c757d'
        }
        color = colors.get(obj.category, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">{}</span>',
            color, obj.category or 'N/A'
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

@admin.register(EUPolicy)
class EUPolicyAdmin(admin.ModelAdmin):
    list_display = ('name_display', 'description_preview', 'documents_count', 'created_at')
    list_display_links = ('name_display',)
    search_fields = ('name', 'description')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at', 'name_normalized', 'search_vector')
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description'),
            'classes': ('wide',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'name_normalized', 'search_vector'),
            'classes': ('collapse',)
        }),
    )
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 80})},
        models.CharField: {'widget': TextInput(attrs={'size': '60'})},
    }
    
    def name_display(self, obj):
        return format_html('<strong style="color: #007cba;">🇪🇺 {}</strong>', obj.name)
    name_display.short_description = 'Policy Name'
    
    def description_preview(self, obj):
        if obj.description:
            return obj.description[:100] + "..." if len(obj.description) > 100 else obj.description
        return "-"
    description_preview.short_description = 'Description Preview'
    
    def documents_count(self, obj):
        count = obj.documents.count()
        if count > 0:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">📄 {}</span>',
                count
            )
        return '-'
    documents_count.short_description = 'Documents'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related('documents')

# Enhanced Inline classes for Document
class SourceFileInline(admin.TabularInline):
    model = SourceFile
    extra = 0  # Change from 1 to 0 to avoid empty forms
    fields = ('file', 'filename', 'file_type', 'external_link', 'description')
    classes = ('collapse',)
    verbose_name = "Source File"
    verbose_name_plural = "Source Files"
    readonly_fields = ('file_size', 'upload_date')
    
    # Add these to prevent formset issues
    can_delete = True
    show_change_link = True
    
    # Override to ensure proper formset handling
    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        formset.validate_min = False
        formset.validate_max = False
        return formset

class DocumentThemeInline(admin.TabularInline):
    model = DocumentTheme
    extra = 0  # Change from 1 to 0
    fields = ('theme', 'is_top', 'relevance_score', 'justification')
    autocomplete_fields = ('theme',)
    classes = ('collapse',)
    verbose_name = "Theme Relationship"
    verbose_name_plural = "Theme Relationships"
    
    max_num = 50
    
    can_delete = True
    show_change_link = True

class DocumentActorInline(admin.TabularInline):
    model = DocumentActor
    extra = 0  # Change from 1 to 0
    fields = ('actor', 'is_top', 'relevance_score', 'justification')
    autocomplete_fields = ('actor',)
    classes = ('collapse',)
    verbose_name = "Actor Relationship"
    verbose_name_plural = "Actor Relationships"
    
    max_num = 50
    
    can_delete = True
    show_change_link = True

class DocumentSDGInline(admin.TabularInline):
    model = DocumentSDG
    extra = 0
    fields = ('sdg', 'relevance_score', 'justification')
    autocomplete_fields = ('sdg',)
    classes = ('collapse',)
    verbose_name = "SDG Relationship"
    verbose_name_plural = "SDG Relationships"
    
    max_num = 17  # Maximum 17 SDGs
    
    can_delete = True
    show_change_link = True

class PracticalApplicationInline(admin.StackedInline):
    model = PracticalApplication
    extra = 0  # Change from 1 to 0
    fields = ('description',)
    classes = ('collapse',)
    verbose_name = "Practical Application"
    verbose_name_plural = "Practical Applications"
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 3, 'cols': 80})},
    }
    
    max_num = 50
    
    can_delete = True
    show_change_link = True

class CommitmentInline(admin.StackedInline):
    model = Commitment
    extra = 0  # Change from 1 to 0
    fields = ('text',)
    classes = ('collapse',)
    verbose_name = "Commitment"
    verbose_name_plural = "Commitments"
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 3, 'cols': 80})},
    }
    
    max_num = 50
    
    can_delete = True
    show_change_link = True

class KPIInline(admin.TabularInline):
    model = KPI
    extra = 0  # Change from 1 to 0
    fields = ('metric_name', 'kpi_type', 'target_value', 'unit', 'sector')
    classes = ('collapse',)
    verbose_name = "Key Performance Indicator"
    verbose_name_plural = "Key Performance Indicators"
    
    can_delete = True
    show_change_link = True

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    # 0) Orden por defecto: scores de mayor a menor
    ordering = ('-score',)

    list_display = (
        'title_display', 'document_type_badge', 'event_format_badge', 'location_info', 'event_date',
        'ai_status_badge', 'human_status_badge', 'summary_file_link', 'source_files_count', 
        'score_display', 'created_by', 'created_at'
    )
    list_display_links = ('title_display',)
    list_filter = (
        'document_type', 'event_format', 'coverage_scope', 'legal_bindingness',
        'ai_check_status', 'human_check_status',
        ('event_date', admin.DateFieldListFilter),
        ('human_check_date', admin.DateFieldListFilter),
        'themes__category', 'actors__category', 'lead_country', 'event_country'
    )

    search_fields = (
        'title', 'executive_summary', 'admin_notes',
        'themes__label', 'actors__label'
    )
    date_hierarchy = 'event_date'
    filter_horizontal = ('beneficiary_groups', 'countries_involved', 'eu_policy_alignments')
    readonly_fields = ('created_at', 'updated_at', 'title_normalized', 'executive_summary_normalized', 'search_vector', 'ai_check_date')
    autocomplete_fields = ('created_by', 'event_city', 'event_country', 'lead_country', 'human_reviewer')
    list_per_page = 20
    
    actions = ['mark_as_human_reviewed', 'mark_as_needs_review']
    
    inlines = [
        SourceFileInline,
        DocumentThemeInline,
        DocumentActorInline,
        DocumentSDGInline,
        PracticalApplicationInline,
        CommitmentInline,
        KPIInline
    ]

    fieldsets = (
        ('📄 Basic Information', {
            'fields': ('title', 'executive_summary', 'event_date', 'event_format', 'summary_file'),
            'classes': ('wide',)
        }),
        ('📋 Document Classification', {
            'fields': ('document_type', 'coverage_scope', 'legal_bindingness'),
            'classes': ('wide',)
        }),
        ('🌍 Location & Countries', {
            'fields': ('event_city', 'event_country', 'lead_country', 'countries_involved'),
            'classes': ('wide',)
        }),
        ('⭐ Assessment', {
            'fields': ('score', 'extra'),
            'classes': ('wide',)
        }),
        ('✅ Review Status', {
            'fields': ('ai_check_status', 'ai_check_date', 'human_check_status', 'human_check_date', 'human_reviewer', 'human_notes'),
            'classes': ('wide',)
        }),
        ('🔗 Direct Relationships', {
            'fields': ('beneficiary_groups', 'eu_policy_alignments'),
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
        if obj.document_type:
            colors = {
                'dialogues_eu-lac': '#28a745',
                'dialogues_bilateral': '#007bff',
                'dialogues_eu-country': '#17a2b8',
                'dialogues_multilateral': '#ffc107',
                'agreements_eu-lac': '#dc3545',
                'agreements_bilateral': '#6f42c1',
                'agreements_multilateral': '#fd7e14',
                'agreements_country_specific': '#e83e8c'
            }
            color = colors.get(obj.document_type, '#6c757d')
            display_name = obj.get_document_type_display()
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">{}</span>',
                color, display_name
            )
        return '-'
    document_type_badge.short_description = 'Type'
    
    def event_format_badge(self, obj):
        if obj.event_format:
            colors = {
                'presencial': '#28a745',  # Green
                'virtual': '#007bff',     # Blue
                'hybrid': '#fd7e14'       # Orange
            }
            icons = {
                'presencial': '🏢',
                'virtual': '💻',
                'hybrid': '🔄'
            }
            color = colors.get(obj.event_format, '#6c757d')
            icon = icons.get(obj.event_format, '📅')
            return format_html(
                '{} <span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">{}</span>',
                icon, color, obj.event_format.title()
            )
        return '-'
    event_format_badge.short_description = 'Format'
    
    def ai_status_badge(self, obj):
        if obj.ai_check_status:
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">🤖 ✓ AI</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">🤖 ✗ AI</span>'
            )
    ai_status_badge.short_description = 'AI Status'
    ai_status_badge.admin_order_field = 'ai_check_status'
    
    def human_status_badge(self, obj):
        if obj.human_check_status:
            reviewer_info = f" by {obj.human_reviewer.username}" if obj.human_reviewer else ""
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;" title="Reviewed{} on {}">👤 ✓</span>',
                reviewer_info,
                obj.human_check_date.strftime('%Y-%m-%d %H:%M') if obj.human_check_date else 'Unknown'
            )
        else:
            return format_html(
                '<span style="background-color: #ffc107; color: black; padding: 2px 6px; border-radius: 10px; font-size: 10px;" title="Needs human review">👤 ⏳</span>'
            )
    human_status_badge.short_description = 'Human Status'
    human_status_badge.admin_order_field = 'human_check_status'
    
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
    score_display.admin_order_field = 'score'

    def summary_file_link(self, obj):
        if obj.summary_file:
            return format_html('<a href="{}" target="_blank">📄 Download</a>', obj.summary_file.url)
        return '-'
    summary_file_link.short_description = 'Summary File'

    def source_files_count(self, obj):
        count = obj.source_files.count()
        if count > 0:
            return format_html(
                '<span style="background-color: #17a2b8; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">📎 {}</span>',
                count
            )
        return '-'
    source_files_count.short_description = 'Files'

    def save_model(self, request, obj, form, change):
        # Set created_by if it's a new document
        if not change and not obj.created_by:
            obj.created_by = request.user

        # Handle manual human check status changes
        if change and 'human_check_status' in form.changed_data:
            if obj.human_check_status:
                # User checked the human review box - save first, then mark as reviewed
                super().save_model(request, obj, form, change)
                try:
                    obj.mark_human_reviewed(request.user)
                    self.message_user(
                        request,
                        f"✅ Document marked as human reviewed by {request.user.username}",
                        level='success'
                    )
                except Exception as e:
                    self.message_user(
                        request,
                        f"⚠️ Error updating review status: {str(e)}",
                        level='error'
                    )
            else:
                # User unchecked the box - clear review data and save
                obj.human_check_date = None
                obj.human_reviewer = None
                obj.human_notes = ""
                super().save_model(request, obj, form, change)
                self.message_user(
                    request,
                    "📝 Document marked as needing human review",
                    level='info'
                )
            return  # Exit early to prevent double save

        # Normal save - just save without modifications
        super().save_model(request, obj, form, change)
            
            # REMOVE THIS PART - it's automatically unchecking the human review
            # Check if human status was automatically reset and inform user
            # if (change and original_human_check and not obj.human_check_status 
            #     and 'human_check_status' not in form.changed_data):
            #     self.message_user(
            #         request,
            #         "⚠️ Document was automatically marked as needing human review because significant fields were modified.",
            #         level='warning'
            #     )

    def save_formset(self, request, form, formset, change):
        """Handle changes in inline formsets (themes, actors, etc.)"""
        super().save_formset(request, form, formset, change)
        
    def mark_as_human_reviewed(self, request, queryset):
        """Action to mark selected documents as human reviewed"""
        count = 0
        for doc in queryset:
            doc.mark_human_reviewed(request.user)
            count += 1
        
        self.message_user(
            request,
            f'Successfully marked {count} document(s) as human reviewed.'
        )
    mark_as_human_reviewed.short_description = "Mark selected documents as human reviewed"
    
    def mark_as_needs_review(self, request, queryset):
        """Action to mark selected documents as needing human review"""
        count = queryset.update(
            human_check_status=False,
            human_check_date=None,
            human_reviewer=None,
            human_notes=""
        )
        
        self.message_user(
            request,
            f'Successfully marked {count} document(s) as needing human review.'
        )
    mark_as_needs_review.short_description = "Mark selected documents as needing review"

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if not request.user.is_superuser:
            return [fs for fs in fieldsets if fs[0] not in ['👤 Admin Fields', '🏷️ Metadata']]
        return fieldsets

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            readonly.extend(['score', 'extra', 'ai_check_status', 'human_reviewer'])
        return readonly

    # 1) Pre-join these FKs in the changelist
    list_select_related = ('event_city', 'event_country', 'lead_country', 'created_by', 'human_reviewer')

    # 2) If you still need to prefetch M2M for any custom display, do it once here:
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return (
            qs
            .select_related('event_city', 'event_country', 'lead_country', 'created_by', 'human_reviewer')
            .select_related('event_city__country')
            .prefetch_related('source_files')
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

@admin.register(DocumentSDG)
class DocumentSDGAdmin(admin.ModelAdmin):
    list_display = ('document_title', 'sdg_display', 'relevance_score_badge', 'justification_preview', 'created_at')
    list_display_links = ('document_title',)
    list_filter = ('sdg__number', 'relevance_score', 'created_at')
    search_fields = ('document__title', 'sdg__label', 'justification')
    autocomplete_fields = ('document', 'sdg')
    readonly_fields = ('created_at', 'updated_at', 'justification_normalized', 'search_vector')
    list_per_page = 25
    
    fieldsets = (
        ('🔗 Relationship', {
            'fields': ('document', 'sdg'),
            'classes': ('wide',)
        }),
        ('⭐ Relevance', {
            'fields': ('relevance_score', 'justification'),
            'classes': ('wide',),
            'description': 'Relevance score from 0.0 (not relevant) to 1.0 (highly relevant)'
        }),
        ('🏷️ Metadata', {
            'fields': ('created_at', 'updated_at', 'justification_normalized', 'search_vector'),
            'classes': ('collapse',)
        }),
    )
    
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 80})},
        models.FloatField: {'widget': TextInput(attrs={'size': '10'})},
    }
    
    actions = ['set_high_relevance', 'set_medium_relevance', 'set_low_relevance', 'randomize_relevance']
    
    def document_title(self, obj):
        return obj.document.title[:50] + "..." if len(obj.document.title) > 50 else obj.document.title
    document_title.short_description = 'Document'
    
    def sdg_display(self, obj):
        return format_html(
            '<span style="background-color: #e83e8c; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">SDG {}</span> <strong>{}</strong>',
            obj.sdg.number, obj.sdg.label
        )
    sdg_display.short_description = 'SDG'
    
    def relevance_score_badge(self, obj):
        if obj.relevance_score is not None:
            # Color coding based on relevance
            if obj.relevance_score >= 0.8:
                color = '#28a745'  # Green - High
                icon = '🟢'
                level = 'High'
            elif obj.relevance_score >= 0.6:
                color = '#ffc107'  # Yellow - Medium
                icon = '🟡'
                level = 'Medium'
            else:
                color = '#dc3545'  # Red - Low
                icon = '🔴'
                level = 'Low'
            
            # Format the score before passing to format_html
            score_formatted = f'{obj.relevance_score:.3f}'
            percentage = int(obj.relevance_score * 100)
            
            return format_html(
                '{} <span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold;">{} ({}%)</span> <small style="color: {};">{}</small>',
                icon, color, score_formatted, percentage, color, level
            )
        return '-'
    relevance_score_badge.short_description = 'Relevance Score'
    relevance_score_badge.admin_order_field = 'relevance_score'
    
    def justification_preview(self, obj):
        if obj.justification:
            preview = obj.justification[:80] + "..." if len(obj.justification) > 80 else obj.justification
            return format_html('<div style="max-width: 250px;">{}</div>', preview)
        return '-'
    justification_preview.short_description = 'Justification'
    
    # Custom admin actions
    def set_high_relevance(self, request, queryset):
        """Set relevance to 0.9 (high)"""
        import random
        count = 0
        for obj in queryset:
            obj.relevance_score = round(random.uniform(0.85, 1.0), 2)
            obj.save(update_fields=['relevance_score'])
            count += 1
        self.message_user(request, f'Set {count} SDG link(s) to HIGH relevance (0.85-1.0)')
    set_high_relevance.short_description = "Set to HIGH relevance (0.85-1.0)"
    
    def set_medium_relevance(self, request, queryset):
        """Set relevance to 0.7 (medium)"""
        import random
        count = 0
        for obj in queryset:
            obj.relevance_score = round(random.uniform(0.6, 0.85), 2)
            obj.save(update_fields=['relevance_score'])
            count += 1
        self.message_user(request, f'Set {count} SDG link(s) to MEDIUM relevance (0.6-0.85)')
    set_medium_relevance.short_description = "Set to MEDIUM relevance (0.6-0.85)"
    
    def set_low_relevance(self, request, queryset):
        """Set relevance to 0.5 (low)"""
        import random
        count = 0
        for obj in queryset:
            obj.relevance_score = round(random.uniform(0.3, 0.6), 2)
            obj.save(update_fields=['relevance_score'])
            count += 1
        self.message_user(request, f'Set {count} SDG link(s) to LOW relevance (0.3-0.6)')
    set_low_relevance.short_description = "Set to LOW relevance (0.3-0.6)"
    
    def randomize_relevance(self, request, queryset):
        """Randomize relevance scores"""
        import random
        count = 0
        for obj in queryset:
            obj.relevance_score = round(random.uniform(0.5, 1.0), 2)
            obj.save(update_fields=['relevance_score'])
            count += 1
        self.message_user(request, f'Randomized {count} SDG link(s) relevance scores (0.5-1.0)')
    randomize_relevance.short_description = "Randomize relevance (0.5-1.0)"
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('document', 'sdg')

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

@admin.register(SourceFile)
class SourceFileAdmin(admin.ModelAdmin):
    list_display = ('filename_display', 'document_title', 'file_type_badge', 'file_size_display', 'link_display', 'upload_date', 'description_preview')
    list_display_links = ('filename_display',)
    list_filter = ('file_type', 'upload_date', 'document')
    search_fields = ('filename', 'description', 'document__title', 'external_link')
    autocomplete_fields = ('document',)
    readonly_fields = ('file_size', 'upload_date', 'created_at', 'updated_at')
    list_per_page = 25
    
    fieldsets = (
        ('📎 File Information', {
            'fields': ('document', 'file', 'filename', 'file_type'),
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
        models.TextField: {'widget': Textarea(attrs={'rows': 3, 'cols': 80})},
        models.CharField: {'widget': TextInput(attrs={'size': '60'})},
    }
    
    def filename_display(self, obj):
        return format_html('<strong style="color: #007cba;">📄 {}</strong>', obj.filename)
    filename_display.short_description = 'Filename'
    
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
        if obj.file_size:
            # Convert bytes to human readable format
            if obj.file_size < 1024:
                return f"{obj.file_size} B"
            elif obj.file_size < 1024 * 1024:
                return f"{obj.file_size / 1024:.1f} KB"
            else:
                return f"{obj.file_size / (1024 * 1024):.1f} MB"
        return '-'
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