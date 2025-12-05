"""
Constants for SPIDERHUB application
Contains metadata dictionaries for taxonomies and descriptive information
"""
from django.utils.translation import gettext_lazy as _


SDG_INFO = {
    'sdg1': {'number': 1, 'name': _('No Poverty'), 'description': _('End poverty in all its forms everywhere')},
    'sdg2': {'number': 2, 'name': _('Zero Hunger'), 'description': _('End hunger, achieve food security and improved nutrition')},
    'sdg3': {'number': 3, 'name': _('Good Health'), 'description': _('Ensure healthy lives and promote well-being for all')},
    'sdg4': {'number': 4, 'name': _('Quality Education'), 'description': _('Ensure inclusive and equitable quality education')},
    'sdg5': {'number': 5, 'name': _('Gender Equality'), 'description': _('Achieve gender equality and empower all women and girls')},
    'sdg6': {'number': 6, 'name': _('Clean Water'), 'description': _('Ensure availability and sustainable management of water')},
    'sdg7': {'number': 7, 'name': _('Affordable Energy'), 'description': _('Ensure access to affordable, reliable, sustainable energy')},
    'sdg8': {'number': 8, 'name': _('Decent Work'), 'description': _('Promote sustained, inclusive economic growth and decent work')},
    'sdg9': {'number': 9, 'name': _('Innovation'), 'description': _('Build resilient infrastructure, promote innovation')},
    'sdg10': {'number': 10, 'name': _('Reduced Inequalities'), 'description': _('Reduce inequality within and among countries')},
    'sdg11': {'number': 11, 'name': _('Sustainable Cities'), 'description': _('Make cities and settlements inclusive, safe, resilient')},
    'sdg12': {'number': 12, 'name': _('Responsible Consumption'), 'description': _('Ensure sustainable consumption and production patterns')},
    'sdg13': {'number': 13, 'name': _('Climate Action'), 'description': _('Take urgent action to combat climate change')},
    'sdg14': {'number': 14, 'name': _('Life Below Water'), 'description': _('Conserve and sustainably use oceans and marine resources')},
    'sdg15': {'number': 15, 'name': _('Life on Land'), 'description': _('Protect, restore and promote sustainable use of ecosystems')},
    'sdg16': {'number': 16, 'name': _('Peace & Justice'), 'description': _('Promote peaceful and inclusive societies for sustainable development')},
    'sdg17': {'number': 17, 'name': _('Partnerships'), 'description': _('Strengthen global partnership for sustainable development')},
}

BINDING_INFO = {
    'legallyBinding': {
        'name': 'Legally Binding',
        'description': 'Agreements with enforceable legal obligations under international law',
        'icon': '⚖️',
        'strength': 'Strong'
    },
    'politicallyBinding': {
        'name': 'Politically Binding',
        'description': 'Commitments based on political will without legal enforcement mechanisms',
        'icon': '🤝',
        'strength': 'Medium'
    },
    'nonBinding': {
        'name': 'Non-Binding',
        'description': 'Voluntary cooperation frameworks without formal obligations',
        'icon': '📋',
        'strength': 'Soft'
    },
    'uncategorised': {
        'name': 'Uncategorised',
        'description': 'Documents without specified binding level',
        'icon': '❓',
        'strength': 'Undefined'
    }
}

THEME_INFO = {
    "Digital Transformation & Strategy": {
        "description": "Strategic frameworks and policies for digital transformation initiatives",
        "icon": "🚀",
        "focus": "Strategy & Planning"
    },
    "Technology & Innovation": {
        "description": "Emerging technologies, R&D, and innovation ecosystems",
        "icon": "💡",
        "focus": "Tech Development"
    },
    "Data & Governance": {
        "description": "Data management, privacy, security, and digital governance frameworks",
        "icon": "🔒",
        "focus": "Governance & Security"
    },
    "Inclusion & Social Development": {
        "description": "Digital inclusion, accessibility, and social impact initiatives",
        "icon": "🤝",
        "focus": "Social Impact"
    },
    "Regional & International Cooperation": {
        "description": "Cross-border collaboration and international digital partnerships",
        "icon": "🌍",
        "focus": "Global Cooperation"
    },
    "Uncategorised": {
        "description": "Themes without specified category",
        "icon": "📋",
        "focus": "Other"
    }
}

