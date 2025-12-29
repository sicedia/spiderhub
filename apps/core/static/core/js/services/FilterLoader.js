/**
 * Filter Loader Service
 * SPA Mode: Loads filter options from API and renders them to DOM
 */

import { logger } from '../core/logger/Logger.js';

export class FilterLoader {
  constructor() {
    this.logger = logger.child({ component: 'FilterLoader' });
    this.filtersData = null;
    this.isLoading = false;
  }

  /**
   * Load all filters from API
   */
  async loadFilters() {
    if (this.isLoading) return this.filtersData;
    
    this.isLoading = true;
    this.showLoadingState();
    
    try {
      this.logger.debug('Loading filters from API');
      
      const response = await fetch('/api/v1/explore/filters/');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      this.filtersData = await response.json();
      this.logger.info('Filters loaded successfully', this.filtersData);
      
      this.renderFilters();
      
      // Small delay to ensure DOM is updated before hiding
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Ensure loading is hidden after rendering
      this.hideLoadingState();
      
      return this.filtersData;
      
    } catch (error) {
      this.logger.error('Failed to load filters from API', error);
      // Always hide loading state, even on error
      this.hideLoadingState();
      this.showErrorState();
      return null;
    } finally {
      this.isLoading = false;
      // Double-check that loading is hidden in finally block
      this.hideLoadingState();
    }
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const loading = document.getElementById('filters-loading');
    if (loading) {
      loading.hidden = false;
      loading.style.display = ''; // Remove inline display:none if present
      this.logger.debug('Loading state shown');
    } else {
      this.logger.warn('filters-loading element not found when trying to show');
    }
    
    const accordion = document.getElementById('filter-accordion');
    if (accordion) accordion.style.opacity = '0.5';
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const loading = document.getElementById('filters-loading');
    if (loading) {
      loading.hidden = true;
      loading.style.display = 'none'; // Force hide with CSS as well
      this.logger.debug('Loading state hidden');
    } else {
      this.logger.warn('filters-loading element not found when trying to hide');
    }
    
    const accordion = document.getElementById('filter-accordion');
    if (accordion) {
      accordion.style.opacity = '1';
    }
  }

  /**
   * Show error state
   */
  showErrorState() {
    const loading = document.getElementById('filters-loading');
    if (loading) {
      loading.innerHTML = '<span class="filter-error">Failed to load filters</span>';
      loading.hidden = false;
    }
  }

  /**
   * Render all filters to DOM
   */
  renderFilters() {
    if (!this.filtersData) return;
    
    // Render document types
    this.renderFilterOptions(
      'filter-options-document-type',
      this.filtersData.available_doc_types || [],
      'document_type',
      'doc-type'
    );
    
    // Render legal bindingness
    this.renderFilterOptions(
      'filter-options-legal-bindingness',
      this.filtersData.available_legal_bindingness || [],
      'legal_bindingness',
      'legal-bindingness'
    );
    
    // Render coverage scope
    this.renderFilterOptions(
      'filter-options-coverage-scope',
      this.filtersData.available_coverage_scope || [],
      'coverage_scope',
      'coverage-scope'
    );
    
    // Render agreement types
    this.renderFilterOptions(
      'filter-options-agreement-type',
      this.filtersData.available_agreement_types || [],
      'agreement_type',
      'agreement-type'
    );
    
    // Countries are now handled via typeahead in FilterGroups
    // No need to render them as checkboxes anymore
    // The typeahead will load countries dynamically based on role
    
    // Render actors
    this.renderFilterOptions(
      'filter-options-actors',
      this.filtersData.available_actors || [],
      'actor',
      'actor'
    );
    
    // Render beneficiaries
    this.renderFilterOptions(
      'filter-options-beneficiaries',
      this.filtersData.available_beneficiaries || [],
      'beneficiary',
      'beneficiary'
    );
    
    // Render themes
    this.renderFilterOptions(
      'filter-options-themes',
      this.filtersData.available_themes || [],
      'theme',
      'theme'
    );
    
    // Render SDGs
    this.renderFilterOptions(
      'filter-options-sdgs',
      this.filtersData.available_sdgs || [],
      'sdg',
      'sdg'
    );
    
    // Update counts
    this.updateFilterCounts();
  }

  /**
   * Render filter options to container
   * @param {string} containerId - DOM container ID
   * @param {Array} options - Array of [value, label, count] tuples
   * @param {string} name - Input name attribute
   * @param {string} idPrefix - ID prefix for inputs
   */
  renderFilterOptions(containerId, options, name, idPrefix) {
    const container = document.getElementById(containerId);
    if (!container) {
      this.logger.warn(`Container not found: ${containerId}`);
      return;
    }
    
    if (!options || options.length === 0) {
      container.innerHTML = '<div class="filter-empty">No options available</div>';
      return;
    }
    
    container.innerHTML = options.map(([value, label, count]) => `
      <div class="filter-option" data-search-text="${this.escapeHtml(String(label).toLowerCase())}">
        <input
          type="checkbox"
          name="${name}"
          value="${this.escapeHtml(String(value))}"
          class="filter-option__checkbox"
          id="${idPrefix}-${this.escapeHtml(String(value))}"
        />
        <label for="${idPrefix}-${this.escapeHtml(String(value))}" class="filter-option__label">${this.escapeHtml(String(label))}</label>
        <span class="filter-option__count">${count || 0}</span>
      </div>
    `).join('');
  }

  /**
   * Update filter group counts in headers
   */
  updateFilterCounts() {
    const countMappings = {
      'document_type': this.filtersData.available_doc_types?.length || 0,
      'countries': this.filtersData.available_countries?.length || 0,
      'actors': this.filtersData.available_actors?.length || 0,
      'beneficiaries': this.filtersData.available_beneficiaries?.length || 0,
      'themes': this.filtersData.available_themes?.length || 0,
      'sdgs': this.filtersData.available_sdgs?.length || 0
    };
    
    Object.entries(countMappings).forEach(([key, count]) => {
      const countEl = document.querySelector(`[data-count="${key}"]`);
      if (countEl) {
        countEl.textContent = count;
      }
    });
  }

  /**
   * Escape HTML for XSS prevention
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get loaded filters data
   */
  getFiltersData() {
    return this.filtersData;
  }
}

export default FilterLoader;

