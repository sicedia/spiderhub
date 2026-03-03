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

    // Qualitative indicators section (inline — simple enough without a component file)
    try {
      this.renderQualitativeCharts();
    } catch (error) {
      this.logger.warn('Failed to render qualitative charts', { error: error.message });
    }
  }

  /**
   * Render qualitative cooperation framework charts:
   *  - 3 KPI cards (total docs, scored docs, coverage %)
   *  - Horizontal bar chart  (avg score per indicator)
   *  - Radar chart           (avg score per analytical level)
   */
  renderQualitativeCharts() {
    const q = this.dataCoordinator.getChartData('qualitative');
    if (!q) {
      this.logger.warn('No qualitative data available');
      return;
    }

    const { barLabels, barData, barColors, fullLabels, radarLabels, radarData, coverage } = q;

    // ── KPI cards ─────────────────────────────────────────────────────────────
    const totalEl    = document.getElementById('qi-total-docs');
    const scoredEl   = document.getElementById('qi-scored-docs');
    const coverageEl = document.getElementById('qi-coverage-rate');

    if (totalEl)    totalEl.textContent    = coverage.total_documents.toLocaleString();
    if (scoredEl)   scoredEl.textContent   = coverage.scored_documents.toLocaleString();
    if (coverageEl) coverageEl.textContent = `${coverage.coverage_rate}%`;

    // ── Horizontal bar chart (per indicator) ──────────────────────────────────
    const barCanvas = document.getElementById('qualitative-bar-chart');
    if (barCanvas) {
      const hasBarData = barData.some(v => v > 0);
      new Chart(barCanvas, {
        type: 'bar',
        data: {
          labels: barLabels,
          datasets: [{
            label: 'Avg Score',
            data: barData,
            backgroundColor: barColors,
            borderColor: barColors.map(c => c.replace('0.75', '1')),
            borderWidth: 1,
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => fullLabels[items[0].dataIndex] || items[0].label,
                label: (item) => {
                  const v = item.raw;
                  return ` Score: ${v.toFixed(3)} / 1.0  (${(v * 100).toFixed(1)}%)`;
                },
              },
            },
          },
          scales: {
            x: {
              min: 0,
              max: 1,
              ticks: {
                callback: (v) => `${(v * 100).toFixed(0)}%`,
              },
              grid: { color: 'rgba(0,0,0,0.06)' },
            },
            y: {
              ticks: { font: { size: 12 } },
              grid: { display: false },
            },
          },
          animation: { duration: hasBarData ? 800 : 0 },
        },
      });
      this.logger.debug('Qualitative bar chart rendered');
    }

    // ── Radar chart (per level) ────────────────────────────────────────────────
    const radarCanvas = document.getElementById('qualitative-radar-chart');
    if (radarCanvas) {
      const hasRadarData = radarData.some(v => v > 0);
      new Chart(radarCanvas, {
        type: 'radar',
        data: {
          labels: radarLabels,
          datasets: [{
            label: 'Avg Score (%)',
            data: radarData,
            backgroundColor: 'rgba(124, 58, 237, 0.18)',
            borderColor:     'rgba(124, 58, 237, 0.9)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(124, 58, 237, 1)',
            pointBorderColor:     '#fff',
            pointRadius: 5,
            pointHoverRadius: 7,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (item) => ` ${item.raw.toFixed(1)} / 100`,
              },
            },
          },
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: {
                stepSize: 25,
                callback: (v) => `${v}%`,
                font: { size: 11 },
              },
              pointLabels: { font: { size: 13, weight: 'bold' } },
              grid:        { color: 'rgba(0,0,0,0.08)' },
              angleLines:  { color: 'rgba(0,0,0,0.08)' },
            },
          },
          animation: { duration: hasRadarData ? 800 : 0 },
        },
      });
      this.logger.debug('Qualitative radar chart rendered');
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
