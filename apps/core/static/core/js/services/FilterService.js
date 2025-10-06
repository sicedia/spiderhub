/**
 * Filter Service
 * Handles filter logic and state management
 * ES6 Module Export
 */

import { FILTER_TYPES, EVENT_TYPES } from '../core/constants/enums.js';
import { EventUtils } from '../core/utils/events.js';

export class FilterService {
  constructor() {
    this.activeFilters = new Map();
    this.filterHistory = [];
    this.maxHistorySize = 10;
    this.eventBus = EventUtils;
  }

  /**
   * Add a filter
   */
  addFilter(type, value, label = null) {
    if (!Object.values(FILTER_TYPES).includes(type)) {
      console.warn(`Unknown filter type: ${type}`);
      return false;
    }

    const filterId = this.generateFilterId(type, value);
    const filter = {
      id: filterId,
      type,
      value,
      label: label || value,
      timestamp: Date.now()
    };

    // Handle single-value filters (replace existing)
    if (this.isSingleValueFilter(type)) {
      this.removeFiltersByType(type);
    }

    this.activeFilters.set(filterId, filter);
    this.addToHistory('add', filter);
    this.emitFilterChange();

    return true;
  }

  /**
   * Remove a filter
   */
  removeFilter(filterId) {
    const filter = this.activeFilters.get(filterId);
    if (!filter) {
      return false;
    }

    this.activeFilters.delete(filterId);
    this.addToHistory('remove', filter);
    this.emitFilterChange();

    return true;
  }

  /**
   * Remove filters by type
   */
  removeFiltersByType(type) {
    const removedFilters = [];
    
    for (const [filterId, filter] of this.activeFilters) {
      if (filter.type === type) {
        this.activeFilters.delete(filterId);
        removedFilters.push(filter);
      }
    }

    if (removedFilters.length > 0) {
      removedFilters.forEach(filter => {
        this.addToHistory('remove', filter);
      });
      this.emitFilterChange();
    }

    return removedFilters;
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    const removedFilters = Array.from(this.activeFilters.values());
    this.activeFilters.clear();
    
    if (removedFilters.length > 0) {
      this.addToHistory('clear', { filters: removedFilters });
      this.emitFilterChange();
    }

    return removedFilters;
  }

  /**
   * Get all active filters
   */
  getActiveFilters() {
    return Array.from(this.activeFilters.values());
  }

  /**
   * Get filters by type
   */
  getFiltersByType(type) {
    return this.getActiveFilters().filter(filter => filter.type === type);
  }

  /**
   * Check if a filter exists
   */
  hasFilter(type, value = null) {
    if (value === null) {
      return this.getFiltersByType(type).length > 0;
    }
    
    const filterId = this.generateFilterId(type, value);
    return this.activeFilters.has(filterId);
  }

  /**
   * Get filter count
   */
  getFilterCount() {
    return this.activeFilters.size;
  }

  /**
   * Get filter count by type
   */
  getFilterCountByType(type) {
    return this.getFiltersByType(type).length;
  }

  /**
   * Build query parameters from active filters
   */
  buildQueryParams() {
    const params = new URLSearchParams();
    
    for (const filter of this.activeFilters.values()) {
      params.append(filter.type, filter.value);
    }

    return params;
  }

  /**
   * Load filters from query parameters
   */
  loadFromQueryParams(searchParams) {
    this.clearAllFilters();
    
    for (const [type, value] of searchParams.entries()) {
      if (Object.values(FILTER_TYPES).includes(type)) {
        this.addFilter(type, value);
      }
    }
  }

  /**
   * Build filter summary for display
   */
  getFilterSummary() {
    const summary = {};
    
    for (const filter of this.activeFilters.values()) {
      if (!summary[filter.type]) {
        summary[filter.type] = [];
      }
      summary[filter.type].push({
        id: filter.id,
        label: filter.label,
        value: filter.value
      });
    }

    return summary;
  }

