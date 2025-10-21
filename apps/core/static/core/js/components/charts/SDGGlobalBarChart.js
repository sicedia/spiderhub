/**
 * SDG Global Relevance Bar Chart Component
 * Displays overall SDG impact across entire corpus (includes zeros)
 * Horizontal bar chart following standard chart design patterns
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';
import { gettext } from '../../core/i18n/i18n.js';

export class SDGGlobalBarChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.chart = null;
  }

  /**
   * Default options for SDG global bar chart
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      sdgGlobalData: null,
      sdgInfo: null,
      // SDG colors following official UN SDG color palette
      sdgColors: {
        'sdg1': '#E5243B', 'sdg2': '#DDA63A', 'sdg3': '#4C9F38', 'sdg4': '#C5192D',
        'sdg5': '#FF3A21', 'sdg6': '#26BDE2', 'sdg7': '#FCC30B', 'sdg8': '#A21942',
        'sdg9': '#FD6925', 'sdg10': '#DD1367', 'sdg11': '#FD9D24', 'sdg12': '#BF8B2E',
        'sdg13': '#3F7E44', 'sdg14': '#0A97D9', 'sdg15': '#56C02B', 'sdg16': '#00689D',
        'sdg17': '#19486A'
      }
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.sdgGlobalData) {
      throw new Error('SDGGlobalBarChart requires sdgGlobalData option');
    }
    this.data = this.options.sdgGlobalData;
  }

  /**
   * Render SDG global relevance bar chart using Chart.js
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
    const datasets = this.data.datasets || [];
    const values = datasets[0]?.data || [];
    const sdgInfo = datasets[0]?.sdgInfo || [];

    // Extract SDG numbers from labels to get colors
    const sdgNumbers = labels.map(label => {
      const match = label.match(/SDG\s*(\d+)/i);
      return match ? `sdg${match[1]}` : null;
    });

    // Assign colors based on SDG number
    const backgroundColors = sdgNumbers.map(sdgKey => {
      const color = this.options.sdgColors[sdgKey] || '#1C7377';
      return `${color}CC`; // 80% opacity
    });

    const borderColors = sdgNumbers.map(sdgKey =>
      this.options.sdgColors[sdgKey] || '#1C7377'
    );

    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Global Relevance',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars
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
            padding: 16,
            displayColors: true,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 12
            },
            footerFont: {
              size: 10,
              style: 'italic'
            },
            footerColor: 'rgba(28, 115, 119, 0.7)',
            callbacks: {
              title: (tooltipItems) => {
                const index = tooltipItems[0].dataIndex;
                const info = sdgInfo[index];
                if (info) {
                  return `🎯 SDG ${info.number}: ${info.name}`;
                }
                return tooltipItems[0].label;
              },
              label: (context) => {
                const value = context.parsed.x;
                return `🌍 ${gettext('Global Relevance')}: ${value.toFixed(3)} (${(value * 100).toFixed(1)}%)`;
              },
              afterLabel: (context) => {
                const index = context.dataIndex;
                const info = sdgInfo[index];
                if (info?.description) {
                  return `\n💡 ${info.description}`;
                }
                return '';
              },
              footer: () => {
                return `\n📊 ${gettext('Impact across entire corpus (docs without SDG = 0)')}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11,
                family: 'Poppins'
              },
              callback: function(value) {
                return value.toFixed(2);
              }
            },
            title: {
              display: true,
              text: 'Global Relevance Score',
              color: '#1C7377',
              font: {
                size: 12,
                family: 'Poppins',
                weight: '600'
              }
            }
          },
          y: {
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
              autoSkip: false
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
    this.logger.info('SDG Global Bar chart rendered', { sdgs: labels.length });
  }

  /**
   * Update chart with new data
   */
  async updateData(newData) {
    if (this.chart && newData) {
      this.chart.data.labels = newData.labels;
      this.chart.data.datasets = newData.datasets;
      this.chart.update();
    }
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
