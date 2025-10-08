/**
 * Binding Donut Chart Component
 * Specialized donut chart for legal bindingness distribution
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';

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
      colors: {
        'Non-Binding': '#34A853',
        'Binding': '#EA4335',
        'Undefined': '#FBBC04'
      }
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.bindingData) {
      throw new Error('BindingDonutChart requires bindingData option');
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

    const labels = this.data.labels || [];
    const values = this.data.datasets[0].data || [];
    
    // Prepare colors based on labels
    const backgroundColors = labels.map(label => 
      this.options.colors[label] || '#6c757d'
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
            padding: 12,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
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

