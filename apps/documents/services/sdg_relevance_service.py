"""
SDG Relevance Calculation Service

Main orchestration service for calculating SDG relevance scores using LLMs.
Coordinates text extraction, LLM calls, and database updates.

IMPORTANT: This service ONLY processes SDGs that are already linked to each 
document in the DocumentSDG table. It does NOT analyze all 17 SDGs.
"""

from typing import Dict, Any, Optional, List
from django.db.models import Q
from django.utils import timezone

from apps.documents.models import Document, DocumentSDG, SDG
from .text_extraction import extract_all_document_text
from .llm_service import get_llm_service
from .logger import get_logger, log_failure
from .utils import validate_llm_config
from .exceptions import SDGRelevanceError, SDGProcessingError, LLMServiceError, LLMConnectionError, LLMTimeoutError
from .fallback_service import SDGRelevanceFallback
from .fallback_tracker import FallbackTracker

logger = get_logger(__name__)


def calculate_sdg_relevance(
    document: Document,
    sdg: SDG,
    doc_sdg_instance: DocumentSDG
) -> tuple[bool, Optional[str]]:
    """
    Calculate relevance score for a single DocumentSDG relationship.
    
    This function:
    1. Extracts text from the document's source files
    2. Calls LLM to analyze relevance to the specific SDG
    3. Updates DocumentSDG with score and justification
    
    Args:
        document: Document instance
        sdg: SDG instance  
        doc_sdg_instance: Existing DocumentSDG relationship to update
        
    Returns:
        tuple: (success: bool, error_message: str or None)
    """
    logger.info(
        f"Analyzing relevance: Document {document.id} ({document.title[:50]}...) "
        f"-> SDG {sdg.number} ({sdg.label})"
    )
    
    try:
        # Step 1: Extract document text
        success, document_text, errors = extract_all_document_text(document)
        
        if not success or not document_text.strip():
            error_msg = (
                f"No text could be extracted from document {document.id}. "
                f"Errors: {'; '.join(errors)}"
            )
            logger.error(error_msg)
            log_failure(document.id, sdg.id, error_msg)
            return False, error_msg
        
        # Step 2: Get LLM service and generate prompt
        llm_service = get_llm_service()
        
        prompt = llm_service.generate_sdg_relevance_prompt(
            document_title=document.title,
            document_text=document_text,
            sdg_number=sdg.number,
            sdg_label=sdg.label,
            max_text_length=4000
        )
        
        # Step 3: Call LLM
        logger.debug(f"Calling LLM for Document {document.id} / SDG {sdg.id}")
        result = llm_service.call_llm(prompt)
        
        score = result['score']
        justification = result['justification']
        
        logger.info(
            f"LLM analysis complete: Document {document.id} / SDG {sdg.number} "
            f"-> Score: {score:.3f}"
        )
        
        # Step 4: Update DocumentSDG instance
        doc_sdg_instance.relevance_score = score
        doc_sdg_instance.justification = justification
        doc_sdg_instance.save(update_fields=['relevance_score', 'justification', 'updated_at'])
        
        logger.info(
            f"✓ Successfully updated DocumentSDG {doc_sdg_instance.id}: "
            f"score={score:.3f}"
        )
        
        return True, None
    
    except LLMConnectionError as e:
        logger.warning(f"Document {document.id} / SDG {sdg.id}: Network connectivity issue, using fallback")
        FallbackTracker.increment_fallback('connection', document.id, sdg.id)
        
        # Use fallback strategy for connection errors
        try:
            fallback_result = SDGRelevanceFallback.calculate_fallback_score(
                document.title,
                document_text,
                sdg.number,
                sdg.label,
                fallback_strategy="keyword_match"
            )
            
            # Update with fallback result
            doc_sdg_instance.relevance_score = fallback_result['score']
            doc_sdg_instance.justification = fallback_result['justification']
            doc_sdg_instance.save(update_fields=['relevance_score', 'justification', 'updated_at'])
            
            logger.info(f"✓ Fallback calculation successful for DocumentSDG {doc_sdg_instance.id}")
            return True, None
            
        except Exception as fallback_error:
            error_msg = f"Both LLM and fallback failed: {str(fallback_error)}"
            logger.error(f"Document {document.id} / SDG {sdg.id}: {error_msg}")
            log_failure(document.id, sdg.id, error_msg)
            return False, error_msg
    
    except LLMTimeoutError as e:
        logger.warning(f"Document {document.id} / SDG {sdg.id}: Request timeout, using fallback")
        FallbackTracker.increment_fallback('timeout', document.id, sdg.id)
        
        # Use fallback strategy for timeout errors
        try:
            fallback_result = SDGRelevanceFallback.calculate_fallback_score(
                document.title,
                document_text,
                sdg.number,
                sdg.label,
                fallback_strategy="conservative"
            )
            
            # Update with fallback result
            doc_sdg_instance.relevance_score = fallback_result['score']
            doc_sdg_instance.justification = fallback_result['justification']
            doc_sdg_instance.save(update_fields=['relevance_score', 'justification', 'updated_at'])
            
            logger.info(f"✓ Fallback calculation successful for DocumentSDG {doc_sdg_instance.id}")
            return True, None
            
        except Exception as fallback_error:
            error_msg = f"Both LLM and fallback failed: {str(fallback_error)}"
            logger.error(f"Document {document.id} / SDG {sdg.id}: {error_msg}")
            log_failure(document.id, sdg.id, error_msg)
            return False, error_msg
    
    except LLMServiceError as e:
        error_msg = f"LLM service error: {str(e)}"
        logger.error(f"Document {document.id} / SDG {sdg.id}: {error_msg}")
        log_failure(document.id, sdg.id, error_msg)
        return False, error_msg
    
    except Exception as e:
        error_msg = f"Unexpected error calculating SDG relevance: {str(e)}"
        logger.error(f"Document {document.id} / SDG {sdg.id}: {error_msg}", exc_info=True)
        log_failure(document.id, sdg.id, error_msg)
        return False, error_msg


