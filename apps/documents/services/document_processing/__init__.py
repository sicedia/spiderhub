"""
Document Processing Services

This module provides document processing strategies following the Strategy pattern.
Supports different extraction methods (text, hybrid) with automatic fallback.
"""

from .base import DocumentProcessor
from .text_extractor import TextDocumentProcessor
from .hybrid_extractor import HybridDocumentProcessor
from .factory import DocumentProcessorFactory

__all__ = [
    'DocumentProcessor',
    'TextDocumentProcessor', 
    'HybridDocumentProcessor',
    'DocumentProcessorFactory',
]
