/**
 * Event Bus - Centralized Event Management System
 * Provides type-safe, memory-leak-free event handling across the application
 * 
 * Features:
 * - Centralized event management
 * - Automatic cleanup to prevent memory leaks
 * - Event namespacing
 * - Wildcard event listeners
 * - Event history for debugging
 * - Integration with Logger
 * 
 * @author SpiderHub Team
 * @version 2.0
 */

import { logger } from '../logger/Logger.js';

// Create dedicated logger for EventBus
const eventLogger = logger.child({ component: 'EventBus' });

/**
 * Event Bus Class
 * Implements a publish-subscribe pattern for application-wide events
 */
class EventBus {
  constructor() {
    this.events = new Map(); // event name -> Set of callbacks
    this.wildcardListeners = new Set(); // Listeners for all events
    this.eventHistory = []; // For debugging
    this.maxHistorySize = 100;
    this.isEnabled = true;
    
    eventLogger.info('EventBus initialized');
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} context - Context object (for tracking and cleanup)
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback, context = null) {
    if (!this.isEnabled) {
      eventLogger.warn('EventBus is disabled, subscription ignored', { eventName });
      return () => {};
    }

    if (typeof callback !== 'function') {
      eventLogger.error('Callback must be a function', new Error('Invalid callback'), {
        eventName,
        callbackType: typeof callback
      });
      return () => {};
    }

    // Handle wildcard subscriptions
    if (eventName === '*') {
      this.wildcardListeners.add(callback);
      eventLogger.debug('Wildcard listener added', {
        listenersCount: this.wildcardListeners.size,
        context: context?.constructor?.name
      });
      
      return () => this.wildcardListeners.delete(callback);
    }

    // Create event listeners Set if it doesn't exist
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    // Add callback with context info
    const listener = {
      callback,
      context,
      contextName: context?.constructor?.name || 'anonymous'
    };
    
    this.events.get(eventName).add(listener);

    eventLogger.debug('Event listener added', {
      eventName,
      listenersCount: this.events.get(eventName).size,
      context: listener.contextName
    });

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event once
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} context - Context object
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback, context = null) {
    const onceWrapper = (data) => {
      unsubscribe();
      callback(data);
    };

    const unsubscribe = this.on(eventName, onceWrapper, context);
    return unsubscribe;
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Callback to remove
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) {
      return;
    }

    const listeners = this.events.get(eventName);
    
    // Find and remove listener by callback
    for (const listener of listeners) {
      if (listener.callback === callback) {
        listeners.delete(listener);
        
        eventLogger.debug('Event listener removed', {
          eventName,
          remainingListeners: listeners.size,
          context: listener.contextName
        });
        
        break;
      }
    }

    // Clean up empty event sets
    if (listeners.size === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName - Name of the event
   */
  offAll(eventName) {
    if (this.events.has(eventName)) {
      const count = this.events.get(eventName).size;
      this.events.delete(eventName);
      
      eventLogger.info('All listeners removed for event', {
        eventName,
        removedCount: count
      });
    }
  }

  /**
   * Remove all listeners from a specific context
   * Useful for component cleanup
   * @param {Object} context - Context object to remove listeners for
   */
  offContext(context) {
    let removedCount = 0;

    this.events.forEach((listeners, eventName) => {
      const listenersArray = Array.from(listeners);
      
      listenersArray.forEach(listener => {
        if (listener.context === context) {
          listeners.delete(listener);
          removedCount++;
        }
      });

      // Clean up empty sets
      if (listeners.size === 0) {
        this.events.delete(eventName);
      }
    });

    if (removedCount > 0) {
      eventLogger.info('Context listeners removed', {
        context: context?.constructor?.name || 'anonymous',
        removedCount
      });
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - Name of the event
   * @param {*} data - Data to pass to listeners
   */
  emit(eventName, data = {}) {
    if (!this.isEnabled) {
      return;
    }

    const startTime = Date.now();

    // Add to history for debugging
    this.addToHistory(eventName, data);

    // Log event emission
    eventLogger.debug(`Event emitted: ${eventName}`, {
      eventName,
      hasData: Object.keys(data).length > 0,
      dataKeys: Object.keys(data)
    });

    // Call wildcard listeners first
    this.wildcardListeners.forEach(callback => {
      try {
        callback({ eventName, data });
      } catch (error) {
        eventLogger.error('Wildcard listener error', error, {
          eventName
        });
      }
    });

    // Call specific event listeners
    if (this.events.has(eventName)) {
      const listeners = Array.from(this.events.get(eventName));
      let errorCount = 0;

      listeners.forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          errorCount++;
          eventLogger.error('Event listener error', error, {
            eventName,
            context: listener.contextName
          });
        }
      });

      const duration = Date.now() - startTime;
      
      eventLogger.debug('Event processing completed', {
        eventName,
        listenersCount: listeners.length,
        errors: errorCount,
        duration: `${duration}ms`
      });
    }
  }

  /**
   * Add event to history for debugging
   * @private
   */
  addToHistory(eventName, data) {
    this.eventHistory.push({
      eventName,
      data,
      timestamp: Date.now(),
      date: new Date().toISOString()
    });

    // Keep history size manageable
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   * @param {string} eventName - Optional: filter by event name
   * @returns {Array} Event history
   */
  getHistory(eventName = null) {
    if (eventName) {
      return this.eventHistory.filter(event => event.eventName === eventName);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
    eventLogger.info('Event history cleared');
  }

  /**
   * Get statistics about current listeners
   * @returns {Object} Statistics object
   */
  getStats() {
    const stats = {
      totalEvents: this.events.size,
      totalListeners: 0,
      wildcardListeners: this.wildcardListeners.size,
      eventBreakdown: {},
      historySize: this.eventHistory.length
    };

    this.events.forEach((listeners, eventName) => {
      stats.totalListeners += listeners.size;
      stats.eventBreakdown[eventName] = {
        listeners: listeners.size,
        contexts: Array.from(listeners).map(l => l.contextName)
      };
    });

    return stats;
  }

  /**
   * Log current EventBus statistics
   */
  logStats() {
    const stats = this.getStats();
    
    eventLogger.group('EventBus Statistics');
    eventLogger.info('Current state', stats);
    eventLogger.groupEnd();
    
    return stats;
  }

  /**
   * Enable or disable the event bus
   * @param {boolean} enabled - Whether to enable the event bus
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    eventLogger.info(`EventBus ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear all listeners (use with caution!)
   */
  clear() {
    const stats = this.getStats();
    
    this.events.clear();
    this.wildcardListeners.clear();
    
    eventLogger.warn('All event listeners cleared', {
      clearedEvents: stats.totalEvents,
      clearedListeners: stats.totalListeners
    });
  }

  /**
   * Check if an event has listeners
   * @param {string} eventName - Event name to check
   * @returns {boolean} True if event has listeners
   */
  hasListeners(eventName) {
    return this.events.has(eventName) && this.events.get(eventName).size > 0;
  }

  /**
   * Get listener count for an event
   * @param {string} eventName - Event name
   * @returns {number} Number of listeners
   */
  getListenerCount(eventName) {
    return this.events.has(eventName) ? this.events.get(eventName).size : 0;
  }

  /**
   * Wait for an event (returns a Promise)
   * @param {string} eventName - Event to wait for
   * @param {number} timeout - Timeout in ms (optional)
   * @returns {Promise} Promise that resolves with event data
   */
  waitFor(eventName, timeout = null) {
    return new Promise((resolve, reject) => {
      let timeoutId = null;
      
      const unsubscribe = this.once(eventName, (data) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(data);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`Timeout waiting for event: ${eventName}`));
        }, timeout);
      }
    });
  }
}

// Create and export singleton instance
export const eventBus = new EventBus();

// Export class for testing
export { EventBus };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.__eventBus = eventBus;
  eventLogger.debug('EventBus available globally as window.__eventBus');
}

// Default export
export default eventBus;
