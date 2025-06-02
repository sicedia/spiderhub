import os
import json
import re
from pathlib import Path
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError

from apps.documents.models import (
    Location, Actor, Theme, Tag, AgreementType, BeneficiaryGroup,
    Country, SdgGoal, Document, Characteristic, PracticalApplication,
    ResultingCommitment, Commitment, KPITarget
)


class Command(BaseCommand):
    help = 'Carga inicial de documentos desde JSON en apps/documents/data'

    def handle(self, *args, **options):
        data_dir = Path(__file__).resolve().parents[2] / 'data'
        files = sorted(f for f in os.listdir(data_dir) if f.lower().endswith('.json'))

        for fname in files:
            path = data_dir / fname
            with open(path, encoding='utf-8') as f:
                data = json.load(f)

            title = data.get('title')
            self.stdout.write(f'➡️  Procesando: {title}')
            with transaction.atomic():
                doc = self._get_or_create_document(data)
                if not doc:
                    # salta si no hay fecha válida
                    self.stderr.write(f"[Skip] Documento sin fecha válida: {title}\n")
                    continue
                self._attach_relations(doc, data)
            self.stdout.write(self.style.SUCCESS(f'✔️  Cargado: {title}\n'))

    def _get_or_create_document(self, data):
        # Location
        loc_name = data.get('location')
        location, _ = (
            Location.objects.get_or_create(name=loc_name)
            if loc_name else (None, False)
        )
        extra = data.get('extra_data', {})

        # Score → confidence_level
        score_value = data.get('score') or 0

        # — Normaliza date —
        raw_date = data.get('date')
        date_str = None
        if raw_date is not None:
            if isinstance(raw_date, int) or re.fullmatch(r'\d{4}', str(raw_date)):
                date_str = f"{raw_date}-01-01"
            else:
                try:
                    datetime.strptime(raw_date, "%Y-%m-%d")
                    date_str = raw_date
                except (ValueError, TypeError):
                    date_str = None

        # si no tenemos fecha válida, devolvemos None para saltar
        if not date_str:
            return None

        defaults = {
            'executive_summary': data.get('executive_summary', ''),
            'location': location,
            'date': date_str,
            'score': data.get('score'),
            'lead_country_iso': extra.get('lead_country_iso'),
            'legal_bindingness': extra.get('legal_bindingness', ''),
            'coverage_scope': extra.get('coverage_scope', ''),
            'review_schedule': extra.get('review_schedule', ''),
            'is_ai_generated': extra.get('is_ai_generated', True),
            'confidence_level': score_value,
            'admin_notes': extra.get('admin_notes', ''),
        }
        try:
            doc, created = Document.objects.update_or_create(
                title=data.get('title'),
                defaults=defaults
            )
            return doc
        except (IntegrityError, ValidationError) as e:
            self.stderr.write(f"[Document] Error al crear/actualizar: {e}")
            return None

    def _attach_relations(self, doc, data):
        # Actors
        try:
            for group in data.get('actors', {}).values():
                for name in group:
                    actor, _ = Actor.objects.get_or_create(name=name)
                    doc.actors.add(actor)
        except Exception as e:
            self.stderr.write(f"[Actors] Error: {e}")

        # Themes & Tags
        try:
            for theme_name, tags in data.get('themes', {}).items():
                theme, _ = Theme.objects.get_or_create(name=theme_name)
                doc.themes.add(theme)
                for tag_name in tags:
                    tag, _ = Tag.objects.get_or_create(name=tag_name, theme=theme)
                    doc.tags.add(tag)
        except Exception as e:
            self.stderr.write(f"[Themes/Tags] Error: {e}")

        # AgreementType
        try:
            agr = data.get('extra_data', {}).get('agreement_type')
            if agr:
                at, _ = AgreementType.objects.get_or_create(name=agr)
                doc.agreement_types.add(at)
        except Exception as e:
            self.stderr.write(f"[AgreementType] Error: {e}")

        # BeneficiaryGroup
        try:
            for bg in data.get('extra_data', {}).get('beneficiary_group', []):
                cat = bg.get('category') or ''
                lbl = bg.get('label') or ''
                if cat and lbl:
                    grp, _ = BeneficiaryGroup.objects.get_or_create(category=cat, label=lbl)
                    doc.beneficiary_groups.add(grp)
        except Exception as e:
            self.stderr.write(f"[BeneficiaryGroup] Error: {e}")

        # Countries
        try:
            for iso in data.get('extra_data', {}).get('country_list_iso', []):
                country, _ = Country.objects.get_or_create(iso=iso)
                doc.countries.add(country)
        except Exception as e:
            self.stderr.write(f"[Countries] Error: {e}")

        # SDG Alignments
        try:
            for name in data.get('extra_data', {}).get('sdg_alignment', []):
                goal, _ = SdgGoal.objects.get_or_create(name=name)
                doc.sdg_alignments.add(goal)
        except Exception as e:
            self.stderr.write(f"[SDG Alignments] Error: {e}")

        # Características
        try:
            for text in data.get('characteristics', []):
                Characteristic.objects.create(document=doc, text=text)
        except Exception as e:
            self.stderr.write(f"[Characteristics] Error: {e}")

        # Aplicaciones prácticas
        try:
            for text in data.get('practical_applications', []):
                PracticalApplication.objects.create(document=doc, text=text)
        except Exception as e:
            self.stderr.write(f"[PracticalApplications] Error: {e}")

        # Compromisos resultantes
        try:
            for text in data.get('resulting_commitments', []):
                ResultingCommitment.objects.create(document=doc, text=text)
        except Exception as e:
            self.stderr.write(f"[ResultingCommitments] Error: {e}")

        # Limpia compromisos previos
        try:
            Commitment.objects.filter(document=doc).delete()
        except Exception as e:
            self.stderr.write(f"[Delete Commitments] Error: {e}")

        # Compromisos simples (lista de strings)
        try:
            for text in data.get('commitments', []):
                Commitment.objects.create(
                    document=doc,
                    text=text,
                    commitment_class=''
                )
        except Exception as e:
            self.stderr.write(f"[Simple Commitments] Error: {e}")

        # Detalles de compromisos con clase
        try:
            for detail in data.get('extra_data', {}).get('commitment_details', []):
                txt = detail if isinstance(detail, str) else detail.get('text', '')
                cls = '' if isinstance(detail, str) else detail.get('commitment_class', '')
                Commitment.objects.create(document=doc, text=txt, commitment_class=cls)
        except Exception as e:
            self.stderr.write(f"[Detailed Commitments] Error: {e}")

        # KPIs
        try:
            for k in data.get('kpi_list', []):
                KPITarget.objects.create(
                    document=doc,
                    kpi=k.get('kpi', ''),
                    target_value=k.get('target_value', 0),
                    unit=k.get('unit', '')
                )
        except Exception as e:
            self.stderr.write(f"[KPIs] Error: {e}")