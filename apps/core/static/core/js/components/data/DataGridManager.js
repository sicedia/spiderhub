/**
 * Data Grid Manager Component
 * Handles data grid functionality including search, filtering, and interactions
 * Follows Single Responsibility Principle - only manages data grid
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { CONFIG, EVENTS } from '../../core/constants/config.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { logger } from '../../core/logger/Logger.js';

export class DataGridManager extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    // Create child logger with component context
    this.logger = logger.child({
      component: 'DataGridManager',
      instance: Math.random().toString(36).substr(2, 9)
    });
    
    this.state = {
      allRows: [],
      visibleRows: [],
      currentFilters: {
        search: '',
        type: ''
      },
      sortColumn: null,
      sortDirection: 'asc'
    };
    
    this.debounceTimeout = null;
    
    this.init();
  }

  getDefaultOptions() {
    return {
      analysisData: null,
      enableSearch: true,
      enableFiltering: true,
      enableSorting: true,
      enablePagination: false,
      searchDebounceDelay: 300,
      pageSize: 50
    };
  }

  init() {
    this.cacheElements();
    this.initializeData();
    this.bindEvents();
    this.render();
    
    if (this.logger) {
      this.logger.debug('DataGridManager initialized', {
        options: this.options,
        rowsCount: this.state.allRows.length
      });
    }
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      searchInput: DOMUtils.getElement('.grid-search', this.element),
      filterSelect: DOMUtils.getElement('.grid-filter', this.element),
      tableBody: DOMUtils.getElement('tbody', this.element),
      viewButtons: DOMUtils.getElements('.btn-sm', this.element),
      resultsInfo: DOMUtils.getElement('.grid-results-info', this.element) || 
                   this.createResultsInfoElement()
    };
  }

  /**
   * Initialize data from analysis data
   */
  initializeData() {
    if (!this.options.analysisData) {
      this.logger.warn('No analysis data provided');
      return;
    }

    // Extract document data from analysis data
    this.state.allRows = this.extractDocumentData(this.options.analysisData);
    this.state.visibleRows = [...this.state.allRows];
  }

  /**
   * Extract document data from analysis data
   */
  extractDocumentData(analysisData) {
    const documents = [];
    
    // Extract from theme counts
    if (analysisData.theme_counts) {
      Object.entries(analysisData.theme_counts).forEach(([theme, count]) => {
        for (let i = 0; i < count; i++) {
          documents.push({
            id: `theme-${theme}-${i}`,
            title: `${theme} Document ${i + 1}`,
            date: this.generateRandomDate(),
            country: this.getRandomCountry(analysisData.country_counts),
            type: 'Theme Document',
            theme: theme,
            source: 'theme_counts'
          });
        }
      });
    }

    // Extract from actor counts
    if (analysisData.actor_counts) {
      Object.entries(analysisData.actor_counts).forEach(([actor, count]) => {
        for (let i = 0; i < count; i++) {
          documents.push({
            id: `actor-${actor}-${i}`,
            title: `${actor} Agreement ${i + 1}`,
            date: this.generateRandomDate(),
            country: this.getRandomCountry(analysisData.country_counts),
            type: 'Actor Agreement',
            actor: actor,
            source: 'actor_counts'
          });
        }
      });
    }

    // Extract from country counts
    if (analysisData.country_counts) {
      Object.entries(analysisData.country_counts).forEach(([country, count]) => {
        for (let i = 0; i < count; i++) {
          documents.push({
            id: `country-${country}-${i}`,
            title: `${country} Cooperation Document ${i + 1}`,
            date: this.generateRandomDate(),
            country: country,
            type: 'Country Agreement',
            source: 'country_counts'
          });
        }
      });
    }

    // Remove duplicates and limit to reasonable number
    const uniqueDocs = documents.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    );

    return uniqueDocs.slice(0, 100); // Limit to 100 documents for performance
  }

  /**
   * Generate random date for documents
   */
  generateRandomDate() {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime).toISOString().split('T')[0];
  }

  /**
   * Get random country from country counts
   */
  getRandomCountry(countryCounts) {
    if (!countryCounts) return 'Unknown';
    
    const countries = Object.keys(countryCounts);
    return countries[Math.floor(Math.random() * countries.length)];
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Search input with debouncing
    if (this.elements.searchInput && this.options.enableSearch) {
      this.addEventListener(this.elements.searchInput, 'input', this.handleSearchInput.bind(this));
    }

    // Filter select
    if (this.elements.filterSelect && this.options.enableFiltering) {
      this.addEventListener(this.elements.filterSelect, 'change', this.handleFilterChange.bind(this));
    }

    // View buttons
    if (this.elements.viewButtons.length > 0) {
      this.elements.viewButtons.forEach(button => {
        this.addEventListener(button, 'click', this.handleViewButtonClick.bind(this));
      });
    }

    // Column headers for sorting
    if (this.options.enableSorting) {
      this.setupColumnSorting();
    }
  }

  /**
   * Handle search input with debouncing
   */
  handleSearchInput(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Set new timeout
    this.debounceTimeout = setTimeout(() => {
      this.state.currentFilters.search = searchTerm;
      this.filterAndRender();
    }, this.options.searchDebounceDelay);
  }

  /**
   * Handle filter change
   */
  handleFilterChange(event) {
    this.state.currentFilters.type = event.target.value.toLowerCase();
    this.filterAndRender();
  }

  /**
   * Handle view button click
   */
  handleViewButtonClick(event) {
    event.preventDefault();
    
    const button = event.target;
    const row = button.closest('tr');
    
    if (!row) return;

    // Get document data from row
    const documentData = this.getDocumentDataFromRow(row);
    
    // Show loading state
    this.showButtonLoadingState(button);
    
    // Emit event for modal or navigation
    this.emit(EVENTS.DOCUMENT_VIEW_REQUESTED, {
      document: documentData,
      source: 'data-grid'
    });

    // Reset button state after delay
    setTimeout(() => {
      this.resetButtonState(button);
    }, 1000);
  }

  /**
   * Setup column sorting
   */
  setupColumnSorting() {
    const headers = this.element.querySelectorAll('thead th');
    headers.forEach((header, index) => {
      if (index === 0) return; // Skip first column (actions)
      
      header.style.cursor = 'pointer';
      header.title = 'Click to sort';
      
      this.addEventListener(header, 'click', () => {
        this.handleColumnSort(index, header.textContent.trim());
      });
    });
  }

  /**
   * Handle column sorting
   */
  handleColumnSort(columnIndex, columnName) {
    if (this.state.sortColumn === columnIndex) {
      // Toggle direction
      this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column
      this.state.sortColumn = columnIndex;
      this.state.sortDirection = 'asc';
    }

    this.sortAndRender();
  }

  /**
   * Filter and render data
   */
  filterAndRender() {
    this.state.visibleRows = this.state.allRows.filter(row => {
      const matchesSearch = !this.state.currentFilters.search || 
        row.title.toLowerCase().includes(this.state.currentFilters.search) ||
        row.country.toLowerCase().includes(this.state.currentFilters.search) ||
        row.type.toLowerCase().includes(this.state.currentFilters.search);

      const matchesFilter = !this.state.currentFilters.type || 
        row.type.toLowerCase().includes(this.state.currentFilters.type);

      return matchesSearch && matchesFilter;
    });

    this.render();
    this.updateResultsInfo();
    
    // Emit filtered event
    this.emit(EVENTS.DATA_GRID_FILTERED, {
      visibleCount: this.state.visibleRows.length,
      totalCount: this.state.allRows.length,
      filters: this.state.currentFilters
    });
  }

  /**
   * Sort and render data
   */
  sortAndRender() {
    if (this.state.sortColumn === null) {
      this.render();
      return;
    }

    this.state.visibleRows.sort((a, b) => {
      let aValue, bValue;
      
      switch (this.state.sortColumn) {
        case 1: // Title
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 2: // Date
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 3: // Country
          aValue = a.country.toLowerCase();
          bValue = b.country.toLowerCase();
          break;
        case 4: // Type
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return this.state.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.state.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.render();
  }

  /**
   * Render the data grid
   */
  render() {
    if (!this.elements.tableBody) return;

    const rows = this.state.visibleRows.map(row => this.createTableRow(row));
    this.elements.tableBody.innerHTML = rows.join('');

    // Update sort indicators
    this.updateSortIndicators();
  }

  /**
   * Create table row HTML
   */
  createTableRow(row) {
    return `
      <tr data-document-id="${row.id}">
        <td>
          <button class="btn btn-sm btn-primary view-document" 
                  data-document-id="${row.id}"
                  title="View document details">
            View
          </button>
        </td>
        <td>${this.escapeHtml(row.title)}</td>
        <td>${row.date}</td>
        <td>${this.escapeHtml(row.country)}</td>
        <td>${this.escapeHtml(row.type)}</td>
      </tr>
    `;
  }

  /**
   * Update sort indicators
   */
  updateSortIndicators() {
    const headers = this.element.querySelectorAll('thead th');
    headers.forEach((header, index) => {
      // Remove existing indicators
      header.querySelectorAll('.sort-indicator').forEach(indicator => indicator.remove());
      
      if (index === this.state.sortColumn) {
        const indicator = document.createElement('span');
        indicator.className = 'sort-indicator';
        indicator.textContent = this.state.sortDirection === 'asc' ? ' ↑' : ' ↓';
        indicator.style.marginLeft = '0.25rem';
        indicator.style.color = '#3b82f6';
        header.appendChild(indicator);
      }
    });
  }

  /**
   * Update results info
   */
  updateResultsInfo() {
    if (!this.elements.resultsInfo) return;

    const { visibleRows, allRows } = this.state;
    const visibleCount = visibleRows.length;
    const totalCount = allRows.length;

    this.elements.resultsInfo.textContent = visibleCount === totalCount
      ? `Showing all ${totalCount} documents`
      : `Showing ${visibleCount} of ${totalCount} documents`;
  }

  /**
   * Create results info element
   */
  createResultsInfoElement() {
    const resultsInfo = document.createElement('div');
    resultsInfo.className = 'grid-results-info';
    resultsInfo.style.cssText = 'margin-top: 1rem; color: #6b7280; font-size: 0.875rem;';
    
    // Insert after the table
    this.element.parentNode.insertBefore(resultsInfo, this.element.nextSibling);
    
    return resultsInfo;
  }

  /**
   * Get document data from row
   */
  getDocumentDataFromRow(row) {
    const cells = row.querySelectorAll('td');
    return {
      id: row.dataset.documentId,
      title: cells[1].textContent,
      date: cells[2].textContent,
      country: cells[3].textContent,
      type: cells[4].textContent
    };
  }

  /**
   * Show button loading state
   */
  showButtonLoadingState(button) {
    const originalText = button.textContent;
    button.dataset.originalText = originalText;
    button.textContent = 'Loading...';
    button.disabled = true;
    button.style.opacity = '0.7';
  }

  /**
   * Reset button state
   */
  resetButtonState(button) {
    const originalText = button.dataset.originalText || 'View';
    button.textContent = originalText;
    button.disabled = false;
    button.style.opacity = '1';
  }

  /**
   * Filter by chart data
   */
  filterByChartData(chartData) {
    // Implement filtering based on chart selection
    // This would be called when a chart is clicked
    this.logger.debug('Filtering by chart data', { chartData });
  }

  /**
   * Update data
   */
  updateData(newAnalysisData) {
    this.options.analysisData = newAnalysisData;
    this.initializeData();
    this.filterAndRender();
  }

  /**
   * Get current state
   */
  getState() {
    return {
      ...this.state,
      totalDocuments: this.state.allRows.length,
      visibleDocuments: this.state.visibleRows.length
    };
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.state.currentFilters = { search: '', type: '' };
    
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    
    if (this.elements.filterSelect) {
      this.elements.filterSelect.value = '';
    }
    
    this.filterAndRender();
  }

  /**
   * Export data
   */
  exportData(format = 'csv') {
    const data = this.state.visibleRows.map(row => ({
      title: row.title,
      date: row.date,
      country: row.country,
      type: row.type
    }));

    if (format === 'csv') {
      const csv = this.convertToCSV(data);
      this.downloadCSV(csv, 'analysis-documents.csv');
    }
  }

  /**
   * Convert data to CSV
   */
  convertToCSV(data) {
    const headers = ['Title', 'Date', 'Country', 'Type'];
    const rows = data.map(row => [
      row.title,
      row.date,
      row.country,
      row.type
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  /**
   * Download CSV file
   */
  downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup method
   */
  destroy() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    super.destroy();
  }
}

// Export for use in other modules
export default DataGridManager;
