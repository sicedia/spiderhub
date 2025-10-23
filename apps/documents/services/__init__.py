"""
SDG Relevance Ingestion Services

This package provides services for calculating SDG relevance scores using LLMs.

Main components:
- text_extraction: Extract text from PDF, DOCX, TXT files
- llm_service: LangChain-based LLM abstraction layer
- sdg_relevance_service: Main orchestration for SDG analysis
- logger: Centralized logging configuration
- utils: Helper functions and validators
"""

from .text_extraction import extract_all_document_text, extract_text_from_pdf, extract_text_from_docx
from .llm_service import LLMService
from .sdg_relevance_service import process_document_sdgs, process_batch_documents, calculate_sdg_relevance
from .document_analysis_service import DocumentAnalysisService, get_document_analysis_service

__all__ = [
    'extract_all_document_text',
    'extract_text_from_pdf',
    'extract_text_from_docx',
    'LLMService',
    'process_document_sdgs',
    'process_batch_documents',
    'calculate_sdg_relevance',
    'DocumentAnalysisService',
    'get_document_analysis_service',
]

