"""
Base Document Processor

Abstract base class for document processing strategies.
Implements the Strategy pattern for different extraction methods.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class DocumentProcessor(ABC):
    """
    Abstract base class for document processing strategies.
    
    Each processor handles a specific way of extracting content from documents:
    - Text extraction using traditional libraries (PyMuPDF, python-docx)
    - Vision-based extraction using LLM capabilities
    - Future: OCR, hybrid approaches, etc.
    """
    
    @abstractmethod
    def can_process(self, document) -> bool:
        """
        Check if this processor can handle the given document.
        
        Args:
            document: Document instance to check
            
        Returns:
            bool: True if this processor can handle the document
        """
        pass
    
    @abstractmethod
    def extract_content(self, document) -> Dict[str, Any]:
        """
        Extract content from the document.
        
        Args:
            document: Document instance to process
            
        Returns:
            dict: Structured content data with keys:
                - 'type': str - Processing type ('text', 'vision', etc.)
                - 'content': Any - Extracted content (str for text, list for images)
                - 'success': bool - Whether extraction succeeded
                - 'errors': List[str] - Error messages if any
                - 'metadata': dict - Additional processing metadata
        """
        pass
    
    @abstractmethod
    def get_processing_type(self) -> str:
        """
        Return the type of processing this processor performs.
        
        Returns:
            str: Processing type identifier ('text', 'vision', etc.)
        """
        pass
