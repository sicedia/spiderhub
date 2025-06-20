-- Production database initialization script
-- This script runs automatically when PostgreSQL container starts for the first time

\echo 'Starting database initialization...'

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

SET timezone = 'America/Guayaquil';

-- Create additional schemas if needed (optional)
-- CREATE SCHEMA IF NOT EXISTS analytics;
-- CREATE SCHEMA IF NOT EXISTS logs;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON DATABASE spider TO spider_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO spider_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO spider_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spider_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO spider_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO spider_user;

\echo 'Database initialization complete.'