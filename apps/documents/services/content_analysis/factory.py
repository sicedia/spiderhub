"""
Content Analyzer Factory

Factory for creating appropriate content analyzers.
Maps analysis types to analyzer instances with extensible architecture.
"""

from typing import Dict, Optional, Any
from .base import ContentAnalyzer
from .sdg_analyzer import SDGAnalyzer
from .qualitative_analyzer import QualitativeAnalyzer
from ..logger import get_logger

logger = get_logger(__name__)


class ContentAnalyzerFactory:
    """
    Factory for creating content analyzers.
    
    This factory provides:
    - Automatic analyzer registration
    - Type-based analyzer retrieval
    - Extensible architecture for new analyzers
    """
    
    def __init__(self, llm_service):
        """
        Initialize factory with available analyzers.
        
        Args:
            llm_service: LLMService instance for analyzer initialization
        """
        self.llm_service = llm_service
        self.analyzers: Dict[str, ContentAnalyzer] = {}
        
        # Register default analyzers
        self._register_default_analyzers()
        
        logger.debug(f"Initialized ContentAnalyzerFactory with {len(self.analyzers)} analyzers")
    
    def _register_default_analyzers(self):
        """Register default analyzers."""
        self.register_analyzer('sdg', SDGAnalyzer(self.llm_service))
        self.register_analyzer('qualitative', QualitativeAnalyzer(self.llm_service))

        # Future analyzers can be registered here:
        # self.register_analyzer('actor', ActorAnalyzer(self.llm_service))
        # self.register_analyzer('theme', ThemeAnalyzer(self.llm_service))
        # self.register_analyzer('summary', SummaryAnalyzer(self.llm_service))
    
    def register_analyzer(self, analysis_type: str, analyzer: ContentAnalyzer):
        """
        Register a new analyzer.
        
        Args:
            analysis_type: Type identifier for the analyzer
            analyzer: Analyzer instance to register
        """
        self.analyzers[analysis_type] = analyzer
        logger.debug(f"Registered analyzer: {analysis_type}")
    
    def get_analyzer(self, analysis_type: str) -> Optional[ContentAnalyzer]:
        """
        Get analyzer by type.
        
        Args:
            analysis_type: Type of analyzer to get
            
        Returns:
            ContentAnalyzer or None: Analyzer instance, or None if not found
        """
        analyzer = self.analyzers.get(analysis_type)
        
        if analyzer is None:
            logger.warning(f"No analyzer found for type: {analysis_type}")
        
        return analyzer
    
    def get_available_types(self) -> list[str]:
        """
        Get list of available analyzer types.
        
        Returns:
            List[str]: Available analysis types
        """
        return list(self.analyzers.keys())
    
    def analyze_document(self, document, analysis_types: list[str], content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze document with multiple analyzers.
        
        Args:
            document: Document instance to analyze
            analysis_types: List of analysis types to perform
            content_data: Content data from DocumentProcessor
            
        Returns:
            dict: Combined analysis results
        """
        results = {}
        errors = []
        successful_types = []
        
        for analysis_type in analysis_types:
            analyzer = self.get_analyzer(analysis_type)
            
            if analyzer is None:
                error_msg = f"No analyzer available for type: {analysis_type}"
                logger.error(error_msg)
                errors.append(error_msg)
                continue
            
            try:
                logger.info(f"Running {analysis_type} analysis for Document {document.id}")
                result = analyzer.analyze(document, content_data)
                
                results[analysis_type] = result
                
                if result['success']:
                    successful_types.append(analysis_type)
                else:
                    errors.extend(result.get('errors', []))
                    
            except Exception as e:
                error_msg = f"{analysis_type} analysis failed: {str(e)}"
                logger.error(error_msg, exc_info=True)
                errors.append(error_msg)
        
        return {
            'success': len(successful_types) > 0,
            'results': results,
            'errors': errors,
            'successful_types': successful_types,
            'metadata': {
                'requested_types': analysis_types,
                'successful_count': len(successful_types),
                'total_requested': len(analysis_types)
            }
        }
