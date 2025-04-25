from django.contrib import admin

from django.contrib import admin
from .models import Actor, Theme, Tag, Document, Location

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

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'date', 'created_by', 'created_at', 'is_ai_generated')
    list_filter = ('date', 'location', 'is_ai_generated', 'actors', 'themes', 'tags')
    search_fields = ('title', 'location', 'characteristics', 'practical_applications', 'resulting_commitments')
    date_hierarchy = 'date'
    filter_horizontal = ('actors', 'themes', 'tags')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'location', 'date')
        }),
        ('Content', {
            'fields': ('characteristics', 'practical_applications', 'resulting_commitments')
        }),
        ('Relationships', {
            'fields': ('actors', 'themes', 'tags')
        }),
        ('Files and Links', {
            'fields': ('file', 'url')
        }),
        ('Analysis and AI', {
            'fields': ('is_ai_generated', 'confidence_level'),
            'classes': ('collapse',)
        }),
        ('Admin Only', {
            'fields': ('admin_notes',),
            'classes': ('collapse',),
            'description': 'These fields are only visible to administrators.'
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if not request.user.is_superuser:
            # Remove the Admin Only fieldset for non-superusers
            return [fs for fs in fieldsets if fs[0] != 'Admin Only']
        return fieldsets
    
    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(super().get_readonly_fields(request, obj))
        if not request.user.is_superuser:
            # Make confidence_level readonly for non-superusers
            readonly_fields.append('confidence_level')
        return readonly_fields
    
    def save_model(self, request, obj, form, change):
        # Auto-assign the current user as the creator if not set
        if not change and not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)