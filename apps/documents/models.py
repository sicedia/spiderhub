"""Django data‑model for SPIDERHUB processed‑document repository.
Each **Document** is the master entity produced by AI extraction.  
Taxonomies (Theme, Actor, BeneficiaryGroup, SDG) are de‑duplicated and re‑used
across documents.  Lists that repeat per‑document (e.g. commitments, KPIs)
are normalised into child tables.  Through‑tables allow extra metadata such as
`relevance_score` and `justification` for the *top* actors/themes feature.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel
from django.db.models import (
    Q, Count, F, IntegerField, OuterRef, Subquery, Value
)
from django.db.models.functions import Coalesce
from pathlib import Path

# Importing necessary fields and indexes for full-text search
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex


# -----------------------------------------------------------------------------
#  Taxonomies (normalised, re‑usable across documents)
# ----------------------------------------------------------------------------
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
    
# ---------------------------------------------------------------------------
# CORE DOCUMENT MODEL
# ---------------------------------------------------------------------------


class Document(BaseModel):
    """AI-extracted synopsis generated from one or more source documents."""

    title = models.CharField(max_length=500)
    event_date = models.DateField(null=True, blank=True)
    
    # Event format field
    event_format = models.CharField(
        max_length=20,
        choices=[
            ('presencial', _('Presencial')),
            ('virtual', _('Virtual')),
            ('hybrid', _('Hybrid')),
        ],
        null=True,
        blank=True,
        help_text=_("Format of the event (in-person, virtual, or hybrid)")
    )

    # Fichero de resumen asociado
    summary_file = models.FileField(
        upload_to='summaries/',  # carpeta en MEDIA_ROOT
        null=True,
        blank=True,
        help_text=_("Word with summary of the document (if available).")
    )

    document_type = models.CharField(
        max_length=200,
        choices=[
            ("dialogues_eu-lac", _("Dialogues EU-LAC")),
            ("dialogues_bilateral", _("Dialogues Bilateral")),
            ("dialogues_eu-country", _("Dialogues EU-Country")),
            ("dialogues_multilateral", _("Dialogues multilateral")),
            ("agreements_eu-lac", _("Agreements EU-LAC")),
            ("agreements_bilateral", _("Agreements Bilateral")),
            ("agreements_multilateral", _("Agreements Multilateral")),
            ("agreements_country_specific", _("Agreements Country Specific")),
        ],
        blank=True, null=True
    )
    
    event_city    = models.ForeignKey(City,     null=True, blank=True, on_delete=models.SET_NULL)
    event_country = models.ForeignKey(Country,  null=True, blank=True, on_delete=models.SET_NULL)
    
    lead_country  = models.ForeignKey(         
        Country, null=True, blank=True, on_delete=models.SET_NULL, related_name="lead_documents"
    )
    
    countries_involved = models.ManyToManyField(  
        Country, related_name="mentioned_in_documents", blank=True
    )

    executive_summary = models.TextField(null=True, blank=True)
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    extra = models.JSONField(default=dict, blank=True)

    # --- Review status fields ------------------------------------------------
    ai_check_status = models.BooleanField(
        default=True,
        help_text="AI processing completed successfully"
    )
    ai_check_date = models.DateTimeField(auto_now_add=True)
    
    human_check_status = models.BooleanField(
        default=False,
        help_text="Human review completed"
    )
    human_check_date = models.DateTimeField(null=True, blank=True)
    human_reviewer = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_documents',
        help_text="User who completed human review"
    )
    human_notes = models.TextField(
        blank=True,
        help_text="Notes added by human reviewer during review process"
    )

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
            ("Regional", _("Regional")),
            ("Bilateral", _("Bilateral")),
            ("Multilateral", _("Multilateral")),
            ("Global", _("Global")),
            ("Sub-regional", _("Sub-regional")),
            ("Uncategorised", _("Uncategorised")),
        ]
    )
    legal_bindingness = models.CharField(
        max_length=200, null=True, blank=True,
        choices=[
            ("politically-binding", _("Politically-binding")),
            ("legally-binding", _("Legally-binding")),
            ("non-binding", _("Non-Binding")),
            ("uncategorised", _("Uncategorised")),
        ]
    )
    eu_policy_alignments = models.ManyToManyField(
        EUPolicy, 
        related_name="documents", 
        blank=True,
        help_text="EU policy framework alignments"
    )
    sdgs = models.ManyToManyField(SDG, through="DocumentSDG", related_name="documents", blank=True)

    # Admin fields
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents', blank=True
    )
    admin_notes = models.TextField(blank=True, null=True, help_text="Admin notes for internal use")

    # Search fields
    title_normalized = models.TextField(editable=False, null=True, blank=True)
    executive_summary_normalized = models.TextField(editable=False, null=True, blank=True)
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        unique_together = ("title", "event_date")
        ordering = ["-event_date", "title"]
        indexes = [
            models.Index(fields=["event_date"], name="doc_date_idx"),
            models.Index(fields=["ai_check_status"], name="doc_ai_check_idx"),
            models.Index(fields=["human_check_status"], name="doc_human_check_idx"),
            GinIndex(fields=['search_vector'], name='doc_search_vector_gin'),
            GinIndex(fields=['title_normalized'], opclasses=['gin_trgm_ops'], name='doc_title_norm_trgm_gin'),
            GinIndex(fields=['executive_summary_normalized'], opclasses=['gin_trgm_ops'], name='doc_exec_summary_norm_gin'),
        ]

    def save(self, *args, **kwargs):
        # Check if this is a new instance or if significant fields have changed
        is_new = self.pk is None
        significant_changes = False
        
        if not is_new:
            # Get the current instance from database to compare
            try:
                old_instance = Document.objects.get(pk=self.pk)
                
                # Define fields that require human re-review when changed
                significant_fields = [
                    'title', 'executive_summary', 'document_type', 'event_format',
                    'coverage_scope', 'legal_bindingness', 'event_date', 'event_city',
                    'event_country', 'lead_country', 'score'
                ]
                
                # Check if any significant field has changed
                for field in significant_fields:
                    old_value = getattr(old_instance, field)
                    new_value = getattr(self, field)
                    
                    # Simple comparison that handles None values
                    if old_value != new_value:
                        significant_changes = True
                        # Debug logging (remove in production)
                        print(f"DEBUG: Field '{field}' changed from '{old_value}' to '{new_value}'")
                        break
                        
            except Document.DoesNotExist:
                significant_changes = True
        
        # If there are significant changes and document was previously human-reviewed,
        # reset human review status (but preserve human_notes and human_reviewer)
        if significant_changes and self.human_check_status:
            print(f"DEBUG: Resetting human review status for document {self.id}")
            self.human_check_status = False
            self.human_check_date = None
            # Keep human_reviewer and human_notes unchanged
        elif significant_changes:
            print(f"DEBUG: Significant changes detected but document {self.id} was not human-reviewed")
        elif self.human_check_status:
            print(f"DEBUG: Document {self.id} is human-reviewed but no significant changes detected")
        
        super().save(*args, **kwargs)

    def mark_human_reviewed(self, user):
        """Mark document as reviewed by human"""
        from django.utils import timezone
        self.human_check_status = True
        self.human_check_date = timezone.now()
        self.human_reviewer = user
        self.save(update_fields=['human_check_status', 'human_check_date', 'human_reviewer'])

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
# SOURCE FILES
# ---------------------------------------------------------------------------

class SourceFile(BaseModel):
    """Source files associated with a document."""
    document = models.ForeignKey(
        Document, 
        on_delete=models.CASCADE, 
        related_name="source_files"
    )
    file = models.FileField(
        upload_to='source_files/',
        help_text="Original source file (PDF, Word, etc.)"
    )
    filename = models.CharField(
        max_length=255,
        help_text="Original filename"
    )
    file_type = models.CharField(
        max_length=50,
        choices=[
            ('pdf', 'PDF'),
            ('doc', 'Word Document'),
            ('docx', 'Word Document (DOCX)'),
            ('txt', 'Text File'),
            ('html', 'HTML'),
            ('other', 'Other'),
        ],
        default='other'
    )
    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the source file"
    )
    external_link = models.URLField(
        blank=True,
        null=True,
        help_text="External link to the source file (if applicable)"
    )
    upload_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['upload_date']
        unique_together = ('document', 'filename')
    
    def __str__(self):
        return f"{self.filename} ({self.document.title})"
    
    def save(self, *args, **kwargs):
        # Check if this is a new instance or if the file has changed
        is_new = self.pk is None
        file_changed = False
        
        if not is_new:
            # Get the current instance from database to compare
            try:
                old_instance = SourceFile.objects.get(pk=self.pk)
                file_changed = old_instance.file != self.file
            except SourceFile.DoesNotExist:
                file_changed = True
        
        # Auto-populate file_size
        if self.file:
            self.file_size = self.file.size
            
        # Auto-detect file_type from extension (always recalculate if file changed or is new)
        if self.file and (is_new or file_changed or not self.file_type or self.file_type == 'other'):
            extension = self.file.name.split('.')[-1].lower()
            type_mapping = {
                'pdf': 'pdf',
                'doc': 'doc',
                'docx': 'docx',
                'txt': 'txt',
                'html': 'html',
                'htm': 'html'
            }
            self.file_type = type_mapping.get(extension, 'other')
        
        # Auto-populate filename with smart extraction (always recalculate if file changed or is new)
        if self.file and (is_new or file_changed or not self.filename):
            original_filename = self.file.name.split('/')[-1]
            
            # For PDF files, try to extract a meaningful filename
            if self.file_type == 'pdf':
                try:
                    from .services.pdf_metadata_extractor import generate_smart_filename
                    suggested_name = generate_smart_filename(self.file.path, original_filename)
                    # Keep the original extension
                    file_extension = Path(original_filename).suffix
                    self.filename = f"{suggested_name}{file_extension}"
                except Exception as e:
                    # Fallback to original filename if extraction fails
                    self.filename = original_filename
            else:
                # For non-PDF files, use the original filename
                self.filename = original_filename
        
        super().save(*args, **kwargs)
    
    def recalculate_metadata(self):
        """
        Force recalculation of filename and file_type based on current file.
        Useful for updating existing files when needed.
        """
        if not self.file:
            return False
        
        try:
            # Force recalculation by temporarily clearing the fields
            old_filename = self.filename
            old_file_type = self.file_type
            
            # Clear fields to trigger recalculation
            self.filename = None
            self.file_type = 'other'
            
            # Save to trigger recalculation
            self.save()
            
            # Log the change if there was one
            if old_filename != self.filename or old_file_type != self.file_type:
                return True
            
            return False
            
        except Exception as e:
            # Restore original values if something went wrong
            self.filename = old_filename
            self.file_type = old_file_type
            raise e


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


# ---------------------------------------------------------------------------
# SIGNALS FOR AUTOMATIC REVIEW STATUS MANAGEMENT
# ---------------------------------------------------------------------------

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone


@receiver(post_save, sender=SourceFile)
def reset_document_review_on_sourcefile_change(sender, instance, created, **kwargs):
    """
    Reset document human review status when source files are added or modified.
    This ensures that changes to source files trigger a need for human re-review.
    """
    if instance.document and instance.document.human_check_status:
        # Reset human review status when source files change
        instance.document.human_check_status = False
        instance.document.human_check_date = None
        # Keep human_reviewer and human_notes unchanged
        instance.document.save(update_fields=['human_check_status', 'human_check_date'])


@receiver(post_delete, sender=SourceFile)
def reset_document_review_on_sourcefile_deletion(sender, instance, **kwargs):
    """
    Reset document human review status when source files are deleted.
    """
    if instance.document and instance.document.human_check_status:
        # Reset human review status when source files are deleted
        instance.document.human_check_status = False
        instance.document.human_check_date = None
        # Keep human_reviewer and human_notes unchanged
        instance.document.save(update_fields=['human_check_status', 'human_check_date'])