/**
 * Themes Bar Chart Component
 * Specialized horizontal bar chart for thematic focus
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';
import { gettext as _ } from '../../core/i18n/i18n.js';

export class ThemesBarChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.chart = null;
  }

  /**
   * Default options for themes bar chart
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      themesData: null,
      themeInfo: null,
      colors: {
        'Digital Transformation & Strategy': '#9333EA',  // Purple
        'Technology & Innovation': '#3B82F6',            // Blue
        'Data & Governance': '#EF4444',                  // Red
        'Inclusion & Social Development': '#10B981',     // Green
        'Regional & International Cooperation': '#F59E0B', // Orange
        'Uncategorised': '#9CA3AF'                       // Gray
      },
      maxBars: 10
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.themesData) {
      throw new Error('ThemesBarChart requires themesData option');
    }
    this.data = this.options.themesData;
  }

  /**
   * Render themes bar chart using Chart.js
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
    
    // Assign colors based on theme labels
    const backgroundColors = labels.map(label => {
      const color = this.options.colors[label];
      return color ? `${color}CC` : '#9333EACC'; // 80% opacity
    });
    
    const borderColors = labels.map(label => 
      this.options.colors[label] || '#9333EA'
    );

    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Documents',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7
        }]
      },
      options: {
        indexAxis: 'y',
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
                const item = tooltipItems[0];
                const label = item.label;
                const themeInfo = this.options.themeInfo?.[label];
                
                if (themeInfo) {
                  return `${themeInfo.icon} ${label}`;
                }
                return label;
              },
              label: (context) => {
                return `${_('Documents')}: ${context.parsed.x}`;
              },
              afterLabel: (context) => {
                const label = context.label;
                const themeInfo = this.options.themeInfo?.[label];
                
                if (themeInfo?.description) {
                  return `\n💡 ${themeInfo.description}\n🎯 ${_('Focus')}: ${themeInfo.focus}`;
                }
                return '';
              },
              footer: () => {
                return `\n🌐 ${_('Digital cooperation themes')}`;
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
    
    eventBus.emit('chart:rendered', { chartId: this.element.id, type: 'bar' });
    this.logger.info('Themes Bar chart rendered', { themes: labels.length });
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

