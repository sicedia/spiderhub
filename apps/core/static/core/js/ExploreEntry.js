/**
 * Explore Page Entry Point - ES6 Modular Implementation
 * Uses @js/ alias for clean imports and modular architecture
 */

import { ExplorePageManager } from './pages/ExplorePageManager.js';
import { DOMUtils } from './core/utils/dom.js';

/**
 * Initialize the explore page when DOM is ready
 */
function initializeExplorePage() {
  try {
    // Create and initialize the page manager
    const exploreManager = new ExplorePageManager(document.body, {
      autoInitialize: true,
      enableInfiniteScroll: !DOMUtils.isMobile(),
      enableMobileNavigation: true
    });

    // Make it globally accessible for debugging and backward compatibility
    if (typeof window !== 'undefined') {
      window.explorePageManager = exploreManager;
      
      // For backward compatibility, also expose as ExplorePageManager class
      window.ExplorePageManager = class {
        constructor() {
          return exploreManager;
        }
      };
    }

    console.log('Explore page initialized with ES6 modular architecture');
    
    return exploreManager;
    
  } catch (error) {
    console.error('Failed to initialize modular explore page:', error);
    
    // Fallback: show error message
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
    errorDiv.textContent = 'Error loading modular explore page. Check console for details.';
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
  // DOM is already ready
  initializeExplorePage();
}

// Export for potential external use
export { ExplorePageManager, initializeExplorePage };
