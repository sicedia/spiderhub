/**
 * NavigationCoordinator
 * Coordinates document navigation (TOC, scroll spy, smooth scrolling)
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';

export class NavigationCoordinator {
  constructor(options = {}) {
    this.logger = logger.child({
      component: 'NavigationCoordinator'
    });
    
    this.options = {
      scrollSpyOffset: 100,
      smoothScroll: true,
      tocSelector: '.table-of-contents',
      contentSelector: '.document-content',
      ...options
    };
    
    this.headings = [];
    this.tocLinks = [];
    this.scrollSpyObserver = null;
    this.sectionsViewed = new Set();
    
    this.logger.debug('NavigationCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing NavigationCoordinator');
    
    this.setupEventListeners();
    
    this.logger.info('NavigationCoordinator initialized successfully');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for document content ready
    eventBus.on(EVENTS.DOCUMENT_CONTENT_READY, this.handleContentReady.bind(this), this);
    
    this.logger.debug('Event listeners configured');
  }

  /**
   * Handle document content ready event
   */
  handleContentReady() {
    this.logger.debug('Document content ready, building navigation');
    
    this.buildTableOfContents();
    this.initializeScrollSpy();
    
    eventBus.emit(EVENTS.NAVIGATION_READY);
  }

  /**
   * Build table of contents
   */
  buildTableOfContents() {
    const tocContainer = DOMUtils.getElement(this.options.tocSelector);
    const contentContainer = DOMUtils.getElement(this.options.contentSelector);
    
    if (!tocContainer || !contentContainer) {
      this.logger.warn('TOC container or content container not found');
      return;
    }

    // Get all headings
    this.headings = Array.from(contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    
    if (this.headings.length === 0) {
      this.logger.debug('No headings found for TOC');
      return;
    }

    this.logger.debug('Building TOC', { headingsCount: this.headings.length });

    // Clear existing TOC
    tocContainer.innerHTML = '';

    // Create TOC list
    const tocList = this.createTOCList();
    tocContainer.appendChild(tocList);

    // Setup smooth scrolling
    if (this.options.smoothScroll) {
      this.setupSmoothScrolling(tocContainer);
    }

    this.logger.info('Table of contents built successfully', {
      headingsCount: this.headings.length
    });
  }

  /**
   * Create TOC list element
   */
  createTOCList() {
    const tocList = DOMUtils.createElement('ul', {
      className: 'toc-list'
    });

    this.headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      const listItem = DOMUtils.createElement('li', {
        className: `toc-item toc-level-${level}`
      });
      
      const link = DOMUtils.createElement('a', {
        href: `#${heading.id}`,
        className: 'toc-link',
        'data-section-id': heading.id
      });
      link.textContent = heading.textContent;
      
      listItem.appendChild(link);
      tocList.appendChild(listItem);
    });

    // Cache TOC links
    this.tocLinks = Array.from(tocList.querySelectorAll('.toc-link'));

    return tocList;
  }

  /**
   * Setup smooth scrolling for TOC links
   */
  setupSmoothScrolling(tocContainer) {
    tocContainer.addEventListener('click', (event) => {
      const link = event.target.closest('.toc-link');
      if (!link) return;

      event.preventDefault();

      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        this.scrollToSection(targetElement);
        
        // Emit navigation event
        eventBus.emit(EVENTS.SECTION_NAVIGATED, {
          sectionId: targetId,
          method: 'toc-click'
        });
      }
    });

    this.logger.debug('Smooth scrolling configured');
  }

  /**
   * Scroll to a specific section
   */
  scrollToSection(element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    this.logger.debug('Scrolled to section', { sectionId: element.id });
  }

  /**
   * Initialize scroll spy
   */
  initializeScrollSpy() {
    if (this.headings.length === 0) {
      this.logger.debug('No headings for scroll spy');
      return;
    }

    // Clean up existing observer
    if (this.scrollSpyObserver) {
      this.scrollSpyObserver.disconnect();
    }

    this.logger.debug('Initializing scroll spy');

    // Create intersection observer
    this.scrollSpyObserver = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: `-${this.options.scrollSpyOffset}px 0px -50% 0px`,
        threshold: 0
      }
    );

    // Observe all headings
    this.headings.forEach(heading => {
      this.scrollSpyObserver.observe(heading);
    });

    this.logger.info('Scroll spy initialized', {
      headingsCount: this.headings.length
    });
  }

  /**
   * Handle intersection observer entries
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      const sectionId = entry.target.id;
      
      if (entry.isIntersecting) {
        // Update active TOC link
        this.setActiveSection(sectionId);
        
        // Track section view
        if (!this.sectionsViewed.has(sectionId)) {
          this.sectionsViewed.add(sectionId);
          
          // Emit section viewed event
          eventBus.emit(EVENTS.SECTION_VIEWED, {
            sectionId: sectionId,
            totalViewed: this.sectionsViewed.size
          });
        }
      }
    });
  }

  /**
   * Set active section in TOC
   */
  setActiveSection(sectionId) {
    // Remove active class from all links
    this.tocLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to current link
    const activeLink = this.tocLinks.find(
      link => link.getAttribute('data-section-id') === sectionId
    );
    
    if (activeLink) {
      activeLink.classList.add('active');
      
      this.logger.debug('Active section updated', { sectionId });
    }
  }

  /**
   * Get sections viewed
   */
  getSectionsViewed() {
    return Array.from(this.sectionsViewed);
  }

  /**
   * Get total sections count
   */
  getTotalSections() {
    return this.headings.length;
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage() {
    if (this.headings.length === 0) return 0;
    return Math.round((this.sectionsViewed.size / this.headings.length) * 100);
  }

  /**
   * Reset tracking
   */
  reset() {
    this.sectionsViewed.clear();
    this.logger.debug('Navigation tracking reset');
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying NavigationCoordinator');
    
    // Disconnect observer
    if (this.scrollSpyObserver) {
      this.scrollSpyObserver.disconnect();
      this.scrollSpyObserver = null;
    }
    
    // Remove event listeners
    eventBus.offContext(this);
    
    // Clear data
    this.headings = [];
    this.tocLinks = [];
    this.sectionsViewed.clear();
    
    this.logger.debug('NavigationCoordinator destroyed');
  }
}

export default NavigationCoordinator;

