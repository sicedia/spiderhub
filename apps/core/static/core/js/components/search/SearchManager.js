/**
 * SearchManager Component
 * Manages search state, API calls, and coordinates search functionality
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { EVENTS } from '../../core/constants/config.js';
import { logger } from '../../core/logger/Logger.js';

export class SearchManager extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    // Create child logger with component context
    this.logger = logger.child({
      component: 'SearchManager',
      instance: Math.random().toString(36).substr(2, 9)
    });
  }

  getDefaultOptions() {
    return {
      apiEndpoint: '/api/search/documents/',
      suggestEndpoint: '/api/search/suggest/',
      debounceDelay: 300,
      initialPageSize: 10
    };
  }

  init() {
    this.state = this.getInitialState();
    this.debounceTimer = null;
    
    if (this.logger) {
      this.logger.debug('SearchManager initialized', {
        options: this.options,
        initialState: this.state
      });
    }
  }

  getInitialState() {
    return {
      q: '',
      search: [],
      document_type: [],
      legal_bindingness: [],
      coverage_scope: [],
      agreement_type: [],
      country: [],
      actor: [],
      beneficiary: [],
      theme: [],
      sdg: [],
      date_from: '',
      date_to: '',
      page: 1
    };
  }

  /**
   * Update search state from filter chips
   */
  updateStateFromFilters(filterChips) {
    this.logger.debug('Updating state from filters', { 
      chipCount: filterChips.length 
    });

    // Reset state
    this.state = this.getInitialState();

    // Group filters by type
    const grouped = filterChips.reduce((acc, chip) => {
      const type = chip.dataset.type;
      const value = chip.dataset.value;
      
      if (!acc[type]) acc[type] = [];
      acc[type].push(value);
      return acc;
    }, {});

    // Assign to state
    Object.entries(grouped).forEach(([key, values]) => {
      if (key.startsWith('date_')) {
        this.state[key] = values[0]; // Single value for dates
      } else {
        this.state[key] = values;
      }
    });

    // Reset to page 1 when filters change
    this.state.page = 1;

    this.logger.debug('State updated', { 
      newState: this.state,
      filterCount: Object.keys(grouped).length
    });
  }

  /**
   * Build URL params from current state
   */
  buildParams(state = this.state) {
    const params = new URLSearchParams();

    const multiKeys = [
      'document_type', 'legal_bindingness', 'coverage_scope', 'agreement_type',
      'country', 'actor', 'beneficiary', 'theme', 'sdg', 'search'
    ];

    multiKeys.forEach(key => {
      if (state[key] && state[key].length > 0) {
        state[key].forEach(value => params.append(key, value));
      }
    });

    if (state.date_from) params.append('event_date_after', state.date_from);
    if (state.date_to) params.append('event_date_before', state.date_to);
    
    params.append('page', state.page);

    this.logger.debug('Built search params', { 
      paramCount: Array.from(params.keys()).length,
      page: state.page
    });

    return params.toString();
  }

  /**
   * Perform search with current state
   */
  async performSearch() {
    const startTime = Date.now();
    const params = this.buildParams();
    const url = `${this.options.apiEndpoint}?${params}`;

    this.logger.group('Search Operation');
    this.logger.debug('Starting search', { 
      url, 
      state: this.state,
      params: params.substring(0, 100) + (params.length > 100 ? '...' : '')
    });

    try {
      // Emit loading event
      this.logger.debug('Emitting LOADING_START event');
      this.emit(EVENTS.LOADING_START);
      
      // Perform fetch
      this.logger.debug('Fetching from API', { endpoint: this.options.apiEndpoint });
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      this.logger.info('Search completed successfully', { 
        resultCount: data.count || 0,
        pageSize: data.page_size || 0,
        duration: `${duration}ms`,
        page: this.state.page
      });
      
      // Emit success event
      this.logger.debug('Emitting SEARCH_SUCCESS event', {
        resultCount: data.count
      });
      this.emit(EVENTS.SEARCH_SUCCESS, { data, state: this.state });
      
      this.logger.groupEnd();
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Search request failed', error, {
        url,
        duration: `${duration}ms`,
        state: this.state
      });
      
      this.emit(EVENTS.SEARCH_ERROR, { error });
      this.logger.groupEnd();
      throw error;
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query) {
    if (!query || query.length < 2) {
      this.logger.debug('Clearing suggestions (query too short)');
      this.emit('suggestions:clear');
      return [];
    }

    clearTimeout(this.debounceTimer);

    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(async () => {
        this.logger.debug('Fetching suggestions', { query, delay: this.options.debounceDelay });
        
        try {
          const url = `${this.options.suggestEndpoint}?q=${encodeURIComponent(query)}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`Suggestions fetch failed: ${response.status}`);
          }

          const suggestions = await response.json();
          
          this.logger.debug('Suggestions received', { 
            count: suggestions.length,
            query
          });
          
          this.emit('suggestions:ready', { suggestions, query });
          resolve(suggestions);
        } catch (error) {
          this.logger.warn('Suggestions request failed', error, { query });
          this.emit('suggestions:error', { error });
          resolve([]);
        }
      }, this.options.debounceDelay);
    });
  }

  /**
   * Go to specific page
   */
  async goToPage(pageNumber) {
    this.logger.debug('Navigating to page', { 
      from: this.state.page, 
      to: pageNumber 
    });
    
    this.state.page = pageNumber;
    return this.performSearch();
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update state
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Reset state
   */
  resetState() {
    this.state = this.getInitialState();
  }
}

export default SearchManager;

