# Logging Configuration for Docker Production

## Overview

This document describes the logging configuration for SpiderHub in Docker production environment, including how to access and monitor logs using convenient scripts.

## Configuration

### Docker Compose Setup

The application uses **named volumes** for log files following Docker best practices:

```yaml
volumes:
  - logs_data:/app/logs

volumes:
  logs_data:
    driver: local
```

This configuration:
- Uses Docker-managed volumes for better portability
- Automatically handles permissions and security
- Persists logs even when containers are recreated
- Follows production best practices for container isolation

### Log Files Structure

The application creates the following log files in the `logs/` directory:

#### 1. Django Application Logs
- **File**: `logs/django.log`
- **Content**: Django application warnings and errors
- **Rotation**: 10MB max size, 5 backup files
- **Level**: WARNING and above

#### 2. SDG Processing Logs
- **File**: `logs/sdg_ingestion.log`
- **Content**: General SDG relevance processing logs
- **Level**: DEBUG, INFO, WARNING, ERROR
- **Format**: `[timestamp] level - logger_name - message`

#### 3. Failed SDG Scores Log
- **File**: `logs/failed_sdg_scores.log`
- **Content**: Failed document/SDG pairs in CSV format
- **Format**: `timestamp,document_id,sdg_id,error_message`
- **Purpose**: Easy parsing for retry operations

## Accessing Logs

### Using Convenience Scripts (Recommended)

We provide convenient scripts to access logs without entering the container:

#### Linux/macOS
```bash
# View SDG processing logs in real-time
./scripts/view-sdg-logs.sh

# View failed SDG scores
./scripts/view-failed-scores.sh

# Copy logs to host for analysis
./scripts/copy-logs.sh

# Run SDG ingestion with live monitoring
./scripts/run-sdg-ingestion.sh --all

# Clean up old logs
./scripts/cleanup-logs.sh
```

#### Windows PowerShell
```powershell
# View SDG processing logs in real-time
.\scripts\view-sdg-logs.ps1

# View failed SDG scores
.\scripts\view-failed-scores.ps1

# Copy logs to host for analysis
.\scripts\copy-logs.ps1

# Run SDG ingestion with live monitoring
.\scripts\run-sdg-ingestion.ps1 --all
```

### Direct Docker Commands

If you prefer direct Docker commands:

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

### Executing Scripts Inside Container

The scripts are also available inside the container for direct execution:

```bash
# Execute scripts directly inside the container
docker exec -it spider_web /app/scripts/view-sdg-logs.sh
docker exec -it spider_web /app/scripts/view-failed-scores.sh
docker exec -it spider_web /app/scripts/run-sdg-ingestion.sh --all
docker exec -it spider_web /app/scripts/copy-logs.sh

# Test the setup
docker exec -it spider_web /app/scripts/test-setup.sh
```

## Log Analysis

### SDG Processing Logs

The `sdg_ingestion.log` contains detailed processing information:

```
[2024-01-15 10:30:15] INFO - sdg_ingestion - Processing Document 42: Digital Strategy
[2024-01-15 10:30:20] ERROR - sdg_ingestion - LLM call failed: Connection timeout
[2024-01-15 10:30:25] WARNING - sdg_ingestion - Using fallback calculation for DocumentSDG 123
```

### Failed Scores Log

The `failed_sdg_scores.log` contains CSV-formatted failure records:

```
2024-01-15 10:30:20,42,3,LLM connection timeout
2024-01-15 10:30:25,42,7,API rate limit exceeded
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   # Ensure logs directory has proper permissions
   chmod 755 logs/
   chmod 644 logs/*.log
   ```

2. **Missing Log Files**
   ```bash
   # Check if logs directory exists
   ls -la logs/
   
   # Create if missing
   mkdir -p logs
   ```

3. **Container Log Access**
   ```bash
   # Check container status
   docker ps
   
   # Access container logs
   docker logs spider_web
   ```

### Log Rotation

Log files are automatically rotated:
- **Django logs**: 10MB max size, 5 backups
- **SDG logs**: No automatic rotation (manual management recommended)

Manual rotation:
```bash
# Archive old logs
mv logs/sdg_ingestion.log logs/sdg_ingestion.log.$(date +%Y%m%d)
mv logs/failed_sdg_scores.log logs/failed_sdg_scores.log.$(date +%Y%m%d)
```

## Best Practices

### 1. Log Monitoring
- Set up log monitoring tools (e.g., ELK stack, Fluentd)
- Monitor failed SDG scores for retry operations
- Alert on ERROR level messages

### 2. Log Analysis
- Regularly review failed scores for patterns
- Monitor processing times and performance
- Track fallback usage rates

### 3. Maintenance
- Implement log rotation policies
- Archive old logs for compliance
- Monitor disk space usage

### 4. Security
- Ensure log files have appropriate permissions
- Consider log encryption for sensitive data
- Implement log access controls

## Environment Variables

The following environment variables affect logging behavior:

- `LOG_LEVEL`: Overall logging level (default: WARNING in production)
- `DJANGO_LOG_LEVEL`: Django-specific logging level
- `GUNICORN_LOG_LEVEL`: Gunicorn logging level

## Integration with Monitoring

### Prometheus Metrics
- Processing success/failure rates
- Processing time metrics
- Fallback usage statistics

### Alerting
- Failed SDG score thresholds
- Processing time anomalies
- LLM service connectivity issues

## References

- [Django Logging Documentation](https://docs.djangoproject.com/en/stable/topics/logging/)
- [Docker Volume Management](https://docs.docker.com/storage/volumes/)
- [Gunicorn Logging](https://docs.gunicorn.org/en/stable/settings.html#logging)
