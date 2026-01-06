/**
 * Events Page Entry Point
 * Initializes EventsPageManager
 * ES6 Module
 */

import { EventsPageManager } from './pages/EventsPageManager.js';
import { logger } from './core/logger/Logger.js';
import { gettext as _ } from './core/i18n/i18n.js';

// Flag to prevent double initialization
let isInitialized = false;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEventsPage);
} else {
  initializeEventsPage();
}

function initializeEventsPage() {
  // Prevent double initialization
  if (isInitialized || window.eventsPageManager) {
    return;
  }
  isInitialized = true;

  const appLogger = logger.child({ module: 'EventsEntry' });
  
  try {
    appLogger.info('Initializing events page');
    
    // Initialize EventsPageManager
    const eventsPageManager = new EventsPageManager(document.body, {
      enableFilters: true,
      enablePagination: true,
      pageSize: 10
    });
    
    // Make available globally for debugging
    if (typeof window !== 'undefined') {
      window.eventsPageManager = eventsPageManager;
    }
    
    appLogger.info('Events page initialized successfully');
    
  } catch (error) {
    appLogger.error('Failed to initialize events page', error);
    isInitialized = false; // Allow retry on error
    
    // Show error to user
    const errorContainer = document.createElement('div');
    errorContainer.className = 'events-error';
    errorContainer.style.cssText = 'margin: 20px; padding: 15px; text-align: center;';
    errorContainer.innerHTML = `
      <h3>${_('Initialization Error')}</h3>
      <p>${_('Failed to initialize the events page. Please refresh the page or contact support.')}</p>
      <button onclick="location.reload()" class="button button--primary">${_('Reload Page')}</button>
    `;
    
    const main = document.querySelector('main');
    if (main) {
      main.insertBefore(errorContainer, main.firstChild);
    }
  }
}

export { initializeEventsPage };

