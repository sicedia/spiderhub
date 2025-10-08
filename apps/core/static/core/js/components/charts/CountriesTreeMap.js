/**
 * Countries TreeMap Chart Component
 * Specialized treemap for leading countries visualization
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { eventBus } from '../../core/events/EventBus.js';

export class CountriesTreeMap extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.chart = null;
  }

  /**
   * Default options for countries treemap
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      countriesData: null,
      countryNames: {}, // Country ISO3 to name mapping
      colors: {
        eu: {
          base: '#094EB2',
          hover: '#0D5FD9'
        },
        lac: {
          base: '#34A853',
          hover: '#41C863'
        },
        other: {
          base: '#6c757d',
          hover: '#5a6268'
        }
      },
      euCountries: ['ESP', 'DEU', 'FRA', 'ITA', 'NLD', 'BEL', 'AUT', 'POL', 'SWE', 'DNK'],
      lacCountries: ['ARG', 'BRA', 'CHL', 'COL', 'MEX', 'PER', 'URY', 'ECU', 'CRI', 'PAN']
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.countriesData) {
      throw new Error('CountriesTreeMap requires countriesData option');
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
   * Render countries treemap using Chart.js treemap plugin
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

    // Check if TreemapController is available
    if (!Chart.registry.getController('treemap')) {
      this.logger.warn('Chart.js treemap plugin not loaded, falling back to bar chart');
      this.renderFallbackBarChart();
      return;
    }

    const treeData = this.prepareTreeMapData();
    
    // Store tree data for use in callbacks
    this.treeDataMap = new Map();
    treeData.forEach(item => {
      this.treeDataMap.set(item.iso3, item);
    });

    const config = {
      type: 'treemap',
      data: {
        datasets: [{
          tree: treeData,
          key: 'value',
          groups: ['region'],
          spacing: 1,
          borderWidth: 2,
          borderColor: 'white',
          backgroundColor: (ctx) => {
            if (!ctx.raw) return 'transparent';
            const iso3 = ctx.raw.iso3;
            
            if (this.options.euCountries.includes(iso3)) {
              return this.options.colors.eu.base;
            } else if (this.options.lacCountries.includes(iso3)) {
              return this.options.colors.lac.base;
            } else {
              return this.options.colors.other.base;
            }
          },
          hoverBackgroundColor: (ctx) => {
            if (!ctx.raw) return 'transparent';
            const iso3 = ctx.raw.iso3;
            
            if (this.options.euCountries.includes(iso3)) {
              return this.options.colors.eu.hover;
            } else if (this.options.lacCountries.includes(iso3)) {
              return this.options.colors.lac.hover;
            } else {
              return this.options.colors.other.hover;
            }
          },
          labels: {
            display: true,
            formatter: (ctx) => {
              if (!ctx.raw || !ctx.raw.g) return '';
              
              // Get ISO3 from the group label
              const iso3 = ctx.raw.g;
              const item = this.treeDataMap.get(iso3);
              
              if (!item) return '';
              
              // Only show label if the box is big enough
              const width = ctx.raw.w || 100;
              const height = ctx.raw.h || 100;
              if (width < 60 || height < 40) {
                return ''; // Hide label for small boxes
              }
              
              return [item.name, item.value];
            },
            color: ['white', 'rgba(255,255,255,0.8)'],
            font: [
              { size: 13, family: 'Poppins', weight: '700' },
              { size: 11, family: 'Poppins', weight: '500' }
            ],
            position: 'top',
            padding: 4
          }
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
            padding: 12,
            displayColors: false,
            callbacks: {
              title: (tooltipItems) => {
                const item = tooltipItems[0];
                const iso3 = item.raw.g; // Get ISO3 from group
                const data = this.treeDataMap.get(iso3);
                return data ? data.name : iso3;
              },
              label: (context) => {
                const iso3 = context.raw.g;
                const data = this.treeDataMap.get(iso3);
                
                if (!data) return 'No data';
                
                const region = data.region;
                const regionLabel = region === 'EU' ? '🇪🇺 EU' : region === 'LAC' ? '🌎 LAC' : '🌍 Other';
                
                return [
                  `Region: ${regionLabel}`,
                  `Documents: ${data.value}`
                ];
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(this.element, config);
    this.chartInstance = this.chart;
    
    eventBus.emit('chart:rendered', { chartId: this.element.id, type: 'treemap' });
    this.logger.info('Countries TreeMap rendered', { countries: treeData.length });
  }

  /**
   * Prepare data for treemap
   */
  prepareTreeMapData() {
    const labels = this.data.labels || [];
    const values = this.data.datasets[0].data || [];

    return labels.map((iso3, index) => {
      const region = this.options.euCountries.includes(iso3) 
        ? 'EU' 
        : this.options.lacCountries.includes(iso3) 
          ? 'LAC' 
          : 'Other';

      return {
        name: this.getCountryName(iso3),
        iso3: iso3,
        value: values[index],
        region: region
      };
    });
  }

  /**
   * Get country name from ISO3 code
   */
  getCountryName(iso3) {
    // Use provided country names or fallback to ISO3 code
    return this.countryNames[iso3] || iso3;
  }

  /**
   * Fallback to horizontal bar chart if treemap is not available
   */
  renderFallbackBarChart() {
    const labels = this.data.labels || [];
    const values = this.data.datasets[0].data || [];

    const config = {
      type: 'bar',
      data: {
        labels: labels.map(iso3 => this.getCountryName(iso3)),
        datasets: [{
          label: 'Documents',
          data: values,
          backgroundColor: '#094EB2',
          borderColor: '#034092',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    };

    this.chart = new Chart(this.element, config);
    this.chartInstance = this.chart;
    eventBus.emit('chart:rendered', { chartId: this.element.id, type: 'bar' });
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

