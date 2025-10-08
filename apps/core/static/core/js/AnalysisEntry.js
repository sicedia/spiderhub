/**
 * Analysis Page Entry Point (V2 - New Modern Dashboard)
 * Initializes the analysis page with modular architecture
 */

import { logger } from './core/logger/Logger.js';
import AnalysisPageManager from './pages/AnalysisPageManager.js';

// Store manager instance globally for debugging
window.analysisPageManager = null;

/**
 * Initialize analysis page
 */
async function initializeAnalysisPage() {
  try {
    logger.info('Initializing Analysis Dashboard V2 with ES6 modular architecture');
    
    const analysisElement = document.querySelector('#analysis-page') || document.body;
    
    // Create and initialize page manager
    window.analysisPageManager = new AnalysisPageManager(analysisElement, {
      enableAnimations: true,
      enableChartAnimations: true,
      autoInitialize: true,
      dataScriptId: 'analysis-data'
    });
    
    logger.info('Analysis Dashboard V2 initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize Analysis Dashboard', error);
    
    // Show error message to user
    const container = document.querySelector('.analysis-content');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <h2>⚠️ Failed to load Analysis Dashboard</h2>
          <p>Please refresh the page or contact support if the problem persists.</p>
          <button onclick="location.reload()" class="button button--primary">Reload Page</button>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAnalysisPage);
} else {
  initializeAnalysisPage();
}

export default initializeAnalysisPage;

