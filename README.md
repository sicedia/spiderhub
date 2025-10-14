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
- pip (Python package manager)
- Git
- PostgreSQL

## 🛠️ Installation

### Development Setup

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
   python manage.py makemigrations
   python manage.py migrate
   
   # Create superuser
   python manage.py createsuperuser
   
   # Load initial data (optional)
   python manage.py load_iso_countries
   python manage.py load_cities
   python manage.py seed
   ```

6. **Run development server**
   ```bash
   python manage.py runserver
   ```

   Access the application at [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## 🔐 Admin Access

The default admin user credentials are:

- **Username**: `admin`
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



## 🗄️ Database Management

### Postgresql for development purposes
```bash
docker compose -f postgresdev-docker-compose.yml up
```

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


## 📚 Technical Documentation

### Development Guides
- **[Cache Busting Guide](docs/CACHE_BUSTING.md)** - Sistema de cache busting para archivos estáticos y ES6 modules
- **[Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Lista completa para deployments seguros
- **[Logger Migration Guide](docs/LOGGER_MIGRATION_GUIDE.md)** - Migración al sistema de logging centralizado
- **[EventBus Migration Guide](docs/EVENTBUS_MIGRATION_GUIDE.md)** - Migración al sistema de eventos

### Testing Tools
- **Cache Busting Test**: Accede a `/static/cache-test.html` en desarrollo para verificar headers HTTP
- **Logging Test**: Accede a `/static/test-logging.html` para probar el sistema de logging

### Important Notes
⚠️ **Before deploying**: Always check the [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md), especially:
- Increment `STATIC_VERSION` if you modified JavaScript files
- Test in incognito mode before deploying
- Verify that dark mode works correctly in all pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
6. **Important**: If you modified JavaScript files, increment `STATIC_VERSION` and mention it in the PR


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