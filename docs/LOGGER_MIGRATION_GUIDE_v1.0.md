# Logger Migration Guide

## 📋 Objective

Replace all `console.log`, `console.warn`, `console.error` calls with our centralized logging system.

## 🎯 Benefits

- ✅ Environment-based level control (dev/prod)
- ✅ Automatic metadata (timestamp, context)
- ✅ Log search and filtering
- ✅ Log export/download capabilities
- ✅ Future integration with remote services (Sentry, LogRocket)

## 📦 Import

```javascript
import { logger } from '@js/core/logger/Logger.js';
```

## 🔄 Quick Migration

### Before (console.log)
```javascript
console.log('SearchManager: Performing search', { url, state });
console.log('⏳ Emitting LOADING_START event');
console.log('✅ Search successful', data);
console.error('❌ Search error:', error);
console.warn('⚠️ showError() called with no error');
```

### After (logger)
```javascript
logger.debug('Performing search', { url, state });
logger.debug('Emitting LOADING_START event');
logger.info('Search successful', { count: data.count, duration });
logger.error('Search failed', error);
logger.warn('showError() called without error object');
```

## 📊 Log Levels

### `logger.debug(message, data, context)`
**When to use:** Detailed information for debugging

```javascript
logger.debug('Building search params', { state: this.state });
logger.debug('Event emitted', { eventName: EVENTS.SEARCH_SUCCESS });
logger.debug('Component initialized', { options: this.options });
```

### `logger.info(message, data, context)`
**When to use:** Important events in normal flow

```javascript
logger.info('Search completed', { count: data.results.length, duration: 450 });
logger.info('User logged in', { userId: user.id });
logger.info('Filter applied', { filterType, filterValue });
```

### `logger.warn(message, data, context)`
**When to use:** Abnormal situations that are not errors

```javascript
logger.warn('Slow API response', { duration: 5000, endpoint });
logger.warn('Missing optional element', { selector: '.optional-element' });
logger.warn('Deprecated method used', { method: 'oldMethod' });
```

### `logger.error(message, error, context)`
**When to use:** Actual errors

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

## 🏗️ Logger with Context (Child Logger)

For components, create a child logger with context:

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

**Console output:**
```
🔍 [10:30:45] [SearchManager] Starting search { state: {...} }
ℹ️ [10:30:46] [SearchManager] Search completed { count: 42 }
```

## 📊 Log Groups (for complex operations)

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

## 🔧 Environment Configuration

Logger automatically detects the environment:

- **Development** (localhost, 127.0.0.1, *dev*, ?debug=true):
  - Level: `debug` (shows everything)
  
- **Production** (other domains):
  - Level: `warn` (only warnings and errors)

### Manual override:

```javascript
// Force debug mode
logger.setLevel('debug');

// Disable all logging
logger.disable();

// Re-enable
logger.enable();
```

## 🔍 Log Inspection

### In browser console:

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

## 📝 Migration Checklist

For each file:

- [ ] Import logger: `import { logger } from '@js/core/logger/Logger.js';`
- [ ] Create child logger if it's a component
- [ ] Replace `console.log` → `logger.debug`
- [ ] Replace `console.info` → `logger.info`
- [ ] Replace `console.warn` → `logger.warn`
- [ ] Replace `console.error` → `logger.error`
- [ ] Remove emojis from messages (logger adds them automatically)
- [ ] Add relevant data as second parameter
- [ ] Add context as third parameter if needed
- [ ] Test that logs appear correctly

## 🎨 Message Styles

### ✅ Good messages

```javascript
// Clear and concise
logger.info('Search completed', { count: 10, duration: 450 });

// With useful context
logger.error('API request failed', error, {
  endpoint: '/api/search',
  params: { q: 'test' },
  retries: 3
});

// Action + result
logger.debug('Emitting event', { 
  event: EVENTS.SEARCH_SUCCESS, 
  data: { count: 10 } 
});
```

### ❌ Bad messages

```javascript
// Too vague
logger.info('Success');

// Too long
logger.debug('Now we are going to perform a search with the following parameters that the user provided...');

// With emoji (logger adds them)
logger.error('❌ Search failed', error);

// Only data without message
logger.info(null, { count: 10 });
```

## 🚀 Future Integration

The logger is prepared to integrate with external services:

```javascript
// Example: Send errors to Sentry
logger.addHandler(logger.createRemoteHandler('https://api.sentry.io/logs', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  batchSize: 10,
  flushInterval: 5000
}));
```

## 📊 Complete Example: SearchManager

See `SearchManager.js` for a complete migration example.

## 🐛 Debugging

If something doesn't work:

1. Verify the logger is imported correctly
2. Check the log level: `logger.config.level`
3. Verify it's enabled: `logger.config.enabled`
4. Use `window.__logger` in console to inspect

## 📚 Resources

- Logger.js: `apps/core/static/core/js/core/logger/Logger.js`
- This guide: `docs/LOGGER_MIGRATION_GUIDE_v1.0.md`
- Example: `apps/core/static/core/js/components/search/SearchManager.js`

---

**Document Version:** v1.0  
**Created:** October 2024  
**Last Updated:** October 2024  
**Category:** Migration & Architecture  
**Related:** EVENTBUS_MIGRATION_GUIDE_v1.0.md, LOGGING_CONFIGURATION_v1.0.md

