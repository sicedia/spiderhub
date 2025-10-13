/**
 * CabinetChartsCoordinator
 * Coordinates chart rendering for the Strategic Cabinet page
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';

export class CabinetChartsCoordinator {
  constructor(dataCoordinator, options = {}) {
    this.logger = logger.child({
      component: 'CabinetChartsCoordinator'
    });
    
    this.dataCoordinator = dataCoordinator;
    this.options = {
      enableAnimations: true,
      animationDuration: 800,
      ...options
    };
    
    // Chart instances
    this.charts = {
      trends: null,
      bindingDonut: null,
      typeDonut: null,
      topThemes: null,
      topActors: null
    };
    
    // Map instance (Leaflet)
    this.map = null;
    
    // Track if charts have been rendered
    this.hasRendered = false;
    
    this.logger.debug('CabinetChartsCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing CabinetChartsCoordinator');
    
    try {
      // Listen for data loaded events (but don't render immediately if already loaded to avoid duplication)
      eventBus.on(EVENTS.DATA_LOADED, async (data) => {
        // Only render if this is a fresh data load (not the initial one)
        if (this.hasRendered) {
          await this.renderAllCharts();
        }
      }, this);
      
      // Listen for filter changes
      eventBus.on('cabinet:filters_changed', async () => {
        await this.updateAllCharts();
      }, this);
      
      // Initial render if data is already loaded
      if (this.dataCoordinator.data.isLoaded) {
        await this.renderAllCharts();
        this.hasRendered = true;
      }
      
      this.logger.info('CabinetChartsCoordinator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize CabinetChartsCoordinator', error);
      throw error;
    }
  }

  /**
   * Render all charts
   */
  async renderAllCharts() {
    this.logger.debug('Rendering all charts');
    
    try {
      // Update KPIs
      this.updateKPIs();
      
      // Render charts
      await Promise.all([
        this.renderTrendsChart(),
        this.renderMap(),
        this.renderBindingDonut(),
        this.renderTypeDonut(),
        this.renderTopThemes(),
        this.renderTopActors()
      ]);
      
      this.logger.info('All charts rendered successfully');
      
    } catch (error) {
      this.logger.error('Failed to render charts', error);
    }
  }

  /**
   * Update all charts with new data
   */
  async updateAllCharts() {
    this.logger.debug('Updating all charts');
    
    // Reload data first
    await this.dataCoordinator.loadAllData();
    
    // Re-render charts
    await this.renderAllCharts();
  }

  /**
   * Update KPI cards using summary endpoint data
   */
  updateKPIs() {
    const summaryData = this.dataCoordinator.getSummaryData();
    
    if (!summaryData) {
      this.logger.warn('No summary data available for KPIs');
      return;
    }
    
    // Total documents (participación total: lead ∪ involved ∪ event)
    this.updateKPIValue('kpi-total-docs', summaryData.total_documents || 0);
    
    // Active partnerships (distinct partner countries)
    this.updateKPIValue('kpi-partnerships', summaryData.active_partnerships || 0);
    
    // Thematic areas (distinct themes)
    this.updateKPIValue('kpi-themes', summaryData.thematic_areas || 0);
    
    // Leadership initiatives (documents as lead_country)
    this.updateKPIValue('kpi-leadership', summaryData.leadership_initiatives || 0);
  }

  /**
   * Update KPI value with animation
   */
  updateKPIValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      // Simple fade animation
      element.style.opacity = '0.5';
      setTimeout(() => {
        element.textContent = value;
        element.style.opacity = '1';
      }, 200);
    }
  }

  /**
   * Render trends chart (area/line chart)
   */
  async renderTrendsChart() {
    const canvas = document.getElementById('trends-chart');
    if (!canvas) {
      this.logger.warn('Trends chart canvas not found');
      return;
    }
    
    const trendsData = this.dataCoordinator.getTrendsData();
    if (!trendsData) {
      this.logger.warn('No trends data available');
      return;
    }
    
    // Destroy existing chart
    if (this.charts.trends) {
      this.charts.trends.destroy();
    }
    
    // Prepare data for Chart.js
    const years = [...new Set(trendsData.trends_by_bindingness.map(d => d.year))].sort();
    const categories = [...new Set(trendsData.trends_by_bindingness.map(d => d.category))];
    
    const datasets = categories.map((category, index) => {
      const color = this.getCategoryColor(index);
      const data = years.map(year => {
        const item = trendsData.trends_by_bindingness.find(
          d => d.year === year && d.category === category
        );
        return item ? item.count : 0;
      });
      
      return {
        label: category,
        data: data,
        borderColor: color,
        backgroundColor: color.replace('1)', '0.2)'),
        fill: true,
        tension: 0.4
      };
    });
    
    const ctx = canvas.getContext('2d');
    this.charts.trends = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                size: 11,
                family: 'Roboto, sans-serif'
              },
              boxWidth: 12,
              padding: 15
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 10,
            titleFont: {
              size: 12
            },
            bodyFont: {
              size: 11
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              precision: 0,
              font: {
                size: 11
              }
            }
          }
        },
        animation: {
          duration: this.options.enableAnimations ? this.options.animationDuration : 0
        }
      }
    });
    
    this.logger.debug('Trends chart rendered');
  }

  /**
   * Render cooperation map (Leaflet)
   */
  async renderMap() {
    const mapContainer = document.getElementById('cooperation-map');
    if (!mapContainer) {
      this.logger.warn('Map container not found');
      return;
    }
    
    const mapData = this.dataCoordinator.getMapData();
    if (!mapData) {
      this.logger.warn('No map data available');
      return;
    }
    
    // Initialize map if not already done
    if (!this.map) {
      // Center on Atlantic to show both EU and LAC
      this.map = L.map('cooperation-map', {
        center: [20, -30],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10
      });
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(this.map);
    } else {
      // Clear existing markers
      this.map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          this.map.removeLayer(layer);
        }
      });
      
      // Re-center map
      this.map.setView([20, -30], 2);
    }
    
    // Add markers for cooperation countries
    if (mapData.cooperation && mapData.cooperation.length > 0) {
      const bounds = [];
      
      mapData.cooperation.forEach(country => {
        const coords = this.getCountryCoordinates(country.iso3);
        if (coords) {
          bounds.push(coords);
          
          const markerSize = this.getMarkerSize(country.count);
          const markerColor = this.getMarkerColor(country.count);
          
          L.circleMarker(coords, {
            radius: markerSize,
            fillColor: markerColor,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.75
          })
          .bindPopup(`
            <div style="text-align: center;">
              <strong style="font-size: 14px;">${country.name}</strong><br>
              <span style="font-size: 12px; color: #666;">${country.count} document${country.count !== 1 ? 's' : ''}</span>
            </div>
          `, {
            maxWidth: 200
          })
          .addTo(this.map);
        }
      });
      
      // Fit map to show all markers if we have bounds
      if (bounds.length > 0) {
        setTimeout(() => {
          this.map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 4
          });
        }, 100);
      }
    }
    
    this.logger.debug('Map rendered');
  }

  /**
   * Render binding donut chart
   */
  async renderBindingDonut() {
    const canvas = document.getElementById('binding-donut-chart');
    if (!canvas) {
      this.logger.warn('Binding donut chart canvas not found');
      return;
    }
    
    const mixData = this.dataCoordinator.getMixData();
    if (!mixData || !mixData.bindingness) {
      this.logger.warn('No binding data available');
      return;
    }
    
    // Destroy existing chart
    if (this.charts.bindingDonut) {
      this.charts.bindingDonut.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    this.charts.bindingDonut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: mixData.bindingness.map(d => d.label),
        datasets: [{
          data: mixData.bindingness.map(d => d.value),
          backgroundColor: [
            'rgba(28, 115, 119, 0.85)',
            'rgba(40, 167, 69, 0.85)',
            'rgba(251, 188, 4, 0.85)',
            'rgba(234, 67, 53, 0.85)'
          ],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 11,
                family: 'Roboto, sans-serif'
              },
              padding: 12,
              boxWidth: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 12
            },
            bodyFont: {
              size: 11
            }
          }
        },
        animation: {
          duration: this.options.enableAnimations ? this.options.animationDuration : 0
        }
      }
    });
    
    this.logger.debug('Binding donut chart rendered');
  }

  /**
   * Render document type donut chart
   */
  async renderTypeDonut() {
    const canvas = document.getElementById('type-donut-chart');
    if (!canvas) {
      this.logger.warn('Type donut chart canvas not found');
      return;
    }
    
    const mixData = this.dataCoordinator.getMixData();
    if (!mixData || !mixData.document_types) {
      this.logger.warn('No document type data available');
      return;
    }
    
    // Destroy existing chart
    if (this.charts.typeDonut) {
      this.charts.typeDonut.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    this.charts.typeDonut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: mixData.document_types.map(d => d.label),
        datasets: [{
          data: mixData.document_types.map(d => d.value),
          backgroundColor: [
            'rgba(234, 67, 53, 0.85)',
            'rgba(251, 188, 4, 0.85)',
            'rgba(40, 167, 69, 0.85)',
            'rgba(28, 115, 119, 0.85)',
            'rgba(156, 39, 176, 0.85)',
            'rgba(0, 188, 212, 0.85)',
            'rgba(255, 112, 67, 0.85)',
            'rgba(103, 58, 183, 0.85)'
          ],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 11,
                family: 'Roboto, sans-serif'
              },
              padding: 12,
              boxWidth: 12
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 12
            },
            bodyFont: {
              size: 11
            }
          }
        },
        animation: {
          duration: this.options.enableAnimations ? this.options.animationDuration : 0
        }
      }
    });
    
    this.logger.debug('Type donut chart rendered');
  }

  /**
   * Render top themes chart
   */
  async renderTopThemes() {
    const canvas = document.getElementById('top-themes-chart');
    if (!canvas) {
      this.logger.warn('Top themes chart canvas not found');
      return;
    }
    
    const topData = this.dataCoordinator.getTopData();
    if (!topData || !topData.themes) {
      this.logger.warn('No themes data available');
      return;
    }
    
    // Destroy existing chart
    if (this.charts.topThemes) {
      this.charts.topThemes.destroy();
    }
    
    // Limit to top 8 for better display
    const limitedThemes = topData.themes.slice(0, 8);
    
    const ctx = canvas.getContext('2d');
    this.charts.topThemes = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: limitedThemes.map(d => this.truncateLabel(d.label, 35)),
        datasets: [{
          label: 'Documents',
          data: limitedThemes.map(d => d.count),
          backgroundColor: 'rgba(74, 144, 226, 0.8)',
          borderColor: 'rgba(74, 144, 226, 1)',
          borderWidth: 1,
          borderRadius: 4
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
            callbacks: {
              title: (context) => {
                const index = context[0].dataIndex;
                return topData.themes[index].label;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            ticks: {
              font: {
                size: 11
              }
            },
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: this.options.enableAnimations ? this.options.animationDuration : 0
        }
      }
    });
    
    this.logger.debug('Top themes chart rendered');
  }

  /**
   * Render top actors chart
   */
  async renderTopActors() {
    const canvas = document.getElementById('top-actors-chart');
    if (!canvas) {
      this.logger.warn('Top actors chart canvas not found');
      return;
    }
    
    const topData = this.dataCoordinator.getTopData();
    if (!topData || !topData.actors) {
      this.logger.warn('No actors data available');
      return;
    }
    
    // Destroy existing chart
    if (this.charts.topActors) {
      this.charts.topActors.destroy();
    }
    
    // Limit to top 8 for better display
    const limitedActors = topData.actors.slice(0, 8);
    
    const ctx = canvas.getContext('2d');
    this.charts.topActors = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: limitedActors.map(d => this.truncateLabel(d.label, 35)),
        datasets: [{
          label: 'Documents',
          data: limitedActors.map(d => d.count),
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1,
          borderRadius: 4
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
            callbacks: {
              title: (context) => {
                const index = context[0].dataIndex;
                return topData.actors[index].label;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            ticks: {
              font: {
                size: 11
              }
            },
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: this.options.enableAnimations ? this.options.animationDuration : 0
        }
      }
    });
    
    this.logger.debug('Top actors chart rendered');
  }

  /**
   * Helper: Get category color
   */
  getCategoryColor(index) {
    const colors = [
      'rgba(9, 78, 178, 1)',
      'rgba(52, 168, 83, 1)',
      'rgba(251, 188, 4, 1)',
      'rgba(234, 67, 53, 1)',
      'rgba(156, 39, 176, 1)',
      'rgba(0, 188, 212, 1)'
    ];
    return colors[index % colors.length];
  }

  /**
   * Helper: Get country coordinates (expanded dataset)
   */
  getCountryCoordinates(iso3) {
    // Comprehensive coordinates mapping for all countries
    const coords = {
      // South America
      'ECU': [-1.8312, -78.1834],
      'BRA': [-14.2350, -51.9253],
      'ARG': [-38.4161, -63.6167],
      'COL': [4.5709, -74.2973],
      'CHL': [-35.6751, -71.5430],
      'PER': [-9.1900, -75.0152],
      'VEN': [6.4238, -66.5897],
      'BOL': [-16.2902, -63.5887],
      'PRY': [-23.4425, -58.4438],
      'URY': [-32.5228, -55.7658],
      'GUY': [4.8604, -58.9302],
      'SUR': [3.9193, -56.0278],
      // Central America & Caribbean
      'MEX': [23.6345, -102.5528],
      'GTM': [15.7835, -90.2308],
      'HND': [15.2000, -86.2419],
      'SLV': [13.7942, -88.8965],
      'NIC': [12.8654, -85.2072],
      'CRI': [9.7489, -83.7534],
      'PAN': [8.5380, -80.7821],
      'CUB': [21.5218, -77.7812],
      'DOM': [18.7357, -70.1627],
      'HTI': [18.9712, -72.2852],
      // Europe
      'ESP': [40.4637, -3.7492],
      'PRT': [39.3999, -8.2245],
      'FRA': [46.2276, 2.2137],
      'DEU': [51.1657, 10.4515],
      'ITA': [41.8719, 12.5674],
      'GBR': [55.3781, -3.4360],
      'NLD': [52.1326, 5.2913],
      'BEL': [50.5039, 4.4699],
      'POL': [51.9194, 19.1451],
      'AUT': [47.5162, 14.5501],
      'CHE': [46.8182, 8.2275],
      'SWE': [60.1282, 18.6435],
      'NOR': [60.4720, 8.4689],
      'FIN': [61.9241, 25.7482],
      'DNK': [56.2639, 9.5018],
      'GRC': [39.0742, 21.8243],
      'IRL': [53.4129, -8.2439],
      'CZE': [49.8175, 15.4730],
      'HUN': [47.1625, 19.5033],
      'ROU': [45.9432, 24.9668],
      'BGR': [42.7339, 25.4858],
      'HRV': [45.1, 15.2],
      'SVK': [48.669, 19.699],
      'SVN': [46.1512, 14.9955],
      'EST': [58.5953, 25.0136],
      'LVA': [56.8796, 24.6032],
      'LTU': [55.1694, 23.8813],
      'EUU': [50.8503, 4.3517], // Brussels
      // North America
      'USA': [37.0902, -95.7129],
      'CAN': [56.1304, -106.3468],
      // Asia
      'CHN': [35.8617, 104.1954],
      'IND': [20.5937, 78.9629],
      'JPN': [36.2048, 138.2529],
      'KOR': [35.9078, 127.7669],
      // Others
      'AUS': [-25.2744, 133.7751],
      'ZAF': [-30.5595, 22.9375],
      'RUS': [61.5240, 105.3188],
      'TUR': [38.9637, 35.2433]
    };
    return coords[iso3] || null;
  }

  /**
   * Helper: Get marker size based on count
   */
  getMarkerSize(count) {
    if (count >= 10) return 18;
    if (count >= 5) return 12;
    return 8;
  }

  /**
   * Helper: Get marker color based on count
   */
  getMarkerColor(count) {
    if (count >= 10) return '#1C7377'; // Primary teal
    if (count >= 5) return '#28A745';  // Success green
    return '#FBBC04';  // Warning yellow
  }

  /**
   * Helper: Truncate label
   */
  truncateLabel(label, maxLength) {
    return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying CabinetChartsCoordinator');
    
    // Destroy all charts
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    
    // Destroy map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    
    eventBus.offContext(this);
    this.charts = {};
    
    this.logger.debug('CabinetChartsCoordinator destroyed');
  }
}

export default CabinetChartsCoordinator;

