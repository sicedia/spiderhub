/**
 * Beneficiaries Bar Chart Component
 * Specialized horizontal bar chart for beneficiary groups
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';
import { gettext as _ } from '../../core/i18n/i18n.js';

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
      beneficiaryInfo: null,
      categoryColors: {
        'Economic': '#10B981',      // Green
        'Knowledge': '#3B82F6',     // Blue
        'Education': '#8B5CF6',     // Purple
        'Vulnerable': '#EF4444',    // Red
        'Inclusion': '#EC4899',     // Pink
        'Geographic': '#F59E0B',    // Orange
        'Cultural': '#14B8A6',      // Teal
        'Accessibility': '#6366F1',  // Indigo
        'General': '#06B6D4',       // Cyan
        'Public': '#094EB2',        // Dark Blue
        'Social': '#F97316',        // Orange Red
        'Agriculture': '#84CC16',   // Lime
        'Health': '#DC2626',        // Rose
        'Finance': '#059669',       // Emerald
        'Other': '#9CA3AF'          // Gray
      }
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.beneficiariesData) {
      this.logger.warn('No beneficiariesData provided, showing empty state');
      this.data = null;
      return;
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

    // Handle no data gracefully
    if (!this.data || !this.data.labels || !this.data.datasets) {
      this.renderEmptyState();
      return;
    }

    const labels = this.data.labels || [];
    const values = this.data.datasets[0]?.data || [];

    // Assign colors based on beneficiary category
    const backgroundColors = labels.map(label => {
      const beneficiaryInfo = this.options.beneficiaryInfo?.[label];
      const category = beneficiaryInfo?.category || 'Other';
      const color = this.options.categoryColors[category] || '#06B6D4';
      return `${color}CC`; // 80% opacity
    });
    
    const borderColors = labels.map(label => {
      const beneficiaryInfo = this.options.beneficiaryInfo?.[label];
      const category = beneficiaryInfo?.category || 'Other';
      return this.options.categoryColors[category] || '#06B6D4';
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
          barPercentage: 0.7
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars for better label readability
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
                const beneficiaryInfo = this.options.beneficiaryInfo?.[label];
                
                if (beneficiaryInfo) {
                  return `${beneficiaryInfo.icon} ${label}`;
                }
                return label;
              },
              label: (context) => {
                return `${_('Documents')}: ${context.parsed.x}`;
              },
              afterLabel: (context) => {
                const label = context.label;
                const beneficiaryInfo = this.options.beneficiaryInfo?.[label];
                
                if (beneficiaryInfo?.description) {
                  return `\n💡 ${beneficiaryInfo.description}\n🏷️ ${_('Category')}: ${beneficiaryInfo.category}`;
                }
                return '';
              },
              footer: () => {
                return `\n🎁 ${_('Who benefits from cooperation')}`;
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
                size: 10,
                family: 'Poppins',
                weight: '500'
              },
              autoSkip: false,
              callback: function(value, index, values) {
                const label = this.getLabelForValue(value);
                // Acortar labels muy largos
                const maxLength = 22;
                if (label.length > maxLength) {
                  return label.substring(0, maxLength) + '...';
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
    this.logger.info('Beneficiaries Bar chart rendered', { beneficiaryGroups: labels.length });
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
        <p style="margin: 0; font-size: 14px;">No beneficiary data available</p>
        <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.7;">Data will appear once documents are analyzed</p>
      </div>
    `;
    this.logger.info('Beneficiaries chart showing empty state');
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

