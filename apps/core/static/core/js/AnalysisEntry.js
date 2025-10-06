/**
 * Analysis Page Entry Point
 * This file serves as the main entry point for the analysis page
 * It handles both modern ES6 modules and fallback for older browsers
 */

// Check if ES6 modules are supported
const supportsES6Modules = (() => {
  try {
    new Function('import("")');
    return true;
  } catch (e) {
    return false;
  }
})();

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  // Browser environment
  if (supportsES6Modules) {
    // Modern browser with ES6 module support
    console.log('Loading analysis page with ES6 modules...');
    
    // Dynamic import for modern browsers
    import('./AnalysisMain.js')
      .then((module) => {
        console.log('Analysis page loaded successfully with ES6 modules');
        window.analysisPageLoaded = true;
      })
      .catch((error) => {
        console.error('Failed to load analysis page with ES6 modules:', error);
        // Fallback to legacy loading
        loadLegacyAnalysis();
      });
  } else {
    // Older browser - load legacy version
    console.log('Loading analysis page with legacy fallback...');
    loadLegacyAnalysis();
  }
} else {
  // Node.js environment (for testing)
  console.log('Analysis entry point loaded in Node.js environment');
}

/**
 * Legacy fallback loader for older browsers
 */
function loadLegacyAnalysis() {
  // Create a script element to load the bundled version
  const script = document.createElement('script');
  script.src = './analysis.bundle.js';
  script.onload = () => {
    console.log('Analysis page loaded with legacy bundle');
    window.analysisPageLoaded = true;
  };
  script.onerror = () => {
    console.error('Failed to load analysis bundle');
    // Final fallback - try to initialize basic functionality
    initializeBasicAnalysis();
  };
  document.head.appendChild(script);
}

/**
 * Basic analysis initialization as final fallback
 */
function initializeBasicAnalysis() {
  console.log('Initializing basic analysis functionality...');
  
  // Basic DOM ready check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeBasicFeatures();
    });
  } else {
    initializeBasicFeatures();
  }
}

/**
 * Initialize basic features without ES6 modules
 */
function initializeBasicFeatures() {
  // Basic summary card animations
  const summaryCards = document.querySelectorAll('.summary-card');
  summaryCards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });

  // Basic chart placeholder initialization
  const chartContainers = document.querySelectorAll('[id$="-chart"]');
  chartContainers.forEach(container => {
    if (!container.querySelector('.chart-content')) {
      container.innerHTML = `
        <div class="chart-placeholder">
          <div class="loading-spinner"></div>
          <p>Loading chart...</p>
        </div>
      `;
    }
  });

  // Basic data grid functionality
  const dataGrid = document.querySelector('.data-grid');
  if (dataGrid) {
    initializeBasicDataGrid(dataGrid);
  }

  console.log('Basic analysis features initialized');
}

/**
 * Basic data grid initialization
 */
function initializeBasicDataGrid(grid) {
  const searchInput = grid.querySelector('.grid-search');
  const tableBody = grid.querySelector('tbody');
  
  if (searchInput && tableBody) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const rows = tableBody.querySelectorAll('tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    supportsES6Modules,
    isBrowser,
    loadLegacyAnalysis,
    initializeBasicAnalysis
  };
}
