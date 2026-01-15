/**
 * Binding Donut Chart Component
 * Specialized donut chart for legal bindingness distribution
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';
import { gettext as _ } from '../../core/i18n/i18n.js';

export class BindingDonutChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.chart = null;
  }

  /**
   * Default options for binding donut charts
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      bindingData: null,
      bindingInfo: null,
      colors: {
        'legallyBinding': '#EA4335',      // Red - Strong binding
        'politicallyBinding': '#FBBC04',  // Yellow - Medium binding  
        'nonBinding': '#34A853',          // Green - Soft binding
        'uncategorised': '#9AA0A6'        // Gray - Undefined
      }
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.bindingData) {
      console.warn('[BindingDonutChart] No bindingData provided, showing empty state');
      this.data = null;
      return;
    }
    this.data = this.options.bindingData;
  }

  /**
   * Render binding donut chart using Chart.js
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
    if (!this.data || !this.data.labels) {
      this.renderEmptyState();
      return;
    }

    const labels = this.data.labels || [];
    const values = this.data.datasets[0].data || [];
    const keys = this.data.keys || labels; // Keys for mapping to bindingInfo
    
    // Prepare colors based on keys
    const backgroundColors = keys.map(key => 
      this.options.colors[key] || '#6c757d'
    );

    const config = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverBorderWidth: 3,
          hoverBorderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 12,
                family: 'Poppins',
                weight: '500'
              },
              color: '#1C7377'
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
                const index = item.dataIndex;
                const key = keys[index];
                const bindingInfo = this.options.bindingInfo?.[key];
                
                if (bindingInfo) {
                  return `${bindingInfo.icon} ${bindingInfo.name}`;
                }
                return item.label;
              },
              label: (context) => {
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${_('Documents')}: ${value} (${percentage}%)`;
              },
              afterLabel: (context) => {
                const index = context.dataIndex;
                const key = keys[index];
                const bindingInfo = this.options.bindingInfo?.[key];
                
                if (bindingInfo?.description) {
                  return `\n💡 ${bindingInfo.description}\n📊 ${_('Strength')}: ${bindingInfo.strength}`;
                }
                return '';
              },
              footer: () => {
                return `\n⚖️ ${_('Legal framework classification')}`;
              }
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeInOutQuart',
          animateRotate: true,
          animateScale: true
        }
      }
    };

    this.chart = new Chart(this.element, config);
    this.chartInstance = this.chart;
    
    eventBus.emit('chart:rendered', { chartId: this.element.id, type: 'donut' });
    this.logger.info('Binding Donut chart rendered', { categories: labels.length });
  }

  /**
   * Update chart with new data
   */
  async updateData(newData) {
    if (this.chart && newData) {
      this.chart.data.labels = newData.labels;
      this.chart.data.datasets[0].data = newData.datasets[0].data;
      
      // Update colors
      const backgroundColors = newData.labels.map(label => 
        this.options.colors[label] || '#6c757d'
      );
      this.chart.data.datasets[0].backgroundColor = backgroundColors;
      
      this.chart.update();
    }
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
        <p style="margin: 0; font-size: 14px;">No binding data available</p>
        <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.7;">Data will appear once documents are analyzed</p>
      </div>
    `;
    if (this.logger) {
      this.logger.info('Binding donut chart showing empty state');
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

