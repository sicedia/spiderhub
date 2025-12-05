"""
SourceFile signals
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from ..models import SourceFile


@receiver(post_save, sender=SourceFile)
def reset_document_review_on_sourcefile_change(sender, instance, created, **kwargs):
    """
    Reset document human review status when source files are added or modified.
    This ensures that changes to source files trigger a need for human re-review.
    """
    if instance.document and instance.document.human_check_status:
        instance.document.human_check_status = False
        instance.document.human_check_date = None
        instance.document.save(update_fields=['human_check_status', 'human_check_date'])


@receiver(post_delete, sender=SourceFile)
def reset_document_review_on_sourcefile_deletion(sender, instance, **kwargs):
    """
    Reset document human review status when source files are deleted.
    """
    if instance.document and instance.document.human_check_status:
        instance.document.human_check_status = False
        instance.document.human_check_date = None
        instance.document.save(update_fields=['human_check_status', 'human_check_date'])

