/**
 * Explore Page Manager V3 - Fixed
 * Simplified orchestrator using dedicated coordinators
 * 
 * Refactored to follow Single Responsibility Principle
 * Delegates responsibilities to:
 * - SearchCoordinator: Search operations
 * - FilterCoordinator: Filter management
 * - UICoordinator: UI interactions
 */

import { BaseComponent } from '../core/base/BaseComponent.js';
import { CONFIG, EVENTS, VIEW_TYPES, FILTER_TYPES } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { logger } from '../core/logger/Logger.js';

// Components
import { FilterManager } from '../components/filters/FilterManager.js';
import { SearchBox } from '../components/filters/SearchBox.js';
import { ViewToggle } from '../components/navigation/ViewToggle.js';
import { FilterAccordion } from '../components/filters/FilterAccordion.js';
import { SearchManager } from '../components/search/SearchManager.js';
import { SuggestionsBox } from '../components/search/SuggestionsBox.js';
import { DocumentResults } from '../components/search/DocumentResults.js';

// Coordinators
import { SearchCoordinator } from '../coordinators/SearchCoordinator.js';
import { FilterCoordinator } from '../coordinators/FilterCoordinator.js';
import { UICoordinator } from '../coordinators/UICoordinator.js';

export class ExplorePageManager extends BaseComponent {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    this.instanceId = Math.random().toString(36).substr(2, 9);
    
    // Create child logger
    this.logger = logger.child({
      component: 'ExplorePageManager',
      instance: this.instanceId,
      version: '3.0-fixed'
    });
    
    this.components = {};
    this.coordinators = {};
    this.elements = {};
    this.fullyInitialized = false;
    
    this.logger.info('ExplorePageManager V3 (Fixed) constructor started', {
      instanceId: this.instanceId
    });
    
