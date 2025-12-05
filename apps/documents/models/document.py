"""
Core Document model
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel
from django.db.models import (
    Q, Count, F, IntegerField, OuterRef, Subquery, Value
)
from django.db.models.functions import Coalesce
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from .taxonomies import Country, City, Theme, Actor, BeneficiaryGroup, SDG, EUPolicy, BeneficiaryGroupRaw
# Note: content models use string references to avoid circular import
# CommitmentDetail is imported only when needed in methods


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
        upload_to='summaries/',
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
    
    event_city = models.ForeignKey(City, null=True, blank=True, on_delete=models.SET_NULL)
    event_country = models.ForeignKey(Country, null=True, blank=True, on_delete=models.SET_NULL)
    
    lead_country = models.ForeignKey(
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
    themes = models.ManyToManyField(Theme, through='DocumentTheme', related_name="documents")
    actors = models.ManyToManyField(Actor, through='DocumentActor', related_name="documents")

    beneficiary_groups = models.ManyToManyField(
        BeneficiaryGroup, related_name="documents", blank=True
    )
    beneficiary_groups_raw = models.ManyToManyField(
        BeneficiaryGroupRaw,
        through='DocumentBeneficiaryGroupRaw',
        related_name="documents",
        blank=True,
    )

    # Legal characteristics
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
    sdgs = models.ManyToManyField(SDG, through='DocumentSDG', related_name="documents", blank=True)

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
        
        # Auto-assign created_by for new documents
        if is_new and not self.created_by:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                from django.utils.deprecation import get_current_request
                request = get_current_request()
                if request and hasattr(request, 'user') and request.user.is_authenticated:
                    self.created_by = request.user
            except:
                superuser = User.objects.filter(is_superuser=True).first()
                if superuser:
                    self.created_by = superuser
        
        if not is_new:
            try:
                old_instance = Document.objects.get(pk=self.pk)
                
                significant_fields = [
                    'title', 'executive_summary', 'document_type', 'event_format',
                    'coverage_scope', 'legal_bindingness', 'event_date', 'event_city',
                    'event_country', 'lead_country', 'score'
                ]
                
                for field in significant_fields:
                    old_value = getattr(old_instance, field)
                    new_value = getattr(self, field)
                    
                    if old_value != new_value:
                        significant_changes = True
                        print(f"DEBUG: Field '{field}' changed from '{old_value}' to '{new_value}'")
                        break
                        
            except Document.DoesNotExist:
                significant_changes = True
        
        if significant_changes and self.human_check_status:
            print(f"DEBUG: Resetting human review status for document {self.id}")
            self.human_check_status = False
            self.human_check_date = None
        
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
        # Import here to avoid circular import
        from .relationships import DocumentTheme, DocumentActor, DocumentSDG
        
        theme_ids = list(self.themes.values_list('id', flat=True))
        actor_ids = list(self.actors.values_list('id', flat=True))
        ben_ids = list(self.beneficiary_groups.values_list('id', flat=True))
        sdg_ids = list(self.sdgs.values_list('id', flat=True))

        if not any((theme_ids, actor_ids, ben_ids, sdg_ids)):
            return Document.objects.none()

        qs = Document.objects.exclude(pk=self.pk)

        theme_cnt_sq = DocumentTheme.objects.filter(
            document_id=OuterRef('pk'),
            theme_id__in=theme_ids
        ).values('document_id').annotate(c=Count('*')).values('c')

        actor_cnt_sq = DocumentActor.objects.filter(
            document_id=OuterRef('pk'),
            actor_id__in=actor_ids
        ).values('document_id').annotate(c=Count('*')).values('c')

        ben_cnt_sq = (
            Document.beneficiary_groups.through
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
        # Import here to avoid circular import
        from .content import CommitmentDetail
        return (
            CommitmentDetail.objects
            .filter(commitment__document=self)
            .values_list('commitment_class', flat=True)
            .distinct()
        )

