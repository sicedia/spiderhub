/**
 * Document Detail Page Manager (V2 - Refactored with Coordinators)
 * Manages the document detail page functionality using coordinator pattern
 * ES6 Module Export
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { DOMUtils } from '../core/utils/dom.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { buildI18nUrl } from '../core/utils/i18n.js';

// Coordinators
import { DocumentContentCoordinator } from '../coordinators/DocumentContentCoordinator.js';
import { NavigationCoordinator } from '../coordinators/NavigationCoordinator.js';
import { SocialInteractionCoordinator } from '../coordinators/SocialInteractionCoordinator.js';
import { DocumentActionsCoordinator } from '../coordinators/DocumentActionsCoordinator.js';
import { DocumentUICoordinator } from '../coordinators/DocumentUICoordinator.js';

export class DocumentDetailManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    this.documentId = this.getDocumentId();
    this.coordinators = {};
    this.documentData = null;
    
    if (!this.documentId) {
      throw new Error('No document ID provided');
    }
    
    this.logger.info('DocumentDetailManager V2 initialized', {
      documentId: this.documentId
    });
  }

  /**
   * Default options for document detail page
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      enablePrintMode: true,
      enableSharing: true,
      enableBookmarking: true,
      enableComments: false,
      enableRelatedDocuments: true,
      enableAnalytics: true,
      enableTooltips: true,
      enableLazyLoading: true,
      scrollSpyOffset: 100
    };
  }

  /**
   * Get document ID from URL or data attribute
   */
  getDocumentId() {
    // Try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let docId = urlParams.get('id');
    
    // Try to get from data attribute
    if (!docId) {
      docId = this.element.getAttribute('data-document-id');
    }
    
    // Try to get from path - Updated pattern for document_detail/ID/
    if (!docId) {
      const pathMatch = window.location.pathname.match(/\/document_detail\/(\d+)/);
      if (pathMatch) {
        docId = pathMatch[1];
      }
    }
    
    // Fallback: try /document/ID/ pattern
    if (!docId) {
      const pathMatch = window.location.pathname.match(/\/document\/(\d+)/);
      if (pathMatch) {
        docId = pathMatch[1];
      }
    }
    
    return docId;
  }

  /**
   * Initialize services
   */
  async initializeServices() {
    if (this.logger) {
      this.logger.debug('No additional services to initialize');
    }
  }

  /**
   * Load page data (handled by coordinators)
   */
  async loadPageData() {
    // Data loading is now handled by DocumentContentCoordinator
    if (this.logger) {
      this.logger.debug('Data loading delegated to DocumentContentCoordinator');
    }
  }

  /**
   * Initialize components (now using coordinators)
   */
  async initializeComponents() {
    if (this.logger) {
      this.logger.debug('Initializing coordinators');
    }
    
    try {
      // Initialize DocumentContentCoordinator
      this.coordinators.content = new DocumentContentCoordinator(this.documentId, {
        enableMetadata: true,
        enableContentProcessing: true
      });
      await this.coordinators.content.init();
      
      // Get document data from content coordinator
      this.documentData = this.coordinators.content.getDocumentData();
      
      if (this.logger) {
        this.logger.info('✅ DocumentContentCoordinator initialized');
      }
      
      // Initialize NavigationCoordinator
      this.coordinators.navigation = new NavigationCoordinator({
        scrollSpyOffset: this.options.scrollSpyOffset,
        smoothScroll: true
      });
      await this.coordinators.navigation.init();
      
      if (this.logger) {
        this.logger.info('✅ NavigationCoordinator initialized');
      }
      
      // Initialize SocialInteractionCoordinator
      this.coordinators.social = new SocialInteractionCoordinator(
        this.documentId,
        this.documentData,
        {
          enableSharing: this.options.enableSharing,
          enableBookmarking: this.options.enableBookmarking
        }
      );
      await this.coordinators.social.init();
      
      if (this.logger) {
        this.logger.info('✅ SocialInteractionCoordinator initialized');
      }
      
      // Initialize DocumentActionsCoordinator
      this.coordinators.actions = new DocumentActionsCoordinator(
        this.documentId,
        this.documentData,
        {
          enablePrintMode: this.options.enablePrintMode,
          enableRelatedDocuments: this.options.enableRelatedDocuments
        }
      );
      await this.coordinators.actions.init();
      
      if (this.logger) {
        this.logger.info('✅ DocumentActionsCoordinator initialized');
      }
      
      // Initialize DocumentUICoordinator
      this.coordinators.ui = new DocumentUICoordinator(
        this.documentId,
        {
          enableTooltips: this.options.enableTooltips,
          enableLazyLoading: this.options.enableLazyLoading,
          enableAnalytics: this.options.enableAnalytics
        }
      );
      await this.coordinators.ui.init();
      
      if (this.logger) {
        this.logger.info('✅ DocumentUICoordinator initialized');
      }
      
      // Setup coordinator communication
      this.setupCoordinatorCommunication();
      
      if (this.logger) {
        this.logger.info('All coordinators initialized successfully', {
          coordinatorCount: Object.keys(this.coordinators).length
        });
      }
      
    } catch (error) {
      if (this.logger) {
        this.logger.error('Error initializing coordinators', error);
      }
      this.handleDocumentLoadError(error);
      throw error;
    }
  }

  /**
   * Setup communication between coordinators
   */
  setupCoordinatorCommunication() {
    if (this.logger) {
      this.logger.debug('Setting up coordinator communication');
    }
    
    // Listen for document load errors
    eventBus.on(EVENTS.DOCUMENT_LOAD_ERROR, (data) => {
      if (this.logger) {
        this.logger.error('Document load error event received', data);
      }
      this.handleDocumentLoadError(data.error);
    }, this);
    
    // Listen for document loaded to update local reference
    eventBus.on(EVENTS.DOCUMENT_LOADED, (data) => {
      if (data.documentId === this.documentId) {
        this.documentData = data.documentData;
        if (this.logger) {
          this.logger.debug('Document data updated from event');
        }
      }
    }, this);
    
    if (this.logger) {
      this.logger.debug('Coordinator communication configured');
    }
  }

  /**
   * Handle document load error
   */
  handleDocumentLoadError(error) {
    const errorContainer = DOMUtils.createElement('div', {
      className: 'document-error alert alert-danger',
      role: 'alert'
    });
    
    if (error.status === 404) {
      errorContainer.innerHTML = `
        <h3>Document Not Found</h3>
        <p>The requested document could not be found. It may have been moved or deleted.</p>
        <a href="${buildI18nUrl('explore')}" class="btn btn-primary">Browse Documents</a>
      `;
    } else {
      errorContainer.innerHTML = `
        <h3>Error Loading Document</h3>
        <p>There was an error loading the document. Please try again later.</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      `;
    }
    
    // Insert error message at the beginning of the page
    const main = document.querySelector('main') || this.element;
    main.insertBefore(errorContainer, main.firstChild);
    
    if (this.logger) {
      this.logger.error('Error message displayed to user');
    }
  }

  /**
   * Get current document data
   */
  getDocumentData() {
    return this.documentData;
  }

  /**
   * Get interaction statistics
   */
  getInteractionStats() {
    if (!this.coordinators.ui) {
      return null;
    }
    
    const uiStats = this.coordinators.ui.getInteractionStats();
    const navStats = {
      sectionsViewed: this.coordinators.navigation ? 
        this.coordinators.navigation.getSectionsViewed() : [],
      totalSections: this.coordinators.navigation ? 
        this.coordinators.navigation.getTotalSections() : 0,
      completionPercentage: this.coordinators.navigation ? 
        this.coordinators.navigation.getCompletionPercentage() : 0
    };
    
    return {
      ...uiStats,
      ...navStats,
      documentId: this.documentId
    };
  }

  /**
   * Reload document
   */
  async reloadDocument() {
    if (this.logger) {
      this.logger.info('Reloading document');
    }
    eventBus.emit(EVENTS.DOCUMENT_RELOAD_REQUESTED, {
      documentId: this.documentId
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.logger) {
      this.logger.debug('Destroying DocumentDetailManager');
    }
    
    // Destroy all coordinators
    Object.values(this.coordinators).forEach(coordinator => {
      if (coordinator && coordinator.destroy) {
        coordinator.destroy();
      }
    });
    
    this.coordinators = {};
    this.documentData = null;
    
    // Call parent destroy
    super.destroy();
    
    if (this.logger) {
      this.logger.info('DocumentDetailManager destroyed');
    }
  }
}

// Default export
export default DocumentDetailManager;

