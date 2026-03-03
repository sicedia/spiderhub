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
            "category": raw.get("category", self._score_to_category(raw["score"])),
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

    # Shared tier table injected into every prompt
    _TIER_TABLE = """\
Scoring tiers — choose the one that best matches the document:
┌─────────────────┬───────────────┬──────────────────────────────────────────────────────────┐
│ Category        │ Score range   │ When to use                                              │
├─────────────────┼───────────────┼──────────────────────────────────────────────────────────┤
│ not_evident     │ 0.00 – 0.30   │ The dimension is absent or only superficially hinted at  │
│ partially       │ 0.31 – 0.60   │ Some relevant content exists but it is implicit,         │
│                 │               │ incomplete, or limited to a single passing reference      │
│ clearly_evident │ 0.61 – 0.90   │ Substantial, well-documented evidence; multiple passages │
│                 │               │ address the dimension explicitly                          │
│ central_focus   │ 0.91 – 1.00   │ The dimension is a primary, defining concern of the      │
│                 │               │ whole document; almost every section references it        │
└─────────────────┴───────────────┴──────────────────────────────────────────────────────────┘"""

    def _generate_text_prompt(self, document_title: str, indicator, text_content: str) -> str:
        from ..utils import truncate_text, clean_text_for_analysis

        clean = clean_text_for_analysis(text_content)
        truncated = truncate_text(clean, 4000, strategy="smart")

        return f"""You are an expert evaluator of EU-LAC digital cooperation and policy dialogue documents.
Your task is to assess how strongly one specific qualitative indicator is present in the document.

═══════════════════════════════════════════════════
DOCUMENT
═══════════════════════════════════════════════════
Title: {document_title}

Text:
{truncated}

═══════════════════════════════════════════════════
INDICATOR TO ASSESS
═══════════════════════════════════════════════════
Name:        {indicator.label}
Level:       {indicator.level.upper()}  (Micro = actor/institutional · Meso = project/collaboration · Macro = regional/systemic)
Dimension:   {indicator.dimension}
Description: {indicator.description}

═══════════════════════════════════════════════════
SCORING GUIDE
═══════════════════════════════════════════════════
{self._TIER_TABLE}

═══════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════
1. Read the document with the indicator description firmly in mind.
2. Identify every passage, commitment, or structural element that is relevant to this indicator.
3. Choose the category that best matches the overall evidence and assign a precise score within that range.
4. Write a 2–4 sentence justification that explains WHY you chose this category.
   — Reference specific sections or statements.
   — Explain what is present AND what is missing or weak.
5. Extract the single most representative quote or paraphrase as "evidence" (≤ 60 words).
   Leave evidence empty if the document has no extractable text.

You MUST respond with ONLY valid JSON in exactly this format — no markdown, no extra text:
{{
  "score": 0.75,
  "category": "clearly_evident",
  "justification": "Your 2–4 sentence explanation referencing specific content.",
  "evidence": "Direct quote or close paraphrase from the document (≤ 60 words), or empty string."
}}"""

    def _generate_vision_prompt(self, document_title: str, indicator) -> str:
        return f"""You are an expert evaluator of EU-LAC digital cooperation and policy dialogue documents.
Analyse the PDF page images provided and assess how strongly one qualitative indicator is present.

═══════════════════════════════════════════════════
DOCUMENT
═══════════════════════════════════════════════════
Title: {document_title}

═══════════════════════════════════════════════════
INDICATOR TO ASSESS
═══════════════════════════════════════════════════
Name:        {indicator.label}
Level:       {indicator.level.upper()}
Dimension:   {indicator.dimension}
Description: {indicator.description}

═══════════════════════════════════════════════════
SCORING GUIDE
═══════════════════════════════════════════════════
{self._TIER_TABLE}

You MUST respond with ONLY valid JSON — no markdown, no extra text:
{{
  "score": 0.75,
  "category": "clearly_evident",
  "justification": "Your 2–4 sentence explanation referencing specific content.",
  "evidence": "Direct quote or close paraphrase (≤ 60 words), or empty string."
}}"""

    def _generate_hybrid_prompt(
        self, document_title: str, indicator, text_content: str
    ) -> str:
        from ..utils import truncate_text, clean_text_for_analysis

        clean = clean_text_for_analysis(text_content)
        truncated = truncate_text(clean, 3000, strategy="smart")

        return f"""You are an expert evaluator of EU-LAC digital cooperation and policy dialogue documents.
Use BOTH the extracted text below AND the PDF page images attached to assess how strongly one qualitative indicator is present.

═══════════════════════════════════════════════════
DOCUMENT
═══════════════════════════════════════════════════
Title: {document_title}

Extracted Text:
{truncated}

═══════════════════════════════════════════════════
INDICATOR TO ASSESS
═══════════════════════════════════════════════════
Name:        {indicator.label}
Level:       {indicator.level.upper()}
Dimension:   {indicator.dimension}
Description: {indicator.description}

═══════════════════════════════════════════════════
SCORING GUIDE
═══════════════════════════════════════════════════
{self._TIER_TABLE}

You MUST respond with ONLY valid JSON — no markdown, no extra text:
{{
  "score": 0.75,
  "category": "clearly_evident",
  "justification": "Your 2–4 sentence explanation referencing specific content.",
  "evidence": "Direct quote or close paraphrase (≤ 60 words), or empty string."
}}\
"""

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

        category = str(parsed.get("category", self._score_to_category(score)))
        # normalise any freeform category the LLM might return
        category = self._normalise_category(category)

        return {
            "score": score,
            "category": category,
            "justification": str(parsed["justification"]),
            "evidence": str(parsed.get("evidence", "")),
        }

    # ──────────────────────────────────────────────────────────────────────
    # Category helpers
    # ──────────────────────────────────────────────────────────────────────

    @staticmethod
    def _score_to_category(score: float) -> str:
        """Derive a machine-readable category slug from a numeric score."""
        if score <= 0.30:
            return "not_evident"
        if score <= 0.60:
            return "partially"
        if score <= 0.90:
            return "clearly_evident"
        return "central_focus"

    _VALID_CATEGORIES = {"not_evident", "partially", "clearly_evident", "central_focus"}

    @classmethod
    def _normalise_category(cls, raw: str) -> str:
        """Map any freeform LLM string to one of the four valid slugs."""
        slug = raw.strip().lower().replace(" ", "_").replace("-", "_")
        if slug in cls._VALID_CATEGORIES:
            return slug
        # fuzzy fallbacks
        if "central" in slug or "focus" in slug:
            return "central_focus"
        if "clearly" in slug or "evident" in slug:
            return "clearly_evident"
        if "partial" in slug:
            return "partially"
        return "not_evident"

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