def process_document_sdgs(
    document: Document,
    force: bool = False
) -> Dict[str, Any]:
    """
    Process all EXISTING SDG relationships for a single document.
    
    IMPORTANT: This only processes SDGs already linked to the document
    in the DocumentSDG table. It does NOT analyze all 17 SDGs.
    
    Args:
        document: Document instance to process
        force: If True, recalculate even if score already exists
        
    Returns:
        dict: Statistics {
            'processed': int,  # Total SDG links found
            'success': int,    # Successfully analyzed
            'failed': int,     # Failed to analyze
            'skipped': int     # Already had scores (when force=False)
        }
    """
    logger.info(
        f"Starting SDG relevance processing for Document {document.id}: "
        f"{document.title}"
    )
    
    stats = {
        'processed': 0,
        'success': 0,
        'failed': 0,
        'skipped': 0
    }
    
    # Get ONLY existing DocumentSDG relationships for this document
    document_sdgs = DocumentSDG.objects.filter(document=document).select_related('sdg')
    
    if not document_sdgs.exists():
        logger.warning(
            f"Document {document.id} has no SDGs linked. "
            "Link SDGs first before calculating relevance."
        )
        return stats
    
    # If not forcing, filter to only those needing calculation
    if not force:
        document_sdgs = document_sdgs.filter(
            Q(relevance_score__isnull=True) | 
            Q(justification__isnull=True) | 
            Q(justification='')
        )
    
    total_to_process = document_sdgs.count()
    logger.info(f"Found {total_to_process} SDG link(s) to process for Document {document.id}")
    
    if total_to_process == 0:
        logger.info(f"All SDGs for Document {document.id} already have scores. Use --force to recalculate.")
        return stats
    
    # Process each DocumentSDG relationship
    for idx, doc_sdg in enumerate(document_sdgs, 1):
        stats['processed'] += 1
        
        logger.info(
            f"Processing {idx}/{total_to_process}: "
            f"SDG {doc_sdg.sdg.number} - {doc_sdg.sdg.label}"
        )
        
        success, error = calculate_sdg_relevance(
            document=document,
            sdg=doc_sdg.sdg,
            doc_sdg_instance=doc_sdg
        )
        
        if success:
            stats['success'] += 1
        else:
            stats['failed'] += 1
    
    # Update document AI check status if all successful
    if stats['success'] > 0 and stats['failed'] == 0:
        document.ai_check_status = True
        document.ai_check_date = timezone.now()
        document.save(update_fields=['ai_check_status', 'ai_check_date'])
        logger.info(f"Document {document.id} marked as AI-checked")
    
    logger.info(
        f"Completed processing Document {document.id}: "
        f"{stats['success']} successful, {stats['failed']} failed"
    )
    
    # Add fallback statistics to stats
    fallback_stats = FallbackTracker.get_fallback_stats()
    stats['fallback_used'] = fallback_stats['total_fallbacks']
    
    return stats


