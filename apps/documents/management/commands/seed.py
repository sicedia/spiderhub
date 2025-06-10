"""Management command ``seed``: bulk‑import all JSON documents found in
<project_root>/data into the Django DB using the models defined in
``models.py``.

Run with:
    python manage.py seed                # normal import
    python manage.py seed --dry-run      # parse & validate only, no DB writes
    python manage.py seed --limit 20     # import first 20 files

Assumptions
~~~~~~~~~~
* The app containing the models is called ``documents`` (adjust the import if
  your app has a different name).
* The JSON structure matches the examples shared in the conversation.  Missing,
  null, or empty fields are handled gracefully.
* Taxonomies (Theme, Actor, BeneficiaryGroup, SDG) are pre‑seeded *or* created
  on‑the‑fly.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Union, Optional, Tuple, Any

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.apps import apps

from apps.documents.models import (
    Actor,
    BeneficiaryGroup,
    BeneficiaryGroupRaw,
    Commitment,
    CommitmentDetail,
    Document,
    DocumentActor,
    DocumentBeneficiaryGroupRaw,
    DocumentTheme,
    KPI,
    PracticalApplication,
    SDG,
    Theme,
)

# Constants
DATE_INPUT_FORMATS = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"]
TITLE_FIELDS = ["title", "Name of the Event", "name", "document_title", "event_name", "Title", "NAME"]
SUMMARY_FIELDS = ["executive_summary", "Summary", "summary", "description"]
FALLBACK_CONTENT_FIELDS = ["description", "summary", "executive_summary"]

TYPE_MAPPING = {
    "Agreement EU-LAC": "agreement_eu-lac",
    "Agreements EU-LAC": "agreements_eu-lac", 
    "Dialogues EU-LAC": "dialogues_eu-lac",
    "Dialogues Bilateral": "dialogues_bilateral",
    "Dialogues Multilateral": "dialogues_multilateral",
    "Agreements Bilateral": "agreements_bilateral",
    "Agreements Multilateral": "agreements_multilateral",
    "Agreements Country Specific": "agreements_country_specific",
}

EXCLUDED_FIELDS = {
    "title", "date", "location", "executive_summary", "summary", "themes", "actors", 
    "beneficiary_groups", "beneficiary_group_raw", "sdg_alignment", "practical_applications", 
    "commitments", "kpis", "top_themes", "top_actors", "extra_data", "name", "document_title", 
    "event_name", "Title", "NAME", "description", "legal_bindingness", "coverage_scope",
}

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def parse_date(value: Any) -> Optional[datetime]:
    """Try several date formats; return None if parsing fails."""
    if not value:
        return None
    if isinstance(value, (int, float)):
        try:
            return datetime.utcfromtimestamp(value).date()
        except Exception:
            return None
    for fmt in DATE_INPUT_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def split_location(loc: str) -> Tuple[Optional[str], Optional[str]]:
    """Return (city, country) from "City, Country" string; both may be None."""
    if not loc or loc.lower() in {"n/a", "unknown"}:
        return None, None
    if "," in loc:
        city, country = [p.strip() or None for p in loc.split(",", 1)]
        return city, country
    return None, loc.strip()


def truncate_text(text: str, max_length: int) -> str:
    """Truncate text to max_length with ellipsis if needed."""
    if not text or len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def get_first_available_value(data: Dict, fields: List[str]) -> str:
    """Get the first non-empty value from the given fields."""
    for field in fields:
        # guard against None so strip() never fails
        value = (data.get(field) or "").strip()
        if value:
            return value
    return ""


def normalize_string(value: Any) -> Optional[str]:
    """Convert value to string and normalize, return None for empty."""
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized if normalized else None


# ---------------------------------------------------------------------------
# Loader core
# ---------------------------------------------------------------------------

class Loader:
    """Encapsulates JSON‑>DB import for one file."""

    def __init__(self, data: Dict, dry_run: bool = False, filename: str = None):
        self.data = data
        self.dry_run = dry_run
        self.filename = filename
        self.doc: Optional[Document] = None
        self.extra_data = data.get("extra_data", {})

    def run(self) -> None:
        """Main entry point for loading a document."""
        with transaction.atomic():
            self._create_document()
            self._load_taxonomies()
            self._load_practical_applications()
            self._load_commitments()
            self._load_kpis()
            if self.dry_run:
                transaction.set_rollback(True)

    def _extract_document_type_from_filename(self) -> Optional[str]:
        """Extract document_type from filename prefix before first underscore."""
        if not self.filename:
            return None
        prefix = self.filename.split('_')[0].strip()
        return TYPE_MAPPING.get(prefix)

    def _get_document_title(self) -> str:
        """Extract and validate document title from various sources."""
        title = get_first_available_value(self.data, TITLE_FIELDS)
        
        if not title:
            # Try fallback content fields
            title = get_first_available_value(self.data, FALLBACK_CONTENT_FIELDS)
            if title:
                title = title[:100]  # Truncate fallback content
        
        if not title:
            title = f"Untitled Document {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        return truncate_text(title, 120)

    def _get_location_data(self) -> Tuple[Optional[str], Optional[str]]:
        """Extract and validate location data."""
        location = self.data.get("location", "")
        city, country = split_location(location)
        return (truncate_text(city, 100) if city else None,
                truncate_text(country, 100) if country else None)

    def _get_legal_bindingness(self) -> Optional[str]:
        """Extract legal_bindingness from main data or extra_data."""
        raw = self.data.get("legal_bindingness") or self.extra_data.get("legal_bindingness")
        normalized = normalize_string(raw)
        # Las keys del choice en el modelo están en minúsculas
        return normalized.lower() if normalized else None

    def _create_document(self) -> None:
        """Create the main Document instance."""
        title = self._get_document_title()
        event_date = parse_date(self.data.get("date") or self.data.get("Date"))
        city, country = self._get_location_data()
        summary = get_first_available_value(self.data, SUMMARY_FIELDS)
        summary = truncate_text(summary, 5000) if summary else ""
        
        document_type = self._extract_document_type_from_filename()
        coverage_scope = self.extra_data.get("coverage_scope")
        legal_bindingness = self._get_legal_bindingness()
        
        extra = {k: v for k, v in self.data.items() if k not in EXCLUDED_FIELDS}

        # capture created flag so we can attach file whether it's new or existing
        self.doc, _created = Document.objects.get_or_create(
            title=title,
            event_date=event_date,
            defaults={
                "city": city,
                "country": country,
                "executive_summary": summary,
                "document_type": document_type,
                "coverage_scope": coverage_scope,
                "legal_bindingness": legal_bindingness,
                "extra": extra,
            },
        )

        # now attach any matching .docx summary
        self._attach_summary_file()

    def _attach_summary_file(self) -> None:
        """If a same-named .docx lives in data/, attach it to summary_file."""
        if self.dry_run or not self.filename:
            return

        data_dir = Path(__file__).resolve().parents[4] / "data"
        docx_path = data_dir / f"{self.filename}.docx"
        if docx_path.exists() and not self.doc.summary_file:
            with open(docx_path, "rb") as fp:
                self.doc.summary_file.save(docx_path.name, File(fp), save=False)
            # persist just the file field
            self.doc.save(update_fields=["summary_file"])

    def _create_or_get_taxonomy_item(self, model_class, label: str, category: str = "Uncategorised"):
        """Generic method to create or get taxonomy items (Theme, Actor, etc.)."""
        return model_class.objects.get_or_create(
            label=label,
            defaults={"category": category, "description": ""}
        )

    def _process_taxonomy_data(self, model_class, relation_model, data: Union[Dict, List], 
                              relation_field: str = "document") -> None:
        """Process taxonomy data in both dict and list formats."""
        if isinstance(data, dict):
            self._process_categorized_taxonomy(model_class, relation_model, data, relation_field)
        elif isinstance(data, list):
            self._process_flat_taxonomy(model_class, relation_model, data, relation_field)

    def _process_categorized_taxonomy(self, model_class, relation_model, data: Dict, 
                                    relation_field: str) -> None:
        """Process categorized taxonomy data like {"Category": ["item1", "item2"]}."""
        for category, item_list in data.items():
            if isinstance(item_list, list):
                for item_label in item_list:
                    if item_label:
                        taxonomy_item, _ = self._create_or_get_taxonomy_item(
                            model_class, item_label, category
                        )
                        relation_model.objects.get_or_create(
                            **{relation_field: self.doc, 
                               model_class.__name__.lower(): taxonomy_item}
                        )

    def _process_flat_taxonomy(self, model_class, relation_model, data: List, 
                             relation_field: str) -> None:
        """Process flat taxonomy data as a list."""
        for item in data:
            if isinstance(item, dict):
                label = item.get("label")
                category = item.get("category", "Uncategorised")
            else:
                label = item
                category = "Uncategorised"
            
            if label:
                taxonomy_item, _ = self._create_or_get_taxonomy_item(
                    model_class, label, category
                )
                relation_model.objects.get_or_create(
                    **{relation_field: self.doc, 
                       model_class.__name__.lower(): taxonomy_item}
                )

    def _process_top_items(self, model_class, relation_model, data: List, 
                          relation_field: str) -> None:
        """Process top items with metadata (relevance_score, justification)."""
        for item in data:
            if isinstance(item, dict):
                label = item.get("name") or item.get("label")
                if label:
                    taxonomy_item, _ = self._create_or_get_taxonomy_item(
                        model_class, label
                    )
                    relation_model.objects.update_or_create(
                        **{relation_field: self.doc, 
                           model_class.__name__.lower(): taxonomy_item},
                        defaults={
                            "is_top": True,
                            "relevance_score": item.get("relevance_score"),
                            "justification": item.get("justification"),
                        },
                    )

    def _load_taxonomies(self) -> None:
        """Load all taxonomy data."""
        # Themes
        self._process_taxonomy_data(Theme, DocumentTheme, self.data.get("themes", []))
        
        # Actors
        self._process_taxonomy_data(Actor, DocumentActor, self.data.get("actors", []))
        
        # Beneficiary groups from multiple sources
        self._load_beneficiary_groups()
        
        # SDGs from multiple sources
        self._load_sdgs()
        
        # Top themes and actors with metadata
        self._process_top_items(Theme, DocumentTheme, self.data.get("top_themes", []), "document")
        self._process_top_items(Actor, DocumentActor, self.data.get("top_actors", []), "document")

    def _load_beneficiary_groups(self) -> None:
        """Load beneficiary groups from multiple sources."""
        # Regular beneficiary groups from root and extra_data
        for bg_data in [self.data.get("beneficiary_groups", []), 
                       self.extra_data.get("beneficiary_group", [])]:
            for bg_item in bg_data:
                label = bg_item.get("label") if isinstance(bg_item, dict) else bg_item
                category = bg_item.get("category", "Uncategorised") if isinstance(bg_item, dict) else "Uncategorised"
                
                if label:
                    bg, _ = BeneficiaryGroup.objects.get_or_create(
                        label=label,
                        defaults={"category": category, "description": ""}
                    )
                    self.doc.beneficiary_groups.add(bg)
        
        # Raw beneficiary groups from root and extra_data
        for raw_data in [self.data.get("beneficiary_group_raw", []), 
                        self.extra_data.get("beneficiary_group_raw", [])]:
            for raw in raw_data:
                if raw:
                    raw_bg, _ = BeneficiaryGroupRaw.objects.get_or_create(name=raw)
                    DocumentBeneficiaryGroupRaw.objects.get_or_create(
                        document=self.doc, raw_group=raw_bg
                    )

    def _load_sdgs(self) -> None:
        """Load SDGs from multiple sources."""
        for sdg_data in [self.data.get("sdg_alignment", []), 
                        self.extra_data.get("sdg_alignment", [])]:
            for sdg_label in sdg_data:
                if sdg_label:
                    number = self._extract_sdg_number(sdg_label)
                    sdg, _ = SDG.objects.get_or_create(
                        label=sdg_label,
                        defaults={"number": number}
                    )
                    self.doc.sdgs.add(sdg)

    def _extract_sdg_number(self, sdg_label: str) -> Optional[int]:
        """Extract SDG number from label like 'SDG X:'."""
        if sdg_label.lower().startswith("sdg "):
            try:
                return int(sdg_label.split()[1].rstrip(":"))
            except (IndexError, ValueError):
                pass
        return None

    def _load_practical_applications(self) -> None:
        """Load practical applications from multiple sources."""
        for app_data in [self.data.get("practical_applications", []), 
                        self.extra_data.get("practical_applications", [])]:
            for desc in app_data:
                if desc:
                    PracticalApplication.objects.get_or_create(
                        document=self.doc,
                        description=desc
                    )

    def _load_commitments(self) -> None:
        """Load commitments and their details."""
        commit_objs = {}
        
        # Load main commitments
        for com in self.data.get("commitments", []):
            if com:
                commit_obj, _ = Commitment.objects.get_or_create(
                    document=self.doc, text=com
                )
                commit_objs[com[:100]] = commit_obj

        # Load commitment details from extra_data
        for det in self.extra_data.get("commitment_details", []):
            text, commitment_class = self._parse_commitment_detail(det)
            if text:
                commit_obj = self._get_or_create_commitment(text, commit_objs)
                CommitmentDetail.objects.get_or_create(
                    commitment=commit_obj,
                    text=text,
                    defaults={"commitment_class": commitment_class},
                )

    def _parse_commitment_detail(self, det: Union[Dict, str]) -> Tuple[Optional[str], Optional[str]]:
        """Parse commitment detail data."""
        if isinstance(det, dict):
            return det.get("text"), det.get("commitment_class")
        return det, None

    def _get_or_create_commitment(self, text: str, commit_objs: Dict) -> Commitment:
        """Get existing commitment or create new one."""
        key = text[:100]
        commit_obj = commit_objs.get(key)
        if not commit_obj:
            commit_obj, _ = Commitment.objects.get_or_create(
                document=self.doc, text=text
            )
            commit_objs[key] = commit_obj
        return commit_obj

    def _load_kpis(self) -> None:
        """Load KPIs from multiple sources."""
        for kpi_data in [self.data.get("kpis", []), 
                        self.extra_data.get("kpi_list", [])]:
            for kpi in kpi_data:
                if self._is_valid_kpi(kpi):
                    self._create_kpi(kpi)

    def _is_valid_kpi(self, kpi: Any) -> bool:
        """Check if KPI data is valid."""
        return (kpi and isinstance(kpi, dict) and 
                (kpi.get("metric_name") or kpi.get("metric")))

    def _create_kpi(self, kpi: Dict) -> None:
        """Create a KPI instance."""
        metric_name = kpi.get("metric_name") or kpi.get("metric")
        kpi_text = kpi.get("kpi_text") or kpi.get("description")
        
        KPI.objects.get_or_create(
            document=self.doc,
            metric_name=metric_name,
            defaults={
                "kpi_text": kpi_text,
                "kpi_type": kpi.get("kpi_type"),
                "target_value": kpi.get("target_value"),
                "target_description": kpi.get("target_description"),
                "unit": kpi.get("unit"),
                "timeframe": kpi.get("timeframe"),
                "measurement_method": kpi.get("measurement_method"),
                "responsible_entity": kpi.get("responsible_entity"),
                "sector": kpi.get("sector"),
            },
        )


# ---------------------------------------------------------------------------
# Management command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = "Seed the database with JSON documents located in <project_root>/data."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", 
                          help="Parse files without saving to the DB.")
        parser.add_argument("--limit", type=int, default=None, 
                          help="Process only the first N files.")
        parser.add_argument("--no-truncate", action="store_true", 
                          help="Skip truncating existing data before import.")

    def _get_models_to_clear(self) -> List[str]:
        """Get ordered list of model names for truncation."""
        return [
            'DocumentBeneficiaryGroupRaw', 'DocumentTheme', 'DocumentActor',
            'CommitmentDetail', 'Commitment', 'KPI', 'PracticalApplication',
            'Document', 'BeneficiaryGroupRaw', 'BeneficiaryGroup', 
            'Theme', 'Actor', 'SDG',
        ]

    def _truncate_data(self) -> None:
        """Remove all existing documents and related data."""
        self.stdout.write(self.style.WARNING("Truncating existing data..."))
        
        documents_app = apps.get_app_config('documents')
        
        for model_name in self._get_models_to_clear():
            try:
                model = documents_app.get_model(model_name)
                count = model.objects.count()
                if count > 0:
                    model.objects.all().delete()
                    self.stdout.write(f"  Cleared {count} {model_name} records")
            except LookupError:
                continue
        
        self.stdout.write(self.style.SUCCESS("Data truncation completed."))

    def _get_json_files(self, limit: Optional[int]) -> List[Path]:
        """Get list of JSON files to process."""
        data_dir = Path(__file__).resolve().parents[4] / 'data'
        if not data_dir.exists():
            raise CommandError(f"Data directory not found: {data_dir}")

        files = sorted(p for p in data_dir.glob("*.json"))
        return files[:limit] if limit else files

    def _process_file(self, path: Path, idx: int, total: int, dry_run: bool) -> bool:
        """Process a single JSON file. Returns True if successful."""
        try:
            with open(path, "r", encoding="utf-8") as fp:
                data = json.load(fp)
            
            Loader(data, dry_run=dry_run, filename=path.stem).run()
            
            status = "DRY‑RUN ok" if dry_run else "Imported"
            style = self.style.NOTICE if dry_run else self.style.SUCCESS
            self.stdout.write(style(f"[{idx}/{total}] {status} → {path.name}"))
            return True
            
        except Exception as exc:
            self.stderr.write(
                self.style.ERROR(f"[{idx}/{total}] Failed {path.name}: {exc.__class__.__name__}: {exc}")
            )
            return False

    def handle(self, *args, **options):
        if not options.get('no_truncate', False):
            self._truncate_data()
        
        files = self._get_json_files(options.get("limit"))
        dry_run = options.get("dry_run", False)
        total = len(files)
        
        if not total:
            self.stdout.write(self.style.WARNING("No JSON files found."))
            return

        self.stdout.write(f"Processing {total} file(s)… (dry_run={dry_run})")

        ok = failed = 0
        for idx, path in enumerate(files, start=1):
            if self._process_file(path, idx, total, dry_run):
                ok += 1
            else:
                failed += 1

        self.stdout.write(
            self.style.SUCCESS(f"Completed. Success: {ok}, Failed: {failed}, Dry‑run: {dry_run}")
        )