"""
Through/relationship models with extra metadata
"""
from django.db import models
from apps.core.models import BaseModel
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from .taxonomies import Theme, Actor, SDG, BeneficiaryGroupRaw, QualitativeIndicator


class DocumentTheme(BaseModel):
    document = models.ForeignKey('Document', on_delete=models.CASCADE)
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
    document = models.ForeignKey('Document', on_delete=models.CASCADE)
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
    document = models.ForeignKey('Document', on_delete=models.CASCADE)
    raw_group = models.ForeignKey(BeneficiaryGroupRaw, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("document", "raw_group")
        verbose_name = "Raw Beneficiary Link"


class DocumentSDG(BaseModel):
    """Relación intermedia entre Document y SDG con relevancia."""
    document = models.ForeignKey("Document", on_delete=models.CASCADE)
    sdg = models.ForeignKey("SDG", on_delete=models.CASCADE)
    relevance_score = models.FloatField(null=True, blank=True, default=1.0)
    justification = models.TextField(null=True, blank=True)

    # Search fields
    justification_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        db_table = "documents_document_sdgs"  # Reuse existing table
        unique_together = ("document", "sdg")
        indexes = [
            GinIndex(fields=['search_vector'], name='doc_sdg_search_vector_gin'),
            GinIndex(fields=['justification_normalized'], opclasses=['gin_trgm_ops'], name='doc_sdg_just_norm_gin'),
        ]
        verbose_name = "Document–SDG Link"
        verbose_name_plural = "Document–SDG Links"

    def __str__(self):
        return f"{self.document.title[:50]} – {self.sdg.label} ({self.relevance_score or 0:.2f})"


class DocumentQualitativeIndicator(BaseModel):
    """
    Links a Document to a QualitativeIndicator with LLM-computed score,
    justification, and optional textual evidence extracted from the source files.

    Score scale:
      0.0–0.3  Not evident
      0.4–0.6  Partially evident
      0.7–0.9  Clearly evident
      1.0      Central focus
    """

    document = models.ForeignKey("Document", on_delete=models.CASCADE, related_name="qualitative_indicators")
    indicator = models.ForeignKey(QualitativeIndicator, on_delete=models.CASCADE, related_name="document_links")
    score = models.FloatField(null=True, blank=True, help_text="LLM-computed relevance score 0.0–1.0")
    justification = models.TextField(null=True, blank=True, help_text="LLM explanation for the score")
    evidence = models.TextField(null=True, blank=True, help_text="Key quote or passage extracted from the document")

    # Search fields
    justification_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        unique_together = ("document", "indicator")
        verbose_name = "Document–Qualitative Indicator Link"
        verbose_name_plural = "Document–Qualitative Indicator Links"
        indexes = [
            GinIndex(fields=['search_vector'], name='doc_qual_ind_search_gin'),
            GinIndex(fields=['justification_normalized'], opclasses=['gin_trgm_ops'], name='doc_qual_ind_just_gin'),
        ]

    def __str__(self):
        return f"{self.document.title[:50]} – {self.indicator.label} ({self.score or 0:.2f})"