def process_batch_documents(
    queryset,
    force: bool = False
) -> Dict[str, Any]:
    """
    Process multiple documents in a batch.
    
    Args:
        queryset: QuerySet of Document instances
        force: If True, recalculate even if scores exist
        
    Returns:
        dict: Aggregate statistics {
            'documents_processed': int,
            'sdgs_processed': int,
            'success': int,
            'failed': int,
            'skipped': int,
            'total_time': float
        }
    """
    import time
    start_time = time.time()
    
    logger.info(f"Starting batch processing of {queryset.count()} document(s)")
    
    aggregate_stats = {
        'documents_processed': 0,
        'sdgs_processed': 0,
        'success': 0,
        'failed': 0,
        'skipped': 0
    }
    
    for idx, document in enumerate(queryset, 1):
        logger.info(f"\n{'='*80}")
        logger.info(f"Processing document {idx}/{queryset.count()}: {document.title}")
        logger.info(f"{'='*80}")
        
        doc_stats = process_document_sdgs(document, force=force)
        
        # Aggregate statistics
        aggregate_stats['documents_processed'] += 1
        aggregate_stats['sdgs_processed'] += doc_stats['processed']
        aggregate_stats['success'] += doc_stats['success']
        aggregate_stats['failed'] += doc_stats['failed']
        aggregate_stats['skipped'] += doc_stats['skipped']
    
    end_time = time.time()
    aggregate_stats['total_time'] = end_time - start_time
    
    logger.info(f"\n{'='*80}")
    logger.info("Batch processing complete!")
    logger.info(f"Documents processed: {aggregate_stats['documents_processed']}")
    logger.info(f"SDG links processed: {aggregate_stats['sdgs_processed']}")
    logger.info(f"Successful: {aggregate_stats['success']}")
    logger.info(f"Failed: {aggregate_stats['failed']}")
    logger.info(f"Total time: {aggregate_stats['total_time']:.2f}s")
    
    # Add fallback statistics
    fallback_stats = FallbackTracker.get_fallback_stats()
    aggregate_stats['fallback_used'] = fallback_stats['total_fallbacks']
    
    if fallback_stats['total_fallbacks'] > 0:
        logger.warning(f"Fallbacks used: {fallback_stats['total_fallbacks']} "
                      f"({fallback_stats['connection_errors']} connection, "
                      f"{fallback_stats['timeout_errors']} timeout)")
    
    logger.info(f"{'='*80}\n")
    
    return aggregate_stats


def validate_configuration() -> tuple[bool, Optional[str]]:
    """
    Validate that LLM configuration is ready for processing.
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    return validate_llm_config()


def get_documents_needing_processing(limit: Optional[int] = None):
    """
    Get documents that have SDG links but missing relevance scores.
    
    Args:
        limit: Maximum number of documents to return (None = all)
        
    Returns:
        QuerySet of Document instances
    """
    from django.db.models import Count, Q
    
    # Find documents with DocumentSDG relationships that need processing
    documents_with_incomplete_sdgs = Document.objects.filter(
        documentsdg__isnull=False
    ).filter(
        Q(documentsdg__relevance_score__isnull=True) |
        Q(documentsdg__justification__isnull=True) |
        Q(documentsdg__justification='')
    ).distinct().order_by('-created_at')
    
    if limit:
        documents_with_incomplete_sdgs = documents_with_incomplete_sdgs[:limit]
    
    return documents_with_incomplete_sdgs

