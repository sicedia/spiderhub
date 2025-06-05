# syntax=docker/dockerfile:1

#########################
#  ===== Builder =====  #
#########################
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencias de compilación y libpq-dev solo en la etapa builder
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements/production.txt ./requirements.txt

# Cache de pip con BuildKit
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install --prefix=/install -r requirements.txt


#########################
#  ===== Runner  =====  #
#########################
FROM python:3.13-slim AS runner

LABEL maintainer="felipe.mendieta@cedia.og.ec" \
      org.opencontainers.image.title="spider" \
      org.opencontainers.image.version="1.0.0"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    GUNICORN_CMD_ARGS="--workers 3 --log-level info -b 0.0.0.0:8000"

WORKDIR /app

# Solo librerías de runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl libpq5 \
    && apt-get purge -y --auto-remove \
    && rm -rf /var/lib/apt/lists/*

# Usuario sin privilegios antes de copiar para poder usar --chown
RUN groupadd --system appuser && \
    useradd --system --gid appuser --home-dir /app appuser

# Dependencias Python compiladas en /install (builder) → /usr/local (runner)
COPY --from=builder /install /usr/local

# Código de la aplicación con la propiedad correcta
COPY --chown=appuser:appuser . .

USER appuser

# Recolectar estáticos
RUN python manage.py collectstatic --no-input

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8000/health/ || exit 1

CMD ["gunicorn", "config.wsgi:application"]
