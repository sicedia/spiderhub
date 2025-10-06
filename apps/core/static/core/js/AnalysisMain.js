/**
 * Analysis Page - Main Implementation
 * Direct initialization without complex dependencies
 * Clean modular structure with standardized imports
 */

import { AnalysisPageManager } from './pages/AnalysisPageManager.js';

// Initialize analysis page when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 Initializing Analysis Page with simplified architecture...');
    
    // Initialize the page manager
    const pageManager = new AnalysisPageManager(document.body, {
      autoInitialize: true,
      enableChartAnimations: true,
      enableDataGrid: false,
      enableModals: false
    });
    
    // Make it globally available for debugging and backward compatibility
    window.analysisPageManager = pageManager;
    
    console.log('✅ Analysis page initialized successfully');
    
    // Emit a custom event to notify other scripts
    document.dispatchEvent(new CustomEvent('analysisPageReady', {
      detail: { pageManager }
    }));
    
  } catch (error) {
    console.error('❌ Failed to initialize analysis page:', error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger analysis-error';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
    `;
    errorDiv.innerHTML = `
      <strong>Analysis Page Error</strong><br>
      Failed to initialize charts. Using fallback mode.
      <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: inherit; cursor: pointer;">×</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 10000);
    
    // Initialize basic fallback functionality
    initializeFallbackCharts();
  }
});

// Fallback chart initialization
function initializeFallbackCharts() {
  console.log('Initializing fallback charts...');
  
  // Replace all "Loading chart..." with simple placeholders
  const loadingElements = document.querySelectorAll('[id$="-chart"]');
  loadingElements.forEach((element, index) => {
    setTimeout(() => {
      if (element.textContent.includes('Loading chart...')) {
        element.innerHTML = `
          <div style="
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            border-radius: 8px;
            padding: 40px 20px;
            text-align: center;
            color: #6c757d;
          ">
            <div style="font-size: 32px; margin-bottom: 16px;">📊</div>
            <div style="font-weight: 500; margin-bottom: 8px;">Chart ${index + 1}</div>
            <div style="font-size: 14px;">Visualization ready for implementation</div>
          </div>
        `;
      }
    }, index * 200);
  });
}

// Legacy compatibility layer
class LegacyAnalysisPageManager {
  constructor() {
    console.warn('⚠️ Legacy AnalysisPageManager is deprecated. Please use the new modular version.');
    
    // Wait for the modern manager to be available
    this.modernManager = null;
    this.initPromise = this.waitForModernManager();
  }
  
  async waitForModernManager() {
    return new Promise((resolve) => {
      const checkManager = () => {
        if (window.analysisPageManager) {
          this.modernManager = window.analysisPageManager;
          resolve(this.modernManager);
        } else {
          setTimeout(checkManager, 100);
        }
      };
      checkManager();
    });
  }
  
  // Legacy method compatibility
  async init() {
    await this.initPromise;
    return this.modernManager;
  }

  async initializeData() {
    await this.initPromise;
    return this.modernManager?.getAnalysisData?.() || {};
  }

  async animateSummaryCards() {
    await this.initPromise;
    const cards = document.querySelectorAll('.summary-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  // Chart initialization methods - all return promises for compatibility
  async initializeChart(chartType, renderFunction, dataFunction, attempt = 1) {
    console.log(`Legacy chart initialization: ${chartType}`);
    return Promise.resolve();
  }

  async initializeLeadCountryChart() { return this.initializeChart('lead-countries-chart'); }
  async initializeSdgRadar() { return this.initializeChart('radar-chart'); }
  async initializeLegalBindingPie() { return this.initializeChart('pie-chart'); }
  async initializeCoverageBar() { return this.initializeChart('coverage-bar-chart'); }
  async initializeThemeBar() { return this.initializeChart('theme-bar-chart'); }
  async initializeActorBar() { return this.initializeChart('actor-bar-chart'); }
  async initializeBeneficiaryBar() { return this.initializeChart('beneficiary-bar-chart'); }

  // Data fetching methods - return mock data
  async fetchSdgCounts() { return { 'SDG 1': 15, 'SDG 8': 30, 'SDG 9': 35 }; }
  async fetchBindingCounts() { return { 'Legally Binding': 45, 'Politically Binding': 78 }; }
  async fetchCountryCounts() { return { 'Spain': 25, 'Germany': 22, 'France': 20 }; }
}

// Make legacy manager available globally for backward compatibility
window.LegacyAnalysisPageManager = LegacyAnalysisPageManager;

// Create a legacy instance if needed
if (!window.legacyAnalysisPageManager) {
  window.legacyAnalysisPageManager = new LegacyAnalysisPageManager();
}

// Export for module systems
export { AnalysisPageManager, LegacyAnalysisPageManager };
export default AnalysisPageManager;
