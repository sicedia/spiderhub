"""
Text extraction service for various document formats.

Extracts text from PDF, DOCX, and TXT files using robust libraries:
- PyMuPDF (fitz) for PDF extraction
- python-docx for DOCX extraction
- Built-in Python for TXT files

Handles errors gracefully and logs failures without stopping the process.
"""

import os
from pathlib import Path
from typing import Optional, List, Tuple
from django.conf import settings

from .logger import get_logger

logger = get_logger(__name__)


def extract_text_from_pdf(file_path: str) -> Tuple[bool, str, Optional[str]]:
    """
    Extract text from a PDF file using PyMuPDF (fitz).
    
    PyMuPDF is fast and handles most PDF layouts well, including
    institutional documents with complex formatting.
    
    Args:
        file_path: Absolute or relative path to PDF file
        
    Returns:
        tuple: (success: bool, text: str, error: str or None)
    """
    try:
        import fitz  # PyMuPDF
        
        if not os.path.exists(file_path):
            error_msg = f"PDF file not found: {file_path}"
            logger.error(error_msg)
            return False, "", error_msg
        
        # Open PDF document
        doc = fitz.open(file_path)
        text_parts = []
        
        # Extract text from each page
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            if text.strip():  # Only add non-empty pages
                text_parts.append(text)
        
        doc.close()
        
        # Combine all pages
        full_text = "\n\n".join(text_parts)
        
        if not full_text.strip():
            warning_msg = f"PDF file contains no extractable text: {file_path}"
            logger.warning(warning_msg)
            return False, "", warning_msg
        
        logger.debug(f"Successfully extracted {len(full_text)} characters from PDF: {file_path}")
        return True, full_text, None
        
    except ImportError:
        error_msg = "PyMuPDF (fitz) not installed. Run: pip install PyMuPDF"
        logger.error(error_msg)
        return False, "", error_msg
    
    except Exception as e:
        error_msg = f"Error extracting text from PDF {file_path}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, "", error_msg


def extract_text_from_docx(file_path: str) -> Tuple[bool, str, Optional[str]]:
    """
    Extract text from a DOCX file using python-docx.
    
    Extracts text from paragraphs and tables in Word documents.
    
    Args:
        file_path: Absolute or relative path to DOCX file
        
    Returns:
        tuple: (success: bool, text: str, error: str or None)
    """
    try:
        from docx import Document
        
        if not os.path.exists(file_path):
            error_msg = f"DOCX file not found: {file_path}"
            logger.error(error_msg)
            return False, "", error_msg
        
        # Open DOCX document
        doc = Document(file_path)
        text_parts = []
        
        # Extract text from paragraphs
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)
        
        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        text_parts.append(cell.text)
        
        # Combine all parts
        full_text = "\n\n".join(text_parts)
        
        if not full_text.strip():
            warning_msg = f"DOCX file contains no extractable text: {file_path}"
            logger.warning(warning_msg)
            return False, "", warning_msg
        
        logger.debug(f"Successfully extracted {len(full_text)} characters from DOCX: {file_path}")
        return True, full_text, None
        
    except ImportError:
        error_msg = "python-docx not installed. Run: pip install python-docx"
        logger.error(error_msg)
        return False, "", error_msg
    
    except Exception as e:
        error_msg = f"Error extracting text from DOCX {file_path}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, "", error_msg


def extract_text_from_txt(file_path: str) -> Tuple[bool, str, Optional[str]]:
    """
    Extract text from a plain text file.
    
    Handles various encodings (UTF-8, Latin-1, CP1252).
    
    Args:
        file_path: Absolute or relative path to TXT file
        
    Returns:
        tuple: (success: bool, text: str, error: str or None)
    """
    try:
        if not os.path.exists(file_path):
            error_msg = f"TXT file not found: {file_path}"
            logger.error(error_msg)
            return False, "", error_msg
        
        # Try multiple encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    text = f.read()
                
                if text.strip():
                    logger.debug(f"Successfully extracted {len(text)} characters from TXT: {file_path} (encoding: {encoding})")
                    return True, text, None
            
            except UnicodeDecodeError:
                continue
        
        error_msg = f"Could not decode TXT file with any supported encoding: {file_path}"
        logger.error(error_msg)
        return False, "", error_msg
        
    except Exception as e:
        error_msg = f"Error extracting text from TXT {file_path}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, "", error_msg


