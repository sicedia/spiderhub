"""
LLM Service with LangChain abstraction.

Provides a provider-agnostic interface for LLM calls using LangChain.
Supports OpenAI, Anthropic, and Ollama with automatic retry logic.
"""

import os
import time
import json
from typing import Dict, Any, Optional
from .logger import get_logger
from .utils import parse_llm_json_response, validate_score
from .exceptions import (
    LLMServiceError, LLMConnectionError, LLMTimeoutError, 
    LLMAuthenticationError, LLMRateLimitError, LLMResponseError
)

logger = get_logger(__name__)


class LLMService:
    """
    Provider-agnostic LLM service using LangChain.
    
    Handles configuration, initialization, and robust LLM calls with
    exponential backoff retry logic.
    """
    
    def __init__(self):
        """Initialize LLM service with configuration from environment."""
        self.provider = os.getenv('LLM_PROVIDER', 'openai').lower()
        self.model = os.getenv('LLM_MODEL', 'gpt-4o')
        self.temperature = float(os.getenv('LLM_TEMPERATURE', '0.1'))
        self.max_tokens = int(os.getenv('LLM_MAX_TOKENS', '500'))
        self.timeout = int(os.getenv('LLM_TIMEOUT', '60'))
        self.max_retries = int(os.getenv('LLM_MAX_RETRIES', '3'))
        
        self.llm = None
        self._initialize_llm()
    
    def _initialize_llm(self):
        """
        Initialize the appropriate LangChain LLM based on provider.
        
        Raises:
            ValueError: If provider is not supported or credentials missing
        """
        try:
            if self.provider == 'openai':
                self._initialize_openai()
            elif self.provider == 'anthropic':
                self._initialize_anthropic()
            elif self.provider == 'ollama':
                self._initialize_ollama()
            else:
                raise ValueError(
                    f"Unsupported LLM provider: {self.provider}. "
                    "Use: openai, anthropic, or ollama"
                )
            
            logger.info(f"LLM service initialized: {self.provider} / {self.model}")
        
        except Exception as e:
            logger.error(f"Failed to initialize LLM service: {str(e)}")
            raise
    
    def _initialize_openai(self):
        """Initialize OpenAI LLM via LangChain.
        
        Supports both:
        - Direct OpenAI API (standard)
        - Proxy/Gateway LLM with custom base_url (e.g., company proxy)
        """
        try:
            from langchain_openai import ChatOpenAI
            
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key or api_key == 'your_openai_api_key_here':
                raise ValueError(
                    "OPENAI_API_KEY not set or invalid. "
                    "Please configure your .env file."
                )
            
            # Support for proxy/gateway LLM with custom base_url
            base_url = os.getenv('LLM_BASE_URL')
            
            # Build ChatOpenAI configuration
            config = {
                'model': self.model,
                'temperature': self.temperature,
                'max_tokens': self.max_tokens,
                'timeout': self.timeout,
                'max_retries': self.max_retries,
                'api_key': api_key
            }
            
            # Add base_url if using proxy/gateway
            if base_url:
                config['base_url'] = base_url
                logger.info(f"Using custom LLM base URL: {base_url}")
            
            self.llm = ChatOpenAI(**config)
            
        except ImportError:
            raise ImportError(
                "langchain-openai not installed. "
                "Run: pip install langchain-openai"
            )
    
    def _initialize_anthropic(self):
        """Initialize Anthropic (Claude) LLM via LangChain."""
        try:
            from langchain_anthropic import ChatAnthropic
            
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key or api_key == 'your_anthropic_api_key_here':
                raise ValueError(
                    "ANTHROPIC_API_KEY not set or invalid. "
                    "Please configure your .env file."
                )
            
            self.llm = ChatAnthropic(
                model=self.model,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                timeout=self.timeout,
                api_key=api_key
            )
            
        except ImportError:
            raise ImportError(
                "langchain-anthropic not installed. "
                "Run: pip install langchain-anthropic"
            )
    
    def _initialize_ollama(self):
        """Initialize Ollama (local) LLM via LangChain."""
        try:
            from langchain_community.llms import Ollama
            
            base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
            
            self.llm = Ollama(
                model=self.model,
                temperature=self.temperature,
                base_url=base_url
            )
            
        except ImportError:
            raise ImportError(
                "langchain-community not installed. "
                "Run: pip install langchain-community"
            )
    
    def call_llm(
        self, 
        prompt: str, 
        max_retries: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Call LLM with robust error handling and retry logic.
        
        Implements exponential backoff: 2s, 4s, 8s between retries.
        
        Args:
            prompt: The prompt to send to the LLM
            max_retries: Maximum retry attempts (default: from config)
            
        Returns:
            dict: Parsed JSON response with 'score' and 'justification'
            
        Raises:
            LLMServiceError: If all retries fail with specific error type
        """
        if max_retries is None:
            max_retries = self.max_retries
        
        last_error = None
        last_error_type = None
        
        for attempt in range(max_retries):
            try:
                logger.debug(f"LLM call attempt {attempt + 1}/{max_retries}")
                
                # Call LLM via LangChain
                response = self.llm.invoke(prompt)
                
                # Extract text from response
                if hasattr(response, 'content'):
                    response_text = response.content
                else:
                    response_text = str(response)
                
                logger.debug(f"LLM raw response: {response_text[:200]}...")
                
                # Parse JSON response
                parsed = parse_llm_json_response(response_text)
                
                # Validate required fields
                if 'score' not in parsed:
                    raise LLMResponseError("LLM response missing 'score' field")
                
                if 'justification' not in parsed:
                    raise LLMResponseError("LLM response missing 'justification' field")
                
                # Validate score range
                score = float(parsed['score'])
                if not validate_score(score):
                    raise LLMResponseError(
                        f"Invalid score {score}. Must be between 0.0 and 1.0"
                    )
                
                # Success!
                logger.info(f"LLM call successful on attempt {attempt + 1}")
                return {
                    'score': score,
                    'justification': str(parsed['justification'])
                }
            
            except Exception as e:
                last_error = e
                last_error_type = self._categorize_error(e)
                
                # Log appropriate level based on error type
                if isinstance(e, (LLMConnectionError, LLMTimeoutError)):
                    logger.warning(f"LLM call attempt {attempt + 1} failed: {str(e)}")
                else:
                    logger.warning(
                        f"LLM call attempt {attempt + 1} failed: {str(e)}",
                        exc_info=(attempt == max_retries - 1)  # Full trace only on last attempt
                    )
                
                # Exponential backoff: 2s, 4s, 8s
                if attempt < max_retries - 1:
                    sleep_time = 2 ** (attempt + 1)
                    logger.info(f"Retrying in {sleep_time} seconds...")
                    time.sleep(sleep_time)
        
        # All retries failed - raise appropriate exception
        if last_error_type:
            raise last_error_type(f"LLM call failed after {max_retries} attempts", last_error)
        else:
            raise LLMServiceError(f"LLM call failed after {max_retries} attempts: {str(last_error)}", last_error)
    
    def _categorize_error(self, error: Exception) -> Optional[LLMServiceError]:
        """
        Categorize exceptions into specific LLM error types.
        
        Args:
            error: The original exception
            
        Returns:
            Appropriate LLMServiceError subclass or None
        """
        error_str = str(error).lower()
        error_type = type(error).__name__.lower()
        
        # Connection and timeout errors
        if any(keyword in error_str for keyword in ['timeout', 'timed out', 'connect timeout']):
            return LLMTimeoutError
        
        if any(keyword in error_str for keyword in ['connection', 'connect', 'network', 'unreachable']):
            return LLMConnectionError
        
        # Authentication errors
        if any(keyword in error_str for keyword in ['unauthorized', 'authentication', 'api key', 'invalid key']):
            return LLMAuthenticationError
        
        # Rate limiting
        if any(keyword in error_str for keyword in ['rate limit', 'too many requests', 'quota']):
            return LLMRateLimitError
        
        # Response errors
        if any(keyword in error_str for keyword in ['invalid response', 'parse', 'json', 'format']):
            return LLMResponseError
        
        return None
    
    def generate_sdg_relevance_prompt(
        self,
        document_title: str,
        document_text: str,
        sdg_number: int,
        sdg_label: str,
        max_text_length: int = 4000
    ) -> str:
        """
        Generate optimized prompt for SDG relevance analysis.
        
        Args:
            document_title: Title of the document
            document_text: Full or truncated text content
            sdg_number: SDG number (1-17)
            sdg_label: SDG description/label
            max_text_length: Maximum characters of text to include
            
        Returns:
            Formatted prompt string
        """
        from .utils import truncate_text, clean_text_for_analysis
        
        # Clean and truncate text
        clean_text = clean_text_for_analysis(document_text)
        truncated_text = truncate_text(clean_text, max_text_length, strategy='smart')
        
        prompt = f"""You are an expert in analyzing policy documents for alignment with the United Nations Sustainable Development Goals (SDGs).

Document Title: {document_title}

Document Text:
{truncated_text}

SDG to Analyze: SDG {sdg_number} - {sdg_label}

Task: Analyze this document's relevance to the specified SDG on a scale of 0.0 to 1.0.

Relevance Scale:
- 0.0-0.3: Not relevant or only tangentially mentioned
- 0.4-0.6: Moderately relevant, the SDG is addressed but not a primary focus
- 0.7-0.9: Highly relevant, significant alignment with the SDG
- 1.0: Core focus, the document directly implements or strongly promotes this SDG

Instructions:
1. Read the document carefully
2. Identify mentions, themes, or commitments related to SDG {sdg_number}
3. Assign a relevance score based on the scale above
4. Provide a 2-3 sentence justification explaining your score

You MUST respond with valid JSON in exactly this format:
{{
  "score": 0.85,
  "justification": "Your 2-3 sentence explanation here."
}}

Do not include any text outside the JSON object."""

        return prompt


# Singleton instance for reuse
_llm_service_instance = None


def get_llm_service() -> LLMService:
    """
    Get singleton instance of LLMService.
    
    Returns:
        LLMService instance
    """
    global _llm_service_instance
    
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    
    return _llm_service_instance

