/**
 * Event Detail Page Entry Point
 * Initializes EventDetailManager
 * ES6 Module
 */

import { EventDetailManager } from './pages/EventDetailManager.js';
import { logger } from './core/logger/Logger.js';

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEventDetail);
} else {
  initializeEventDetail();
}

function initializeEventDetail() {
  const appLogger = logger.child({ module: 'EventDetailEntry' });
  
  try {
    appLogger.info('Initializing event detail page');
    
    // Initialize EventDetailManager
    const eventDetailManager = new EventDetailManager(document.body, {
      enableMetadata: true,
      enableContentProcessing: true
    });
    
    // Make available globally for debugging
    if (typeof window !== 'undefined') {
      window.eventDetailManager = eventDetailManager;
    }
    
    appLogger.info('Event detail page initialized successfully');
    
  } catch (error) {
    appLogger.error('Failed to initialize event detail page', error);
    
    // Show error to user
    const errorContainer = document.createElement('div');
    errorContainer.className = 'event-error';
    errorContainer.style.cssText = 'margin: 20px; padding: 15px; text-align: center;';
    errorContainer.innerHTML = `
      <h3>Initialization Error</h3>
      <p>Failed to initialize the event detail page. Please refresh the page or contact support.</p>
      <button onclick="location.reload()" class="button button--primary">Reload Page</button>
    `;
    
    const main = document.querySelector('main');
    if (main) {
      main.insertBefore(errorContainer, main.firstChild);
    }
  }
}

export { initializeEventDetail };

