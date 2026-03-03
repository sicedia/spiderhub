"""
Documents models package
Re-exports all models - order matters to avoid circular imports
"""
# Import taxonomies first (no dependencies on other local models)
from .taxonomies import (
    Country, City, Theme, Actor, BeneficiaryGroup, SDG, EUPolicy,
    BeneficiaryGroupRaw, QualitativeIndicator,
)

# Import Document (depends only on taxonomies, uses string refs for relationships)
from .document import Document

# Import relationships (use string references for Document)
from .relationships import (
    DocumentTheme, DocumentActor, DocumentSDG, DocumentBeneficiaryGroupRaw,
    DocumentQualitativeIndicator,
)

# Import content models last (use string references for Document)
from .content import (
    Commitment, CommitmentDetail, KPI, PracticalApplication, SourceFile
)

__all__ = [
    'Country', 'City', 'Theme', 'Actor', 'BeneficiaryGroup', 'SDG',
    'EUPolicy', 'BeneficiaryGroupRaw', 'QualitativeIndicator',
    'Document', 'DocumentTheme', 'DocumentActor', 'DocumentSDG',
    'DocumentBeneficiaryGroupRaw', 'DocumentQualitativeIndicator',
    'Commitment', 'CommitmentDetail', 'KPI', 'PracticalApplication', 'SourceFile',
]
