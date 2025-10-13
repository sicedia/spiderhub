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
    // Try different selectors for the presets container
    const presetsContainer = this.elements.datePresets 
      || document.querySelector('.filter-date-presets')
      || document.querySelector('[data-date-presets]');
    
    if (!presetsContainer) {
      this.logger.debug('No date presets container found');
      return;
    }
    
    const presets = presetsContainer.querySelectorAll('[data-years]');
    
    if (presets.length === 0) {
      this.logger.warn('No date preset buttons found in container');
      return;
    }
    
    presets.forEach(preset => {
      this.addEventListener(preset, 'click', (event) => {
        event.preventDefault();
        this.handleDatePresetClick(event.target);
      });
    });
    
    // Also initialize manual date input listeners
    this.initializeDateInputs();
    
    this.logger.debug('Date presets initialized', {
      count: presets.length
    });
  }

  /**
   * Initialize manual date input listeners
   */
  initializeDateInputs() {
    const dateFromInput = document.getElementById('date_from');
    const dateToInput = document.getElementById('date_to');
    
    if (dateFromInput) {
      this.addEventListener(dateFromInput, 'change', () => {
        this.handleManualDateChange();
      });
    }
    
    if (dateToInput) {
      this.addEventListener(dateToInput, 'change', () => {
        this.handleManualDateChange();
      });
    }
    
    this.logger.debug('Date inputs initialized');
  }

  /**
   * Handle manual date input change
   */
  handleManualDateChange() {
    const dateFromInput = document.getElementById('date_from');
    const dateToInput = document.getElementById('date_to');
    
    const dateFrom = dateFromInput?.value;
    const dateTo = dateToInput?.value;
    
    // Clear active state from preset buttons since user entered manually
    this.clearPresetButtonsState();
    
    // Add date filter chips if dates are provided
    if (dateFrom || dateTo) {
      this.addManualDateFilterChips(dateFrom, dateTo);
    } else {
      // Remove date filters if both are empty
      this.removeDateFilters();
    }
  }

  /**
   * Clear active state from all preset buttons
   */
  clearPresetButtonsState() {
    const presetsContainer = document.querySelector('.filter-date-presets');
    if (!presetsContainer) return;
    
    presetsContainer.querySelectorAll('[data-years]').forEach(btn => {
      btn.classList.remove('active', 'filter-date-preset--active');
    });
  }

  /**
   * Add manual date filter chips
   */
  addManualDateFilterChips(dateFrom, dateTo) {
    const filterManager = this.components.filterManager;
    
    if (!filterManager) {
      this.logger.warn('FilterManager not available');
      return;
    }
    
    // Remove any existing date filters first
    this.removeDateFilters();
    
    // Add date_from filter if provided
    if (dateFrom) {
      filterManager.addFilter(
        'date_from',
        dateFrom,
        `From: ${this.formatDate(dateFrom)}`,
        'period'
      );
    }
    
    // Add date_to filter if provided
    if (dateTo) {
      filterManager.addFilter(
        'date_to',
        dateTo,
        `Until: ${this.formatDate(dateTo)}`,
        'period'
      );
    }
    
    this.logger.debug('Manual date filter chips added', { dateFrom, dateTo });
  }

  /**
   * Handle date preset click
   */
  handleDatePresetClick(preset) {
    const years = parseInt(preset.dataset.years, 10);
    const dateRange = this.calculateDateRange(years);
    
    this.logger.debug('Date preset clicked', { years, dateRange });
    
    // Update date input fields
    this.updateDateInputs(dateRange);
    
    // Update visual state of preset buttons
    this.updatePresetButtonsState(preset);
    
    // Add date filter chips to FilterManager
    this.addDateFilterChips(dateRange, years);
    
    // Emit event for date range change
    this.emit(EVENTS.DATE_RANGE_CHANGED, { dateRange, years });
  }

  /**
   * Update date input fields with the calculated range
   */
  updateDateInputs(dateRange) {
    const dateFromInput = document.getElementById('date_from');
    const dateToInput = document.getElementById('date_to');
    
    if (dateFromInput) {
      dateFromInput.value = dateRange.start;
    }
    
    if (dateToInput) {
      dateToInput.value = dateRange.end;
    }
    
    this.logger.debug('Date inputs updated', dateRange);
  }

  /**
   * Update visual state of preset buttons
   */
  updatePresetButtonsState(activePreset) {
    const presetsContainer = document.querySelector('.filter-date-presets');
    if (!presetsContainer) return;
    
    // Remove active class from all presets
    presetsContainer.querySelectorAll('[data-years]').forEach(btn => {
      btn.classList.remove('active', 'filter-date-preset--active');
    });
    
    // Add active class to clicked preset
    activePreset.classList.add('active', 'filter-date-preset--active');
  }

  /**
   * Add date filter chips to FilterManager
   */
  addDateFilterChips(dateRange, years) {
    const filterManager = this.components.filterManager;
    
    if (!filterManager) {
      this.logger.warn('FilterManager not available');
      return;
    }
    
    // Remove any existing date filters first
    this.removeDateFilters();
    
    // Add date_from filter
    // Parameters: (filterType, filterValue, filterLabel, filterCategory)
    filterManager.addFilter(
      'date_from',
      dateRange.start,
      `From: ${this.formatDate(dateRange.start)}`,
      'period'
    );
    
    // Add date_to filter
    filterManager.addFilter(
      'date_to',
      dateRange.end,
      `Until: ${this.formatDate(dateRange.end)}`,
      'period'
    );
    
    this.logger.debug('Date filter chips added', { dateRange, years });
  }

  /**
   * Remove existing date filters
   */
  removeDateFilters() {
    const filterManager = this.components.filterManager;
    if (!filterManager || !filterManager.filterChips) return;
    
    // Get the filter chips instance directly
    const filterChips = filterManager.filterChips;
    
    // Remove date filter chips
    const chipsToRemove = [];
    filterChips.activeFilters.forEach((filter, key) => {
      if (filter.name === 'date_from' || filter.name === 'date_to') {
        chipsToRemove.push({ name: filter.name, value: filter.value });
      }
    });
    
    // Remove them
    chipsToRemove.forEach(({ name, value }) => {
      filterManager.removeFilter(name, value);
    });
    
    this.logger.debug('Date filters removed', { count: chipsToRemove.length });
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
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

