# Sistema de Logging - Configuración por Entorno

## 📋 Resumen

Este proyecto implementa un sistema de logging dual:
- **Backend (Python/Django)**: Configuración por entorno en settings
- **Frontend (JavaScript)**: Logger.js con detección automática de entorno

## 🔧 Configuración Backend (Django)

### **Desarrollo (development.py)**
```python
LOGGING level: DEBUG
Handlers: console
Muestra: TODO (debug, info, warning, error)
SQL queries: Habilitado
```

**Características:**
- ✅ Logs detallados de todas las operaciones
- ✅ SQL queries visibles para debugging
- ✅ Logs de aplicaciones en nivel DEBUG
- ✅ Formato verbose con función y timestamp

### **Producción (production.py)**
```python
LOGGING level: WARNING
Handlers: console + file (/app/logs/django.log)
Muestra: Solo warnings y errors
```

**Características:**
- ⚠️ Solo logs de WARNING y ERROR
- 📁 Logs guardados en archivo rotativo (10MB, 5 backups)
- 🔒 Formato simple en consola, verbose en archivo
- 🚀 Optimizado para rendimiento

## 🌐 Configuración Frontend (Logger.js)

### **Detección Automática de Entorno**

El logger detecta automáticamente el entorno basado en:
```javascript
// Líneas 50-58 de Logger.js
const isDev = window.location.hostname === 'localhost' 
  || window.location.hostname === '127.0.0.1'
  || window.location.hostname.includes('dev')
  || window.location.search.includes('debug=true');
```

### **Desarrollo**
```
Level: debug
Muestra: debug, info, warn, error
Handler: console con estilos y emojis
```

### **Producción**
```
Level: warn
Muestra: Solo warn y error
Handler: console (sin debug/info)
```

## 📊 Comparación de Niveles

| Entorno | Backend Python | Frontend JS | SQL Queries | Archivo Log |
|---------|---------------|-------------|-------------|-------------|
| **Development** | DEBUG | debug | ✅ Sí | ❌ No |
| **Production** | WARNING | warn | ❌ No | ✅ Sí |

## 🚀 Uso en Producción

### Backend
Los logs en producción solo mostrarán:
- ⚠️ Warnings importantes
- ❌ Errores críticos
- 🔥 Excepciones no manejadas

Ejemplo:
```python
import logging

logger = logging.getLogger('apps.myapp')

# ❌ NO aparecerá en producción
logger.debug('Debug message')
logger.info('Info message')

# ✅ SÍ aparecerá en producción
logger.warning('Warning: slow query detected')
logger.error('Error processing request', exc_info=True)
```

### Frontend
Los logs en producción solo mostrarán:
```javascript
import { logger } from '@js/core/logger/Logger.js';

// ❌ NO aparecerá en producción
logger.debug('Debug info');
logger.info('Operation completed');

// ✅ SÍ aparecerá en producción
logger.warn('Slow API response', { duration: 5000 });
logger.error('API request failed', error);
```

## 🔍 Testing de Configuración

### Verificar Backend
```bash
# Development
python manage.py shell
>>> import logging
>>> logging.getLogger().level  # Debería ser 10 (DEBUG)

# Production
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py shell
>>> import logging
>>> logging.getLogger().level  # Debería ser 30 (WARNING)
```

### Verificar Frontend
```javascript
// En consola del navegador
console.log(window.__logger.config.level);

// Development (localhost): 'debug'
// Production (domain): 'warn'
```

## 📁 Archivos de Log en Producción

Los logs de producción se guardan en:
```
/app/logs/django.log
```

**Configuración de rotación:**
- Tamaño máximo: 10MB
- Backups: 5 archivos
- Total espacio máximo: ~50MB

**Formato:**
```
[WARNING] 2025-01-15 10:30:45 apps.search 1234 5678 Slow query detected
[ERROR] 2025-01-15 10:31:12 django.request 1234 5679 Internal Server Error
```

## 🛠️ Override Manual (Debugging en Producción)

### Backend
Agregar al `.env` de producción:
```env
DJANGO_LOG_LEVEL=INFO  # Temporal para debugging
```

Luego modificar en `production.py`:
```python
'root': {
    'level': os.getenv('DJANGO_LOG_LEVEL', 'WARNING'),
}
```

### Frontend
En consola del navegador:
```javascript
// Habilitar debug temporalmente
window.__logger.setLevel('debug');

// Verificar logs
window.__logger.getLogs();

// Descargar logs
window.__logger.downloadLogs('production-debug.json');

// Volver a normal
window.__logger.setLevel('warn');
```

## 📖 Referencias

- **Backend Logging**: `config/settings/production.py`, `config/settings/development.py`
- **Frontend Logger**: `apps/core/static/core/js/core/logger/Logger.js`
- **Guía de Migración**: `docs/LOGGER_MIGRATION_GUIDE.md`
- **Django Logging**: https://docs.djangoproject.com/en/4.2/topics/logging/

## ✅ Checklist Pre-Despliegue

Antes de pasar a producción, verificar:

- [ ] Variable `DJANGO_SETTINGS_MODULE=config.settings.production` configurada
- [ ] Directorio `/app/logs/` existe y tiene permisos de escritura
- [ ] No hay `console.log` sin migrar a `logger`
- [ ] Logs sensibles (passwords, tokens) no se registran
- [ ] Logs de producción no incluyen información de debug
- [ ] Test de logs con `logger.warning()` funciona
- [ ] Rotación de logs configurada correctamente

## 🎯 Beneficios de esta Configuración

### Desarrollo
- 🐛 Debugging completo con SQL queries
- 🔍 Información detallada de todas las operaciones
- ⚡ Feedback inmediato en consola

### Producción
- 🚀 Rendimiento optimizado (menos I/O)
- 💾 Uso de disco controlado (rotación)
- 🔒 Información sensible no expuesta
- 📊 Solo eventos importantes registrados
- 💰 Menor coste en logs de servicios cloud

## 🔄 Migración Futura

El sistema está preparado para integrarse con:
- **Sentry**: Tracking de errores en tiempo real
- **LogRocket**: Session replay con logs
- **CloudWatch/ELK**: Agregación centralizada de logs
- **Datadog/New Relic**: Monitoreo APM

Ver `Logger.js` líneas 268-307 para implementación de remote handler.

