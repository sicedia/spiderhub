"""
Documents Admin Package
Modular admin configuration for the documents app.

This package organizes admin classes into logical modules:
- taxonomies.py: Lookup/taxonomy models (Country, City, Theme, Actor, etc.)
- content.py: Content models (PracticalApplication, Commitment, KPI, SourceFile)
- documents.py: Document model and relationship models
- inlines.py: InlineModelAdmin classes for Document relationships
- utils.py: Helper functions for admin display formatting
- mixins.py: Shared mixins for common admin functionality
"""
from django.contrib import admin

# Configure admin site
admin.site.site_header = "Spider Document Management System"
admin.site.site_title = "Spider Admin"
admin.site.index_title = "Welcome to Spider Administration"

# Import and register all admin classes
# Taxonomies
from .taxonomies import (
    CountryAdmin, CityAdmin, ThemeAdmin, ActorAdmin,
    BeneficiaryGroupAdmin, BeneficiaryGroupRawAdmin,
    SDGAdmin, EUPolicyAdmin
)

# Content models
from .content import (
    PracticalApplicationAdmin, CommitmentAdmin, CommitmentDetailAdmin,
    KPIAdmin, SourceFileAdmin
)

# Document and relationship models
from .documents import (
    DocumentAdmin, DocumentThemeAdmin, DocumentActorAdmin,
    DocumentBeneficiaryGroupRawAdmin, DocumentSDGAdmin
)

# All admin classes are automatically registered via @admin.register decorator
# No need to explicitly register them here

__all__ = [
    # Admin classes (for reference, but not needed for registration)
    'CountryAdmin', 'CityAdmin', 'ThemeAdmin', 'ActorAdmin',
    'BeneficiaryGroupAdmin', 'BeneficiaryGroupRawAdmin',
    'SDGAdmin', 'EUPolicyAdmin',
    'PracticalApplicationAdmin', 'CommitmentAdmin', 'CommitmentDetailAdmin',
    'KPIAdmin', 'SourceFileAdmin',
    'DocumentAdmin', 'DocumentThemeAdmin', 'DocumentActorAdmin',
    'DocumentBeneficiaryGroupRawAdmin', 'DocumentSDGAdmin',
]

