from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from apps.core.models import BaseModel

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
    title = models.CharField(max_length=255)  # Opcional, si deseas asignar un título para facilitar la identificación
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, related_name='documents')
    date = models.DateField()
    characteristics = models.TextField()
    practical_applications = models.TextField()
    resulting_commitments = models.TextField()
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
    
    #Relationships
    actors = models.ManyToManyField(Actor, related_name="documents", blank=True)
    themes = models.ManyToManyField(Theme, related_name="documents", blank=True)
    tags = models.ManyToManyField(Tag, related_name="documents", blank=True)


    #Links and files
    file = models.FileField(upload_to='documents/')
    url = models.URLField(blank=True, null=True, help_text="URL del documento (si aplica)")

    # Analysis and AI
    is_ai_generated = models.BooleanField(default=True, help_text="Indica si el análisis fue generado por IA")
    confidence_level = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        help_text="Nivel de confianza del análisis (visible solo para administradores)"
    )
    admin_notes = models.TextField(blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')

    def __str__(self):
        location_name = self.location.name if self.location else "No location"
        return f"{self.title} ({location_name}, {self.date})"
    
    class Meta:
        ordering = ['-date', 'title']
