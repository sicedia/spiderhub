/**
 * Explore Page Manager
 * Orchestrates all components on the explore page
 * Uses @js/ alias for clean imports
 * Version: 2.0 - Fixed event data handling
 */

import { BaseComponent } from '../core/base/BaseComponent.js';
import { CONFIG, EVENTS, VIEW_TYPES, FILTER_TYPES } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { FilterManager } from '../components/filters/FilterManager.js';
import { SearchBox } from '../components/filters/SearchBox.js';
import { ViewToggle } from '../components/navigation/ViewToggle.js';
import { FilterAccordion } from '../components/filters/FilterAccordion.js';
import { SearchManager } from '../components/search/SearchManager.js';
import { SuggestionsBox } from '../components/search/SuggestionsBox.js';
import { DocumentResults } from '../components/search/DocumentResults.js';
import { logger } from '../core/logger/Logger.js';

export class ExplorePageManager extends BaseComponent {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    this.instanceId = Math.random().toString(36).substr(2, 9);
    
    // Create child logger with component context
    this.logger = logger.child({
      component: 'ExplorePageManager',
      instance: this.instanceId
    });
    
    this.components = {};
    this.state = {
      isLoading: false,
      currentResults: [],
      totalResults: 0
    };
    this.fullyInitialized = false;
    
    this.logger.debug('ExplorePageManager constructor started', {
      instanceId: this.instanceId
    });
    
    // Complete initialization asynchronously to avoid timing issues
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
      // Logger might not exist yet if called from BaseComponent constructor
      if (this.logger) {
        this.logger.debug('init() started');
      }
      
      // Only do basic initialization here - full initialization will be done asynchronously
      this.cacheElements();
      
      // Call bindEvents directly (don't call super.init() as BaseComponent already called init())
      this.bindEvents();
      
