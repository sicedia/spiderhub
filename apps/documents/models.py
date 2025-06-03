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

class ThemeCategory(BaseModel):
    name = models.CharField(max_length=200, unique=True)
    
    def __str__(self):
        return self.name

class Theme(BaseModel):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(ThemeCategory, related_name='themes', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('name', 'category')

    def __str__(self):
        return f"{self.category.name} - {self.name}"

class ActorCategory(BaseModel):
    name = models.CharField(max_length=200, unique=True)
    
    def __str__(self):
        return self.name

class Actor(BaseModel):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(ActorCategory, related_name='actors', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('name', 'category')

    def __str__(self):
        return f"{self.category.name} - {self.name}"

class AgreementType(BaseModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class BeneficiaryCategory(BaseModel):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class BeneficiaryGroup(BaseModel):
    label = models.CharField(max_length=100)
    category = models.ForeignKey(BeneficiaryCategory, related_name='beneficiary_groups', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('label', 'category')

    def __str__(self):
        return f"{self.category.name} - {self.label}"

class Country(BaseModel):
    iso = models.CharField(max_length=3, unique=True)

    def __str__(self):
        return self.iso

class SdgGoal(BaseModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Document(BaseModel):
    title = models.CharField(max_length=255)
    executive_summary = models.TextField(blank=True)
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
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    #document type based in folder structure
    document_type = models.CharField(
        max_length=50,
        choices=[
            ('dialogue_eu_lac', 'Dialogues EU-LAC'),
            ('dialogue_bilateral', 'Dialogues Bilateral'),
            ('dialogue_multilateral', 'Dialogues Multilateral'),
            ('dialogue_eu_country', 'Dialogues EU-Country'),
            ('agreement_eu_lac', 'Agreements EU-LAC'),
            ('agreement_bilateral', 'Agreements Bilateral'),
            ('agreement_multilateral', 'Agreements Multilateral'),
            ('agreement_country_specific', 'Agreements Country Specific'),
            ('other', 'Other')
        ],
        default='other'
    )

    
    # Quality metrics
    faithfulness = models.IntegerField(null=True, blank=True)
    consistency = models.IntegerField(null=True, blank=True)
    completeness = models.IntegerField(null=True, blank=True)
    accuracy = models.IntegerField(null=True, blank=True)
    
    # Relationships
    actors = models.ManyToManyField(Actor, related_name="documents", blank=True)
    themes = models.ManyToManyField(Theme, related_name="documents", blank=True)
    agreement_types = models.ManyToManyField(AgreementType, related_name='documents', blank=True)
    beneficiary_groups = models.ManyToManyField(BeneficiaryGroup, related_name='documents', blank=True)
    countries = models.ManyToManyField(Country, related_name='documents', blank=True)
    sdg_alignments = models.ManyToManyField(SdgGoal, related_name='documents', blank=True)
    
    # Admin fields
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents'
    )
    admin_notes = models.TextField(blank=True)
    
    # Search fields
    title_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    def __str__(self):
        loc = self.location.name if self.location else "No location"
        return f"{self.title} ({loc}, {self.date})"

    class Meta:
        ordering = ['-date', 'title']
        indexes = [
            GinIndex(fields=['search_vector'], name='doc_search_vector_gin'),
            GinIndex(fields=['title_normalized'], opclasses=['gin_trgm_ops'], name='doc_title_norm_trgm_gin'),
        ]

class DocumentFile(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='documents/')
    url = models.URLField(blank=True, null=True)
    name = models.CharField(max_length=255, blank=True)
    
    def __str__(self):
        return f"{self.name or 'File'} - {self.document.title}"

class Characteristic(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='characteristics')
    text = models.TextField()

    class Meta:
        unique_together = ('document', 'text')

    def __str__(self):
        return self.text[:50]

class PracticalApplication(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='practical_applications')
    text = models.TextField()

    class Meta:
        unique_together = ('document', 'text')

    def __str__(self):
        return self.text[:50]

class Commitment(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='commitments')
    text = models.TextField()
    commitment_class = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ('document', 'text')

    def __str__(self):
        return f"{self.commitment_class}: {self.text[:50]}"

class KPI(BaseModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='kpis')
    kpi_text = models.TextField()
    kpi_type = models.CharField(max_length=50)
    metric_name = models.CharField(max_length=255)
    target_value = models.FloatField(null=True, blank=True)
    target_description = models.TextField(blank=True)
    unit = models.CharField(max_length=100, blank=True)
    baseline_value = models.FloatField(null=True, blank=True)
    timeframe = models.CharField(max_length=100, blank=True)
    measurement_method = models.TextField(blank=True)
    responsible_entity = models.CharField(max_length=255, blank=True)
    sector = models.CharField(max_length=100, blank=True)

    class Meta:
        unique_together = ('document', 'kpi_text')

    def __str__(self):
        return f"{self.metric_name} ({self.unit})"