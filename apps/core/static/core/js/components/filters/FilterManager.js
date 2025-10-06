/**
 * Filter Manager Component
 * Manages all filtering functionality with clean separation of concerns
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { FILTER_TYPES, EVENTS } from '../../core/constants/config.js';
import { DOMUtils } from '../../core/utils/dom.js';

export class FilterManager extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    // Initialize activeFilters AFTER calling super()
    this.activeFilters = [];
    
    // Check if FILTER_TYPES is available
    if (typeof FILTER_TYPES === 'undefined') {
      console.error('FilterManager: FILTER_TYPES is undefined - check imports');
      this.filterTypeNames = {};
    } else {
      this.filterTypeNames = this.getFilterTypeNames();
    }
  }

  getDefaultOptions() {
    return {
      autoCommit: true,
      showActiveFilters: true,
      activeFiltersContainer: '#active-filters'
    };
  }

  init() {
    this.cacheElements();
    super.init();
    this.initializeActiveFilters();
  }

  cacheElements() {
    // Ensure activeFilters is always properly initialized (should not be needed now)
    if (!this.activeFilters) {
      this.activeFilters = [];
    }
    
    this.elements = {
      activeFiltersContainer: DOMUtils.getElement(this.options.activeFiltersContainer),
      filterCheckboxes: DOMUtils.getElements('.filter-checkbox input'),
      dateFromInput: DOMUtils.getElement('#date_from'),
      dateToInput: DOMUtils.getElement('#date_to'),
      resetButton: DOMUtils.getElement('.btn-reset-filters'),
      applyButton: DOMUtils.getElement('.apply-filters')
    };

    // Debug: Log missing elements
    const optionalElements = ['applyButton', 'resetButton', 'dateFromInput', 'dateToInput'];
    optionalElements.forEach(elementKey => {
      if (!this.elements[elementKey]) {
        console.warn(`FilterManager: Missing element '${elementKey}' - related functionality will be disabled`);
      }
    });

    if (!this.elements.activeFiltersContainer) {
      console.warn('FilterManager: Missing activeFiltersContainer - active filters display will be disabled');
    }
  }

  bindEvents() {
    // Apply filters button
    if (this.elements.applyButton) {
      this.addEventListener(this.elements.applyButton, 'click', this.handleApplyFilters.bind(this));
    }

    // Reset filters button
    if (this.elements.resetButton) {
      this.addEventListener(this.elements.resetButton, 'click', this.handleResetFilters.bind(this));
    }

    // Active filter chips removal
    if (this.elements.activeFiltersContainer) {
      this.addEventListener(this.elements.activeFiltersContainer, 'click', this.handleChipClick.bind(this));
    }
  }

  /**
   * Get human-readable filter type names
   */
  getFilterTypeNames() {
    return {
      [FILTER_TYPES.SEARCH]: 'Keyword',
      [FILTER_TYPES.TYPE]: 'Type',
      [FILTER_TYPES.COUNTRY]: 'Country',
      [FILTER_TYPES.THEME]: 'Topic',
      [FILTER_TYPES.ACTOR]: 'Actor',
      [FILTER_TYPES.BENEFICIARY]: 'Beneficiary',
      [FILTER_TYPES.SDG]: 'SDG',
      [FILTER_TYPES.LEGAL_BINDINGNESS]: 'Binding',
      [FILTER_TYPES.AGREEMENT_TYPE]: 'Agreement',
      [FILTER_TYPES.DATE_FROM]: 'From',
      [FILTER_TYPES.DATE_TO]: 'Until'
    };
  }

  /**
   * Add a filter to the active filters list
   */
  addFilter(type, value, label = null) {
    // Check if filter already exists
    const existingIndex = this.activeFilters.findIndex(
      filter => filter.type === type && filter.value === value
    );

    if (existingIndex === -1) {
      const filter = {
        type,
        value,
        label: label || value,
        id: this.generateFilterId()
      };

      this.activeFilters.push(filter);
      this.updateActiveFiltersDisplay();
      this.emit(EVENTS.FILTER_CHANGED, { action: 'add', filter });

      if (this.options.autoCommit) {
        this.commitFilters();
      }
    }

    return this;
  }

  /**
   * Remove a filter from the active filters list
   */
  removeFilter(type, value = null, commitSearch = true) {
    let removedFilters = [];

    if (value === null || value === undefined) {
      // Remove all filters of this type
      removedFilters = this.activeFilters.filter(filter => filter.type === type);
      this.activeFilters = this.activeFilters.filter(filter => filter.type !== type);
    } else {
      // Remove specific filter
      const index = this.activeFilters.findIndex(
        filter => filter.type === type && filter.value === value
      );
      
      if (index !== -1) {
        removedFilters = [this.activeFilters[index]];
        this.activeFilters.splice(index, 1);
      }
    }

    if (removedFilters.length > 0) {
      // Update UI checkboxes
      removedFilters.forEach(filter => {
        const checkboxes = DOMUtils.getElements(`input[name="${filter.type}"][value="${filter.value}"]`);
        checkboxes.forEach(checkbox => checkbox.checked = false);
      });

      this.updateActiveFiltersDisplay();
      this.emit(EVENTS.FILTER_CHANGED, { action: 'remove', filters: removedFilters });

      if (commitSearch && this.options.autoCommit) {
        this.commitFilters();
      }
    }

    return this;
  }

  /**
   * Get all active filters
   */
  getActiveFilters() {
    return [...this.activeFilters];
  }

  /**
   * Get filters by type
   */
  getFiltersByType(type) {
    return this.activeFilters.filter(filter => filter.type === type);
  }

  /**
   * Check if a specific filter is active
   */
  hasFilter(type, value = null) {
    if (value === null) {
      return this.activeFilters.some(filter => filter.type === type);
    }
    return this.activeFilters.some(filter => filter.type === type && filter.value === value);
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    const removedFilters = [...this.activeFilters];
    this.activeFilters = [];

    // Reset form inputs
    this.elements.filterCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    if (this.elements.dateFromInput) this.elements.dateFromInput.value = '';
    if (this.elements.dateToInput) this.elements.dateToInput.value = '';

    this.updateActiveFiltersDisplay();
    this.emit(EVENTS.FILTER_CHANGED, { action: 'clear', filters: removedFilters });

    if (this.options.autoCommit) {
      this.commitFilters();
    }

    return this;
  }

  /**
   * Handle apply filters button click
   */
  handleApplyFilters() {
    // Process checkboxes
    this.elements.filterCheckboxes.forEach(checkbox => {
      const { name, value, checked } = checkbox;
      const label = checkbox.getAttribute('label') || value;

      if (checked) {
        this.addFilter(name, value, label);
      } else {
        this.removeFilter(name, value, false);
      }
    });

    // Process date inputs
    this.removeFilter(FILTER_TYPES.DATE_FROM, null, false);
    this.removeFilter(FILTER_TYPES.DATE_TO, null, false);

    if (this.elements.dateFromInput?.value) {
      this.addFilter(FILTER_TYPES.DATE_FROM, this.elements.dateFromInput.value);
    }

    if (this.elements.dateToInput?.value) {
      this.addFilter(FILTER_TYPES.DATE_TO, this.elements.dateToInput.value);
    }

    this.commitFilters();
  }

  /**
   * Handle reset filters button click
   */
  handleResetFilters() {
    this.clearAllFilters();
  }

  /**
   * Handle filter chip click (for removal)
   */
  handleChipClick(event) {
    if (event.target.classList.contains('remove-filter')) {
      const id = event.target.dataset.id; // Don't parse as int, keep as string
      const filter = this.activeFilters.find(f => f.id === id);
      
      if (filter) {
        this.removeFilter(filter.type, filter.value);
      }
    }
  }

  /**
   * Update the active filters display
   */
  updateActiveFiltersDisplay() {
    if (!this.elements.activeFiltersContainer || !this.options.showActiveFilters) {
      return;
    }

    // Debug and safety check
    if (!this.activeFilters) {
      console.error('FilterManager: activeFilters is undefined in updateActiveFiltersDisplay');
      this.activeFilters = [];
      return;
    }

    if (this.activeFilters.length === 0) {
      this.elements.activeFiltersContainer.innerHTML = '';
      return;
    }

    const filtersHTML = this.activeFilters.map(filter => `
      <div class="filter-chip" data-id="${filter.id}" data-type="${filter.type}" data-value="${filter.value}">
        <span class="filter-type">${this.filterTypeNames[filter.type] || filter.type}:</span>
        <span class="filter-value">${filter.label}</span>
        <span class="remove-filter" data-id="${filter.id}" title="Remove filter">×</span>
      </div>
    `).join('');

    this.elements.activeFiltersContainer.innerHTML = filtersHTML;
  }

  /**
   * Initialize active filters display
   */
  initializeActiveFilters() {
    if (this.options.showActiveFilters) {
      this.updateActiveFiltersDisplay();
    }
  }

  /**
   * Commit filters (trigger search)
   */
  commitFilters() {
    // Emit our own event for any listeners
    this.emit(EVENTS.SEARCH_COMMITTED, { 
      filters: this.getActiveFilters(),
      filterManager: this 
    });
    
    // Also trigger the existing search system's commitSearch event
    if (this.elements.activeFiltersContainer) {
      const commitSearchEvent = new CustomEvent('commitSearch', {
        detail: { filters: this.getActiveFilters() }
      });
      this.elements.activeFiltersContainer.dispatchEvent(commitSearchEvent);
    }
  }

  /**
   * Generate unique filter ID
   */
  generateFilterId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Export filters to URL parameters
   */
  toURLParams() {
    const params = new URLSearchParams();
    
    this.activeFilters.forEach(filter => {
      params.append(filter.type, filter.value);
    });

    return params;
  }

  /**
   * Import filters from URL parameters
   */
  fromURLParams(urlParams) {
    this.clearAllFilters();
    
    for (const [type, value] of urlParams.entries()) {
      if (Object.values(FILTER_TYPES).includes(type)) {
        this.addFilter(type, value);
      }
    }

    return this;
  }

  /**
   * Get filter summary for display
   */
  getFilterSummary() {
    const summary = {};
    
    this.activeFilters.forEach(filter => {
      if (!summary[filter.type]) {
        summary[filter.type] = [];
      }
      summary[filter.type].push(filter.label);
    });

    return summary;
  }
}

// Default export
export default FilterManager;
