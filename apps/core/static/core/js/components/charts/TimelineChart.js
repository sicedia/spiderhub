/**
 * Timeline Chart Component
 * Specialized line/area chart for temporal evolution of documents
 * Shows trends over time for agreements vs dialogues
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';
import { gettext } from '../../core/i18n/i18n.js';

export class TimelineChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.chart = null;
  }

  /**
   * Default options for timeline chart
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      timelineData: null,
      colors: {
        total: '#1C7377',        // Teal for total documents
        agreements: '#094EB2',   // Blue for agreements
        dialogues: '#34A853',    // Green for dialogues
        grid: 'rgba(0, 0, 0, 0.05)'
      },
      chartType: 'line' // 'line' or 'area'
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.timelineData) {
      throw new Error('TimelineChart requires timelineData option');
    }
    this.data = this.options.timelineData;
  }

  /**
   * Render timeline chart using Chart.js
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
    const totalData = this.data.datasets.find(d => d.label === 'Total')?.data || [];
    const agreementsData = this.data.datasets.find(d => d.label === 'Agreements')?.data || [];
    const dialoguesData = this.data.datasets.find(d => d.label === 'Dialogues')?.data || [];

    // Calculate max value for better scale
    const allValues = [...totalData, ...agreementsData, ...dialoguesData];
    const maxValue = Math.max(...allValues, 0);
    const suggestedMax = Math.ceil(maxValue * 1.1); // 10% padding

    const config = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: gettext('Total Documents'),
            data: totalData,
            borderColor: this.options.colors.total,
            backgroundColor: `${this.options.colors.total}20`,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: this.options.colors.total,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBorderWidth: 3
          },
          {
            label: gettext('Agreements'),
            data: agreementsData,
            borderColor: this.options.colors.agreements,
            backgroundColor: `${this.options.colors.agreements}15`,
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: this.options.colors.agreements,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBorderWidth: 2
          },
          {
            label: gettext('Dialogues'),
            data: dialoguesData,
            borderColor: this.options.colors.dialogues,
            backgroundColor: `${this.options.colors.dialogues}15`,
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: this.options.colors.dialogues,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              color: '#1C7377',
              font: {
                size: 12,
                family: 'Poppins',
                weight: '500'
              },
              boxWidth: 8,
              boxHeight: 8
            }
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
              weight: 'bold',
              family: 'Poppins'
            },
            bodyFont: {
              size: 12,
              family: 'Poppins'
            },
            footerFont: {
              size: 10,
              style: 'italic',
              family: 'Poppins'
            },
            footerColor: 'rgba(28, 115, 119, 0.7)',
            callbacks: {
              title: (tooltipItems) => {
                const item = tooltipItems[0];
                return `📅 ${item.label}`;
              },
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                
                // Add emoji based on dataset
                let emoji = '📄';
                if (label.includes(gettext('Total'))) emoji = '📊';
                else if (label.includes(gettext('Agreements'))) emoji = '📜';
                else if (label.includes(gettext('Dialogues'))) emoji = '💬';
                
                return `${emoji} ${label}: ${value} ${gettext('documents')}`;
              },
              footer: (tooltipItems) => {
                // Calculate percentage of total for agreements and dialogues
                const totalIdx = tooltipItems.findIndex(item => 
                  item.dataset.label === gettext('Total Documents')
                );
                
                if (totalIdx !== -1) {
                  const total = tooltipItems[totalIdx].parsed.y;
                  
                  if (total > 0) {
                    const details = tooltipItems
                      .filter(item => item.dataset.label !== gettext('Total Documents'))
                      .map(item => {
                        const percent = ((item.parsed.y / total) * 100).toFixed(1);
                        return `${item.dataset.label}: ${percent}%`;
                      })
                      .join(' | ');
                    
                    return `\n${details}`;
                  }
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: this.options.colors.grid,
              drawBorder: false
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11,
                family: 'Poppins',
                weight: '500'
              },
              maxRotation: 45,
              minRotation: 0
            },
            title: {
              display: true,
              text: gettext('Year'),
              color: '#1C7377',
              font: {
                size: 12,
                family: 'Poppins',
                weight: '600'
              },
              padding: { top: 10 }
            }
          },
          y: {
            beginAtZero: true,
            suggestedMax: suggestedMax,
            grid: {
              color: this.options.colors.grid,
              drawBorder: false
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11,
                family: 'Poppins'
              },
              precision: 0, // No decimals
              callback: function(value) {
                return Number.isInteger(value) ? value : '';
              }
            },
            title: {
              display: true,
              text: gettext('Number of Documents'),
              color: '#1C7377',
              font: {
                size: 12,
                family: 'Poppins',
                weight: '600'
              },
              padding: { bottom: 10 }
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    };

    this.chart = new Chart(this.element, config);
    this.chartInstance = this.chart;
    
    eventBus.emit('chart:rendered', { chartId: this.element.id, type: 'timeline' });
    this.logger.info('Timeline chart rendered', { 
      periods: labels.length,
      maxValue: maxValue
    });
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

