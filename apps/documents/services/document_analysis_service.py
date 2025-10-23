"""
Document Analysis Service

Main orchestration service for document analysis using SOLID principles.
Coordinates document processing and content analysis with automatic fallback.
"""

from typing import Dict, Any, List, Optional
from django.utils import timezone

from .document_processing import DocumentProcessorFactory
from .content_analysis import ContentAnalyzerFactory
from .llm_service import get_llm_service
from .logger import get_logger
from .exceptions import SDGRelevanceError, SDGProcessingError, LLMServiceError, LLMConnectionError, LLMTimeoutError
from .fallback_service import SDGRelevanceFallback
from .fallback_tracker import FallbackTracker

logger = get_logger(__name__)


class DocumentAnalysisService:
    """
    Main service for document analysis using SOLID principles.
    
    This service orchestrates:
    1. Document processing (text extraction, vision fallback)
    2. Content analysis (SDG, actors, themes, summaries)
    3. Error handling and logging
    4. Database updates
    
    Follows SOLID principles:
    - Single Responsibility: Orchestrates analysis workflow
    - Open/Closed: Extensible for new processors and analyzers
    - Liskov Substitution: All processors and analyzers are interchangeable
    - Interface Segregation: Clean interfaces for each component
    - Dependency Inversion: Depends on abstractions, not concrete implementations
    """
    
    def __init__(self):
        """Initialize service with factories and dependencies."""
        self.llm_service = get_llm_service()
        self.processor_factory = DocumentProcessorFactory()
        self.analyzer_factory = ContentAnalyzerFactory(self.llm_service)
        
        logger.info("DocumentAnalysisService initialized with SOLID architecture")
    
    def analyze_document(
        self, 
        document, 
        analysis_types: Optional[List[str]] = None,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Analyze document with specified analysis types.
        
        Args:
            document: Document instance to analyze
            analysis_types: List of analysis types ('sdg', 'actor', 'theme', etc.)
            force: Whether to recalculate existing analyses
            
        Returns:
            dict: Analysis results with processing metadata
        """
        if analysis_types is None:
            analysis_types = ['sdg']  # Default to SDG analysis
        
        logger.info(f"Starting document analysis for Document {document.id}: {document.title}")
        logger.info(f"Analysis types: {analysis_types}, Force: {force}")
        
        try:
            # Step 1: Get appropriate processor
            processor = self.processor_factory.get_processor(document)
            processing_type = processor.get_processing_type()
            
            logger.info(f"Selected {processing_type} processor for Document {document.id}")
            
            # Step 2: Extract content
            content_data = processor.extract_content(document)
            
            if not content_data['success']:
                error_msg = f"Content extraction failed: {'; '.join(content_data['errors'])}"
                logger.error(f"Document {document.id}: {error_msg}")
                
                return {
                    'success': False,
                    'error': error_msg,
                    'processing_type': processing_type,
                    'analysis_results': {}
                }
            
            logger.info(f"Content extraction successful using {processing_type} processing")
            
            # Step 3: Run analyses
            analysis_results = self.analyzer_factory.analyze_document(
                document, analysis_types, content_data
            )
            
            # Step 4: Update document status if all successful
            if analysis_results['success'] and 'sdg' in analysis_results['successful_types']:
                document.ai_check_status = True
                document.ai_check_date = timezone.now()
                document.save(update_fields=['ai_check_status', 'ai_check_date'])
                logger.info(f"Document {document.id} marked as AI-checked")
            
            logger.info(f"Document analysis complete for Document {document.id}")
            
            return {
                'success': analysis_results['success'],
                'processing_type': processing_type,
                'content_metadata': content_data['metadata'],
                'analysis_results': analysis_results['results'],
                'errors': analysis_results['errors'],
                'successful_types': analysis_results['successful_types']
            }
            
        except Exception as e:
            error_msg = f"Document analysis failed for Document {document.id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return {
                'success': False,
                'error': error_msg,
                'processing_type': 'unknown',
                'analysis_results': {}
            }
    
    def analyze_sdg_relevance(self, document, force: bool = False) -> Dict[str, Any]:
        """
        Convenience method for SDG analysis.
        
        Args:
            document: Document instance to analyze
            force: Whether to recalculate existing SDG scores
            
        Returns:
            dict: SDG analysis results
        """
        return self.analyze_document(document, ['sdg'], force)
    
    def analyze_sdg_relevance_with_content(self, document, content_data: Dict[str, Any], force: bool = False) -> Dict[str, Any]:
        """
        Convenience method for SDG analysis using pre-extracted content.
        
        This method bypasses content extraction and uses the provided content_data
        directly, which is useful for optimizing batch processing of multiple SDGs.
        
        Args:
            document: Document instance to analyze
            content_data: Pre-extracted content data from processor
            force: Whether to recalculate existing SDG scores
            
        Returns:
            dict: SDG analysis results
        """
        logger.info(f"Starting SDG analysis with cached content for Document {document.id}: {document.title}")
        
        try:
            # Skip content extraction and use provided content_data
            processing_type = content_data.get('type', 'unknown')
            logger.info(f"Using cached {processing_type} content for Document {document.id}")
            
            # Run SDG analysis with cached content
            analysis_results = self.analyzer_factory.analyze_document(
                document, ['sdg'], content_data
            )
            
            # Update document status if successful
            if analysis_results['success'] and 'sdg' in analysis_results['successful_types']:
                document.ai_check_status = True
                document.ai_check_date = timezone.now()
                document.save(update_fields=['ai_check_status', 'ai_check_date'])
                logger.info(f"Document {document.id} marked as AI-checked")
            
            logger.info(f"SDG analysis with cached content complete for Document {document.id}")
            
            return {
                'success': analysis_results['success'],
                'analysis_results': analysis_results,
                'processing_type': processing_type,
                'cached_content_used': True
            }
            
        except Exception as e:
            error_msg = f"SDG analysis with cached content failed for Document {document.id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return {
                'success': False,
                'error': error_msg,
                'cached_content_used': True
            }
    
    def analyze_single_sdg_with_content(self, document, sdg, content_data: Dict[str, Any], force: bool = False) -> Dict[str, Any]:
        """
        Analyze a single SDG using pre-extracted content.
        
        This method analyzes only the specified SDG, not all SDGs linked to the document.
        This is the key optimization for the caching strategy.
        
        Args:
            document: Document instance to analyze
            sdg: SDG instance to analyze
            content_data: Pre-extracted content data from processor
            force: Whether to recalculate existing SDG scores
            
        Returns:
            dict: Single SDG analysis result
        """
        logger.info(f"Starting single SDG analysis with cached content for Document {document.id} / SDG {sdg.number}")
        
        try:
            # Skip content extraction and use provided content_data
            processing_type = content_data.get('type', 'unknown')
            logger.info(f"Using cached {processing_type} content for Document {document.id} / SDG {sdg.number}")
            
            # Get SDG analyzer and analyze single SDG
            sdg_analyzer = self.analyzer_factory.get_analyzer('sdg')
            
            # Create a mock DocumentSDG relationship for the analyzer
            from apps.documents.models import DocumentSDG
            doc_sdg, created = DocumentSDG.objects.get_or_create(
                document=document,
                sdg=sdg,
                defaults={'relevance_score': None, 'justification': ''}
            )
            
            # Analyze single SDG with cached content
            result = sdg_analyzer.analyze_single_sdg(document, doc_sdg, content_data)
            
            logger.info(f"Single SDG analysis with cached content complete for Document {document.id} / SDG {sdg.number}")
            
            # Extract the actual result data from the analyzer response
            if result['success']:
                actual_result = result['data']
            else:
                raise Exception(f"SDG analysis failed: {result['error']}")
            
            return {
                'success': True,
                'analysis_results': {
                    'sdg': {
                        'success': True,
                        'results': {
                            f'sdg_{sdg.number}': actual_result
                        }
                    }
                },
                'processing_type': processing_type,
                'cached_content_used': True
            }
            
        except Exception as e:
            error_msg = f"Single SDG analysis with cached content failed for Document {document.id} / SDG {sdg.number}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return {
                'success': False,
                'error': error_msg,
                'cached_content_used': True
            }
    
    def analyze_actors(self, document) -> Dict[str, Any]:
        """
        Convenience method for actor analysis.
        
        Args:
            document: Document instance to analyze
            
        Returns:
            dict: Actor analysis results
        """
        return self.analyze_document(document, ['actor'])
    
    def analyze_themes(self, document) -> Dict[str, Any]:
        """
        Convenience method for theme analysis.
        
        Args:
            document: Document instance to analyze
            
        Returns:
            dict: Theme analysis results
        """
        return self.analyze_document(document, ['theme'])
    
    def analyze_summary(self, document) -> Dict[str, Any]:
        """
        Convenience method for summary generation.
        
        Args:
            document: Document instance to analyze
            
        Returns:
            dict: Summary analysis results
        """
        return self.analyze_document(document, ['summary'])
    
    def analyze_all(self, document) -> Dict[str, Any]:
        """
        Analyze all available aspects of the document.
        
        Args:
            document: Document instance to analyze
            
        Returns:
            dict: Combined analysis results
        """
        available_types = self.analyzer_factory.get_available_types()
        return self.analyze_document(document, available_types)
    
    def get_available_analysis_types(self) -> List[str]:
        """
        Get list of available analysis types.
        
        Returns:
            List[str]: Available analysis types
        """
        return self.analyzer_factory.get_available_types()
    
    def get_available_processing_types(self) -> List[str]:
        """
        Get list of available processing types.
        
        Returns:
            List[str]: Available processing types
        """
        return self.processor_factory.get_available_types()
    
    def register_analyzer(self, analysis_type: str, analyzer):
        """
        Register a new analyzer.
        
        Args:
            analysis_type: Type identifier for the analyzer
            analyzer: Analyzer instance to register
        """
        self.analyzer_factory.register_analyzer(analysis_type, analyzer)
        logger.info(f"Registered new analyzer: {analysis_type}")


# Singleton instance for reuse
_document_analysis_service_instance = None


def get_document_analysis_service() -> DocumentAnalysisService:
    """
    Get singleton instance of DocumentAnalysisService.
    
    Returns:
        DocumentAnalysisService instance
    """
    global _document_analysis_service_instance
    
    if _document_analysis_service_instance is None:
        _document_analysis_service_instance = DocumentAnalysisService()
    
    return _document_analysis_service_instance
