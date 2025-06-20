"""Django data‑model for SPIDERHUB processed‑document repository.
Each **Document** is the master entity produced by AI extraction.  
Taxonomies (Theme, Actor, BeneficiaryGroup, SDG) are de‑duplicated and re‑used
across documents.  Lists that repeat per‑document (e.g. commitments, KPIs)
are normalised into child tables.  Through‑tables allow extra metadata such as
`relevance_score` and `justification` for the *top* actors/themes feature.
"""

from django.db import models
from django.contrib.auth.models import User
from apps.core.models import BaseModel
from django.db.models import (
    Q, Count, F, IntegerField, OuterRef, Subquery, Value
)
from django.db.models.functions import Coalesce

# Importing necessary fields and indexes for full-text search
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex


# -----------------------------------------------------------------------------
#  Taxonomies (normalised, re‑usable across documents)
# ----------------------------------------------------------------------------

class Theme(BaseModel):
    """Main/Thematic taxonomy element (e.g. "Digital Connectivity")."""
    CATEGORY_CHOICES = [
        ("Digital Transformation & Strategy", "Digital Transformation & Strategy"),
        ("Technology & Innovation", "Technology & Innovation"),
        ("Data & Governance", "Data & Governance"),
        ("Inclusion & Social Development", "Inclusion & Social Development"),
        ("Regional & International Cooperation", "Regional & International Cooperation"),
        ("Uncategorised", "Uncategorised"),
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
        ("Political Actors", "Political Actors"),
        ("Research and Innovation Actors", "Research and Innovation Actors"),
        ("Economic Actors", "Economic Actors"),
        ("Civil Society Actors", "Civil Society Actors"),
        ("Uncategorised", "Uncategorised"),
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
        ("SMEs / Businesses", "SMEs / Businesses"),
        ("Start-ups / Innovators", "Start-ups / Innovators"),
        ("Large Corporations", "Large Corporations"),
        ("Researchers & Academia", "Researchers & Academia"),
        ("Students & Youth", "Students & Youth"),
        ("Migrants & Refugees", "Migrants & Refugees"),
        ("Women & Girls", "Women & Girls"),
        ("Rural & Remote Communities", "Rural & Remote Communities"),
        ("Indigenous Peoples & Ethnic Groups", "Indigenous Peoples & Ethnic Groups"),
        ("Persons with Disabilities", "Persons with Disabilities"),
        ("General Citizens / Consumers", "General Citizens / Consumers"),
        ("Public Sector / Governments", "Public Sector / Governments"),
        ("Civil Society / NGOs", "Civil Society / NGOs"),
        ("Farmers & Primary Producers", "Farmers & Primary Producers"),
        ("Health Sector", "Health Sector"),
        ("Investors & Financial Actors", "Investors & Financial Actors"),
        ("Uncategorised", "Uncategorised"),
    ]
    
    category = models.CharField(max_length=64, choices=CATEGORY_CHOICES, blank=True)  # Added choices and blank=True
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


# ---------------------------------------------------------------------------
# CORE DOCUMENT MODEL
# ---------------------------------------------------------------------------


