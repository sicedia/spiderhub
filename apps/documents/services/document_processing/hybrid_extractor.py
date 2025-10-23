"""
Hybrid Document Processor

Processes documents using a hybrid strategy that combines text extraction with vision LLM fallback.
Attempts text extraction on all files first, then uses vision processing for problematic PDFs.
"""

import base64
import os
from typing import Dict, Any, List, Tuple
from .base import DocumentProcessor
from ..text_extraction import extract_all_document_text, extract_text_from_pdf
from ..logger import get_logger

logger = get_logger(__name__)


class HybridDocumentProcessor(DocumentProcessor):
    """
    Document processor using hybrid text + vision strategy.
    
    This processor:
    1. Attempts text extraction on ALL document files
    2. Identifies problematic PDFs that fail text extraction
    3. Uses vision LLM only for problematic PDFs (limited to 2 files, 5 pages each)
    4. Combines text content + vision content for comprehensive LLM analysis
    5. Stores vision images in metadata for later LLM processing
    """
    
    def __init__(self, max_vision_files: int = 2, max_pages_per_file: int = 50):
        """
        Initialize hybrid processor.
        
        Args:
            max_vision_files: Maximum number of PDFs to process with vision (default: 2)
            max_pages_per_file: Maximum pages per PDF with vision (default: 5)
        """
        self.max_vision_files = max_vision_files
        self.max_pages_per_file = max_pages_per_file
    
    def can_process(self, document) -> bool:
        """
        Check if hybrid processing can handle this document.
        
        Returns True if the document has source files, regardless of text extraction success.
        Hybrid processor can handle both successful and failed text extraction cases.
        """
        try:
            # Check if document has source files
            source_files = document.source_files.all()
            if not source_files.exists():
                logger.debug(f"Document {document.id} has no source files")
                return False
            
            # Hybrid processor can handle any document with source files
            # It will attempt text extraction first, then use vision fallback if needed
            return True
            
        except Exception as e:
            logger.debug(f"Hybrid processor cannot handle document {document.id}: {str(e)}")
            return False
    
    def extract_content(self, document) -> Dict[str, Any]:
        """
        Extract content using hybrid text + vision strategy.
        
        Returns:
            dict: Content data with combined text + vision content and metadata
        """
        logger.info(f"Using hybrid extraction for Document {document.id}: {document.title}")
        
        try:
            # Step 1: Attempt text extraction on all files
            text_success, text_content, text_errors = extract_all_document_text(document)
            
            # Step 2: Identify problematic PDFs
            problematic_pdfs = self._identify_problematic_pdfs(document, text_errors)
            
            # Step 3: Process problematic PDFs with vision (limited)
            vision_data = self._process_problematic_pdfs(document, problematic_pdfs)
            
            # Step 4: Create combined context
            combined_content = self._create_combined_context(
                text_content, text_errors, vision_data
            )
            
            # Step 5: Build metadata
            metadata = self._build_metadata(
                document, text_success, text_errors, vision_data, combined_content
            )
            
            logger.info(f"Hybrid extraction complete for Document {document.id}: "
                      f"{metadata['text_files_count']} text files, "
                      f"{metadata['vision_files_count']} vision files")
            
            return {
                'type': 'hybrid',
                'content': combined_content,
                'success': True,
                'errors': [],
                'metadata': metadata
            }
            
        except Exception as e:
            error_msg = f"Hybrid extraction failed for Document {document.id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return {
                'type': 'hybrid',
                'content': '',
                'success': False,
                'errors': [error_msg],
                'metadata': {
                    'extraction_method': 'hybrid',
                    'text_files_count': 0,
                    'vision_files_count': 0,
                    'vision_files': [],
                    'vision_images': {}
                }
            }
    
    def _identify_problematic_pdfs(self, document, text_errors: List[str]) -> List[Dict[str, Any]]:
        """
        Identify PDFs that failed text extraction.
        
        Args:
            document: Document instance
            text_errors: List of error messages from text extraction
            
        Returns:
            List[Dict]: List of problematic PDF file info sorted by size (smallest first)
        """
        problematic_pdfs = []
        
        # Get all PDF files
        pdf_files = document.source_files.filter(file_type='pdf')
        
        for pdf_file in pdf_files:
            # Check if this PDF had extraction errors
            filename = pdf_file.filename
            pdf_error = any(filename in error for error in text_errors)
            
            if pdf_error:
                try:
                    # Get file size for sorting
                    file_path = pdf_file.file.path
                    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
                    
                    problematic_pdfs.append({
                        'source_file': pdf_file,
                        'filename': filename,
                        'file_path': file_path,
                        'file_size': file_size
                    })
                    
                    logger.debug(f"Identified problematic PDF: {filename} ({file_size} bytes)")
                    
                except Exception as e:
                    logger.warning(f"Could not get info for problematic PDF {filename}: {str(e)}")
        
        # Sort by file size (smallest first) to prioritize smaller files
        problematic_pdfs.sort(key=lambda x: x['file_size'])
        
        logger.info(f"Identified {len(problematic_pdfs)} problematic PDFs for Document {document.id}")
        return problematic_pdfs
    
    def _process_problematic_pdfs(self, document, problematic_pdfs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process problematic PDFs with vision (limited).
        
        Args:
            document: Document instance
            problematic_pdfs: List of problematic PDF info
            
        Returns:
            dict: Vision processing results
        """
        vision_files = []
        vision_images = {}
        processed_count = 0
        
        # Process up to max_vision_files
        for pdf_info in problematic_pdfs[:self.max_vision_files]:
            try:
                filename = pdf_info['filename']
                file_path = pdf_info['file_path']
                
                logger.info(f"Processing problematic PDF with vision: {filename}")
                
                # Convert PDF to images
                images = self._convert_pdf_to_images(file_path)
                
                if images:
                    vision_files.append(filename)
                    vision_images[filename] = images
                    processed_count += 1
                    
                    logger.info(f"Successfully converted {len(images)} pages to images: {filename}")
                else:
                    logger.warning(f"Could not convert PDF to images: {filename}")
                    
            except Exception as e:
                logger.error(f"Vision processing failed for {pdf_info['filename']}: {str(e)}")
                continue
        
        logger.info(f"Vision processing complete: {processed_count}/{len(problematic_pdfs)} PDFs processed")
        
        return {
            'vision_files': vision_files,
            'vision_images': vision_images,
            'processed_count': processed_count
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
            
            # Process up to max_pages_per_file
            page_count = min(len(doc), self.max_pages_per_file)
            
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
    
    def _create_combined_context(self, text_content: str, text_errors: List[str], vision_data: Dict[str, Any]) -> str:
        """
        Create combined context from text and vision content.
        
        Args:
            text_content: Extracted text content
            text_errors: Text extraction errors
            vision_data: Vision processing results
            
        Returns:
            str: Combined content with placeholders for vision images
        """
        parts = []
        
        # Add text content if available
        if text_content and text_content.strip():
            parts.append(f"=== TEXT CONTENT ===\n\n{text_content}")
        
        # Add vision placeholders
        vision_files = vision_data.get('vision_files', [])
        if vision_files:
            vision_placeholders = []
            for filename in vision_files:
                image_count = len(vision_data['vision_images'].get(filename, []))
                vision_placeholders.append(f"[VISION CONTENT: {filename} - {image_count} pages]")
            
            parts.append(f"=== VISION CONTENT ===\n\n" + "\n".join(vision_placeholders))
        
        # Add error summary if any
        if text_errors:
            error_summary = f"=== EXTRACTION ERRORS ===\n\n" + "\n".join(text_errors)
            parts.append(error_summary)
        
        combined = "\n\n" + "="*80 + "\n\n".join(parts) if parts else ""
        
        logger.debug(f"Created combined context: {len(combined)} characters")
        return combined
    
    def _build_metadata(self, document, text_success: bool, text_errors: List[str], vision_data: Dict[str, Any], text_content: str) -> Dict[str, Any]:
        """
        Build metadata for hybrid processing results.
        
        Args:
            document: Document instance
            text_success: Whether text extraction succeeded
            text_errors: Text extraction errors
            vision_data: Vision processing results
            
        Returns:
            dict: Metadata dictionary
        """
        # Count source files
        source_files = document.source_files.all()
        file_types = [sf.file_type.lower() for sf in source_files]
        
        # Count text files (all files minus problematic PDFs)
        vision_files = vision_data.get('vision_files', [])
        text_files_count = len(source_files) - len(vision_files)
        
        return {
            'extraction_method': 'hybrid',
            'text_files_count': text_files_count,
            'vision_files_count': len(vision_files),
            'vision_files': vision_files,
            'vision_images': vision_data.get('vision_images', {}),
            'file_count': len(source_files),
            'file_types': file_types,
            'text_length': len(text_content) if text_content else 0,
            'max_vision_files_limit': self.max_vision_files,
            'max_pages_per_file_limit': self.max_pages_per_file
        }
    
    def get_processing_type(self) -> str:
        """Return the processing type identifier."""
        return 'hybrid'
