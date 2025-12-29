/**
 * AnalysisChartsCoordinator
 * Coordinates all chart rendering for the analysis page
 * Refactored to use modular chart components
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';

// Chart Components
import { NetworkGraph } from '../components/charts/NetworkGraph.js';
import { SDGRadarChart } from '../components/charts/SDGRadarChart.js';
import { BindingDonutChart } from '../components/charts/BindingDonutChart.js';
import { CountriesBarChart } from '../components/charts/CountriesBarChart.js';
import { ThemesBarChart } from '../components/charts/ThemesBarChart.js';
import { ActorsBarChart } from '../components/charts/ActorsBarChart.js';
import { BeneficiariesBarChart } from '../components/charts/BeneficiariesBarChart.js';
import { TimelineChart } from '../components/charts/TimelineChart.js';

export class AnalysisChartsCoordinator {
  constructor(dataCoordinator, options = {}) {
    this.logger = logger.child({
      component: 'AnalysisChartsCoordinator'
    });
    
    this.dataCoordinator = dataCoordinator;
    this.options = {
      enableAnimations: true,
      animationDuration: 800,
      ...options
    };
    
    this.chartComponents = new Map();
    
    this.logger.debug('AnalysisChartsCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing AnalysisChartsCoordinator');
    
    try {
      // Wait for Chart.js to be available
      await this.waitForChartJS();
      
      // Initialize all charts
      await this.initializeAllCharts();
      
      this.logger.info('AnalysisChartsCoordinator initialized successfully', {
        chartsCount: this.chartComponents.size
      });
    } catch (error) {
      this.logger.error('Failed to initialize AnalysisChartsCoordinator', error);
      throw error;
    }
  }

  /**
   * Wait for Chart.js library to load
   */
  async waitForChartJS() {
    const maxAttempts = 50;
    let attempts = 0;
    
    while (typeof Chart === 'undefined' && attempts < maxAttempts) {
      this.logger.debug('Waiting for Chart.js...', { attempt: attempts + 1 });
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js library not loaded');
    }
    
    this.logger.debug('Chart.js library loaded');
  }

  /**
   * Initialize all charts using modular components
   */
  async initializeAllCharts() {
    const chartConfigs = [
      { 
        id: 'network-graph', 
        type: 'network',
        component: NetworkGraph,
        data: {
          actorData: this.dataCoordinator.getChartData('actors'),
          themeData: this.dataCoordinator.getChartData('themes'),
          coOccurrenceMatrix: this.dataCoordinator.getCoOccurrenceMatrix()
        }
      },
      { 
        id: 'sdg-chart', 
        type: 'radar',
        component: SDGRadarChart,
        data: {
          sdgData: this.dataCoordinator.getChartData('sdg'),
          sdgInfo: this.dataCoordinator.getSDGInfo()
        }
      },
      { 
        id: 'binding-chart', 
        type: 'donut',
        component: BindingDonutChart,
        data: {
          bindingData: this.dataCoordinator.getChartData('binding'),
          bindingInfo: this.dataCoordinator.getBindingInfo()
        }
      },
      { 
        id: 'countries-chart', 
        type: 'bar',
        component: CountriesBarChart,
        data: {
          countriesData: this.dataCoordinator.getChartData('lead_countries')
        }
      },
      { 
        id: 'themes-chart', 
        type: 'bar',
        component: ThemesBarChart,
        data: {
          themesData: this.dataCoordinator.getChartData('themes'),
          themeInfo: this.dataCoordinator.getThemeInfo()
        }
      },
      { 
        id: 'timeline-chart', 
        type: 'line',
        component: TimelineChart,
        data: {
          timelineData: this.dataCoordinator.getChartData('timeline')
        }
      },
      { 
        id: 'actors-chart', 
        type: 'bar',
        component: ActorsBarChart,
        data: {
          actorsData: this.dataCoordinator.getChartData('actors'),
          actorInfo: this.dataCoordinator.getActorInfo()
        }
      },
      { 
        id: 'beneficiaries-chart', 
        type: 'bar',
        component: BeneficiariesBarChart,
        data: {
          beneficiariesData: this.dataCoordinator.getChartData('beneficiaries'),
          beneficiaryInfo: this.dataCoordinator.getBeneficiaryInfo()
        }
      }
    ];
    
    for (const config of chartConfigs) {
      try {
        await this.renderChart(config);
        this.logger.debug('Chart rendered', { chartId: config.id, type: config.type });
      } catch (error) {
        this.logger.warn('Failed to render chart', { 
          chartId: config.id, 
          type: config.type,
          error: error.message 
        });
      }
    }
  }

  /**
   * Render a chart using its component class
   */
  async renderChart(config) {
    const element = DOMUtils.getElement(`#${config.id}`);
    
    if (!element) {
      this.logger.warn('Chart element not found', { chartId: config.id });
      return;
    }
    
    // Create chart component instance
    const chartComponent = new config.component(element, {
      ...config.data,
      ...this.options
    });

    // Initialize the chart
    await chartComponent.init();

    // Store the component
    this.chartComponents.set(config.id, chartComponent);
  }

  /**
   * Update a specific chart
   */
  async updateChart(chartId, newData) {
    const chartComponent = this.chartComponents.get(chartId);
    
    if (!chartComponent) {
      this.logger.warn('Chart not found for update', { chartId });
      return;
    }
    
    try {
      await chartComponent.updateData(newData);
      this.logger.debug('Chart updated', { chartId });
    } catch (error) {
      this.logger.error('Failed to update chart', { chartId, error });
    }
  }

  /**
   * Destroy all charts
   */
  destroy() {
    this.chartComponents.forEach((component, id) => {
      try {
        component.destroy();
        this.logger.debug('Chart destroyed', { chartId: id });
      } catch (error) {
        this.logger.warn('Error destroying chart', { chartId: id, error });
      }
    });
    
    this.chartComponents.clear();
    this.logger.info('All charts destroyed');
  }

  /**
   * Get a specific chart component
   */
  getChart(chartId) {
    return this.chartComponents.get(chartId);
  }

  /**
   * Get all chart components
   */
  getAllCharts() {
    return Array.from(this.chartComponents.values());
  }

  /**
   * Check if a chart exists
   */
  hasChart(chartId) {
    return this.chartComponents.has(chartId);
  }
}
