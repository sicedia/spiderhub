"""
Fallback strategies for SDG relevance calculation.

Provides alternative methods when LLM service is unavailable.
"""

import random
from typing import Dict, Any, Optional
from .logger import get_logger
from .exceptions import SDGRelevanceError

logger = get_logger(__name__)


class SDGRelevanceFallback:
    """
    Fallback strategies for SDG relevance calculation when LLM service is unavailable.
    """
    
    @staticmethod
    def calculate_fallback_score(
        document_title: str,
        document_text: str,
        sdg_number: int,
        sdg_label: str,
        fallback_strategy: str = "random"
    ) -> Dict[str, Any]:
        """
        Calculate SDG relevance using fallback strategies.
        
        Args:
            document_title: Title of the document
            document_text: Full text content
            sdg_number: SDG number (1-17)
            sdg_label: SDG description
            fallback_strategy: Strategy to use ('random', 'keyword_match', 'conservative')
            
        Returns:
            dict: Fallback score and justification
        """
        if fallback_strategy == "random":
            return SDGRelevanceFallback._random_fallback(sdg_number, sdg_label)
        elif fallback_strategy == "keyword_match":
            return SDGRelevanceFallback._keyword_match_fallback(
                document_title, document_text, sdg_number, sdg_label
            )
        elif fallback_strategy == "conservative":
            return SDGRelevanceFallback._conservative_fallback(sdg_number, sdg_label)
        else:
            raise ValueError(f"Unknown fallback strategy: {fallback_strategy}")
    
    @staticmethod
    def _random_fallback(sdg_number: int, sdg_label: str) -> Dict[str, Any]:
        """Generate random score between 0.3-0.7 for fallback."""
        score = round(random.uniform(0.3, 0.7), 3)
        justification = (
            f"Fallback calculation: Random score assigned due to LLM service unavailability. "
            f"SDG {sdg_number} relevance estimated at {score:.3f}. "
            f"Please verify manually when service is restored."
        )
        
        logger.warning(f"Using random fallback for SDG {sdg_number}: score={score}")
        
        return {
            'score': score,
            'justification': justification
        }
    
    @staticmethod
    def _keyword_match_fallback(
        document_title: str, 
        document_text: str, 
        sdg_number: int, 
        sdg_label: str
    ) -> Dict[str, Any]:
        """Calculate score based on keyword matching."""
        # Define keyword sets for each SDG (simplified)
        sdg_keywords = {
            1: ['poverty', 'poor', 'hunger', 'food security', 'malnutrition'],
            2: ['hunger', 'food', 'agriculture', 'nutrition', 'farming'],
            3: ['health', 'wellbeing', 'disease', 'medical', 'healthcare'],
            4: ['education', 'learning', 'school', 'student', 'knowledge'],
            5: ['gender', 'women', 'equality', 'empowerment', 'female'],
            6: ['water', 'sanitation', 'clean water', 'hygiene'],
            7: ['energy', 'renewable', 'electricity', 'power', 'sustainable energy'],
            8: ['work', 'employment', 'economic growth', 'decent work', 'job'],
            9: ['infrastructure', 'innovation', 'industry', 'technology'],
            10: ['inequality', 'reduced inequalities', 'equity', 'inclusion'],
            11: ['cities', 'urban', 'sustainable cities', 'communities'],
            12: ['consumption', 'production', 'sustainable consumption'],
            13: ['climate', 'climate action', 'global warming', 'emissions'],
            14: ['oceans', 'marine', 'sea', 'marine life', 'water life'],
            15: ['land', 'ecosystems', 'biodiversity', 'forests', 'wildlife'],
            16: ['peace', 'justice', 'institutions', 'rule of law'],
            17: ['partnerships', 'cooperation', 'global partnership', 'collaboration']
        }
        
        # Get keywords for this SDG
        keywords = sdg_keywords.get(sdg_number, [])
        
        # Count keyword matches in document text
        text_lower = (document_title + " " + document_text).lower()
        matches = sum(1 for keyword in keywords if keyword in text_lower)
        
        # Calculate score based on matches
        if matches == 0:
            score = 0.2
        elif matches <= 2:
            score = 0.4
        elif matches <= 5:
            score = 0.6
        else:
            score = 0.8
        
        justification = (
            f"Fallback calculation: Keyword-based analysis found {matches} relevant terms "
            f"for SDG {sdg_number}. Estimated relevance: {score:.3f}. "
            f"Please verify manually when LLM service is restored."
        )
        
        logger.warning(f"Using keyword fallback for SDG {sdg_number}: {matches} matches, score={score}")
        
        return {
            'score': score,
            'justification': justification
        }
    
    @staticmethod
    def _conservative_fallback(sdg_number: int, sdg_label: str) -> Dict[str, Any]:
        """Generate conservative low score for fallback."""
        score = 0.3
        justification = (
            f"Fallback calculation: Conservative score assigned due to LLM service unavailability. "
            f"SDG {sdg_number} relevance estimated at {score:.3f}. "
            f"Manual review recommended when service is restored."
        )
        
        logger.warning(f"Using conservative fallback for SDG {sdg_number}: score={score}")
        
        return {
            'score': score,
            'justification': justification
        }
