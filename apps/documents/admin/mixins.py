"""
Admin Mixins
Shared mixins for common admin functionality
"""
from django.db import models
from django.forms import Textarea, TextInput


class TimestampReadonlyMixin:
    """
    Mixin to add created_at and updated_at as readonly fields.
    """
    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        readonly.extend(['created_at', 'updated_at'])
        return readonly


class StandardFormFieldOverridesMixin:
    """
    Mixin providing standard form field overrides for text fields.
    """
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 4, 'cols': 80})},
        models.CharField: {'widget': TextInput(attrs={'size': '60'})},
    }


class WideFormFieldOverridesMixin:
    """
    Mixin providing wider form field overrides for text fields.
    """
    formfield_overrides = {
        models.TextField: {'widget': Textarea(attrs={'rows': 6, 'cols': 100})},
        models.CharField: {'widget': TextInput(attrs={'size': '80'})},
    }

