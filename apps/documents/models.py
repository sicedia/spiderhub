# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from apps.core.models import BaseModel

# Importing necessary fields and indexes for full-text search
from django.contrib.postgres.search import SearchVectorField
from django.db.models import Func, F, Value, TextField
from django.contrib.postgres.indexes import GinIndex

class Location(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name
class Actor(BaseModel):
    name = models.CharField(max_length=200, unique=True)

    def __str__(self):
        return self.name
class Theme(BaseModel):
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, null=True)  # Opcional para ampliar detalles

    def __str__(self):
        return self.name
class Tag(BaseModel):
    name = models.CharField(max_length=200)
    theme = models.ForeignKey(Theme, related_name='tags', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('name', 'theme')

    def __str__(self):
        return f"{self.theme.name} - {self.name}"
class Document(BaseModel):
    title = models.CharField(max_length=255)
    executive_summary = models.TextField(blank=True, help_text="Resumen ejecutivo")
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, related_name='documents'
    )
    date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('processing', 'Processing'),
            ('complete', 'Complete'),
            ('review', 'Needs Review'),
            ('error', 'Error')
        ],
        default='processing'
    )
    score = models.IntegerField(null=True, blank=True)
    lead_country_iso = models.CharField(max_length=3, blank=True, null=True)
    legal_bindingness = models.CharField(max_length=50, blank=True)
    coverage_scope = models.CharField(max_length=50, blank=True)
    review_schedule = models.CharField(max_length=50, blank=True)
    
    # relationships
    actors = models.ManyToManyField(Actor, related_name="documents", blank=True)
    themes = models.ManyToManyField(Theme, related_name="documents", blank=True)
    tags = models.ManyToManyField(Tag, related_name="documents", blank=True)
    agreement_types = models.ManyToManyField(
        'AgreementType', related_name='documents', blank=True
    )
    beneficiary_groups = models.ManyToManyField(
        'BeneficiaryGroup', related_name='documents', blank=True
    )
    countries = models.ManyToManyField(
        'Country', related_name='documents', blank=True
    )
    sdg_alignments = models.ManyToManyField(
        'SdgGoal', related_name='documents', blank=True
    )

    # Analysis and AI
    is_ai_generated = models.BooleanField(
        default=True, help_text="Indica si el análisis fue generado por IA"
    )
    confidence_level = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Nivel de confianza (solo administradores)"
    )
    admin_notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents'
    )

    def __str__(self):
        loc = self.location.name if self.location else "No location"
        return f"{self.title} ({loc}, {self.date})"

    # Normalized title for autocompletion and fuzzy search
    title_normalized = models.TextField(
        editable=False,
        null=True,
        blank=True,
        db_index=False
    )

    # Full-text search vector field
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        ordering = ['-date', 'title']
        indexes = [
            # GIN index for full-text search index
            GinIndex(fields=['search_vector'], name='doc_search_vector_gin'),

            # GIN Trigram index for title_normalized search (autocompletion and fuzzy search)
            GinIndex(fields=['title_normalized'], opclasses=['gin_trgm_ops'], name='doc_title_norm_trgm_gin'),
        ]


class DocumentFile(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='documents/')
    url = models.URLField(blank=True, null=True, help_text="URL relacionada con este archivo (si aplica)")
    name = models.CharField(max_length=255, blank=True, help_text="Nombre descriptivo del archivo")
    
    def __str__(self):
        return f"{self.name or 'Archivo'} - {self.document.title}"

# New detail models

class Characteristic(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='characteristics')
    text = models.TextField()

    def __str__(self):
        return self.text[:50]


class PracticalApplication(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='practical_applications')
    text = models.TextField()

    def __str__(self):
        return self.text[:50]


class ResultingCommitment(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='resulting_commitments')
    text = models.TextField()

    def __str__(self):
        return self.text[:50]


class Commitment(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='commitments')
    text = models.TextField()
    commitment_class = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.commitment_class}: {self.text[:50]}"


class AgreementType(BaseModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class BeneficiaryGroup(BaseModel):
    category = models.CharField(max_length=100)
    label = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.category} – {self.label}"


class Country(BaseModel):
    iso = models.CharField(max_length=3, unique=True)

    def __str__(self):
        return self.iso


class SdgGoal(BaseModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class KPITarget(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='kpis')
    kpi = models.CharField(max_length=255)
    target_value = models.FloatField()
    unit = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.kpi} ({self.unit})"