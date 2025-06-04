# SPIDERHUB - Digital Transformation Documentation Platform

A Django-based web application for analyzing and visualizing documents and agreements related to digital transformation between the European Union and Latin America.

## 🚀 Features

- **Document Analysis**: AI-powered extraction of metadata from PDF documents
- **Intelligent Search**: Advanced filtering by location, date, actors, themes, and confidence levels
- **Relationship Mapping**: Visualization of connections between documents and entities
- **Admin Panel**: Comprehensive document management and metadata editing
- **Multilingual Support**: Built with internationalization in mind
- **Responsive Design**: Modern UI optimized for all devices

## 📋 Prerequisites

- Python 3.8+ 
- pip (Python package manager)
- Git
- PostgreSQL (for production) or SQLite (for development)

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
   
   # Edit .env file with your configuration
   # Set DEBUG=True for development
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
├── Dockerfile                 # Docker image definition
├── manage.py                  # Django management script
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DATABASE_URL=sqlite:///db.sqlite3  # For development
# DATABASE_URL=postgresql://user:password@localhost:5432/spiderhub  # For production

# Static/Media Files
STATIC_URL=/static/
MEDIA_URL=/media/

# API Keys (if needed)
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
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

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run tests with coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML coverage report

# Run specific app tests
python manage.py test apps.core
python manage.py test apps.documents
```

## 🚀 Deployment

### Production Setup

1. **Server Preparation**
   ```bash
   # Clone repository
   git clone [your-repository-url]
   cd spider-web
   
   # Create production virtual environment
   python -m venv pyspider
   source pyspider/bin/activate  # Linux/macOS
   # pyspider\Scripts\activate   # Windows
   ```

2. **Install Production Dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements/production.txt
   ```

3. **Environment Configuration**
   ```bash
   # Create production .env file
   cp .env.example .env
   
   # Configure production settings
   # Set DEBUG=False
   # Set proper ALLOWED_HOSTS
   # Configure production database
   # Set secure SECRET_KEY
   ```

4. **Database Setup**
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   python manage.py createsuperuser
   ```

5. **Application Server (Gunicorn)**
   ```bash
   # Install Gunicorn
   pip install gunicorn
   
   # Test Gunicorn
   gunicorn config.wsgi:application --bind 0.0.0.0:8000
   ```

6. **Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       client_max_body_size 50M;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       location /static/ {
           alias /path/to/spider-web/staticfiles/;
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       location /media/ {
           alias /path/to/spider-web/media/;
           expires 1y;
           add_header Cache-Control "public";
       }
   }
   ```

7. **Process Management**
   ```bash
   # Create systemd service file
   sudo nano /etc/systemd/system/spiderhub.service
   ```
   
   ```ini
   [Unit]
   Description=SPIDERHUB Django Application
   After=network.target
   
   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/path/to/spider-web
   Environment=PATH=/path/to/spider-web/pyspider/bin
   ExecStart=/path/to/spider-web/pyspider/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 config.wsgi:application
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations in container
docker-compose exec web python manage.py migrate

# Create superuser in container
docker-compose exec web python manage.py createsuperuser
```

## 🔍 API Documentation

The application provides RESTful APIs for document management and search functionality:

- **Documents API**: `/api/documents/`
- **Search API**: `/api/search/`
- **Admin API**: `/api/admin/`

Visit `/api/docs/` for interactive API documentation.

## 🌐 Internationalization

The application is prepared for multiple languages:

```bash
# Generate translation files
python manage.py makemessages -l es
python manage.py makemessages -l en

# Compile translations
python manage.py compilemessages
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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Project Maintainer**: Felipe Mendieta
- **Email**: felipe.mendieta@cedia.org.ec
- **Organization**: CEDIA

## 🙏 Acknowledgments

- European Union and Latin America digital transformation initiative
- Contributors and collaborators
- Open source community

---

For more detailed information about specific components, please refer to the documentation in each app's directory.