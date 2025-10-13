/**
 * SDG Radar Chart Component
 * Specialized radar chart for Sustainable Development Goals visualization
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';

export class SDGRadarChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.chart = null;
  }

  /**
   * Default options for SDG radar charts
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      sdgData: null,
      sdgInfo: null,
      colors: {
        primary: '#094EB2',
        border: '#034092',
        grid: 'rgba(9, 78, 178, 0.1)',
        gridBorder: 'rgba(9, 78, 178, 0.2)',
        text: '#1C7377'
      },
      maxValue: null // Auto-calculate if null
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.sdgData) {
      throw new Error('SDGRadarChart requires sdgData option');
    }
    this.data = this.options.sdgData;
  }

  /**
   * Render SDG radar chart using Chart.js
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

    // Calculate max value if not provided
    const maxValue = this.options.maxValue || Math.max(...values, 10);

    const config = {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'SDG Coverage',
          data: values,
          backgroundColor: `${this.options.colors.primary}33`, // 20% opacity
          borderColor: this.options.colors.border,
          borderWidth: 2,
          pointBackgroundColor: this.options.colors.primary,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: this.options.colors.border,
          pointRadius: 4,
          pointHoverRadius: 6
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
            titleColor: this.options.colors.text,
            bodyColor: this.options.colors.text,
            borderColor: this.options.colors.gridBorder,
            borderWidth: 1,
            padding: 16,
            displayColors: false,
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
                const item = tooltipItems[0];
                const label = item.label; // e.g., "SDG 1"
                
                // Extract number from label (e.g., "SDG 1" -> "1")
                const number = label.match(/\d+/)?.[0] || '';
                const sdgKey = `sdg${number}`; // Convert to 'sdg1'
                const sdgInfo = this.options.sdgInfo?.[sdgKey];
                
                if (sdgInfo) {
                  return `🎯 SDG ${number}: ${sdgInfo.name}`;
                }
                return `🎯 ${label}`;
              },
              label: (context) => {
                return `📄 Documents: ${context.parsed.r}`;
              },
              afterLabel: (context) => {
                const label = context.label; // e.g., "SDG 1"
                const number = label.match(/\d+/)?.[0] || '';
                const sdgKey = `sdg${number}`; // Convert to 'sdg1'
                const sdgInfo = this.options.sdgInfo?.[sdgKey];
                
                if (sdgInfo?.description) {
                  return `\n💡 About this SDG:\n   ${sdgInfo.description}`;
                }
                return '';
              },
              footer: (tooltipItems) => {
                return '\n✨ Part of UN\'s 2030 Agenda for Sustainable Development';
              }
            }
          }
        },
        scales: {
          r: {
            min: 0,
            max: maxValue,
            beginAtZero: true,
            ticks: {
              stepSize: Math.ceil(maxValue / 5),
              color: this.options.colors.text,
              backdropColor: 'transparent',
              font: {
                size: 10,
                family: 'Poppins'
              }
            },
            grid: {
              color: this.options.colors.grid,
              circular: true
            },
            angleLines: {
              color: this.options.colors.grid
            },
            pointLabels: {
              color: this.options.colors.text,
              font: {
                size: 11,
                family: 'Poppins',
                weight: '500'
              },
              callback: function(label) {
                // Truncate long labels
                if (label.length > 15) {
                  return label.substring(0, 15) + '...';
                }
                return label;
              }
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
    
    eventBus.emit('chart:rendered', { chartId: this.element.id, type: 'radar' });
    this.logger.info('SDG Radar chart rendered', { sdgs: labels.length });
  }

  /**
   * Update chart with new data
   */
  async updateData(newData) {
    if (this.chart && newData) {
      this.chart.data.labels = newData.labels;
      this.chart.data.datasets[0].data = newData.datasets[0].data;
      
      // Recalculate max value
      const maxValue = Math.max(...newData.datasets[0].data, 10);
      this.chart.options.scales.r.max = maxValue;
      this.chart.options.scales.r.ticks.stepSize = Math.ceil(maxValue / 5);
      
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

