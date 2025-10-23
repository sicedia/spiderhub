"""
Vision Document Processor

Processes documents using LLM vision capabilities.
Converts PDF pages to images and prepares them for LLM analysis.
"""

import base64
from typing import Dict, Any, List
from .base import DocumentProcessor
from ..logger import get_logger

logger = get_logger(__name__)


class VisionDocumentProcessor(DocumentProcessor):
    """
    Document processor using LLM vision capabilities.
    
    This processor:
    1. Converts PDF pages to high-resolution images
    2. Encodes images as base64 for LLM consumption
    3. Limits to first 5 pages to avoid token limits
    4. Prepares images for direct LLM analysis
    """
    
    def __init__(self, max_pages: int = 5):
        """
        Initialize vision processor.
        
        Args:
            max_pages: Maximum number of pages to process (default: 5)
        """
        self.max_pages = max_pages
    
    def can_process(self, document) -> bool:
        """
        Check if vision processing can handle this document.
        
        Returns True if the document has PDF source files.
        """
        try:
            # Check if document has PDF files
            pdf_files = document.source_files.filter(file_type='pdf')
            return pdf_files.exists()
            
        except Exception as e:
            logger.debug(f"Vision processor cannot handle document {document.id}: {str(e)}")
            return False
    
    def extract_content(self, document) -> Dict[str, Any]:
        """
        Extract content using vision processing.
        
        Converts PDF pages to base64-encoded images for LLM analysis.
        
        Returns:
            dict: Content data with image list and metadata
        """
        logger.info(f"Using vision extraction for Document {document.id}: {document.title}")
        
        try:
            # Get PDF file
            pdf_file = document.source_files.filter(file_type='pdf').first()
            if not pdf_file:
                error_msg = f"No PDF file found for Document {document.id}"
                logger.error(error_msg)
                return {
                    'type': 'vision',
                    'content': [],
                    'success': False,
                    'errors': [error_msg],
                    'metadata': {
                        'extraction_method': 'llm_vision',
                        'page_count': 0,
                        'pdf_path': None
                    }
                }
            
            # Get PDF file path
            try:
                pdf_path = pdf_file.file.path
            except (ValueError, AttributeError) as e:
                error_msg = f"Could not get PDF path for Document {document.id}: {str(e)}"
                logger.error(error_msg)
                return {
                    'type': 'vision',
                    'content': [],
                    'success': False,
                    'errors': [error_msg],
                    'metadata': {
                        'extraction_method': 'llm_vision',
                        'page_count': 0,
                        'pdf_path': None
                    }
                }
            
            # Convert PDF to images
            images = self._convert_pdf_to_images(pdf_path)
            
            if not images:
                error_msg = f"Could not convert PDF to images for Document {document.id}"
                logger.error(error_msg)
                return {
                    'type': 'vision',
                    'content': [],
                    'success': False,
                    'errors': [error_msg],
                    'metadata': {
                        'extraction_method': 'llm_vision',
                        'page_count': 0,
                        'pdf_path': pdf_path
                    }
                }
            
            logger.info(f"Successfully converted {len(images)} pages to images for Document {document.id}")
            
            return {
                'type': 'vision',
                'content': images,
                'success': True,
                'errors': [],
                'metadata': {
                    'extraction_method': 'llm_vision',
                    'page_count': len(images),
                    'pdf_path': pdf_path,
                    'max_pages_limit': self.max_pages
                }
            }
            
        except Exception as e:
            error_msg = f"Vision extraction failed for Document {document.id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return {
                'type': 'vision',
                'content': [],
                'success': False,
                'errors': [error_msg],
                'metadata': {
                    'extraction_method': 'llm_vision',
                    'page_count': 0,
                    'pdf_path': None
                }
            }
    
    def _convert_pdf_to_images(self, pdf_path: str) -> List[str]:
        """
        Convert PDF pages to base64-encoded images.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            List[str]: List of base64-encoded image strings
        """
        try:
            import fitz  # PyMuPDF
            
            doc = fitz.open(pdf_path)
            images = []
            
            # Process up to max_pages
            page_count = min(len(doc), self.max_pages)
            
            for page_num in range(page_count):
                page = doc[page_num]
                
                # Convert page to image with high resolution
                mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
                pix = page.get_pixmap(matrix=mat)
                img_data = pix.tobytes("png")
                
                # Encode as base64
                img_base64 = base64.b64encode(img_data).decode('utf-8')
                images.append(img_base64)
            
            doc.close()
            
            logger.debug(f"Converted {len(images)} pages from PDF: {pdf_path}")
            return images
            
        except ImportError:
            error_msg = "PyMuPDF (fitz) not installed. Run: pip install PyMuPDF"
            logger.error(error_msg)
            raise ImportError(error_msg)
            
        except Exception as e:
            error_msg = f"Error converting PDF to images: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise Exception(error_msg)
    
    def get_processing_type(self) -> str:
        """Return the processing type identifier."""
        return 'vision'
