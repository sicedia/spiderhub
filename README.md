# SPIDER_WEB Django Project

A Django-based web application for [brief description of your project purpose].

## Installation

### Prerequisites
- Python 3.8+ installed
- pip (Python package manager)

### Setup Environment

1. Clone the repository
```bash
git clone [your-repository-url]
cd SPIDER_WEB
```

2. Create a virtual environment named "pyspider"
```bash
# On Windows
python -m venv pyspider

# On macOS/Linux
python3 -m venv pyspider
```

3. Activate the virtual environment
```bash
# On Windows
pyspider\Scripts\activate

# On macOS/Linux
source pyspider/bin/activate
```

4. Install core dependencies (base requirements)
```bash
python -m pip install --upgrade pip
pip install -r requirements/base.txt
```

## Database Setup

1. Create and apply migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

2. Create a superuser (admin)
```bash
python manage.py createsuperuser
```

## Running the Project

1. Start the development server
```bash
python manage.py runserver
```

2. Access the application at [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## Project Structure

```
SPIDER_WEB/
├── pyspider/                # Virtual environment folder
├── apps/                    # Django applications
│   ├── admin_panel/         # Admin panel module
│   ├── core/                # Core application (views, models, etc.)
│   └── documents/           # Document management and processing app
├── config/                  # Django project configuration
│   ├── asgi.py              # ASGI entrypoint
│   ├── settings.py          # Main settings file
│   ├── urls.py              # Global URL mappings
│   └── wsgi.py              # WSGI entrypoint
├── db.sqlite3               # SQLite database (development only)
├── manage.py                # Django management script
├── requirements/            # Dependency files
│   ├── base.txt             # Minimal dependencies
│   ├── development.txt      # Development dependencies
│   └── production.txt       # Production dependencies
├── static/                 # Custom static assets (CSS, JS, images)
├── media/                  # User-uploaded media files
└── README.md                # This file
```

## Deployment

Follow these step-by-step instructions to deploy your project:

1. **Prepare the Environment**
   - Ensure you have a production-ready server (virtual machine or container).
   - Install Python 3.8+ and pip.
   - Clone your repository:
     ```bash
     git clone [your-repository-url]
     cd SPIDER_WEB
     ```

2. **Set Up Virtual Environment and Install Dependencies**
   - Create and activate a virtual environment:
     ```bash
     python -m venv pyspider
     # On Windows
     pyspider\Scripts\activate
     # On macOS/Linux
     source pyspider/bin/activate
     ```
   - Install production requirements:
     ```bash
     pip install -r requirements/production.txt
     ```

3. **Configure Environment Variables**
   - Create a `.env` file (or configure your environment) with required variables (e.g., `DEBUG=FALSE`, `ALLOWED_HOSTS`, database credentials, secret key, etc.).

4. **Database Migrations**
   - Run migrations to update the database schema:
     ```bash
     python manage.py makemigrations
     python manage.py migrate
     ```

5. **Collect Static Files**
   - Run the collectstatic command to gather static assets:
     ```bash
     python manage.py collectstatic --noinput
     ```

6. **Configure the Application Server**
   - Install a WSGI server such as Gunicorn:
     ```bash
     pip install gunicorn
     ```
   - Test running your project with Gunicorn:
     ```bash
     gunicorn config.wsgi:application --bind 0.0.0.0:8000
     ```

7. **Set Up a Reverse Proxy**
   - Configure a reverse proxy like Nginx to forward requests to Gunicorn.
   - Create an Nginx configuration similar to:
     ```nginx
     server {
         listen 80;
         server_name your_domain.com;

         location / {
             proxy_pass http://127.0.0.1:8000;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         }

         location /static/ {
             alias /path/to/SPIDER_WEB/static/;
         }

         location /media/ {
             alias /path/to/SPIDER_WEB/media/;
         }
     }
     ```
   - Reload Nginx after configuring.

8. **Launch and Monitor**
   - Use a process supervisor (such as systemd, Supervisor, or Docker) to keep your Gunicorn process running.
   - Monitor logs and verify the deployment.

## Development

### Running Tests
```bash
python manage.py test
```

### Making Migrations
```bash
python manage.py makemigrations
```

## License

MTI

## Contact

felipe.mendieta@cedia.org.ec