/**
 * Countries Bar Chart Component
 * Specialized horizontal bar chart for leading countries visualization
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';

export class CountriesBarChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.chart = null;
  }

  /**
   * Default options for countries bar chart
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      countriesData: null,
      countryNames: {},
      colors: {
        eu: '#094EB2',      // Blue for EU countries
        lac: '#34A853',     // Green for LAC countries
        other: '#9CA3AF'    // Gray for other countries
      },
      euCountries: ['ESP', 'DEU', 'FRA', 'ITA', 'NLD', 'BEL', 'AUT', 'POL', 'SWE', 'DNK', 
                    'FIN', 'PRT', 'GRC', 'IRL', 'CZE', 'HUN', 'ROU', 'SVK', 'HRV', 'BGR',
                    'LTU', 'SVN', 'LVA', 'EST', 'CYP', 'LUX', 'MLT'],
      lacCountries: ['ARG', 'BRA', 'CHL', 'COL', 'MEX', 'PER', 'URY', 'ECU', 'CRI', 'PAN',
                     'BOL', 'PRY', 'VEN', 'GTM', 'HND', 'SLV', 'NIC', 'DOM', 'CUB', 'HTI',
                     'JAM', 'TTO', 'BHS', 'BRB', 'GUY', 'SUR', 'BLZ'],
      maxCountries: 15
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.countriesData) {
      throw new Error('CountriesBarChart requires countriesData option');
    }
    this.data = this.options.countriesData;
    
    // Store country names mapping if provided
    if (this.data.countryNames) {
      this.countryNames = this.data.countryNames;
    } else {
      this.countryNames = {};
    }
  }

  /**
   * Render countries bar chart using Chart.js
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

    const iso3Codes = this.data.labels || [];
    const values = this.data.datasets[0].data || [];
    
    // Get full country names
    const labels = iso3Codes.map(iso3 => this.getCountryName(iso3));
    
    // Assign colors based on region
    const backgroundColors = iso3Codes.map(iso3 => {
      const color = this.getCountryColor(iso3);
      return `${color}CC`; // 80% opacity
    });
    
    const borderColors = iso3Codes.map(iso3 => this.getCountryColor(iso3));

    const config = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Documents Led',
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 6,
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
                const item = tooltipItems[0];
                const index = item.dataIndex;
                const iso3 = iso3Codes[index];
                const region = this.getCountryRegion(iso3);
                const flag = this.getRegionFlag(region);
                
                return `${flag} ${item.label}`;
              },
              label: (context) => {
                return `📄 Documents Led: ${context.parsed.x}`;
              },
              afterLabel: (context) => {
                const index = context.dataIndex;
                const iso3 = iso3Codes[index];
                const region = this.getCountryRegion(iso3);
                const regionName = region === 'EU' ? 'European Union' : 
                                  region === 'LAC' ? 'Latin America & Caribbean' : 
                                  'Other Region';
                
                return `\n🌍 Region: ${regionName}\n🏴 Code: ${iso3}`;
              },
              footer: () => {
                return '\n🌐 Countries leading digital cooperation initiatives';
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
            },
            title: {
              display: true,
              text: 'Number of Documents',
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
    this.logger.info('Countries Bar chart rendered', { countries: labels.length });
  }

  /**
   * Get country name from ISO3 code
   */
  getCountryName(iso3) {
    return this.countryNames[iso3] || iso3;
  }

  /**
   * Get country color based on region
   */
  getCountryColor(iso3) {
    if (this.options.euCountries.includes(iso3)) {
      return this.options.colors.eu;
    } else if (this.options.lacCountries.includes(iso3)) {
      return this.options.colors.lac;
    } else {
      return this.options.colors.other;
    }
  }

  /**
   * Get country region
   */
  getCountryRegion(iso3) {
    if (this.options.euCountries.includes(iso3)) {
      return 'EU';
    } else if (this.options.lacCountries.includes(iso3)) {
      return 'LAC';
    } else {
      return 'Other';
    }
  }

  /**
   * Get region flag emoji
   */
  getRegionFlag(region) {
    const flags = {
      'EU': '🇪🇺',
      'LAC': '🌎',
      'Other': '🌍'
    };
    return flags[region] || '🌍';
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

