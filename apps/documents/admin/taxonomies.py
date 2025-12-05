"""
Taxonomy Admin Classes
Admin interfaces for lookup/taxonomy models (Country, City, Theme, Actor, etc.)
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db import models
from django.forms import Textarea, TextInput
from ..models import (
    Country, City, Theme, Actor, BeneficiaryGroup, BeneficiaryGroupRaw,
    SDG, EUPolicy
)
from .mixins import TimestampReadonlyMixin, StandardFormFieldOverridesMixin


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    """Admin interface for Country model"""
    list_display = ('iso3', 'iso2', 'name', 'created_at')
    search_fields = ('iso3', 'iso2', 'name')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    """Admin interface for City model"""
    list_display = ('name', 'country', 'created_at')
    list_display_links = ('name',)
    list_filter = ('country',)
    search_fields = ('name', 'country__name')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50


@admin.register(Theme)
class ThemeAdmin(TimestampReadonlyMixin, StandardFormFieldOverridesMixin, admin.ModelAdmin):
    """Admin interface for Theme model"""
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
class ActorAdmin(TimestampReadonlyMixin, StandardFormFieldOverridesMixin, admin.ModelAdmin):
    """Admin interface for Actor model"""
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
class BeneficiaryGroupAdmin(TimestampReadonlyMixin, admin.ModelAdmin):
    """Admin interface for BeneficiaryGroup model"""
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
class BeneficiaryGroupRawAdmin(TimestampReadonlyMixin, admin.ModelAdmin):
    """Admin interface for BeneficiaryGroupRaw model"""
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
class SDGAdmin(TimestampReadonlyMixin, admin.ModelAdmin):
    """Admin interface for SDG model"""
    list_display = ('number_badge', 'label_display', 'created_at')
    list_display_links = ('label_display',)
    search_fields = ('label',)
    ordering = ('number',)
    readonly_fields = ('created_at', 'updated_at', 'label_normalized', 'search_vector')
    list_per_page = 17
    
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
class EUPolicyAdmin(TimestampReadonlyMixin, StandardFormFieldOverridesMixin, admin.ModelAdmin):
    """Admin interface for EUPolicy model"""
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

