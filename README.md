# SPIDERHUB

## About
SPIDERHUB is a Django-based web application for analyzing and visualizing documents and agreements that drive digital transformation between the European Union and Latin America. Offers advanced search and filtering by location, date, actors, themes.

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
- [Poetry](https://python-poetry.org/) (recomendado) o pip
- Git
- PostgreSQL

> **Convención**: En esta documentación los comandos de Django se muestran con `poetry run` (ej.: `poetry run python manage.py ...`). Si usas un venv tradicional, activa el entorno y ejecuta solo `python manage.py ...`.

## 🛠️ Installation

### Opción A: Con Poetry (recomendado)

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/sicedia/spiderhub_web
   cd spiderhub_web
   ```

2. **Configurar el entorno con Poetry**
   ```bash
   # Usar Python 3.12
   poetry env use 3.12

   # Instalar dependencias (incluye las de desarrollo)
   poetry install
   ```

3. **Variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env y configurar DJANGO_SECRET_KEY, base de datos, etc.
   ```

4. **Ejecutar el proyecto**
   ```bash
   # Servidor de desarrollo
   poetry run python manage.py runserver

   # O activar el shell de Poetry y ejecutar comandos
   poetry shell
   python manage.py runserver
   ```

   Comandos útiles con Poetry:
   - `poetry run python manage.py migrate`
   - `poetry run python manage.py createsuperuser`
   - `poetry run pytest`

### Opción B: Development Setup (venv + pip)

1. **Clone the repository**
   ```bash
   git clone https://github.com/sicedia/spiderhub_web
   cd spider_web
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
   ```


   **Init dev database**
   ```bash
   # Init your docker in your desktop and after:
   docker compose -f postgresdev-docker-compose.yml up -d
   ```
5. **Database setup**
   ```bash
   # Run migrations
   poetry run python manage.py makemigrations
   poetry run python manage.py migrate
   
   # Create superuser
   poetry run python manage.py createsuperuser
   
   # Load initial data (optional)
   poetry run python manage.py load_iso_countries
   poetry run python manage.py load_cities
   poetry run python manage.py seed
   ```

6. **Run development server**
   ```bash
   poetry run python manage.py runserver
   ```

   Access the application at [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## 🔐 Admin Access

The default admin user credentials are:

- **Username**: `admin`
- **email**: `admin@example.org.ec`
- **Password**: `nb7wJ$18Ssia0`

Access the admin panel at [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

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
├── pyproject.toml              # Poetry: dependencies and config (recomendado)
├── poetry.lock                 # Poetry: locked versions
├── requirements/               # Dependencies (pip, Docker)
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
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



## 🗄️ Database Management

### Postgresql for development purposes
```bash
docker compose -f postgresdev-docker-compose.yml up
```

### Migrations
```bash
# Create new migrations
poetry run python manage.py makemigrations

# Apply migrations
poetry run python manage.py migrate

# Show migration status
poetry run python manage.py showmigrations
```

### Data Seeding
```bash
# Load initial documents (default: truncate and load new data)
poetry run python manage.py seed

# Preserve existing data and add new only
poetry run python manage.py seed --no-truncate

# Dry run (preview changes without applying)
poetry run python manage.py seed --dry-run

# Load limited number of documents
poetry run python manage.py seed --limit 10
```

## 📊 SDG Relevance Analysis & Logging

### SDG Relevance Ingestion

The application includes AI-powered SDG (Sustainable Development Goals) relevance analysis for documents. This feature calculates relevance scores and justifications for document-SDG relationships using Large Language Models.

#### Quick Start

**Using convenience scripts (recommended):**

```bash
# Linux/macOS
./scripts/run-sdg-ingestion.sh --all

# Windows PowerShell
.\scripts\run-sdg-ingestion.ps1 --all
```

**Local (con Poetry):**

```bash
# Process all documents needing SDG scores
poetry run python manage.py ingest_sdg_relevance --all

# Process specific document
poetry run python manage.py ingest_sdg_relevance --doc 42

# Process batch of recent documents
poetry run python manage.py ingest_sdg_relevance --batch 10

# Force recalculation of existing scores
poetry run python manage.py ingest_sdg_relevance --all --force
```

**Docker (dentro del contenedor):**

```bash
docker exec -it spider_web python manage.py ingest_sdg_relevance --all
docker exec -it spider_web python manage.py ingest_sdg_relevance --doc 42
docker exec -it spider_web python manage.py ingest_sdg_relevance --batch 10
docker exec -it spider_web python manage.py ingest_sdg_relevance --all --force
```


```bash
# Process all documents (will call LLM for each document × 9 indicators)
poetry run python manage.py ingest_qualitative_indicators --all

# Or start with one document to test
poetry run python manage.py ingest_qualitative_indicators --doc 42

# Re-seed the catalog (safe to re-run at any time)
poetry run python manage.py seed_qualitative_indicators
```

**These commands allow you to analyze all (or individual) documents against the 9 qualitative indicators. The management commands use LLM-powered classification and will update or create indicator relationships for each document.**





**Using scripts inside container:**

```bash
# Execute scripts directly inside the container
docker exec -it spider_web /app/scripts/run-sdg-ingestion.sh --all
docker exec -it spider_web /app/scripts/view-sdg-logs.sh
docker exec -it spider_web /app/scripts/view-failed-scores.sh

# Test the setup
docker exec -it spider_web /app/scripts/test-setup.sh
```

#### Command Options

- `--all`: Process all documents that need SDG relevance scores
- `--batch N`: Process N most recent documents that need processing
- `--doc ID`: Process a specific document by ID
- `--force`: Recalculate scores even if they already exist

### Logging & Monitoring

The application provides comprehensive logging for SDG processing and general application monitoring.

#### Accessing Logs

**Using convenience scripts:**

```bash
# Linux/macOS
./scripts/view-sdg-logs.sh          # View SDG processing logs in real-time
./scripts/view-failed-scores.sh     # View failed SDG scores
./scripts/copy-logs.sh              # Copy logs to host for analysis

# Windows PowerShell
.\scripts\view-sdg-logs.ps1         # View SDG processing logs in real-time
.\scripts\view-failed-scores.ps1    # View failed SDG scores
.\scripts\copy-logs.ps1             # Copy logs to host for analysis
```

**Direct Docker commands:**

```bash
# View SDG processing logs
docker exec -it spider_web cat /app/logs/sdg_ingestion.log

# View failed SDG scores
docker exec -it spider_web cat /app/logs/failed_sdg_scores.log

# Monitor logs in real-time
docker exec -it spider_web tail -f /app/logs/sdg_ingestion.log

# Copy logs to host
docker cp spider_web:/app/logs/sdg_ingestion.log ./sdg_ingestion.log
docker cp spider_web:/app/logs/failed_sdg_scores.log ./failed_sdg_scores.log
```

**Using scripts inside container:**

```bash
# Execute scripts directly inside the container
docker exec -it spider_web /app/scripts/view-sdg-logs.sh
docker exec -it spider_web /app/scripts/view-failed-scores.sh
docker exec -it spider_web /app/scripts/copy-logs.sh

# Test the setup
docker exec -it spider_web /app/scripts/test-setup.sh
```

#### Log Files

- **`sdg_ingestion.log`**: General SDG processing logs with timestamps and detailed information
- **`failed_sdg_scores.log`**: Failed document/SDG pairs in CSV format for easy parsing and retry operations
- **`django.log`**: Django application warnings and errors

#### Troubleshooting

When SDG processing fails, check the logs for specific error messages:

```bash
# View recent failures
docker exec -it spider_web tail -20 /app/logs/failed_sdg_scores.log

# Monitor processing in real-time
docker exec -it spider_web tail -f /app/logs/sdg_ingestion.log
```

Common issues and solutions:
- **Network connectivity**: Check LLM service availability and API credentials
- **Rate limiting**: Reduce batch size or add delays between requests
- **Authentication errors**: Verify API keys in environment configuration

For detailed logging configuration and advanced troubleshooting, see [Logging Docker Setup v1.0](docs/LOGGING_DOCKER_SETUP_v1.0.md).

## Docker Deployment

### Run image in local
```bash
docker compose up -d --build
# Open your browser in https://localhost/
```
### Docker Labeling Strategy

Proper Docker image labeling from the start is an excellent practice that provides clear version control, facilitates deployments, and allows easy rollbacks when necessary.

For SPIDERHUB, we recommend using Semantic Versioning (SemVer), a simple and universal standard that effectively communicates changes. The format is MAJOR.MINOR.PATCH.

- **PATCH**: For backward-compatible bug fixes
- **MINOR**: For backward-compatible new functionality  
- **MAJOR**: For breaking changes (not backward compatible)

#### Pre-release Versions (Testing Phase)

Since you have a testing version and want to show initial results, start with version 0 to indicate the software isn't stable yet. Use pre-release tags like alpha or beta.

**Initial Testing Version (Alpha)**: For early internal testing and initial previews
```bash
# Build and tag alpha version
docker build -t sicedia/spiderhub:0.1.0-beta.2 .

#or without cache
docker build --no-cache -t sicedia/spiderhub:0.1.0-alpha.1 .

docker push sicedia/spiderhub:0.1.0-beta.1

# For bug fixes, increment: 0.1.0-alpha.2, 0.1.0-alpha.3, etc.
```

**Feature-Complete Version (Beta)**: When software has main features and needs broader user testing
```bash

docker build -t sicedia/spiderhub:0.1.0-beta.1 .
docker push sicedia/spiderhub:0.1.0-beta.1
```

**Release Candidate**: When version is considered stable and needs final testing before production
```bash
docker build -t sicedia/spiderhub:0.1.0-rc.1 .
docker push sicedia/spiderhub:0.1.0-rc.1
```

#### Stable Release 🎉

Once your release candidate has been tested and is considered stable, it's time for your first production version!

**First Stable Version**: The first official and stable release
```bash
# Build and tag stable version
docker build -t sicedia/spiderhub:1.0.0 .

# Additional recommended tags for flexible updates
docker tag sicedia/spiderhub:1.0.0 sicedia/spiderhub:1.0
docker tag sicedia/spiderhub:1.0.0 sicedia/spiderhub:1
docker tag sicedia/spiderhub:1.0.0 sicedia/spiderhub:latest

# Push all tags
docker push sicedia/spiderhub:1.0.0
docker push sicedia/spiderhub:1.0
docker push sicedia/spiderhub:1
docker push sicedia/spiderhub:latest
```

This tagging strategy allows users to:
- Pin to specific versions (`1.0.0`)
- Receive patch updates automatically (`1.0`)
- Receive minor updates automatically (`1`)
- Always get the latest stable version (`latest`)

### Docker Hub Images

Pre-built Docker images are available on Docker Hub:
- **Repository**: [sicedia/spiderhub](https://hub.docker.com/r/sicedia/spiderhub/tags)
- **Available Tags**: Various versions including stable releases, release candidates, and pre-release versions (alpha/beta)

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


## 🌍 Internationalization (i18n)

This project currently supports **2 active languages**: English (default) and Spanish.
**Portuguese is ready but temporarily disabled** - see [TRANSLATIONS_v1.0.md](docs/TRANSLATIONS_v1.0.md) to activate it.

### Quick Start for Translations

**When adding a new feature with visible text:**

1. **Use translation tags in templates:**
   ```django
   {% load i18n %}
   <h1>{% trans "My New Title" %}</h1>
   ```

2. **Use translation functions in JavaScript:**
   ```javascript
   import { gettext as _ } from '../../core/i18n/i18n.js';
   const text = _('View Details');
   ```

3. **Extract and compile translations:**
   ```bash
   # Extract strings
   poetry run python manage.py makemessages -l es -l pt --ignore=*.venv
   poetry run python manage.py makemessages -l es -l pt -d djangojs --ignore=*.venv
   
   # Add translations to locale/es/LC_MESSAGES/django.po and locale/pt/LC_MESSAGES/django.po
   
   # Compile
   poetry run python manage.py compilemessages
   
   # Restart server
   poetry run python manage.py runserver 8001
   ```

📖 **Complete guides:**
- **[TRANSLATIONS_v1.0.md](docs/TRANSLATIONS_v1.0.md)** - ⚡ Quick reference (START HERE)
- **[Translation Workflow Guide v1.1](docs/TRANSLATION_WORKFLOW_v1.1.md)** - Detailed step-by-step guide
- **[Translation Quick Reference v1.0](docs/TRANSLATION_QUICK_REFERENCE_v1.0.md)** - Commands cheatsheet

## 📚 Technical Documentation

### 📖 Documentation Index
All documentation files now include **version numbers** for easy identification:
- **[Complete Documentation Index (README_v3.0.md)](docs/README_v3.0.md)** - Full documentation catalog with categories
- **[Document Version Index (DOCUMENT_VERSION_INDEX_v1.0.md)](docs/DOCUMENT_VERSION_INDEX_v1.0.md)** - Chronological version tracking

### 🚀 Deployment & Operations
- **[Deployment Checklist v1.3](docs/DEPLOYMENT_CHECKLIST_v1.3.md)** - Complete checklist for safe deployments
- **[Server / production access (plantilla)](docs/SERVER_PRODUCTION_ACCESS_v1.0.example.md)** — SSH, paths, build, compose (detalles de host: copia local `docs/SERVER_PRODUCTION_ACCESS_v1.0.md`, gitignored)
- **[Static assets & cache](docs/STATIC_ASSETS_AND_CACHE_v1.0.md)** - Manifest hashing, `BUILD_ID`, nginx, VersionCheckService

### 🔒 Security
- **[CSP Implementation v1.1](docs/CSP_IMPLEMENTATION_v1.1.md)** - Content Security Policy implementation
- **[CSP Testing Guide v1.0](docs/CSP_TESTING_GUIDE_v1.0.md)** - Security testing procedures
- **[CSP Quick Start v1.0](docs/SECURITY_CSP_QUICKSTART_v1.0.md)** - Quick security setup

### 🌍 Internationalization (i18n)
- **[TRANSLATIONS v1.0](docs/TRANSLATIONS_v1.0.md)** - ⭐ Quick translations guide (START HERE)
- **[Translation Workflow v1.1](docs/TRANSLATION_WORKFLOW_v1.1.md)** - Complete step-by-step guide
- **[Translation Quick Reference v1.0](docs/TRANSLATION_QUICK_REFERENCE_v1.0.md)** - Commands cheatsheet
- **[Translation Files Reference v1.0](docs/TRANSLATION_FILES_REFERENCE_v1.0.md)** - File structure guide
- **[Install Gettext Windows v1.0](docs/INSTALL_GETTEXT_WINDOWS_v1.0.md)** - Windows setup guide

### 🛠️ Migration & Architecture
- **[Logger Migration Guide v1.0](docs/LOGGER_MIGRATION_GUIDE_v1.0.md)** - Centralized logging system migration
- **[EventBus Migration Guide v1.0](docs/EVENTBUS_MIGRATION_GUIDE_v1.0.md)** - Event system migration
- **[Logging Configuration v1.0](docs/LOGGING_CONFIGURATION_v1.0.md)** - Logging setup
- **[Logging Docker Setup v1.0](docs/LOGGING_DOCKER_SETUP_v1.0.md)** - Docker logging configuration and troubleshooting

### 🎯 AI & SDG Analysis
- **[SDG Relevance Quick Start v1.0](docs/SDG_RELEVANCE_QUICKSTART_v1.0.md)** - ⭐ 5-minute setup guide
- **[SDG Relevance Setup v1.0](docs/SDG_RELEVANCE_SETUP_v1.0.md)** - Complete configuration guide
- **[Proxy LLM Setup v1.1](docs/PROXY_LLM_SETUP_v1.1.md)** - Corporate proxy LLM configuration
- **[SDG Charts v1.0](docs/SDG_CHARTS_STANDARDIZATION_SUMMARY_v1.0.md)** - Visualization standardization

### 🧪 Testing
- **[Jest Setup v1.0](docs/JEST_SETUP_v1.0.md)** - Unit testing configuration

### 📊 Backend
- **[Strategic Cabinet Logic v1.0](docs/STRATEGIC_CABINET_BACKEND_LOGIC_v1.0.md)** - Backend logic documentation

### Testing Tools
- **Cache Busting Test**: Access `/static/cache-test.html` in development to verify HTTP headers
- **Logging Test**: Access `/static/test-logging.html` to test the logging system

### Important Notes
⚠️ **Before deploying**: Always check the [Deployment Checklist v1.3](docs/DEPLOYMENT_CHECKLIST_v1.3.md), especially:
- Increment `STATIC_VERSION` if you modified JavaScript files
- Test in incognito mode before deploying
- Verify that dark mode works correctly in all pages

### Documentation Versioning
All documentation files now include version numbers in their filenames (e.g., `TRANSLATIONS_v1.0.md`). This makes it easy to:
- 📂 Identify document versions at a glance
- 📊 Track documentation evolution
- 🔍 Find the latest version quickly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
6. **Important**: 
   - If you modified JavaScript files, increment `STATIC_VERSION` and mention it in the PR
   - If you create or update documentation, add version numbers to filenames (e.g., `NEW_DOC_v1.0.md`)
   - Update the [Documentation Index](docs/README_v3.0.md) with your new documentation


## 📝 License

This project is licensed under the MIT License - see the [MIT License](https://opensource.org/license/mit) file for details.



## 📞 Contact
- **Project Maintainer Tech Lead**: Felipe Mendieta
- **Email**: felipe.mendieta@cedia.org.ec
- **Project Maintainer**: Veronica Poma
- **Email**:  veronica.poma@cedia.org.ec
- **Project Maintainer**: Jonnathan Sanango
- **Email**: jonnathan.sanango@cedia.org.ec
- **Project Maintainer**: Xavier Espinoza
- **Email**: xavier.espinoza@cedia.org.ec
- **Project Maintainer**: Monica Moscoso
- **Email**: monica.mocoso@cedia.com.e
- **Organization**: CEDIA

## 🙏 Acknowledgments

- European Union and Latin America digital transformation initiative
- [CEDIA](https://cedia.edu.ec/)
- [Spider Network](https://spidernetwork.org/)
- Open source community

---

For more detailed information about specific components, please refer to the documentation in each app's directory.docker push sicedia/spiderhub:0.1.0-alpha.1