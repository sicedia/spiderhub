/**
 * Event Handling Utilities
 * Centralized event management and custom event system
 * ES6 Module Export
 */

import { CONFIG } from '../constants/config.js';

export class EventUtils {
  /**
   * Global event bus for cross-component communication
   */
  static eventBus = new EventTarget();

  /**
   * Emit a global event
   */
  static emit(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });
    
    this.eventBus.dispatchEvent(event);
    return event;
  }

  /**
   * Listen to global events
   */
  static on(eventName, handler) {
    this.eventBus.addEventListener(eventName, handler);
    
    // Return cleanup function
    return () => this.eventBus.removeEventListener(eventName, handler);
  }

  /**
   * Listen to global events once
   */
  static once(eventName, handler) {
    const onceHandler = (event) => {
      handler(event);
      this.eventBus.removeEventListener(eventName, onceHandler);
    };
    
    this.eventBus.addEventListener(eventName, onceHandler);
    
    // Return cleanup function
    return () => this.eventBus.removeEventListener(eventName, onceHandler);
  }

  /**
   * Remove global event listener
   */
  static off(eventName, handler) {
    this.eventBus.removeEventListener(eventName, handler);
  }

  /**
   * Create a debounced event handler
   */
  static debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Create a throttled event handler
   */
  static throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Add event listener with automatic cleanup tracking
   */
  static addListener(element, event, handler, options = {}) {
    const boundHandler = typeof handler === 'function' ? handler : handler.bind(this);
    element.addEventListener(event, boundHandler, options);
    
    // Return cleanup function
    return () => element.removeEventListener(event, boundHandler, options);
  }

  /**
   * Add multiple event listeners to an element
   */
  static addListeners(element, events) {
    const cleanupFunctions = [];
    
    Object.entries(events).forEach(([event, handler]) => {
      const cleanup = this.addListener(element, event, handler);
      cleanupFunctions.push(cleanup);
    });
    
    // Return cleanup function for all listeners
    return () => cleanupFunctions.forEach(cleanup => cleanup());
  }

  /**
   * Delegate event handling to parent element
   */
  static delegate(parent, selector, event, handler) {
    const delegatedHandler = (e) => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, e);
      }
    };
    
    parent.addEventListener(event, delegatedHandler);
    
    // Return cleanup function
    return () => parent.removeEventListener(event, delegatedHandler);
  }

  /**
   * Wait for an event to occur
   */
  static waitForEvent(element, eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        element.removeEventListener(eventName, handler);
        reject(new Error(`Event '${eventName}' timeout after ${timeout}ms`));
      }, timeout);
      
      const handler = (event) => {
        clearTimeout(timeoutId);
        element.removeEventListener(eventName, handler);
        resolve(event);
      };
      
      element.addEventListener(eventName, handler);
    });
  }

  /**
   * Create a custom event with standardized format
   */
  static createEvent(eventName, detail = {}, options = {}) {
    const defaultOptions = {
      bubbles: true,
      cancelable: true,
      composed: false
    };
    
    return new CustomEvent(eventName, {
      detail,
      ...defaultOptions,
      ...options
    });
  }

  /**
   * Dispatch event on element
   */
  static dispatch(element, eventName, detail = {}, options = {}) {
    const event = this.createEvent(eventName, detail, options);
    element.dispatchEvent(event);
    return event;
  }

  /**
   * Check if event is prevented
   */
  static isPrevented(event) {
    return event.defaultPrevented;
  }

  /**
   * Prevent event default and stop propagation
   */
  static stop(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle keyboard events with key combinations
   */
  static onKeyCombo(element, combo, handler) {
    const keys = combo.toLowerCase().split('+');
    
    const keyHandler = (e) => {
      const pressedKeys = [];
      
      if (e.ctrlKey) pressedKeys.push('ctrl');
      if (e.altKey) pressedKeys.push('alt');
      if (e.shiftKey) pressedKeys.push('shift');
      if (e.metaKey) pressedKeys.push('meta');
      
      pressedKeys.push(e.key.toLowerCase());
      
      // Check if all required keys are pressed
      const matches = keys.every(key => pressedKeys.includes(key));
      
      if (matches) {
        handler(e);
      }
    };
    
    element.addEventListener('keydown', keyHandler);
    
    // Return cleanup function
    return () => element.removeEventListener('keydown', keyHandler);
  }

  /**
   * Handle touch events with gesture recognition
   */
  static onSwipe(element, handler, options = {}) {
    const defaultOptions = {
      threshold: 50,
      timeout: 300
    };
    
    const config = { ...defaultOptions, ...options };
    let startX, startY, startTime;
    
    const touchStart = (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };
    
    const touchEnd = (e) => {
      if (!startX || !startY) return;
      
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;
      
      if (deltaTime > config.timeout) return;
      
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (Math.max(absX, absY) < config.threshold) return;
      
      let direction;
      if (absX > absY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
      
      handler({
        direction,
        deltaX,
        deltaY,
        deltaTime,
        originalEvent: e
      });
      
      // Reset
      startX = startY = startTime = null;
    };
    
    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchend', touchEnd, { passive: true });
    
    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', touchStart);
      element.removeEventListener('touchend', touchEnd);
    };
  }

  /**
   * Handle resize events with debouncing
   */
  static onResize(handler, delay = CONFIG.ANIMATION.RESIZE_DEBOUNCE_DELAY) {
    const debouncedHandler = this.debounce(handler, delay);
    window.addEventListener('resize', debouncedHandler);
    
    // Return cleanup function
    return () => window.removeEventListener('resize', debouncedHandler);
  }

  /**
   * Handle scroll events with throttling
   */
  static onScroll(element, handler, delay = 16) {
    const throttledHandler = this.throttle(handler, delay);
    element.addEventListener('scroll', throttledHandler, { passive: true });
    
    // Return cleanup function
    return () => element.removeEventListener('scroll', throttledHandler);
  }
}

// Default export
export default EventUtils;
