/**
 * Actors Bar Chart Component
 * Specialized vertical bar chart for actor types
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';

export class ActorsBarChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.chart = null;
  }

  /**
   * Default options for actors bar chart
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      actorsData: null,
      colors: ['#094EB2', '#34A853', '#EA4335', '#FBBC04', '#9333EA']
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.actorsData) {
      throw new Error('ActorsBarChart requires actorsData option');
    }
    this.data = this.options.actorsData;
  }

  /**
   * Render actors bar chart using Chart.js
   */
  async render() {
    if (typeof Chart === 'undefined') {
      this.logger.warn('Chart.js library not loaded');
      return;
    }

    // Destroy existing chart if any
    const existingChart = Chart.getChart(this.element);
    if (existingChart) {
      existingChart.destroy();
    }

    const labels = this.data.labels || [];
    const values = this.data.datasets[0].data || [];

    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Documents',
          data: values,
          backgroundColor: this.options.colors,
          borderColor: this.options.colors.map(color => this.darkenColor(color, 20)),
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1C7377',
            bodyColor: '#1C7377',
            borderColor: 'rgba(28, 115, 119, 0.2)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                return `Documents: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11,
                family: 'Poppins'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#1C7377',
              font: {
                size: 11,
                family: 'Poppins',
                weight: '500'
              },
              maxRotation: 45,
              minRotation: 0
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeInOutQuart'
        }
      }
    };

    this.chart = new Chart(this.element, config);
    this.chartInstance = this.chart;
    
    eventBus.emit('chart:rendered', { chartId: this.element.id, type: 'bar' });
    this.logger.info('Actors Bar chart rendered', { actorTypes: labels.length });
  }

  /**
   * Darken color utility
   */
  darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }

  /**
   * Destroy chart instance
   */
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    super.destroy();
  }
}

