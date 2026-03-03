"""
Qualitative Indicator Analyzer

Analyzes document content for all nine qualitative indicators using text and
vision methods.  Follows the same Strategy pattern as SDGAnalyzer.

For each active QualitativeIndicator the analyzer:
  1. get_or_creates the DocumentQualitativeIndicator row
  2. Calls the LLM with a tailored prompt
  3. Writes the score, justification and evidence back to the row
"""

from typing import Dict, Any, List

from langchain_core.messages import HumanMessage

from .base import ContentAnalyzer
from ..logger import get_logger
from ..utils import parse_llm_json_response, validate_score

logger = get_logger(__name__)


class QualitativeAnalyzer(ContentAnalyzer):
    """
    ContentAnalyzer implementation for qualitative indicators.

    Works with all active QualitativeIndicator rows and creates /
    updates the corresponding DocumentQualitativeIndicator link for
    each document it processes.
    """

    def __init__(self, llm_service):
        self.llm_service = llm_service

    # ──────────────────────────────────────────────────────────────────────
    # ContentAnalyzer interface
    # ──────────────────────────────────────────────────────────────────────

    def get_analysis_type(self) -> str:
        return "qualitative"

    def analyze(self, document, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze all active qualitative indicators for the given document.

        Args:
            document:     Document instance
            content_data: Extracted content dict from DocumentProcessor

        Returns:
            Standard result dict:
                success   bool
                results   dict  keyed by indicator code
                errors    list[str]
                metadata  dict
        """
        logger.info(
            f"Starting qualitative analysis for Document {document.id}: {document.title}"
        )

        from apps.documents.models import QualitativeIndicator, DocumentQualitativeIndicator

        indicators = QualitativeIndicator.objects.filter(is_active=True)

        if not indicators.exists():
            logger.warning("No active QualitativeIndicators found – run seed_qualitative_indicators first.")
            return {
                "success": False,
                "results": {},
                "errors": ["No active qualitative indicators in catalog."],
                "metadata": {"analysis_type": "qualitative", "indicator_count": 0},
            }

        results = {}
        errors = []
        success_count = 0

        for indicator in indicators:
            # Ensure the through-table row exists
            doc_qi, _ = DocumentQualitativeIndicator.objects.get_or_create(
                document=document,
                indicator=indicator,
            )

            try:
                result = self._analyze_single_indicator(document, indicator, doc_qi, content_data)

                if result["success"]:
                    results[indicator.code] = result["data"]
                    success_count += 1
                else:
                    errors.append(f"{indicator.code}: {result['error']}")

            except Exception as exc:
                msg = f"{indicator.code} analysis failed: {exc}"
                logger.error(msg, exc_info=True)
                errors.append(msg)

        logger.info(
            f"Qualitative analysis complete for Document {document.id}: "
            f"{success_count}/{indicators.count()} successful"
        )

        return {
            "success": success_count > 0,
            "results": results,
            "errors": errors,
            "metadata": {
                "analysis_type": "qualitative",
                "indicator_count": indicators.count(),
                "successful_count": success_count,
                "processing_type": content_data.get("type", "unknown"),
            },
        }

    # ──────────────────────────────────────────────────────────────────────
    # Single-indicator dispatch
    # ──────────────────────────────────────────────────────────────────────

    def _analyze_single_indicator(
        self,
        document,
        indicator,
        doc_qi,
        content_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Dispatch to text / vision / hybrid path and save the result."""
        processing_type = content_data.get("type", "unknown")
        logger.debug(f"Analyzing {indicator.code} using {processing_type} processing")

        try:
            if processing_type == "text":
                result = self._analyze_with_text(document, indicator, content_data["content"])
            elif processing_type == "hybrid":
                result = self._analyze_with_hybrid(document, indicator, content_data)
            elif processing_type == "vision":
                result = self._analyze_with_vision(document, indicator, content_data["content"])
            else:
                raise ValueError(f"Unsupported processing type: {processing_type}")

            # Persist to DB
            doc_qi.score = result["score"]
            doc_qi.justification = result["justification"]
            doc_qi.evidence = result.get("evidence") or ""
            doc_qi.save(update_fields=["score", "justification", "evidence", "updated_at"])

            logger.info(
                f"  Updated DocumentQualitativeIndicator {doc_qi.id}: "
                f"{indicator.code} score={result['score']:.3f}"
            )

            return {"success": True, "data": result, "error": None}

        except Exception as exc:
            msg = f"{indicator.code} failed: {exc}"
            logger.error(msg, exc_info=True)
            return {"success": False, "data": None, "error": msg}

    # ──────────────────────────────────────────────────────────────────────
    # Text path
    # ──────────────────────────────────────────────────────────────────────

    def _analyze_with_text(self, document, indicator, text_content: str) -> Dict[str, Any]:
        prompt = self._generate_text_prompt(document.title, indicator, text_content)
        raw = self.llm_service.call_llm(prompt)
        return {
            "score": raw["score"],
            "justification": raw["justification"],
            "evidence": raw.get("evidence", ""),
        }

    # ──────────────────────────────────────────────────────────────────────
    # Vision path
    # ──────────────────────────────────────────────────────────────────────

    def _analyze_with_vision(self, document, indicator, images: List[str]) -> Dict[str, Any]:
        prompt = self._generate_vision_prompt(document.title, indicator)
        message_content = [{"type": "text", "text": prompt}]
        for img in images:
            message_content.append(
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img}"}}
            )
        message = HumanMessage(content=message_content)
        response = self.llm_service.llm.invoke([message])
        return self._parse_response(response)

    # ──────────────────────────────────────────────────────────────────────
    # Hybrid path
    # ──────────────────────────────────────────────────────────────────────

    def _analyze_with_hybrid(self, document, indicator, content_data: Dict[str, Any]) -> Dict[str, Any]:
        vision_images = self._extract_vision_images(content_data)
        if vision_images:
            return self._analyze_with_langchain_vision(
                document, indicator, content_data["content"], vision_images
            )
        logger.info(
            f"No vision images for Document {document.id}, falling back to text for {indicator.code}"
        )
        return self._analyze_with_text(document, indicator, content_data["content"])

    def _analyze_with_langchain_vision(
        self, document, indicator, text_content: str, vision_images: List[str]
    ) -> Dict[str, Any]:
        prompt = self._generate_hybrid_prompt(document.title, indicator, text_content)
        message_content = [{"type": "text", "text": prompt}]
        for img in vision_images:
            message_content.append(
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img}"}}
            )
        message = HumanMessage(content=message_content)
        response = self.llm_service.llm.invoke([message])
        return self._parse_response(response)

    # ──────────────────────────────────────────────────────────────────────
    # Prompt templates
    # ──────────────────────────────────────────────────────────────────────

    def _generate_text_prompt(self, document_title: str, indicator, text_content: str) -> str:
        from ..utils import truncate_text, clean_text_for_analysis

        clean = clean_text_for_analysis(text_content)
        truncated = truncate_text(clean, 4000, strategy="smart")

        return f"""You are an expert evaluator of digital cooperation and policy dialogue documents.

Document Title: {document_title}

Document Text:
{truncated}

Qualitative Indicator to Assess: {indicator.label}
Level: {indicator.level.upper()}
Description: {indicator.description}

Task: Assess the presence and quality of this indicator in the document on a scale of 0.0 to 1.0.

Evidence Scale:
- 0.0–0.3: Not evident — the indicator dimension is absent or only superficially mentioned
- 0.4–0.6: Partially evident — some relevant content but incomplete or implicit
- 0.7–0.9: Clearly evident — substantial, well-documented evidence of this dimension
- 1.0: Central focus — the indicator is a primary, explicit concern of the document

Instructions:
1. Read the document carefully with the indicator description in mind.
2. Identify passages, statements, or structural elements relevant to the indicator.
3. Assign a score based on the scale above.
4. Provide a 2–3 sentence justification explaining your score.
5. If possible, include a brief direct quote or paraphrase that best supports your score as "evidence".

You MUST respond with valid JSON in exactly this format:
{{
  "score": 0.75,
  "justification": "Your 2–3 sentence explanation here.",
  "evidence": "Relevant quote or paraphrase from the document (or empty string if none)."
}}

Do not include any text outside the JSON object."""

    def _generate_vision_prompt(self, document_title: str, indicator) -> str:
        return f"""You are an expert evaluator of digital cooperation and policy dialogue documents.

Document Title: {document_title}

Qualitative Indicator to Assess: {indicator.label}
Level: {indicator.level.upper()}
Description: {indicator.description}

Task: Analyse the PDF images provided and assess the presence and quality of this indicator on a scale of 0.0 to 1.0.

Evidence Scale:
- 0.0–0.3: Not evident
- 0.4–0.6: Partially evident
- 0.7–0.9: Clearly evident
- 1.0: Central focus

You MUST respond with valid JSON in exactly this format:
{{
  "score": 0.75,
  "justification": "Your 2–3 sentence explanation here.",
  "evidence": "Relevant quote or paraphrase from the document (or empty string if none)."
}}

Do not include any text outside the JSON object."""

    def _generate_hybrid_prompt(
        self, document_title: str, indicator, text_content: str
    ) -> str:
        from ..utils import truncate_text, clean_text_for_analysis

        clean = clean_text_for_analysis(text_content)
        truncated = truncate_text(clean, 3000, strategy="smart")

        return f"""You are an expert evaluator of digital cooperation and policy dialogue documents.

Document Title: {document_title}

Qualitative Indicator to Assess: {indicator.label}
Level: {indicator.level.upper()}
Description: {indicator.description}

Task: Using both the extracted text and the PDF images provided, assess the presence and quality of this indicator on a scale of 0.0 to 1.0.

Evidence Scale:
- 0.0–0.3: Not evident
- 0.4–0.6: Partially evident
- 0.7–0.9: Clearly evident
- 1.0: Central focus

Extracted Text:
{truncated}

You MUST respond with valid JSON in exactly this format:
{{
  "score": 0.75,
  "justification": "Your 2–3 sentence explanation here.",
  "evidence": "Relevant quote or paraphrase from the document (or empty string if none)."
}}

Do not include any text outside the JSON object."""

    # ──────────────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────────────

    def _parse_response(self, response) -> Dict[str, Any]:
        """Parse a raw LangChain response into score / justification / evidence."""
        response_text = response.content if hasattr(response, "content") else str(response)
        logger.debug(f"LLM response: {response_text[:200]}...")

        parsed = parse_llm_json_response(response_text)

        if "score" not in parsed:
            raise ValueError("LLM response missing 'score' field")
        if "justification" not in parsed:
            raise ValueError("LLM response missing 'justification' field")

        score = float(parsed["score"])
        if not validate_score(score):
            raise ValueError(f"Invalid score {score} — must be 0.0–1.0")

        return {
            "score": score,
            "justification": str(parsed["justification"]),
            "evidence": str(parsed.get("evidence", "")),
        }

    def _extract_vision_images(self, content_data: Dict[str, Any]) -> List[str]:
        images = []
        try:
            metadata = content_data.get("metadata", {})
            vision_dict = metadata.get("vision_images", {})
            for file_images in vision_dict.values():
                images.extend(file_images)
            logger.debug(f"Extracted {len(images)} vision images from metadata")
        except Exception as exc:
            logger.warning(f"Could not extract vision images: {exc}")
        return images

    # ──────────────────────────────────────────────────────────────────────
    # Public helper used by qualitative_service (single-indicator variant)
    # ──────────────────────────────────────────────────────────────────────

    def analyze_single_indicator(
        self, document, indicator, doc_qi, content_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyse one indicator with pre-extracted content (cache-friendly)."""
        return self._analyze_single_indicator(document, indicator, doc_qi, content_data)