ACTOR_INFO = {
    "Political Actors": {
        "description": "Governments, ministries, public institutions, and policy-making bodies",
        "icon": "🏛️",
        "role": "Policy & Governance"
    },
    "Research and Innovation Actors": {
        "description": "Universities, research centers, R&D institutions, and innovation hubs",
        "icon": "🔬",
        "role": "Knowledge & Development"
    },
    "Economic Actors": {
        "description": "Private companies, business associations, SMEs, and economic organizations",
        "icon": "💼",
        "role": "Business & Economy"
    },
    "Civil Society Actors": {
        "description": "NGOs, foundations, community organizations, and advocacy groups",
        "icon": "🤝",
        "role": "Social & Community"
    },
    "Uncategorised": {
        "description": "Actors without specified category",
        "icon": "📋",
        "role": "Other"
    }
}

BENEFICIARY_INFO = {
    "SMEs / Businesses": {
        "description": "Small and medium enterprises driving digital transformation",
        "icon": "🏪",
        "category": "Economic"
    },
    "Start-ups / Innovators": {
        "description": "Innovative startups and entrepreneurial ventures",
        "icon": "🚀",
        "category": "Economic"
    },
    "Large Corporations": {
        "description": "Major companies and multinational enterprises",
        "icon": "🏢",
        "category": "Economic"
    },
    "Researchers & Academia": {
        "description": "University researchers, scientists, and academic institutions",
        "icon": "🎓",
        "category": "Knowledge"
    },
    "Students & Youth": {
        "description": "Young people and students benefiting from digital education",
        "icon": "👨‍🎓",
        "category": "Education"
    },
    "Migrants & Refugees": {
        "description": "Displaced populations accessing digital services",
        "icon": "🌍",
        "category": "Vulnerable"
    },
    "Women & Girls": {
        "description": "Female population empowered through digital inclusion",
        "icon": "👩",
        "category": "Inclusion"
    },
    "Rural & Remote Communities": {
        "description": "Communities in rural and remote areas gaining digital access",
        "icon": "🏘️",
        "category": "Geographic"
    },
    "Indigenous Peoples & Ethnic Groups": {
        "description": "Indigenous communities preserving culture through digital tools",
        "icon": "🪶",
        "category": "Cultural"
    },
    "Persons with Disabilities": {
        "description": "People with disabilities accessing assistive technologies",
        "icon": "♿",
        "category": "Accessibility"
    },
    "General Citizens / Consumers": {
        "description": "General public benefiting from digital services",
        "icon": "👥",
        "category": "General"
    },
    "Public Sector / Governments": {
        "description": "Government entities improving digital public services",
        "icon": "🏛️",
        "category": "Public"
    },
    "Civil Society / NGOs": {
        "description": "Non-governmental organizations leveraging digital tools",
        "icon": "🤝",
        "category": "Social"
    },
    "Farmers & Primary Producers": {
        "description": "Agricultural workers using digital technologies",
        "icon": "🌾",
        "category": "Agriculture"
    },
    "Health Sector": {
        "description": "Healthcare providers and patients using digital health",
        "icon": "🏥",
        "category": "Health"
    },
    "Investors & Financial Actors": {
        "description": "Financial institutions and investors in digital economy",
        "icon": "💰",
        "category": "Finance"
    },
    "Uncategorised": {
        "description": "Beneficiaries without specified category",
        "icon": "📋",
        "category": "Other"
    }
}


def hyphen_to_camel(s: str) -> str:
    """
    Transform 'kebab-case' (e.g. 'non-binding') to 'camelCase' ('nonBinding').
    """
    parts = s.split('-')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])

