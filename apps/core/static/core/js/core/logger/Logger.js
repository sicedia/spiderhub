/**
 * Logger - Sistema de logging centralizado con niveles
 * Reemplaza todos los console.log/warn/error con un sistema profesional
 * 
 * Features:
 * - Niveles: debug, info, warn, error
 * - Configuración por entorno (dev/prod)
 * - Handlers extensibles (console, remote service, file)
 * - Metadata automática (timestamp, component, context)
 * - Stack traces para errores
 * 
 * Usage:
 * import { logger } from '@js/core/logger/Logger.js';
 * logger.debug('Search started', { query: 'test' });
 * logger.info('Results loaded', { count: 10 });
 * logger.warn('Slow response', { duration: 5000 });
 * logger.error('API failed', error);
 */

export class Logger {
  constructor(config = {}) {
    this.config = {
      level: config.level || this.getDefaultLevel(),
      enabled: config.enabled !== undefined ? config.enabled : true,
      timestamps: config.timestamps !== undefined ? config.timestamps : true,
      stackTrace: config.stackTrace !== undefined ? config.stackTrace : true,
      maxLogSize: config.maxLogSize || 1000,
      ...config
    };

    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      none: 4
    };

    this.handlers = [];
    this.logBuffer = [];
    this.groupStack = [];

