/**
 * Beneficiaries Bar Chart Component
 * Specialized vertical bar chart for beneficiary groups
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';

export class BeneficiariesBarChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.chart = null;
  }

  /**
   * Default options for beneficiaries bar chart
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      beneficiariesData: null,
      color: '#06B6D4'
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.beneficiariesData) {
      throw new Error('BeneficiariesBarChart requires beneficiariesData option');
    }
    this.data = this.options.beneficiariesData;
  }

  /**
   * Render beneficiaries bar chart using Chart.js
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

    // Generate gradient colors
    const backgroundColors = labels.map((_, index) => {
      const opacity = 0.9 - (index * 0.1);
      return `${this.options.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
    });

    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Documents',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: this.options.color,
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
    this.logger.info('Beneficiaries Bar chart rendered', { beneficiaryGroups: labels.length });
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

