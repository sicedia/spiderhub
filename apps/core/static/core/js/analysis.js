// Analysis page functionality using modern JavaScript patterns
class AnalysisPageManager {
  constructor() {
    this.charts = [
      'choropleth-chart', 'gantt-chart', 'review-timeline-chart', 'histogram-chart',
      'theme-bar-chart', 'heatmap-chart', 'sankey-theme-chart', 'actor-bar-chart',
      'beneficiary-bar-chart', 'coverage-bar-chart', 'radar-chart', 'pie-chart'
    ];
    
    // Chart initialization constants
    this.CHART_RETRY_DELAY = 100;
    this.CHART_RETRY_MAX_ATTEMPTS = 10;
    
    this.init();
  }
  
  init() {
    this.initializeData();
    this.animateSummaryCards();
    this.initializeChartPlaceholders();
    this.initializeDataGrid();
    this.initializeSdgRadar();
    this.initializeLegalBindingPie();
    this.initializeCountryChoropleth();
    this.initializeCoverageBar();
  }

  // Retrieve data from context
  initializeData() {
    this.analysisData = JSON.parse(
      document.getElementById('analysis-data').textContent
    );
  }

  
  // Enhanced summary card animations with staggered effect
  animateSummaryCards() {
    const cards = document.querySelectorAll('.summary-card');
    
    cards.forEach((card, index) => {
      // Initial state
      Object.assign(card.style, {
        opacity: '0',
        transform: 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease'
      });
      
      // Staggered animation
      setTimeout(() => {
        Object.assign(card.style, {
          opacity: '1',
          transform: 'translateY(0)'
        });
      }, index * 100);
    });
  }
  
  // Chart placeholder initialization with modern event handling
  initializeChartPlaceholders() {
    this.charts.forEach(chartId => {
      const chartElement = document.getElementById(chartId);
      if (chartElement) {
        chartElement.addEventListener('click', () => this.simulateChartLoading(chartElement));
      }
    });
  }
  
  // Enhanced chart loading simulation
  simulateChartLoading(chartElement) {
    // Si ya hay un canvas, pon un overlay y no toques el DOM interno
    if (chartElement.querySelector('canvas')) {
      const overlay = document.createElement('div');
      overlay.className = 'chart-loading-overlay';
      overlay.innerHTML = '<div class="loading-spinner"></div> Loading…';
      Object.assign(overlay.style, {
        position: 'absolute',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.8)',
        zIndex: '5'
      });
      chartElement.style.position = 'relative';
      chartElement.appendChild(overlay);

      setTimeout(() => {
        overlay.remove();
        this.animateChartLoad(chartElement);
      }, 1500);
      return;          // ← evita el resto de la función
    }

    /*  Si llegamos aquí es que todavía es placeholder,
        mantenemos el comportamiento original                */
    const originalContent = chartElement.innerHTML;
    
    // Loading state
    chartElement.innerHTML = `
      <div class="placeholder-content">
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          <div class="loading-spinner"></div>
          Loading chart data...
        </div>
      </div>
    `;
    chartElement.style.background = '#f0f0f0';
    
    // Add loading spinner styles if not present
    this.addLoadingSpinnerStyles();
    
