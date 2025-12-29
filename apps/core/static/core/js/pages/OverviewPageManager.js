/**
 * Overview Page Manager
 * Manages the Overview Country-EU dashboard
 * Built with coordinator pattern and EventBus
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { logger } from '../core/logger/Logger.js';

// Coordinators
import { OverviewDataCoordinator } from '../coordinators/OverviewDataCoordinator.js';
import { OverviewChartsCoordinator } from '../coordinators/OverviewChartsCoordinator.js';

export class OverviewPageManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    // Create child logger
    this.logger = logger.child({
      component: 'OverviewPageManager',
      version: '1.0'
    });
    
    this.coordinators = {};
    this.filterElements = {};
    
    this.logger.info('OverviewPageManager initialized');
  }

  /**
   * Get default options
   */
  getDefaultOptions() {
    return {
      enableAnimations: true,
      enableChartAnimations: true,
      autoInitialize: true,
      defaultCountry: 'ECU',
      ...super.getDefaultOptions()
    };
  }

  /**
   * No additional services needed for now
   */
  async initializeServices() {
    if (this.logger) {
      this.logger.debug('No additional services to initialize');
    }
  }

  /**
   * Load page data (delegated to DataCoordinator)
   */
  async loadPageData() {
    if (this.logger) {
      this.logger.debug('Data loading delegated to OverviewDataCoordinator');
    }
    // Data loading is handled by OverviewDataCoordinator
  }

  /**
   * Initialize coordinators and UI components
   */
  async initializeComponents() {
    if (this.logger) {
      this.logger.debug('Initializing coordinators and components');
    }
    
    try {
      // 1. Initialize Data Coordinator first
      this.coordinators.data = new OverviewDataCoordinator({
        defaultCountry: this.options.defaultCountry
      });
      await this.coordinators.data.init();
      
      if (this.logger) {
        this.logger.info('✅ OverviewDataCoordinator initialized');
      }
      
      // 2. Initialize Charts Coordinator
      this.coordinators.charts = new OverviewChartsCoordinator(
        this.coordinators.data,
        {
          enableAnimations: this.options.enableChartAnimations,
          animationDuration: 800
        }
      );
      await this.coordinators.charts.init();
      
      if (this.logger) {
        this.logger.info('✅ OverviewChartsCoordinator initialized');
      }
      
      // 3. Setup filter UI (loads countries from API)
      await this.setupFilters();
      
      if (this.logger) {
        this.logger.info('All components initialized successfully');
      }
      
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to initialize components', error);
      }
      throw error;
    }
  }

  /**
   * Setup filter controls
   */
  async setupFilters() {
    this.logger.debug('Setting up filters');
    
    // Get filter elements
    this.filterElements = {
      countrySelect: document.getElementById('country-select'),
      dateFrom: document.getElementById('date-from'),
      dateTo: document.getElementById('date-to'),
      applyBtn: document.getElementById('apply-filters'),
      resetBtn: document.getElementById('reset-filters')
    };
    
    // Load countries first
    await this.loadCountries();
    
    // Bind event listeners
    if (this.filterElements.applyBtn) {
      this.filterElements.applyBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }
    
    if (this.filterElements.resetBtn) {
      this.filterElements.resetBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }
    
    // Also apply filters on Enter key in date inputs
    [this.filterElements.dateFrom, this.filterElements.dateTo].forEach(input => {
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.applyFilters();
          }
        });
      }
    });
    
    this.logger.debug('Filters setup complete');
  }

  /**
   * Load countries from API and populate the country select
   */
  async loadCountries() {
    const countrySelect = this.filterElements.countrySelect;
    if (!countrySelect) {
      this.logger.warn('Country select element not found');
      return;
    }

    try {
      this.logger.debug('Loading countries from API');
      
      const response = await fetch('/api/v1/countries/');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const countries = data.countries || [];
      
      this.logger.info('Countries loaded successfully', { count: countries.length });
      
      // Clear existing options (except loading message)
      countrySelect.innerHTML = '';
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select a country...';
      countrySelect.appendChild(defaultOption);
      
      // Add countries
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.iso3;
        option.textContent = `${country.name} (${country.iso3})`;
        
        // Set default country as selected
        if (country.iso3 === this.options.defaultCountry) {
          option.selected = true;
        }
        
        countrySelect.appendChild(option);
      });
      
      this.logger.debug('Countries populated in select');
      
    } catch (error) {
      this.logger.error('Failed to load countries', error);
      
      // Show error in select
      countrySelect.innerHTML = '';
      const errorOption = document.createElement('option');
      errorOption.value = '';
      errorOption.textContent = 'Error loading countries';
      countrySelect.appendChild(errorOption);
    }
  }

  /**
   * Apply current filters
   */
  async applyFilters() {
    this.logger.debug('Applying filters');
    
    const filters = {
      country: this.filterElements.countrySelect?.value || this.options.defaultCountry,
      dateFrom: this.filterElements.dateFrom?.value || null,
      dateTo: this.filterElements.dateTo?.value || null
    };
    
    // Update data coordinator filters
    this.coordinators.data.updateFilters(filters);
    
    // Show loading state
    this.showLoadingState();
    
    try {
      // Reload all data
      await this.coordinators.data.loadAllData();
      
      this.logger.info('Filters applied successfully', filters);
      
    } catch (error) {
      this.logger.error('Failed to apply filters', error);
      this.showErrorState();
    } finally {
      this.hideLoadingState();
    }
  }

  /**
   * Reset filters to defaults
   */
  async resetFilters() {
    this.logger.debug('Resetting filters');
    
    // Reset UI
    if (this.filterElements.countrySelect) {
      this.filterElements.countrySelect.value = this.options.defaultCountry;
    }
    if (this.filterElements.dateFrom) {
      this.filterElements.dateFrom.value = '';
    }
    if (this.filterElements.dateTo) {
      this.filterElements.dateTo.value = '';
    }
    
    // Apply default filters
    await this.applyFilters();
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const applyBtn = this.filterElements.applyBtn;
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.textContent = 'Loading...';
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    const applyBtn = this.filterElements.applyBtn;
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.innerHTML = `
        <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Apply Filters
      `;
    }
  }

  /**
   * Show error state
   */
  showErrorState() {
    const applyBtn = this.filterElements.applyBtn;
    if (applyBtn) {
      applyBtn.textContent = 'Error - Try again';
      setTimeout(() => {
        this.hideLoadingState();
      }, 2000);
    }
  }

  /**
   * Get current page state
   */
  getState() {
    return {
      filters: this.coordinators.data?.getFilters(),
      data: this.coordinators.data?.getAllData()
    };
  }

  /**
   * Reload overview data and charts
   */
  async reload() {
    if (this.logger) {
      this.logger.info('Reloading overview page');
    }
    
    try {
      await this.coordinators.data?.loadAllData();
      
      if (this.logger) {
        this.logger.info('Overview page reloaded successfully');
      }
      
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to reload overview page', error);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.logger) {
      this.logger.debug('Destroying OverviewPageManager');
    }
    
    // Destroy coordinators
    Object.values(this.coordinators).forEach(coordinator => {
      if (coordinator && typeof coordinator.destroy === 'function') {
        coordinator.destroy();
      }
    });
    
    this.coordinators = {};
    this.filterElements = {};
    
    // Call parent destroy
    super.destroy();
    
    if (this.logger) {
      this.logger.debug('OverviewPageManager destroyed');
    }
  }
}

export default OverviewPageManager;

