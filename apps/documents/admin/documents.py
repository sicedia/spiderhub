"""
Document Admin Classes
Admin interfaces for Document model and its relationship models
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.db import models
from django.forms import Textarea, TextInput
from ..models import (
    Document, DocumentTheme, DocumentActor, DocumentBeneficiaryGroupRaw, DocumentSDG
)
from .inlines import (
    SourceFileInline, DocumentThemeInline, DocumentActorInline, DocumentSDGInline,
    PracticalApplicationInline, CommitmentInline, KPIInline
)
from .mixins import (
    TimestampReadonlyMixin, WideFormFieldOverridesMixin, StandardFormFieldOverridesMixin
)
from .filters import LeadCountryFilter, EventCountryFilter, YearFilter, ScoreRangeFilter


@admin.register(Document)
class DocumentAdmin(WideFormFieldOverridesMixin, admin.ModelAdmin):
    """
    Admin interface for Document model.
    
    This is the main admin interface for managing documents, including:
    - Basic document information (title, summary, dates)
    - Classification (type, scope, legal bindingness)
    - Location and country relationships
    - Review status (AI and human)
    - Related content (themes, actors, SDGs, commitments, KPIs, etc.)
    
    UI/UX Improvements:
    - Custom country filters (LeadCountryFilter, EventCountryFilter) that only show
      countries that actually have documents, preventing long dropdown lists
    - Year filter showing only years with documents
    - Score range filter (High/Medium/Low/None) for quick filtering
    - Improved inline organization (most important first, some expanded by default)
    - Enhanced search including country and city names
    - Better fieldset descriptions for guidance
    """
    ordering = ('-score', '-created_at')  # Secondary sort by creation date for consistency

    list_display = (
        'title_display', 'document_type_badge', 'event_format_badge', 'location_info', 'event_date',
        'ai_status_badge', 'human_status_badge', 'summary_file_link', 'source_files_count', 
        'score_display', 'created_by', 'created_at'
    )
    list_display_links = ('title_display',)
    list_filter = (
        # Document classification
        'document_type',
        'event_format',
        'coverage_scope',
        'legal_bindingness',
        # Review status
        'ai_check_status',
        'human_check_status',
        # Dates
        YearFilter,  # Custom filter showing only years with documents
        ('event_date', admin.DateFieldListFilter),
        ('human_check_date', admin.DateFieldListFilter),
        # Taxonomies
        'themes__category',
        'actors__category',
        # Countries - using custom filters that only show countries with documents
        LeadCountryFilter,
        EventCountryFilter,
        # Score
        ScoreRangeFilter,
    )
    search_fields = (
        'title', 'executive_summary', 'admin_notes',
        'themes__label', 'actors__label',
        'event_country__name', 'lead_country__name',  # Search by country names
        'event_city__name',  # Search by city names
    )
    date_hierarchy = 'event_date'
    filter_horizontal = ('beneficiary_groups', 'countries_involved', 'eu_policy_alignments')
    readonly_fields = (
        'created_at', 'updated_at', 'title_normalized', 'executive_summary_normalized',
        'search_vector', 'ai_check_date', 'human_check_date_display',
        'human_reviewer_display', 'created_by_display'
    )
    autocomplete_fields = ('created_by', 'event_city', 'event_country', 'lead_country', 'human_reviewer')
    list_per_page = 25  # More reasonable default
    list_max_show_all = 200  # Limit "Show all" to prevent performance issues
    
    actions = ['mark_as_human_reviewed', 'mark_as_needs_review', 'calculate_sdg_relevance_action']
    
    # Inlines ordered by importance and frequency of use
    inlines = [
        DocumentThemeInline,      # Most commonly used - themes
        DocumentActorInline,      # Frequently used - actors
        DocumentSDGInline,        # Important for analysis - SDGs
        CommitmentInline,          # Core content - commitments
        PracticalApplicationInline, # Content - applications
        KPIInline,                # Metrics - KPIs
        SourceFileInline,         # Files - less frequently edited
    ]

    fieldsets = (
        ('📄 Basic Information', {
            'fields': ('title', 'executive_summary', 'event_date', 'event_format', 'summary_file'),
            'classes': ('wide',),
            'description': 'Core document information including title, summary, and event details.'
        }),
        ('📋 Document Classification', {
            'fields': ('document_type', 'coverage_scope', 'legal_bindingness'),
            'classes': ('wide',),
            'description': 'Categorize the document by type, geographic scope, and legal bindingness.'
        }),
        ('🌍 Location & Countries', {
            'fields': ('event_city', 'event_country', 'lead_country', 'countries_involved'),
            'classes': ('wide',),
            'description': 'Geographic information: where the event took place, which country leads, and which countries are involved.'
        }),
        ('⭐ Assessment', {
            'fields': ('score', 'extra'),
            'classes': ('wide',),
            'description': 'Quality score and additional assessment data.'
        }),
        ('✅ Review Status', {
            'fields': ('ai_check_status', 'ai_check_date', 'human_check_status', 'human_notes'),
            'classes': ('wide',),
            'description': 'Track AI and human review status. Check human_check_status to mark as reviewed.'
        }),
        ('🔗 Direct Relationships', {
            'fields': ('beneficiary_groups', 'eu_policy_alignments'),
            'classes': ('wide',),
            'description': 'Many-to-many relationships. Use the inlines below for themes, actors, SDGs, commitments, and KPIs.'
        }),
        ('👤 Admin Fields', {
            'fields': ('created_by_display', 'admin_notes'),
            'classes': ('collapse',),
            'description': 'Administrative information and notes.'
        }),
        ('🏷️ Metadata', {
            'fields': (
                'created_at', 'updated_at', 'title_normalized', 'executive_summary_normalized',
                'search_vector', 'human_check_date_display', 'human_reviewer_display'
            ),
            'classes': ('collapse',),
            'description': 'System-generated metadata and search vectors. Do not edit manually.'
        }),
    )

    def title_display(self, obj):
        """Display document title with truncation"""
        title = obj.title[:60] + "..." if len(obj.title) > 60 else obj.title
        return format_html('<strong style="color: #007cba;">{}</strong>', title)
    title_display.short_description = 'Title'
    
    def document_type_badge(self, obj):
        """Display document type as colored badge"""
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
        """Display event format with icon and colored badge"""
        if obj.event_format:
            colors = {
                'presencial': '#28a745',
                'virtual': '#007bff',
                'hybrid': '#fd7e14'
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
        """Display AI review status badge"""
        if obj.ai_check_status:
            return mark_safe(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">🤖 ✓ AI</span>'
            )
        else:
            return mark_safe(
                '<span style="background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">🤖 ✗ AI</span>'
            )
    ai_status_badge.short_description = 'AI Status'
    ai_status_badge.admin_order_field = 'ai_check_status'
    
    def human_status_badge(self, obj):
        """Display human review status badge with reviewer info"""
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
        """Display event location (city and/or country)"""
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
        """Display document score with color-coded icon"""
        if obj.score is not None:
            if obj.score >= 80:
                color = '#28a745'
                icon = '🟢'
            elif obj.score >= 60:
                color = '#ffc107'
                icon = '🟡'
            else:
                color = '#dc3545'
                icon = '🔴'
            return format_html(
                '{} <span style="color: {}; font-weight: bold;">{}</span>',
                icon, color, obj.score
            )
        return '-'
    score_display.short_description = 'Score'
    score_display.admin_order_field = 'score'

    def summary_file_link(self, obj):
        """Display link to summary file if available"""
        if obj.summary_file:
            return format_html('<a href="{}" target="_blank">📄 Download</a>', obj.summary_file.url)
        return '-'
    summary_file_link.short_description = 'Summary File'

    def source_files_count(self, obj):
        """Display count of source files"""
        count = obj.source_files.count()
        if count > 0:
            return format_html(
                '<span style="background-color: #17a2b8; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">📎 {}</span>',
                count
            )
        return '-'
    source_files_count.short_description = 'Files'

    def save_model(self, request, obj, form, change):
        """Override save to handle created_by and human review status"""
        # Set created_by if it's a new document
        if not change and not obj.created_by:
            obj.created_by = request.user
        elif not change:
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

        # Normal save
        super().save_model(request, obj, form, change)

    def save_formset(self, request, form, formset, change):
        """Handle changes in inline formsets (themes, actors, etc.)"""
        super().save_formset(request, form, formset, change)
        
    def mark_as_human_reviewed(self, request, queryset):
        """Admin action to mark selected documents as human reviewed"""
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
        """Admin action to mark selected documents as needing human review"""
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
    
    def calculate_sdg_relevance_action(self, request, queryset):
        """Admin action to calculate SDG relevance scores using LLM"""
        from apps.documents.services.sdg_relevance_service import (
            process_batch_documents,
            validate_configuration
        )
        
        # Validate LLM configuration first
        is_valid, error_msg = validate_configuration()
        if not is_valid:
            self.message_user(
                request,
                f'❌ LLM configuration error: {error_msg}. '
                'Please configure your .env file with LLM credentials.',
                level='error'
            )
            return
        
        # Check if documents have SDG links
        documents_with_sdgs = queryset.filter(sdgs__isnull=False).distinct()
        
        if not documents_with_sdgs.exists():
            self.message_user(
                request,
                '⚠️ None of the selected documents have SDG links. '
                'Please link SDGs to documents first.',
                level='warning'
            )
            return
        
        count = documents_with_sdgs.count()
        
        if count != queryset.count():
            skipped = queryset.count() - count
            self.message_user(
                request,
                f'ℹ️ Skipping {skipped} document(s) with no SDG links.',
                level='info'
            )
        
        # Process documents
        try:
            self.message_user(
                request,
                f'🔄 Starting SDG relevance calculation for {count} document(s)...',
                level='info'
            )
            
            stats = process_batch_documents(documents_with_sdgs, force=False)
            
            # Display results
            if stats['success'] > 0:
                self.message_user(
                    request,
                    f'✅ Successfully processed {stats["success"]} SDG link(s) '
                    f'across {stats["documents_processed"]} document(s).',
                    level='success'
                )
            
            if stats['failed'] > 0:
                self.message_user(
                    request,
                    f'❌ Failed to process {stats["failed"]} SDG link(s). '
                    f'Check logs/failed_sdg_scores.log for details.',
                    level='error'
                )
            
            if stats['success'] == 0 and stats['failed'] == 0:
                self.message_user(
                    request,
                    '✓ All selected documents already have SDG relevance scores. '
                    'Use the management command with --force to recalculate.',
                    level='info'
                )
        
        except Exception as e:
            self.message_user(
                request,
                f'❌ Error during processing: {str(e)}',
                level='error'
            )
    
    calculate_sdg_relevance_action.short_description = "🤖 Calculate SDG relevance scores (LLM)"

    def get_fieldsets(self, request, obj=None):
        """Hide admin fields for non-superusers"""
        fieldsets = super().get_fieldsets(request, obj)
        if not request.user.is_superuser:
            return [fs for fs in fieldsets if fs[0] not in ['👤 Admin Fields', '🏷️ Metadata']]
        return fieldsets
    
    def get_list_display(self, request):
        """Customize list display based on user permissions"""
        list_display = list(super().get_list_display(request))
        # Non-superusers don't need to see created_by in list
        if not request.user.is_superuser and 'created_by' in list_display:
            list_display.remove('created_by')
        return list_display

    def get_readonly_fields(self, request, obj=None):
        """Add additional readonly fields for non-superusers"""
        readonly = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            readonly.extend(['score', 'extra', 'ai_check_status', 'human_reviewer'])
        return readonly

    # Optimize queryset for changelist
    list_select_related = ('event_city', 'event_country', 'lead_country', 'created_by', 'human_reviewer')

    def get_list_filter(self, request):
        """
        Override to ensure only our custom filters are used, not Django's automatic ForeignKey filters.
        """
        return self.list_filter
    
    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related"""
        qs = super().get_queryset(request)
        return (
            qs
            .select_related('event_city', 'event_country', 'lead_country', 'created_by', 'human_reviewer')
            .select_related('event_city__country')
            .prefetch_related('source_files')
        )
    
    def human_check_date_display(self, obj):
        """Display human check date with formatting"""
        if obj.human_check_date:
            return format_html(
                '<span style="background-color: #e8f5e8; padding: 2px 6px; border-radius: 4px; font-size: 12px;">📅 {}</span>',
                obj.human_check_date.strftime('%Y-%m-%d %H:%M')
            )
        return '-'
    human_check_date_display.short_description = 'Human Review Date'
    
    def human_reviewer_display(self, obj):
        """Display human reviewer with formatting"""
        if obj.human_reviewer:
            return format_html(
                '<span style="background-color: #e3f2fd; padding: 2px 6px; border-radius: 4px; font-size: 12px;">👤 {}</span>',
                obj.human_reviewer.username
            )
        return '-'
    human_reviewer_display.short_description = 'Human Reviewer'
    
    def created_by_display(self, obj):
        """Display created by user with formatting"""
        if obj.created_by:
            return format_html(
                '<span style="background-color: #f3e5f5; padding: 2px 6px; border-radius: 4px; font-size: 12px;">✍️ {}</span>',
                obj.created_by.username
            )
        return '-'
    created_by_display.short_description = 'Created By'


