/**
 * SDG Radar Chart Component
 * Specialized radar chart for Sustainable Development Goals visualization
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';
import { gettext } from '../../core/i18n/i18n.js';

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
      console.warn('[SDGRadarChart] No sdgData provided, showing empty state');
      this.data = null;
      return;
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

    // Handle no data gracefully
    if (!this.data || !this.data.labels) {
      this.renderEmptyState();
      return;
    }

    const labels = this.data.labels || [];
    const datasets = this.data.datasets || [];

    // For dual normalized datasets, max is always 100%
    const maxValue = 100;

    const config = {
      type: 'radar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: this.options.colors.text,
              font: {
                size: 11,
                family: 'Poppins'
              },
              padding: 12,
              usePointStyle: true
            }
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
                const datasetLabel = context.dataset.label;
                const dataIndex = context.dataIndex;
                const rawData = context.dataset.rawData || [];
                const absoluteValue = rawData[dataIndex] || 0;
                const displayValue = context.parsed.r; // Normalized/converted value shown on chart
                
                if (datasetLabel === 'Document Count') {
                  return `📄 ${gettext('Documents')}: ${absoluteValue} (${displayValue.toFixed(1)}% ${gettext('of max')})`;
                } else if (datasetLabel === 'Avg Intensity') {
                  // Show as absolute percentage (0-1 scale)
                  return `⭐ ${gettext('Avg Intensity')}: ${absoluteValue.toFixed(3)} (${(absoluteValue * 100).toFixed(1)}%)`;
                }
                return `${datasetLabel}: ${absoluteValue}`;
              },
              afterLabel: (context) => {
                const label = context.label; // e.g., "SDG 1"
                const number = label.match(/\d+/)?.[0] || '';
                const sdgKey = `sdg${number}`; // Convert to 'sdg1'
                const sdgInfo = this.options.sdgInfo?.[sdgKey];
                
                if (sdgInfo?.description) {
                  return `\n💡 ${gettext('About this SDG')}:\n   ${sdgInfo.description}`;
                }
                return '';
              },
              footer: (tooltipItems) => {
                return `\n✨ ${gettext("Part of UN's 2030 Agenda for Sustainable Development")}`;
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
              stepSize: 20,
              color: this.options.colors.text,
              backdropColor: 'transparent',
              font: {
                size: 10,
                family: 'Poppins'
              },
              callback: function(value) {
                return value + '%';
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
    this.logger.info('SDG Radar chart rendered', { 
      sdgs: labels.length,
      datasets: datasets.length 
    });
  }

  /**
   * Update chart with new data
   */
  async updateData(newData) {
    if (this.chart && newData) {
      this.chart.data.labels = newData.labels;
      this.chart.data.datasets = newData.datasets;
      
      // For normalized dual datasets, max is always 100%
      this.chart.options.scales.r.max = 100;
      this.chart.options.scales.r.ticks.stepSize = 20;
      
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
        <p style="margin: 0; font-size: 14px;">No SDG data available</p>
        <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.7;">Data will appear once documents are analyzed</p>
      </div>
    `;
    if (this.logger) {
      this.logger.info('SDG Radar chart showing empty state');
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

