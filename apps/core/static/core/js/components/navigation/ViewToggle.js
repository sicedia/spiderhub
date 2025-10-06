/**
 * View Toggle Component
 * Handles switching between different view modes (list, map, grid)
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { VIEW_TYPES, EVENTS } from '../../core/constants/config.js';
import { DOMUtils } from '../../core/utils/dom.js';

export class ViewToggle extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    this.currentView = VIEW_TYPES.LIST;
  }

  getDefaultOptions() {
    return {
      defaultView: VIEW_TYPES.LIST,
      availableViews: [VIEW_TYPES.LIST, VIEW_TYPES.MAP],
      updateURL: true,
      viewContainers: {
        [VIEW_TYPES.LIST]: '.list-view',
        [VIEW_TYPES.MAP]: '.map-view',
        [VIEW_TYPES.GRID]: '.grid-view'
      }
    };
  }

  init() {
    this.cacheElements();
    super.init();
    this.initializeFromURL();
  }

  cacheElements() {
    this.elements = {
      viewTabs: this.findAll('.view-tab'),
      viewContainers: {}
    };

    // Cache view containers
    Object.entries(this.options.viewContainers).forEach(([viewType, selector]) => {
      const container = DOMUtils.getElement(selector);
      if (container) {
        this.elements.viewContainers[viewType] = container;
      }
    });
  }

  bindEvents() {
    // View tab clicks
    this.elements.viewTabs.forEach(tab => {
      this.addEventListener(tab, 'click', () => {
        const viewType = tab.getAttribute('data-view');
        if (viewType && this.isValidView(viewType)) {
          this.setActiveView(viewType);
        }
      });
    });

    // Keyboard navigation
    this.addEventListener(this.element, 'keydown', this.handleKeyNavigation);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyNavigation(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const currentIndex = this.options.availableViews.indexOf(this.currentView);
      let nextIndex;

      if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : this.options.availableViews.length - 1;
      } else {
        nextIndex = currentIndex < this.options.availableViews.length - 1 ? currentIndex + 1 : 0;
      }

      this.setActiveView(this.options.availableViews[nextIndex]);
    }
  }

  /**
   * Initialize view from URL parameters
   */
  initializeFromURL() {
    if (!this.options.updateURL) {
      this.setActiveView(this.options.defaultView);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    
    if (viewParam && this.isValidView(viewParam)) {
      this.setActiveView(viewParam);
    } else {
      this.setActiveView(this.options.defaultView);
    }
  }

  /**
   * Set the active view
   */
  setActiveView(viewType) {
    if (!this.isValidView(viewType) || viewType === this.currentView) {
      return;
    }

    const previousView = this.currentView;
    this.currentView = viewType;

    this.updateTabsUI();
    this.updateViewContainers();
    this.updateURL();

    this.emit(EVENTS.VIEW_CHANGED, {
      currentView: this.currentView,
      previousView: previousView,
      viewToggle: this
    });

    // Emit specific view events
    this.emit(`view:${viewType}:activated`);
    if (previousView) {
      this.emit(`view:${previousView}:deactivated`);
    }
  }

  /**
   * Update tabs UI to reflect active view
   */
  updateTabsUI() {
    this.elements.viewTabs.forEach(tab => {
      const tabView = tab.getAttribute('data-view');
      const isActive = tabView === this.currentView;
      
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive.toString());
      
      if (isActive) {
        tab.setAttribute('tabindex', '0');
      } else {
        tab.setAttribute('tabindex', '-1');
      }
    });
  }

  /**
   * Update view containers visibility
   */
  updateViewContainers() {
    Object.entries(this.elements.viewContainers).forEach(([viewType, container]) => {
      const isActive = viewType === this.currentView;
      
      if (container) {
        container.classList.toggle('active', isActive);
        container.setAttribute('aria-hidden', (!isActive).toString());
        
        if (isActive) {
          DOMUtils.fadeIn(container);
        } else {
          DOMUtils.fadeOut(container);
        }
      }
    });
  }

  /**
   * Update URL to reflect current view
   */
  updateURL() {
    if (!this.options.updateURL) return;

    const url = new URL(window.location);
    url.searchParams.set('view', this.currentView);
    
    // Use replaceState to avoid adding to browser history for every view change
    window.history.replaceState({}, '', url);
  }

  /**
   * Check if view type is valid
   */
  isValidView(viewType) {
    return this.options.availableViews.includes(viewType);
  }

  /**
   * Get current active view
   */
  getCurrentView() {
    return this.currentView;
  }

  /**
   * Get available views
   */
  getAvailableViews() {
    return [...this.options.availableViews];
  }

  /**
   * Add a new view type
   */
  addView(viewType, containerSelector) {
    if (!this.isValidView(viewType)) {
      this.options.availableViews.push(viewType);
      
      if (containerSelector) {
        this.options.viewContainers[viewType] = containerSelector;
        const container = DOMUtils.getElement(containerSelector);
        if (container) {
          this.elements.viewContainers[viewType] = container;
        }
      }
      
      this.emit('view:added', { viewType, containerSelector });
    }
  }

  /**
   * Remove a view type
   */
  removeView(viewType) {
    const index = this.options.availableViews.indexOf(viewType);
    if (index > -1) {
      this.options.availableViews.splice(index, 1);
      
      // If removing current view, switch to default
      if (this.currentView === viewType) {
        this.setActiveView(this.options.defaultView);
      }
      
      // Clean up containers
      delete this.options.viewContainers[viewType];
      delete this.elements.viewContainers[viewType];
      
      this.emit('view:removed', { viewType });
    }
  }

  /**
   * Enable a specific view
   */
  enableView(viewType) {
    const tab = this.findViewTab(viewType);
    if (tab) {
      tab.classList.remove('disabled');
      tab.removeAttribute('disabled');
    }
  }

  /**
   * Disable a specific view
   */
  disableView(viewType) {
    const tab = this.findViewTab(viewType);
    if (tab) {
      tab.classList.add('disabled');
      tab.setAttribute('disabled', 'true');
      
      // Switch away from disabled view
      if (this.currentView === viewType) {
        const enabledViews = this.options.availableViews.filter(view => {
          const viewTab = this.findViewTab(view);
          return viewTab && !viewTab.classList.contains('disabled');
        });
        
        if (enabledViews.length > 0) {
          this.setActiveView(enabledViews[0]);
        }
      }
    }
  }

  /**
   * Find view tab by view type
   */
  findViewTab(viewType) {
    return Array.from(this.elements.viewTabs).find(tab => 
      tab.getAttribute('data-view') === viewType
    );
  }

  /**
   * Check if a view is enabled
   */
  isViewEnabled(viewType) {
    const tab = this.findViewTab(viewType);
    return tab && !tab.classList.contains('disabled');
  }

  /**
   * Get view container element
   */
  getViewContainer(viewType) {
    return this.elements.viewContainers[viewType] || null;
  }

  /**
   * Focus the current active tab
   */
  focus() {
    const activeTab = this.findViewTab(this.currentView);
    if (activeTab) {
      activeTab.focus();
    }
  }
}

// Default export
export default ViewToggle;