  /**
   * Get human-readable filter description
   */
  getFilterDescription() {
    const filters = this.getActiveFilters();
    if (filters.length === 0) {
      return 'No filters applied';
    }

    const descriptions = [];
    const groupedFilters = this.groupFiltersByType(filters);

    for (const [type, typeFilters] of Object.entries(groupedFilters)) {
      const typeName = this.getFilterTypeName(type);
      const values = typeFilters.map(f => f.label).join(', ');
      descriptions.push(`${typeName}: ${values}`);
    }

    return descriptions.join('; ');
  }

  /**
   * Apply filters to data
   */
  applyFilters(data, customFilters = null) {
    const filters = customFilters || this.getActiveFilters();
    if (filters.length === 0) {
      return data;
    }

    return data.filter(item => {
      return filters.every(filter => {
        return this.matchesFilter(item, filter);
      });
    });
  }

  /**
   * Check if an item matches a filter
   */
  matchesFilter(item, filter) {
    const { type, value } = filter;

    switch (type) {
      case FILTER_TYPES.SEARCH:
        return this.matchesSearch(item, value);
      case FILTER_TYPES.TYPE:
        return this.matchesExact(item.type, value);
      case FILTER_TYPES.COUNTRY:
        return this.matchesExact(item.country, value);
      case FILTER_TYPES.THEME:
        return this.matchesArray(item.themes, value);
      case FILTER_TYPES.ACTOR:
        return this.matchesArray(item.actors, value);
      case FILTER_TYPES.BENEFICIARY:
        return this.matchesArray(item.beneficiaries, value);
      case FILTER_TYPES.SDG:
        return this.matchesArray(item.sdgs, value);
      case FILTER_TYPES.LEGAL_BINDINGNESS:
        return this.matchesExact(item.legal_bindingness, value);
      case FILTER_TYPES.AGREEMENT_TYPE:
        return this.matchesExact(item.agreement_type, value);
      case FILTER_TYPES.DATE_FROM:
        return this.matchesDateFrom(item.date, value);
      case FILTER_TYPES.DATE_TO:
        return this.matchesDateTo(item.date, value);
      default:
        console.warn(`Unknown filter type for matching: ${type}`);
        return true;
    }
  }

  /**
   * Search matching
   */
  matchesSearch(item, searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const searchableFields = [
      item.title,
      item.summary,
      item.content,
      item.country,
      item.type
    ];

    return searchableFields.some(field => {
      if (typeof field === 'string') {
        return field.toLowerCase().includes(searchLower);
      }
      return false;
    });
  }

  /**
   * Exact matching
   */
  matchesExact(itemValue, filterValue) {
    if (!itemValue) return false;
    return itemValue.toString().toLowerCase() === filterValue.toString().toLowerCase();
  }

  /**
   * Array matching
   */
  matchesArray(itemArray, filterValue) {
    if (!Array.isArray(itemArray)) return false;
    return itemArray.some(item => 
      item.toString().toLowerCase() === filterValue.toString().toLowerCase()
    );
  }

  /**
   * Date from matching
   */
  matchesDateFrom(itemDate, filterDate) {
    if (!itemDate) return false;
    const itemDateObj = new Date(itemDate);
    const filterDateObj = new Date(filterDate);
    return itemDateObj >= filterDateObj;
  }

  /**
   * Date to matching
   */
  matchesDateTo(itemDate, filterDate) {
    if (!itemDate) return false;
    const itemDateObj = new Date(itemDate);
    const filterDateObj = new Date(filterDate);
    return itemDateObj <= filterDateObj;
  }

  /**
   * Get filter suggestions based on data
   */
  getFilterSuggestions(data, filterType, query = '') {
    const suggestions = new Set();
    const queryLower = query.toLowerCase();

    data.forEach(item => {
      let values = [];

      switch (filterType) {
        case FILTER_TYPES.COUNTRY:
          values = [item.country];
          break;
        case FILTER_TYPES.TYPE:
          values = [item.type];
          break;
        case FILTER_TYPES.THEME:
          values = item.themes || [];
          break;
        case FILTER_TYPES.ACTOR:
          values = item.actors || [];
          break;
        case FILTER_TYPES.BENEFICIARY:
          values = item.beneficiaries || [];
          break;
        case FILTER_TYPES.SDG:
          values = item.sdgs || [];
          break;
        case FILTER_TYPES.LEGAL_BINDINGNESS:
          values = [item.legal_bindingness];
          break;
        case FILTER_TYPES.AGREEMENT_TYPE:
          values = [item.agreement_type];
          break;
      }

      values.forEach(value => {
        if (value && value.toString().toLowerCase().includes(queryLower)) {
          suggestions.add(value.toString());
        }
      });
    });

    return Array.from(suggestions).sort();
  }

