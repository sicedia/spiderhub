/**
 * CabinetDataCoordinator
 * Coordinates data loading and processing for the Strategic Cabinet page
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';

export class CabinetDataCoordinator {
  constructor(options = {}) {
    this.logger = logger.child({
      component: 'CabinetDataCoordinator'
    });
    
    this.options = {
      defaultCountry: 'ECU',
      ...options
    };
    
    // Current filters
    this.filters = {
      country: this.options.defaultCountry,
      dateFrom: null,
      dateTo: null
    };
    
    // Cached data
    this.data = {
      trends: null,
      map: null,
      mix: null,
      top: null,
      isLoaded: false
    };
    
    this.logger.debug('CabinetDataCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing CabinetDataCoordinator');
    
    try {
      // Load initial data with default filters
      await this.loadAllData();
      
      this.logger.info('CabinetDataCoordinator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize CabinetDataCoordinator', error);
      throw error;
    }
  }

  /**
   * Update filters
   */
  updateFilters(filters) {
    this.logger.debug('Updating filters', filters);
    
    this.filters = {
      ...this.filters,
      ...filters
    };
    
    // Emit filter change event
    eventBus.emit('cabinet:filters_changed', this.filters);
  }

  /**
   * Get current filters
   */
  getFilters() {
    return { ...this.filters };
  }

  /**
   * Load all data for current filters
   */
  async loadAllData() {
    this.logger.debug('Loading all cabinet data', this.filters);
    
    try {
      // Load all endpoints in parallel
      const [trendsData, mapData, mixData, topData] = await Promise.all([
        this.loadTrends(),
        this.loadMap(),
        this.loadMix(),
        this.loadTop()
      ]);
      
      this.data.trends = trendsData;
      this.data.map = mapData;
      this.data.mix = mixData;
      this.data.top = topData;
      this.data.isLoaded = true;
      
      this.logger.info('All cabinet data loaded successfully');
      
      // Emit data loaded event
      eventBus.emit(EVENTS.DATA_LOADED, {
        trends: this.data.trends,
        map: this.data.map,
        mix: this.data.mix,
        top: this.data.top
      });
      
    } catch (error) {
      this.logger.error('Failed to load cabinet data', error);
      throw error;
    }
  }

  /**
   * Load trends data from API
   */
  async loadTrends() {
    try {
      const params = new URLSearchParams({
        country: this.filters.country,
        ...(this.filters.dateFrom && { date_from: this.filters.dateFrom }),
        ...(this.filters.dateTo && { date_to: this.filters.dateTo })
      });
      
      const response = await fetch(`/api/cabinet/trends/?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.logger.debug('Trends data loaded', data);
      
      return data;
      
    } catch (error) {
      this.logger.error('Failed to load trends data', error);
      throw error;
    }
  }

  /**
   * Load map data from API
   */
  async loadMap() {
    try {
      const params = new URLSearchParams({
        country: this.filters.country,
        ...(this.filters.dateFrom && { date_from: this.filters.dateFrom }),
        ...(this.filters.dateTo && { date_to: this.filters.dateTo })
      });
      
      const response = await fetch(`/api/cabinet/map/?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.logger.debug('Map data loaded', data);
      
      return data;
      
    } catch (error) {
      this.logger.error('Failed to load map data', error);
      throw error;
    }
  }

  /**
   * Load mix data from API
   */
  async loadMix() {
    try {
      const params = new URLSearchParams({
        country: this.filters.country,
        ...(this.filters.dateFrom && { date_from: this.filters.dateFrom }),
        ...(this.filters.dateTo && { date_to: this.filters.dateTo })
      });
      
      const response = await fetch(`/api/cabinet/mix/?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.logger.debug('Mix data loaded', data);
      
      return data;
      
    } catch (error) {
      this.logger.error('Failed to load mix data', error);
      throw error;
    }
  }

  /**
   * Load top themes and actors from API
   */
  async loadTop() {
    try {
      const params = new URLSearchParams({
        country: this.filters.country,
        limit: '10',
        ...(this.filters.dateFrom && { date_from: this.filters.dateFrom }),
        ...(this.filters.dateTo && { date_to: this.filters.dateTo })
      });
      
      const response = await fetch(`/api/cabinet/top/?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.logger.debug('Top data loaded', data);
      
      return data;
      
    } catch (error) {
      this.logger.error('Failed to load top data', error);
      throw error;
    }
  }

  /**
   * Get trends data
   */
  getTrendsData() {
    return this.data.trends;
  }

  /**
   * Get map data
   */
  getMapData() {
    return this.data.map;
  }

  /**
   * Get mix data
   */
  getMixData() {
    return this.data.mix;
  }

  /**
   * Get top data
   */
  getTopData() {
    return this.data.top;
  }

  /**
   * Get all data
   */
  getAllData() {
    return {
      trends: this.data.trends,
      map: this.data.map,
      mix: this.data.mix,
      top: this.data.top
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying CabinetDataCoordinator');
    eventBus.offContext(this);
    this.data = null;
    this.logger.debug('CabinetDataCoordinator destroyed');
  }
}

export default CabinetDataCoordinator;

