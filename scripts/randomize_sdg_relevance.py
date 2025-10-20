from apps.documents.models import DocumentSDG
import random
from django.db import transaction

# Get ALL DocumentSDG records
doc_sdgs = list(DocumentSDG.objects.all())

print(f'Found {len(doc_sdgs)} DocumentSDG records')

if doc_sdgs:
    # Assign random values
    with transaction.atomic():
        for doc_sdg in doc_sdgs:
            doc_sdg.relevance_score = round(random.uniform(0.5, 1.0), 2)
        
        DocumentSDG.objects.bulk_update(doc_sdgs, ['relevance_score'], batch_size=500)
    
    print(f'✅ Updated {len(doc_sdgs)} DocumentSDG records with random relevance scores (0.5-1.0)')
else:
    print('No records found!')

