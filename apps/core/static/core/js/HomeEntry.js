/**
 * Home Page Entry Point (V2 - Using HomePageManager with Coordinators)
 * Initializes the home page with modular architecture
 */

import { logger } from './core/logger/Logger.js';
import HomePageManager from './pages/HomePageManager.js';

// Store manager instance globally for debugging
window.homePageManager = null;

// Flag to prevent double initialization
let isInitialized = false;

/**
 * Initialize home page
 */
async function initializeHomePage() {
  // Prevent double initialization
  if (isInitialized || window.homePageManager) {
    logger.debug('Home page already initialized, skipping...');
    return;
  }
  isInitialized = true;

  try {
    logger.info('Initializing home page with ES6 modular architecture');
    
    const homeElement = document.querySelector('#home-page') || document.body;
    
    // Create and initialize page manager
    window.homePageManager = new HomePageManager(homeElement, {
      enableHeroAnimation: true,
      enableStatsAnimation: true,
      enableFeaturesAnimation: true,
      enableNodeWebAnimation: true,
      enableCarousel: true,
      autoPlayCarousel: false,
      carouselInterval: 5000
    });
    
    logger.info('Home page initialized successfully');
    
    // Emit custom event for other scripts
    document.dispatchEvent(new CustomEvent('homePageReady', {
      detail: { manager: window.homePageManager }
    }));
    
  } catch (error) {
    logger.error('Failed to initialize home page', error);
    isInitialized = false; // Allow retry on error
    
    // Show user-friendly error message
    const errorContainer = document.createElement('div');
    errorContainer.className = 'alert alert-danger';
    errorContainer.innerHTML = `
      <h3>Error Loading Page</h3>
      <p>There was an error initializing the home page. Please refresh the page.</p>
    `;
    document.body.insertBefore(errorContainer, document.body.firstChild);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHomePage);
} else {
  initializeHomePage();
}

// Export for testing
export { initializeHomePage };

