/**
 * Base Component Class
 * Provides common functionality for all UI components
 * Uses @js/ alias for clean imports
 * 
 * V2: Integrated with EventBus for centralized event management
 */

import { CONFIG, EVENTS } from '../constants/config.js';
import { DOMUtils } from '../utils/dom.js';
import { eventBus } from '../events/EventBus.js';

export class BaseComponent {
  constructor(element, options = {}) {
    if (!element) {
      throw new Error('Element is required for component initialization');
    }
    
    this.element = element;
    this.options = { ...this.getDefaultOptions(), ...options };
    this.eventListeners = new Map(); // For DOM event listeners
    this.eventBusUnsubscribers = []; // For EventBus subscriptions
    this.isInitialized = false;
    
    this.init();
  }

  /**
   * Override this method in child classes to provide default options
   */
  getDefaultOptions() {
    return {};
  }

  /**
   * Initialize the component
   * Override this method in child classes
   */
  init() {
    this.bindEvents();
    this.isInitialized = true;
  }

  /**
   * Bind event listeners
   * Override this method in child classes
   */
  bindEvents() {
    // To be implemented by child classes
  }

  /**
   * Add event listener with automatic cleanup tracking
   */
  addEventListener(element, event, handler, options = {}) {
    const boundHandler = handler.bind(this);
    element.addEventListener(event, boundHandler, options);
    
    // Track for cleanup
    const key = `${element.constructor.name}-${event}-${Date.now()}`;
    this.eventListeners.set(key, {
      element,
      event,
      handler: boundHandler,
      options
    });
    
    return key;
  }

  /**
   * Remove specific event listener
   */
  removeEventListener(key) {
    const listener = this.eventListeners.get(key);
    if (listener) {
      listener.element.removeEventListener(
        listener.event, 
        listener.handler, 
        listener.options
      );
      this.eventListeners.delete(key);
    }
  }

  /**
   * Emit custom event using EventBus
   * V2: Now uses centralized EventBus instead of CustomEvent
   */
  emit(eventName, detail = {}) {
    eventBus.emit(eventName, detail);
  }

  /**
   * Listen for events using EventBus
   * V2: Now uses centralized EventBus with automatic cleanup
   */
  on(eventName, handler) {
    const unsubscribe = eventBus.on(eventName, handler, this);
    this.eventBusUnsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Listen for an event once using EventBus
   */
  once(eventName, handler) {
    const unsubscribe = eventBus.once(eventName, handler, this);
    this.eventBusUnsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Show the component
   */
  show() {
    this.element.style.display = '';
    this.element.classList.remove('hidden');
    this.emit('component:shown');
  }

  /**
   * Hide the component
   */
  hide() {
    this.element.classList.add('hidden');
    this.emit('component:hidden');
  }

  /**
   * Toggle component visibility
   */
  toggle() {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if component is visible
   */
  isVisible() {
    return !this.element.classList.contains('hidden') && 
           this.element.style.display !== 'none';
  }

  /**
   * Enable the component
   */
  enable() {
    this.element.classList.remove('disabled');
    this.element.removeAttribute('disabled');
    this.emit('component:enabled');
  }

  /**
   * Disable the component
   */
  disable() {
    this.element.classList.add('disabled');
    this.element.setAttribute('disabled', 'true');
    this.emit('component:disabled');
  }

  /**
   * Check if component is enabled
   */
  isEnabled() {
    return !this.element.classList.contains('disabled') && 
           !this.element.hasAttribute('disabled');
  }

  /**
   * Update component options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.emit('component:optionsUpdated', { options: this.options });
  }

  /**
   * Cleanup component resources
   * V2: Now includes EventBus cleanup
   */
  destroy() {
    // Emit destroyed event before cleanup
    this.emit('component:destroyed');
    
    // Remove all DOM event listeners
    this.eventListeners.forEach((listener, key) => {
      this.removeEventListener(key);
    });
    
    // Cleanup EventBus subscriptions (context-based cleanup)
    eventBus.offContext(this);
    
    // Also unsubscribe individual listeners
    this.eventBusUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventBusUnsubscribers = [];
    
    this.isInitialized = false;
  }

  /**
   * Utility method to find elements within component
   */
  find(selector) {
    return this.element.querySelector(selector);
  }

  /**
   * Utility method to find all elements within component
   */
  findAll(selector) {
    return this.element.querySelectorAll(selector);
  }

  /**
   * Debounce utility method
   */
  debounce(func, wait) {
    return DOMUtils.debounce(func, wait);
  }

  /**
   * Throttle utility method
   */
  throttle(func, limit) {
    return DOMUtils.throttle(func, limit);
  }
}

// Default export
export default BaseComponent;