    // Add default console handler
    this.addHandler(this.createConsoleHandler());
  }

  /**
   * Get default log level based on environment
   */
  getDefaultLevel() {
    // Check if we're in development
    const isDev = window.location.hostname === 'localhost' 
      || window.location.hostname === '127.0.0.1'
      || window.location.hostname.includes('dev')
      || window.location.search.includes('debug=true');

    return isDev ? 'debug' : 'warn';
  }

  /**
   * Check if a log level should be logged
   */
  shouldLog(level) {
    if (!this.config.enabled) return false;
    return this.levels[level] >= this.levels[this.config.level];
  }

  /**
   * Create log entry with metadata
   */
  createLogEntry(level, message, data = null, context = {}) {
    const entry = {
      level,
      message,
      data,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };

    if (this.config.timestamps) {
      entry.timestamp = new Date().toISOString();
      entry.time = Date.now();
    }

    if (this.groupStack.length > 0) {
      entry.group = this.groupStack[this.groupStack.length - 1];
    }

    if (level === 'error' && this.config.stackTrace) {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  /**
   * Format message with component prefix
   */
  formatMessage(component, message) {
    return component ? `[${component}] ${message}` : message;
  }

  /**
   * Log at debug level
   */
  debug(message, data = null, context = {}) {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, data, context);
    this.log(entry);
  }

  /**
   * Log at info level
   */
  info(message, data = null, context = {}) {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, data, context);
    this.log(entry);
  }

  /**
   * Log at warn level
   */
  warn(message, data = null, context = {}) {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, data, context);
    this.log(entry);
  }

  /**
   * Log at error level
   */
  error(message, error = null, context = {}) {
    if (!this.shouldLog('error')) return;

    // Extract error information
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...error
    } : error;

    const entry = this.createLogEntry('error', message, errorData, context);
    this.log(entry);
  }

  /**
   * Start a log group
   */
  group(name) {
    this.groupStack.push(name);
    this.handlers.forEach(handler => {
      if (handler.group) handler.group(name);
    });
  }

  /**
   * End current log group
   */
  groupEnd() {
    this.groupStack.pop();
    this.handlers.forEach(handler => {
      if (handler.groupEnd) handler.groupEnd();
    });
  }

  /**
   * Log entry to all handlers
   */
  log(entry) {
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.config.maxLogSize) {
      this.logBuffer.shift();
    }

    // Send to handlers
    this.handlers.forEach(handler => {
      try {
        handler.log(entry);
      } catch (error) {
        console.error('Logger handler failed:', error);
      }
    });
  }

  /**
   * Add a log handler
   */
  addHandler(handler) {
    this.handlers.push(handler);
  }

  /**
   * Remove a log handler
   */
  removeHandler(handler) {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Create console handler
   */
  createConsoleHandler() {
    const styles = {
      debug: 'color: #6c757d; font-weight: normal',
      info: 'color: #0dcaf0; font-weight: bold',
      warn: 'color: #ffc107; font-weight: bold',
      error: 'color: #dc3545; font-weight: bold'
    };

    const icons = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };

    return {
      log(entry) {
        const { level, message, data, timestamp } = entry;
        const style = styles[level] || '';
        const icon = icons[level] || '';
        const time = timestamp ? `[${new Date(timestamp).toLocaleTimeString()}]` : '';

        // Format message
        const formattedMessage = `%c${icon} ${time} ${message}`;

        // Choose console method
        const consoleMethod = console[level] || console.log;

        // Log with style
        if (data !== null && data !== undefined) {
          consoleMethod.call(console, formattedMessage, style, data);
        } else {
          consoleMethod.call(console, formattedMessage, style);
        }

        // Log error stack if available
        if (level === 'error' && entry.data && entry.data.stack) {
          console.error('Stack trace:', entry.data.stack);
        }
      },

      group(name) {
        console.group(name);
      },

      groupEnd() {
        console.groupEnd();
      }
    };
  }

  /**
   * Create remote handler for sending logs to a service
   */
  createRemoteHandler(endpoint, options = {}) {
    const buffer = [];
    const batchSize = options.batchSize || 10;
    const flushInterval = options.flushInterval || 5000;

    const flush = async () => {
      if (buffer.length === 0) return;

      const logs = buffer.splice(0, buffer.length);

      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: JSON.stringify({ logs })
        });
      } catch (error) {
        console.error('Failed to send logs to remote:', error);
      }
    };

    // Flush periodically
    setInterval(flush, flushInterval);

    return {
      log(entry) {
        // Only send warnings and errors to remote
        if (entry.level === 'warn' || entry.level === 'error') {
          buffer.push(entry);

          if (buffer.length >= batchSize) {
            flush();
          }
        }
      }
    };
  }

  /**
   * Get all logs from buffer
   */
  getLogs(filter = {}) {
    let logs = [...this.logBuffer];

    if (filter.level) {
      logs = logs.filter(log => log.level === filter.level);
    }

    if (filter.since) {
      logs = logs.filter(log => log.time >= filter.since);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(search)
      );
    }

    return logs;
  }

  /**
   * Clear log buffer
   */
  clearLogs() {
    this.logBuffer = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs(filename = 'logs.json') {
    const data = this.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Set log level dynamically
   */
  setLevel(level) {
    if (this.levels[level] === undefined) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.config.level = level;
  }

  /**
   * Enable logging
   */
  enable() {
    this.config.enabled = true;
  }

  /**
   * Disable logging
   */
  disable() {
    this.config.enabled = false;
  }

  /**
   * Create a child logger with context
   */
  child(context) {
    return new ChildLogger(this, context);
  }
}

/**
 * Child Logger with inherited context
 */
class ChildLogger {
  constructor(parent, context) {
    this.parent = parent;
    this.context = context;
  }

  debug(message, data, additionalContext = {}) {
    this.parent.debug(
      this.formatMessage(message),
      data,
      { ...this.context, ...additionalContext }
    );
  }

  info(message, data, additionalContext = {}) {
    this.parent.info(
      this.formatMessage(message),
      data,
      { ...this.context, ...additionalContext }
    );
  }

  warn(message, data, additionalContext = {}) {
    this.parent.warn(
      this.formatMessage(message),
      data,
      { ...this.context, ...additionalContext }
    );
  }

  error(message, error, additionalContext = {}) {
    this.parent.error(
      this.formatMessage(message),
      error,
      { ...this.context, ...additionalContext }
    );
  }

  formatMessage(message) {
    return this.context.component 
      ? `[${this.context.component}] ${message}`
      : message;
  }

  group(name) {
    this.parent.group(name);
  }

  groupEnd() {
    this.parent.groupEnd();
  }
}

// Create and export singleton instance
export const logger = new Logger();

// Export for debugging in console
if (typeof window !== 'undefined') {
  window.__logger = logger;
}

export default logger;

