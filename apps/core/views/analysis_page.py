from collections import defaultdict
from apps.documents.models import BeneficiaryGroup

# -------------------------------------------------------------
# 6) Theme × Beneficiary-Group matrix (solo documentos "agreements_")
agreements_qs = Document.objects.filter(document_type__startswith="agreements")

raw_matrix_qs = (
    Document.objects
            .filter(pk__in=agreements_qs)
            .values(
                theme_cat=Coalesce('themes__category', Value('Uncategorised')),
                ben_cat=Coalesce('beneficiary_groups__category', Value('Uncategorised'))
            )
            .distinct()                # evita contar varias veces el mismo doc
            .annotate(count=Count('id'))
)

# 1. Lista ordenada de categorías de cada eje
THEME_CATS = [label for slug, label in Theme.CATEGORY_CHOICES]
BEN_CATS   = [label for slug, label in BeneficiaryGroup.CATEGORY_CHOICES]

# 2. Matriz inicial (todos a 0)
matrix = {t: {b: 0 for b in BEN_CATS} for t in THEME_CATS}

# 3. Rellena con los counts reales
for row in raw_matrix_qs:
    theme_label = dict(Theme.CATEGORY_CHOICES).get(row['theme_cat'], 'Uncategorised')
    ben_label   = dict(BeneficiaryGroup.CATEGORY_CHOICES).get(row['ben_cat'], 'Uncategorised')
    matrix[theme_label][ben_label] = row['count']

# ▸ añade al context
context["analysis_data"]["theme_ben_matrix"] = matrix