class Document(BaseModel):
     """AI-extracted synopsis generated from one or more source documents."""
 
     title = models.CharField(max_length=300)
     event_date = models.DateField(null=True, blank=True)
 
     # Fichero de resumen asociado
     summary_file = models.FileField(
         upload_to='summaries/',  # carpeta en MEDIA_ROOT
         null=True,
         blank=True,
         help_text="Word with summary of the document (if available)."
     )
 
     document_type = models.CharField(
         max_length=200,
         choices=[
             ("dialogues_eu-lac", "Dialogues EU-LAC"),
             ("dialogues_bilateral", "Dialogues Bilateral"),
             ("dialogues_eu-country","Dialogues EU-Country"),
             ("dialogues_multilateral", "Dialogues multilateral"),
             ("agreements_eu-lac", "Agreements EU-LAC"),
             ("agreements_bilateral", "Agreements Bilateral"),
             ("agreements_multilateral", "Agreements Multilateral"),
             ("agreements_country_specific", "Agreements Country Specific"),
         ],
         blank=True, null=True
     )
     
     city = models.CharField(max_length=200, null=True, blank=True)
     country = models.CharField(max_length=200, null=True, blank=True)

     executive_summary = models.TextField(null=True, blank=True)
     score = models.PositiveSmallIntegerField(null=True, blank=True)
     extra = models.JSONField(default=dict, blank=True)

     # --- Many‑to‑many taxonomies ------------------------------------------------
     themes = models.ManyToManyField(Theme, through="DocumentTheme", related_name="documents")
     actors = models.ManyToManyField(Actor, through="DocumentActor", related_name="documents")

     beneficiary_groups = models.ManyToManyField(
         BeneficiaryGroup, related_name="documents", blank=True
     )
     beneficiary_groups_raw = models.ManyToManyField(
         BeneficiaryGroupRaw,
         through="DocumentBeneficiaryGroupRaw",
         related_name="documents",
         blank=True,
     )

     #legal characteristics 
     coverage_scope = models.CharField(
         max_length=200, null=True, blank=True,
         choices=[
             ("Regional", "Regional"),
             ("Bilateral", "Bilateral"),
             ("Multilateral", "Multilateral"),
             ("Global", "Global"),
             ("Sub-regional", "Sub-regional"),
             ("Uncategorised", "Uncategorised"),
         ]
     )
     legal_bindingness = models.CharField(
         max_length=200, null=True, blank=True,
         choices=[
             ("politically-binding", "Politically-binding"),
             ("legally-binding", "Legally-binding"),
             ("non-binding", "Non-Binding"),
             ("uncategorised", "Uncategorised"),
         ]
     )
     sdgs = models.ManyToManyField(SDG, related_name="documents", blank=True)

     # Admin fields
     created_by = models.ForeignKey(
         User, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents'
     )
     admin_notes = models.TextField(blank=True)

     # Search fields
     title_normalized = models.TextField(editable=False, null=True, blank=True)
     executive_summary_normalized = models.TextField(editable=False, null=True, blank=True)
     search_vector = SearchVectorField(null=True, editable=False)

     class Meta:
         unique_together = ("title", "event_date")
         ordering = ["-event_date", "title"]
         indexes = [
             models.Index(fields=["event_date"], name="doc_date_idx"),
             GinIndex(fields=['search_vector'], name='doc_search_vector_gin'),
             GinIndex(fields=['title_normalized'], opclasses=['gin_trgm_ops'], name='doc_title_norm_trgm_gin'),
             GinIndex(fields=['executive_summary_normalized'], opclasses=['gin_trgm_ops'], name='doc_exec_summary_norm_gin'),
         ]

     def __str__(self):
         return self.title

     def get_related_documents(self, top_n: int = 3):
         """
         Returns up to `top_n` distinct documents, ordered by the number of
         taxonomy elements they share with the current document.
         """

         # ------------------------------------------------------------------
         # 1. Cached IDs in lists (evaluated only once)
         # ------------------------------------------------------------------
         theme_ids = list(self.themes.values_list('id', flat=True))
         actor_ids = list(self.actors.values_list('id', flat=True))
         ben_ids = list(self.beneficiary_groups.values_list('id', flat=True))
         sdg_ids = list(self.sdgs.values_list('id', flat=True))

         # If the document has no taxonomy, return empty queryset
         if not any((theme_ids, actor_ids, ben_ids, sdg_ids)):
             return Document.objects.none()

         qs = Document.objects.exclude(pk=self.pk)

         # ------------------------------------------------------------------
         # 2. Subqueries per each through table
         # ------------------------------------------------------------------
         #   • Each subquery filters only by its own through table
         #   • COUNT(*) made inside: 1 single JOIN → O(1)
         #   • OuterRef('pk') links to the document in the main queryset
         # ------------------------------------------------------------------
         theme_cnt_sq = DocumentTheme.objects.filter(
             document_id=OuterRef('pk'),
             theme_id__in=theme_ids
         ).values('document_id'
                  ).annotate(c=Count('*')
                             ).values('c')

         actor_cnt_sq = DocumentActor.objects.filter(
             document_id=OuterRef('pk'),
             actor_id__in=actor_ids
         ).values('document_id').annotate(c=Count('*')).values('c')

         ben_cnt_sq = (
             Document.beneficiary_groups.through  # Automatically created through model
             .objects.filter(
                 document_id=OuterRef('pk'),
                 beneficiarygroup_id__in=ben_ids
             ).values('document_id').annotate(c=Count('*')).values('c')
         )

         sdg_cnt_sq = (
             Document.sdgs.through
             .objects.filter(
                 document_id=OuterRef('pk'),
                 sdg_id__in=sdg_ids
             ).values('document_id').annotate(c=Count('*')).values('c')
         )

         # ------------------------------------------------------------------
         # 3. Annotations and relevance score
         # ------------------------------------------------------------------
         qs = qs.annotate(
             same_themes=Coalesce(Subquery(theme_cnt_sq, output_field=IntegerField()), Value(0)),
             same_actors=Coalesce(Subquery(actor_cnt_sq, output_field=IntegerField()), Value(0)),
             same_bens=Coalesce(Subquery(ben_cnt_sq, output_field=IntegerField()), Value(0)),
             same_sdgs=Coalesce(Subquery(sdg_cnt_sq, output_field=IntegerField()), Value(0)),
         ).annotate(
             relevance=F('same_themes') + F('same_actors') + F('same_bens') + F('same_sdgs')
         ).filter(
             relevance__gt=0
         ).order_by(
             '-relevance',
             '-event_date',
         )[:top_n]

         return qs

     def get_agreement_types(self):
        """
        Return a list of distinct agreement_type values
        (i.e. commitment_class) linked to this document
        """

        return (
            CommitmentDetail.objects
            .filter(commitment__document=self)
            .values_list('commitment_class', flat=True)
            .distinct()
        )

