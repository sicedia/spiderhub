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

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

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

DATE_INPUT_FORMATS = ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"]


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def parse_date(value):
    """Try several date formats; return None if parsing fails."""
    if not value:
        return None
    if isinstance(value, (int, float)):
        # Epoch timestamp support (seconds)
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


def split_location(loc):
    """Return (city, country) from "City, Country" string; both may be None."""
    if not loc or loc.lower() in {"n/a", "unknown"}:
        return None, None
    if "," in loc:
        city, country = [p.strip() or None for p in loc.split(",", 1)]
        return city, country
    # If only one token, assume country
    return None, loc.strip()


def norm(label):
    """Simple normaliser to compare labels case‑insensitively."""
    return (label or "").strip().lower()


# ---------------------------------------------------------------------------
# Loader core
# ---------------------------------------------------------------------------

class Loader:
    """Encapsulates JSON‑>DB import for one file."""

    def __init__(self, data: dict, dry_run: bool = False):
        self.data = data
        self.dry_run = dry_run
        self.doc = None  # type: Document | None

    # ---------------------------- public API ----------------------------

    def run(self):
        with transaction.atomic():
            self._create_document()
            self._load_taxonomies()
            self._load_practical_applications()
            self._load_commitments()
            self._load_kpis()
            if self.dry_run:
                transaction.set_rollback(True)
                return

    # --------------------------- internal steps -------------------------

    def _create_document(self):
        # Expanded title field searching with more fallback options
        title = (
            self.data.get("title") or 
            self.data.get("Name of the Event") or
            self.data.get("name") or
            self.data.get("document_title") or
            self.data.get("event_name") or
            self.data.get("Title") or
            self.data.get("NAME") or
            ""
        ).strip()
        
        # If still no title, try to extract from filename or create a default
        if not title:
            # Try to get a title from other fields
            title = (
                self.data.get("description", "")[:100] or
                self.data.get("summary", "")[:100] or
                self.data.get("executive_summary", "")[:100] or
                f"Document {datetime.now().strftime('%Y%m%d_%H%M%S')}"
            ).strip()
            
        if not title or title is None:
            title = f"Untitled Document {datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Truncate title if it's too long (assuming 120 char limit based on error)
        if len(title) > 120:
            title = title[:117] + "..."
        
        if not title:
            raise ValueError(f"Unable to determine title from JSON data. Available keys: {list(self.data.keys())}")

        event_date = parse_date(self.data.get("date") or self.data.get("Date"))
        
        # Handle location with length limits
        location = self.data.get("location", "")
        city, country = split_location(location)
        
        # Truncate city and country if they're too long
        if city and len(city) > 100:  # Assuming reasonable limit
            city = city[:97] + "..."
        if country and len(country) > 100:
            country = country[:97] + "..."

        summary = (
            self.data.get("executive_summary")
            or self.data.get("Summary")
            or self.data.get("summary")
            or self.data.get("description")
            or ""
        )

        # Truncate summary if needed (check your model's field length)
        if summary and len(summary) > 5000:  # Adjust based on your model
            summary = summary[:4997] + "..."

        extra = {k: v for k, v in self.data.items() if k not in {
            "title",
            "date",
            "location",
            "executive_summary",
            "summary",
            "themes",
            "actors",
            "beneficiary_groups",
            "beneficiary_group_raw",
            "sdg_alignment",
            "practical_applications",
            "commitments",
            "kpis",
            "top_themes",
            "top_actors",
            "extra_data",
            "name",
            "document_title",
            "event_name",
            "Title",
            "NAME",
            "description",
        }}

        self.doc, _ = Document.objects.get_or_create(
            title=title,
            event_date=event_date,
            defaults={
                "city": city,
                "country": country,
                "executive_summary": summary,
                "extra": extra,
            },
        )

    # --------------------------- taxonomies -----------------------------

    def _load_taxonomies(self):
        # Handle themes - support both dict and string formats
        themes_data = self.data.get("themes", [])
        
        if isinstance(themes_data, dict):
            # Handle categorized themes like {"Digital Transformation": ["AI", "ML"]}
            for category, theme_list in themes_data.items():
                if isinstance(theme_list, list):
                    for theme_label in theme_list:
                        if theme_label:
                            theme, _ = Theme.objects.get_or_create(
                                label=theme_label,
                                defaults={"category": category or "Uncategorised", "description": ""}
                            )
                            DocumentTheme.objects.get_or_create(document=self.doc, theme=theme)
        elif isinstance(themes_data, list):
            # Handle flat list of themes
            for theme_item in themes_data:
                if isinstance(theme_item, dict):
                    label = theme_item.get("label")
                    category = theme_item.get("category", "Uncategorised")
                else:
                    label = theme_item
                    category = "Uncategorised"
                
                if label:
                    theme, _ = Theme.objects.get_or_create(
                        label=label,
                        defaults={"category": category, "description": ""}
                    )
                    DocumentTheme.objects.get_or_create(document=self.doc, theme=theme)

        # Handle actors - support both dict and string formats
        actors_data = self.data.get("actors", [])
        
        if isinstance(actors_data, dict):
            # Handle categorized actors like {"Political Actors": ["Government", "Parliament"]}
            for category, actor_list in actors_data.items():
                if isinstance(actor_list, list):
                    for actor_label in actor_list:
                        if actor_label:
                            actor, _ = Actor.objects.get_or_create(
                                label=actor_label,
                                defaults={"category": category or "Uncategorised", "description": ""}
                            )
                            DocumentActor.objects.get_or_create(document=self.doc, actor=actor)
        elif isinstance(actors_data, list):
            # Handle flat list of actors
            for actor_item in actors_data:
                if isinstance(actor_item, dict):
                    label = actor_item.get("label")
                    category = actor_item.get("category", "Uncategorised")
                else:
                    label = actor_item
                    category = "Uncategorised"
                
                if label:
                    actor, _ = Actor.objects.get_or_create(
                        label=label,
                        defaults={"category": category, "description": ""}
                    )
                    DocumentActor.objects.get_or_create(document=self.doc, actor=actor)

        # Handle beneficiary groups - support both root level and extra_data
        extra_data = self.data.get("extra_data", {})
        
        # Regular beneficiary groups from root level
        for bg_dict in self.data.get("beneficiary_groups", []):
            if isinstance(bg_dict, dict):
                label = bg_dict.get("label")
                category = bg_dict.get("category", "Uncategorised")
            else:
                label = bg_dict
                category = "Uncategorised"
            
            if label:
                bg, _ = BeneficiaryGroup.objects.get_or_create(
                    label=label,
                    defaults={"category": category, "description": ""}
                )
                self.doc.beneficiary_groups.add(bg)
        
        # Regular beneficiary groups from extra_data
        for bg_dict in extra_data.get("beneficiary_group", []):
            if isinstance(bg_dict, dict):
                label = bg_dict.get("label")
                category = bg_dict.get("category", "Uncategorised")
            else:
                label = bg_dict
                category = "Uncategorised"
            
            if label:
                bg, _ = BeneficiaryGroup.objects.get_or_create(
                    label=label,
                    defaults={"category": category, "description": ""}
                )
                self.doc.beneficiary_groups.add(bg)

        # Raw beneficiary groups from root level
        for raw in self.data.get("beneficiary_group_raw", []):
            if raw:
                raw_bg, _ = BeneficiaryGroupRaw.objects.get_or_create(name=raw)
                DocumentBeneficiaryGroupRaw.objects.get_or_create(document=self.doc, raw_group=raw_bg)

        # Raw beneficiary groups from extra_data
        for raw in extra_data.get("beneficiary_group_raw", []):
            if raw:
                raw_bg, _ = BeneficiaryGroupRaw.objects.get_or_create(name=raw)
                DocumentBeneficiaryGroupRaw.objects.get_or_create(document=self.doc, raw_group=raw_bg)

        # SDGs from root level
        for sdg_label in self.data.get("sdg_alignment", []):
            if sdg_label:
                # Try to extract number from label if it starts with "SDG X:"
                number = None
                if sdg_label.lower().startswith("sdg "):
                    try:
                        number = int(sdg_label.split()[1].rstrip(":"))
                    except (IndexError, ValueError):
                        pass
                
                sdg, _ = SDG.objects.get_or_create(
                    label=sdg_label,
                    defaults={"number": number}
                )
                self.doc.sdgs.add(sdg)

        # SDGs from extra_data
        for sdg_label in extra_data.get("sdg_alignment", []):
            if sdg_label:
                # Try to extract number from label if it starts with "SDG X:"
                number = None
                if sdg_label.lower().startswith("sdg "):
                    try:
                        number = int(sdg_label.split()[1].rstrip(":"))
                    except (IndexError, ValueError):
                        pass
                
                sdg, _ = SDG.objects.get_or_create(
                    label=sdg_label,
                    defaults={"number": number}
                )
                self.doc.sdgs.add(sdg)

        # Top themes with metadata
        for top in self.data.get("top_themes", []):
            if isinstance(top, dict):
                label = top.get("name") or top.get("label")
                if label:
                    theme, _ = Theme.objects.get_or_create(
                        label=label,
                        defaults={"category": "Uncategorised", "description": ""}
                    )
                    DocumentTheme.objects.update_or_create(
                        document=self.doc,
                        theme=theme,
                        defaults={
                            "is_top": True,
                            "relevance_score": top.get("relevance_score"),
                            "justification": top.get("justification"),
                        },
                    )

        # Top actors with metadata
        for top in self.data.get("top_actors", []):
            if isinstance(top, dict):
                label = top.get("name") or top.get("label")
                if label:
                    actor, _ = Actor.objects.get_or_create(
                        label=label,
                        defaults={"category": "Uncategorised", "description": ""}
                    )
                    DocumentActor.objects.update_or_create(
                        document=self.doc,
                        actor=actor,
                        defaults={
                            "is_top": True,
                            "relevance_score": top.get("relevance_score"),
                            "justification": top.get("justification"),
                        },
                    )

    # ---------------------- practical applications ----------------------

    def _load_practical_applications(self):
        # From root level
        for desc in self.data.get("practical_applications", []):
            if desc:
                PracticalApplication.objects.get_or_create(
                    document=self.doc,
                    description=desc
                )
        
        # From extra_data
        extra_data = self.data.get("extra_data", {})
        for desc in extra_data.get("practical_applications", []):
            if desc:
                PracticalApplication.objects.get_or_create(
                    document=self.doc,
                    description=desc
                )

    # ---------------------------- commitments ---------------------------

    def _load_commitments(self):
        # Handle commitments from main level
        commit_objs = {}
        for com in self.data.get("commitments", []):
            if com:
                commit_obj, _ = Commitment.objects.get_or_create(document=self.doc, text=com)
                commit_objs[com[:100]] = commit_obj

        # Handle commitment details from extra_data
        extra_data = self.data.get("extra_data", {})
        
        # Add commitment details from extra_data
        for det in extra_data.get("commitment_details", []):
            if isinstance(det, dict):
                text = det.get("text")
                commitment_class = det.get("commitment_class")
            else:
                text = det
                commitment_class = None
            
            if text:
                # Find matching commitment or create new one
                key = text[:100]
                commit_obj = commit_objs.get(key)
                if not commit_obj:
                    commit_obj, _ = Commitment.objects.get_or_create(document=self.doc, text=text)
                    commit_objs[key] = commit_obj
                
                CommitmentDetail.objects.get_or_create(
                    commitment=commit_obj,
                    text=text,
                    defaults={"commitment_class": commitment_class},
                )

    # -------------------------------- KPIs ------------------------------

    def _load_kpis(self):
        # From root level
        for kpi in self.data.get("kpis", []):
            if not kpi or not isinstance(kpi, dict):
                continue
            
            metric_name = kpi.get("metric_name") or kpi.get("metric")
            if not metric_name:
                continue  # Skip KPIs without metric_name
            
            # Support both kpi_text and description fields
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

        # From extra_data
        extra_data = self.data.get("extra_data", {})
        for kpi in extra_data.get("kpi_list", []):
            if not kpi or not isinstance(kpi, dict):
                continue
            
            metric_name = kpi.get("metric_name") or kpi.get("metric")
            if not metric_name:
                continue  # Skip KPIs without metric_name
            
            # Support both kpi_text and description fields
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
        parser.add_argument("--dry-run", action="store_true", help="Parse files without saving to the DB.")
        parser.add_argument("--limit", type=int, default=None, help="Process only the first N files.")

    def handle(self, *args, **options):
        # Use the same data directory structure as the original
        data_dir = Path(__file__).resolve().parents[4] / 'data'
        if not data_dir.exists():
            raise CommandError(f"Data directory not found: {data_dir}")

        files = sorted(p for p in data_dir.glob("*.json"))
        limit = options.get("limit")
        if limit is not None:
            files = files[:limit]

        dry_run = options.get("dry_run", False)
        total = len(files)
        if not total:
            self.stdout.write(self.style.WARNING("No JSON files found."))
            return

        self.stdout.write(f"Processing {total} file(s)… (dry_run={dry_run})")

        ok, failed = 0, 0
        for idx, path in enumerate(files, start=1):
            try:
                with open(path, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                Loader(data, dry_run=dry_run).run()
                ok += 1
                if dry_run:
                    self.stdout.write(self.style.NOTICE(f"[{idx}/{total}] DRY‑RUN ok → {path.name}"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"[{idx}/{total}] Imported → {path.name}"))
            except Exception as exc:
                failed += 1
                self.stderr.write(
                    self.style.ERROR(f"[{idx}/{total}] Failed {path.name}: {exc.__class__.__name__}: {exc}")
                )

        self.stdout.write(
            self.style.SUCCESS(f"Completed. Success: {ok}, Failed: {failed}, Dry‑run: {dry_run}")
        )