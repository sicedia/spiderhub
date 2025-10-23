"""
Text Document Processor

Processes documents using traditional text extraction methods.
Uses existing PyMuPDF, python-docx, and other text extraction libraries.
"""

from typing import Dict, Any
from .base import DocumentProcessor
from ..text_extraction import extract_all_document_text
from ..logger import get_logger

logger = get_logger(__name__)


class TextDocumentProcessor(DocumentProcessor):
    """
    Document processor using traditional text extraction methods.
    
    This processor uses the existing text extraction infrastructure:
    - PyMuPDF for PDF files
    - python-docx for DOCX files
    - Built-in Python for TXT files
    - HTML parsing for HTML files
    """
    
    def can_process(self, document) -> bool:
        """
        Check if text extraction can process this document.
        
        Returns True if the document has source files and at least one
        can be processed by traditional text extraction methods.
        """
        try:
            # Check if document has source files
            source_files = document.source_files.all()
            if not source_files.exists():
                logger.debug(f"Document {document.id} has no source files")
                return False
            
            # Try text extraction to see if it succeeds
            success, _, _ = extract_all_document_text(document)
            return success
            
        except Exception as e:
            logger.debug(f"Text processor cannot handle document {document.id}: {str(e)}")
            return False
    
    def extract_content(self, document) -> Dict[str, Any]:
        """
        Extract text content from document using traditional methods.
        
        Returns:
            dict: Content data with extracted text and metadata
        """
        logger.info(f"Using text extraction for Document {document.id}: {document.title}")
        
        try:
            # Use existing text extraction function
            success, text_content, errors = extract_all_document_text(document)
            
            # Get source file metadata
            source_files = document.source_files.all()
            file_types = [sf.file_type.lower() for sf in source_files]
            file_count = len(source_files)
            
            return {
                'type': 'text',
                'content': text_content,
                'success': success,
                'errors': errors,
                'metadata': {
                    'extraction_method': 'traditional_text',
                    'file_count': file_count,
                    'file_types': file_types,
                    'text_length': len(text_content) if text_content else 0
                }
            }
            
        except Exception as e:
            error_msg = f"Text extraction failed for Document {document.id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return {
                'type': 'text',
                'content': '',
                'success': False,
                'errors': [error_msg],
                'metadata': {
                    'extraction_method': 'traditional_text',
                    'file_count': 0,
                    'file_types': [],
                    'text_length': 0
                }
            }
    
    def get_processing_type(self) -> str:
        """Return the processing type identifier."""
        return 'text'
