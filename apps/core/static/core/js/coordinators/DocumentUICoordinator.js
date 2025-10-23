/**
 * DocumentUICoordinator
 * Coordinates UI features (tooltips, lazy loading, analytics tracking)
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { Tooltip } from '../components/ui/Tooltip.js';
import { SourceFilesManager } from '../components/ui/SourceFilesManager.js';

export class DocumentUICoordinator {
  constructor(documentId, options = {}) {
    this.logger = logger.child({
      component: 'DocumentUICoordinator'
    });
    
    this.documentId = documentId;
    this.options = {
      enableTooltips: true,
      enableLazyLoading: true,
      enableAnalytics: true,
      scrollTrackingInterval: 250,
      ...options
    };
    
    this.tooltips = [];
    this.imageObserver = null;
    this.sourceFilesManager = null;
    this.userInteractions = {
      viewStartTime: Date.now(),
      scrollDepth: 0,
      maxScrollDepth: 0
    };
    
    this.logger.debug('DocumentUICoordinator initialized', {
      documentId: this.documentId
    });
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing DocumentUICoordinator');
    
    if (this.options.enableTooltips) {
      this.initializeTooltips();
    }
    
    if (this.options.enableLazyLoading) {
      this.initializeLazyLoading();
    }
    
    if (this.options.enableAnalytics) {
      this.initializeAnalytics();
    }
    
    // Initialize source files manager
    this.initializeSourceFilesManager();
    
    this.setupEventListeners();
    
    this.logger.info('DocumentUICoordinator initialized successfully');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for content ready to initialize UI features
    eventBus.on(EVENTS.DOCUMENT_CONTENT_READY, this.handleContentReady.bind(this), this);
    
    this.logger.debug('Event listeners configured');
  }

  /**
   * Handle document content ready
   */
  handleContentReady() {
    this.logger.debug('Document content ready, re-initializing UI features');
    
    // Re-initialize tooltips and lazy loading for new content
    if (this.options.enableTooltips) {
      this.initializeTooltips();
    }
    
    if (this.options.enableLazyLoading) {
      this.initializeLazyLoading();
    }
  }

  /**
   * Initialize tooltips
   */
  initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    if (tooltipElements.length === 0) {
      this.logger.debug('No tooltip elements found');
      return;
    }
    
    this.logger.debug('Initializing tooltips', { count: tooltipElements.length });
    
    // Clear existing tooltips
    this.tooltips.forEach(tooltip => tooltip.destroy && tooltip.destroy());
    this.tooltips = [];
    
    // Create new tooltips
    tooltipElements.forEach(element => {
      try {
        const tooltip = new Tooltip(element, {
          position: element.getAttribute('data-tooltip-position') || 'top',
          theme: element.getAttribute('data-tooltip-theme') || 'dark'
        });
        this.tooltips.push(tooltip);
      } catch (error) {
        this.logger.warn('Failed to create tooltip', error);
      }
    });
    
    this.logger.info('Tooltips initialized', { count: this.tooltips.length });
  }

  /**
   * Initialize lazy loading for images
   */
  initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if (images.length === 0) {
      this.logger.debug('No lazy-load images found');
      return;
    }
    
    this.logger.debug('Initializing lazy loading', { imagesCount: images.length });
    
    // Disconnect existing observer
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
    
    // Create intersection observer
    this.imageObserver = new IntersectionObserver(
      (entries) => this.handleImageIntersection(entries),
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );
    
    // Observe all lazy-load images
    images.forEach(img => this.imageObserver.observe(img));
    
    this.logger.info('Lazy loading initialized', { imagesCount: images.length });
  }

  /**
   * Handle image intersection (lazy loading)
   */
  handleImageIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          this.imageObserver.unobserve(img);
          
          this.logger.debug('Image lazy loaded', { src });
          
          // Emit event
          eventBus.emit(EVENTS.IMAGE_LOADED, {
            src: src,
            documentId: this.documentId
          });
        }
      }
    });
  }

  /**
   * Initialize source files manager
   */
  initializeSourceFilesManager() {
    const sourceFilesContainer = document.querySelector('.source-files-card');
    
    if (!sourceFilesContainer) {
      this.logger.debug('Source files card not found, skipping initialization');
      return;
    }
    
    try {
      this.sourceFilesManager = new SourceFilesManager(sourceFilesContainer, {
        enableAnalytics: this.options.enableAnalytics,
        enableCopyToClipboard: true,
        enableDownloadTracking: true,
        enableExternalLinkTracking: true,
        showFileSizeTooltips: true,
        showDownloadProgress: true
      });
      
      this.logger.info('SourceFilesManager initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize SourceFilesManager', error);
    }
  }

  /**
   * Initialize analytics tracking
   */
  initializeAnalytics() {
    this.logger.debug('Initializing analytics');
    
    // Track initial page view
    this.trackPageView();
    
    // Track scroll depth
    this.initializeScrollTracking();
    
    // Track time on page before leaving
    window.addEventListener('beforeunload', () => {
      this.trackTimeOnPage();
    });
    
    this.logger.info('Analytics initialized');
  }

  /**
   * Track page view
   */
  trackPageView() {
    eventBus.emit(EVENTS.DOCUMENT_VIEWED, {
      documentId: this.documentId,
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer
    });
    
    this.logger.info('Page view tracked', { documentId: this.documentId });
  }

  /**
   * Initialize scroll depth tracking
   */
  initializeScrollTracking() {
    const trackScroll = () => {
      const scrollTop = window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (documentHeight === 0) {
        this.userInteractions.scrollDepth = 100;
        this.userInteractions.maxScrollDepth = 100;
        return;
      }
      
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);
      this.userInteractions.scrollDepth = scrollDepth;
      
      // Track max scroll depth
      if (scrollDepth > this.userInteractions.maxScrollDepth) {
        this.userInteractions.maxScrollDepth = scrollDepth;
        
        // Emit milestone events
        if (scrollDepth >= 25 && scrollDepth < 50) {
          eventBus.emit(EVENTS.SCROLL_MILESTONE, {
            documentId: this.documentId,
            milestone: 25
          });
        } else if (scrollDepth >= 50 && scrollDepth < 75) {
          eventBus.emit(EVENTS.SCROLL_MILESTONE, {
            documentId: this.documentId,
            milestone: 50
          });
        } else if (scrollDepth >= 75 && scrollDepth < 100) {
          eventBus.emit(EVENTS.SCROLL_MILESTONE, {
            documentId: this.documentId,
            milestone: 75
          });
        } else if (scrollDepth === 100) {
          eventBus.emit(EVENTS.SCROLL_MILESTONE, {
            documentId: this.documentId,
            milestone: 100
          });
        }
      }
    };
    
    // Throttle scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      
      scrollTimeout = setTimeout(() => {
        trackScroll();
        scrollTimeout = null;
      }, this.options.scrollTrackingInterval);
    });
    
    this.logger.debug('Scroll tracking initialized');
  }

  /**
   * Track time spent on page
   */
  trackTimeOnPage() {
    const timeOnPage = Date.now() - this.userInteractions.viewStartTime;
    
    eventBus.emit(EVENTS.DOCUMENT_TIME_TRACKED, {
      documentId: this.documentId,
      timeOnPage: timeOnPage,
      timeOnPageMinutes: Math.round(timeOnPage / 60000),
      scrollDepth: this.userInteractions.maxScrollDepth
    });
    
    this.logger.info('Time on page tracked', {
      documentId: this.documentId,
      timeOnPageSeconds: Math.round(timeOnPage / 1000),
      scrollDepth: this.userInteractions.maxScrollDepth
    });
  }

  /**
   * Get user interaction statistics
   */
  getInteractionStats() {
    const timeOnPage = Date.now() - this.userInteractions.viewStartTime;
    
    const stats = {
      timeOnPage: timeOnPage,
      timeOnPageMinutes: Math.round(timeOnPage / 60000),
      scrollDepth: this.userInteractions.scrollDepth,
      maxScrollDepth: this.userInteractions.maxScrollDepth
    };
    
    // Add source files statistics if available
    if (this.sourceFilesManager) {
      stats.sourceFiles = this.sourceFilesManager.getInteractionStats();
    }
    
    return stats;
  }

  /**
   * Reset interaction tracking
   */
  resetTracking() {
    this.userInteractions = {
      viewStartTime: Date.now(),
      scrollDepth: 0,
      maxScrollDepth: 0
    };
    
    this.logger.debug('Interaction tracking reset');
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying DocumentUICoordinator');
    
    // Destroy tooltips
    this.tooltips.forEach(tooltip => {
      if (tooltip.destroy) {
        tooltip.destroy();
      }
    });
    this.tooltips = [];
    
    // Disconnect image observer
    if (this.imageObserver) {
      this.imageObserver.disconnect();
      this.imageObserver = null;
    }
    
    // Destroy source files manager
    if (this.sourceFilesManager) {
      this.sourceFilesManager.destroy();
      this.sourceFilesManager = null;
    }
    
    // Track final time on page
    if (this.options.enableAnalytics) {
      this.trackTimeOnPage();
    }
    
    // Remove event listeners
    eventBus.offContext(this);
    
    this.logger.debug('DocumentUICoordinator destroyed');
  }
}

export default DocumentUICoordinator;

