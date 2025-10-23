"""
Document Processor Factory

Factory for creating appropriate document processors.
Implements automatic processor selection with fallback strategy.
"""

from typing import Optional
from .base import DocumentProcessor
from .text_extractor import TextDocumentProcessor
from .hybrid_extractor import HybridDocumentProcessor
from ..logger import get_logger

logger = get_logger(__name__)


class DocumentProcessorFactory:
    """
    Factory for creating appropriate document processors.
    
    This factory implements a fallback strategy:
    1. Try TextDocumentProcessor first (fast, handles most cases)
    2. Fall back to HybridDocumentProcessor if text extraction fails
    3. Raise error if no processor can handle the document
    """
    
    def __init__(self):
        """Initialize factory with available processors."""
        self.processors = [
            TextDocumentProcessor(),
            HybridDocumentProcessor()
        ]
        
        logger.debug(f"Initialized DocumentProcessorFactory with {len(self.processors)} processors")
    
    def get_processor(self, document) -> DocumentProcessor:
        """
        Get the best processor for the given document.
        
        Args:
            document: Document instance to process
            
        Returns:
            DocumentProcessor: First processor that can handle the document
            
        Raises:
            ValueError: If no processor can handle the document
        """
        logger.debug(f"Selecting processor for Document {document.id}: {document.title}")
        
        for processor in self.processors:
            try:
                if processor.can_process(document):
                    logger.info(f"Selected {processor.get_processing_type()} processor for Document {document.id}")
                    return processor
            except Exception as e:
                logger.warning(f"Processor {processor.get_processing_type()} failed can_process check: {str(e)}")
                continue
        
        # No processor can handle the document
        error_msg = f"No processor can handle Document {document.id}"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    def get_processor_by_type(self, processing_type: str) -> Optional[DocumentProcessor]:
        """
        Get processor by specific type.
        
        Args:
            processing_type: Type of processor to get ('text', 'hybrid')
            
        Returns:
            DocumentProcessor or None: Processor of specified type, or None if not found
        """
        for processor in self.processors:
            if processor.get_processing_type() == processing_type:
                return processor
        
        logger.warning(f"No processor of type '{processing_type}' found")
        return None
    
    def get_available_types(self) -> list[str]:
        """
        Get list of available processor types.
        
        Returns:
            List[str]: Available processing types
        """
        return [processor.get_processing_type() for processor in self.processors]
