"""
Utility functions for SDG relevance ingestion.

Helper functions for validation, text processing, and statistics formatting.
"""

import os
import re
from typing import Dict, Any


def validate_llm_config() -> tuple[bool, str]:
    """
    Validate that LLM configuration is properly set in environment.
    
    Supports:
    - Direct OpenAI API
    - Proxy/Gateway LLM with custom base_url
    - Anthropic API
    - Local Ollama
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    provider = os.getenv('LLM_PROVIDER', 'openai').lower()
    
    if provider == 'openai':
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key or api_key == 'your_openai_api_key_here':
            return False, "OPENAI_API_KEY not set in environment. Please configure .env file."
        
        # Check if using proxy LLM (optional base_url)
        base_url = os.getenv('LLM_BASE_URL')
        if base_url:
            # Validate base_url format
            if not base_url.startswith('http'):
                return False, f"LLM_BASE_URL must start with http:// or https://. Got: {base_url}"
    
    elif provider == 'anthropic':
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key or api_key == 'your_anthropic_api_key_here':
            return False, "ANTHROPIC_API_KEY not set in environment. Please configure .env file."
    
    elif provider == 'ollama':
        base_url = os.getenv('OLLAMA_BASE_URL')
        if not base_url:
            return False, "OLLAMA_BASE_URL not set in environment. Please configure .env file."
    
    else:
        return False, f"Invalid LLM_PROVIDER '{provider}'. Use: openai, anthropic, or ollama."
    
    # Check model is set
    model = os.getenv('LLM_MODEL')
    if not model:
        return False, "LLM_MODEL not set in environment. Please configure .env file."
    
    return True, None


def truncate_text(text: str, max_chars: int = 4000, strategy: str = 'smart') -> str:
    """
    Truncate text to prevent LLM token limit issues.
    
    Uses smart truncation by default: takes beginning and end to preserve context.
    
    Args:
        text: Input text to truncate
        max_chars: Maximum characters to keep (default: 4000)
        strategy: 'smart' (beginning+end) or 'simple' (beginning only)
        
    Returns:
        Truncated text
    """
    if len(text) <= max_chars:
        return text
    
    if strategy == 'smart':
        # Take 70% from beginning, 30% from end to preserve context
        beginning_chars = int(max_chars * 0.7)
        end_chars = int(max_chars * 0.3)
        
        beginning = text[:beginning_chars]
        end = text[-end_chars:]
        
        return f"{beginning}\n\n[... middle content truncated ...]\n\n{end}"
    
    else:  # simple strategy
        return text[:max_chars] + "\n\n[... truncated ...]"


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe file system operations.
    
    Removes or replaces characters that could cause issues.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove control characters
    filename = re.sub(r'[\x00-\x1f\x7f]', '', filename)
    # Limit length
    if len(filename) > 200:
        filename = filename[:200]
    
    return filename


def format_processing_stats(stats: Dict[str, Any]) -> str:
    """
    Format processing statistics for pretty printing.
    
    Args:
        stats: Dictionary with processing statistics
        
    Returns:
        Formatted string for display
    """
    lines = [
        "=" * 60,
        "SDG Relevance Processing Summary",
        "=" * 60,
    ]
    
    if 'documents_processed' in stats:
        lines.append(f"Documents Processed: {stats['documents_processed']}")
    
    if 'sdgs_processed' in stats:
        lines.append(f"SDG Links Processed: {stats['sdgs_processed']}")
    
    if 'success' in stats:
        lines.append(f"✓ Successful: {stats['success']}")
    
    if 'failed' in stats:
        lines.append(f"✗ Failed: {stats['failed']}")
    
    if 'skipped' in stats:
        lines.append(f"⊘ Skipped: {stats['skipped']}")
    
    if 'total_time' in stats:
        lines.append(f"Total Time: {stats['total_time']:.2f}s")
    
    lines.append("=" * 60)
    
    return "\n".join(lines)


def parse_llm_json_response(response_text: str) -> Dict[str, Any]:
    """
    Parse JSON response from LLM, handling common formatting issues.
    
    LLMs sometimes return JSON wrapped in markdown code blocks or with extra text.
    This function extracts and parses the JSON robustly.
    
    Args:
        response_text: Raw LLM response text
        
    Returns:
        Parsed JSON as dictionary
        
    Raises:
        ValueError: If JSON cannot be parsed
    """
    import json
    
    # Remove markdown code blocks if present
    if '```json' in response_text:
        # Extract content between ```json and ```
        match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if match:
            response_text = match.group(1)
    elif '```' in response_text:
        # Extract content between ``` and ```
        match = re.search(r'```\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        if match:
            response_text = match.group(1)
    
    # Try to find JSON object in the text
    match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if match:
        response_text = match.group(0)
    
    try:
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from LLM response: {e}\nResponse: {response_text[:200]}")


def validate_score(score: float) -> bool:
    """
    Validate that a score is within the valid range [0.0, 1.0].
    
    Args:
        score: Score to validate
        
    Returns:
        True if valid, False otherwise
    """
    return isinstance(score, (int, float)) and 0.0 <= score <= 1.0


def clean_text_for_analysis(text: str) -> str:
    """
    Clean and normalize text for LLM analysis.
    
    Removes excessive whitespace, normalizes line breaks, etc.
    
    Args:
        text: Raw text
        
    Returns:
        Cleaned text
    """
    # Normalize line breaks
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Remove excessive whitespace
    text = re.sub(r' +', ' ', text)
    
    # Remove excessive line breaks (max 2 consecutive)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Strip leading/trailing whitespace
    text = text.strip()
    
    return text

