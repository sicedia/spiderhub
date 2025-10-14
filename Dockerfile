# syntax=docker/dockerfile:1

#########################
#  ===== Builder =====  #
#########################
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        pkg-config \
        git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements/production.txt ./requirements.txt

# Install Python dependencies
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install --prefix=/install -r requirements.txt

#########################
#  ===== Runner  =====  #
#########################
FROM python:3.12-slim AS runner

# Build arguments for versioning (cache busting)
ARG BUILD_DATE
ARG GIT_COMMIT_HASH
ARG VERSION=0.1.0-rc.3

LABEL maintainer="felipe.mendieta@cedia.org.ec" \
      org.opencontainers.image.title="spiderhub" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.description="SpiderHub Document Management System" \
      org.opencontainers.image.source="https://github.com/sicedia/spiderhub_web.git" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_COMMIT_HASH}"

# Production environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    PYTHONPATH=/app \
    PATH="/app/.local/bin:$PATH" \
    GIT_COMMIT_HASH=${GIT_COMMIT_HASH} \
    BUILD_DATE=${BUILD_DATE}

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        libpq5 \
        postgresql-client \
        gettext \
    && apt-get purge -y --auto-remove \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user with specific UID/GID
RUN groupadd --system --gid 1001 appuser && \
    useradd --system --uid 1001 --gid appuser --home-dir /app --shell /bin/bash appuser

# Copy Python dependencies from builder
COPY --from=builder /install /usr/local

# Create necessary directories with correct permissions
RUN mkdir -p /app/staticfiles /app/media /app/logs /app/tmp && \
    chown -R appuser:appuser /app && \
    chmod -R 755 /app

# Copy application code (exclude unnecessary files)
COPY --chown=appuser:appuser requirements/ ./requirements/
COPY --chown=appuser:appuser manage.py ./
COPY --chown=appuser:appuser config/ ./config/
COPY --chown=appuser:appuser apps/ ./apps/
COPY --chown=appuser:appuser templates/ ./templates/
COPY --chown=appuser:appuser static/ ./static/
COPY --chown=appuser:appuser entrypoint.sh ./

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--config", "python:config.gunicorn", "config.wsgi:application"]
