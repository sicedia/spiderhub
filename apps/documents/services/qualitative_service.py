"""
Qualitative Indicator Analysis Service

Orchestrates LLM-based scoring for all nine qualitative indicators across
documents.  Mirrors the structure of sdg_relevance_service.py.

Key difference from SDG service:
  - DocumentQualitativeIndicator rows are created here on-the-fly (all
    documents are assessed against every active indicator).  The SDG service
    only enriches pre-existing DocumentSDG rows seeded during import.
"""

import time
from typing import Dict, Any, Optional

from django.db.models import Q
from django.utils import timezone

from apps.documents.models import Document, DocumentQualitativeIndicator, QualitativeIndicator
from .document_analysis_service import get_document_analysis_service
from .logger import get_logger, log_failure
from .utils import validate_llm_config
from .exceptions import LLMServiceError, LLMConnectionError, LLMTimeoutError
from .fallback_tracker import FallbackTracker

logger = get_logger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Public helpers
# ─────────────────────────────────────────────────────────────────────────────

def validate_configuration():
    """Delegate to the shared LLM config validator."""
    return validate_llm_config()


def get_documents_needing_processing(limit: Optional[int] = None):
    """
    Return documents that still have at least one indicator with a missing score.

    A document is considered "needing processing" when it has a
    DocumentQualitativeIndicator row whose score is NULL, OR when it
    has fewer indicator rows than active indicators (i.e. some rows haven't
    been created yet).
    """
    active_indicator_count = QualitativeIndicator.objects.filter(is_active=True).count()

    if active_indicator_count == 0:
        logger.warning("No active qualitative indicators — seed the catalog first.")
        return Document.objects.none()

    # Documents with incomplete rows (null scores or missing rows)
    qs = (
        Document.objects.filter(
            Q(qualitative_indicators__score__isnull=True)
            | Q(qualitative_indicators__isnull=True)
        )
        .distinct()
        .order_by("-created_at")
    )

    if limit:
        qs = qs[:limit]

    return qs


# ─────────────────────────────────────────────────────────────────────────────
# Single-document processing
# ─────────────────────────────────────────────────────────────────────────────

def process_document_qualitative(
    document: Document,
    force: bool = False,
) -> Dict[str, Any]:
    """
    Score all active qualitative indicators for a single document.

    Args:
        document: Document instance to process
        force:    If True, re-score even where a score already exists

    Returns:
        stats dict: processed / success / failed / skipped
    """
    logger.info(
        f"Starting qualitative processing for Document {document.id}: {document.title}"
    )

    stats = {"processed": 0, "success": 0, "failed": 0, "skipped": 0}

    active_indicators = QualitativeIndicator.objects.filter(is_active=True)
    if not active_indicators.exists():
        logger.warning("No active indicators — run seed_qualitative_indicators first.")
        return stats

    # Determine which indicators need scoring
    if force:
        indicators_to_process = list(active_indicators)
    else:
        # Skip those that already have a score
        scored_ids = DocumentQualitativeIndicator.objects.filter(
            document=document,
            score__isnull=False,
        ).values_list("indicator_id", flat=True)

        indicators_to_process = list(active_indicators.exclude(id__in=scored_ids))

    if not indicators_to_process:
        logger.info(
            f"All indicators for Document {document.id} already scored. "
            "Use --force to recalculate."
        )
        return stats

    total = len(indicators_to_process)
    logger.info(
        f"Extracting content for Document {document.id} "
        f"(cached for all {total} indicators)"
    )

    # Extract content ONCE, reuse for every indicator
    cached_content = None
    try:
        analysis_service = get_document_analysis_service()
        processor = analysis_service.processor_factory.get_processor(document)
        cached_content = processor.extract_content(document)

        if not cached_content.get("success", False):
            logger.error(
                f"Content extraction failed for Document {document.id}: "
                f"{cached_content.get('errors', [])}"
            )
            return stats

        logger.info(
            f"Content extraction OK for Document {document.id}: "
            f"{cached_content['type']} processing"
        )

    except Exception as exc:
        logger.error(f"Failed to extract content for Document {document.id}: {exc}")
        return stats

    # Get the qualitative analyzer from the factory
    qualitative_analyzer = analysis_service.analyzer_factory.get_analyzer("qualitative")

    for idx, indicator in enumerate(indicators_to_process, 1):
        stats["processed"] += 1
        logger.info(f"  [{idx}/{total}] {indicator.code}")

        doc_qi, _ = DocumentQualitativeIndicator.objects.get_or_create(
            document=document,
            indicator=indicator,
        )

        success, error = _score_single_indicator(
            document, indicator, doc_qi, cached_content, qualitative_analyzer
        )

        if success:
            stats["success"] += 1
        else:
            stats["failed"] += 1
            log_failure(document.id, indicator.id, error or "unknown error")

    # Mark document as AI-checked only when everything succeeded
    if stats["success"] > 0 and stats["failed"] == 0:
        document.ai_check_status = True
        document.ai_check_date = timezone.now()
        document.save(update_fields=["ai_check_status", "ai_check_date"])
        logger.info(f"Document {document.id} marked as AI-checked (qualitative)")

    logger.info(
        f"Completed Document {document.id}: "
        f"{stats['success']} ok, {stats['failed']} failed"
    )
    stats["fallback_used"] = FallbackTracker.get_fallback_stats()["total_fallbacks"]
    return stats


