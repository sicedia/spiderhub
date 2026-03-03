"""
Management command to compute qualitative indicator scores via LLM.

Usage:
    python manage.py ingest_qualitative_indicators --all
    python manage.py ingest_qualitative_indicators --batch 10
    python manage.py ingest_qualitative_indicators --doc 42
    python manage.py ingest_qualitative_indicators --doc 42 --force

The command:
  1. Validates LLM configuration.
  2. Selects documents to process (all / batch / single).
  3. For each document, creates DocumentQualitativeIndicator rows for any
     missing indicators and calls the LLM to fill in score / justification /
     evidence.
  4. Displays a formatted summary.
"""

from django.core.management.base import BaseCommand, CommandError

from apps.documents.models import Document, QualitativeIndicator
from apps.documents.services.qualitative_service import (
    validate_configuration,
    get_documents_needing_processing,
    process_document_qualitative,
    process_batch_documents_qualitative,
)
from apps.documents.services.logger import get_logger

logger = get_logger(__name__)


class Command(BaseCommand):
    help = "Score qualitative indicators for documents using LLM analysis."

    def add_arguments(self, parser):
        mode = parser.add_mutually_exclusive_group(required=True)

        mode.add_argument(
            "--all",
            action="store_true",
            help="Process all documents that have incomplete qualitative scores.",
        )
        mode.add_argument(
            "--batch",
            type=int,
            metavar="N",
            help="Process the N most recent documents needing qualitative scores.",
        )
        mode.add_argument(
            "--doc",
            type=int,
            metavar="ID",
            help="Process a specific document by ID.",
        )

        parser.add_argument(
            "--force",
            action="store_true",
            help="Recalculate scores even if they already exist.",
        )

    # ──────────────────────────────────────────────────────────────────────
    # Entry point
    # ──────────────────────────────────────────────────────────────────────

    def handle(self, *args, **options):
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write("Qualitative Indicator Ingestion")
        self.stdout.write("=" * 70 + "\n")

        # Verify indicator catalog
        active_count = QualitativeIndicator.objects.filter(is_active=True).count()
        if active_count == 0:
            raise CommandError(
                "No active qualitative indicators found.\n"
                "Run: python manage.py seed_qualitative_indicators"
            )
        self.stdout.write(f"Active indicators in catalog: {active_count}\n")

        # Verify LLM config
        self.stdout.write("Validating LLM configuration...")
        is_valid, error_msg = validate_configuration()
        if not is_valid:
            raise CommandError(
                f"LLM configuration error: {error_msg}\n\n"
                "Ensure your .env file contains:\n"
                "  LLM_PROVIDER  (openai | anthropic | ollama)\n"
                "  Corresponding API key or URL\n"
                "  LLM_MODEL\n"
            )
        self.stdout.write(self.style.SUCCESS("[OK] LLM configuration valid\n"))

        force = options["force"]

        # ── Select documents ───────────────────────────────────────────────
        if options["all"]:
            self.stdout.write("Mode: all documents with incomplete qualitative scores\n")
            documents = get_documents_needing_processing()
            if not documents.exists():
                self.stdout.write(
                    self.style.WARNING(
                        "No documents need qualitative scoring.\n"
                        "Use --force to recalculate existing scores."
                    )
                )
                return
            self.stdout.write(f"Found {documents.count()} document(s) to process\n")

        elif options["batch"]:
            n = options["batch"]
            self.stdout.write(f"Mode: batch of {n} most recent documents\n")
            documents = get_documents_needing_processing(limit=n)
            if not documents.exists():
                self.stdout.write(
                    self.style.WARNING(
                        "No documents need qualitative scoring.\n"
                        "Use --force to recalculate existing scores."
                    )
                )
                return
            self.stdout.write(f"Found {documents.count()} document(s) to process\n")

        elif options["doc"]:
            doc_id = options["doc"]
            self.stdout.write(f"Mode: single document ID {doc_id}\n")
            try:
                document = Document.objects.get(id=doc_id)
            except Document.DoesNotExist:
                raise CommandError(f"Document with ID {doc_id} does not exist.")

            self.stdout.write(f"Document: {document.title}\n")
            documents = Document.objects.filter(id=doc_id)

        else:
            raise CommandError("Specify --all, --batch N, or --doc ID.")

        if force:
            self.stdout.write(
                self.style.WARNING("\n[WARNING] FORCE mode: existing scores will be overwritten\n")
            )

        self.stdout.write("\nStarting processing...\n" + "=" * 70 + "\n")

        # ── Process ────────────────────────────────────────────────────────
        try:
            if documents.count() == 1:
                stats = process_document_qualitative(documents.first(), force=force)
                self._display_results(stats, single_document=True)
            else:
                stats = process_batch_documents_qualitative(documents, force=force)
                self._display_results(stats, single_document=False)

        except KeyboardInterrupt:
            self.stdout.write(
                "\n\n" + self.style.WARNING("Processing interrupted (Ctrl+C).\n")
                + "Partial results have been saved.\n"
            )
            return

        except Exception as exc:
            logger.error(f"Command execution failed: {exc}", exc_info=True)
            err = str(exc).lower()
            if any(kw in err for kw in ("connection", "timeout", "network")):
                raise CommandError(
                    f"Network error: {exc}\n\n"
                    "Check internet connectivity and LLM service availability."
                )
            elif any(kw in err for kw in ("authentication", "api key")):
                raise CommandError(
                    f"Authentication error: {exc}\n\nVerify API credentials in .env."
                )
            else:
                raise CommandError(f"Processing failed: {exc}")

        self.stdout.write("\n" + "=" * 70)
        self.stdout.write("Processing complete!")
        self.stdout.write("=" * 70 + "\n")

    # ──────────────────────────────────────────────────────────────────────
    # Display helpers
    # ──────────────────────────────────────────────────────────────────────

    def _display_results(self, stats: dict, single_document: bool = False):
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write("Processing Summary")
        self.stdout.write("=" * 70 + "\n")

        if not single_document and "documents_processed" in stats:
            self.stdout.write(f"Documents Processed:      {stats['documents_processed']}")

        indicators_key = "indicators_processed" if "indicators_processed" in stats else "processed"
        self.stdout.write(f"Indicator Links Scored:   {stats.get(indicators_key, 0)}")

        success_count = stats.get("success", 0)
        if success_count:
            self.stdout.write(self.style.SUCCESS(f"[OK]   Successful:          {success_count}"))

        failed_count = stats.get("failed", 0)
        if failed_count:
            self.stdout.write(self.style.ERROR(f"[FAIL] Failed:              {failed_count}"))
            self.stdout.write(
                self.style.WARNING("       Check logs/sdg_ingestion.log for details.")
            )

        skipped_count = stats.get("skipped", 0)
        if skipped_count:
            self.stdout.write(self.style.WARNING(f"[SKIP] Skipped:             {skipped_count}"))

        if "total_time" in stats:
            self.stdout.write(f"\nTotal Time:               {stats['total_time']:.1f}s")
            if success_count:
                self.stdout.write(
                    f"Avg per indicator:        {stats['total_time'] / success_count:.1f}s"
                )

        fallback = stats.get("fallback_used", 0)
        if fallback:
            self.stdout.write(
                self.style.WARNING(
                    f"\n[i] {fallback} indicator(s) used fallback scores due to connectivity issues.\n"
                    "    Review these manually when the LLM service is restored."
                )
            )

        if success_count == 0 and failed_count == 0:
            self.stdout.write(
                self.style.WARNING(
                    "\n[i] No indicators were scored.\n"
                    "    Possible reasons:\n"
                    "    - All indicators already have scores (use --force to recalculate)\n"
                    "    - No active indicators (run seed_qualitative_indicators)\n"
                )
            )

        self.stdout.write("\n" + "=" * 70 + "\n")