    // Complete initialization asynchronously
    setTimeout(() => {
      this.completeInitialization();
    }, 0);
  }

  getDefaultOptions() {
    return {
      autoInitialize: true,
      enableInfiniteScroll: true,
      enableMobileNavigation: true
    };
  }

  init() {
    try {
      if (this.logger) {
        this.logger.debug('init() started - Basic initialization only');
      }
      
      // Don't cache elements here - will be done in completeInitialization()
      // when DOM is fully ready
      
      if (this.logger) {
        this.logger.debug('init() completed - Waiting for completeInitialization()');
      }
      
    } catch (error) {
      if (this.logger) {
        this.logger.error('init() error', error);
      }
      throw error;
    }
  }

  /**
   * Complete the full initialization asynchronously
   */
  completeInitialization() {
    try {
      this.logger.group('Complete Initialization');
      this.logger.debug('Starting full initialization');
      
      // Cache elements (now that DOM is ready)
      this.cacheElements();
      
      // Bind events
      this.bindEvents();
      
      // Initialize base components
      this.initializeComponents();
      
      // Initialize coordinators
      this.initializeCoordinators();
      
      // Setup coordinator communication
      this.setupCoordinatorCommunication();
      
      // Mark as fully initialized
      this.fullyInitialized = true;
      
      this.logger.info('ExplorePageManager fully initialized');
      this.logger.groupEnd();
      
      // Perform initial search
      this.performInitialSearch();
      
    } catch (error) {
      this.logger.error('Error during complete initialization', error);
      this.logger.groupEnd();
    }
  }

  /**
   * Bind basic DOM events
   */
  bindEvents() {
    // Search form submission
    if (this.elements.searchForm) {
      this.addEventListener(this.elements.searchForm, 'submit', (event) => {
        event.preventDefault();
        if (this.logger) {
          this.logger.debug('Search form submitted');
        }
        
        // Hide suggestions when form is submitted
        if (this.components.suggestionsBox) {
          this.components.suggestionsBox.hide();
        }
        
        // Get search value from input
        const searchValue = this.elements.searchBoxMain?.value?.trim();
        
        if (searchValue && this.components.mainSearch) {
          // Trigger search through SearchBox component
          this.components.mainSearch.handleSubmit();
        } else if (this.coordinators.search) {
          // If no search value, just perform search with current filters
          this.coordinators.search.handleSearchFormSubmit(event);
        }
      });
    }
    
    // Search button click
    const searchButton = DOMUtils.getElement('#search-button');
    if (searchButton) {
      this.addEventListener(searchButton, 'click', (event) => {
        event.preventDefault();
        if (this.logger) {
          this.logger.debug('Search button clicked');
        }
        
        // Hide suggestions when search button is clicked
        if (this.components.suggestionsBox) {
          this.components.suggestionsBox.hide();
        }
        
        // Trigger form submission
        if (this.elements.searchForm) {
          this.elements.searchForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      });
    }
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Search elements
      searchForm: DOMUtils.getElement('#search-form'),
      searchBoxMain: DOMUtils.getElement('#searchbox'), // Fixed: was #search-box-main
      
      // Filter elements
      activeFiltersContainer: DOMUtils.getElement('#active-filters'),
      filterSidebar: DOMUtils.getElement('.filter-sidebar'),
      filterAccordions: DOMUtils.getElements('[data-accordion-header]'),
      filterSearchInputs: DOMUtils.getElements('.filter-group .search-box input'),
      
      // UI elements
      viewToggleContainer: DOMUtils.getElement('.view-toggle-container'),
      regionTabs: DOMUtils.getElement('.region-tabs'),
      datePresets: DOMUtils.getElement('.date-presets'),
      infiniteScrollSentinel: DOMUtils.getElement('#infinite-scroll-sentinel'),
      mapContainer: DOMUtils.getElement('#map-container'),
      mobileNav: DOMUtils.getElement('[data-mobile-nav]'),
    };
    
    if (this.logger) {
      this.logger.debug('Elements cached', {
        elementCount: Object.keys(this.elements).length,
        hasSearchForm: !!this.elements.searchForm,
        hasFilters: !!this.elements.activeFiltersContainer
      });
    }
  }

  /**
   * Initialize UI components
   */
  initializeComponents() {
    if (this.logger) {
      this.logger.debug('Initializing components...');
    }
    
    // Initialize Filter Manager (CRITICAL!)
    if (this.logger) {
      this.logger.debug('Attempting to initialize FilterManager', {
        hasContainer: !!this.elements.activeFiltersContainer,
        containerElement: this.elements.activeFiltersContainer
      });
    }
    
    if (this.elements.activeFiltersContainer) {
      try {
        this.components.filterManager = new FilterManager(this.elements.activeFiltersContainer, {
          autoCommit: true,
          showActiveFilters: true
        });
        if (this.logger) {
          this.logger.info('✅ FilterManager initialized successfully');
        }
      } catch (error) {
        if (this.logger) {
          this.logger.error('❌ Error creating FilterManager', error);
        }
      }
    } else {
      if (this.logger) {
        this.logger.warn('❌ No activeFiltersContainer found - FilterManager NOT created!');
      }
    }

    // Initialize Filter Accordion
    const filterAccordionElement = DOMUtils.getElement('.filter-accordion');
    if (filterAccordionElement) {
      this.components.filterAccordion = new FilterAccordion(filterAccordionElement, {
        allowMultiple: true,
        defaultOpen: ['document_type'],
        animationDuration: 300,
        saveState: true,
        storageKey: 'explore-filter-accordion-state'
      });
    }

    // Initialize Search Manager
    this.components.searchManager = new SearchManager(document.body, {
      apiEndpoint: '/api/v1/search/documents/',
      suggestEndpoint: '/api/v1/search/suggest/',
      debounceDelay: 300,
      initialPageSize: 10
    });

    // Initialize Document Results
    const resultsContainer = DOMUtils.getElement('#search-results-list');
    const paginationElement = DOMUtils.getElement('#pagination');
    const countElement = DOMUtils.getElement('#results-count-top');
    
    if (resultsContainer) {
      this.components.documentResults = new DocumentResults(resultsContainer, {
        paginationElement: paginationElement,
        countElement: countElement
      });
    }

    // Initialize Suggestions Box
    const suggestionsList = DOMUtils.getElement('#suggestions-list');
    if (this.logger) {
      this.logger.debug('Attempting to initialize SuggestionsBox', {
        hasSuggestionsList: !!suggestionsList,
        hasSearchBoxMain: !!this.elements.searchBoxMain
      });
    }
    
    if (suggestionsList && this.elements.searchBoxMain) {
      try {
        this.components.suggestionsBox = new SuggestionsBox(suggestionsList, {
          searchInputElement: this.elements.searchBoxMain
        });
        if (this.logger) {
          this.logger.info('✅ SuggestionsBox initialized');
        }
      } catch (error) {
        if (this.logger) {
          this.logger.error('❌ Error creating SuggestionsBox', error);
        }
      }
    } else {
      if (this.logger) {
        this.logger.warn('❌ SuggestionsBox NOT initialized - missing elements');
      }
    }

    // Initialize Main Search Box
    if (this.logger) {
      this.logger.debug('Attempting to initialize MainSearch', {
        hasSearchBoxMain: !!this.elements.searchBoxMain,
        hasFilterManager: !!this.components.filterManager
      });
    }
    
    if (this.elements.searchBoxMain) {
      try {
        this.components.mainSearch = new SearchBox(this.elements.searchBoxMain, {
          minLength: 1,
          // placeholder uses default from SearchBox (translated)
          autoSearch: false,
          clearOnSubmit: true,
          filterManager: this.components.filterManager
        });
        if (this.logger) {
          this.logger.info('✅ MainSearch initialized');
        }
      } catch (error) {
        if (this.logger) {
          this.logger.error('❌ Error creating MainSearch', error);
        }
      }
    } else {
      if (this.logger) {
        this.logger.warn('❌ MainSearch NOT initialized - no searchBoxMain');
      }
    }

    // Initialize View Toggle
    if (this.elements.viewToggleContainer) {
      try {
        this.components.viewToggle = new ViewToggle(this.elements.viewToggleContainer, {
          defaultView: VIEW_TYPES.LIST,
          availableViews: [VIEW_TYPES.LIST, VIEW_TYPES.MAP],
          updateURL: true
        });
        if (this.logger) {
          this.logger.info('✅ ViewToggle initialized');
        }
      } catch (error) {
        if (this.logger) {
          this.logger.error('❌ Error creating ViewToggle', error);
        }
      }
    }
    
    if (this.logger) {
      this.logger.info('Components initialized', {
        componentCount: Object.keys(this.components).length
      });
    }
  }

  /**
   * Initialize coordinators
   */
  initializeCoordinators() {
    if (this.logger) {
      this.logger.debug('Initializing coordinators...');
    }
    
    // Search Coordinator
    this.coordinators.search = new SearchCoordinator(this.components, {
      autoSearch: true
    });
    if (this.logger) {
      this.logger.debug('SearchCoordinator created');
    }
    
    // Filter Coordinator
    this.coordinators.filter = new FilterCoordinator(this.components, this.elements, {
      enableSearch: true
    });
    if (this.logger) {
      this.logger.debug('FilterCoordinator created');
    }
    
    // UI Coordinator
    this.coordinators.ui = new UICoordinator(this.components, this.elements, {
      enableInfiniteScroll: this.options.enableInfiniteScroll,
      enableMobileNav: this.options.enableMobileNavigation
    });
    if (this.logger) {
      this.logger.debug('UICoordinator created');
    }
    
    if (this.logger) {
      this.logger.info('All coordinators initialized', {
        coordinatorCount: Object.keys(this.coordinators).length
      });
    }
  }

  /**
   * Setup communication between coordinators
   */
  setupCoordinatorCommunication() {
    if (this.logger) {
      this.logger.debug('Setting up coordinator communication...');
    }
    
    // Setup search coordinator event listeners
    if (this.coordinators.search) {
      this.coordinators.search.setupEventListeners();
    }
    
    // Setup filter coordinator event listeners
    if (this.coordinators.filter) {
      this.coordinators.filter.setupEventListeners();
      this.coordinators.filter.initializeRegionTabs();
      this.coordinators.filter.initializeDatePresets();
    }
    
    // Setup UI coordinator event listeners
    if (this.coordinators.ui) {
      this.coordinators.ui.setupEventListeners();
      
      if (this.options.enableMobileNavigation) {
        this.coordinators.ui.initializeMobileNavigation();
      }
      
      if (this.options.enableInfiniteScroll) {
        this.coordinators.ui.initializeInfiniteScroll();
      }
    }
    
    // Connect UI events to Search Coordinator
    if (this.coordinators.ui && this.coordinators.search) {
      this.coordinators.ui.on(EVENTS.LOAD_MORE_REQUESTED, () => {
        if (this.logger) {
          this.logger.debug('Load more requested');
        }
        this.coordinators.ui.loadMoreResults();
      });
    }
    
    // Connect Suggestions to Search Manager
    if (this.components.suggestionsBox && this.components.searchManager) {
      this.components.searchManager.on('suggestions:ready', (data) => {
        this.components.suggestionsBox.show(data.suggestions);
      });

      this.components.searchManager.on('suggestions:clear', (data) => {
        this.components.suggestionsBox.hide();
      });
    }

    // Connect Suggestions selection to search
    if (this.components.suggestionsBox && this.components.mainSearch) {
      this.components.suggestionsBox.on('suggestion:selected', (data) => {
        // Trigger the same flow as pressing Enter in the search box
        // This will add the filter chip and execute the search
        this.components.mainSearch.handleSubmit();
      });
    }
    
    // Setup search input for suggestions
    if (this.elements.searchBoxMain && this.components.searchManager) {
      this.addEventListener(this.elements.searchBoxMain, 'input', (e) => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          this.components.searchManager.getSuggestions(query);
        } else {
          this.components.searchManager.emit('suggestions:clear');
        }
      });
    }
    
    if (this.logger) {
      this.logger.info('Coordinator communication configured');
    }
  }

  /**
   * Perform initial search
   */
  performInitialSearch() {
    if (this.logger) {
      this.logger.debug('Performing initial search');
    }
    
    if (this.coordinators.search) {
      this.coordinators.search.executeSearch();
    }
  }

  /**
   * Get current state (simplified)
   */
  getState() {
    return {
      isInitialized: this.fullyInitialized,
      search: this.coordinators.search?.getSearchState() || {},
      filters: this.coordinators.filter?.getFilterState() || {},
      ui: this.coordinators.ui?.getUIState() || {}
    };
  }

  /**
   * Reset page (simplified)
   */
  reset() {
    if (this.logger) {
      this.logger.debug('Resetting ExplorePageManager');
    }
    
    // Reset coordinators
    Object.values(this.coordinators).forEach(coordinator => {
      if (coordinator && typeof coordinator.reset === 'function') {
        coordinator.reset();
      }
    });
    
    if (this.logger) {
      this.logger.info('Page reset complete');
    }
  }

  /**
   * Cleanup (simplified)
   */
  destroy() {
    if (this.logger) {
      this.logger.debug('Destroying ExplorePageManager');
    }
    
    // Destroy coordinators
    Object.values(this.coordinators).forEach(coordinator => {
      if (coordinator && typeof coordinator.destroy === 'function') {
        coordinator.destroy();
      }
    });
    
    // Destroy components
    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    
    super.destroy();
    if (this.logger) {
      this.logger.info('ExplorePageManager destroyed');
    }
  }
}

// Default export
export default ExplorePageManager;
