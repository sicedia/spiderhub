/**
 * Search Coordinator
 * Manages search-related operations and event coordination
 * Extracted from ExplorePageManager to follow SRP
 */

import { BaseComponent } from '../core/base/BaseComponent.js';
import { EVENTS } from '../core/constants/config.js';
import { logger } from '../core/logger/Logger.js';

export class SearchCoordinator extends BaseComponent {
  constructor(components, options = {}) {
    // SearchCoordinator doesn't need a DOM element
    super(document.createElement('div'), options);
    
    this.logger = logger.child({
      component: 'SearchCoordinator'
    });
    
    this.components = components;
    this.isPerformingSearch = false;
    this.lastSearchTimestamp = 0;
    this.searchDebounceMs = 100; // Prevent duplicate searches within 100ms
    
    this.logger.debug('SearchCoordinator initialized', {
      hasSearchManager: !!components.searchManager,
      hasDocumentResults: !!components.documentResults
    });
  }

  /**
   * Setup event listeners for search coordination
   */
  setupEventListeners() {
    const { searchManager, documentResults, filterManager } = this.components;
    
    if (!searchManager || !documentResults) {
      this.logger.warn('Missing required components for search coordination');
      return;
    }

    // Search Manager Events
    searchManager.on(EVENTS.LOADING_START, (data) => {
      this.logger.debug('Search loading started');
      documentResults.showLoading();
    });

    searchManager.on(EVENTS.SEARCH_SUCCESS, (data) => {
      this.logger.debug('Search completed successfully', {
        resultCount: data.data?.count || 0
      });
      
      if (data && data.data) {
        documentResults.renderResults(data.data);
      }
    });

    searchManager.on(EVENTS.SEARCH_ERROR, (data) => {
      this.logger.error('Search error occurred', data.error);
      documentResults.showError(data.error);
    });

    // Filter Events - CRITICAL: This connects filter changes to search
    if (filterManager) {
      filterManager.on(EVENTS.SEARCH_COMMITTED, this.handleSearchCommitted.bind(this));
      filterManager.on(EVENTS.FILTER_CHANGED, this.handleFilterChanged.bind(this));
      
      this.logger.debug('Filter event listeners configured', {
        hasFilterManager: true,
        events: [EVENTS.SEARCH_COMMITTED, EVENTS.FILTER_CHANGED]
      });
    } else {
      this.logger.warn('No FilterManager found - filters will not trigger searches!');
    }

    // Pagination Events
    documentResults.on('page:changed', (data) => {
      this.logger.debug('Page changed', { page: data.page });
      // When user explicitly changes page, allow scroll
      searchManager.goToPage(data.page, true);
    });

    this.logger.info('Search event listeners configured');
  }

  /**
   * Handle search form submission
   */
  handleSearchFormSubmit(event) {
    event.preventDefault();
    
    this.logger.debug('Search form submitted');
    
    if (!this.isInitialized()) {
      this.logger.warn('Cannot perform search - coordinator not initialized');
      return;
    }
    
    this.performSearch();
  }

  /**
   * Perform a search
   */
  performSearch() {
    if (this.isPerformingSearch) {
      this.logger.debug('Search already in progress, skipping duplicate request');
      return;
    }

    this.logger.debug('Performing search');
    this.executeSearch();
  }

  /**
   * Execute the actual search
   */
  executeSearch() {
    const { searchManager, filterManager, documentResults } = this.components;
    
    if (!searchManager || !documentResults) {
      this.logger.error('Search components not available', {
        hasSearchManager: !!searchManager,
        hasDocumentResults: !!documentResults
      });
      return;
    }

    try {
      this.isPerformingSearch = true;
      
      this.logger.debug('Executing search');
      
      // Get all active filter chips
      const activeFiltersContainer = document.getElementById('active-filters');
      if (!activeFiltersContainer) {
        this.logger.error('Active filters container not found');
        return;
      }
      
      // Convert NodeList to Array for reduce() to work
      const filterChips = Array.from(activeFiltersContainer.querySelectorAll('.filter-chip'));
      
      this.logger.debug('Found filter chips', {
        count: filterChips.length
      });
      
      // Update SearchManager state with current filters
      searchManager.updateStateFromFilters(filterChips);
      
      // Get country_role select value and update state
      const countryRoleSelect = document.getElementById('country-role-select');
      if (countryRoleSelect) {
        const countryRole = countryRoleSelect.value;
        searchManager.setState({ country_role: countryRole });
        this.logger.debug('Country role applied', { country_role: countryRole });
      }
      
      // Reset to page 1 when filters change (no scroll)
      documentResults.resetPagination();
      
      // Disable scroll for filter-triggered searches
      searchManager.shouldScrollOnResults = false;
      
      // Perform the search with updated state
      searchManager.performSearch();
      
    } catch (error) {
      this.logger.error('Error executing search', error);
    } finally {
      this.isPerformingSearch = false;
    }
  }

  /**
   * Handle search committed event (from search input)
   */
  handleSearchCommitted(data) {
    // Debounce duplicate events
    const now = Date.now();
    if (now - this.lastSearchTimestamp < this.searchDebounceMs) {
      this.logger.debug('Skipping search:committed - too soon after last search');
      return;
    }
    
    if (this.isPerformingSearch) {
      this.logger.debug('Skipping search:committed - search in progress');
      return;
    }
    
    this.logger.debug('Search committed', data);
    this.lastSearchTimestamp = now;
    this.performSearch();
  }

  /**
   * Handle filter changed event
   */
  handleFilterChanged(data) {
    // Debounce duplicate events
    const now = Date.now();
    if (now - this.lastSearchTimestamp < this.searchDebounceMs) {
      this.logger.debug('Skipping filter:changed - too soon after last search');
      return;
    }
    
    if (this.isPerformingSearch) {
      this.logger.debug('Skipping filter:changed - search in progress');
      return;
    }
    
    this.logger.debug('Filters changed', data);
    this.lastSearchTimestamp = now;
    this.performSearch();
  }

  /**
   * Handle search performed event
   */
  handleSearchPerformed(data) {
    this.logger.debug('Search performed', data);
    // Additional logic if needed
  }

  /**
   * Check if coordinator is initialized
   */
  isInitialized() {
    return !!(this.components.searchManager && this.components.documentResults);
  }

  /**
   * Get current search state
   */
  getSearchState() {
    return {
      isPerformingSearch: this.isPerformingSearch,
      isInitialized: this.isInitialized()
    };
  }

  /**
   * Reset search state
   */
  reset() {
    this.logger.debug('Resetting search coordinator');
    this.isPerformingSearch = false;
    
    if (this.components.searchManager) {
      this.components.searchManager.reset();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.logger.debug('Destroying SearchCoordinator');
    this.isPerformingSearch = false;
    super.destroy();
  }
}

export default SearchCoordinator;

