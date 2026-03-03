"""
Taxonomy models - Reusable across documents
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex


class Country(BaseModel):
    """ISO 3166-1 country catalog.  Ej.: iso3='ECU', name='Ecuador'."""
    iso3 = models.CharField(max_length=3, unique=True)
    iso2 = models.CharField(
        max_length=2, unique=True, blank=True, null=True
    )
    name = models.CharField(max_length=120, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.iso3})'


class City(BaseModel):
    """Ciudad normalizada, enlazada a Country."""
    name = models.CharField(max_length=120)
    country = models.ForeignKey(
        Country, on_delete=models.CASCADE, related_name='cities'
    )

    class Meta:
        unique_together = ('name', 'country')
        ordering = ['name']

    def __str__(self):
        return f'{self.name}, {self.country.iso3}'


class Theme(BaseModel):
    """Main/Thematic taxonomy element (e.g. "Digital Connectivity")."""
    CATEGORY_CHOICES = [
        ("Digital Transformation & Strategy", _("Digital Transformation & Strategy")),
        ("Technology & Innovation", _("Technology & Innovation")),
        ("Data & Governance", _("Data & Governance")),
        ("Inclusion & Social Development", _("Inclusion & Social Development")),
        ("Regional & International Cooperation", _("Regional & International Cooperation")),
        ("Uncategorised", _("Uncategorised")),
    ]

    label = models.CharField(max_length=200, unique=True)
    category = models.CharField(max_length=200, choices=CATEGORY_CHOICES, blank=True)
    description = models.TextField(blank=True)

    # Search fields
    label_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        ordering = ["label"]
        indexes = [
            models.Index(fields=["label"]),
            GinIndex(fields=['search_vector'], name='theme_search_vector_gin'),
            GinIndex(fields=['label_normalized'], opclasses=['gin_trgm_ops'], name='theme_label_norm_trgm_gin'),
        ]

    def __str__(self):
        return self.label


class Actor(BaseModel):
    """Actor taxonomy element (Governments, NGOs, etc.)."""
    CATEGORY_CHOICES = [
        ("Political Actors", _("Political Actors")),
        ("Research and Innovation Actors", _("Research and Innovation Actors")),
        ("Economic Actors", _("Economic Actors")),
        ("Civil Society Actors", _("Civil Society Actors")),
        ("Uncategorised", _("Uncategorised")),
    ]

    label = models.CharField(max_length=200, unique=True)
    category = models.CharField(max_length=200, choices=CATEGORY_CHOICES, blank=True)
    description = models.TextField(blank=True)

    # Search fields
    label_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        ordering = ["label"]
        indexes = [
            models.Index(fields=["label"]),
            GinIndex(fields=['search_vector'], name='actor_search_vector_gin'),
            GinIndex(fields=['label_normalized'], opclasses=['gin_trgm_ops'], name='actor_label_norm_trgm_gin'),
        ]

    def __str__(self):
        return self.label


class BeneficiaryGroup(BaseModel):
    """Beneficiary taxonomy element (e.g. SMEs, Youth)."""
    CATEGORY_CHOICES = [
        ("SMEs / Businesses", _("SMEs / Businesses")),
        ("Start-ups / Innovators", _("Start-ups / Innovators")),
        ("Large Corporations", _("Large Corporations")),
        ("Researchers & Academia", _("Researchers & Academia")),
        ("Students & Youth", _("Students & Youth")),
        ("Migrants & Refugees", _("Migrants & Refugees")),
        ("Women & Girls", _("Women & Girls")),
        ("Rural & Remote Communities", _("Rural & Remote Communities")),
        ("Indigenous Peoples & Ethnic Groups", _("Indigenous Peoples & Ethnic Groups")),
        ("Persons with Disabilities", _("Persons with Disabilities")),
        ("General Citizens / Consumers", _("General Citizens / Consumers")),
        ("Public Sector / Governments", _("Public Sector / Governments")),
        ("Civil Society / NGOs", _("Civil Society / NGOs")),
        ("Farmers & Primary Producers", _("Farmers & Primary Producers")),
        ("Health Sector", _("Health Sector")),
        ("Investors & Financial Actors", _("Investors & Financial Actors")),
        ("Uncategorised", _("Uncategorised")),
    ]
    
    category = models.CharField(max_length=64, choices=CATEGORY_CHOICES, blank=True)
    label = models.CharField(max_length=128, unique=True)
    description = models.TextField(blank=True)

    # Search fields
    label_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        ordering = ["label"]
        indexes = [
            GinIndex(fields=['search_vector'], name='beneficiary_search_gin'),
            GinIndex(fields=['label_normalized'], opclasses=['gin_trgm_ops'], name='beneficiary_label_gin'),
        ]

    def __str__(self):
        return self.label


class BeneficiaryGroupRaw(BaseModel):
    """Stores *raw* beneficiary terms that do **not** belong to the predefined taxonomy."""

    name = models.CharField(max_length=255, unique=True)

    # Search fields
    name_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        indexes = [
            GinIndex(fields=['search_vector'], name='raw_ben_search_gin'),
            GinIndex(fields=['name_normalized'], opclasses=['gin_trgm_ops'], name='raw_ben_name_gin'),
        ]

    def __str__(self):
        return self.name


class SDG(BaseModel):
    """UN Sustainable Development Goal (1‑17)."""
    number = models.PositiveSmallIntegerField(unique=True, null=True, blank=True)
    label = models.CharField(max_length=200, unique=True)

    # Search fields
    label_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        ordering = ["number"]
        verbose_name = "SDG"
        verbose_name_plural = "SDGs"
        indexes = [
            GinIndex(fields=['search_vector'], name='sdg_search_vector_gin'),
            GinIndex(fields=['label_normalized'], opclasses=['gin_trgm_ops'], name='sdg_label_norm_trgm_gin'),
        ]

    def __str__(self):
        return self.label


class EUPolicy(BaseModel):
    """EU Policy Framework alignment options."""
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)

    # Search fields
    name_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        ordering = ["name"]
        verbose_name = "EU Policy"
        verbose_name_plural = "EU Policies"
        indexes = [
            GinIndex(fields=['search_vector'], name='eu_policy_search_vector_gin'),
            GinIndex(fields=['name_normalized'], opclasses=['gin_trgm_ops'], name='eu_policy_name_norm_gin'),
        ]

    def __str__(self):
        return self.name


class QualitativeIndicator(BaseModel):
    """
    Catalog of qualitative indicators for assessing digital cooperation documents.

    Indicators are organised across three analytical levels:
      - micro:  institutional practices and actor-level participation
      - meso:   project implementation and stakeholder collaboration
      - macro:  regional policy alignment, continuity, and impact
    """

    LEVEL_CHOICES = [
        ("micro", _("Micro")),
        ("meso", _("Meso")),
        ("macro", _("Macro")),
    ]

    DIMENSION_CHOICES = [
        ("engagement", _("Stakeholder Engagement")),
        ("policy", _("Policy Influence")),
        ("trust", _("Collaborative Trust")),
        ("inclusivity", _("Communication Inclusivity")),
        ("impact", _("Long-term Impact")),
        ("alignment", _("Regional Alignment")),
        ("continuity", _("Continuity of Practice")),
        ("representation", _("Institutional Representation")),
        ("diversity", _("Stakeholder Diversity")),
    ]

    code = models.CharField(max_length=80, unique=True, help_text="Stable machine-readable identifier, e.g. MICRO_STAKEHOLDER_DIVERSITY")
    label = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    dimension = models.CharField(max_length=20, choices=DIMENSION_CHOICES, blank=True)
    is_active = models.BooleanField(default=True, help_text="Inactive indicators are skipped during LLM processing")

    # Search fields
    label_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        ordering = ["level", "label"]
        verbose_name = "Qualitative Indicator"
        verbose_name_plural = "Qualitative Indicators"
        indexes = [
            GinIndex(fields=['search_vector'], name='qual_ind_search_vector_gin'),
            GinIndex(fields=['label_normalized'], opclasses=['gin_trgm_ops'], name='qual_ind_label_norm_gin'),
        ]

    def __str__(self):
        return f"[{self.level.upper()}] {self.label}"

