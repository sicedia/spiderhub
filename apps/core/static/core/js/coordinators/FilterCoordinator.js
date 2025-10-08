/**
 * Filter Coordinator
 * Manages filter-related operations and UI coordination
 * Extracted from ExplorePageManager to follow SRP
 */

import { BaseComponent } from '../core/base/BaseComponent.js';
import { EVENTS } from '../core/constants/config.js';
import { logger } from '../core/logger/Logger.js';

export class FilterCoordinator extends BaseComponent {
  constructor(components, elements, options = {}) {
    super(document.createElement('div'), options);
    
    this.logger = logger.child({
      component: 'FilterCoordinator'
    });
    
    this.components = components;
    this.elements = elements;
    
    this.logger.debug('FilterCoordinator initialized');
  }

  /**
   * Setup event listeners for filter coordination
   */
  setupEventListeners() {
    this.setupAccordionListeners();
    this.setupFilterSearchListeners();
    
    this.logger.info('Filter event listeners configured');
  }

  /**
   * Setup accordion listeners for filter groups
   */
  setupAccordionListeners() {
    const accordions = this.elements.filterAccordions || [];
    
    accordions.forEach(accordion => {
      this.addEventListener(accordion, 'click', (event) => {
        const header = event.target.closest('[data-accordion-header]');
        if (header) {
          this.handleAccordionToggle(header);
        }
      });
    });
    
    this.logger.debug('Accordion listeners setup', {
      count: accordions.length
    });
  }

  /**
   * Handle accordion toggle
   */
  handleAccordionToggle(header) {
    const content = header.nextElementSibling;
    const isExpanded = header.getAttribute('aria-expanded') === 'true';
    
    header.setAttribute('aria-expanded', !isExpanded);
    
    if (content) {
      content.style.display = isExpanded ? 'none' : 'block';
    }
    
    this.logger.debug('Accordion toggled', {
      isExpanded: !isExpanded
    });
  }

  /**
   * Setup filter search listeners
   */
  setupFilterSearchListeners() {
    const filterSearchInputs = this.elements.filterSearchInputs || [];
    
    filterSearchInputs.forEach(input => {
      this.addEventListener(input, 'input', (event) => {
        this.handleFilterSearch(event.target);
      });
    });
    
    this.logger.debug('Filter search listeners setup', {
      count: filterSearchInputs.length
    });
  }

  /**
   * Handle filter search input
   */
  handleFilterSearch(searchInput) {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const filterGroup = searchInput.closest('.filter-group');
    
    if (!filterGroup) {
      this.logger.warn('Filter group not found for search input');
      return;
    }
    
    const options = filterGroup.querySelectorAll('.filter-option');
    let visibleCount = 0;
    
    options.forEach(option => {
      const label = option.querySelector('.filter-label');
      const text = label ? label.textContent.toLowerCase() : '';
      const matches = text.includes(searchTerm);
      
      option.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });
    
    this.logger.debug('Filter search performed', {
      searchTerm,
      visibleCount,
      totalCount: options.length
    });
    
    // Show "no results" message if needed
    this.showNoResultsMessage(filterGroup, visibleCount === 0);
  }

  /**
   * Show/hide no results message
   */
  showNoResultsMessage(filterGroup, show) {
    let message = filterGroup.querySelector('.no-results-message');
    
    if (show && !message) {
      message = document.createElement('div');
      message.className = 'no-results-message';
      message.textContent = 'No matching filters found';
      filterGroup.appendChild(message);
    } else if (!show && message) {
      message.remove();
    }
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
    
    if (isVisible) {
      sidebar.classList.add('hidden');
      this.emit(EVENTS.FILTERS_HIDDEN);
    } else {
      sidebar.classList.remove('hidden');
      this.emit(EVENTS.FILTERS_SHOWN);
    }
    
    this.logger.debug('Filter sidebar toggled', { isVisible: !isVisible });
  }

  /**
   * Initialize region tabs
   */
  initializeRegionTabs() {
    const tabsContainer = this.elements.regionTabs;
    
    if (!tabsContainer) {
      this.logger.debug('No region tabs found');
      return;
    }
    
    const tabs = tabsContainer.querySelectorAll('[role="tab"]');
    
    tabs.forEach(tab => {
      this.addEventListener(tab, 'click', (event) => {
        this.handleRegionTabClick(event.target, tabs);
      });
    });
    
    this.logger.debug('Region tabs initialized', {
      count: tabs.length
    });
  }

  /**
   * Handle region tab click
   */
  handleRegionTabClick(clickedTab, allTabs) {
    const region = clickedTab.dataset.region;
    
    // Update active state
    allTabs.forEach(tab => {
      tab.setAttribute('aria-selected', tab === clickedTab);
      tab.classList.toggle('active', tab === clickedTab);
    });
    
    // Emit event for region change
    this.emit(EVENTS.REGION_CHANGED, { region });
    
    this.logger.debug('Region tab clicked', { region });
  }

  /**
   * Initialize date presets
   */
  initializeDatePresets() {
    const presetsContainer = this.elements.datePresets;
    
    if (!presetsContainer) {
      this.logger.debug('No date presets found');
      return;
    }
    
    const presets = presetsContainer.querySelectorAll('[data-years]');
    
    presets.forEach(preset => {
      this.addEventListener(preset, 'click', (event) => {
        this.handleDatePresetClick(event.target);
      });
    });
    
    this.logger.debug('Date presets initialized', {
      count: presets.length
    });
  }

  /**
   * Handle date preset click
   */
  handleDatePresetClick(preset) {
    const years = parseInt(preset.dataset.years, 10);
    const dateRange = this.calculateDateRange(years);
    
    // Emit event for date range change
    this.emit(EVENTS.DATE_RANGE_CHANGED, { dateRange, years });
    
    this.logger.debug('Date preset clicked', { years, dateRange });
  }

  /**
   * Calculate date range from years
   */
  calculateDateRange(years) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - years);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }

  /**
   * Get current filter state
   */
  getFilterState() {
    if (!this.components.filterManager) {
      return {};
    }
    
    return this.components.filterManager.getActiveFilters();
  }

  /**
   * Reset filters
   */
  reset() {
    this.logger.debug('Resetting filter coordinator');
    
    if (this.components.filterManager) {
      this.components.filterManager.reset();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.logger.debug('Destroying FilterCoordinator');
    super.destroy();
  }
}

export default FilterCoordinator;

