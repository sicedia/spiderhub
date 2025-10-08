/**
 * Document Detail Page Entry Point
 * Initializes DocumentDetailManager with coordinator pattern
 * ES6 Module
 */

import { DocumentDetailManager } from './pages/DocumentDetailManager.js';
import { logger } from './core/logger/Logger.js';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDocumentDetail);
} else {
  initializeDocumentDetail();
}

function initializeDocumentDetail() {
  try {
    const appLogger = logger.child({ module: 'DocumentDetailEntry' });
    appLogger.info('Initializing document detail page with ES6 modular architecture');
    
    // Initialize DocumentDetailManager
    const documentDetailManager = new DocumentDetailManager(document.body, {
      enablePrintMode: true,
      enableSharing: true,
      enableBookmarking: true,
      enableRelatedDocuments: true,
      enableAnalytics: true,
      enableTooltips: true,
      enableLazyLoading: true,
      scrollSpyOffset: 100
    });
    
    // Make available globally for debugging
    if (typeof window !== 'undefined') {
      window.documentDetailManager = documentDetailManager;
    }
    
    appLogger.info('Document detail page initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize document detail page:', error);
    
    // Show error to user
    const errorContainer = document.createElement('div');
    errorContainer.className = 'alert alert-danger';
    errorContainer.style.cssText = 'margin: 20px; padding: 15px;';
    errorContainer.innerHTML = `
      <h3>Initialization Error</h3>
      <p>Failed to initialize the document detail page. Please refresh the page or contact support.</p>
      <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
    `;
    
    const main = document.querySelector('main');
    if (main) {
      main.insertBefore(errorContainer, main.firstChild);
    }
  }
}

export { initializeDocumentDetail };