def _score_single_indicator(document, indicator, doc_qi, content_data, analyzer):
    """
    Call the LLM for one document/indicator pair and persist the result.

    Returns:
        (success: bool, error_message: str | None)
    """
    try:
        result = analyzer.analyze_single_indicator(document, indicator, doc_qi, content_data)

        if result["success"]:
            return True, None
        else:
            return False, result.get("error")

    except LLMConnectionError:
        FallbackTracker.increment_fallback("connection", document.id, indicator.id)
        logger.warning(
            f"Connection error for Document {document.id} / {indicator.code}; "
            "saving NULL score to retry later."
        )
        return False, "LLM connection error — score not saved"

    except LLMTimeoutError:
        FallbackTracker.increment_fallback("timeout", document.id, indicator.id)
        logger.warning(
            f"Timeout for Document {document.id} / {indicator.code}; "
            "saving NULL score to retry later."
        )
        return False, "LLM timeout — score not saved"

    except LLMServiceError as exc:
        return False, f"LLM service error: {exc}"

    except Exception as exc:
        logger.error(
            f"Unexpected error for Document {document.id} / {indicator.code}: {exc}",
            exc_info=True,
        )
        return False, str(exc)


# ─────────────────────────────────────────────────────────────────────────────
# Batch processing
# ─────────────────────────────────────────────────────────────────────────────

def process_batch_documents_qualitative(
    queryset,
    force: bool = False,
) -> Dict[str, Any]:
    """
    Process multiple documents in a batch.

    Returns aggregate stats dict.
    """
    start_time = time.time()
    total_docs = queryset.count()
    logger.info(f"Starting qualitative batch processing of {total_docs} document(s)")

    aggregate = {
        "documents_processed": 0,
        "indicators_processed": 0,
        "success": 0,
        "failed": 0,
        "skipped": 0,
    }

    for idx, document in enumerate(queryset, 1):
        logger.info(f"\n{'='*70}")
        logger.info(f"Document {idx}/{total_docs}: {document.title}")
        logger.info(f"{'='*70}")

        doc_stats = process_document_qualitative(document, force=force)

        aggregate["documents_processed"] += 1
        aggregate["indicators_processed"] += doc_stats["processed"]
        aggregate["success"] += doc_stats["success"]
        aggregate["failed"] += doc_stats["failed"]
        aggregate["skipped"] += doc_stats["skipped"]

    aggregate["total_time"] = time.time() - start_time
    aggregate["fallback_used"] = FallbackTracker.get_fallback_stats()["total_fallbacks"]

    logger.info(f"\n{'='*70}")
    logger.info("Qualitative batch processing complete.")
    logger.info(f"  Documents:  {aggregate['documents_processed']}")
    logger.info(f"  Indicators: {aggregate['indicators_processed']}")
    logger.info(f"  Success:    {aggregate['success']}")
    logger.info(f"  Failed:     {aggregate['failed']}")
    logger.info(f"  Time:       {aggregate['total_time']:.1f}s")
    logger.info(f"{'='*70}\n")

    return aggregate
