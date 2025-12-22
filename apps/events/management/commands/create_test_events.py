"""
Management command to create test/fake events for UI testing.

Run with:
    python manage.py create_test_events              # Create 10 test events
    python manage.py create_test_events --count 20   # Create 20 test events
    python manage.py create_test_events --published  # Create only published events
    python manage.py create_test_events --clear      # Clear existing test events first
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
import random

from apps.events.models import (
    Event, EventLink, Organization, EventTheme, EventActor, EventSDG
)
from apps.documents.models import Country, City, Theme, Actor, SDG, BeneficiaryGroup
from django.contrib.auth.models import User


# Sample event data for testing
EVENT_TITLES = [
    "EU-LAC Digital Transformation Summit 2025",
    "Regional Conference on Digital Innovation",
    "Bilateral Dialogue on Cybersecurity",
    "Multilateral Workshop on Data Governance",
    "EU-LAC Tech Forum: AI and Digital Economy",
    "Digital Inclusion Summit",
    "Cross-Border Digital Cooperation Meeting",
    "Innovation Hub Launch Event",
    "Digital Policy Roundtable",
    "EU-LAC Startup Ecosystem Forum",
    "Cybersecurity Best Practices Workshop",
    "Data Privacy and Protection Conference",
    "Digital Skills Development Summit",
    "E-Government Transformation Forum",
    "Smart Cities Initiative Launch",
]

EVENT_DESCRIPTIONS = [
    "A comprehensive summit bringing together leaders from the European Union and Latin America to discuss digital transformation strategies and opportunities for collaboration.",
    "This conference focuses on fostering innovation and digital cooperation between EU and LAC countries through knowledge sharing and partnership building.",
    "An important dialogue addressing cybersecurity challenges and opportunities for joint initiatives between European and Latin American nations.",
    "A workshop dedicated to exploring data governance frameworks and best practices for cross-border data management.",
    "A forum exploring the intersection of artificial intelligence and digital economy, with focus on EU-LAC collaboration opportunities.",
    "A summit dedicated to promoting digital inclusion and ensuring equitable access to digital technologies across all communities.",
    "A meeting to strengthen cross-border digital cooperation and establish frameworks for joint initiatives.",
    "Launch event for a new innovation hub designed to foster collaboration between EU and LAC tech ecosystems.",
    "A roundtable discussion on digital policy frameworks and regulatory approaches for digital transformation.",
    "A forum connecting startup ecosystems from Europe and Latin America to promote entrepreneurship and innovation.",
    "Workshop sharing best practices in cybersecurity and exploring collaborative approaches to digital security.",
    "Conference addressing data privacy and protection challenges in the context of EU-LAC digital cooperation.",
    "Summit focused on developing digital skills and competencies across different sectors and communities.",
    "Forum exploring e-government transformation and digital public services in EU-LAC context.",
    "Launch event for a smart cities initiative promoting sustainable urban development through digital technologies.",
]

ORGANIZATION_NAMES = [
    "EU-LAC Digital Partnership",
    "European Commission - Digital Services",
    "LAC Digital Innovation Network",
    "SPIDER Network",
    "EU-LAC Tech Alliance",
    "Digital Transformation Council",
    "Regional Digital Cooperation Initiative",
]

LINK_TYPES = ['website', 'registration', 'agenda', 'stream', 'other']


class Command(BaseCommand):
    help = "Create test/fake events for UI testing purposes."

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='Number of test events to create (default: 10)'
        )
        parser.add_argument(
            '--published',
            action='store_true',
            help='Create only published events (is_published=True)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing test events before creating new ones'
        )
        parser.add_argument(
            '--upcoming',
            action='store_true',
            help='Create only upcoming events (start_at in the future)'
        )

    def handle(self, *args, **options):
        count = options['count']
        published_only = options['published']
        clear_first = options['clear']
        upcoming_only = options['upcoming']

        self.stdout.write(self.style.SUCCESS(f"Creating {count} test events..."))

        # Clear existing test events if requested
        if clear_first:
            self.stdout.write(self.style.WARNING("Clearing existing test events..."))
            Event.objects.filter(title__startswith="EU-LAC").delete()
            self.stdout.write(self.style.SUCCESS("Cleared existing test events."))

        # Get or create test data
        countries = self._get_or_create_countries()
        cities = self._get_or_create_cities(countries)
        organizations = self._get_or_create_organizations()
        themes = self._get_themes()
        actors = self._get_actors()
        sdgs = self._get_sdgs()
        beneficiary_groups = self._get_beneficiary_groups()
        user = self._get_or_create_test_user()

        # Create events
        created = 0
        with transaction.atomic():
            for i in range(count):
                event = self._create_test_event(
                    index=i,
                    countries=countries,
                    cities=cities,
                    organizations=organizations,
                    themes=themes,
                    actors=actors,
                    sdgs=sdgs,
                    beneficiary_groups=beneficiary_groups,
                    user=user,
                    published_only=published_only,
                    upcoming_only=upcoming_only
                )
                if event:
                    created += 1
                    self.stdout.write(
                        self.style.SUCCESS(f"  [OK] Created: {event.title}")
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSuccessfully created {created} test event(s)."
            )
        )

    def _get_or_create_countries(self):
        """Get or create test countries"""
        countries = []
        country_data = [
            ('ECU', 'Ecuador'),
            ('BRA', 'Brazil'),
            ('ARG', 'Argentina'),
            ('COL', 'Colombia'),
            ('MEX', 'Mexico'),
            ('ESP', 'Spain'),
            ('FRA', 'France'),
            ('DEU', 'Germany'),
        ]
        
        for iso3, name in country_data:
            country, created = Country.objects.get_or_create(
                iso3=iso3,
                defaults={'name': name, 'iso2': iso3[:2]}
            )
            countries.append(country)
        
        return countries

    def _get_or_create_cities(self, countries):
        """Get or create test cities"""
        cities = []
        city_data = [
            ('Quito', 'ECU'),
            ('Brasília', 'BRA'),
            ('Buenos Aires', 'ARG'),
            ('Bogotá', 'COL'),
            ('Mexico City', 'MEX'),
            ('Madrid', 'ESP'),
            ('Paris', 'FRA'),
            ('Berlin', 'DEU'),
        ]
        
        for city_name, country_iso3 in city_data:
            country = next((c for c in countries if c.iso3 == country_iso3), None)
            if country:
                # Try to get existing city by name and country
                try:
                    city = City.objects.get(name=city_name, country=country)
                except City.DoesNotExist:
                    # Create if doesn't exist
                    city = City.objects.create(name=city_name, country=country)
                except City.MultipleObjectsReturned:
                    # If multiple exist, just take the first one with matching country
                    city = City.objects.filter(name=city_name, country=country).first()
                    if not city:
                        # If none match country, just take first one
                        city = City.objects.filter(name=city_name).first()
                
                if city:
                    cities.append(city)
        
        return cities

    def _get_or_create_organizations(self):
        """Get or create test organizations"""
        organizations = []
        for org_name in ORGANIZATION_NAMES:
            org, created = Organization.objects.get_or_create(
                name=org_name,
                defaults={
                    'description': f'Test organization: {org_name}',
                    'is_verified': True
                }
            )
            organizations.append(org)
        
        return organizations

    def _get_themes(self):
        """Get existing themes from database"""
        themes = list(Theme.objects.all()[:10])
        if not themes:
            # Create a few test themes if none exist
            theme_names = [
                'Digital Transformation',
                'Cybersecurity',
                'Data Governance',
                'Digital Innovation',
                'E-Government'
            ]
            for name in theme_names:
                theme, _ = Theme.objects.get_or_create(
                    label=name,
                    defaults={'description': f'Test theme: {name}'}
                )
                themes.append(theme)
        return themes

    def _get_actors(self):
        """Get existing actors from database"""
        actors = list(Actor.objects.all()[:10])
        if not actors:
            # Create a few test actors if none exist
            actor_names = [
                'European Commission',
                'LAC Governments',
                'Tech Companies',
                'Research Institutions',
                'Civil Society'
            ]
            for name in actor_names:
                actor, _ = Actor.objects.get_or_create(
                    label=name,
                    defaults={'description': f'Test actor: {name}'}
                )
                actors.append(actor)
        return actors

    def _get_sdgs(self):
        """Get existing SDGs from database"""
        sdgs = list(SDG.objects.all()[:5])
        return sdgs

    def _get_beneficiary_groups(self):
        """Get existing beneficiary groups from database"""
        beneficiary_groups = list(BeneficiaryGroup.objects.all()[:5])
        return beneficiary_groups

    def _get_or_create_test_user(self):
        """Get or create a test user for created_by"""
        user, created = User.objects.get_or_create(
            username='test_event_creator',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        return user

    def _create_test_event(
        self,
        index,
        countries,
        cities,
        organizations,
        themes,
        actors,
        sdgs,
        beneficiary_groups,
        user,
        published_only,
        upcoming_only
    ):
        """Create a single test event"""
        # Determine dates
        base_date = timezone.now()
        if upcoming_only:
            # All events in the future
            days_offset = random.randint(1, 90)
        else:
            # Mix of past, present, and future
            days_offset = random.randint(-60, 90)
        
        start_at = base_date + timedelta(days=days_offset)
        end_at = start_at + timedelta(days=random.randint(1, 3))
        
        # Determine if published
        is_published = published_only or random.choice([True, True, False])  # 2/3 chance
        
        # Select random data
        country = random.choice(countries) if countries else None
        city = random.choice([c for c in cities if not country or c.country == country]) if cities else None
        organization = random.choice(organizations) if organizations else None
        event_format = random.choice(['presencial', 'virtual', 'hybrid', None])
        
        # Select title
        title_index = index % len(EVENT_TITLES)
        title = EVENT_TITLES[title_index]
        description = EVENT_DESCRIPTIONS[title_index]
        
        # Create event
        event = Event.objects.create(
            title=title,
            description=description,
            start_at=start_at,
            end_at=end_at,
            event_format=event_format,
            country=country,
            city=city,
            organization=organization,
            created_by=user,
            is_published=is_published,
            ai_check_status=True,
            human_check_status=is_published,
        )
        
        # Add taxonomies
        if themes:
            selected_themes = random.sample(themes, min(random.randint(1, 3), len(themes)))
            for theme in selected_themes:
                EventTheme.objects.get_or_create(
                    event=event,
                    theme=theme,
                    defaults={
                        'is_top': random.choice([True, False]),
                        'relevance_score': random.uniform(0.5, 1.0)
                    }
                )
        
        if actors:
            selected_actors = random.sample(actors, min(random.randint(1, 3), len(actors)))
            for actor in selected_actors:
                EventActor.objects.get_or_create(
                    event=event,
                    actor=actor,
                    defaults={
                        'is_top': random.choice([True, False]),
                        'relevance_score': random.uniform(0.5, 1.0)
                    }
                )
        
        if sdgs:
            selected_sdgs = random.sample(sdgs, min(random.randint(1, 2), len(sdgs)))
            for sdg in selected_sdgs:
                EventSDG.objects.get_or_create(
                    event=event,
                    sdg=sdg,
                    defaults={
                        'relevance_score': random.uniform(0.5, 1.0)
                    }
                )
        
        if beneficiary_groups:
            selected_bgs = random.sample(beneficiary_groups, min(random.randint(1, 2), len(beneficiary_groups)))
            event.beneficiary_groups.set(selected_bgs)
        
        # Add some links (50% chance)
        if random.choice([True, False]):
            link_types = random.sample(LINK_TYPES, random.randint(1, 3))
            for link_type in link_types:
                EventLink.objects.create(
                    event=event,
                    link_type=link_type,
                    url=f'https://example.com/{link_type}/{event.id}',
                    label=f'{link_type.capitalize()} Link'
                )
        
        return event

