/**
 * Filter Manager Component
 * Coordinates between filter groups and filter chips
 * Main entry point for filter functionality
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { FilterGroups } from './FilterGroups.js';
import { FilterChips } from './FilterChips.js';
import { EVENTS } from '../../core/constants/config.js';
import { logger } from '../../core/logger/Logger.js';

export class FilterManager extends BaseComponent {
  constructor(element, options = {}) {
    // Initialize properties BEFORE calling super() to avoid overwriting values set in init()
    // Note: In ES6, we can't access 'this' before super(), so we'll initialize in init() instead
    super(element, options);
    
    // Create child logger with component context
    this.logger = logger.child({
      component: 'FilterManager',
      instance: Math.random().toString(36).substr(2, 9)
    });
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
    this.pendingFilters = new Set(); // Track filters that are selected but not yet applied
    this.appliedFilters = new Set(); // Track filters that are currently applied
    
    if (this.logger) {
      this.logger.debug('FilterManager initialized', {
        options: this.options
      });
    }
    
    this.initializeComponents();
    this.bindEvents();
    this.updateUIState();
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
        this.logger.warn('FilterChips not initialized');
        return;
      }
      
      const filterKey = `${filterName}-${filterValue}`;
      
      if (isChecked) {
        // Add to pending filters
        this.pendingFilters.add(filterKey);
        this.appliedFilters.add(filterKey);
        this.filterChips.addFilter(filterName, filterValue, filterLabel, filterCategory);
      } else {
        // Remove from pending and applied
        this.pendingFilters.delete(filterKey);
        this.appliedFilters.delete(filterKey);
        this.filterChips.removeFilter(filterName, filterValue);
      }
      
      // Update UI state - use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        this.updateUIState();
      });
      
      // Auto-apply if autoCommit is enabled
      if (this.options.autoCommit) {
        this.applyFilters();
      }
    });

    // Listen for filter change events from filter chips
    document.addEventListener('filterChange', (e) => {
      this.handleFilterChange(e.detail.activeFilters);
      this.updateUIState();
    });

    // Bind clear all filters button
    const clearAllBtn = document.getElementById('clear-filters');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // Apply and Reset buttons removed - using autoCommit instead

    // Mobile filter toggle
    const filterToggle = document.querySelector('.filter-header__toggle');
    if (filterToggle) {
      filterToggle.addEventListener('click', () => {
        this.toggleMobileFilters();
      });
    }
    
    // Listen for filter count changes from FilterChips
    document.addEventListener('filterCountChanged', (e) => {
      // Use requestAnimationFrame to ensure we get the latest count
      requestAnimationFrame(() => {
        this.updateUIState();
      });
    });
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
    this.pendingFilters.clear();
    this.appliedFilters.clear();
    
    if (this.filterChips) {
      this.filterChips.clearAllFilters();
    }
    
    this.updateUIState();
    
    if (this.options.autoCommit) {
      this.applyFilters();
    }
  }

  resetFilters() {
    this.pendingFilters.clear();
    this.appliedFilters.clear();
    
    if (this.filterGroups) {
      this.filterGroups.resetAllFilters();
    }
    if (this.filterChips) {
      this.filterChips.clearAllFilters();
    }
    
    this.updateUIState();
    
    if (this.options.autoCommit) {
      this.applyFilters();
    }
  }

  applyFilters() {
    // Move pending filters to applied
    this.appliedFilters = new Set(this.pendingFilters);
    
    const activeFilters = this.getActiveFilters();
    this.handleFilterChange(activeFilters);
    this.emit(EVENTS.SEARCH_COMMITTED, { activeFilters });
  }
  
  /**
   * Update UI state indicators (counters, button states, etc.)
   */
  updateUIState() {
    // Always get the current count directly from FilterChips
    const activeFilterCount = this.filterChips ? this.filterChips.activeFilters.size : 0;
    
    // Update filter count badge
    const countBadge = document.getElementById('filter-count-badge');
    const countNumber = document.getElementById('filter-count-number');
    if (countBadge && countNumber) {
      // Always update the number first, even if it's 0
      countNumber.textContent = activeFilterCount;
      
      if (activeFilterCount > 0) {
        countBadge.hidden = false;
      } else {
        countBadge.hidden = true;
      }
    }
    
    // Update Clear all button
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
      clearBtn.disabled = activeFilterCount === 0;
      clearBtn.setAttribute('aria-disabled', activeFilterCount === 0 ? 'true' : 'false');
    }
  }
  
  /**
   * Check if two sets are equal
   */
  setsEqual(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
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
    const filterKey = `${filterType}-${filterValue}`;
    this.pendingFilters.add(filterKey);
    this.appliedFilters.add(filterKey);
    
    this.setFilter(filterType, filterValue, filterLabel, filterCategory);
    this.updateUIState();
    
    if (this.options.autoCommit) {
      this.applyFilters();
    }
  }

  removeFilter(filterName, filterValue) {
    const filterKey = `${filterName}-${filterValue}`;
    this.pendingFilters.delete(filterKey);
    this.appliedFilters.delete(filterKey);
    
    if (this.filterChips) {
      this.filterChips.removeFilter(filterName, filterValue);
    }
    
    this.updateUIState();
    
    if (this.options.autoCommit) {
      this.applyFilters();
    }
  }
}

// Default export
export default FilterManager;