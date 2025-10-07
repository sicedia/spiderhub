# Logger Migration Guide

## 📋 Objetivo

Reemplazar todos los `console.log`, `console.warn`, `console.error` con nuestro sistema de logging centralizado.

## 🎯 Beneficios

- ✅ Control de niveles por entorno (dev/prod)
- ✅ Metadata automática (timestamp, context)
- ✅ Búsqueda y filtrado de logs
- ✅ Export/download de logs
- ✅ Integración futura con servicios remotos (Sentry, LogRocket)

## 📦 Importación

```javascript
import { logger } from '@js/core/logger/Logger.js';
```

## 🔄 Migración Rápida

### Antes (console.log)
```javascript
console.log('SearchManager: Performing search', { url, state });
console.log('⏳ Emitting LOADING_START event');
console.log('✅ Search successful', data);
console.error('❌ Search error:', error);
console.warn('⚠️ showError() called with no error');
```

### Después (logger)
```javascript
logger.debug('Performing search', { url, state });
logger.debug('Emitting LOADING_START event');
logger.info('Search successful', { count: data.count, duration });
logger.error('Search failed', error);
logger.warn('showError() called without error object');
```

## 📊 Niveles de Log

### `logger.debug(message, data, context)`
**Cuándo usar:** Información detallada para debugging

```javascript
logger.debug('Building search params', { state: this.state });
logger.debug('Event emitted', { eventName: EVENTS.SEARCH_SUCCESS });
logger.debug('Component initialized', { options: this.options });
```

### `logger.info(message, data, context)`
**Cuándo usar:** Eventos importantes del flujo normal

```javascript
logger.info('Search completed', { count: data.results.length, duration: 450 });
logger.info('User logged in', { userId: user.id });
logger.info('Filter applied', { filterType, filterValue });
```

### `logger.warn(message, data, context)`
**Cuándo usar:** Situaciones anormales que no son errores

```javascript
logger.warn('Slow API response', { duration: 5000, endpoint });
logger.warn('Missing optional element', { selector: '.optional-element' });
logger.warn('Deprecated method used', { method: 'oldMethod' });
```

### `logger.error(message, error, context)`
**Cuándo usar:** Errores reales

```javascript
try {
  await performSearch();
} catch (error) {
  logger.error('Search request failed', error, {
    url: searchUrl,
    params: searchParams
  });
  throw error;
}
```

## 🏗️ Logger con Contexto (Child Logger)

Para componentes, crea un child logger con contexto:

```javascript
export class SearchManager extends BaseComponent {
  constructor(element, options) {
    super(element, options);
    
    // Create child logger with component context
    this.logger = logger.child({
      component: 'SearchManager',
      instance: this.instanceId
    });
  }

  async performSearch() {
    this.logger.debug('Starting search', { state: this.state });
    
    try {
      const data = await fetch(url);
      this.logger.info('Search completed', { count: data.count });
      return data;
    } catch (error) {
      this.logger.error('Search failed', error);
      throw error;
    }
  }
}
```

**Output en consola:**
```
🔍 [10:30:45] [SearchManager] Starting search { state: {...} }
ℹ️ [10:30:46] [SearchManager] Search completed { count: 42 }
```

## 📊 Log Groups (para operaciones complejas)

```javascript
async performComplexOperation() {
  this.logger.group('Complex Operation');
  
  this.logger.debug('Step 1: Validate input');
  this.logger.debug('Step 2: Fetch data');
  this.logger.debug('Step 3: Process results');
  this.logger.info('Operation completed');
  
  this.logger.groupEnd();
}
```

## 🔧 Configuración por Entorno

El logger detecta automáticamente el entorno:

- **Development** (localhost, 127.0.0.1, *dev*, ?debug=true):
  - Level: `debug` (muestra todo)
  
- **Production** (otros dominios):
  - Level: `warn` (solo warnings y errors)

### Override manual:

```javascript
// Force debug mode
logger.setLevel('debug');

// Disable all logging
logger.disable();

// Re-enable
logger.enable();
```

## 🔍 Inspección de Logs

### En consola del navegador:

```javascript
// Access logger
window.__logger

// Get all logs
window.__logger.getLogs()

// Get only errors
window.__logger.getLogs({ level: 'error' })

// Get logs from last 5 minutes
window.__logger.getLogs({ since: Date.now() - 5 * 60 * 1000 })

// Search in logs
window.__logger.getLogs({ search: 'search' })

// Download logs as JSON
window.__logger.downloadLogs('debug-logs.json')
```

## 📝 Checklist de Migración

Para cada archivo:

- [ ] Importar logger: `import { logger } from '@js/core/logger/Logger.js';`
- [ ] Crear child logger si es un componente
- [ ] Reemplazar `console.log` → `logger.debug`
- [ ] Reemplazar `console.info` → `logger.info`
- [ ] Reemplazar `console.warn` → `logger.warn`
- [ ] Reemplazar `console.error` → `logger.error`
- [ ] Remover emojis de mensajes (el logger los añade automáticamente)
- [ ] Añadir data relevante como segundo parámetro
- [ ] Añadir context como tercer parámetro si es necesario
- [ ] Testear que los logs aparecen correctamente

## 🎨 Estilos de Mensajes

### ✅ Buenos mensajes

```javascript
// Claro y conciso
logger.info('Search completed', { count: 10, duration: 450 });

// Con contexto útil
logger.error('API request failed', error, {
  endpoint: '/api/search',
  params: { q: 'test' },
  retries: 3
});

// Acción + resultado
logger.debug('Emitting event', { 
  event: EVENTS.SEARCH_SUCCESS, 
  data: { count: 10 } 
});
```

### ❌ Malos mensajes

```javascript
// Demasiado vago
logger.info('Success');

// Demasiado largo
logger.debug('Now we are going to perform a search with the following parameters that the user provided...');

// Con emoji (el logger los añade)
logger.error('❌ Search failed', error);

// Solo data sin mensaje
logger.info(null, { count: 10 });
```

## 🚀 Integración Futura

El logger está preparado para integrarse con servicios externos:

```javascript
// Ejemplo: Enviar errors a Sentry
logger.addHandler(logger.createRemoteHandler('https://api.sentry.io/logs', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  batchSize: 10,
  flushInterval: 5000
}));
```

## 📊 Ejemplo Completo: SearchManager

Mira `SearchManager.js` para ver un ejemplo completo de migración.

## 🐛 Debugging

Si algo no funciona:

1. Verifica que el logger está importado correctamente
2. Chequea el nivel de log: `logger.config.level`
3. Verifica que está habilitado: `logger.config.enabled`
4. Usa `window.__logger` en consola para inspeccionar

## 📚 Recursos

- Logger.js: `apps/core/static/core/js/core/logger/Logger.js`
- Este guide: `docs/LOGGER_MIGRATION_GUIDE.md`
- Ejemplo: `apps/core/static/core/js/components/search/SearchManager.js`