  /**
   * Save current filter state
   */
  saveFilterState(name) {
    const state = {
      name,
      filters: this.getActiveFilters(),
      timestamp: Date.now()
    };

    const savedStates = this.getSavedFilterStates();
    savedStates[name] = state;
    
    localStorage.setItem('filterStates', JSON.stringify(savedStates));
    return state;
  }

  /**
   * Load saved filter state
   */
  loadFilterState(name) {
    const savedStates = this.getSavedFilterStates();
    const state = savedStates[name];
    
    if (!state) {
      return false;
    }

    this.clearAllFilters();
    state.filters.forEach(filter => {
      this.addFilter(filter.type, filter.value, filter.label);
    });

    return true;
  }

  /**
   * Get saved filter states
   */
  getSavedFilterStates() {
    try {
      return JSON.parse(localStorage.getItem('filterStates') || '{}');
    } catch (error) {
      console.error('Failed to load saved filter states:', error);
      return {};
    }
  }

  /**
   * Delete saved filter state
   */
  deleteFilterState(name) {
    const savedStates = this.getSavedFilterStates();
    delete savedStates[name];
    localStorage.setItem('filterStates', JSON.stringify(savedStates));
  }

  /**
   * Private helper methods
   */
  generateFilterId(type, value) {
    return `${type}:${value}`;
  }

  isSingleValueFilter(type) {
    return [
      FILTER_TYPES.SEARCH,
      FILTER_TYPES.DATE_FROM,
      FILTER_TYPES.DATE_TO
    ].includes(type);
  }

  addToHistory(action, data) {
    this.filterHistory.push({
      action,
      data,
      timestamp: Date.now()
    });

    // Limit history size
    if (this.filterHistory.length > this.maxHistorySize) {
      this.filterHistory.shift();
    }
  }

  emitFilterChange() {
    this.eventBus.emit(EVENT_TYPES.FILTER_CHANGED, {
      activeFilters: this.getActiveFilters(),
      filterCount: this.getFilterCount(),
      filterSummary: this.getFilterSummary()
    });
  }

  groupFiltersByType(filters) {
    const grouped = {};
    filters.forEach(filter => {
      if (!grouped[filter.type]) {
        grouped[filter.type] = [];
      }
      grouped[filter.type].push(filter);
    });
    return grouped;
  }

  getFilterTypeName(type) {
    const typeNames = {
      [FILTER_TYPES.SEARCH]: 'Search',
      [FILTER_TYPES.TYPE]: 'Type',
      [FILTER_TYPES.COUNTRY]: 'Country',
      [FILTER_TYPES.THEME]: 'Theme',
      [FILTER_TYPES.ACTOR]: 'Actor',
      [FILTER_TYPES.BENEFICIARY]: 'Beneficiary',
      [FILTER_TYPES.SDG]: 'SDG',
      [FILTER_TYPES.LEGAL_BINDINGNESS]: 'Legal Bindingness',
      [FILTER_TYPES.AGREEMENT_TYPE]: 'Agreement Type',
      [FILTER_TYPES.DATE_FROM]: 'From Date',
      [FILTER_TYPES.DATE_TO]: 'To Date'
    };

    return typeNames[type] || type;
  }

  /**
   * Get filter history
   */
  getFilterHistory() {
    return [...this.filterHistory];
  }

  /**
   * Clear filter history
   */
  clearFilterHistory() {
    this.filterHistory = [];
  }
}

// Default export
export default FilterService;
