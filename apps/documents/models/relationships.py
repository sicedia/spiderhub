"""
Through/relationship models with extra metadata
"""
from django.db import models
from apps.core.models import BaseModel
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from .taxonomies import Theme, Actor, SDG, BeneficiaryGroupRaw


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

