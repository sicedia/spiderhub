"""
Content models - Child entities unique per document
"""
from django.db import models
from pathlib import Path
from apps.core.models import BaseModel
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
# Note: Using string reference to avoid circular import with Document


class PracticalApplication(BaseModel):
    document = models.ForeignKey(
        'Document', on_delete=models.CASCADE, related_name="practical_applications"
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
    document = models.ForeignKey('Document', on_delete=models.CASCADE, related_name="commitments")
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
    document = models.ForeignKey('Document', on_delete=models.CASCADE, related_name="kpis")
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


class SourceFile(BaseModel):
    """Source files associated with a document."""
    document = models.ForeignKey(
        'Document',
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
            try:
                old_instance = SourceFile.objects.get(pk=self.pk)
                file_changed = old_instance.file != self.file
            except SourceFile.DoesNotExist:
                file_changed = True
        
        # Auto-populate file_size
        if self.file:
            self.file_size = self.file.size
            
        # Auto-detect file_type from extension
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
        
        # Auto-populate filename
        if self.file and (is_new or file_changed or not self.filename):
            original_filename = self.file.name.split('/')[-1]
            
            if self.file_type == 'pdf':
                try:
                    from ..services.pdf_metadata_extractor import generate_smart_filename
                    suggested_name = generate_smart_filename(self.file.path, original_filename)
                    file_extension = Path(original_filename).suffix
                    self.filename = f"{suggested_name}{file_extension}"
                except Exception:
                    self.filename = original_filename
            else:
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
            old_filename = self.filename
            old_file_type = self.file_type
            
            self.filename = None
            self.file_type = 'other'
            
            self.save()
            
            if old_filename != self.filename or old_file_type != self.file_type:
                return True
            
            return False
            
        except Exception as e:
            self.filename = old_filename
            self.file_type = old_file_type
            raise e

