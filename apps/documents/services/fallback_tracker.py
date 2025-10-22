"""
Fallback tracking service for SDG relevance calculations.

Tracks when fallback strategies are used for monitoring and reporting.
"""

import os
from typing import Dict, Any
from .logger import get_logger

logger = get_logger(__name__)

# Global fallback counter
_fallback_counter = {
    'connection_errors': 0,
    'timeout_errors': 0,
    'total_fallbacks': 0
}


class FallbackTracker:
    """Tracks fallback usage for SDG relevance calculations."""
    
    @staticmethod
    def increment_fallback(error_type: str, document_id: int, sdg_id: int):
        """
        Increment fallback counter and log the usage.
        
        Args:
            error_type: Type of error that triggered fallback ('connection', 'timeout')
            document_id: ID of the document being processed
            sdg_id: ID of the SDG being processed
        """
        global _fallback_counter
        
        if error_type == 'connection':
            _fallback_counter['connection_errors'] += 1
        elif error_type == 'timeout':
            _fallback_counter['timeout_errors'] += 1
        
        _fallback_counter['total_fallbacks'] += 1
        
        logger.warning(
            f"Fallback used for Document {document_id} / SDG {sdg_id} "
            f"(reason: {error_type}) - Total fallbacks: {_fallback_counter['total_fallbacks']}"
        )
    
    @staticmethod
    def get_fallback_stats() -> Dict[str, int]:
        """Get current fallback statistics."""
        global _fallback_counter
        return _fallback_counter.copy()
    
    @staticmethod
    def reset_fallback_stats():
        """Reset fallback statistics."""
        global _fallback_counter
        _fallback_counter = {
            'connection_errors': 0,
            'timeout_errors': 0,
            'total_fallbacks': 0
        }
        logger.info("Fallback statistics reset")
    
    @staticmethod
    def log_fallback_summary():
        """Log a summary of fallback usage."""
        stats = FallbackTracker.get_fallback_stats()
        
        if stats['total_fallbacks'] > 0:
            logger.warning(
                f"Fallback Summary: {stats['total_fallbacks']} total fallbacks used "
                f"({stats['connection_errors']} connection errors, "
                f"{stats['timeout_errors']} timeout errors)"
            )
        else:
            logger.info("No fallbacks were used during processing")