    setTimeout(() => {
      chartElement.innerHTML = originalContent;
      chartElement.style.background = '#f9f9f9';
      
      // Success animation
      this.animateChartLoad(chartElement);
    }, 1500);
  }
  
  // Chart load animation
  animateChartLoad(chartElement) {
    chartElement.style.transform = 'scale(0.98)';
    chartElement.style.transition = 'transform 0.3s ease';
    
    requestAnimationFrame(() => {
      chartElement.style.transform = 'scale(1)';
    });
  }
  
  // Add loading spinner styles
  addLoadingSpinnerStyles() {
    if (document.getElementById('loading-spinner-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'loading-spinner-styles';
    style.textContent = `
      .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #e3e3e3;
        border-top: 2px solid #094EB2;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Enhanced data grid functionality
  initializeDataGrid() {
    const searchInput = document.querySelector('.grid-search');
    const filterSelect = document.querySelector('.grid-filter');
    
    // Debounced search for better performance
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => this.filterDataGrid(), 300);
      });
    }
    
    if (filterSelect) {
      filterSelect.addEventListener('change', () => this.filterDataGrid());
    }
    
    // Enhanced view button functionality
    this.initializeViewButtons();
  }
  
  // Modern data grid filtering
  filterDataGrid() {
    const searchTerm = document.querySelector('.grid-search')?.value.toLowerCase() || '';
    const filterType = document.querySelector('.grid-filter')?.value.toLowerCase() || '';
    const rows = document.querySelectorAll('.data-grid tbody tr');
    
    let visibleCount = 0;
    
    rows.forEach(row => {
      const title = row.cells[0].textContent.toLowerCase();
      const type = row.cells[3].textContent.toLowerCase();
      
      const matchesSearch = !searchTerm || title.includes(searchTerm);
      const matchesFilter = !filterType || type.includes(filterType);
      
      const isVisible = matchesSearch && matchesFilter;
      row.style.display = isVisible ? '' : 'none';
      
      if (isVisible) visibleCount++;
    });
    
    // Update results count
    this.updateGridResultsCount(visibleCount, rows.length);
  }
  
  // Update grid results count
  updateGridResultsCount(visible, total) {
    let resultsInfo = document.querySelector('.grid-results-info');
    
    if (!resultsInfo) {
      resultsInfo = document.createElement('div');
      resultsInfo.className = 'grid-results-info';
      resultsInfo.style.cssText = 'margin-top: 1rem; color: #666; font-size: 0.9rem;';
      
      const gridContainer = document.querySelector('.data-grid-container');
      if (gridContainer) {
        gridContainer.appendChild(resultsInfo);
      }
    }
    
    resultsInfo.textContent = visible === total 
      ? `Showing all ${total} documents`
      : `Showing ${visible} of ${total} documents`;
  }
  
  // Enhanced view button initialization
  initializeViewButtons() {
    const viewButtons = document.querySelectorAll('.data-grid .btn-sm');
    
    viewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const row = button.closest('tr');
        const title = row.querySelector('td:first-child').textContent;
        
        // Enhanced interaction feedback
        const originalText = button.textContent;
        button.textContent = 'Loading...';
        button.disabled = true;
        
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
          
          // Navigate to document detail or show modal
          this.showDocumentPreview(title, row);
        }, 800);
      });
    });
  }
  
  // Document preview functionality
  showDocumentPreview(title, row) {
    const modal = document.createElement('div');
    modal.className = 'document-preview-modal';
    
    const data = {
      title,
      date: row.cells[1].textContent,
      country: row.cells[2].textContent,
      type: row.cells[3].textContent
    };
    
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>${data.title}</h3>
            <button class="modal-close">×</button>
          </div>
          <div class="modal-body">
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Country:</strong> ${data.country}</p>
            <p><strong>Type:</strong> ${data.type}</p>
            <div style="margin-top: 1rem;">
              <a href="document_detail.html" class="btn btn-primary">View Full Details</a>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.styleModal(modal);
    this.addModalEventListeners(modal);
    
    document.body.appendChild(modal);
  }
  
  // Modal styling
  styleModal(modal) {
    const overlay = modal.querySelector('.modal-overlay');
    const content = modal.querySelector('.modal-content');
    const header = modal.querySelector('.modal-header');
    const closeBtn = modal.querySelector('.modal-close');
    
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000',
      animation: 'fadeIn 0.3s ease-out'
    });
    
    Object.assign(content.style, {
      backgroundColor: 'white',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'auto',
      animation: 'slideInUp 0.3s ease-out'
    });
    
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem',
      borderBottom: '1px solid #eee'
    });
    
    Object.assign(closeBtn.style, {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#999'
    });
    
    modal.querySelector('.modal-body').style.padding = '1.5rem';
  }
  
  // Modal event listeners
  addModalEventListeners(modal) {
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');
    
    const closeModal = () => {
      overlay.style.animation = 'fadeOut 0.2s ease-in';
      setTimeout(() => modal.remove(), 200);
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    
    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Generic chart initializer with retry logic
   * @param {string} chartType - Type of chart being initialized
   * @param {Function} renderFunction - Function to render the chart
   * @param {Function} dataFunction - Function to get chart data
   * @param {number} attempt - Current attempt number
   */
  async initializeChart(chartType, renderFunction, dataFunction, attempt = 1) {
    if (typeof renderFunction === 'function') {
      const data = dataFunction();
      await renderFunction(data);
    } else if (attempt < this.CHART_RETRY_MAX_ATTEMPTS) {
      setTimeout(() => this.initializeChart(chartType, renderFunction, dataFunction, attempt + 1), this.CHART_RETRY_DELAY);
    } else {
      console.warn(`Failed to initialize ${chartType} after ${this.CHART_RETRY_MAX_ATTEMPTS} attempts`);
    }
  }

  /**
   * Initialize SDG Radar Chart
   */
  async initializeSdgRadar() {
    await this.initializeChart(
      'SDG Radar',
      window.renderSdgRadar,
      () => this.fetchSdgCounts()
    );
  }

  /**
   * Mock SDG data - in production this would fetch from API
   * @returns {Object} SDG counts object
   */
  fetchSdgCounts() {
    return this.analysisData.sdg_counts
  }

  /**
   * Initialize legal binding pie chart
   */
  async initializeLegalBindingPie() {
    // Wait for Chart.js to be available
    if (window.Chart) {
      await this.initializeChart(
        'Legal Binding Pie',
        window.renderLegalBindingPie,
        () => this.fetchBindingCounts()
      );
    } else {
      setTimeout(() => this.initializeLegalBindingPie(), this.CHART_RETRY_DELAY);
    }
  }

  /**
   * Mock legal binding data - in production this would fetch from API
   * @returns {Object} Legal binding counts object
   */
  fetchBindingCounts() {
    return this.analysisData.binding_counts;
  }

  /**
   * Initialize choropleth map
   */
  async initializeCountryChoropleth() {
    // Wait for Chart.js to be available
    if (window.Chart) {
      await this.initializeChart(
        'Country Choropleth',
        window.renderCountryChoropleth,
        () => this.fetchCountryCounts()
      );
    } else {
      setTimeout(() => this.initializeCountryChoropleth(), this.CHART_RETRY_DELAY);
    }
  }

  /**
   * Mock country data - in production this would fetch from API
   * @returns {Object} Country counts object
   */
  fetchCountryCounts() {
    return this.analysisData.country_counts;
  }

  /**
   * Initialize coverage scope bar chart
   */
  async initializeCoverageBar() {
    // Wait for Chart.js to be available
    if (window.Chart) {
      await this.initializeChart(
        'Coverage Bar',
        window.renderCoverageBar,
        () => this.fetchScopeCounts()
      );
    } else {
      setTimeout(() => this.initializeCoverageBar(), this.CHART_RETRY_DELAY);
    }
  }

  /**
   * Mock coverage scope data - in production this would fetch from API
   * @returns {Object} Coverage scope counts object
   */
  fetchScopeCounts() {
    return this.analysisData.scope_counts;
  }
}

// Add modal animations
if (!document.getElementById('modal-animations')) {
  const style = document.createElement('style');
  style.id = 'modal-animations';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes slideInUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// Initialize analysis page manager
document.addEventListener('DOMContentLoaded', () => {
  new AnalysisPageManager();
});