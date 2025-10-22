"""
Django management command for SDG relevance ingestion.

Usage:
    python manage.py ingest_sdg_relevance --all
    python manage.py ingest_sdg_relevance --batch 10
    python manage.py ingest_sdg_relevance --doc 42
    python manage.py ingest_sdg_relevance --doc 42 --force
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.documents.models import Document
from apps.documents.services.sdg_relevance_service import (
    process_document_sdgs,
    process_batch_documents,
    validate_configuration,
    get_documents_needing_processing
)
from apps.documents.services.utils import format_processing_stats
from apps.documents.services.logger import get_logger

logger = get_logger(__name__)


class Command(BaseCommand):
    """
    Management command to calculate SDG relevance scores using LLMs.
    
    This command processes EXISTING DocumentSDG relationships and calculates
    relevance_score and justification for each link.
    """
    
    help = 'Calculate SDG relevance scores for documents using LLM analysis'
    
    def add_arguments(self, parser):
        """Define command-line arguments."""
        
        # Mutually exclusive group for selection mode
        mode_group = parser.add_mutually_exclusive_group(required=True)
        
        mode_group.add_argument(
            '--all',
            action='store_true',
            help='Process all documents that need SDG relevance scores'
        )
        
        mode_group.add_argument(
            '--batch',
            type=int,
            metavar='N',
            help='Process N most recent documents that need processing'
        )
        
        mode_group.add_argument(
            '--doc',
            type=int,
            metavar='ID',
            help='Process a specific document by ID'
        )
        
        # Optional flags
        parser.add_argument(
            '--force',
            action='store_true',
            help='Recalculate scores even if they already exist'
        )
    
    def handle(self, *args, **options):
        """Execute the command."""
        
        # Validate LLM configuration
        self.stdout.write("\n" + "="*80)
        self.stdout.write("SDG Relevance Ingestion")
        self.stdout.write("="*80 + "\n")
        
        self.stdout.write("Validating LLM configuration...")
        is_valid, error_msg = validate_configuration()
        
        if not is_valid:
            raise CommandError(
                f"LLM configuration error: {error_msg}\n\n"
                "Please ensure you have configured your .env file with:\n"
                "  - LLM_PROVIDER (openai, anthropic, or ollama)\n"
                "  - Corresponding API key or URL\n"
                "  - LLM_MODEL\n\n"
                "See .env.example for details."
            )
        
        self.stdout.write(self.style.SUCCESS("[OK] LLM configuration valid\n"))
        
        # Determine which documents to process
        force = options['force']
        
        if options['all']:
            self.stdout.write("Mode: Process all documents needing SDG scores\n")
            documents = get_documents_needing_processing()
            
            if not documents.exists():
                self.stdout.write(self.style.WARNING(
                    "No documents found that need SDG relevance processing.\n"
                    "All DocumentSDG relationships already have scores.\n"
                    "Use --force to recalculate existing scores."
                ))
                return
            
            self.stdout.write(f"Found {documents.count()} document(s) to process\n")
        
        elif options['batch']:
            batch_size = options['batch']
            self.stdout.write(f"Mode: Process {batch_size} most recent documents\n")
            
            documents = get_documents_needing_processing(limit=batch_size)
            
            if not documents.exists():
                self.stdout.write(self.style.WARNING(
                    "No documents found that need SDG relevance processing.\n"
                    "Use --force to recalculate existing scores."
                ))
                return
            
            self.stdout.write(f"Found {documents.count()} document(s) to process\n")
        
        elif options['doc']:
            doc_id = options['doc']
            self.stdout.write(f"Mode: Process specific document ID {doc_id}\n")
            
            try:
                document = Document.objects.get(id=doc_id)
            except Document.DoesNotExist:
                raise CommandError(f"Document with ID {doc_id} does not exist")
            
            # Check if document has any SDG links
            sdg_count = document.sdgs.count()
            if sdg_count == 0:
                raise CommandError(
                    f"Document {doc_id} has no SDG links.\n"
                    "Please link SDGs to the document first before calculating relevance."
                )
            
            self.stdout.write(f"Document: {document.title}\n")
            self.stdout.write(f"Linked SDGs: {sdg_count}\n")
            
            documents = Document.objects.filter(id=doc_id)
        
        else:
            raise CommandError("No processing mode specified. Use --all, --batch N, or --doc ID")
        
        # Confirm before processing
        if options['force']:
            self.stdout.write(self.style.WARNING(
                "\n⚠️  FORCE mode enabled: Will recalculate existing scores\n"
            ))
        
        self.stdout.write("\nStarting processing...\n")
        self.stdout.write("="*80 + "\n")
        
        # Process documents
        try:
            if len(documents) == 1:
                # Single document
                document = documents.first()
                stats = process_document_sdgs(document, force=force)
                
                # Display results
                self.display_results(stats, single_document=True)
            
            else:
                # Batch processing
                stats = process_batch_documents(documents, force=force)
                
                # Display results
                self.display_results(stats, single_document=False)
        
        except KeyboardInterrupt:
            self.stdout.write("\n\n")
            self.stdout.write(self.style.WARNING(
                "⚠️  Processing interrupted by user (Ctrl+C)"
            ))
            self.stdout.write("\nPartial results may have been saved to the database.\n")
            return
        
        except Exception as e:
            logger.error(f"Command execution failed: {str(e)}", exc_info=True)
            
            # Provide user-friendly error messages
            error_str = str(e).lower()
            if 'connection' in error_str or 'timeout' in error_str or 'network' in error_str:
                raise CommandError(
                    f"Network connectivity issue: {str(e)}\n\n"
                    "This appears to be a network connectivity problem. Please check:\n"
                    "  - Internet connection\n"
                    "  - Firewall settings\n"
                    "  - Proxy configuration (if applicable)\n"
                    "  - LLM service availability\n\n"
                    "The system will use fallback calculations when possible."
                )
            elif 'authentication' in error_str or 'api key' in error_str:
                raise CommandError(
                    f"Authentication error: {str(e)}\n\n"
                    "Please verify your API credentials in the .env file:\n"
                    "  - OPENAI_API_KEY\n"
                    "  - ANTHROPIC_API_KEY (if using Anthropic)\n"
                    "  - Other provider-specific credentials"
                )
            else:
                raise CommandError(f"Processing failed: {str(e)}")
        
        self.stdout.write("\n" + "="*80)
        self.stdout.write("Processing complete!")
        self.stdout.write("="*80 + "\n")
    
    def display_results(self, stats, single_document=False):
        """Display processing results in a formatted way."""
        
        self.stdout.write("\n" + "="*80)
        self.stdout.write("Processing Summary")
        self.stdout.write("="*80 + "\n")
        
        if not single_document and 'documents_processed' in stats:
            self.stdout.write(f"Documents Processed:   {stats['documents_processed']}")
        
        if 'sdgs_processed' in stats:
            self.stdout.write(f"SDG Links Processed:   {stats.get('sdgs_processed', stats.get('processed', 0))}")
        elif 'processed' in stats:
            self.stdout.write(f"SDG Links Processed:   {stats['processed']}")
        
        success_count = stats.get('success', 0)
        if success_count > 0:
            self.stdout.write(self.style.SUCCESS(
                f"[OK] Successful:       {success_count}"
            ))
        
        failed_count = stats.get('failed', 0)
        if failed_count > 0:
            self.stdout.write(self.style.ERROR(
                f"[FAIL] Failed:         {failed_count}"
            ))
            self.stdout.write(self.style.WARNING(
                "\nCheck logs/failed_sdg_scores.log for details on failures"
            ))
        
        skipped_count = stats.get('skipped', 0)
        if skipped_count > 0:
            self.stdout.write(self.style.WARNING(
                f"[SKIP] Skipped:        {skipped_count}"
            ))
        
        if 'total_time' in stats:
            self.stdout.write(f"\nTotal Time:            {stats['total_time']:.2f}s")
            
            if success_count > 0:
                avg_time = stats['total_time'] / success_count
                self.stdout.write(f"Average per SDG:       {avg_time:.2f}s")
        
        self.stdout.write("\n" + "="*80 + "\n")
        
        # Additional notes
        if failed_count > 0:
            self.stdout.write(self.style.WARNING(
                "[!] Some SDG analyses failed. Review the logs for details:\n"
                "    - logs/sdg_ingestion.log (general processing log)\n"
                "    - logs/failed_sdg_scores.log (failed document/SDG pairs)\n"
            ))
        
        # Check for fallback usage
        fallback_count = stats.get('fallback_used', 0)
        if fallback_count > 0:
            self.stdout.write(self.style.WARNING(
                f"[i] {fallback_count} SDG analyses used fallback calculations due to connectivity issues.\n"
                "    These scores should be reviewed manually when the LLM service is restored.\n"
            ))
        
        if success_count == 0 and failed_count == 0:
            self.stdout.write(self.style.WARNING(
                "[i] No SDG links were processed.\n"
                "    This could mean:\n"
                "    - Documents have no SDG links (link SDGs first)\n"
                "    - All SDG links already have scores (use --force to recalculate)\n"
            ))

