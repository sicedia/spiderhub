/**
 * DocumentContentCoordinator
 * Coordinates document content loading, rendering, and metadata
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { APIUtils } from '../core/utils/api.js';

export class DocumentContentCoordinator {
  constructor(documentId, options = {}) {
    this.logger = logger.child({
      component: 'DocumentContentCoordinator'
    });
    
    this.documentId = documentId;
    this.options = {
      enableMetadata: true,
      enableContentProcessing: true,
      ...options
    };
    
    this.documentData = null;
    this.isLoading = false;
    
    this.logger.debug('DocumentContentCoordinator initialized', {
      documentId: this.documentId
    });
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing DocumentContentCoordinator');
    
    this.setupEventListeners();
    
    // Load document data
    await this.loadDocumentData();
    
    this.logger.info('DocumentContentCoordinator initialized successfully');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for document reload requests
    eventBus.on(EVENTS.DOCUMENT_RELOAD_REQUESTED, this.handleReloadRequest.bind(this), this);
    
    this.logger.debug('Event listeners configured');
  }

  /**
   * Load document data from API
   */
  async loadDocumentData() {
    if (this.isLoading) {
      this.logger.debug('Document already loading, skipping');
      return;
    }

    this.isLoading = true;
    
    try {
      this.logger.debug('Loading document data', { documentId: this.documentId });
      
      // Emit loading start event
      eventBus.emit(EVENTS.DOCUMENT_LOADING_START, {
        documentId: this.documentId
      });

      // First, try to extract data from existing HTML (server-rendered)
      const existingData = this.extractDataFromHTML();
      
      if (existingData) {
        this.logger.info('Using server-rendered document data');
        this.documentData = existingData;
      } else {
        // Fallback to API if no HTML data exists
        try {
          this.logger.debug('No HTML data found, fetching from API');
          const response = await APIUtils.get(`/api/documents/${this.documentId}`);
          this.documentData = response;
        } catch (apiError) {
          this.logger.warn('API call failed, using mock data', apiError);
          this.documentData = this.getMockDocumentData();
        }
      }
      
      this.logger.info('Document data loaded successfully', {
        documentId: this.documentId,
        title: this.documentData.title,
        source: existingData ? 'HTML' : 'API'
      });

      // Only render if data came from API (HTML is already rendered)
      if (!existingData) {
        this.renderDocument();
      } else {
        // Just emit the content ready event
        eventBus.emit(EVENTS.DOCUMENT_CONTENT_READY, {
          documentId: this.documentId
        });
      }

      // Emit success event
      eventBus.emit(EVENTS.DOCUMENT_LOADED, {
        documentId: this.documentId,
        documentData: this.documentData
      });

    } catch (error) {
      this.logger.error('Failed to load document data', error, {
        documentId: this.documentId
      });

      // Emit error event
      eventBus.emit(EVENTS.DOCUMENT_LOAD_ERROR, {
        documentId: this.documentId,
        error: error
      });

      // Don't throw, let the page handle the error gracefully
      this.documentData = this.getMockDocumentData();
      
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Extract document data from existing HTML (server-rendered content)
   */
  extractDataFromHTML() {
    try {
      // Find content area using common selectors
      const contentArea = document.querySelector('.document-content') || 
                          document.querySelector('#document-content') ||
                          document.querySelector('.content-area');
                          
      if (!contentArea) {
        this.logger.debug('No content area found in DOM');
        return null;
      }

      // Check if content has meaningful data (not just "Loading...")
      const headings = contentArea.querySelectorAll('h2, h3');
      if (headings.length === 0) {
        this.logger.debug('No content headings found');
        return null;
      }

      // Extract title from header
      const titleElement = document.querySelector('.document-header h1') ||
                           document.querySelector('h1');
      const title = titleElement ? titleElement.textContent.trim() : 'Document';

      // Extract metadata
      const typeElement = document.querySelector('.document-type');
      const type = typeElement ? typeElement.textContent.trim() : '';

      this.logger.info('Extracted document data from HTML', {
        title,
        type,
        sectionsCount: headings.length
      });

      return {
        id: this.documentId,
        title,
        type,
        // Content is already in the DOM, no need to store it
        contentRendered: true
      };
    } catch (error) {
      this.logger.warn('Failed to extract data from HTML', error);
      return null;
    }
  }

  /**
   * Render document content and metadata
   */
  renderDocument() {
    if (!this.documentData) {
      this.logger.warn('No document data to render');
      return;
    }

    this.logger.debug('Rendering document');

    // Update page title
    this.updatePageTitle();

    // Populate metadata
    if (this.options.enableMetadata) {
      this.populateMetadata();
    }

    // Process and render content
    if (this.options.enableContentProcessing) {
      this.processContent();
    }

    this.logger.debug('Document rendered successfully');
  }

  /**
   * Update page title and meta tags
   */
  updatePageTitle() {
    const title = `${this.documentData.title} - SPIDERHUB`;
    document.title = title;

    // Update meta description if available
    if (this.documentData.summary) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', this.documentData.summary);
      }
    }

    this.logger.debug('Page title updated', { title });
  }

  /**
   * Populate document metadata fields
   */
  populateMetadata() {
    const metadata = {
      title: this.documentData.title,
      date: this.formatDate(this.documentData.date),
      country: this.documentData.country,
      type: this.documentData.type,
      theme: this.documentData.theme,
      actors: this.documentData.actors,
      beneficiaries: this.documentData.beneficiaries,
      sdgs: this.documentData.sdgs
    };

    this.logger.debug('Populating metadata', { fieldsCount: Object.keys(metadata).length });

    Object.entries(metadata).forEach(([key, value]) => {
      const element = DOMUtils.getElement(`[data-document-${key}]`);
      if (element && value) {
        if (Array.isArray(value)) {
          element.textContent = value.join(', ');
        } else {
          element.textContent = value;
        }
      }
    });

    this.logger.debug('Metadata populated');
  }

  /**
   * Process and render document content
   */
  processContent() {
    const contentContainer = DOMUtils.getElement('.document-content');
    if (!contentContainer || !this.documentData.content) {
      this.logger.warn('Content container or content not found');
      return;
    }

    // Set content
    contentContainer.innerHTML = this.documentData.content;

    // Add section IDs for navigation
    this.addSectionIds(contentContainer);

    // Process external links
    this.processExternalLinks(contentContainer);

    this.logger.debug('Content processed and rendered');

    // Emit content ready event
    eventBus.emit(EVENTS.DOCUMENT_CONTENT_READY, {
      documentId: this.documentId
    });
  }

  /**
   * Add IDs to heading elements for navigation
   */
  addSectionIds(container) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = `section-${index + 1}`;
      }
    });

    this.logger.debug('Section IDs added', { count: headings.length });
  }

  /**
   * Process external links to open in new tab
   */
  processExternalLinks(container) {
    const links = container.querySelectorAll('a[href]');
    let externalLinksCount = 0;

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http') || href.startsWith('//')) && 
          !href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        externalLinksCount++;
      }
    });

    this.logger.debug('External links processed', { count: externalLinksCount });
  }

  /**
   * Handle document reload request
   */
  async handleReloadRequest() {
    this.logger.info('Document reload requested');
    await this.loadDocumentData();
  }

  /**
   * Get current document data
   */
  getDocumentData() {
    return this.documentData;
  }

  /**
   * Format date string
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get mock document data for fallback
   */
  getMockDocumentData() {
    return {
      id: this.documentId,
      title: "Document Loading...",
      date: new Date().toISOString(),
      country: "N/A",
      type: "Document",
      theme: "Loading",
      actors: [],
      beneficiaries: [],
      sdgs: [],
      summary: "This document is currently being loaded. Please wait...",
      content: `
        <h2>Loading Document</h2>
        <p>The document content is being loaded. Please refresh the page if this message persists.</p>
      `
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying DocumentContentCoordinator');
    
    // Remove event listeners
    eventBus.offContext(this);
    
    // Clear data
    this.documentData = null;
    
    this.logger.debug('DocumentContentCoordinator destroyed');
  }
}

export default DocumentContentCoordinator;

