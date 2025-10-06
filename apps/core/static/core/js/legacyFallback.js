/**
 * Legacy Fallback for Older Browsers
 * Provides basic functionality when ES6 modules are not supported
 */

(function() {
  'use strict';

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Basic Analysis Page Manager for legacy browsers
  function LegacyAnalysisManager() {
    this.charts = [
      'choropleth-chart', 'gantt-chart', 'review-timeline-chart', 'histogram-chart',
      'theme-bar-chart', 'heatmap-chart', 'sankey-theme-chart', 'actor-bar-chart',
      'beneficiary-bar-chart', 'coverage-bar-chart', 'radar-chart', 'pie-chart',
      'lead-countries-chart', 'investment-flow-chart', 'commitment-timeline-chart',
      'economic-impact-heatmap', 'diversity-radar-chart', 'initiative-treemap-chart',
      'collaboration-network-chart'
    ];
    
    this.CHART_RETRY_DELAY = 100;
    this.CHART_RETRY_MAX_ATTEMPTS = 10;
    this.initialized = false;
  }

  LegacyAnalysisManager.prototype.init = function() {
    if (this.initialized) return;
    
    console.log('Initializing legacy analysis manager...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.initializeComponents.bind(this));
    } else {
      this.initializeComponents();
    }
    
    this.initialized = true;
  };

  LegacyAnalysisManager.prototype.initializeComponents = function() {
    this.animateSummaryCards();
    this.initializeChartPlaceholders();
    this.initializeDataGrid();
    this.initializeViewButtons();
    this.addLoadingSpinnerStyles();
    
    console.log('Legacy analysis components initialized');
  };

  LegacyAnalysisManager.prototype.animateSummaryCards = function() {
    var cards = document.querySelectorAll('.summary-card');
    cards.forEach(function(card, index) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      
      setTimeout(function() {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  };

  LegacyAnalysisManager.prototype.initializeChartPlaceholders = function() {
    var self = this;
    this.charts.forEach(function(chartId) {
      var element = document.getElementById(chartId);
      if (element) {
        self.simulateChartLoading(element);
      }
    });
  };

  LegacyAnalysisManager.prototype.simulateChartLoading = function(chartElement) {
    if (!chartElement) return;
    
    var placeholder = chartElement.querySelector('.placeholder-content');
    if (placeholder) {
      placeholder.innerHTML = '<div class="loading-spinner"></div><p>Loading chart...</p>';
    }
    
    // Simulate loading delay
    setTimeout(function() {
      if (placeholder) {
        placeholder.innerHTML = '<div class="chart-icon">📊</div><div>Chart Ready</div><small>Click to interact</small>';
      }
    }, 2000);
  };

  LegacyAnalysisManager.prototype.initializeDataGrid = function() {
    var dataGrid = document.querySelector('.data-grid');
    if (!dataGrid) return;
    
    var searchInput = dataGrid.querySelector('.grid-search');
    var tableBody = dataGrid.querySelector('tbody');
    
    if (searchInput && tableBody) {
      var self = this;
      searchInput.addEventListener('input', function(e) {
        self.filterDataGrid(e.target.value, tableBody);
      });
    }
  };

  LegacyAnalysisManager.prototype.filterDataGrid = function(searchTerm, tableBody) {
    if (!tableBody) return;
    
    var rows = tableBody.querySelectorAll('tr');
    var term = searchTerm.toLowerCase();
    
    rows.forEach(function(row) {
      var text = row.textContent.toLowerCase();
      row.style.display = text.indexOf(term) !== -1 ? '' : 'none';
    });
    
    this.updateGridResultsCount(rows, term);
  };

  LegacyAnalysisManager.prototype.updateGridResultsCount = function(rows, searchTerm) {
    var visibleCount = 0;
    var totalCount = rows.length;
    
    rows.forEach(function(row) {
      if (row.style.display !== 'none') {
        visibleCount++;
      }
    });
    
    var resultsInfo = document.querySelector('.grid-results-info');
    if (resultsInfo) {
      if (searchTerm) {
        resultsInfo.textContent = 'Showing ' + visibleCount + ' of ' + totalCount + ' documents';
      } else {
        resultsInfo.textContent = 'Showing all ' + totalCount + ' documents';
      }
    }
  };

  LegacyAnalysisManager.prototype.initializeViewButtons = function() {
    var self = this;
    var viewButtons = document.querySelectorAll('.view-document');
    
    viewButtons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        var row = button.closest('tr');
        if (row) {
          var title = row.cells[1] ? row.cells[1].textContent : 'Unknown Document';
          self.showDocumentPreview(title, row);
        }
      });
    });
  };

  LegacyAnalysisManager.prototype.showDocumentPreview = function(title, row) {
    // Create a simple modal for document preview
    var modal = document.createElement('div');
    modal.className = 'legacy-modal';
    modal.innerHTML = 
      '<div class="modal-overlay">' +
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<h3>' + this.escapeHtml(title) + '</h3>' +
            '<button class="modal-close">&times;</button>' +
          '</div>' +
          '<div class="modal-body">' +
            '<p><strong>Date:</strong> ' + (row.cells[2] ? row.cells[2].textContent : 'N/A') + '</p>' +
            '<p><strong>Country:</strong> ' + (row.cells[3] ? row.cells[3].textContent : 'N/A') + '</p>' +
            '<p><strong>Type:</strong> ' + (row.cells[4] ? row.cells[4].textContent : 'N/A') + '</p>' +
            '<div class="modal-actions">' +
              '<button class="btn btn-primary">View Full Details</button>' +
              '<button class="btn btn-secondary modal-close">Close</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    
    document.body.appendChild(modal);
    this.styleModal(modal);
    this.addModalEventListeners(modal);
  };

  LegacyAnalysisManager.prototype.styleModal = function(modal) {
    var style = document.createElement('style');
    style.textContent = 
      '.legacy-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; }' +
      '.legacy-modal .modal-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }' +
      '.legacy-modal .modal-content { background: white; border-radius: 8px; width: 90%; max-width: 500px; max-height: 90vh; overflow: auto; }' +
      '.legacy-modal .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }' +
      '.legacy-modal .modal-body { padding: 1.5rem; }' +
      '.legacy-modal .modal-actions { margin-top: 1rem; display: flex; gap: 0.75rem; }' +
      '.legacy-modal .btn { padding: 0.5rem 1rem; border-radius: 0.375rem; border: 1px solid transparent; cursor: pointer; }' +
      '.legacy-modal .btn-primary { background-color: #3b82f6; color: white; }' +
      '.legacy-modal .btn-secondary { background-color: #6b7280; color: white; }' +
      '.legacy-modal .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }';
    
    if (!document.getElementById('legacy-modal-styles')) {
      style.id = 'legacy-modal-styles';
      document.head.appendChild(style);
    }
  };

  LegacyAnalysisManager.prototype.addModalEventListeners = function(modal) {
    var self = this;
    var closeButtons = modal.querySelectorAll('.modal-close');
    var overlay = modal.querySelector('.modal-overlay');
    
    closeButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        document.body.removeChild(modal);
      });
    });
    
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          document.body.removeChild(modal);
        }
      });
    }
  };

  LegacyAnalysisManager.prototype.addLoadingSpinnerStyles = function() {
    if (document.getElementById('legacy-spinner-styles')) return;
    
    var style = document.createElement('style');
    style.id = 'legacy-spinner-styles';
    style.textContent = 
      '.loading-spinner { width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }' +
      '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    
    document.head.appendChild(style);
  };

  LegacyAnalysisManager.prototype.escapeHtml = function(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Initialize when script loads
  var legacyManager = new LegacyAnalysisManager();
  legacyManager.init();
  
  // Make available globally
  window.legacyAnalysisManager = legacyManager;
  window.analysisPageManager = legacyManager; // For compatibility

})();
