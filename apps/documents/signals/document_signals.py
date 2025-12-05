"""
Document signals
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.postgres.search import SearchVector
from django.db.models import F, Func, TextField
from ..models import Document


@receiver(post_save, sender=Document)
def update_document_search_fields(sender, instance, **kwargs):
    """
    Whenever a Document instance is created or updated, recalculate:
      1) 'search_vector' by combining weighted title and executive_summary fields.
      2) 'title_normalized' by applying unaccent and lowercase functions to the title.
    This single UPDATE call ensures both fields are refreshed in one database operation.
    """
    vector = (
        SearchVector('title', weight='A') +
        SearchVector('executive_summary', weight='B')
    )
    normalized = Func(
        Func(F('title'), function='unaccent'),
        function='lower',
        output_field=TextField()
    )
    Document.objects.filter(pk=instance.pk).update(
        search_vector=vector,
        title_normalized=normalized
    )

