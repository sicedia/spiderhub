/**
 * Filter Manager Component
 * Coordinates between filter groups and filter chips
 * Main entry point for filter functionality
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { FilterGroups } from './FilterGroups.js';
import { FilterChips } from './FilterChips.js';
import { EVENTS } from '../../core/constants/config.js';

export class FilterManager extends BaseComponent {
  constructor(element, options = {}) {
    // Initialize properties BEFORE calling super() to avoid overwriting values set in init()
    // Note: In ES6, we can't access 'this' before super(), so we'll initialize in init() instead
    super(element, options);
  }

  getDefaultOptions() {
    return {
      filterGroupsSelector: '.filter-groups',
      filterChipsSelector: '.filter-chips',
      autoCommit: false,
      showActiveFilters: true
    };
  }

  init() {
    // Initialize instance properties here (not in constructor after super())
    this.filterGroups = null;
    this.filterChips = null;
    
    this.initializeComponents();
    this.bindEvents();
  }

  initializeComponents() {
    // Initialize filter groups
    const filterGroupsContainer = document.querySelector(this.options.filterGroupsSelector);
    if (filterGroupsContainer) {
      this.filterGroups = new FilterGroups(filterGroupsContainer);
    }

    // Initialize filter chips
    // First try to use the element itself if it has the filter-chips class
    let filterChipsContainer = this.element;
    if (!filterChipsContainer.classList.contains('filter-chips')) {
      // Otherwise search for it in the document
      filterChipsContainer = document.querySelector(this.options.filterChipsSelector);
    }
    
    if (filterChipsContainer) {
      this.filterChips = new FilterChips(filterChipsContainer);
    }
  }

  bindEvents() {
    // Listen for filter toggle events from filter groups
    document.addEventListener('filterToggle', (e) => {
      const { filterName, filterValue, filterLabel, filterCategory, isChecked } = e.detail;
      
      if (!this.filterChips) {
        console.warn('FilterChips not initialized');
        return;
      }
      
      if (isChecked) {
        this.filterChips.addFilter(filterName, filterValue, filterLabel, filterCategory);
      } else {
        this.filterChips.removeFilter(filterName, filterValue);
      }
    });

    // Listen for filter change events from filter chips
    document.addEventListener('filterChange', (e) => {
      this.handleFilterChange(e.detail.activeFilters);
    });

    // Bind clear all filters button
    const clearAllBtn = document.getElementById('clear-filters');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // Bind reset filters button
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }

    // Bind apply filters button
    const applyBtn = document.getElementById('apply-filters');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }

    // Mobile filter toggle
    const filterToggle = document.querySelector('.filter-header__toggle');
    if (filterToggle) {
      filterToggle.addEventListener('click', () => {
        this.toggleMobileFilters();
      });
    }
  }

  handleFilterChange(activeFilters) {
    // This method can be overridden by the main application
    // to handle actual filtering logic
    
    // Emit component event
    this.emit(EVENTS.FILTER_CHANGED, { activeFilters });
    
    // Also dispatch a global event for other components to listen to
    const event = new CustomEvent('filtersChanged', {
      detail: { activeFilters }
    });
    document.dispatchEvent(event);
    
    // Trigger commitSearch event for backward compatibility with old search system
    const commitEvent = new CustomEvent('commitSearch', {
      bubbles: true,
      detail: { activeFilters }
    });
    this.element.dispatchEvent(commitEvent);
  }

  clearAllFilters() {
    if (this.filterChips) {
      this.filterChips.clearAllFilters();
    }
  }

  resetFilters() {
    if (this.filterGroups) {
      this.filterGroups.resetAllFilters();
    }
    if (this.filterChips) {
      this.filterChips.clearAllFilters();
    }
  }

  applyFilters() {
    const activeFilters = this.getActiveFilters();
    this.handleFilterChange(activeFilters);
    this.emit(EVENTS.SEARCH_COMMITTED, { activeFilters });
  }

  getActiveFilters() {
    if (this.filterGroups) {
      return this.filterGroups.getActiveFilters();
    }
    return [];
  }

  toggleMobileFilters() {
    const filterGroups = document.querySelector(this.options.filterGroupsSelector);
    const toggle = document.querySelector('.filter-header__toggle');
    
    if (filterGroups && toggle) {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        filterGroups.classList.add('filter-groups--collapsed');
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        filterGroups.classList.remove('filter-groups--collapsed');
        toggle.setAttribute('aria-expanded', 'true');
      }
    }
  }

  // Public API methods
  setFilter(filterName, filterValue, filterLabel, filterCategory = '') {
    if (this.filterChips) {
      this.filterChips.addFilter(filterName, filterValue, filterLabel, filterCategory);
    }
  }

  removeFilter(filterName, filterValue) {
    if (this.filterChips) {
      this.filterChips.removeFilter(filterName, filterValue);
    }
  }

  hasActiveFilters() {
    if (this.filterChips) {
      return this.filterChips.hasActiveFilters();
    }
    return false;
  }

  expandAllGroups() {
    if (this.filterGroups) {
      this.filterGroups.expandAllGroups();
    }
  }

  collapseAllGroups() {
    if (this.filterGroups) {
      this.filterGroups.collapseAllGroups();
    }
  }

  // Methods expected by ExplorePageManager
  addFilter(filterType, filterValue, filterLabel, filterCategory = '') {
    this.setFilter(filterType, filterValue, filterLabel, filterCategory);
    if (this.options.autoCommit) {
      this.applyFilters();
    }
  }

  clearAllFilters() {
    this.resetFilters();
    if (this.options.autoCommit) {
      this.applyFilters();
    }
  }
}

// Default export
export default FilterManager;