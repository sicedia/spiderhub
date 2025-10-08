/**
 * AnalysisChartsCoordinator
 * Coordinates all chart rendering for the analysis page
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';

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
    
    this.charts = {};
    this.chartInstances = new Map();
    
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
        chartsCount: this.chartInstances.size
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
   * Initialize all charts
   */
  async initializeAllCharts() {
    const chartConfigs = [
      { id: 'sdg-chart', type: 'sdg', renderer: this.renderSDGChart.bind(this) },
      { id: 'binding-chart', type: 'binding', renderer: this.renderBindingChart.bind(this) },
      { id: 'countries-chart', type: 'countries', renderer: this.renderCountriesChart.bind(this) },
      { id: 'themes-chart', type: 'themes', renderer: this.renderThemesChart.bind(this) },
      { id: 'actors-chart', type: 'actors', renderer: this.renderActorsChart.bind(this) },
      { id: 'beneficiaries-chart', type: 'beneficiaries', renderer: this.renderBeneficiariesChart.bind(this) }
    ];
    
    for (const config of chartConfigs) {
      try {
        await config.renderer(config.id);
        this.logger.debug('Chart rendered', { chartId: config.id });
      } catch (error) {
        this.logger.warn('Failed to render chart', { chartId: config.id, error });
      }
    }
  }

  /**
   * Render SDG alignment radar chart
   */
  async renderSDGChart(canvasId) {
    const canvas = DOMUtils.getElement(`#${canvasId}`);
    if (!canvas) {
      this.logger.warn('SDG chart canvas not found', { canvasId });
      return;
    }
    
    const data = this.dataCoordinator.getChartData('sdg');
    if (!data) return;
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'radar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: function(context) {
                return `Documents: ${context.parsed.r}`;
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            grid: {
              color: 'rgba(28, 115, 119, 0.1)',
              circular: true
            },
            angleLines: {
              color: 'rgba(28, 115, 119, 0.15)'
            },
            pointLabels: {
              font: { 
                size: 11,
                weight: '500'
              },
              color: '#374151',
              padding: 8
            },
            ticks: {
              display: true,
              stepSize: 20,
              font: { size: 10 },
              backdropColor: 'rgba(255, 255, 255, 0.8)',
              backdropPadding: 2
            },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        animation: {
          duration: this.options.animationDuration
        },
        elements: {
          line: {
            borderWidth: 2,
            borderColor: 'rgba(28, 115, 119, 0.8)'
          },
          point: {
            radius: 4,
            backgroundColor: 'rgba(28, 115, 119, 1)',
            borderColor: '#fff',
            borderWidth: 2,
            hoverRadius: 6,
            hoverBorderWidth: 3
          }
        }
      }
    });
    
    this.chartInstances.set(canvasId, chart);
    eventBus.emit('chart:rendered', { chartId: canvasId, type: 'sdg' });
  }

  /**
   * Render legal bindingness donut chart
   */
  async renderBindingChart(canvasId) {
    const canvas = DOMUtils.getElement(`#${canvasId}`);
    if (!canvas) {
      this.logger.warn('Binding chart canvas not found', { canvasId });
      return;
    }
    
    const data = this.dataCoordinator.getChartData('binding');
    if (!data) return;
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '65%',
        animation: {
          duration: this.options.animationDuration
        }
      }
    });
    
    this.chartInstances.set(canvasId, chart);
    eventBus.emit('chart:rendered', { chartId: canvasId, type: 'binding' });
  }

  /**
   * Render top countries horizontal bar chart
   */
  async renderCountriesChart(canvasId) {
    const canvas = DOMUtils.getElement(`#${canvasId}`);
    if (!canvas) {
      this.logger.warn('Countries chart canvas not found', { canvasId });
      return;
    }
    
    const data = this.dataCoordinator.getChartData('countries');
    if (!data) return;
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: this.options.animationDuration
        }
      }
    });
    
    this.chartInstances.set(canvasId, chart);
    eventBus.emit('chart:rendered', { chartId: canvasId, type: 'countries' });
  }

  /**
   * Render top themes horizontal bar chart
   */
  async renderThemesChart(canvasId) {
    const canvas = DOMUtils.getElement(`#${canvasId}`);
    if (!canvas) {
      this.logger.warn('Themes chart canvas not found', { canvasId });
      return;
    }
    
    const data = this.dataCoordinator.getChartData('themes');
    if (!data) return;
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: { size: 11 }
            }
          }
        },
        animation: {
          duration: this.options.animationDuration
        }
      }
    });
    
    this.chartInstances.set(canvasId, chart);
    eventBus.emit('chart:rendered', { chartId: canvasId, type: 'themes' });
  }

  /**
   * Render actors distribution bar chart
   */
  async renderActorsChart(canvasId) {
    const canvas = DOMUtils.getElement(`#${canvasId}`);
    if (!canvas) {
      this.logger.warn('Actors chart canvas not found', { canvasId });
      return;
    }
    
    const data = this.dataCoordinator.getChartData('actors');
    if (!data) return;
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: { size: 11 }
            }
          }
        },
        animation: {
          duration: this.options.animationDuration
        }
      }
    });
    
    this.chartInstances.set(canvasId, chart);
    eventBus.emit('chart:rendered', { chartId: canvasId, type: 'actors' });
  }

  /**
   * Render beneficiaries distribution bar chart
   */
  async renderBeneficiariesChart(canvasId) {
    const canvas = DOMUtils.getElement(`#${canvasId}`);
    if (!canvas) {
      this.logger.warn('Beneficiaries chart canvas not found', { canvasId });
      return;
    }
    
    const data = this.dataCoordinator.getChartData('beneficiaries');
    if (!data) return;
    
    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: { size: 11 },
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        animation: {
          duration: this.options.animationDuration
        }
      }
    });
    
    this.chartInstances.set(canvasId, chart);
    eventBus.emit('chart:rendered', { chartId: canvasId, type: 'beneficiaries' });
  }

  /**
   * Update a specific chart with new data
   */
  updateChart(chartId, newData) {
    const chart = this.chartInstances.get(chartId);
    if (!chart) {
      this.logger.warn('Chart not found for update', { chartId });
      return;
    }
    
    chart.data = newData;
    chart.update();
    
    this.logger.debug('Chart updated', { chartId });
    eventBus.emit('chart:updated', { chartId });
  }

  /**
   * Destroy a specific chart
   */
  destroyChart(chartId) {
    const chart = this.chartInstances.get(chartId);
    if (chart) {
      chart.destroy();
      this.chartInstances.delete(chartId);
      this.logger.debug('Chart destroyed', { chartId });
    }
  }

  /**
   * Clean up all resources
   */
  destroy() {
    this.logger.debug('Destroying AnalysisChartsCoordinator');
    
    // Destroy all chart instances
    this.chartInstances.forEach((chart, chartId) => {
      chart.destroy();
      this.logger.debug('Chart instance destroyed', { chartId });
    });
    
    this.chartInstances.clear();
    eventBus.offContext(this);
    
    this.logger.debug('AnalysisChartsCoordinator destroyed');
  }
}

export default AnalysisChartsCoordinator;

