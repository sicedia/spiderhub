# SPIDERHUB

## About
SPIDERHUB is a Django-based web application for analyzing and visualizing documents and agreements that drive digital transformation between the European Union and Latin America. It automates metadata extraction, maps relationships between entities, and offers advanced search and filtering by location, date, actors, themes.

## Relation with This Project
This repository implements SPIDERHUB’s core functionality:
- apps/ — Django apps (`core`, `documents`, `search`, `admin_panel`)
- config/ — project settings and URL/WGI/ASGI definitions
- data/ — seed data Markdown files
- static/, templates/ — UI assets and reusable components
- manage.py — Django CLI entry point


## 🚀 Features

- **Document Analysis**: AI-powered extraction of metadata from PDF documents
- **Intelligent Search**: Advanced filtering by location, date, actors, themes, and confidence levels
- **Relationship Mapping**: Visualization of connections between documents and entities
- **Admin Panel**: Comprehensive document management and metadata editing
- **Multilingual Support**: Built with internationalization in mind
- **Responsive Design**: Modern UI optimized for all devices

## 📋 Prerequisites

- Python 3.12+ 
- pip (Python package manager)
- Git
- PostgreSQL

## 🛠️ Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd spider-web
   ```

2. **Create and activate virtual environment**
   ```bash
   # Create virtual environment
   python -m venv pyspider
   
   # Activate virtual environment
   # On Windows
   pyspider\Scripts\activate
   
   # On macOS/Linux
   source pyspider/bin/activate
   ```

3. **Install dependencies**
   ```bash
   # Upgrade pip
   python -m pip install --upgrade pip
   
   # Install development dependencies
   pip install -r requirements/development.txt
   ```

4. **Environment configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your configuration for development
   # Set DEBUG=True for development
   # Set SECURE_SSL_REDIRECT=False
   # Set SECURE_SSL_REDIRECT=False
   # Set SESSION_COOKIE_SECURE=False
   # Set CSRF_COOKIE_SECURE=False
   ```

5. **Database setup**
   ```bash
   # Run migrations
   python manage.py makemigrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   
   # Load initial data (optional)
   python manage.py seed
   ```

6. **Run development server**
   ```bash
   python manage.py runserver
   ```

   Access the application at [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## 📁 Project Structure

```
spider-web/
├── apps/                           # Django applications
│   ├── __init__.py
│   ├── admin_panel/               # Administration interface
│   │   ├── static/               # Admin-specific assets
│   │   ├── templates/            # Admin templates
│   │   ├── views.py              # Admin views
│   │   └── urls.py               # Admin URL patterns
│   ├── core/                     # Core application logic
│   │   ├── static/               # Core static files
│   │   ├── templates/            # Core templates
│   │   ├── management/           # Custom management commands
│   │   ├── models.py             # Core data models
│   │   ├── views.py              # Core views
│   │   └── urls.py               # Core URL patterns
│   ├── documents/                # Document management
│   │   ├── data/                 # Seed data files
│   │   ├── models.py             # Document models
│   │   ├── serializers.py        # API serializers
│   │   └── views.py              # Document views
│   └── search/                   # Search functionality
│       ├── filters.py            # Search filters
│       ├── indexes.py            # Search indexes
│       └── views.py              # Search views
├── config/                       # Django project settings
│   ├── __init__.py
│   ├── settings/                 # Environment-specific settings
│   │   ├── __init__.py
│   │   ├── base.py              # Base settings
│   │   ├── development.py       # Development settings
│   │   ├── production.py        # Production settings
│   │   └── testing.py           # Test settings
│   ├── asgi.py                  # ASGI configuration
│   ├── urls.py                  # Root URL configuration
│   └── wsgi.py                  # WSGI configuration
├── data/                        # Document storage
├── media/                       # User-uploaded files
├── static/                      # Collected static files
├── staticfiles/                 # Static files for deployment
├── templates/                   # Global templates
│   └── includes/                # Reusable template components
├── requirements/                # Dependencies
│   ├── base.txt                # Core dependencies
│   ├── development.txt         # Development dependencies
│   └── production.txt          # Production dependencies
├── scripts/                    # Utility scripts
├── docker/                     # Docker configuration
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── docker-compose.yml         # Docker Compose configuration
├── entrypoint.sh              # Initializing the application
├── Dockerfile                 # Docker image definition
├── manage.py                  # Django management script
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Django Settings
DJANGO_SECRET_KEY=django-insecure-4*&8f
DJANGO_DEBUG=True
DJANGO_SETTINGS_MODULE=config.settings.development
ALLOWED_HOSTS=spiderhub.cedia.edu.ec,localhost

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=spider_user
POSTGRES_PASSWORD=spider_password
POSTGRES_DB=spider

SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False

```

## 🗄️ Database Management

### Migrations
```bash
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

### Data Seeding
```bash
# Load initial documents (default: truncate and load new data)
python manage.py seed

# Preserve existing data and add new only
python manage.py seed --no-truncate

# Dry run (preview changes without applying)
python manage.py seed --dry-run

# Load limited number of documents
python manage.py seed --limit 10
```

## Docker Deployment

## Run image in local
```bash
docker compose up -d --build
# Open your browser in https://localhost/
```

### Docker Build image
```bash
# Semantic versioning (recommended)
docker build -t spider:1.0.0 -t spider:latest .

```
## Docker Run Image
```bash
docker run -d -p 8000:8000 --env-file .env.production spider:latest
```
## Architecture
1. Install Plant UML Extension
2. To preview in VS Code (with PlantUML extension) press Alt + D or run in the terminal:
```bash

plantuml -preview architecture.puml
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality

```bash
# Run linting
flake8 .

# Format code
black .

# Sort imports
isort .

# Type checking
mypy .
```

## 📝 License

This project is licensed under the MIT License - see the [MIT License](https://opensource.org/license/mit) file for details.



## 📞 Contact

- **Project Maintainer**: Felipe Mendieta
- **Email**: felipe.mendieta@cedia.org.ec
- **Organization**: CEDIA

## 🙏 Acknowledgments

- European Union and Latin America digital transformation initiative
- [Spider Network](https://spidernetwork.org/)
- Contributors and collaborators
- Open source community
- [CEDIA](https://cedia.edu.ec/)
---

For more detailed information about specific components, please refer to the documentation in each app's directory.