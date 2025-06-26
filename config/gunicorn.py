"""
Gunicorn configuration for SpiderHub production deployment.
"""

import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
workers = int(os.getenv('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = "gthread"
worker_connections = 1000
threads = int(os.getenv('GUNICORN_THREADS', 2))
max_requests = 1000
max_requests_jitter = 50
preload_app = True
timeout = int(os.getenv('GUNICORN_TIMEOUT', 120))  # Increased timeout for PDF generation
keepalive = 2

# Restart workers after this many requests to prevent memory leaks
max_requests = 1200
max_requests_jitter = 50

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'spiderhub'

# Server mechanics
daemon = False
pidfile = '/tmp/gunicorn.pid'
user = 1001
group = 1001
tmp_upload_dir = None

# Performance tuning
worker_tmp_dir = '/dev/shm'  # Use memory for worker temp files
forwarded_allow_ips = '*'
secure_scheme_headers = {
    'X-FORWARDED-PROTOCOL': 'ssl',
    'X-FORWARDED-PROTO': 'https',
    'X-FORWARDED-SSL': 'on'
}

# SSL/TLS (if needed)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Worker process lifecycle
max_requests_jitter = 50
preload_app = True
graceful_timeout = 30

# Logging configuration
capture_output = True
enable_stdio_inheritance = True

print(f"Gunicorn starting with {workers} workers using {threads} threads each")