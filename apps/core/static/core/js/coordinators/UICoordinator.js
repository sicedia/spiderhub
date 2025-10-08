/**
 * UI Coordinator
 * Manages UI-related operations (mobile nav, infinite scroll, view toggling)
 * Extracted from ExplorePageManager to follow SRP
 */

import { BaseComponent } from '../core/base/BaseComponent.js';
import { EVENTS, VIEW_TYPES } from '../core/constants/config.js';
import { logger } from '../core/logger/Logger.js';
import { MobileNav } from '../components/navigation/MobileNav.js';

export class UICoordinator extends BaseComponent {
  constructor(components, elements, options = {}) {
    super(document.createElement('div'), options);
    
    this.logger = logger.child({
      component: 'UICoordinator'
    });
    
    this.components = components;
    this.elements = elements;
    this.options = options;
    
    this.currentView = VIEW_TYPES.GRID;
    this.infiniteScrollEnabled = false;
    this.infiniteScrollObserver = null;
    
    this.logger.debug('UICoordinator initialized');
  }

  /**
   * Setup event listeners for UI coordination
   */
  setupEventListeners() {
    this.setupViewToggleListeners();
    
    this.logger.info('UI event listeners configured');
  }

  /**
   * Setup view toggle listeners
   */
  setupViewToggleListeners() {
    if (!this.components.viewToggle) {
      this.logger.debug('No view toggle component');
      return;
    }

    this.components.viewToggle.on(EVENTS.VIEW_CHANGED, (data) => {
      this.handleViewChanged(data);
    });

    this.logger.debug('View toggle listeners setup');
  }

  /**
   * Handle view change
   */
  handleViewChanged(data) {
    const { view } = data;
    this.currentView = view;
    
    this.logger.debug('View changed', { view });
    
    if (view === VIEW_TYPES.MAP) {
      this.handleMapViewActivated();
    }
    
    // Emit global event
    this.emit(EVENTS.VIEW_CHANGED, { view });
  }

  /**
   * Handle map view activation
   */
  handleMapViewActivated() {
    this.logger.info('Map view activated');
    
    // Initialize map if not already done
    if (!this.mapInitialized) {
      this.initializeMap();
    }
  }

  /**
   * Initialize mobile navigation
   */
  initializeMobileNavigation() {
    const mobileNavElement = this.elements.mobileNav;
    
    if (!mobileNavElement) {
      this.logger.debug('No mobile navigation element found');
      return;
    }
    
    try {
      this.components.mobileNav = new MobileNav(mobileNavElement, {
        breakpoint: 768
      });
      
      this.logger.debug('Mobile navigation initialized');
    } catch (error) {
      this.logger.error('Error initializing mobile navigation', error);
    }
  }

  /**
   * Initialize infinite scroll
   */
  initializeInfiniteScroll() {
    const sentinel = this.elements.infiniteScrollSentinel;
    
    if (!sentinel) {
      this.logger.debug('No infinite scroll sentinel found');
      return;
    }
    
    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    };
    
    this.infiniteScrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.infiniteScrollEnabled) {
          this.handleInfiniteScroll();
        }
      });
    }, options);
    
    this.infiniteScrollObserver.observe(sentinel);
    this.infiniteScrollEnabled = true;
    
    this.logger.debug('Infinite scroll initialized');
  }

  /**
   * Handle infinite scroll trigger
   */
  handleInfiniteScroll() {
    this.logger.debug('Infinite scroll triggered');
    this.emit(EVENTS.LOAD_MORE_REQUESTED);
  }

  /**
   * Load more results (for infinite scroll)
   */
  loadMoreResults() {
    const { searchManager, documentResults } = this.components;
    
    if (!searchManager || !documentResults) {
      this.logger.warn('Cannot load more results - components missing');
      return;
    }
    
    const currentState = documentResults.getState();
    const hasMore = currentState.currentPage * currentState.pageSize < currentState.totalCount;
    
    if (!hasMore) {
      this.logger.debug('No more results to load');
      this.infiniteScrollEnabled = false;
      return;
    }
    
    this.logger.debug('Loading more results', {
      currentPage: currentState.currentPage,
      nextPage: currentState.currentPage + 1
    });
    
    // Temporarily disable to prevent multiple triggers
    this.infiniteScrollEnabled = false;
    
    searchManager.goToPage(currentState.currentPage + 1)
      .then(() => {
        this.infiniteScrollEnabled = true;
        this.logger.debug('More results loaded successfully');
      })
      .catch((error) => {
        this.logger.error('Error loading more results', error);
        this.infiniteScrollEnabled = true;
      });
  }

  /**
   * Initialize map (placeholder for future implementation)
   */
  initializeMap() {
    const mapContainer = this.elements.mapContainer;
    
    if (!mapContainer) {
      this.logger.warn('Map container not found');
      return;
    }
    
    this.logger.info('Initializing map...');
    
    try {
      // Create simple placeholder map
      this.createSimpleMap(mapContainer);
      this.mapInitialized = true;
      
      this.logger.info('Map initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing map', error);
    }
  }

  /**
   * Create simple map placeholder
   */
  createSimpleMap(container) {
    container.innerHTML = `
      <div class="map-placeholder" style="
        width: 100%;
        height: 500px;
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      ">
        <div style="text-align: center;">
          <p style="font-size: 1.2rem; color: #666; margin-bottom: 1rem;">
            🗺️ Map View
          </p>
          <p style="color: #999;">
            Map integration coming soon
          </p>
        </div>
      </div>
    `;
    
    this.logger.debug('Simple map placeholder created');
  }

  /**
   * Toggle filter sidebar visibility
   */
  toggleFilterSidebar() {
    const sidebar = this.elements.filterSidebar;
    
    if (!sidebar) {
      this.logger.warn('Filter sidebar not found');
      return;
    }
    
    const isVisible = !sidebar.classList.contains('hidden');
    sidebar.classList.toggle('hidden');
    
    this.emit(isVisible ? EVENTS.FILTERS_HIDDEN : EVENTS.FILTERS_SHOWN);
    
    this.logger.debug('Filter sidebar toggled', { isVisible: !isVisible });
  }

  /**
   * Get current UI state
   */
  getUIState() {
    return {
      currentView: this.currentView,
      infiniteScrollEnabled: this.infiniteScrollEnabled,
      mapInitialized: this.mapInitialized || false
    };
  }

  /**
   * Enable infinite scroll
   */
  enableInfiniteScroll() {
    this.infiniteScrollEnabled = true;
    this.logger.debug('Infinite scroll enabled');
  }

  /**
   * Disable infinite scroll
   */
  disableInfiniteScroll() {
    this.infiniteScrollEnabled = false;
    this.logger.debug('Infinite scroll disabled');
  }

  /**
   * Reset UI state
   */
  reset() {
    this.logger.debug('Resetting UI coordinator');
    this.currentView = VIEW_TYPES.GRID;
    this.infiniteScrollEnabled = false;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.logger.debug('Destroying UICoordinator');
    
    if (this.infiniteScrollObserver) {
      this.infiniteScrollObserver.disconnect();
      this.infiniteScrollObserver = null;
    }
    
    if (this.components.mobileNav) {
      this.components.mobileNav.destroy();
    }
    
    super.destroy();
  }
}

export default UICoordinator;

