/**
 * AnalysisChartsCoordinator
 * Coordinates all chart rendering for the analysis page
 * Refactored to use modular chart components
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';

// Chart Components
import { NetworkGraph } from '../components/charts/NetworkGraph.js';
import { SDGRadarChart } from '../components/charts/SDGRadarChart.js';
import { BindingDonutChart } from '../components/charts/BindingDonutChart.js';
import { CountriesBarChart } from '../components/charts/CountriesBarChart.js';
import { ThemesBarChart } from '../components/charts/ThemesBarChart.js';
import { ActorsBarChart } from '../components/charts/ActorsBarChart.js';
import { BeneficiariesBarChart } from '../components/charts/BeneficiariesBarChart.js';
import { TimelineChart } from '../components/charts/TimelineChart.js';

export class AnalysisChartsCoordinator {
  constructor(dataCoordinator, options = {}) {
    this.logger = logger.child({
      component: 'AnalysisChartsCoordinator'
    });
    
    this.dataCoordinator = dataCoordinator;
    this.options = {
      enableAnimations: true,
      animationDuration: 800,
      ...options
    };
    
    this.chartComponents = new Map();
    
    this.logger.debug('AnalysisChartsCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing AnalysisChartsCoordinator');
    
    try {
      // Wait for Chart.js to be available
      await this.waitForChartJS();
      
      // Initialize all charts
      await this.initializeAllCharts();
      
      this.logger.info('AnalysisChartsCoordinator initialized successfully', {
        chartsCount: this.chartComponents.size
      });
    } catch (error) {
      this.logger.error('Failed to initialize AnalysisChartsCoordinator', error);
      throw error;
    }
  }

  /**
   * Wait for Chart.js library to load
   */
  async waitForChartJS() {
    const maxAttempts = 50;
    let attempts = 0;
    
    while (typeof Chart === 'undefined' && attempts < maxAttempts) {
      this.logger.debug('Waiting for Chart.js...', { attempt: attempts + 1 });
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js library not loaded');
    }
    
    this.logger.debug('Chart.js library loaded');
  }

  /**
   * Initialize all charts using modular components
   */
  async initializeAllCharts() {
    const chartConfigs = [
      { 
        id: 'network-graph', 
        type: 'network',
        component: NetworkGraph,
        data: {
          actorData: this.dataCoordinator.getChartData('actors'),
          themeData: this.dataCoordinator.getChartData('themes'),
          coOccurrenceMatrix: this.dataCoordinator.getCoOccurrenceMatrix()
        }
      },
      { 
        id: 'sdg-chart', 
        type: 'radar',
        component: SDGRadarChart,
        data: {
          sdgData: this.dataCoordinator.getChartData('sdg'),
          sdgInfo: this.dataCoordinator.getSDGInfo()
        }
      },
      { 
        id: 'binding-chart', 
        type: 'donut',
        component: BindingDonutChart,
        data: {
          bindingData: this.dataCoordinator.getChartData('binding'),
          bindingInfo: this.dataCoordinator.getBindingInfo()
        }
      },
      { 
        id: 'countries-chart', 
        type: 'bar',
        component: CountriesBarChart,
        data: {
          countriesData: this.dataCoordinator.getChartData('lead_countries')
        }
      },
      { 
        id: 'themes-chart', 
        type: 'bar',
        component: ThemesBarChart,
        data: {
          themesData: this.dataCoordinator.getChartData('themes'),
          themeInfo: this.dataCoordinator.getThemeInfo()
        }
      },
      { 
        id: 'timeline-chart', 
        type: 'line',
        component: TimelineChart,
        data: {
          timelineData: this.dataCoordinator.getChartData('timeline')
        }
      },
      { 
        id: 'actors-chart', 
        type: 'bar',
        component: ActorsBarChart,
        data: {
          actorsData: this.dataCoordinator.getChartData('actors'),
          actorInfo: this.dataCoordinator.getActorInfo()
        }
      },
      { 
        id: 'beneficiaries-chart', 
        type: 'bar',
        component: BeneficiariesBarChart,
        data: {
          beneficiariesData: this.dataCoordinator.getChartData('beneficiaries'),
          beneficiaryInfo: this.dataCoordinator.getBeneficiaryInfo()
        }
      }
    ];
    
    for (const config of chartConfigs) {
      try {
        await this.renderChart(config);
        this.logger.debug('Chart rendered', { chartId: config.id, type: config.type });
      } catch (error) {
        this.logger.warn('Failed to render chart', { 
          chartId: config.id, 
          type: config.type,
          error: error.message 
        });
      }
    }

    // Qualitative indicators section (inline — simple enough without a component file)
    try {
      this.renderQualitativeCharts();
    } catch (error) {
      this.logger.warn('Failed to render qualitative charts', { error: error.message });
    }
  }

  /**
   * Render qualitative cooperation framework charts:
   *  - 3 KPI cards (total docs, scored docs, coverage %)
   *  - Horizontal bar chart  (avg score per indicator)
   *  - Radar chart           (avg score per analytical level)
   */
  renderQualitativeCharts() {
    const q = this.dataCoordinator.getChartData('qualitative');
    if (!q) {
      this.logger.warn('No qualitative data available');
      return;
    }

    const {
      stackedLabels, fullLabels, stackedDatasets,
      radarLabels, radarData, radarCategories,
      byIndicator, coverage,
    } = q;

    // ── KPI cards ─────────────────────────────────────────────────────────────
    const totalEl    = document.getElementById('qi-total-docs');
    const scoredEl   = document.getElementById('qi-scored-docs');
    const coverageEl = document.getElementById('qi-coverage-rate');

    if (totalEl)    totalEl.textContent    = coverage.total_documents.toLocaleString();
    if (scoredEl)   scoredEl.textContent   = coverage.scored_documents.toLocaleString();
    if (coverageEl) coverageEl.textContent = `${coverage.coverage_rate}%`;

    // ── Radar chart — PRIMARY (per level) ─────────────────────────────────────
    const radarCanvas = document.getElementById('qualitative-radar-chart');
    if (radarCanvas) {
      const hasRadarData = radarData.some(v => v > 0);

      // Colours per category (must match CSS + JS scoreToCategory)
      const catColor = (cat) => ({
        not_evident:     '#ef4444',
        partially:       '#f59e0b',
        clearly_evident: '#22c55e',
        central_focus:   '#7c3aed',
        pending:         '#9ca3af',
      }[cat ? cat.slug : 'pending'] || '#9ca3af');

      // Plain-language descriptions for each analytical level
      // Split into 2 short lines to avoid horizontal clipping inside the canvas
      const LEVEL_ORDER_RADAR = ['micro', 'meso', 'macro'];
      const LEVEL_DESCS = {
        micro: ['Institutions &', 'actor participation'],
        meso:  ['Stakeholder', 'collaboration'],
        macro: ['Regional alignment', '& lasting impact'],
      };

      new Chart(radarCanvas, {
        type: 'radar',
        data: {
          labels: radarLabels,
          datasets: [
            // Dashed reference ring at the "Clearly evident" threshold (60 = 0.60)
            {
              label: 'Clearly evident threshold',
              data: Array(radarLabels.length).fill(60),
              backgroundColor:  'transparent',
              borderColor:      'rgba(34,197,94,0.40)',
              borderWidth:      1.5,
              borderDash:       [6, 4],
              pointRadius:      0,
              pointHoverRadius: 0,
            },
            // Actual level data — coloured points per tier
            {
              label: 'Level score',
              data: radarData,
              backgroundColor:      'rgba(124, 58, 237, 0.13)',
              borderColor:          'rgba(124, 58, 237, 0.85)',
              borderWidth:          2.5,
              pointBackgroundColor: radarCategories.map(c => catColor(c)),
              pointBorderColor:     '#fff',
              pointBorderWidth:     2,
              pointRadius:          9,
              pointHoverRadius:     11,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          // Push the scale inward so point labels have room without hitting the canvas edge
          layout: {
            padding: { top: 50, left: 100, right: 100, bottom: 50 },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              // Only show tooltip for the real data dataset (index 1)
              filter: (item) => item.datasetIndex === 1,
              callbacks: {
                title: (items) => radarLabels[items[0].dataIndex],
                label: (item) => {
                  const cat = radarCategories[item.dataIndex];
                  return ` ${cat ? cat.label : '—'}`;
                },
              },
              displayColors: false,
            },
          },
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: {
                stepSize: 30,
                callback: (v) => {
                  if (v === 30) return 'Partially';
                  if (v === 60) return '✓ Clearly';
                  if (v === 90) return 'Central';
                  return '';
                },
                font: { size: 9 },
                color: (ctx) => ctx.tick.value === 60 ? '#16a34a' : '#9ca3af',
                backdropColor: 'transparent',
              },
              pointLabels: {
                // 4-line vertex: level name / desc line 1 / desc line 2 / tier badge
                callback: (label, index) => {
                  const levelKey = LEVEL_ORDER_RADAR[index] || '';
                  const desc = LEVEL_DESCS[levelKey] || [];
                  const cat  = radarCategories[index];
                  const tier = (cat && cat.icon && cat.label)
                    ? `${cat.icon} ${cat.label}`
                    : '—';
                  return [label, ...desc, tier];
                },
                // Colour each vertex by its tier
                color: radarCategories.map(c => catColor(c)),
                font: { size: 11, weight: 'bold' },
                padding: 12,
              },
              grid:       { color: 'rgba(0,0,0,0.07)' },
              angleLines: { color: 'rgba(0,0,0,0.07)' },
            },
          },
          animation: { duration: hasRadarData ? 900 : 0 },
        },
      });
      this.logger.debug('Qualitative radar chart rendered');
    }

    // ── Stacked tier distribution bar chart — SECONDARY ───────────────────────
    const stackedCanvas = document.getElementById('qualitative-bar-chart');
    if (stackedCanvas) {
      const maxCount = coverage.scored_documents || 1;
      const hasAnyData = stackedDatasets.some(ds => ds.data.some(v => v > 0));

      new Chart(stackedCanvas, {
        type: 'bar',
        data: {
          labels: stackedLabels,
          datasets: stackedDatasets,
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            // Legend above chart — shows the four tier names with their colours
            legend: {
              display: true,
              position: 'top',
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                borderRadius: 3,
                padding: 12,
                font: { size: 11 },
              },
            },
            tooltip: {
              callbacks: {
                title: (items) => fullLabels[items[0].dataIndex] || items[0].label,
                label: (item) => {
                  const count = item.raw;
                  const total = coverage.scored_documents || 0;
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                  // Show tier name + absolute count + relative %
                  return ` ${item.dataset.label}: ${count} doc${count !== 1 ? 's' : ''} (${pct}%)`;
                },
                afterBody: (items) => {
                  // Show avg score as context at the bottom of the tooltip
                  const ind = byIndicator[items[0].dataIndex];
                  if (!ind) return [];
                  const cat = this.dataCoordinator.constructor.scoreToCategory(ind.avg_score);
                  return [
                    '',
                    `Avg: ${ind.avg_score.toFixed(2)} → ${cat ? cat.label : '—'}`,
                    `Total scored: ${ind.scored_count} document${ind.scored_count !== 1 ? 's' : ''}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              min: 0,
              ticks: {
                stepSize: 1,
                precision: 0,
                callback: (v) => Number.isInteger(v) ? `${v} doc${v !== 1 ? 's' : ''}` : '',
                font: { size: 10 },
                color: '#6b7280',
              },
              grid: { color: 'rgba(0,0,0,0.04)' },
              title: {
                display: true,
                text: 'Number of documents',
                font: { size: 10 },
                color: '#9ca3af',
              },
            },
            y: {
              stacked: true,
              ticks: { font: { size: 11 } },
              grid:   { display: false },
            },
          },
          animation: { duration: hasAnyData ? 800 : 0 },
        },
      });
      this.logger.debug('Qualitative stacked distribution chart rendered');
    }
  }

  /**
   * Render a chart using its component class
   */
  async renderChart(config) {
    const element = DOMUtils.getElement(`#${config.id}`);
    
    if (!element) {
      this.logger.warn('Chart element not found', { chartId: config.id });
      return;
    }
    
    // Create chart component instance
    const chartComponent = new config.component(element, {
      ...config.data,
      ...this.options
    });

    // Initialize the chart
    await chartComponent.init();

    // Store the component
    this.chartComponents.set(config.id, chartComponent);
  }

  /**
   * Update a specific chart
   */
  async updateChart(chartId, newData) {
    const chartComponent = this.chartComponents.get(chartId);
    
    if (!chartComponent) {
      this.logger.warn('Chart not found for update', { chartId });
      return;
    }
    
    try {
      await chartComponent.updateData(newData);
      this.logger.debug('Chart updated', { chartId });
    } catch (error) {
      this.logger.error('Failed to update chart', { chartId, error });
    }
  }

  /**
   * Destroy all charts
   */
  destroy() {
    this.chartComponents.forEach((component, id) => {
      try {
        component.destroy();
        this.logger.debug('Chart destroyed', { chartId: id });
      } catch (error) {
        this.logger.warn('Error destroying chart', { chartId: id, error });
      }
    });
    
    this.chartComponents.clear();
    this.logger.info('All charts destroyed');
  }

  /**
   * Get a specific chart component
   */
  getChart(chartId) {
    return this.chartComponents.get(chartId);
  }

  /**
   * Get all chart components
   */
  getAllCharts() {
    return Array.from(this.chartComponents.values());
  }

  /**
   * Check if a chart exists
   */
  hasChart(chartId) {
    return this.chartComponents.has(chartId);
  }
}
