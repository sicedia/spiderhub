/**
 * Overview Page Entry Point
 * Initializes the Overview Country-EU dashboard
 */

import { logger } from './core/logger/Logger.js';
import { OverviewPageManager } from './pages/OverviewPageManager.js';

/**
 * Initialize the Overview page
 */
async function initializeOverviewPage() {
  try {
    logger.info('Initializing Overview page...');
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Get the page container
    const pageContainer = document.getElementById('overview-page');
    if (!pageContainer) {
      logger.error('Overview page container not found');
      return;
    }
    
    // Get default country from the select element
    const countrySelect = document.getElementById('country-select');
    const defaultCountry = countrySelect?.value || 'ECU';
    
    // Create page manager (init is called automatically by BaseComponent constructor)
    const pageManager = new OverviewPageManager(pageContainer, {
      enableAnimations: true,
      enableChartAnimations: true,
      defaultCountry: defaultCountry,
      autoInitialize: true
    });
    
    logger.info('✅ Overview page initialized successfully');
    
    // Expose to window for debugging (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      window.__overviewPageManager = pageManager;
      logger.debug('Page manager exposed as window.__overviewPageManager');
    }
    
  } catch (error) {
    logger.error('Failed to initialize Overview page', error);
    
    // Show user-friendly error message
    showErrorMessage(
      'Failed to load dashboard. Please refresh the page or contact support if the problem persists.'
    );
  }
}

/**
 * Show error message to user
 */
function showErrorMessage(message) {
  const errorContainer = document.createElement('div');
  errorContainer.className = 'error-message';
  errorContainer.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f44336;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    font-size: 14px;
    max-width: 90%;
    text-align: center;
  `;
  errorContainer.textContent = message;
  
  document.body.appendChild(errorContainer);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorContainer.remove();
  }, 5000);
}

// Initialize page when script loads
initializeOverviewPage();

