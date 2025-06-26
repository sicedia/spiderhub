#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.documents.models import Document
from django.db.models import Count

# Get lead country counts
lead_countries = (
    Document.objects
    .filter(lead_country__isnull=False)
    .values('lead_country__iso3', 'lead_country__name')
    .annotate(document_count=Count('id'))
    .order_by('-document_count')[:10]
)

print("Top 10 lead countries:")
for item in lead_countries:
    iso3 = item['lead_country__iso3']
    name = item['lead_country__name'] 
    count = item['document_count']
    print(f"  - {name} ({iso3}): {count} documents")

print("\nSample ISO3 codes from the data:")
sample_countries = Document.objects.filter(lead_country__isnull=False).select_related('lead_country')[:5]
for doc in sample_countries:
    print(f"  - Document: {doc.title[:50]}...")
    print(f"    Lead Country: {doc.lead_country.name} (ISO3: {doc.lead_country.iso3})")
    print()

# Create the data format expected by the choropleth chart
counts_data = {}
for item in lead_countries:
    iso3 = item['lead_country__iso3']
    count = item['document_count']
    counts_data[iso3] = count

print("Data format for choropleth chart:")
print(counts_data)
