FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      && rm -rf /var/lib/apt/lists/*

# Install pipenv or upgrade pip if needed
RUN pip install --upgrade pip

# Copy production requirements and install dependencies
COPY requirements/production.txt /app/requirements.txt
RUN pip install -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Apply database migrations
RUN python manage.py migrate

# Expose the port that gunicorn will run on
EXPOSE 8000

# Run gunicorn server in production mode
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]

# This Dockerfile builds your project by installing dependencies and then starting Gunicorn to serve the Django app. Be sure to adjust any specific paths or configuration if needed.// filepath: c:\Projects\spider-web\Dockerfile
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      && rm -rf /var/lib/apt/lists/*

# Install pipenv or upgrade pip if needed
RUN pip install --upgrade pip

# Copy production requirements and install dependencies
COPY requirements/production.txt /app/requirements.txt
RUN pip install -r requirements.txt

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Apply database migrations
RUN python manage.py migrate

# Expose the port that gunicorn will run on
EXPOSE 8000

# Run gunicorn server in production mode
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]


#This Dockerfile builds your project by installing dependencies and then starting Gunicorn to serve the Django app. Be sure to adjust any specific paths or configuration if needed.