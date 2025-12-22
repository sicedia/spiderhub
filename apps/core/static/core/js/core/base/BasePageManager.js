/**
 * Base Page Manager Class
 * Provides common functionality for all page managers
 * Handles component orchestration and page lifecycle
 * ES6 Module Export
 */

import { BaseComponent } from './BaseComponent.js';
import { CONFIG, EVENTS } from '../constants/config.js';
import { DOMUtils } from '../utils/dom.js';
import { logger } from '../logger/Logger.js';

export class BasePageManager extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    // Create child logger with component context AFTER super() call
    this.logger = logger.child({
      component: this.constructor.name,
      instance: Math.random().toString(36).substr(2, 9)
    });
    
    this.components = new Map();
    this.services = new Map();
    this.isPageReady = false;
    this.pageData = null;
    
    // Call init() manually now that logger is available
    // (BaseComponent deferred it because shouldDeferInit() returns true)
    if (!this.isInitialized) {
      this.init();
    }
  }

  /**
   * Defer init() until after constructor completes
   */
  shouldDeferInit() {
    return true;
  }

  /**
   * Default options for page managers
   */
  getDefaultOptions() {
    return {
      autoInitialize: true,
      enableMobileNavigation: true,
      enableKeyboardShortcuts: false,
      loadingTimeout: 10000
    };
  }

  /**
   * Initialize page manager
   */
  async init() {
    try {
      if (this.logger) {
        this.logger.debug('BasePageManager init started', {
          options: this.options
        });
      }
      
      this.showPageLoading();
      
      // Initialize services first
      await this.initializeServices();
      
      // Load page data
      await this.loadPageData();
      
      // Initialize components
      await this.initializeComponents();
      
      // Bind page-level events
      this.bindPageEvents();
      
      // Setup mobile navigation if enabled
      if (this.options.enableMobileNavigation) {
        this.initializeMobileNavigation();
      }
      
      // Setup keyboard shortcuts if enabled
      if (this.options.enableKeyboardShortcuts) {
        this.initializeKeyboardShortcuts();
      }
      
      this.hidePageLoading();
      this.isPageReady = true;
      
      // Bind events from BaseComponent (don't call super.init() as it was already called in constructor)
      this.bindEvents();
      this.emit('page:ready');
      
    } catch (error) {
      this.handlePageError(error);
    }
  }

  /**
   * Initialize services - to be implemented by child classes
   */
  async initializeServices() {
    // To be implemented by child classes
  }

  /**
   * Load page data - to be implemented by child classes
   */
  async loadPageData() {
    // To be implemented by child classes
  }

  /**
   * Initialize components - to be implemented by child classes
   */
  async initializeComponents() {
    // To be implemented by child classes
  }

  /**
   * Bind page-specific events - to be implemented by child classes
   */
  bindPageEvents() {
    // To be implemented by child classes
  }

  /**
   * Register a component with the page manager
   */
  registerComponent(name, component) {
    if (this.components.has(name)) {
      if (this.logger) {
        this.logger.warn('Component already registered, replacing', {
          componentName: name
        });
      }
      const existingComponent = this.components.get(name);
      if (existingComponent && typeof existingComponent.destroy === 'function') {
        existingComponent.destroy();
      }
    }
    
    this.components.set(name, component);
    this.emit('component:registered', { name, component });
    
    return component;
  }

  /**
   * Get a registered component
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Remove a component
   */
  removeComponent(name) {
    const component = this.components.get(name);
    if (component) {
      if (typeof component.destroy === 'function') {
        component.destroy();
      }
      this.components.delete(name);
      this.emit('component:removed', { name });
    }
  }

  /**
   * Register a service with the page manager
   */
  registerService(name, service) {
    if (this.services.has(name)) {
      if (this.logger) {
        this.logger.warn('Service already registered, replacing', {
          serviceName: name
        });
      }
    }
    
    this.services.set(name, service);
    this.emit('service:registered', { name, service });
    
    return service;
  }

  /**
   * Get a registered service
   */
  getService(name) {
    return this.services.get(name);
  }

  /**
   * Show page loading state
   */
  showPageLoading() {
    const loadingOverlay = DOMUtils.createElement('div', {
      className: 'page-loading-overlay',
      innerHTML: `
        <div class="page-loading-content">
          <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Loading...</span>
          </div>
          <p class="mt-3">Loading page...</p>
        </div>
      `
    });
    
    document.body.appendChild(loadingOverlay);
    
    // Set timeout for loading
    this.loadingTimeout = setTimeout(() => {
      this.handlePageError(new Error('Page loading timeout'));
    }, this.options.loadingTimeout);
  }

  /**
   * Hide page loading state
   */
  hidePageLoading() {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
    
    const loadingOverlay = document.querySelector('.page-loading-overlay');
    if (loadingOverlay) {
      DOMUtils.fadeOut(loadingOverlay).then(() => {
        loadingOverlay.remove();
      });
    }
  }

  /**
   * Handle page-level errors
   */
  handlePageError(error) {
    if (this.logger) {
      this.logger.error('Page error', error, {
        pageName: this.constructor.name
      });
    } else {
      console.error('Page error:', error);
    }
    
    this.hidePageLoading();
    
    // Show error message
    const errorDiv = DOMUtils.createElement('div', {
      className: 'page-error-message alert alert-danger',
      innerHTML: `
        <h4>Page Loading Error</h4>
        <p>${error.message || 'An unexpected error occurred while loading the page.'}</p>
        <button type="button" class="btn btn-primary" onclick="window.location.reload()">
          Reload Page
        </button>
      `
    });
    
    // Insert at the beginning of the page
    const main = document.querySelector('main') || document.body;
    main.insertBefore(errorDiv, main.firstChild);
    
    this.emit('page:error', { error });
  }

  /**
   * Initialize mobile navigation
   */
  initializeMobileNavigation() {
    const mobileToggle = DOMUtils.getElement('.mobile-menu-toggle');
    const mobileNav = DOMUtils.getElement('.mobile-nav-overlay');
    
    if (mobileToggle && mobileNav) {
      let isOpen = false;
      
      const toggleMobileNav = (e) => {
        e.preventDefault();
        isOpen = !isOpen;
        
        DOMUtils.toggleClass(mobileToggle, 'active');
        DOMUtils.toggleClass(mobileNav, 'active');
        document.body.style.overflow = isOpen ? 'hidden' : '';
      };
      
      this.addEventListener(mobileToggle, 'click', toggleMobileNav);
      
      // Close on link click
      const navLinks = mobileNav.querySelectorAll('a');
      navLinks.forEach(link => {
        this.addEventListener(link, 'click', () => {
          isOpen = false;
          DOMUtils.removeClass(mobileToggle, 'active');
          DOMUtils.removeClass(mobileNav, 'active');
          document.body.style.overflow = '';
        });
      });
      
      // Close on outside click
      this.addEventListener(mobileNav, 'click', (e) => {
        if (e.target === mobileNav) {
          toggleMobileNav(e);
        }
      });
    }
  }

  /**
   * Initialize keyboard shortcuts
   */
  initializeKeyboardShortcuts() {
    this.addEventListener(document, 'keydown', (e) => {
      // Escape key - close modals, overlays, etc.
      if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      }
      
      // Ctrl/Cmd + F - focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        this.handleSearchShortcut(e);
      }
      
      // Allow child classes to handle additional shortcuts
      this.handleKeyboardShortcut(e);
    });
  }

  /**
   * Handle escape key press
   */
  handleEscapeKey(e) {
    // Close any open modals
    const openModal = document.querySelector('.modal.show');
    if (openModal) {
      const modalComponent = this.getComponent('modalManager');
      if (modalComponent && typeof modalComponent.hide === 'function') {
        modalComponent.hide();
        e.preventDefault();
      }
    }
    
    // Close mobile navigation
    const mobileNav = document.querySelector('.mobile-nav-overlay.active');
    if (mobileNav) {
      const mobileToggle = document.querySelector('.mobile-menu-toggle.active');
      if (mobileToggle) {
        mobileToggle.click();
        e.preventDefault();
      }
    }
  }

  /**
   * Handle search shortcut
   */
  handleSearchShortcut(e) {
    const searchInput = document.querySelector('input[type="search"], .search-input');
    if (searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  }

  /**
   * Handle additional keyboard shortcuts - to be implemented by child classes
   */
  handleKeyboardShortcut(e) {
    // To be implemented by child classes
  }

  /**
   * Refresh page data and components
   */
  async refresh() {
    try {
      this.showPageLoading();
      
      // Reload page data
      await this.loadPageData();
      
      // Refresh all components
      for (const [name, component] of this.components) {
        if (typeof component.refresh === 'function') {
          await component.refresh();
        }
      }
      
      this.hidePageLoading();
      this.emit('page:refreshed');
      
    } catch (error) {
      this.handlePageError(error);
    }
  }

  /**
   * Cleanup page manager and all components
   */
  destroy() {
    // Destroy all components
    for (const [name, component] of this.components) {
      if (typeof component.destroy === 'function') {
        component.destroy();
      }
    }
    this.components.clear();
    
    // Clear services
    this.services.clear();
    
    // Clear any timeouts
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    
    // Reset body overflow
    document.body.style.overflow = '';
    
    super.destroy();
  }

  /**
   * Get page state for debugging
   */
  getPageState() {
    return {
      isReady: this.isPageReady,
      components: Array.from(this.components.keys()),
      services: Array.from(this.services.keys()),
      data: this.pageData
    };
  }
}

// Default export
export default BasePageManager;
