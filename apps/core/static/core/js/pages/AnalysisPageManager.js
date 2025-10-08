/**
 * Analysis Page Manager (V2 - Rebuilt from scratch)
 * Modern, minimal dashboard for EU-LAC digital transformation analytics
 * Built with coordinator pattern and EventBus
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { logger } from '../core/logger/Logger.js';

// Coordinators
import { AnalysisDataCoordinator } from '../coordinators/AnalysisDataCoordinator.js';
import { AnalysisChartsCoordinator } from '../coordinators/AnalysisChartsCoordinator.js';
import { AnalysisUICoordinator } from '../coordinators/AnalysisUICoordinator.js';

export class AnalysisPageManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    // Create child logger
    this.logger = logger.child({
      component: 'AnalysisPageManager',
      version: '2.0'
    });
    
    this.coordinators = {};
    
    this.logger.info('AnalysisPageManager V2 initialized');
  }

  /**
   * Get default options
   */
  getDefaultOptions() {
    return {
      enableAnimations: true,
      enableChartAnimations: true,
      autoInitialize: true,
      dataScriptId: 'analysis-data',
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
      this.logger.debug('Data loading delegated to AnalysisDataCoordinator');
    }
    // Data loading is handled by AnalysisDataCoordinator
  }

  /**
   * Initialize coordinators
   */
  async initializeComponents() {
    if (this.logger) {
      this.logger.debug('Initializing coordinators');
    }
    
    try {
      // 1. Initialize Data Coordinator first
      this.coordinators.data = new AnalysisDataCoordinator({
        dataScriptId: this.options.dataScriptId
      });
      await this.coordinators.data.init();
      
      if (this.logger) {
        this.logger.info('✅ AnalysisDataCoordinator initialized');
      }
      
      // 2. Initialize Charts Coordinator (needs data)
      this.coordinators.charts = new AnalysisChartsCoordinator(
        this.coordinators.data,
        {
          enableAnimations: this.options.enableChartAnimations,
          animationDuration: 800
        }
      );
      await this.coordinators.charts.init();
      
      if (this.logger) {
        this.logger.info('✅ AnalysisChartsCoordinator initialized');
      }
      
      // 3. Initialize UI Coordinator
      this.coordinators.ui = new AnalysisUICoordinator(
        this.coordinators.data,
        {
          enableAnimations: this.options.enableAnimations,
          counterDuration: 2000
        }
      );
      await this.coordinators.ui.init();
      
      if (this.logger) {
        this.logger.info('✅ AnalysisUICoordinator initialized');
      }
      
      // Setup communication between coordinators
      this.setupCoordinatorCommunication();
      
      if (this.logger) {
        this.logger.info('All coordinators initialized successfully', {
          coordinatorCount: Object.keys(this.coordinators).length
        });
      }
      
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to initialize coordinators', error);
      }
      throw error;
    }
  }

  /**
   * Setup communication between coordinators
   */
  setupCoordinatorCommunication() {
    if (this.logger) {
      this.logger.debug('Setting up coordinator communication');
    }
    
    // Listen for data loaded event
    eventBus.on(EVENTS.DATA_LOADED, (data) => {
      if (this.logger) {
        this.logger.debug('Data loaded event received', {
          hasSummary: !!data.summary,
          hasAnalysis: !!data.analysis
        });
      }
    }, this);
    
    // Listen for chart rendered events
    eventBus.on('chart:rendered', (data) => {
      if (this.logger) {
        this.logger.debug('Chart rendered', {
          chartId: data.chartId,
          type: data.type
        });
      }
    }, this);
    
    if (this.logger) {
      this.logger.debug('Coordinator communication configured');
    }
  }

  /**
   * Get current page state
   */
  getState() {
    return {
      summary: this.coordinators.data?.getSummary(),
      analysis: this.coordinators.data?.getAnalysisData(),
      chartsCount: this.coordinators.charts?.chartInstances.size || 0
    };
  }

  /**
   * Reload analysis data and charts
   */
  async reload() {
    if (this.logger) {
      this.logger.info('Reloading analysis page');
    }
    
    try {
      // Reload data
      await this.coordinators.data?.loadData();
      
      // Refresh all charts
      if (this.coordinators.charts) {
        await this.coordinators.charts.initializeAllCharts();
      }
      
      // Re-animate UI
      if (this.coordinators.ui) {
        this.coordinators.ui.animateKPICards();
      }
      
      if (this.logger) {
        this.logger.info('Analysis page reloaded successfully');
      }
      
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to reload analysis page', error);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.logger) {
      this.logger.debug('Destroying AnalysisPageManager');
    }
    
    // Destroy coordinators
    Object.values(this.coordinators).forEach(coordinator => {
      if (coordinator && typeof coordinator.destroy === 'function') {
        coordinator.destroy();
      }
    });
    
    this.coordinators = {};
    
    // Call parent destroy
    super.destroy();
    
    if (this.logger) {
      this.logger.debug('AnalysisPageManager destroyed');
    }
  }
}

export default AnalysisPageManager;

