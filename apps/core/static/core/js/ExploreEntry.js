/**
 * Explore Page Entry Point - ES6 Modular Implementation
 * SPA Mode: Loads all data via API
 */

import { ExplorePageManager } from './pages/ExplorePageManager.js';
import { FilterLoader } from './services/FilterLoader.js';
import { DOMUtils } from './core/utils/dom.js';

/**
 * Initialize the explore page when DOM is ready
 */
async function initializeExplorePage() {
  try {
    // Load filters from API first
    const filterLoader = new FilterLoader();
    await filterLoader.loadFilters();
    
    // Create and initialize the page manager
    const exploreManager = new ExplorePageManager(document.body, {
      autoInitialize: true,
      enableInfiniteScroll: !DOMUtils.isMobile(),
      enableMobileNavigation: true
    });

    // Make it globally accessible for debugging
    if (typeof window !== 'undefined') {
      window.explorePageManager = exploreManager;
      window.filterLoader = filterLoader;
    }

    console.log('Explore page initialized with SPA architecture');
    
    return exploreManager;
    
  } catch (error) {
    console.error('Failed to initialize explore page:', error);
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    errorDiv.textContent = 'Error loading explore page. Check console for details.';
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExplorePage);
} else {
  initializeExplorePage();
}

export { ExplorePageManager, FilterLoader, initializeExplorePage };