      if (this.logger) {
        this.logger.debug('init() completed');
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
      
      // Initialize components and setup communication
      this.initializeComponents();
      this.setupComponentCommunication();
      
      if (this.options.enableMobileNavigation) {
        this.initializeMobileNavigation();
      }
      
      // Mark as fully initialized
      this.fullyInitialized = true;
      this.logger.info('ExplorePageManager fully initialized', {
        componentsCount: Object.keys(this.components).length
      });
      
      // Load initial results after a short delay to ensure DOM is ready
      const boundPerformSearch = () => {
        try {
          if (typeof this.performSearch === 'function') {
            this.performSearch();
          }
        } catch (err) {
          this.logger.error('Error in initial search', err);
        }
      };
      
      setTimeout(boundPerformSearch, 100);
      this.logger.groupEnd();
      
    } catch (error) {
      this.logger.error('Initialization error', error);
      this.logger.groupEnd();
      throw error;
    }
  }

  /**
   * Override bindEvents to ensure elements are cached first
   */
  bindEvents() {
    // Filter sidebar toggle
    if (this.elements.filterToggle && this.elements.filterSidebar) {
      this.addEventListener(this.elements.filterToggle, 'click', this.toggleFilterSidebar.bind(this));
    }
  }

  cacheElements() {
    this.elements = {
      // Filter elements
      filterSidebar: DOMUtils.getElement('.explore-sidebar'),
      filterToggle: DOMUtils.getElement('.filter-toggle'),
      activeFiltersContainer: DOMUtils.getElement('#active-filters'),
      
      // Search elements
      searchForm: DOMUtils.getElement('.search-bar'),
      searchInput: DOMUtils.getElement('.search-bar input'),
      searchBoxMain: DOMUtils.getElement('#searchbox'),
      
      // View elements (using correct selectors from HTML)
      viewToggleContainer: DOMUtils.getElement('.view-selector'),
      listView: DOMUtils.getElement('.list-view'),
      mapView: DOMUtils.getElement('.map-view'),
      
      // Results elements (using correct selectors from HTML)
      documentsGrid: DOMUtils.getElement('#search-results-list'),
      resultsContainer: DOMUtils.getElement('.results-container'),
      resultsCount: DOMUtils.getElement('#results-count'),
      
      // Pagination elements
      paginationContainer: DOMUtils.getElement('#pagination'),
      
      // Accordion elements
      accordionItems: DOMUtils.getElements('.accordion-item'),
      
      // Region and date elements
      regionTabs: DOMUtils.getElements('.region-tab'),
      countryFilters: DOMUtils.getElement('.filter-options.scrollable'),
      datePresets: DOMUtils.getElements('.date-preset'),
      
      // Mobile elements
      mobileMenuToggle: DOMUtils.getElement('.mobile-menu-toggle'),
      mobileNavOverlay: DOMUtils.getElement('.mobile-nav-overlay')
    };

    // Log missing critical elements (only for essential functionality)
    const criticalElements = [
      'activeFiltersContainer', 'searchBoxMain'
    ];
    
    criticalElements.forEach(elementKey => {
      if (!this.elements[elementKey]) {
        this.logger.warn('Missing critical element', {
          element: elementKey,
          impact: 'functionality will be limited'
        });
      }
    });
    
  }

  initializeComponents() {
    // Ensure components object exists
    if (!this.components) {
      this.components = {};
    }
    
    // Initialize Filter Manager
    if (this.elements.activeFiltersContainer) {
      try {
        this.components.filterManager = new FilterManager(this.elements.activeFiltersContainer, {
          autoCommit: true,
          showActiveFilters: true
        });
        this.logger.debug('FilterManager initialized');
      } catch (error) {
        this.logger.error('Error creating FilterManager', error);
      }
    }

    // Initialize Filter Accordion with improved UX
    const filterAccordionElement = DOMUtils.getElement('.filter-accordion');
    if (filterAccordionElement) {
      this.components.filterAccordion = new FilterAccordion(filterAccordionElement, {
        allowMultiple: true,
        defaultOpen: ['document_type'], // Open document type by default
        animationDuration: 300,
        saveState: true,
        storageKey: 'explore-filter-accordion-state'
      });
    }

    // Initialize Search Boxes
    this.initializeSearchComponents();

    // Initialize View Toggle
    if (this.elements.viewToggleContainer) {
      this.components.viewToggle = new ViewToggle(this.elements.viewToggleContainer, {
        defaultView: VIEW_TYPES.LIST,
        availableViews: [VIEW_TYPES.LIST, VIEW_TYPES.MAP],
        updateURL: true,
        viewContainers: {
          [VIEW_TYPES.LIST]: '.list-view',
          [VIEW_TYPES.MAP]: '.map-view'
        }
      });
    }

    // Initialize other UI components
    this.initializeRegionTabs();
    this.initializeDatePresets();
    this.initializeFilterSidebar();
    
    if (this.options.enableInfiniteScroll) {
      this.initializeInfiniteScroll();
    }
  }

  initializeSearchComponents() {
    // Initialize Search Manager
    this.components.searchManager = new SearchManager(document.body, {
      apiEndpoint: '/api/search/documents/',
      suggestEndpoint: '/api/search/suggest/',
      debounceDelay: 300,
      initialPageSize: 10
    });

    // Initialize Suggestions Box
    const suggestionsList = DOMUtils.getElement('#suggestions-list');
    if (suggestionsList && this.elements.searchBoxMain) {
      this.components.suggestionsBox = new SuggestionsBox(suggestionsList, {
        searchInputElement: this.elements.searchBoxMain
      });
    }

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

    // Main search box
    if (this.elements.searchBoxMain) {
      this.components.mainSearch = new SearchBox(this.elements.searchBoxMain, {
        minLength: 1,
        placeholder: 'Search documents...',
        autoSearch: false,
        clearOnSubmit: true,
        filterManager: this.components.filterManager
      });
    }

    // Search form
    if (this.elements.searchForm) {
      this.addEventListener(this.elements.searchForm, 'submit', this.handleSearchFormSubmit.bind(this));
    }

    // Filter search boxes (for filtering options within accordions)
    const filterSearchBoxes = DOMUtils.getElements('.search-box input');
    filterSearchBoxes.forEach(input => {
      new SearchBox(input, {
        minLength: 0,
        autoSearch: true,
        clearOnSubmit: false
      });
      
      // Handle filter option searching
      this.addEventListener(input, 'input', (event) => {
        this.handleFilterSearch(event.target);
      });
    });
  }

  setupComponentCommunication() {
    // Listen for filter changes
    if (this.components.filterManager) {
      this.components.filterManager.on(EVENTS.SEARCH_COMMITTED, this.handleSearchCommitted.bind(this));
      this.components.filterManager.on(EVENTS.FILTER_CHANGED, this.handleFilterChanged.bind(this));
    }

    // Connect Search Manager events - usando { once: false } para prevenir duplicados
    if (this.components.searchManager) {
      // LOADING_START: mostrar estado de carga
      this.components.searchManager.on(EVENTS.LOADING_START, (event) => {
        event.stopPropagation(); // Prevenir propagación
        if (this.components.documentResults) {
          this.components.documentResults.showLoading();
        }
      }, { once: false });

      // SEARCH_SUCCESS: renderizar resultados
      this.components.searchManager.on(EVENTS.SEARCH_SUCCESS, (event) => {
        event.stopPropagation(); // Prevenir propagación
        const eventData = event.detail;
        if (this.components.documentResults && eventData && eventData.data) {
          this.components.documentResults.renderResults(eventData.data);
        }
      });

      // SEARCH_ERROR: mostrar error
      this.components.searchManager.on(EVENTS.SEARCH_ERROR, (event) => {
        event.stopPropagation(); // Prevenir propagación
        const data = event.detail;
        if (this.components.documentResults) {
          this.components.documentResults.showError(data.error);
        }
      });

      // Suggestions events
      this.components.searchManager.on('suggestions:ready', (event) => {
        event.stopPropagation();
        const data = event.detail;
        if (this.components.suggestionsBox) {
          this.components.suggestionsBox.show(data.suggestions);
        }
      });

      this.components.searchManager.on('suggestions:clear', (event) => {
        event.stopPropagation();
        if (this.components.suggestionsBox) {
          this.components.suggestionsBox.hide();
        }
      });
    }

    // Connect Suggestions Box events
    if (this.components.suggestionsBox) {
      this.components.suggestionsBox.on('suggestion:selected', (data) => {
        // Trigger search with selected suggestion
        this.performSearch();
      });
    }

    // Connect Document Results pagination
    if (this.components.documentResults) {
      this.components.documentResults.on('page:changed', (event) => {
        if (this.components.searchManager) {
          this.components.searchManager.goToPage(event.detail.page);
        }
      });
    }

    // Connect search input to get suggestions
    if (this.elements.searchBoxMain && this.components.searchManager) {
      this.elements.searchBoxMain.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        this.components.searchManager.getSuggestions(query);
      });
    }

    // Listen for filter changes to trigger search
    document.addEventListener('filterChange', () => {
      this.performSearch();
    });

    // Setup accordion listeners
    this.setupAccordionListeners();

    // Listen for view changes
    if (this.components.viewToggle) {
      this.components.viewToggle.on(EVENTS.VIEW_CHANGED, this.handleViewChanged.bind(this));
      this.components.viewToggle.on('view:map:activated', this.handleMapViewActivated.bind(this));
    }

    // Listen for search events
    if (this.components.mainSearch) {
      this.components.mainSearch.on('search:performed', this.handleSearchPerformed.bind(this));
    }
  }


  /**
   * Handle search form submission
   */
  handleSearchFormSubmit(event) {
    event.preventDefault();
    
    // Check if initialization is complete
    if (!this.fullyInitialized) {
      return;
    }
    
    const searchTerm = this.elements.searchInput?.value?.trim();
    
    if (searchTerm && this.components.filterManager) {
      // Add search chip
      this.components.filterManager.addFilter(FILTER_TYPES.SEARCH, searchTerm, searchTerm, 'Search');
      
      // Perform search with new system
      this.performSearch();
      
      // Clear input after search
      if (this.elements.searchInput) {
        this.elements.searchInput.value = '';
      }
    }
  }

  /**
   * Perform search with current filters
   */
  performSearch() {
    return this.executeSearch();
  }

  /**
   * Execute search with current state
   */
  executeSearch() {
    try {
      if (!this.components.searchManager || !this.components.documentResults) {
        this.logger.error('Search components not initialized', {
          searchManager: !!this.components.searchManager,
          documentResults: !!this.components.documentResults
        });
        return;
      }

      // Get all active filter chips
      const activeFiltersContainer = document.getElementById('active-filters');
      if (!activeFiltersContainer) {
        this.logger.error('Active filters container not found');
        return;
      }

      const filterChips = activeFiltersContainer.querySelectorAll('.filter-chip');
      this.logger.debug('Executing search', {
        filterCount: filterChips.length
      });
      
      // Update search manager state from filter chips
      this.components.searchManager.updateStateFromFilters(Array.from(filterChips));
      
      // Reset to page 1 when filters change
      this.components.documentResults.resetPagination();
      
      // Perform the search
      this.components.searchManager.performSearch();
    } catch (err) {
      this.logger.error('Search execution error', err);
    }
  }

  /**
   * Handle filter search within accordions
   */
  handleFilterSearch(searchInput) {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const accordionContent = searchInput.closest('.accordion-content');
    
    if (accordionContent) {
      const filterOptions = accordionContent.querySelectorAll('.filter-checkbox');
      
      filterOptions.forEach(option => {
        const label = option.querySelector('span')?.textContent?.toLowerCase() || '';
        const shouldShow = label.includes(searchTerm) || searchTerm === '';
        option.style.display = shouldShow ? 'flex' : 'none';
      });
    }
  }

  /**
   * Handle search committed event
   */
  handleSearchCommitted(event) {
    // Perform search with new modular system
    this.performSearch();
  }

  /**
   * Handle filter changed event
   */
  handleFilterChanged(event) {
    // Could be used for analytics or other side effects
  }

  /**
   * Handle view changed event
   */
  handleViewChanged(event) {
    // View change handled by CSS
  }

  /**
   * Handle map view activation
   */
  handleMapViewActivated() {
    this.initializeMap();
  }

  /**
   * Handle search performed event
   */
  handleSearchPerformed(event) {
    // Search performed event handled
  }

  /**
   * Toggle filter sidebar
   */
  toggleFilterSidebar() {
    if (this.elements.filterSidebar) {
      this.elements.filterSidebar.classList.toggle('expanded');
    }
  }

  /**
   * Setup accordion event listeners (delegated to FilterAccordion component)
   */
  setupAccordionListeners() {
    // Accordion events handled by FilterAccordion component
  }

  /**
   * Initialize region tabs
   */
  initializeRegionTabs() {
    this.elements.regionTabs.forEach(tab => {
      this.addEventListener(tab, 'click', () => {
        // Update active tab
        this.elements.regionTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update country filters display
        const region = tab.getAttribute('data-region');
        if (this.elements.countryFilters) {
          this.elements.countryFilters.className = 'filter-options scrollable';
          this.elements.countryFilters.classList.add(`show-${region}`);
        }
      });
    });
    
    // Set default region
    if (this.elements.countryFilters) {
      this.elements.countryFilters.classList.add('show-all');
    }
  }

  /**
   * Initialize date presets
   */
  initializeDatePresets() {
    this.elements.datePresets.forEach(preset => {
      this.addEventListener(preset, 'click', () => {
        // Update active preset
        this.elements.datePresets.forEach(p => p.classList.remove('active'));
        preset.classList.add('active');
        
        // Calculate and set date range
        const years = parseInt(preset.getAttribute('data-years')) || 1;
        const { fromDate, toDate } = this.calculateDateRange(years);
        
        const dateFromInput = DOMUtils.getElement('#date_from');
        const dateToInput = DOMUtils.getElement('#date_to');
        
        if (dateFromInput) dateFromInput.value = fromDate;
        if (dateToInput) dateToInput.value = toDate;
      });
    });
  }

  /**
   * Initialize filter sidebar
   */
  initializeFilterSidebar() {
    // Any additional filter sidebar initialization
  }

  /**
   * Initialize infinite scroll
   */
  initializeInfiniteScroll() {
    const scrollSentinel = DOMUtils.getElement('#scroll-sentinel');
    if (!scrollSentinel || DOMUtils.isMobile()) return;
    
    const observer = DOMUtils.createIntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.state.isLoading) {
          this.loadMoreResults();
        }
      });
    }, { rootMargin: '200px' });
    
    observer.observe(scrollSentinel);
  }

  /**
   * Initialize mobile navigation
   */
  initializeMobileNavigation() {
    // Mobile navigation logic
    if (this.elements.mobileMenuToggle && this.elements.mobileNavOverlay) {
      this.addEventListener(this.elements.mobileMenuToggle, 'click', () => {
        document.body.classList.toggle('mobile-nav-open');
      });
      
      this.addEventListener(this.elements.mobileNavOverlay, 'click', () => {
        document.body.classList.remove('mobile-nav-open');
      });
    }
  }


  /**
   * Load more results for infinite scroll
   */
  loadMoreResults() {
    if (this.state.isLoading) return;
    
    this.state.isLoading = true;
    
    setTimeout(() => {
      const existingCards = this.elements.documentsGrid?.querySelectorAll('.document-card');
      const sentinel = DOMUtils.getElement('#scroll-sentinel');
      
      if (existingCards && existingCards.length > 0) {
        if (sentinel) sentinel.remove();
        
        // Clone and add new cards
        for (let i = 0; i < Math.min(3, existingCards.length); i++) {
          const clone = existingCards[i].cloneNode(true);
          const title = clone.querySelector('.document-title');
          if (title) {
            title.textContent += ' (New)';
          }
          this.elements.documentsGrid.appendChild(clone);
        }
        
        if (sentinel) this.elements.documentsGrid.appendChild(sentinel);
      }
      
      this.state.isLoading = false;
    }, 800);
  }

  /**
   * Initialize map when map view is activated
   */
  initializeMap() {
    const mapContainer = DOMUtils.getElement('#interactive-map');
    if (!mapContainer || mapContainer.getAttribute('data-initialized') === 'true') {
      return;
    }
    
    mapContainer.setAttribute('data-initialized', 'true');
    
    // Remove placeholder
    const placeholder = mapContainer.querySelector('.map-placeholder');
    if (placeholder) placeholder.remove();
    
    // Create map (simplified version - full implementation would be in a separate MapComponent)
    this.createSimpleMap(mapContainer);
  }

  /**
   * Create a simple map (placeholder for full map implementation)
   */
  createSimpleMap(container) {
    const mapDiv = DOMUtils.createElement('div', {
      className: 'simple-map',
      style: 'width: 100%; height: 400px; background: #f0f6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #666;'
    }, 'Interactive Map Component<br><small>Full implementation would be in MapComponent.js</small>');
    
    container.appendChild(mapDiv);
  }

  /**
   * Calculate date range for presets
   */
  calculateDateRange(years) {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setFullYear(today.getFullYear() - years);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      fromDate: formatDate(fromDate),
      toDate: formatDate(today)
    };
  }

  /**
   * Get current page state
   */
  getState() {
    return {
      ...this.state,
      filters: this.components.filterManager?.getActiveFilters() || [],
      currentView: this.components.viewToggle?.getCurrentView() || VIEW_TYPES.LIST
    };
  }

  /**
   * Reset page to initial state
   */
  reset() {
    if (this.components.filterManager) {
      this.components.filterManager.clearAllFilters();
    }
    
    if (this.components.viewToggle) {
      this.components.viewToggle.setActiveView(VIEW_TYPES.LIST);
    }
  }
}

// Default export
export default ExplorePageManager;
