/**
 * DocumentActionsCoordinator
 * Coordinates document actions (print, download, related documents)
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { APIUtils } from '../core/utils/api.js';

export class DocumentActionsCoordinator {
  constructor(documentId, documentData, options = {}) {
    this.logger = logger.child({
      component: 'DocumentActionsCoordinator'
    });
    
    this.documentId = documentId;
    this.documentData = documentData;
    this.options = {
      enablePrintMode: true,
      enableRelatedDocuments: true,
      ...options
    };
    
    this.relatedDocuments = [];
    
    this.logger.debug('DocumentActionsCoordinator initialized', {
      documentId: this.documentId
    });
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing DocumentActionsCoordinator');
    
    if (this.options.enablePrintMode) {
      this.initializePrintMode();
    }
    
    if (this.options.enableRelatedDocuments) {
      await this.loadAndRenderRelatedDocuments();
    }
    
    this.setupEventListeners();
    
    this.logger.info('DocumentActionsCoordinator initialized successfully');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for document data updates
    eventBus.on(EVENTS.DOCUMENT_LOADED, this.handleDocumentLoaded.bind(this), this);
    
    this.logger.debug('Event listeners configured');
  }

  /**
   * Handle document loaded event
   */
  handleDocumentLoaded(data) {
    if (data.documentId === this.documentId) {
      this.documentData = data.documentData;
      this.logger.debug('Document data updated');
    }
  }

  /**
   * Initialize print mode
   */
  initializePrintMode() {
    const printButton = document.querySelector('.print-button');
    if (!printButton) {
      this.logger.debug('No print button found');
      return;
    }
    
    printButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.printDocument();
    });
    
    // Add print styles to page
    this.addPrintStyles();
    
    this.logger.debug('Print mode initialized');
  }

  /**
   * Print document
   */
  printDocument() {
    this.logger.info('Printing document', { documentId: this.documentId });
    
    // Emit print event for analytics
    eventBus.emit(EVENTS.DOCUMENT_PRINTED, {
      documentId: this.documentId,
      timestamp: Date.now()
    });
    
    // Trigger browser print
    window.print();
  }

  /**
   * Add print-specific styles to the page
   */
  addPrintStyles() {
    if (document.getElementById('document-print-styles')) {
      return; // Styles already added
    }
    
    const style = document.createElement('style');
    style.id = 'document-print-styles';
    style.textContent = `
      @media print {
        /* Hide non-printable elements */
        .no-print,
        .share-buttons,
        .bookmark-button,
        .print-button,
        .table-of-contents,
        .related-documents,
        header,
        footer,
        nav,
        .sidebar {
          display: none !important;
        }
        
        /* Optimize document content for print */
        .document-content {
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .document-header {
          border-bottom: 2px solid #000;
          margin-bottom: 20px;
          padding-bottom: 10px;
        }
        
        /* Typography adjustments */
        body {
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }
        
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        
        p, li {
          orphans: 3;
          widows: 3;
        }
        
        /* Ensure links are readable */
        a {
          text-decoration: underline;
        }
        
        a[href^="http"]:after {
          content: " (" attr(href) ")";
          font-size: 0.8em;
          color: #666;
        }
        
        /* Better table printing */
        table {
          page-break-inside: avoid;
        }
        
        img {
          max-width: 100%;
          page-break-inside: avoid;
        }
      }
    `;
    
    document.head.appendChild(style);
    this.logger.debug('Print styles added');
  }

  /**
   * Load and render related documents
   */
  async loadAndRenderRelatedDocuments() {
    // DISABLED: Related documents are now rendered server-side in the template
    // This prevents overwriting the improved UI/UX design from the Django template
    this.logger.debug('Related documents rendering disabled - using server-side rendering');
    
    // Check if related documents exist in the DOM
    const relatedContainer = document.querySelector('.related-documents');
    if (relatedContainer && relatedContainer.children.length > 0) {
      this.logger.info('Related documents already rendered server-side');
      // Emit event to signal they're available
      eventBus.emit(EVENTS.RELATED_DOCUMENTS_LOADED, {
        documentId: this.documentId,
        count: relatedContainer.querySelectorAll('.related-document').length
      });
    }
    
    return;
    
    /* LEGACY API-BASED CODE (COMMENTED OUT)
    try {
      this.logger.debug('Loading related documents');
      
      // Load related documents from API
      const response = await APIUtils.get(`/api/documents/${this.documentId}/related`);
      this.relatedDocuments = response.documents || [];
      
      if (this.relatedDocuments.length === 0) {
        this.logger.debug('No related documents found');
        return;
      }
      
      this.logger.info('Related documents loaded', {
        count: this.relatedDocuments.length
      });
      
      // Render related documents
      this.renderRelatedDocuments();
      
      // Emit event
      eventBus.emit(EVENTS.RELATED_DOCUMENTS_LOADED, {
        documentId: this.documentId,
        count: this.relatedDocuments.length
      });
      
    } catch (error) {
      // API call failed, just log debug message
      this.logger.debug('Related documents API not available or returned no data', error);
      // Not critical, continue without related documents
    }
    */
  }

  /**
   * Render related documents
   */
  renderRelatedDocuments() {
    const relatedContainer = document.querySelector('.related-documents');
    if (!relatedContainer) {
      this.logger.debug('No related documents container found');
      return;
    }
    
    // Clear existing content
    relatedContainer.innerHTML = '';
    
    // Create heading
    const heading = DOMUtils.createElement('h3', {
      className: 'related-documents-heading'
    });
    heading.textContent = 'Related Documents';
    relatedContainer.appendChild(heading);
    
    // Create documents list
    const relatedList = DOMUtils.createElement('div', {
      className: 'related-documents-list'
    });
    
    this.relatedDocuments.forEach(doc => {
      const docCard = this.createRelatedDocumentCard(doc);
      relatedList.appendChild(docCard);
    });
    
    relatedContainer.appendChild(relatedList);
    
    this.logger.debug('Related documents rendered', {
      count: this.relatedDocuments.length
    });
  }

  /**
   * Create a related document card
   */
  createRelatedDocumentCard(doc) {
    const card = DOMUtils.createElement('div', {
      className: 'related-document-card'
    });
    
    const titleLink = DOMUtils.createElement('a', {
      href: `/document_detail/${doc.id}/`,
      className: 'related-doc-title'
    });
    titleLink.textContent = doc.title;
    
    const meta = DOMUtils.createElement('div', {
      className: 'related-doc-meta'
    });
    
    if (doc.country) {
      const country = DOMUtils.createElement('span', {
        className: 'doc-country'
      });
      country.textContent = doc.country;
      meta.appendChild(country);
    }
    
    if (doc.type) {
      const type = DOMUtils.createElement('span', {
        className: 'doc-type'
      });
      type.textContent = doc.type;
      meta.appendChild(type);
    }
    
    if (doc.date) {
      const date = DOMUtils.createElement('span', {
        className: 'doc-date'
      });
      date.textContent = this.formatDate(doc.date);
      meta.appendChild(date);
    }
    
    card.appendChild(titleLink);
    card.appendChild(meta);
    
    if (doc.summary) {
      const summary = DOMUtils.createElement('p', {
        className: 'related-doc-summary'
      });
      summary.textContent = doc.summary;
      card.appendChild(summary);
    }
    
    return card;
  }

  /**
   * Format date string
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get related documents
   */
  getRelatedDocuments() {
    return this.relatedDocuments;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying DocumentActionsCoordinator');
    
    // Remove event listeners
    eventBus.offContext(this);
    
    // Clear data
    this.relatedDocuments = [];
    
    this.logger.debug('DocumentActionsCoordinator destroyed');
  }
}

export default DocumentActionsCoordinator;

