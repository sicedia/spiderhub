/**
 * Search Box Component
 * Handles search input functionality with debouncing and validation
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { CONFIG, FILTER_TYPES, EVENTS } from '../../core/constants/config.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { logger } from '../../core/logger/Logger.js';
import { gettext as _ } from '../../core/i18n/i18n.js';

export class SearchBox extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    this.searchValue = '';
    this.debouncedSearch = this.debounce(this.performSearch, CONFIG.SEARCH.DEBOUNCE_DELAY);
    
    // Create child logger with component context
    this.logger = logger.child({
      component: 'SearchBox',
      instance: Math.random().toString(36).substr(2, 9)
    });
  }

  getDefaultOptions() {
    return {
      minLength: CONFIG.SEARCH.MIN_QUERY_LENGTH,
      placeholder: _('Search documents...'),
      autoSearch: false,
      clearOnSubmit: true,
      filterManager: null
    };
  }

  init() {
    super.init();
    this.setupSearchInput();
  }

  setupSearchInput() {
    // Ensure the element is an input or contains an input
    this.searchInput = this.element.tagName === 'INPUT' ? 
      this.element : 
      this.find('input[type="search"], input[type="text"]');

    if (!this.searchInput) {
      if (this.logger) {
        this.logger.warn('No input element found', {
          elementTag: this.element.tagName,
          elementId: this.element.id
        });
      }
      return;
    }
    
    if (this.logger) {
      this.logger.debug('SearchBox initialized', {
        options: this.options,
        inputElement: this.searchInput.id || this.searchInput.tagName
      });
    }

    // Set placeholder if provided
    if (this.options.placeholder) {
      this.searchInput.placeholder = this.options.placeholder;
    }

    this.bindSearchEvents();
  }

  bindEvents() {
    // This will be called by parent, but we handle events in bindSearchEvents
  }

  bindSearchEvents() {
    if (!this.searchInput) return;

    // Handle Enter key
    this.addEventListener(this.searchInput, 'keydown', this.handleKeyDown);

    // Handle input changes (for auto-search)
    if (this.options.autoSearch) {
      this.addEventListener(this.searchInput, 'input', this.handleInput);
    }

    // Handle focus events
    this.addEventListener(this.searchInput, 'focus', this.handleFocus);
    this.addEventListener(this.searchInput, 'blur', this.handleBlur);
  }

  /**
   * Handle keydown events
   */
  handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleSubmit();
    } else if (event.key === 'Escape') {
      this.clearSearch();
    }
  }

  /**
   * Handle input changes for auto-search
   */
  handleInput(event) {
    const value = event.target.value.trim();
    
    if (value !== this.searchValue) {
      this.searchValue = value;
      
      if (value.length >= this.options.minLength) {
        this.debouncedSearch();
      } else if (value.length === 0) {
        this.clearSearch();
      }
    }
  }

  /**
   * Handle focus events
   */
  handleFocus() {
    this.element.classList.add('focused');
    this.emit('search:focus');
  }

  /**
   * Handle blur events
   */
  handleBlur() {
    this.element.classList.remove('focused');
    this.emit('search:blur');
  }

  /**
   * Handle search submission
   */
  handleSubmit() {
    const searchTerm = this.getSearchValue();
    
    if (this.isValidSearch(searchTerm)) {
      this.performSearch();
      
      if (this.options.clearOnSubmit) {
        this.clearInput();
      }
    } else {
      this.showValidationError();
    }
  }

  /**
   * Perform the actual search
   */
  performSearch() {
    const searchTerm = this.getSearchValue();
    
    if (!this.isValidSearch(searchTerm)) {
      return;
    }

    // Add to filter manager if available
    if (this.options.filterManager) {
      this.options.filterManager.addFilter(FILTER_TYPES.SEARCH, searchTerm, searchTerm, 'Search');
    }

    // Emit search event
    this.emit(EVENTS.SEARCH_COMMITTED, {
      query: searchTerm,
      source: 'searchbox'
    });

    this.emit('search:performed', { query: searchTerm });
  }

  /**
   * Get current search value
   */
  getSearchValue() {
    return this.searchInput ? this.searchInput.value.trim() : '';
  }

  /**
   * Set search value
   */
  setSearchValue(value) {
    if (this.searchInput) {
      this.searchInput.value = value;
      this.searchValue = value;
    }
  }

  /**
   * Clear search input
   */
  clearInput() {
    this.setSearchValue('');
    this.emit('search:cleared');
  }

  /**
   * Clear search and remove from filters
   */
  clearSearch() {
    this.clearInput();
    
    if (this.options.filterManager) {
      this.options.filterManager.removeFilter(FILTER_TYPES.SEARCH);
    }
  }

  /**
   * Validate search input
   */
  isValidSearch(searchTerm) {
    return searchTerm && searchTerm.length >= this.options.minLength;
  }

  /**
   * Show validation error
   */
  showValidationError() {
    const message = `Search term must be at least ${this.options.minLength} characters long`;
    
    this.element.classList.add('error');
    this.emit('search:error', { message });

    // Remove error class after a delay
    setTimeout(() => {
      this.element.classList.remove('error');
    }, 3000);
  }

  /**
   * Focus the search input
   */
  focus() {
    if (this.searchInput) {
      this.searchInput.focus();
    }
  }

  /**
   * Enable search functionality
   */
  enable() {
    super.enable();
    if (this.searchInput) {
      this.searchInput.disabled = false;
    }
  }

  /**
   * Disable search functionality
   */
  disable() {
    super.disable();
    if (this.searchInput) {
      this.searchInput.disabled = true;
    }
  }

  /**
   * Update placeholder text
   */
  setPlaceholder(placeholder) {
    this.options.placeholder = placeholder;
    if (this.searchInput) {
      this.searchInput.placeholder = placeholder;
    }
  }
}

// Default export
export default SearchBox;
