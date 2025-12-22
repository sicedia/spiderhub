/**
 * Events Page Manager
 * Manages the events listing page with filtering and pagination
 * ES6 Module Export
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { DOMUtils } from '../core/utils/dom.js';
import { APIUtils } from '../core/utils/api.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { Pagination } from '../components/navigation/Pagination.js';
import { FilterManager } from '../components/filters/FilterManager.js';
import { FilterAccordion } from '../components/filters/FilterAccordion.js';
import { SearchManager } from '../components/search/SearchManager.js';
import { SuggestionsBox } from '../components/search/SuggestionsBox.js';

export class EventsPageManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalPages = 1;
    this.totalCount = 0;
    this.filters = {};
    this.events = [];
    this.searchQuery = ''; // Store current search query
    
    this.logger.info('EventsPageManager initialized');
  }

  /**
   * Default options
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      apiEndpoint: '/api/v1/events/',
      suggestEndpoint: '/api/v1/events/suggest/',
      pageSize: 10,
      enableFilters: true,
      enablePagination: true,
      enableSearch: true
    };
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Search elements
      searchForm: DOMUtils.getElement('#search-form'),
      searchBox: DOMUtils.getElement('#searchbox'),
      searchButton: DOMUtils.getElement('#search-button'),
      suggestionsList: DOMUtils.getElement('#suggestions-list'),
      
      // Results count
      resultsCountTop: DOMUtils.getElement('#results-count-top'),
      
      // Active filters
      activeFilters: DOMUtils.getElement('#active-filters'),
      
      // Filter accordion
      filterAccordion: DOMUtils.getElement('#filter-accordion'),
      filtersLoading: DOMUtils.getElement('#filters-loading'),
      clearFilters: DOMUtils.getElement('#clear-filters'),
      resetFilters: DOMUtils.getElement('#reset-filters'),
      applyFilters: DOMUtils.getElement('#apply-filters'),
      
      // Results elements
      loading: DOMUtils.getElement('#events-loading'),
      error: DOMUtils.getElement('#events-error'),
      errorMessage: DOMUtils.getElement('#events-error-message'),
      empty: DOMUtils.getElement('#events-empty'),
      emptyTitle: DOMUtils.getElement('#events-empty-title'),
      emptyMessage: DOMUtils.getElement('#events-empty-message'),
      emptyClearFilters: DOMUtils.getElement('#events-empty-clear-filters'),
      eventsList: DOMUtils.getElement('#events-list'),
      pagination: DOMUtils.getElement('#events-pagination')
    };
  }

  /**
   * Initialize components
   */
  async initializeComponents() {
    // Initialize FilterManager for active filters
    if (this.elements.activeFilters) {
      try {
        const filterManager = new FilterManager(this.elements.activeFilters, {
          autoCommit: true,
          showActiveFilters: true
        });
        this.registerComponent('filterManager', filterManager);
        this.logger.info('FilterManager initialized');
      } catch (error) {
        this.logger.error('Error initializing FilterManager', error);
      }
    }

    // Initialize FilterAccordion
    if (this.elements.filterAccordion) {
      try {
        const filterAccordion = new FilterAccordion(this.elements.filterAccordion, {
          allowMultiple: true,
          defaultOpen: ['event_format'],
          animationDuration: 300,
          saveState: true,
          storageKey: 'events-filter-accordion-state'
        });
        this.registerComponent('filterAccordion', filterAccordion);
        this.logger.info('FilterAccordion initialized');
      } catch (error) {
        this.logger.error('Error initializing FilterAccordion', error);
      }
    }

    // Initialize SearchManager
    if (this.options.enableSearch) {
      try {
        const searchManager = new SearchManager(document.body, {
          apiEndpoint: this.options.apiEndpoint,
          suggestEndpoint: this.options.suggestEndpoint,
          debounceDelay: 300,
          initialPageSize: this.pageSize
        });
        this.registerComponent('searchManager', searchManager);
        this.logger.info('SearchManager initialized');
        
        // Connect search events
        searchManager.on('search:performed', (data) => {
          this.logger.debug('Search performed', data);
          this.searchQuery = data.query || '';
          this.currentPage = 1;
          this.loadEvents();
        });
        
        searchManager.on('suggestions:ready', (data) => {
          this.logger.debug('Suggestions ready', data);
        });
      } catch (error) {
        this.logger.error('Error initializing SearchManager', error);
      }
    }

    // Initialize SuggestionsBox
    if (this.elements.suggestionsList && this.elements.searchBox) {
      try {
        const suggestionsBox = new SuggestionsBox(this.elements.suggestionsList, {
          searchInputElement: this.elements.searchBox
        });
        this.registerComponent('suggestionsBox', suggestionsBox);
        this.logger.info('SuggestionsBox initialized');
        
        // Connect suggestions to SearchManager
        const searchManager = this.getComponent('searchManager');
        if (searchManager) {
          searchManager.on('suggestions:ready', (data) => {
            if (suggestionsBox) {
              suggestionsBox.showSuggestions(data.suggestions);
            }
          });
          
          searchManager.on('suggestions:clear', () => {
            if (suggestionsBox) {
              suggestionsBox.hideSuggestions();
            }
          });
        }
      } catch (error) {
        this.logger.error('Error initializing SuggestionsBox', error);
      }
    }
  }

  /**
   * Initialize services
   */
  async initializeServices() {
    // Cache elements before loading data
    this.cacheElements();
    
    // Hide filters loading state (filters are not implemented yet, or will be loaded differently)
    if (this.elements.filtersLoading) {
      this.elements.filtersLoading.hidden = true;
    }
  }

  /**
   * Load page data
   */
  async loadPageData() {
    await this.loadEvents();
  }

  /**
   * Bind page events
   */
  bindPageEvents() {
    // Search form submission
    if (this.elements.searchForm) {
      this.addEventListener(this.elements.searchForm, 'submit', (e) => {
        e.preventDefault();
        const searchQuery = this.elements.searchBox?.value?.trim() || '';
        this.searchQuery = searchQuery;
        this.currentPage = 1;
        this.loadEvents();
      });
    }

    // Search input for suggestions
    if (this.elements.searchBox) {
      this.addEventListener(this.elements.searchBox, 'input', (e) => {
        const query = e.target.value.trim();
        const searchManager = this.getComponent('searchManager');
        if (searchManager && query.length >= 2) {
          searchManager.getSuggestions(query);
        } else {
          const suggestionsBox = this.getComponent('suggestionsBox');
          if (suggestionsBox) {
            suggestionsBox.hideSuggestions();
          }
        }
      });
    }

    // Clear filters button
    if (this.elements.clearFilters) {
      this.addEventListener(this.elements.clearFilters, 'click', () => {
        this.clearAllFilters();
      });
    }

    // Reset filters button
    if (this.elements.resetFilters) {
      this.addEventListener(this.elements.resetFilters, 'click', () => {
        this.clearAllFilters();
      });
    }

    // Apply filters button
    if (this.elements.applyFilters) {
      this.addEventListener(this.elements.applyFilters, 'click', () => {
        this.applyFiltersFromAccordion();
      });
    }

    // Empty state clear filters
    if (this.elements.emptyClearFilters) {
      this.addEventListener(this.elements.emptyClearFilters, 'click', () => {
        this.clearAllFilters();
      });
    }

    // Listen for filter changes from FilterManager
    const filterManager = this.getComponent('filterManager');
    if (filterManager) {
      filterManager.on(EVENTS.FILTER_CHANGED, (filters) => {
        this.logger.debug('Filters changed', { filters });
        this.filters = filters;
        this.currentPage = 1;
        
        eventBus.emit(EVENTS.EVENTS_FILTERS_CHANGED, { filters });
        this.loadEvents();
      });
    }
  }

  /**
   * Apply filters from accordion
   */
  applyFiltersFromAccordion() {
    this.logger.debug('Applying filters from accordion');
    
    // Collect filters from accordion groups
    const newFilters = {};
    
    // Event format
    const formatInputs = document.querySelectorAll('#filter-options-event-format input[type="checkbox"]:checked');
    if (formatInputs.length > 0) {
      const formats = Array.from(formatInputs).map(input => input.value);
      if (formats.length === 1) {
        newFilters.event_format = formats[0];
      }
    }
    
    // Date range
    const startAtAfter = document.querySelector('#start_at_after')?.value;
    const startAtBefore = document.querySelector('#start_at_before')?.value;
    if (startAtAfter) {
      newFilters.start_at_after = startAtAfter;
    }
    if (startAtBefore) {
      newFilters.start_at_before = startAtBefore;
    }
    
    // Country
    const countryInputs = document.querySelectorAll('#filter-options-countries input[type="checkbox"]:checked');
    if (countryInputs.length > 0) {
      const countryIds = Array.from(countryInputs).map(input => parseInt(input.value));
      if (countryIds.length === 1) {
        newFilters.country = countryIds[0];
      }
    }
    
    // Organization
    const orgInputs = document.querySelectorAll('#filter-options-organizations input[type="checkbox"]:checked');
    if (orgInputs.length > 0) {
      const orgIds = Array.from(orgInputs).map(input => parseInt(input.value));
      if (orgIds.length === 1) {
        newFilters.organization = orgIds[0];
      }
    }
    
    // Themes
    const themeInputs = document.querySelectorAll('#filter-options-themes input[type="checkbox"]:checked');
    if (themeInputs.length > 0) {
      newFilters.theme = Array.from(themeInputs).map(input => parseInt(input.value));
    }
    
    // Actors
    const actorInputs = document.querySelectorAll('#filter-options-actors input[type="checkbox"]:checked');
    if (actorInputs.length > 0) {
      newFilters.actor = Array.from(actorInputs).map(input => parseInt(input.value));
    }
    
    this.filters = newFilters;
    this.currentPage = 1;
    
    // Update FilterManager
    const filterManager = this.getComponent('filterManager');
    if (filterManager) {
      filterManager.setFilters(newFilters);
    }
    
    eventBus.emit(EVENTS.EVENTS_FILTERS_CHANGED, { filters: newFilters });
    this.loadEvents();
  }

  /**
   * Load events from API
   */
  async loadEvents() {
    try {
      this.showLoading();
      this.hideError();
      this.hideEmpty();

      this.logger.debug('Loading events from API', {
        page: this.currentPage,
        filters: this.filters
      });

      eventBus.emit(EVENTS.EVENT_LOADING_START, {
        page: this.currentPage,
        filters: this.filters
      });

      const params = new URLSearchParams();
      params.append('published', 'true');
      params.append('page', this.currentPage.toString());
      params.append('page_size', this.pageSize.toString());

      // Add search query
      if (this.searchQuery && this.searchQuery.trim()) {
        params.append('q', this.searchQuery.trim());
      }

      // Add filters
      Object.keys(this.filters).forEach(key => {
        const value = this.filters[key];
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const url = `${this.options.apiEndpoint}?${params.toString()}`;
      const response = await APIUtils.get(url);
      
      this.events = response.results || [];
      this.totalCount = response.count || 0;
      this.totalPages = response.total_pages || 1;
      this.currentPage = response.current_page || 1;

      this.logger.info('Events loaded successfully', {
        count: this.events.length,
        total: this.totalCount
      });

      this.renderEvents();
      this.updateResultsCount();
      this.updatePagination();
      
      // Show empty state if no events
      if (this.events.length === 0) {
        this.showEmpty();
        // Hide filters section if no events
        this.hideFiltersSection();
      } else {
        this.hideEmpty();
      }

      this.hideLoading();

      eventBus.emit(EVENTS.EVENTS_LOADED, {
        events: this.events,
        count: this.totalCount,
        page: this.currentPage,
        totalPages: this.totalPages
      });

    } catch (error) {
      this.logger.error('Error loading events', error, {
        page: this.currentPage,
        filters: this.filters
      });
      
      eventBus.emit(EVENTS.EVENTS_LOAD_ERROR, {
        error: error.message,
        page: this.currentPage
      });
      
      this.showError(error.message || 'Failed to load events');
      this.hideLoading();
    }
  }

  /**
   * Render events in list
   */
  renderEvents() {
    if (!this.elements.eventsList) return;

    if (this.events.length === 0) {
      this.elements.eventsList.innerHTML = '';
      return;
    }

    const html = this.events.map(event => this.renderEventListItem(event)).join('');
    this.elements.eventsList.innerHTML = html;

    // Add click handlers to event items
    this.elements.eventsList.querySelectorAll('.event-item').forEach(item => {
      const eventId = item.dataset.eventId;
      if (eventId) {
        const link = item.querySelector('.event-item__link');
        if (link) {
          this.addEventListener(link, 'click', (e) => {
            e.preventDefault();
            window.location.href = `/events/${eventId}/`;
          });
        }
      }
    });
  }

  /**
   * Render a single event list item
   */
  renderEventListItem(event) {
    const formatBadge = event.event_format_display 
      ? `<span class="tag tag--info">${this.escapeHtml(event.event_format_display)}</span>`
      : '';
    
    const dateStr = this.formatEventDate(event.start_at, event.end_at);
    const locationStr = this.formatLocation(event.city_name, event.country_name);
    const orgStr = event.organization_name 
      ? `<span class="event-item__org">${this.escapeHtml(event.organization_name)}</span>`
      : '';

    // Build metadata line
    const metadataParts = [];
    if (dateStr) metadataParts.push(`<span class="event-item__date">${dateStr}</span>`);
    if (locationStr) metadataParts.push(`<span class="event-item__location">${locationStr}</span>`);
    if (orgStr) metadataParts.push(orgStr);
    const metadata = metadataParts.length > 0 
      ? `<div class="event-item__meta">${metadataParts.join(' • ')}</div>`
      : '';

    return `
      <li class="event-item document-item" data-event-id="${event.id}">
        <div class="event-item__content">
          <div class="event-item__header">
            <h3 class="event-item__title">
              <a href="/events/${event.id}/" class="event-item__link">${this.escapeHtml(event.title)}</a>
            </h3>
            ${formatBadge}
          </div>
          ${metadata}
          ${event.description ? `<p class="event-item__description">${this.truncateText(event.description, 200)}</p>` : ''}
        </div>
      </li>
    `;
  }

  /**
   * Format event date
   */
  formatEventDate(startAt, endAt) {
    if (!startAt) return '';
    
    try {
      const start = new Date(startAt);
      const startStr = start.toLocaleDateString();
      
      if (endAt) {
        const end = new Date(endAt);
        const endStr = end.toLocaleDateString();
        if (startStr === endStr) {
          return startStr;
        }
        return `${startStr} - ${endStr}`;
      }
      
      return startStr;
    } catch (e) {
      return '';
    }
  }

  /**
   * Format location string
   */
  formatLocation(city, country) {
    const parts = [];
    if (city) parts.push(city);
    if (country) parts.push(country);
    return parts.join(', ') || '';
  }

  /**
   * Update results count
   */
  updateResultsCount() {
    // Update top results count (like explore page)
    if (this.elements.resultsCountTop) {
      const count = this.totalCount;
      const text = count === 1 
        ? '1 event found'
        : `${count.toLocaleString()} events found`;
      
      this.elements.resultsCountTop.textContent = text;
    }
  }

  /**
   * Update pagination
   */
  updatePagination() {
    if (!this.elements.pagination || !this.options.enablePagination) return;

    if (this.totalPages <= 1) {
      this.elements.pagination.innerHTML = '';
      return;
    }

    // Create pagination component
    let pagination = this.getComponent('pagination');
    if (!pagination) {
      pagination = new Pagination(this.elements.pagination, {
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        totalItems: this.totalCount,
        itemsPerPage: this.pageSize
      });
      
      this.registerComponent('pagination', pagination);

      pagination.on(EVENTS.PAGE_CHANGED, (page) => {
        this.logger.debug('Page changed', { page });
        this.currentPage = page;
        
        eventBus.emit(EVENTS.EVENTS_PAGE_CHANGED, { page });
        this.loadEvents();
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      // updateData calculates totalPages automatically from totalItems and itemsPerPage
      pagination.updateData({
        currentPage: this.currentPage,
        totalItems: this.totalCount,
        itemsPerPage: this.pageSize
      });
    }
  }

  /**
   * Clear all filters
   */
  clearAllFilters() {
    this.logger.debug('Clearing all filters');
    this.filters = {};
    this.currentPage = 1;
    
    const filterManager = this.getComponent('filterManager');
    if (filterManager) {
      filterManager.clearAll();
    }
    
    eventBus.emit(EVENTS.FILTERS_CLEARED);
    this.loadEvents();
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.elements.loading) {
      this.elements.loading.hidden = false;
    }
    if (this.elements.eventsList) {
      this.elements.eventsList.hidden = true;
      this.elements.eventsList.setAttribute('aria-busy', 'true');
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.elements.loading) {
      this.elements.loading.hidden = true;
    }
    if (this.elements.eventsList) {
      this.elements.eventsList.hidden = false;
      this.elements.eventsList.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Show error state
   */
  showError(message) {
    if (this.elements.error) {
      this.elements.error.hidden = false;
    }
    if (this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message;
    }
  }

  /**
   * Hide error state
   */
  hideError() {
    if (this.elements.error) {
      this.elements.error.hidden = true;
    }
  }

  /**
   * Show empty state
   */
  showEmpty() {
    if (this.elements.empty) {
      this.elements.empty.hidden = false;
      
      // Update empty state message based on filters
      const hasFilters = Object.keys(this.filters).length > 0;
      
      if (hasFilters) {
        if (this.elements.emptyTitle) {
          this.elements.emptyTitle.textContent = 'No events match your filters';
        }
        if (this.elements.emptyMessage) {
          this.elements.emptyMessage.textContent = 'Try adjusting your filters to see more results.';
        }
        if (this.elements.emptyClearFilters) {
          this.elements.emptyClearFilters.hidden = false;
        }
      } else {
        if (this.elements.emptyTitle) {
          this.elements.emptyTitle.textContent = 'No events have been published yet';
        }
        if (this.elements.emptyMessage) {
          this.elements.emptyMessage.textContent = 'Check back later for upcoming events.';
        }
        if (this.elements.emptyClearFilters) {
          this.elements.emptyClearFilters.hidden = true;
        }
      }
    }
  }

  /**
   * Hide empty state
   */
  hideEmpty() {
    if (this.elements.empty) {
      this.elements.empty.hidden = true;
    }
  }

  /**
   * Hide filters section when there are no events
   */
  hideFiltersSection() {
    const filtersSection = document.querySelector('.explore-sidebar');
    if (filtersSection) {
      filtersSection.hidden = true;
      this.logger.debug('Filters section hidden (no events available)');
    }
  }

  /**
   * Utility: Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Utility: Truncate text
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return this.escapeHtml(text);
    return this.escapeHtml(text.substring(0, maxLength)) + '...';
  }
}

