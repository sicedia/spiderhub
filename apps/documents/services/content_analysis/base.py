"""
Base Content Analyzer

Abstract base class for content analysis strategies.
Implements the Strategy pattern for different analysis types.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class ContentAnalyzer(ABC):
    """
    Abstract base class for content analysis strategies.
    
    Each analyzer handles a specific type of content analysis:
    - SDG relevance analysis
    - Actor extraction and analysis
    - Theme identification
    - Summary generation
    - Future: Policy analysis, sentiment analysis, etc.
    """
    
    @abstractmethod
    def analyze(self, document, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze document content.
        
        Args:
            document: Document instance to analyze
            content_data: Structured content data from DocumentProcessor
            
        Returns:
            dict: Analysis results with keys:
                - 'success': bool - Whether analysis succeeded
                - 'results': dict - Analysis results by identifier
                - 'errors': List[str] - Error messages if any
                - 'metadata': dict - Additional analysis metadata
        """
        pass
    
    @abstractmethod
    def get_analysis_type(self) -> str:
        """
        Return the type of analysis this analyzer performs.
        
        Returns:
            str: Analysis type identifier ('sdg', 'actor', 'theme', etc.)
        """
        pass