@admin.register(DocumentTheme)
class DocumentThemeAdmin(TimestampReadonlyMixin, admin.ModelAdmin):
    """Admin interface for DocumentTheme relationship model"""
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
            return mark_safe('<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">⭐ TOP</span>')
        return '-'
    is_top_badge.short_description = 'Priority'
    
    def relevance_score_display(self, obj):
        if obj.relevance_score:
            return format_html('<strong>{}</strong>', obj.relevance_score)
        return '-'
    relevance_score_display.short_description = 'Score'


@admin.register(DocumentActor)
class DocumentActorAdmin(TimestampReadonlyMixin, admin.ModelAdmin):
    """Admin interface for DocumentActor relationship model"""
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
            return mark_safe('<span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px;">⭐ TOP</span>')
        return '-'
    is_top_badge.short_description = 'Priority'
    
    def relevance_score_display(self, obj):
        if obj.relevance_score:
            return format_html('<strong>{}</strong>', obj.relevance_score)
        return '-'
    relevance_score_display.short_description = 'Score'


@admin.register(DocumentBeneficiaryGroupRaw)
class DocumentBeneficiaryGroupRawAdmin(TimestampReadonlyMixin, admin.ModelAdmin):
    """Admin interface for DocumentBeneficiaryGroupRaw relationship model"""
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
class DocumentSDGAdmin(TimestampReadonlyMixin, StandardFormFieldOverridesMixin, admin.ModelAdmin):
    """Admin interface for DocumentSDG relationship model"""
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
        """Display relevance score with color-coded badge"""
        if obj.relevance_score is not None:
            if obj.relevance_score >= 0.8:
                color = '#28a745'
                icon = '🟢'
                level = 'High'
            elif obj.relevance_score >= 0.6:
                color = '#ffc107'
                icon = '🟡'
                level = 'Medium'
            else:
                color = '#dc3545'
                icon = '🔴'
                level = 'Low'
            
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
    
    def set_high_relevance(self, request, queryset):
        """Set relevance to high (0.85-1.0)"""
        import random
        count = 0
        for obj in queryset:
            obj.relevance_score = round(random.uniform(0.85, 1.0), 2)
            obj.save(update_fields=['relevance_score'])
            count += 1
        self.message_user(request, f'Set {count} SDG link(s) to HIGH relevance (0.85-1.0)')
    set_high_relevance.short_description = "Set to HIGH relevance (0.85-1.0)"
    
    def set_medium_relevance(self, request, queryset):
        """Set relevance to medium (0.6-0.85)"""
        import random
        count = 0
        for obj in queryset:
            obj.relevance_score = round(random.uniform(0.6, 0.85), 2)
            obj.save(update_fields=['relevance_score'])
            count += 1
        self.message_user(request, f'Set {count} SDG link(s) to MEDIUM relevance (0.6-0.85)')
    set_medium_relevance.short_description = "Set to MEDIUM relevance (0.6-0.85)"
    
    def set_low_relevance(self, request, queryset):
        """Set relevance to low (0.3-0.6)"""
        import random
        count = 0
        for obj in queryset:
            obj.relevance_score = round(random.uniform(0.3, 0.6), 2)
            obj.save(update_fields=['relevance_score'])
            count += 1
        self.message_user(request, f'Set {count} SDG link(s) to LOW relevance (0.3-0.6)')
    set_low_relevance.short_description = "Set to LOW relevance (0.3-0.6)"
    
    def randomize_relevance(self, request, queryset):
        """Randomize relevance scores (0.5-1.0)"""
        import random
        count = 0
        for obj in queryset:
            obj.relevance_score = round(random.uniform(0.5, 1.0), 2)
            obj.save(update_fields=['relevance_score'])
            count += 1
        self.message_user(request, f'Randomized {count} SDG link(s) relevance scores (0.5-1.0)')
    randomize_relevance.short_description = "Randomize relevance (0.5-1.0)"
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('document', 'sdg')

