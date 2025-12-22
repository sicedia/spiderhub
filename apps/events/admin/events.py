"""
Event Admin Classes
Admin interfaces for Event model and related models
"""
from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from ..models import (
    Organization, OrganizationMember,
    Event, EventLink,
    DocumentEvent, EventTheme, EventActor, EventSDG
)
from .inlines import EventLinkInline, DocumentEventInline


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """Admin interface for Organization model"""
    search_fields = ["name"]
    list_display = ["name", "is_verified", "created_at"]
    list_filter = ["is_verified", "created_at"]
    readonly_fields = ["created_at", "updated_at"]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'website', 'is_verified'),
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    """Admin interface for OrganizationMember model"""
    list_display = ["organization", "user", "group", "created_at"]
    list_filter = ["organization", "group", "created_at"]
    search_fields = [
        "organization__name", 
        "user__username", 
        "user__email", 
        "group__name"
    ]
    autocomplete_fields = ["organization", "user", "group"]
    readonly_fields = ["created_at", "updated_at"]
    
    fieldsets = (
        ('Membership', {
            'fields': ('organization', 'user', 'group'),
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """
    Admin interface for Event model.
    
    Features:
    - Superuser sees all events
    - Regular users see only events from their organizations
    - Only users with events.publish_event permission can publish
    """
    inlines = [EventLinkInline, DocumentEventInline]
    list_display = [
        "title_display", 
        "start_at", 
        "organization", 
        "is_published_badge", 
        "human_check_status_badge",
        "created_at"
    ]
    list_display_links = ("title_display",)
    list_filter = [
        "is_published", 
        "human_check_status", 
        "event_format", 
        "organization",
        "created_at"
    ]
    search_fields = ["title", "description"]
    autocomplete_fields = [
        "organization", 
        "city", 
        "country", 
        "created_by", 
        "human_reviewer"
    ]
    filter_horizontal = ["beneficiary_groups", "eu_policy_alignments"]
    readonly_fields = [
        "created_at", 
        "updated_at", 
        "title_normalized", 
        "description_normalized",
        "search_vector",
        "ai_check_status",
        "human_check_date",
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'start_at', 'end_at', 'event_format'),
            'description': 'Title is required. Description and dates are optional.',
        }),
        ('Location', {
            'fields': ('city', 'country'),
            'description': 'Select a city to auto-select its country. Both fields are optional.',
        }),
        ('Organization & Creator', {
            'fields': ('organization', 'created_by'),
            'description': 'Organization and creator are optional.',
        }),
        ('Publication Status', {
            'fields': ('is_published',),
        }),
        ('Taxonomies', {
            'fields': ('beneficiary_groups', 'eu_policy_alignments'),
            'description': 'Use inlines below for themes, actors, and SDGs. All taxonomies are optional.',
        }),
        ('Metadata', {
            'fields': (
                'created_at', 
                'updated_at', 
                'title_normalized', 
                'description_normalized',
                'search_vector'
            ),
            'classes': ('collapse',),
        }),
    )
    
    class Media:
        js = ('admin/js/city_country_auto_select.js',)

    def get_queryset(self, request):
        """
        Filter events by user's organizations (except superuser).
        Optimized with select_related and prefetch_related.
        """
        qs = super().get_queryset(request).select_related(
            'organization',
            'city',
            'country',
            'created_by',
            'human_reviewer'
        ).prefetch_related(
            'links',
            'document_links__document'
        )
        
        if request.user.is_superuser:
            return qs
        
        # Events from organizations where the user is a member
        org_ids = request.user.org_memberships.values_list("organization_id", flat=True)
        return qs.filter(organization_id__in=org_ids)

    def save_model(self, request, obj, form, change):
        """Validate permissions and organization membership"""
        if not obj.created_by:
            obj.created_by = request.user

        # If user is NOT superuser, validate permissions
        if not request.user.is_superuser:
            # Check publish permission
            if "is_published" in form.changed_data and obj.is_published:
                if not request.user.has_perm("events.publish_event"):
                    raise PermissionDenied("No tienes permisos para publicar eventos.")

            # Ensure user can only set organization they belong to
            if obj.organization_id:
                org_ids = set(
                    request.user.org_memberships.values_list("organization_id", flat=True)
                )
                if obj.organization_id not in org_ids:
                    raise PermissionDenied(
                        "No puedes crear/editar eventos fuera de tus organizaciones."
                    )

        super().save_model(request, obj, form, change)

    def title_display(self, obj):
        """Display event title with truncation"""
        title = obj.title[:60] + "..." if len(obj.title) > 60 else obj.title
        return format_html('<strong style="color: #007cba;">{}</strong>', title)
    title_display.short_description = 'Title'

    def is_published_badge(self, obj):
        """Display publication status badge"""
        if obj.is_published:
            return mark_safe(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; '
                'border-radius: 10px; font-size: 10px;">✓ Published</span>'
            )
        else:
            return mark_safe(
                '<span style="background-color: #ffc107; color: black; padding: 2px 6px; '
                'border-radius: 10px; font-size: 10px;">Draft</span>'
            )
    is_published_badge.short_description = 'Status'
    is_published_badge.admin_order_field = 'is_published'

    def human_check_status_badge(self, obj):
        """Display human review status badge"""
        if obj.human_check_status:
            reviewer_info = f" by {obj.human_reviewer.username}" if obj.human_reviewer else ""
            return format_html(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; '
                'border-radius: 10px; font-size: 10px;" title="Reviewed{}">👤 ✓</span>',
                reviewer_info
            )
        else:
            return format_html(
                '<span style="background-color: #ffc107; color: black; padding: 2px 6px; '
                'border-radius: 10px; font-size: 10px;" title="Needs human review">👤 ⏳</span>'
            )
    human_check_status_badge.short_description = 'Human Review'
    human_check_status_badge.admin_order_field = 'human_check_status'