# ---------------------------------------------------------------------------
# THROUGH / LINK TABLES WITH EXTRA METADATA
# ---------------------------------------------------------------------------


class DocumentTheme(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE)
    is_top = models.BooleanField(default=False)
    relevance_score = models.FloatField(null=True, blank=True)
    justification = models.TextField(null=True, blank=True)

    # Search fields
    justification_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        unique_together = ("document", "theme")
        indexes = [
            GinIndex(fields=['search_vector'], name='doc_theme_search_vector_gin'),
            GinIndex(fields=['justification_normalized'], opclasses=['gin_trgm_ops'], name='doc_theme_just_norm_gin'),
        ]


class DocumentActor(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    actor = models.ForeignKey(Actor, on_delete=models.CASCADE)
    is_top = models.BooleanField(default=False)
    relevance_score = models.FloatField(null=True, blank=True)
    justification = models.TextField(null=True, blank=True)

    # Search fields
    justification_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        unique_together = ("document", "actor")
        indexes = [
            GinIndex(fields=['search_vector'], name='doc_actor_search_vector_gin'),
            GinIndex(fields=['justification_normalized'], opclasses=['gin_trgm_ops'], name='doc_actor_just_norm_gin'),
        ]


class DocumentBeneficiaryGroupRaw(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    raw_group = models.ForeignKey(BeneficiaryGroupRaw, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("document", "raw_group")
        verbose_name = "Raw Beneficiary Link"


# ---------------------------------------------------------------------------
# CHILD ENTITIES UNIQUE PER DOCUMENT
# ---------------------------------------------------------------------------


class PracticalApplication(BaseModel):
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name="practical_applications"
    )
    description = models.TextField()

    # Search fields
    description_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        unique_together = ("document", "description")
        ordering = ["id"]
        indexes = [
            GinIndex(fields=['search_vector'], name='practical_search_gin'),
            GinIndex(fields=['description_normalized'], opclasses=['gin_trgm_ops'], name='practical_desc_gin'),
        ]

    def __str__(self):
        return self.description[:80]


class Commitment(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="commitments")
    text = models.TextField()

    # Search fields
    text_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        unique_together = ("document", "text")
        indexes = [
            GinIndex(fields=['search_vector'], name='commitment_search_vector_gin'),
            GinIndex(fields=['text_normalized'], opclasses=['gin_trgm_ops'], name='commitment_text_norm_gin'),
        ]

    def __str__(self):
        return self.text[:80]


class CommitmentDetail(BaseModel):
    commitment = models.ForeignKey(Commitment, on_delete=models.CASCADE, related_name="details")
    text = models.TextField()
    commitment_class = models.CharField(max_length=200, null=True, blank=True)

    # Search fields
    text_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        unique_together = ("commitment", "text")
        indexes = [
            GinIndex(fields=['search_vector'], name='commit_detail_search_gin'),
            GinIndex(fields=['text_normalized'], opclasses=['gin_trgm_ops'], name='commit_detail_text_gin'),
        ]

    def __str__(self):
        return self.text[:80]


class KPI(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="kpis")
    metric_name = models.CharField(max_length=200)
    kpi_text = models.TextField(null=True, blank=True)
    kpi_type = models.CharField(max_length=200, null=True, blank=True)
    target_value = models.CharField(max_length=200, null=True, blank=True)
    target_description = models.CharField(max_length=255, null=True, blank=True)
    unit = models.CharField(max_length=60, null=True, blank=True)
    timeframe = models.CharField(max_length=200, null=True, blank=True)
    measurement_method = models.CharField(max_length=255, null=True, blank=True)
    responsible_entity = models.CharField(max_length=255, null=True, blank=True)
    sector = models.CharField(max_length=200, null=True, blank=True)

    # Search fields
    metric_name_normalized = models.TextField(editable=False, null=True, blank=True)
    kpi_text_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        unique_together = ("document", "metric_name")
        ordering = ["metric_name"]
        indexes = [
            GinIndex(fields=['search_vector'], name='kpi_search_vector_gin'),
            GinIndex(fields=['metric_name_normalized'], opclasses=['gin_trgm_ops'], name='kpi_metric_name_norm_gin'),
            GinIndex(fields=['kpi_text_normalized'], opclasses=['gin_trgm_ops'], name='kpi_text_norm_gin'),
        ]

    def __str__(self):
        return f"{self.metric_name} ({self.document.title})"