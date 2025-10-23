"""
Document Processing Services

This module provides document processing strategies following the Strategy pattern.
Supports different extraction methods (text, vision) with automatic fallback.
"""

from .base import DocumentProcessor
from .text_extractor import TextDocumentProcessor
from .vision_extractor import VisionDocumentProcessor
from .factory import DocumentProcessorFactory

__all__ = [
    'DocumentProcessor',
    'TextDocumentProcessor', 
    'VisionDocumentProcessor',
    'DocumentProcessorFactory',
]