@admin.register(EventTheme)
class EventThemeAdmin(admin.ModelAdmin):
    """Admin interface for EventTheme relationship model"""
    list_display = ['event_title', 'theme_display', 'is_top_badge', 'relevance_score_display']
    list_filter = ['is_top', 'theme__category', 'relevance_score']
    search_fields = ['event__title', 'theme__label', 'justification']
    autocomplete_fields = ['event', 'theme']
    readonly_fields = ['created_at', 'updated_at']
    
    def event_title(self, obj):
        return obj.event.title[:50] + "..." if len(obj.event.title) > 50 else obj.event.title
    event_title.short_description = 'Event'
    
    def theme_display(self, obj):
        return format_html('<strong style="color: #007cba;">{}</strong>', obj.theme.label)
    theme_display.short_description = 'Theme'
    
    def is_top_badge(self, obj):
        if obj.is_top:
            return mark_safe(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; '
                'border-radius: 10px; font-size: 10px;">⭐ TOP</span>'
            )
        return '-'
    is_top_badge.short_description = 'Priority'
    
    def relevance_score_display(self, obj):
        if obj.relevance_score:
            return format_html('<strong>{}</strong>', obj.relevance_score)
        return '-'
    relevance_score_display.short_description = 'Score'


@admin.register(EventActor)
class EventActorAdmin(admin.ModelAdmin):
    """Admin interface for EventActor relationship model"""
    list_display = ['event_title', 'actor_display', 'is_top_badge', 'relevance_score_display']
    list_filter = ['is_top', 'actor__category', 'relevance_score']
    search_fields = ['event__title', 'actor__label', 'justification']
    autocomplete_fields = ['event', 'actor']
    readonly_fields = ['created_at', 'updated_at']
    
    def event_title(self, obj):
        return obj.event.title[:50] + "..." if len(obj.event.title) > 50 else obj.event.title
    event_title.short_description = 'Event'
    
    def actor_display(self, obj):
        return format_html('<strong style="color: #dc3545;">{}</strong>', obj.actor.label)
    actor_display.short_description = 'Actor'
    
    def is_top_badge(self, obj):
        if obj.is_top:
            return mark_safe(
                '<span style="background-color: #28a745; color: white; padding: 2px 6px; '
                'border-radius: 10px; font-size: 10px;">⭐ TOP</span>'
            )
        return '-'
    is_top_badge.short_description = 'Priority'
    
    def relevance_score_display(self, obj):
        if obj.relevance_score:
            return format_html('<strong>{}</strong>', obj.relevance_score)
        return '-'
    relevance_score_display.short_description = 'Score'


@admin.register(EventSDG)
class EventSDGAdmin(admin.ModelAdmin):
    """Admin interface for EventSDG relationship model"""
    list_display = ['event_title', 'sdg_display', 'relevance_score_badge']
    list_filter = ['sdg__number', 'relevance_score']
    search_fields = ['event__title', 'sdg__label', 'justification']
    autocomplete_fields = ['event', 'sdg']
    readonly_fields = ['created_at', 'updated_at']
    
    def event_title(self, obj):
        return obj.event.title[:50] + "..." if len(obj.event.title) > 50 else obj.event.title
    event_title.short_description = 'Event'
    
    def sdg_display(self, obj):
        return format_html(
            '<span style="background-color: #e83e8c; color: white; padding: 3px 8px; '
            'border-radius: 12px; font-size: 11px; font-weight: bold;">SDG {}</span> <strong>{}</strong>',
            obj.sdg.number, obj.sdg.label
        )
    sdg_display.short_description = 'SDG'
    
    def relevance_score_badge(self, obj):
        if obj.relevance_score is not None:
            if obj.relevance_score >= 0.8:
                color = '#28a745'
                icon = '🟢'
            elif obj.relevance_score >= 0.6:
                color = '#ffc107'
                icon = '🟡'
            else:
                color = '#dc3545'
                icon = '🔴'
            
            return format_html(
                '{} <span style="background-color: {}; color: white; padding: 2px 8px; '
                'border-radius: 10px; font-size: 10px; font-weight: bold;">{:.3f}</span>',
                icon, color, obj.relevance_score
            )
        return '-'
    relevance_score_badge.short_description = 'Relevance'


@admin.register(DocumentEvent)
class DocumentEventAdmin(admin.ModelAdmin):
    """Admin interface for DocumentEvent relationship model"""
    list_display = ['document_title', 'event_title', 'role_badge', 'confidence']
    list_filter = ['role', 'confidence']
    search_fields = ['document__title', 'event__title', 'notes']
    autocomplete_fields = ['document', 'event']
    readonly_fields = ['created_at', 'updated_at']
    
    def document_title(self, obj):
        return obj.document.title[:50] + "..." if len(obj.document.title) > 50 else obj.document.title
    document_title.short_description = 'Document'
    
    def event_title(self, obj):
        return obj.event.title[:50] + "..." if len(obj.event.title) > 50 else obj.event.title
    event_title.short_description = 'Event'
    
    def role_badge(self, obj):
        colors = {
            'minutes': '#28a745',
            'agenda': '#007bff',
            'report': '#dc3545',
            'statement': '#6f42c1',
            'other': '#6c757d'
        }
        color = colors.get(obj.role, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; '
            'border-radius: 10px; font-size: 10px;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Role'