def extract_text_from_html(file_path: str) -> Tuple[bool, str, Optional[str]]:
    """
    Extract text from HTML file.
    
    Simple implementation that strips HTML tags.
    
    Args:
        file_path: Absolute or relative path to HTML file
        
    Returns:
        tuple: (success: bool, text: str, error: str or None)
    """
    try:
        import re
        
        if not os.path.exists(file_path):
            error_msg = f"HTML file not found: {file_path}"
            logger.error(error_msg)
            return False, "", error_msg
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            html_content = f.read()
        
        # Simple HTML tag removal
        text = re.sub(r'<[^>]+>', ' ', html_content)
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        if not text:
            warning_msg = f"HTML file contains no extractable text: {file_path}"
            logger.warning(warning_msg)
            return False, "", warning_msg
        
        logger.debug(f"Successfully extracted {len(text)} characters from HTML: {file_path}")
        return True, text, None
        
    except Exception as e:
        error_msg = f"Error extracting text from HTML {file_path}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, "", error_msg


def extract_all_document_text(document) -> Tuple[bool, str, List[str]]:
    """
    Extract and aggregate text from all source files of a document.
    
    This is the main entry point for text extraction. It processes all
    SourceFile instances linked to a Document and combines their text.
    
    Args:
        document: Document instance (from apps.documents.models)
        
    Returns:
        tuple: (
            success: bool (True if at least one file succeeded),
            combined_text: str (all extracted text concatenated),
            errors: List[str] (error messages for failed files)
        )
    """
    logger.info(f"Starting text extraction for Document ID {document.id}: {document.title}")
    
    source_files = document.source_files.all()
    
    if not source_files.exists():
        error_msg = f"Document ID {document.id} has no source files attached"
        logger.warning(error_msg)
        return False, "", [error_msg]
    
    text_parts = []
    errors = []
    success_count = 0
    
    for source_file in source_files:
        # Get absolute file path
        try:
            file_path = source_file.file.path
        except (ValueError, AttributeError) as e:
            error_msg = f"Could not get file path for SourceFile ID {source_file.id}: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
            continue
        
        file_type = source_file.file_type.lower()
        filename = source_file.filename
        
        logger.debug(f"Processing {file_type.upper()} file: {filename}")
        
        # Extract text based on file type
        if file_type == 'pdf':
            success, text, error = extract_text_from_pdf(file_path)
        
        elif file_type in ('doc', 'docx'):
            success, text, error = extract_text_from_docx(file_path)
        
        elif file_type == 'txt':
            success, text, error = extract_text_from_txt(file_path)
        
        elif file_type == 'html':
            success, text, error = extract_text_from_html(file_path)
        
        else:
            error_msg = f"Unsupported file type '{file_type}' for file: {filename}"
            logger.warning(error_msg)
            errors.append(error_msg)
            continue
        
        # Collect results
        if success:
            text_parts.append(f"=== {filename} ===\n\n{text}")
            success_count += 1
        else:
            errors.append(error or f"Unknown error extracting from {filename}")
    
    # Combine all extracted text
    combined_text = "\n\n" + "="*80 + "\n\n".join(text_parts) if text_parts else ""
    
    logger.info(
        f"Text extraction complete for Document ID {document.id}: "
        f"{success_count}/{len(source_files)} files successful, "
        f"{len(combined_text)} characters extracted"
    )
    
    if errors:
        logger.warning(f"Errors during extraction: {'; '.join(errors)}")
    
    # Success if at least one file was processed
    overall_success = success_count > 0
    
    return overall_success, combined_text, errors

