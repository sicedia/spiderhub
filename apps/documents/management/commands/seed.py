import os
import json
import re
from pathlib import Path
from datetime import datetime, date

from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError

from apps.documents.models import (
    Location, ThemeCategory, Theme, ActorCategory, Actor, AgreementType, 
    BeneficiaryCategory, BeneficiaryGroup, Country, SdgGoal, Document, DocumentFile, 
    Characteristic, PracticalApplication, Commitment, KPI
)


class Command(BaseCommand):
    help = 'Load documents from JSON files in apps/documents/data'

    def handle(self, *args, **options):
        data_dir = Path(__file__).resolve().parents[2] / 'data'
        files = sorted(f for f in os.listdir(data_dir) if f.lower().endswith('.json'))

        for fname in files:
            path = data_dir / fname
            try:
                with open(path, encoding='utf-8') as f:
                    data = json.load(f)
            except json.JSONDecodeError as e:
                self.stderr.write(f"[JSON Error] {fname}: {e}")
                continue

            title = data.get('title')
            if not title:
                self.stderr.write(f"[Skip] No title found in: {fname}")
                continue

            self.stdout.write(f'➡️  Processing: {title}')
            
            try:
                with transaction.atomic():
                    doc = self._get_or_create_document(data, fname)
                    if not doc:
                        self.stderr.write(f"[Skip] Could not create document: {title}")
                        continue
                    self._attach_relations(doc, data)
                self.stdout.write(self.style.SUCCESS(f'✔️  Loaded: {title}\n'))
            except Exception as e:
                self.stderr.write(f"[Error] Processing {fname}: {e}")

    def _is_valid_data(self, value):
        """Check if data is valid (not null, empty, or placeholder text)"""
        if not value:
            return False
        
        if isinstance(value, str):
            # Check for common placeholder texts
            placeholders = [
                'no information available',
                'unknown',
                'not specified',
                'n/a',
                'null',
                'none',
                ''
            ]
            return value.lower().strip() not in placeholders
        
        if isinstance(value, (list, dict)):
            return len(value) > 0
            
        return True

    def _determine_document_type(self, filename):
        """Determine document type based on folder structure/filename"""
        fn = filename.lower().replace('–', '-').replace('—', '-').replace(' _', '-')
        if 'dialogue' in fn and 'eu-lac' in fn:
            return 'dialogue_eu_lac'
        elif 'dialogue' in fn and 'bilateral' in fn:
            return 'dialogue_bilateral'
        elif 'dialogue' in fn and 'multilateral' in fn:
            return 'dialogue_multilateral'
        elif 'agreement' in fn and 'eu-lac' in fn:
            return 'agreement_eu_lac'
        elif 'agreement' in fn and 'bilateral' in fn:
            return 'agreement_bilateral'
        elif 'agreement' in fn and 'multilateral' in fn:
            return 'agreement_multilateral'
        
        return 'other'

    def _get_or_create_document(self, data, filename):
        """Create or update document with validation"""
        # Normalize and validate date
        raw_date = data.get('date')
        if not self._is_valid_data(raw_date):
            return None

        date_str = self._normalize_date(raw_date)
        if not date_str:
            return None

        # Location
        location = None
        loc_name = data.get('location')
        if self._is_valid_data(loc_name):
            location, _ = Location.objects.get_or_create(name=loc_name.strip())

        # Extract extra data
        extra = data.get('extra_data', {}) or {}
        quality = data.get('quality_breakdown', {}) or {}

        # Determine document type from filename
        document_type = self._determine_document_type(filename)

        # Prepare document data
        defaults = {
            'executive_summary': data.get('executive_summary', '') if self._is_valid_data(data.get('executive_summary')) else '',
            'location': location,
            'date': date_str,
            'document_type': document_type,
            'score': data.get('score') if self._is_valid_data(data.get('score')) else None,
            'lead_country_iso': extra.get('lead_country_iso') if self._is_valid_data(extra.get('lead_country_iso')) else None,
            'legal_bindingness': extra.get('legal_bindingness', '') if self._is_valid_data(extra.get('legal_bindingness')) else '',
            'coverage_scope': extra.get('coverage_scope', '') if self._is_valid_data(extra.get('coverage_scope')) else '',
            'review_schedule': extra.get('review_schedule', '') if self._is_valid_data(extra.get('review_schedule')) else '',
            'start_date': self._normalize_date(extra.get('start_date')),
            'end_date': self._normalize_date(extra.get('end_date')),
            'faithfulness': quality.get('faithfulness') if self._is_valid_data(quality.get('faithfulness')) else None,
            'consistency': quality.get('consistency') if self._is_valid_data(quality.get('consistency')) else None,
            'completeness': quality.get('completeness') if self._is_valid_data(quality.get('completeness')) else None,
            'accuracy': quality.get('accuracy') if self._is_valid_data(quality.get('accuracy')) else None,
        }

        try:
            doc, created = Document.objects.update_or_create(
                title=data.get('title').strip(),
                defaults=defaults
            )
            return doc
        except (IntegrityError, ValidationError) as e:
            self.stderr.write(f"[Document] Error creating/updating: {e}")
            return None

    def _normalize_date(self, raw):
        """Normalize date to YYYY-MM-DD format"""
        if not self._is_valid_data(raw):
            return None

        s = str(raw)
        try:
            if isinstance(raw, int) or re.fullmatch(r'\d{4}', s):
                # Handle YYYY format
                return f"{s}-01-01"
            elif re.fullmatch(r'\d{4}-\d{2}', s):
                # Handle YYYY-MM format
                return f"{s}-01"
            elif re.fullmatch(r'\d{4}-\d{2}-\d{2}', s):
                y,m,d = map(int, s.split('-'))
                return date(y,m,d)
            else:
                # Try to parse YYYY-MM-DD format
                datetime.strptime(s, "%Y-%m-%d")
                return s
        except (ValueError, TypeError):
            self.stderr.write(f"[Date Normalize Error] Could not parse date: {raw}")
            return None

    def _attach_relations(self, doc, data):
        """Attach all relationships to document"""
        # Clear existing relationships to avoid duplicates
        doc.actors.clear()
        doc.themes.clear()
        doc.agreement_types.clear()
        doc.beneficiary_groups.clear()
        doc.countries.clear()
        doc.sdg_alignments.clear()

        # Delete existing related objects
        doc.characteristics.all().delete()
        doc.practical_applications.all().delete()
        doc.commitments.all().delete()
        doc.kpis.all().delete()

        self._attach_themes_and_actors(doc, data)
        self._attach_basic_relations(doc, data)
        self._attach_text_relations(doc, data)
        self._attach_commitments(doc, data)
        self._attach_kpis(doc, data)

    def _attach_themes_and_actors(self, doc, data):
        """Attach themes with categories and actors with categories"""
        # Themes
        themes_data = data.get('themes', {}) or {}
        if self._is_valid_data(themes_data):
            for category_name, theme_list in themes_data.items():
                if not self._is_valid_data(theme_list):
                    continue
                
                try:
                    theme_category, _ = ThemeCategory.objects.get_or_create(name=category_name.strip())
                    for theme_name in theme_list:
                        if self._is_valid_data(theme_name):
                            theme, _ = Theme.objects.get_or_create(
                                name=theme_name.strip(),
                                category=theme_category
                            )
                            doc.themes.add(theme)
                except Exception as e:
                    self.stderr.write(f"[Themes] Error: {e}")

        # Actors
        actors_data = data.get('actors', {}) or {}
        if self._is_valid_data(actors_data):
            for category_name, actor_list in actors_data.items():
                if not self._is_valid_data(actor_list):
                    continue
                
                try:
                    actor_category, _ = ActorCategory.objects.get_or_create(name=category_name.strip())
                    for actor_name in actor_list:
                        if self._is_valid_data(actor_name):
                            actor, _ = Actor.objects.get_or_create(
                                name=actor_name.strip(),
                                category=actor_category
                            )
                            doc.actors.add(actor)
                except Exception as e:
                    self.stderr.write(f"[Actors] Error: {e}")

    def _attach_basic_relations(self, doc, data):
        """Attach basic many-to-many relationships"""
        extra = data.get('extra_data', {}) or {}

        # Agreement Types
        agreement_types = extra.get('agreement_type', []) or []
        if self._is_valid_data(agreement_types):
            for agr_type in agreement_types:
                if self._is_valid_data(agr_type):
                    try:
                        at, _ = AgreementType.objects.get_or_create(name=agr_type.strip())
                        doc.agreement_types.add(at)
                    except Exception as e:
                        self.stderr.write(f"[AgreementType] Error: {e}")

        # Beneficiary Groups (now with categories like themes/actors)
        beneficiary_groups = extra.get('beneficiary_group', [])  # misses raw list
        if self._is_valid_data(beneficiary_groups):
            for bg_data in beneficiary_groups:
                if not isinstance(bg_data, dict):
                    continue
                
                category_name = bg_data.get('category')
                label_name = bg_data.get('label')
                
                if self._is_valid_data(category_name) and self._is_valid_data(label_name):
                    try:
                        # Create or get the beneficiary category
                        beneficiary_category, _ = BeneficiaryCategory.objects.get_or_create(
                            name=category_name.strip()
                        )
                        
                        # Create or get the beneficiary group
                        beneficiary_group, _ = BeneficiaryGroup.objects.get_or_create(
                            label=label_name.strip(),
                            category=beneficiary_category
                        )
                        
                        doc.beneficiary_groups.add(beneficiary_group)
                    except Exception as e:
                        self.stderr.write(f"[BeneficiaryGroup] Error: {e}")

        # Countries
        country_list = extra.get('country_list_iso', []) or []
        if self._is_valid_data(country_list):
            for iso in country_list:
                if self._is_valid_data(iso):
                    try:
                        country, _ = Country.objects.get_or_create(iso=iso.strip().upper())
                        doc.countries.add(country)
                    except Exception as e:
                        self.stderr.write(f"[Countries] Error: {e}")

        # SDG Alignments
        sdg_alignments = extra.get('sdg_alignment', []) or []
        if self._is_valid_data(sdg_alignments):
            for sdg_name in sdg_alignments:
                if self._is_valid_data(sdg_name):
                    try:
                        goal, _ = SdgGoal.objects.get_or_create(name=sdg_name.strip())
                        doc.sdg_alignments.add(goal)
                    except Exception as e:
                        self.stderr.write(f"[SDG Alignments] Error: {e}")

    def _attach_text_relations(self, doc, data):
        """Attach text-based relations (characteristics, practical applications)"""
        # Characteristics
        characteristics = data.get('characteristics', []) or []
        if self._is_valid_data(characteristics):
            for text in characteristics:
                if self._is_valid_data(text):
                    try:
                        Characteristic.objects.get_or_create(
                            document=doc,
                            text=text.strip()
                        )
                    except Exception as e:
                        self.stderr.write(f"[Characteristics] Error: {e}")

        # Practical Applications
        practical_apps = data.get('practical_applications', []) or []
        if self._is_valid_data(practical_apps):
            for text in practical_apps:
                if self._is_valid_data(text):
                    try:
                        PracticalApplication.objects.get_or_create(
                            document=doc,
                            text=text.strip()
                        )
                    except Exception as e:
                        self.stderr.write(f"[PracticalApplications] Error: {e}")

    def _attach_commitments(self, doc, data):
        """Attach commitments with string comparison to avoid duplicates"""
        extra = data.get('extra_data', {}) or {}
        
        # Track processed commitments by first 50 characters to avoid duplicates
        processed_commitments = set()

        # Simple commitments (from main level)
        commitments = data.get('commitments', []) or []
        if self._is_valid_data(commitments):
            for text in commitments:
                if self._is_valid_data(text):
                    text_clean = text.strip()
                    text_key = text_clean[:50].lower()
                    
                    if text_key not in processed_commitments:
                        try:
                            Commitment.objects.get_or_create(
                                document=doc,
                                text=text_clean,
                                defaults={'commitment_class': ''}
                            )
                            processed_commitments.add(text_key)
                        except Exception as e:
                            self.stderr.write(f"[Simple Commitments] Error: {e}")

        # Detailed commitments (from extra_data)
        commitment_details = extra.get('commitment_details', []) or []
        if self._is_valid_data(commitment_details):
            for detail in commitment_details:
                if not isinstance(detail, dict):
                    continue
                
                text = detail.get('text')
                commitment_class = detail.get('commitment_class', '')
                
                if self._is_valid_data(text):
                    text_clean = text.strip()
                    text_key = text_clean[:50].lower()
                    
                    if text_key not in processed_commitments:
                        try:
                            Commitment.objects.get_or_create(
                                document=doc,
                                text=text_clean,
                                defaults={
                                    'commitment_class': commitment_class.strip() if self._is_valid_data(commitment_class) else ''
                                }
                            )
                            processed_commitments.add(text_key)
                        except Exception as e:
                            self.stderr.write(f"[Detailed Commitments] Error: {e}")

    def _attach_kpis(self, doc, data):
        """Attach KPIs from kpi_list"""
        extra = data.get('extra_data', {}) or {}
        kpi_list = extra.get('kpi_list', [])  # misses root‐level
        
        if not self._is_valid_data(kpi_list):
            return

        for kpi_data in kpi_list:
            if not isinstance(kpi_data, dict):
                continue

            kpi_text = kpi_data.get('kpi_text')
            if not self._is_valid_data(kpi_text):
                continue

            try:
                KPI.objects.get_or_create(
                    document=doc,
                    kpi_text=kpi_text.strip(),
                    defaults={
                        'kpi_type': kpi_data.get('kpi_type', '') if self._is_valid_data(kpi_data.get('kpi_type')) else '',
                        'metric_name': kpi_data.get('metric_name', '') if self._is_valid_data(kpi_data.get('metric_name')) else '',
                        'target_value': kpi_data.get('target_value') if self._is_valid_data(kpi_data.get('target_value')) else None,
                        'target_description': kpi_data.get('target_description', '') if self._is_valid_data(kpi_data.get('target_description')) else '',
                        'unit': kpi_data.get('unit', '') if self._is_valid_data(kpi_data.get('unit')) else '',
                        'baseline_value': kpi_data.get('baseline_value') if self._is_valid_data(kpi_data.get('baseline_value')) else None,
                        'timeframe': kpi_data.get('timeframe', '') if self._is_valid_data(kpi_data.get('timeframe')) else '',
                        'measurement_method': kpi_data.get('measurement_method', '') if self._is_valid_data(kpi_data.get('measurement_method')) else '',
                        'responsible_entity': kpi_data.get('responsible_entity', '') if self._is_valid_data(kpi_data.get('responsible_entity')) else '',
                        'sector': kpi_data.get('sector', '') if self._is_valid_data(kpi_data.get('sector')) else '',
                    }
                )
            except Exception as e:
                self.stderr.write(f"[KPIs] Error: {e}")

        # Beneficiary Groups (now with categories like themes/actors)
        beneficiary_groups = extra.get('beneficiary_group', [])  # misses raw list
        if self._is_valid_data(beneficiary_groups):
            for bg_data in beneficiary_groups:
                if not isinstance(bg_data, dict):
                    continue
                
                category_name = bg_data.get('category')
                label_name = bg_data.get('label')
                
                if self._is_valid_data(category_name) and self._is_valid_data(label_name):
                    try:
                        # Create or get the beneficiary category
                        beneficiary_category, _ = BeneficiaryCategory.objects.get_or_create(
                            name=category_name.strip()
                        )
                        
                        # Create or get the beneficiary group
                        beneficiary_group, _ = BeneficiaryGroup.objects.get_or_create(
                            label=label_name.strip(),
                            category=beneficiary_category
                        )
                        
                        doc.beneficiary_groups.add(beneficiary_group)
                    except Exception as e:
                        self.stderr.write(f"[BeneficiaryGroup] Error: {e}")

        # Countries
        country_list = extra.get('country_list_iso', []) or []
        if self._is_valid_data(country_list):
            for iso in country_list:
                if self._is_valid_data(iso):
                    try:
                        country, _ = Country.objects.get_or_create(iso=iso.strip().upper())
                        doc.countries.add(country)
                    except Exception as e:
                        self.stderr.write(f"[Countries] Error: {e}")

        # SDG Alignments
        sdg_alignments = extra.get('sdg_alignment', []) or []
        if self._is_valid_data(sdg_alignments):
            for sdg_name in sdg_alignments:
                if self._is_valid_data(sdg_name):
                    try:
                        goal, _ = SdgGoal.objects.get_or_create(name=sdg_name.strip())
                        doc.sdg_alignments.add(goal)
                    except Exception as e:
                        self.stderr.write(f"[SDG Alignments] Error: {e}")