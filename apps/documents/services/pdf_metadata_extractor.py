"""
PDF Metadata Extraction Service

Extracts metadata from PDF files to automatically populate filename and other fields.
Uses PyMuPDF (fitz) for robust PDF processing with fallback mechanisms.
"""

import os
import re
from pathlib import Path
from typing import Dict, Optional, Tuple
from django.conf import settings

from .logger import get_logger

logger = get_logger(__name__)


def extract_pdf_metadata(file_path: str) -> Dict[str, Optional[str]]:
    """
    Extract metadata from a PDF file using PyMuPDF.
    
    Args:
        file_path: Absolute or relative path to PDF file
        
    Returns:
        dict: Metadata including title, author, subject, creator, producer, etc.
    """
    metadata = {
        'title': None,
        'author': None,
        'subject': None,
        'creator': None,
        'producer': None,
        'creation_date': None,
        'modification_date': None,
    }
    
    try:
        import fitz  # PyMuPDF
        
        if not os.path.exists(file_path):
            logger.warning(f"PDF file not found: {file_path}")
            return metadata
        
        # Open PDF document
        doc = fitz.open(file_path)
        
        # Extract metadata
        pdf_metadata = doc.metadata
        
        if pdf_metadata:
            metadata.update({
                'title': pdf_metadata.get('title'),
                'author': pdf_metadata.get('author'),
                'subject': pdf_metadata.get('subject'),
                'creator': pdf_metadata.get('creator'),
                'producer': pdf_metadata.get('producer'),
                'creation_date': pdf_metadata.get('creationDate'),
                'modification_date': pdf_metadata.get('modDate'),
            })
        
        doc.close()
        
        logger.debug(f"Successfully extracted metadata from PDF: {file_path}")
        return metadata
        
    except ImportError:
        logger.error("PyMuPDF (fitz) not installed. Run: pip install PyMuPDF")
        return metadata
    
    except Exception as e:
        logger.error(f"Error extracting metadata from PDF {file_path}: {str(e)}")
        return metadata


def extract_title_from_pdf_content(file_path: str, max_pages: int = 3) -> Optional[str]:
    """
    Extract a potential title from the first few pages of a PDF.
    
    This is a fallback method when PDF metadata doesn't contain a title.
    It looks for text that appears to be a title based on formatting and position.
    
    Args:
        file_path: Absolute or relative path to PDF file
        max_pages: Maximum number of pages to scan for title
        
    Returns:
        str or None: Potential title text
    """
    try:
        import fitz  # PyMuPDF
        
        if not os.path.exists(file_path):
            return None
        
        doc = fitz.open(file_path)
        
        # Look for title in first few pages
        for page_num in range(min(len(doc), max_pages)):
            page = doc[page_num]
            
            # Get text blocks with position information
            blocks = page.get_text("dict")
            
            # Look for the largest text block that could be a title
            title_candidates = []
            
            for block in blocks.get("blocks", []):
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"].strip()
                            if text and len(text) > 10:  # Minimum length for title
                                # Check if text appears to be a title (starts with capital, reasonable length)
                                if (text[0].isupper() and 
                                    len(text) < 200 and 
                                    not text.endswith('.') and
                                    not re.match(r'^\d+\.?\s*$', text)):  # Not just numbers
                                    title_candidates.append((text, span["size"]))
            
            # Sort by font size (largest first) and return the most likely title
            if title_candidates:
                title_candidates.sort(key=lambda x: x[1], reverse=True)
                doc.close()
                return title_candidates[0][0]
        
        doc.close()
        return None
        
    except Exception as e:
        logger.error(f"Error extracting title from PDF content {file_path}: {str(e)}")
        return None


def generate_smart_filename(file_path: str, original_filename: str) -> str:
    """
    Generate a smart filename based on PDF metadata and content.
    
    This function tries multiple strategies to create a meaningful filename:
    1. Use PDF metadata title
    2. Extract title from PDF content
    3. Use original filename (cleaned)
    4. Fallback to generic name
    
    Args:
        file_path: Path to the PDF file
        original_filename: Original filename from upload
        
    Returns:
        str: Generated filename (without extension)
    """
    # Clean the original filename (remove extension and clean up)
    base_name = Path(original_filename).stem
    base_name = re.sub(r'[^\w\s-]', '', base_name)  # Remove special characters
    base_name = re.sub(r'\s+', '_', base_name)  # Replace spaces with underscores
    base_name = base_name.strip('_')
    
    # Strategy 1: Try PDF metadata title
    metadata = extract_pdf_metadata(file_path)
    if metadata.get('title'):
        title = metadata['title'].strip()
        if title and len(title) > 5 and len(title) < 100:
            # Clean the title for filename
            clean_title = re.sub(r'[^\w\s-]', '', title)
            clean_title = re.sub(r'\s+', '_', clean_title)
            clean_title = clean_title.strip('_')
            if clean_title:
                logger.debug(f"Using PDF metadata title for filename: {clean_title}")
                return clean_title
    
    # Strategy 2: Try to extract title from PDF content
    content_title = extract_title_from_pdf_content(file_path)
    if content_title:
        # Clean the title for filename
        clean_title = re.sub(r'[^\w\s-]', '', content_title)
        clean_title = re.sub(r'\s+', '_', clean_title)
        clean_title = clean_title.strip('_')
        if clean_title and len(clean_title) > 5 and len(clean_title) < 100:
            logger.debug(f"Using PDF content title for filename: {clean_title}")
            return clean_title
    
    # Strategy 3: Use original filename if it's meaningful
    if base_name and len(base_name) > 3 and not re.match(r'^[0-9_-]+$', base_name):
        logger.debug(f"Using original filename: {base_name}")
        return base_name
    
    # Strategy 4: Fallback to generic name
    fallback_name = f"document_{Path(original_filename).stem}"
    logger.debug(f"Using fallback filename: {fallback_name}")
    return fallback_name


def get_pdf_info(file_path: str, original_filename: str) -> Dict[str, str]:
    """
    Get comprehensive information about a PDF file for admin display.
    
    Args:
        file_path: Path to the PDF file
        original_filename: Original filename from upload
        
    Returns:
        dict: Information including suggested filename, metadata, etc.
    """
    info = {
        'suggested_filename': generate_smart_filename(file_path, original_filename),
        'file_size': None,
        'page_count': None,
        'metadata': {},
    }
    
    try:
        import fitz  # PyMuPDF
        
        if os.path.exists(file_path):
            # Get file size
            info['file_size'] = os.path.getsize(file_path)
            
            # Open PDF and get info
            doc = fitz.open(file_path)
            info['page_count'] = len(doc)
            info['metadata'] = extract_pdf_metadata(file_path)
            doc.close()
        
    except Exception as e:
        logger.error(f"Error getting PDF info for {file_path}: {str(e)}")
    
    return info
