# Logging System - Environment Configuration

## 📋 Summary

This project implements a dual logging system:
- **Backend (Python/Django)**: Environment-based configuration in settings
- **Frontend (JavaScript)**: Logger.js with automatic environment detection

## 🔧 Backend Configuration (Django)

### **Development (development.py)**
```python
LOGGING level: DEBUG
Handlers: console
Shows: ALL (debug, info, warning, error)
SQL queries: Enabled
```

**Features:**
- ✅ Detailed logs of all operations
- ✅ SQL queries visible for debugging
- ✅ Application logs at DEBUG level
- ✅ Verbose format with function and timestamp

### **Production (production.py)**
```python
LOGGING level: WARNING
Handlers: console + file (/app/logs/django.log)
Shows: Only warnings and errors
```

**Features:**
- ⚠️ Only WARNING and ERROR logs
- 📁 Logs saved in rotating file (10MB, 5 backups)
- 🔒 Simple format in console, verbose in file
- 🚀 Optimized for performance

## 🌐 Frontend Configuration (Logger.js)

### **Automatic Environment Detection**

The logger automatically detects the environment based on:
```javascript
// Lines 50-58 of Logger.js
const isDev = window.location.hostname === 'localhost' 
  || window.location.hostname === '127.0.0.1'
  || window.location.hostname.includes('dev')
  || window.location.search.includes('debug=true');
```

### **Development**
```
Level: debug
Shows: debug, info, warn, error
Handler: console with styles and emojis
```

### **Production**
```
Level: warn
Shows: Only warn and error
Handler: console (no debug/info)
```

## 📊 Level Comparison

|| Environment | Backend Python | Frontend JS | SQL Queries | Log File |
||---------|---------------|-------------|-------------|----------|
|| **Development** | DEBUG | debug | ✅ Yes | ❌ No |
|| **Production** | WARNING | warn | ❌ No | ✅ Yes |

## 🚀 Production Usage

### Backend
Logs in production will only show:
- ⚠️ Important warnings
- ❌ Critical errors
- 🔥 Unhandled exceptions

Example:
```python
import logging

logger = logging.getLogger('apps.myapp')

# ❌ Will NOT appear in production
logger.debug('Debug message')
logger.info('Info message')

# ✅ WILL appear in production
logger.warning('Warning: slow query detected')
logger.error('Error processing request', exc_info=True)
```

### Frontend
Logs in production will only show:
```javascript
import { logger } from '@js/core/logger/Logger.js';

// ❌ Will NOT appear in production
logger.debug('Debug info');
logger.info('Operation completed');

// ✅ WILL appear in production
logger.warn('Slow API response', { duration: 5000 });
logger.error('API request failed', error);
```

## 🔍 Testing Configuration

### Verify Backend
```bash
# Development
poetry run python manage.py shell
>>> import logging
>>> logging.getLogger().level  # Should be 10 (DEBUG)

# Production
DJANGO_SETTINGS_MODULE=config.settings.production poetry run python manage.py shell
>>> import logging
>>> logging.getLogger().level  # Should be 30 (WARNING)
```

### Verify Frontend
```javascript
// In browser console
console.log(window.__logger.config.level);

// Development (localhost): 'debug'
// Production (domain): 'warn'
```

## 📁 Production Log Files

Production logs are saved in:
```
/app/logs/django.log
```

**Rotation configuration:**
- Maximum size: 10MB
- Backups: 5 files
- Total maximum space: ~50MB

**Format:**
```
[WARNING] 2025-01-15 10:30:45 apps.search 1234 5678 Slow query detected
[ERROR] 2025-01-15 10:31:12 django.request 1234 5679 Internal Server Error
```

## 🛠️ Manual Override (Debugging in Production)

### Backend
Add to production `.env`:
```env
DJANGO_LOG_LEVEL=INFO  # Temporary for debugging
```

Then modify in `production.py`:
```python
'root': {
    'level': os.getenv('DJANGO_LOG_LEVEL', 'WARNING'),
}
```

### Frontend
In browser console:
```javascript
// Enable debug temporarily
window.__logger.setLevel('debug');

// Check logs
window.__logger.getLogs();

// Download logs
window.__logger.downloadLogs('production-debug.json');

// Return to normal
window.__logger.setLevel('warn');
```

## 📖 References

- **Backend Logging**: `config/settings/production.py`, `config/settings/development.py`
- **Frontend Logger**: `apps/core/static/core/js/core/logger/Logger.js`
- **Migration Guide**: `docs/LOGGER_MIGRATION_GUIDE.md`
- **Django Logging**: https://docs.djangoproject.com/en/4.2/topics/logging/

## ✅ Pre-Deployment Checklist

Before going to production, verify:

- [ ] Variable `DJANGO_SETTINGS_MODULE=config.settings.production` configured
- [ ] Directory `/app/logs/` exists and has write permissions
- [ ] No unmigrated `console.log` to `logger`
- [ ] Sensitive logs (passwords, tokens) are not logged
- [ ] Production logs don't include debug information
- [ ] Test logs with `logger.warning()` works
- [ ] Log rotation configured correctly

## 🎯 Benefits of this Configuration

### Development
- 🐛 Complete debugging with SQL queries
- 🔍 Detailed information of all operations
- ⚡ Immediate feedback in console

### Production
- 🚀 Optimized performance (less I/O)
- 💾 Controlled disk usage (rotation)
- 🔒 Sensitive information not exposed
- 📊 Only important events logged
- 💰 Lower cost in cloud logging services

## 🔄 Future Migration

The system is prepared to integrate with:
- **Sentry**: Real-time error tracking
- **LogRocket**: Session replay with logs
- **CloudWatch/ELK**: Centralized log aggregation
- **Datadog/New Relic**: APM monitoring

See `Logger.js` lines 268-307 for remote handler implementation.

---

**Document Version:** v1.0  
**Created:** October 2024  
**Last Updated:** October 2024  
**Category:** Configuration & Logging  
**Related:** LOGGER_MIGRATION_GUIDE.md
