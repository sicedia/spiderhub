/**
 * Actors Bar Chart Component
 * Specialized vertical bar chart for actor types
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';
import { gettext as _ } from '../../core/i18n/i18n.js';

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
      actorInfo: null,
      colors: {
        'Political Actors': '#094EB2',                    // Blue - Government
        'Research and Innovation Actors': '#9333EA',      // Purple - Research
        'Economic Actors': '#10B981',                     // Green - Business
        'Civil Society Actors': '#F59E0B',                // Orange - Civil Society
        'Uncategorised': '#9CA3AF'                        // Gray - Other
      }
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.actorsData) {
      this.logger.warn('No actorsData provided, showing empty state');
      this.data = null;
      return;
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

    // Handle no data gracefully
    if (!this.data || !this.data.labels || !this.data.datasets) {
      this.renderEmptyState();
      return;
    }

    const labels = this.data.labels || [];
    const values = this.data.datasets[0]?.data || [];
    
    // Assign colors based on actor labels
    const backgroundColors = labels.map(label => 
      this.options.colors[label] || '#094EB2'
    );
    
    const borderColors = labels.map(label => {
      const color = this.options.colors[label] || '#094EB2';
      return this.darkenColor(color, 20);
    });

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
                const actorInfo = this.options.actorInfo?.[label];
                
                if (actorInfo) {
                  return `${actorInfo.icon} ${label}`;
                }
                return label;
              },
              label: (context) => {
                return `${_('Documents')}: ${context.parsed.y}`;
              },
              afterLabel: (context) => {
                const label = context.label;
                const actorInfo = this.options.actorInfo?.[label];
                
                if (actorInfo?.description) {
                  return `\n💡 ${actorInfo.description}\n👥 ${_('Role')}: ${actorInfo.role}`;
                }
                return '';
              },
              footer: () => {
                return `\n🤝 ${_('Stakeholder participation')}`;
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
                size: 10,
                family: 'Poppins',
                weight: '500'
              },
              maxRotation: 45,
              minRotation: 45,
              autoSkip: false,
              callback: function(value, index, values) {
                const label = this.getLabelForValue(value);
                // Acortar labels largos para mejor visualización
                const maxLength = 18;
                if (label.length > maxLength) {
                  // Usar versiones cortas para las etiquetas
                  const shortLabels = {
                    'Political Actors': 'Political',
                    'Research and Innovation Actors': 'Research & Innovation',
                    'Economic Actors': 'Economic',
                    'Civil Society Actors': 'Civil Society',
                    'Uncategorised': 'Other'
                  };
                  return shortLabels[label] || label.substring(0, maxLength) + '...';
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
   * Render empty state when no data is available
   */
  renderEmptyState() {
    this.element.style.display = 'flex';
    this.element.style.alignItems = 'center';
    this.element.style.justifyContent = 'center';
    this.element.style.minHeight = '200px';
    this.element.innerHTML = `
      <div style="text-align: center; color: #6c757d;">
        <p style="margin: 0; font-size: 14px;">No actor data available</p>
        <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.7;">Data will appear once documents are analyzed</p>
      </div>
    `;
    this.logger.info('Actors chart showing empty state');
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

