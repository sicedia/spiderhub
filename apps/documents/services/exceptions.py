"""
Custom exceptions for LLM and SDG relevance services.

Provides specific exception types for better error handling and user experience.
"""

from typing import Optional


class LLMServiceError(Exception):
    """Base exception for LLM service errors."""
    
    def __init__(self, message: str, original_error: Optional[Exception] = None):
        self.message = message
        self.original_error = original_error
        super().__init__(self.message)


class LLMConnectionError(LLMServiceError):
    """Raised when LLM service cannot connect to the API."""
    
    def __init__(self, message: str = "Unable to connect to LLM service", original_error: Optional[Exception] = None):
        super().__init__(message, original_error)


class LLMTimeoutError(LLMServiceError):
    """Raised when LLM service request times out."""
    
    def __init__(self, message: str = "LLM service request timed out", original_error: Optional[Exception] = None):
        super().__init__(message, original_error)


class LLMAuthenticationError(LLMServiceError):
    """Raised when LLM service authentication fails."""
    
    def __init__(self, message: str = "LLM service authentication failed", original_error: Optional[Exception] = None):
        super().__init__(message, original_error)


class LLMRateLimitError(LLMServiceError):
    """Raised when LLM service rate limit is exceeded."""
    
    def __init__(self, message: str = "LLM service rate limit exceeded", original_error: Optional[Exception] = None):
        super().__init__(message, original_error)


class LLMResponseError(LLMServiceError):
    """Raised when LLM service returns invalid response."""
    
    def __init__(self, message: str = "LLM service returned invalid response", original_error: Optional[Exception] = None):
        super().__init__(message, original_error)


class SDGRelevanceError(Exception):
    """Base exception for SDG relevance calculation errors."""
    
    def __init__(self, message: str, document_id: Optional[int] = None, sdg_id: Optional[int] = None):
        self.message = message
        self.document_id = document_id
        self.sdg_id = sdg_id
        super().__init__(self.message)


class SDGProcessingError(SDGRelevanceError):
    """Raised when SDG processing fails."""
    
    def __init__(self, message: str, document_id: Optional[int] = None, sdg_id: Optional[int] = None):
        super().__init__(message, document_id, sdg_id)
