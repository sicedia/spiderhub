"""
Management command to seed the QualitativeIndicator catalog.

Run once (idempotent – safe to re-run):
    python manage.py seed_qualitative_indicators
"""

from django.core.management.base import BaseCommand

from apps.documents.models import QualitativeIndicator

INDICATORS = [
    # ── Micro ──────────────────────────────────────────────────────────────
    {
        "code": "MICRO_STAKEHOLDER_DIVERSITY",
        "label": "Stakeholder Diversity",
        "level": "micro",
        "dimension": "diversity",
        "description": (
            "Assesses the diversity of actor types — governments, NGOs, private sector, "
            "academia, and civil society — participating in or referenced by the document. "
            "A higher score indicates a broad, multi-sector representation."
        ),
    },
    {
        "code": "MICRO_INSTITUTIONAL_REPRESENTATION",
        "label": "Institutional Representativeness",
        "level": "micro",
        "dimension": "representation",
        "description": (
            "Evaluates the breadth of institutions and organisational types mentioned "
            "or involved in the dialogue, including underrepresented or remote institutions. "
            "Captures whether governance structures reflect diverse institutional mandates."
        ),
    },
    # ── Meso ───────────────────────────────────────────────────────────────
    {
        "code": "MESO_ENGAGEMENT_QUALITY",
        "label": "Engagement Quality",
        "level": "meso",
        "dimension": "engagement",
        "description": (
            "Assesses the depth and quality of stakeholder participation: whether actors "
            "actively contributed to dialogue processes (beyond mere attendance), provided "
            "feedback, or co-created outputs. Measured by evidence of participatory mechanisms "
            "such as surveys, interviews, and workshops."
        ),
    },
    {
        "code": "MESO_POLICY_INFLUENCE",
        "label": "Policy Influence",
        "level": "meso",
        "dimension": "policy",
        "description": (
            "Measures the extent to which dialogue outcomes, recommendations, or commitments "
            "documented here are taken up into national or regional policy strategies and "
            "action plans. High scores indicate concrete linkages to formal policy instruments."
        ),
    },
    {
        "code": "MESO_COLLABORATIVE_TRUST",
        "label": "Collaborative Trust-Building",
        "level": "meso",
        "dimension": "trust",
        "description": (
            "Evaluates evidence of sustained interaction, mutual recognition, shared goal "
            "alignment, and cross-institutional cooperation between actors. Captures whether "
            "the document reflects relational capital built over time."
        ),
    },
    {
        "code": "MESO_COMMUNICATION_INCLUSIVITY",
        "label": "Communication Inclusivity",
        "level": "meso",
        "dimension": "inclusivity",
        "description": (
            "Assesses the transparency, accessibility, and reach of communication mechanisms "
            "described or used in the document, with special attention to underrepresented, "
            "remote, or marginalised regions and groups."
        ),
    },
    # ── Macro ──────────────────────────────────────────────────────────────
    {
        "code": "MACRO_REGIONAL_ALIGNMENT",
        "label": "Regional Policy Alignment",
        "level": "macro",
        "dimension": "alignment",
        "description": (
            "Measures how well the document's content aligns with established EU-LAC, "
            "national, or multilateral policy frameworks. High scores indicate explicit "
            "references to regional strategies and demonstrated coherence with them."
        ),
    },
    {
        "code": "MACRO_LONG_TERM_IMPACT",
        "label": "Long-term Impact Potential",
        "level": "macro",
        "dimension": "impact",
        "description": (
            "Assesses whether the cooperation documented is likely to produce enduring "
            "structural changes or systemic improvements over time — as opposed to one-off "
            "events or short-term outputs."
        ),
    },
    {
        "code": "MACRO_CONTINUITY",
        "label": "Continuity of Practice",
        "level": "macro",
        "dimension": "continuity",
        "description": (
            "Evaluates evidence of institutional memory, adaptive learning, and the "
            "continuation of cooperative practices across multiple policy cycles. Captures "
            "whether mechanisms exist to preserve and build on past dialogue outcomes."
        ),
    },
]


class Command(BaseCommand):
    help = "Seed the QualitativeIndicator catalog with the 9 predefined indicators (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Deactivate all existing indicators before seeding (does NOT delete data rows).",
        )

    def handle(self, *args, **options):
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write("Seeding Qualitative Indicator catalog")
        self.stdout.write("=" * 70 + "\n")

        if options["reset"]:
            count = QualitativeIndicator.objects.update(is_active=False)
            self.stdout.write(self.style.WARNING(f"Deactivated {count} existing indicator(s).\n"))

        created_count = 0
        updated_count = 0

        for data in INDICATORS:
            obj, created = QualitativeIndicator.objects.update_or_create(
                code=data["code"],
                defaults={
                    "label": data["label"],
                    "level": data["level"],
                    "dimension": data["dimension"],
                    "description": data["description"],
                    "is_active": True,
                },
            )

            status = "CREATED" if created else "OK    "
            self.stdout.write(
                f"  [{status}] [{obj.level.upper():5}] {obj.label}"
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write("\n" + "=" * 70)
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {created_count} created, {updated_count} already existed."
            )
        )
        self.stdout.write("=" * 70 + "\n")
