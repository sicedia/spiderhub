/**
 * Explore Page Manager
 * Orchestrates all components on the explore page
 * Uses @js/ alias for clean imports
 */

import { BaseComponent } from '../core/base/BaseComponent.js';
import { CONFIG, EVENTS, VIEW_TYPES, FILTER_TYPES } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { FilterManager } from '../components/filters/FilterManager.js';
import { SearchBox } from '../components/filters/SearchBox.js';
import { ViewToggle } from '../components/navigation/ViewToggle.js';

export class ExplorePageManager extends BaseComponent {
  constructor(element = document.body, options = {}) {
    try {
      super(element, options);
      
      this.instanceId = Math.random().toString(36).substr(2, 9);
      this.components = {};
      this.state = {
        isLoading: false,
        currentResults: [],
        totalResults: 0
      };
      this.fullyInitialized = false;
      
      // Complete initialization asynchronously to avoid timing issues
      setTimeout(() => {
        this.completeInitialization();
      }, 0);
      
    } catch (error) {
      console.error('ExplorePageManager: Constructor error:', error);
      throw error;
    }
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
      // Only do basic initialization here - full initialization will be done asynchronously
      this.cacheElements();
      
      // Call bindEvents directly (don't call super.init() as BaseComponent already called init())
      this.bindEvents();
      
    } catch (error) {
      console.error('ExplorePageManager: init() error:', error);
      throw error;
    }
  }

  /**
   * Complete the full initialization asynchronously
   */
  completeInitialization() {
    try {
      // Initialize components and setup communication
      this.initializeComponents();
      this.setupComponentCommunication();
      
      if (this.options.enableMobileNavigation) {
        this.initializeMobileNavigation();
      }
      
      // Mark as fully initialized
      this.fullyInitialized = true;
      
    } catch (error) {
      console.error('ExplorePageManager: completeInitialization() error:', error);
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
        console.warn(`ExplorePageManager: Missing critical element '${elementKey}' - functionality will be limited`);
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
      this.components.filterManager = new FilterManager(this.elements.activeFiltersContainer, {
        autoCommit: true,
        showActiveFilters: true
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
    this.initializeAccordion();
    this.initializeRegionTabs();
    this.initializeDatePresets();
    this.initializeFilterSidebar();
    
    if (this.options.enableInfiniteScroll) {
      this.initializeInfiniteScroll();
    }
  }

  initializeSearchComponents() {
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
      this.components.filterManager.addFilter(FILTER_TYPES.SEARCH, searchTerm);
      this.elements.searchInput.value = '';
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
    // Don't call performSearch - let the existing search system handle it
    // The FilterManager already dispatches the commitSearch event to the existing system
  }

  /**
   * Handle filter changed event
   */
  handleFilterChanged(event) {
    // Could be used for analytics or other side effects
    console.log('Filter changed:', event.detail);
  }

  /**
   * Handle view changed event
   */
  handleViewChanged(event) {
    const { currentView } = event.detail;
    console.log('View changed to:', currentView);
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
    console.log('Search performed:', event.detail.query);
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
   * Initialize accordion functionality
   */
  initializeAccordion() {
    this.elements.accordionItems.forEach(item => {
      const header = item.querySelector('.accordion-header');
      if (header) {
        this.addEventListener(header, 'click', () => {
          item.classList.toggle('active');
        });
      }
    });
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
   * Perform search with current filters
   * Delegates to the existing search system to avoid conflicts
   */
  performSearch(filters = []) {
    // Don't interfere with the existing search system
    // The search/js/explore.js handles the actual search and results display
    
    // Emit event for any listeners but don't update UI directly
    this.emit(EVENTS.DATA_LOADED, { 
      filters, 
      resultCount: null, // Let the real search system handle this
      totalResults: null 
    });
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
