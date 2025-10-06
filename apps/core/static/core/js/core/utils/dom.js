/**
 * DOM Utilities
 * Centralized DOM manipulation and query functions
 * ES6 Module Export
 */

import { CONFIG } from '../constants/config.js';

export class DOMUtils {
  /**
   * Cache DOM elements for better performance
   */
  static elementCache = new Map();

  /**
   * Get element with caching
   */
  static getElement(selector, useCache = true) {
    if (useCache && this.elementCache.has(selector)) {
      return this.elementCache.get(selector);
    }

    const element = document.querySelector(selector);
    if (useCache && element) {
      this.elementCache.set(selector, element);
    }

    return element;
  }

  /**
   * Get multiple elements
   */
  static getElements(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Clear element cache
   */
  static clearCache() {
    this.elementCache.clear();
  }

  /**
   * Create element with attributes and content
   */
  static createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className' || key === 'class') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });

    if (content) {
      if (typeof content === 'string') {
        element.innerHTML = content;
      } else if (content instanceof Node) {
        element.appendChild(content);
      }
    }

    return element;
  }

  /**
   * Add class with animation support
   */
  static addClass(element, className, animated = false) {
    if (!element) return;

    if (animated) {
      element.style.transition = `all ${CONFIG.ANIMATION.FADE_DURATION}ms ease`;
    }
    
    element.classList.add(className);
  }

  /**
   * Remove class with animation support
   */
  static removeClass(element, className, animated = false) {
    if (!element) return;

    if (animated) {
      element.style.transition = `all ${CONFIG.ANIMATION.FADE_DURATION}ms ease`;
    }
    
    element.classList.remove(className);
  }

  /**
   * Toggle class with animation support
   */
  static toggleClass(element, className, animated = false) {
    if (!element) return;

    if (animated) {
      element.style.transition = `all ${CONFIG.ANIMATION.FADE_DURATION}ms ease`;
    }
    
    element.classList.toggle(className);
  }

  /**
   * Show element with fade in animation
   */
  static fadeIn(element, duration = CONFIG.ANIMATION.FADE_DURATION) {
    if (!element) return Promise.resolve();

    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.display = '';
      element.classList.remove('hidden');

      requestAnimationFrame(() => {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '1';

        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, duration);
      });
    });
  }

  /**
   * Hide element with fade out animation
   */
  static fadeOut(element, duration = CONFIG.ANIMATION.FADE_DURATION) {
    if (!element) return Promise.resolve();

    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease`;
      element.style.opacity = '0';

      setTimeout(() => {
        element.style.display = 'none';
        element.style.transition = '';
        resolve();
      }, duration);
    });
  }

  /**
   * Slide down animation
   */
  static slideDown(element, duration = CONFIG.ANIMATION.SLIDE_DURATION) {
    if (!element) return Promise.resolve();

    return new Promise(resolve => {
      const height = element.scrollHeight;
      element.style.height = '0px';
      element.style.overflow = 'hidden';
      element.style.display = '';
      element.classList.remove('hidden');

      requestAnimationFrame(() => {
        element.style.transition = `height ${duration}ms ease`;
        element.style.height = `${height}px`;

        setTimeout(() => {
          element.style.height = '';
          element.style.overflow = '';
          element.style.transition = '';
          resolve();
        }, duration);
      });
    });
  }

  /**
   * Slide up animation
   */
  static slideUp(element, duration = CONFIG.ANIMATION.SLIDE_DURATION) {
    if (!element) return Promise.resolve();

    return new Promise(resolve => {
      const height = element.scrollHeight;
      element.style.height = `${height}px`;
      element.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        element.style.transition = `height ${duration}ms ease`;
        element.style.height = '0px';

        setTimeout(() => {
          element.style.display = 'none';
          element.style.height = '';
          element.style.overflow = '';
          element.style.transition = '';
          resolve();
        }, duration);
      });
    });
  }

  /**
   * Check if element is in viewport
   */
  static isInViewport(element, threshold = 0) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= windowHeight + threshold &&
      rect.right <= windowWidth + threshold
    );
  }

  /**
   * Scroll to element smoothly
   */
  static scrollToElement(element, options = {}) {
    if (!element) return;

    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    };

    element.scrollIntoView({ ...defaultOptions, ...options });
  }

  /**
   * Get element position relative to document
   */
  static getElementPosition(element) {
    if (!element) return { top: 0, left: 0 };

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.pageYOffset,
      left: rect.left + window.pageXOffset,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * Check if device is mobile
   */
  static isMobile() {
    return window.innerWidth <= CONFIG.BREAKPOINTS.MOBILE;
  }

  /**
   * Check if device is tablet
   */
  static isTablet() {
    return window.innerWidth > CONFIG.BREAKPOINTS.MOBILE && 
           window.innerWidth <= CONFIG.BREAKPOINTS.TABLET;
  }

  /**
   * Check if device is desktop
   */
  static isDesktop() {
    return window.innerWidth > CONFIG.BREAKPOINTS.TABLET;
  }

  /**
   * Debounced resize observer
   */
  static onResize(callback, delay = CONFIG.ANIMATION.RESIZE_DEBOUNCE_DELAY) {
    let timeout;
    const debouncedCallback = () => {
      clearTimeout(timeout);
      timeout = setTimeout(callback, delay);
    };

    window.addEventListener('resize', debouncedCallback);
    
    // Return cleanup function
    return () => window.removeEventListener('resize', debouncedCallback);
  }

  /**
   * Create intersection observer with default options
   */
  static createIntersectionObserver(callback, options = {}) {
    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '0px'
    };

    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
  }

  /**
   * Debounce utility function
   */
  static debounce(func, wait) {
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
   * Throttle utility function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Default export
export default DOMUtils;
