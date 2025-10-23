"""
SDG Content Analyzer

Analyzes document content for SDG relevance using both text and vision methods.
Handles DocumentSDG relationship updates and provides structured results.
"""

from typing import Dict, Any, List
from langchain_core.messages import HumanMessage
from .base import ContentAnalyzer
from ..logger import get_logger
from ..utils import parse_llm_json_response, validate_score

logger = get_logger(__name__)


class SDGAnalyzer(ContentAnalyzer):
    """
    Analyzer for SDG relevance analysis.
    
    This analyzer:
    1. Handles both text-based and vision-based analysis
    2. Updates DocumentSDG records with scores and justifications
    3. Provides structured results for all SDG links
    4. Maintains compatibility with existing SDG processing
    """
    
    def __init__(self, llm_service):
        """
        Initialize SDG analyzer.
        
        Args:
            llm_service: LLMService instance for API calls
        """
        self.llm_service = llm_service
    
    def analyze(self, document, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze SDG relevance for all linked SDGs.
        
        Args:
            document: Document instance to analyze
            content_data: Content data from DocumentProcessor
            
        Returns:
            dict: SDG analysis results
        """
        logger.info(f"Starting SDG analysis for Document {document.id}: {document.title}")
        
        try:
            # Get all DocumentSDG relationships for this document
            from apps.documents.models import DocumentSDG
            
            document_sdgs = DocumentSDG.objects.filter(document=document).select_related('sdg')
            
            if not document_sdgs.exists():
                logger.warning(f"Document {document.id} has no SDG links")
                return {
                    'success': True,
                    'results': {},
                    'errors': [],
                    'metadata': {
                        'analysis_type': 'sdg',
                        'sdg_count': 0,
                        'processing_type': content_data.get('type', 'unknown')
                    }
                }
            
            results = {}
            errors = []
            success_count = 0
            
            # Analyze each SDG link
            for doc_sdg in document_sdgs:
                try:
                    result = self._analyze_single_sdg(document, doc_sdg, content_data)
                    
                    if result['success']:
                        results[f"sdg_{doc_sdg.sdg.number}"] = result['data']
                        success_count += 1
                    else:
                        errors.append(f"SDG {doc_sdg.sdg.number}: {result['error']}")
                        
                except Exception as e:
                    error_msg = f"SDG {doc_sdg.sdg.number} analysis failed: {str(e)}"
                    logger.error(error_msg, exc_info=True)
                    errors.append(error_msg)
            
            logger.info(f"SDG analysis complete for Document {document.id}: {success_count}/{len(document_sdgs)} successful")
            
            return {
                'success': success_count > 0,
                'results': results,
                'errors': errors,
                'metadata': {
                    'analysis_type': 'sdg',
                    'sdg_count': len(document_sdgs),
                    'successful_count': success_count,
                    'processing_type': content_data.get('type', 'unknown')
                }
            }
            
        except Exception as e:
            error_msg = f"SDG analysis failed for Document {document.id}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return {
                'success': False,
                'results': {},
                'errors': [error_msg],
                'metadata': {
                    'analysis_type': 'sdg',
                    'sdg_count': 0,
                    'successful_count': 0,
                    'processing_type': content_data.get('type', 'unknown')
                }
            }
    
    def _analyze_single_sdg(self, document, doc_sdg, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single SDG relationship.
        
        Args:
            document: Document instance
            doc_sdg: DocumentSDG relationship instance
            content_data: Content data from processor
            
        Returns:
            dict: Analysis result for single SDG
        """
        processing_type = content_data.get('type', 'unknown')
        
        logger.debug(f"Analyzing SDG {doc_sdg.sdg.number} using {processing_type} processing")
        
        try:
            if processing_type == 'text':
                result = self._analyze_with_text(document, doc_sdg, content_data['content'])
            elif processing_type == 'vision':
                result = self._analyze_with_vision(document, doc_sdg, content_data['content'])
            else:
                raise ValueError(f"Unsupported processing type: {processing_type}")
            
            # Update DocumentSDG record
            doc_sdg.relevance_score = result['score']
            doc_sdg.justification = result['justification']
            doc_sdg.save(update_fields=['relevance_score', 'justification', 'updated_at'])
            
            logger.info(f"✓ Updated DocumentSDG {doc_sdg.id}: score={result['score']:.3f}")
            
            return {
                'success': True,
                'data': result,
                'error': None
            }
            
        except Exception as e:
            error_msg = f"SDG {doc_sdg.sdg.number} analysis failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
    
    def _analyze_with_text(self, document, doc_sdg, text_content: str) -> Dict[str, Any]:
        """
        Analyze SDG relevance using text content.
        
        Args:
            document: Document instance
            doc_sdg: DocumentSDG relationship
            text_content: Extracted text content
            
        Returns:
            dict: Analysis result with score and justification
        """
        # Use existing prompt generation
        prompt = self.llm_service.generate_sdg_relevance_prompt(
            document_title=document.title,
            document_text=text_content,
            sdg_number=doc_sdg.sdg.number,
            sdg_label=doc_sdg.sdg.label,
            max_text_length=4000
        )
        
        # Call LLM
        result = self.llm_service.call_llm(prompt)
        
        return {
            'score': result['score'],
            'justification': result['justification']
        }
    
    def _analyze_with_vision(self, document, doc_sdg, images: List[str]) -> Dict[str, Any]:
        """
        Analyze SDG relevance using vision processing.
        
        Args:
            document: Document instance
            doc_sdg: DocumentSDG relationship
            images: List of base64-encoded images
            
        Returns:
            dict: Analysis result with score and justification
        """
        # Generate vision-specific prompt
        prompt = self._generate_vision_sdg_prompt(
            document.title,
            doc_sdg.sdg.number,
            doc_sdg.sdg.label
        )
        
        # Create vision message
        message_content = [{"type": "text", "text": prompt}]
        
        for img_base64 in images:
            message_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{img_base64}"}
            })
        
        message = HumanMessage(content=message_content)
        
        # Call LLM with vision
        response = self.llm_service.llm.invoke([message])
        
        # Extract response text
        if hasattr(response, 'content'):
            response_text = response.content
        else:
            response_text = str(response)
        
        logger.debug(f"Vision LLM response: {response_text[:200]}...")
        
        # Parse JSON response
        parsed = parse_llm_json_response(response_text)
        
        # Validate required fields
        if 'score' not in parsed:
            raise ValueError("LLM response missing 'score' field")
        
        if 'justification' not in parsed:
            raise ValueError("LLM response missing 'justification' field")
        
        # Validate score range
        score = float(parsed['score'])
        if not validate_score(score):
            raise ValueError(f"Invalid score {score}. Must be between 0.0 and 1.0")
        
        return {
            'score': score,
            'justification': str(parsed['justification'])
        }
    
    def _generate_vision_sdg_prompt(self, document_title: str, sdg_number: int, sdg_label: str) -> str:
        """
        Generate prompt for vision-based SDG analysis.
        
        Args:
            document_title: Title of the document
            sdg_number: SDG number (1-17)
            sdg_label: SDG description/label
            
        Returns:
            str: Formatted prompt for vision analysis
        """
        return f"""You are an expert in analyzing policy documents for alignment with the United Nations Sustainable Development Goals (SDGs).

Document Title: {document_title}

SDG to Analyze: SDG {sdg_number} - {sdg_label}

Task: Analyze this PDF document's relevance to the specified SDG on a scale of 0.0 to 1.0.

Relevance Scale:
- 0.0-0.3: Not relevant or only tangentially mentioned
- 0.4-0.6: Moderately relevant, the SDG is addressed but not a primary focus
- 0.7-0.9: Highly relevant, significant alignment with the SDG
- 1.0: Core focus, the document directly implements or strongly promotes this SDG

Instructions:
1. Read the PDF document carefully (extract all text from images)
2. Identify mentions, themes, or commitments related to SDG {sdg_number}
3. Assign a relevance score based on the scale above
4. Provide a 2-3 sentence justification explaining your score

You MUST respond with valid JSON in exactly this format:
{{
  "score": 0.85,
  "justification": "Your 2-3 sentence explanation here."
}}

Do not include any text outside the JSON object."""
    
    def get_analysis_type(self) -> str:
        """Return the analysis type identifier."""
        return 'sdg'
