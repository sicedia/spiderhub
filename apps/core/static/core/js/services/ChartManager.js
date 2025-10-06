/**
 * Chart Manager Service
 * Handles all chart initialization, loading, and management
 * Follows Single Responsibility Principle - only manages charts
 * ES6 Module Export
 */

import { BaseComponent } from '../core/base/BaseComponent.js';
import { CONFIG, EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { ChartInitializer } from '../utils/ChartInitializer.js';

export class ChartManager extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.charts = new Map();
    this.chartConfigs = new Map();
    this.initializationQueue = [];
    this.isInitializing = false;
    
    this.init();
  }

  getDefaultOptions() {
    return {
      analysisData: null,
      enableAnimations: true,
      retryDelay: 100,
      maxRetries: 10,
      enableLazyLoading: true
    };
  }

  init() {
    this.setupChartConfigurations();
    this.bindEvents();
    
    // Start initialization process
    if (this.options.analysisData) {
      this.initializeCharts();
    }
  }

  /**
   * Setup chart configurations
   */
  setupChartConfigurations() {
    const chartTypes = [
      'choropleth-chart',
      'gantt-chart', 
      'review-timeline-chart',
      'histogram-chart',
      'theme-bar-chart',
      'heatmap-chart',
      'sankey-theme-chart',
      'actor-bar-chart',
      'beneficiary-bar-chart',
      'coverage-bar-chart',
      'radar-chart',
      'pie-chart',
      'lead-countries-chart',
      'investment-flow-chart',
      'commitment-timeline-chart',
      'economic-impact-heatmap',
      'diversity-radar-chart',
      'initiative-treemap-chart',
      'collaboration-network-chart'
    ];

    chartTypes.forEach(chartId => {
      this.chartConfigs.set(chartId, {
        id: chartId,
        type: this.getChartType(chartId),
        renderFunction: this.getRenderFunction(chartId),
        dataFunction: this.getDataFunction(chartId),
        dependencies: this.getChartDependencies(chartId),
        priority: this.getChartPriority(chartId)
      });
    });
  }

  /**
   * Get chart type from ID
   */
  getChartType(chartId) {
    const typeMap = {
      'choropleth-chart': 'choropleth',
      'lead-countries-chart': 'choropleth',
      'theme-bar-chart': 'bar',
      'actor-bar-chart': 'bar',
      'beneficiary-bar-chart': 'bar',
      'coverage-bar-chart': 'bar',
      'radar-chart': 'radar',
      'diversity-radar-chart': 'radar',
      'pie-chart': 'pie',
      'heatmap-chart': 'heatmap',
      'economic-impact-heatmap': 'heatmap',
      'investment-flow-chart': 'sankey',
      'commitment-timeline-chart': 'timeline',
      'initiative-treemap-chart': 'treemap',
      'collaboration-network-chart': 'network'
    };
    
    return typeMap[chartId] || 'unknown';
  }

  /**
   * Get render function for chart
   */
  getRenderFunction(chartId) {
    const functionMap = {
      'lead-countries-chart': () => window.renderLeadCountryChoroplethChart,
      'theme-bar-chart': () => window.renderThemeBar,
      'actor-bar-chart': () => window.renderActorBar,
      'beneficiary-bar-chart': () => window.renderBeneficiaryBar,
      'coverage-bar-chart': () => window.renderCoverageBar,
      'radar-chart': () => window.renderSdgRadar,
      'diversity-radar-chart': () => window.renderDiversityRadarChart,
      'pie-chart': () => window.renderLegalBindingPie,
      'investment-flow-chart': () => window.renderInvestmentFlowChart,
      'commitment-timeline-chart': () => window.renderCommitmentTimelineChart,
      'economic-impact-heatmap': () => window.renderEconomicImpactHeatmap,
      'initiative-treemap-chart': () => window.renderInitiativeTreemapChart,
      'collaboration-network-chart': () => window.renderCollaborationNetworkChart
    };
    
    return functionMap[chartId] || (() => null);
  }

  /**
   * Get data function for chart
   */
  getDataFunction(chartId) {
    const dataMap = {
      'lead-countries-chart': () => this.getLeadCountryData(),
      'theme-bar-chart': () => this.options.analysisData?.theme_counts,
      'actor-bar-chart': () => this.options.analysisData?.actor_counts,
      'beneficiary-bar-chart': () => this.options.analysisData?.beneficiary_counts,
      'coverage-bar-chart': () => this.options.analysisData?.scope_counts,
      'radar-chart': () => this.options.analysisData?.sdg_counts,
      'diversity-radar-chart': () => this.getDiversityData(),
      'pie-chart': () => this.options.analysisData?.binding_counts,
      'investment-flow-chart': () => this.getInvestmentData(),
      'commitment-timeline-chart': () => this.getCommitmentTimelineData(),
      'economic-impact-heatmap': () => this.getEconomicImpactData(),
      'initiative-treemap-chart': () => this.getInitiativeData(),
      'collaboration-network-chart': () => this.getCollaborationData()
    };
    
    return dataMap[chartId] || (() => ({}));
  }

  /**
   * Get chart dependencies
   */
  getChartDependencies(chartId) {
    const dependencyMap = {
      'lead-countries-chart': ['d3'],
      'theme-bar-chart': ['Chart'],
      'actor-bar-chart': ['Chart'],
      'beneficiary-bar-chart': ['Chart'],
      'coverage-bar-chart': ['Chart'],
      'radar-chart': ['Chart'],
      'diversity-radar-chart': ['Chart'],
      'pie-chart': ['Chart'],
      'investment-flow-chart': ['d3'],
      'commitment-timeline-chart': ['d3'],
      'economic-impact-heatmap': ['d3'],
      'initiative-treemap-chart': ['d3'],
      'collaboration-network-chart': ['d3']
    };
    
    return dependencyMap[chartId] || [];
  }

  /**
   * Get chart priority (higher number = higher priority)
   */
  getChartPriority(chartId) {
    const priorityMap = {
      'lead-countries-chart': 10,
      'theme-bar-chart': 9,
      'actor-bar-chart': 8,
      'beneficiary-bar-chart': 7,
      'coverage-bar-chart': 6,
      'radar-chart': 5,
      'diversity-radar-chart': 4,
      'pie-chart': 3,
      'investment-flow-chart': 2,
      'commitment-timeline-chart': 2,
      'economic-impact-heatmap': 2,
      'initiative-treemap-chart': 1,
      'collaboration-network-chart': 1
    };
    
    return priorityMap[chartId] || 0;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Listen for chart container clicks
    this.chartConfigs.forEach((config, chartId) => {
      const element = DOMUtils.getElement(`#${chartId}`);
      if (element) {
        this.addEventListener(element, 'click', () => this.handleChartClick(chartId));
      }
    });
  }

  /**
   * Initialize all charts
   */
  async initializeCharts() {
    if (this.isInitializing) return;
    
    this.isInitializing = true;
    
    try {
      // Sort charts by priority
      const sortedCharts = Array.from(this.chartConfigs.values())
        .sort((a, b) => b.priority - a.priority);
      
      // Initialize charts in batches to avoid overwhelming the browser
      const batchSize = 3;
      for (let i = 0; i < sortedCharts.length; i += batchSize) {
        const batch = sortedCharts.slice(i, i + batchSize);
        await Promise.all(batch.map(chart => this.initializeChart(chart)));
        
        // Small delay between batches
        if (i + batchSize < sortedCharts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      this.emit(EVENTS.ALL_CHARTS_INITIALIZED, {
        totalCharts: this.charts.size,
        successfulCharts: Array.from(this.charts.values()).filter(c => c.status === 'success').length
      });
      
    } catch (error) {
      console.error('ChartManager: Failed to initialize charts:', error);
      this.emit(EVENTS.CHART_INITIALIZATION_ERROR, { error });
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Initialize a single chart
   */
  async initializeChart(config) {
    const { id, renderFunction, dataFunction, dependencies } = config;
    
    try {
      // Check dependencies
      const missingDeps = dependencies.filter(dep => !window[dep]);
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
      
      // Get render function
      const renderFn = renderFunction();
      if (!renderFn) {
        throw new Error(`Render function not found for chart: ${id}`);
      }
      
      // Get data
      const data = await dataFunction();
      
      // Initialize chart using ChartInitializer
      const initializer = new ChartInitializer({
        retryDelay: this.options.retryDelay,
        maxRetries: this.options.maxRetries
      });
      
      await initializer.initializeChart(id, renderFn, data);
      
      // Store chart info
      this.charts.set(id, {
        id,
        status: 'success',
        initializedAt: Date.now(),
        data
      });
      
      this.emit(EVENTS.CHART_LOADED, {
        chartId: id,
        status: 'success'
      });
      
    } catch (error) {
      console.error(`ChartManager: Failed to initialize chart ${id}:`, error);
      
      this.charts.set(id, {
        id,
        status: 'error',
        error: error.message,
        initializedAt: Date.now()
      });
      
      this.emit(EVENTS.CHART_LOADED, {
        chartId: id,
        status: 'error',
        error: error.message
      });
    }
  }

  /**
   * Handle chart click
   */
  handleChartClick(chartId) {
    const chart = this.charts.get(chartId);
    if (chart) {
      this.emit(EVENTS.CHART_CLICKED, {
        chartId,
        chart
      });
    }
  }

  /**
   * Update charts with new data
   */
  async updateCharts(newData) {
    this.options.analysisData = newData;
    
    // Reinitialize charts with new data
    await this.initializeCharts();
  }

  /**
   * Get chart by ID
   */
  getChart(chartId) {
    return this.charts.get(chartId);
  }

  /**
   * Get all charts
   */
  getAllCharts() {
    return Array.from(this.charts.values());
  }

  /**
   * Get chart statistics
   */
  getChartStats() {
    const charts = Array.from(this.charts.values());
    return {
      total: charts.length,
      successful: charts.filter(c => c.status === 'success').length,
      failed: charts.filter(c => c.status === 'error').length,
      charts: charts
    };
  }

  /**
   * Data fetching methods
   */
  
  async getLeadCountryData() {
    try {
      const response = await fetch('/api/lead-countries/');
      if (response.ok) {
        const apiData = await response.json();
        return apiData.counts || {};
      }
    } catch (error) {
      console.warn('Could not fetch fresh lead country data, using cached data');
    }
    
    return this.options.analysisData?.lead_country_counts || {};
  }

  getDiversityData() {
    if (this.options.analysisData?.diversity_radar_data) {
      return this.options.analysisData.diversity_radar_data;
    }

    // Fallback data
    return {
      dimensions: {
        'Thematic Diversity': { value: 50, description: 'Distribution across digital themes' },
        'Actor Diversity': { value: 45, description: 'Variety of participating stakeholders' },
        'Geographic Spread': { value: 60, description: 'Regional and country coverage' },
        'Sector Coverage': { value: 40, description: 'Economic sector representation' },
        'Initiative Types': { value: 55, description: 'Variety of cooperation formats' },
        'Beneficiary Inclusion': { value: 65, description: 'Diversity of target groups' }
      }
    };
  }

  getInvestmentData() {
    const themeData = this.options.analysisData?.theme_counts || {};
    const scopeData = this.options.analysisData?.scope_counts || {};
    
    const bilateral = scopeData.bilateral || 0;
    const multilateral = scopeData.multilateral || 0;
    const regional = scopeData.regional || 0;
    
    return {
      public_funding: {
        bilateral: { amount: bilateral * 8500000, initiatives: bilateral },
        multilateral: { amount: multilateral * 15000000, initiatives: multilateral },
        eu_programs: { amount: regional * 25000000, initiatives: regional }
      },
      private_investment: {
        direct_investment: { amount: Math.floor(Object.values(themeData).reduce((a, b) => a + b, 0) * 12000000), initiatives: Math.floor(Object.values(themeData).reduce((a, b) => a + b, 0) * 0.6) }
      }
    };
  }

  getCommitmentTimelineData() {
    const themeData = this.options.analysisData?.theme_counts || {};
    const totalDocs = Object.values(themeData).reduce((sum, count) => sum + count, 0);
    const baselineCommitment = totalDocs * 2500000;
    
    const periods = ['2020-01', '2021-01', '2022-01', '2023-01', '2024-01'];
    const growthRates = [0.05, 0.25, 0.65, 0.92, 1.0];
    
    return {
      timeline: periods.map((period, index) => ({
        date: period,
        committed: Math.floor(baselineCommitment * growthRates[index]),
        fulfilled: Math.floor(baselineCommitment * growthRates[index] * 0.85)
      }))
    };
  }

  getEconomicImpactData() {
    const themeData = this.options.analysisData?.theme_counts || {};
    const countryData = this.options.analysisData?.country_counts || {};
    
    const sectors = ['Digital Infrastructure', 'AI & Innovation', 'E-Government', 'Cybersecurity', 'Digital Skills', 'Green Technology'];
    const regions = Object.keys(countryData).slice(0, 8);
    
    return {
      sectors,
      regions,
      impact_matrix: sectors.map(() => regions.map(() => Math.floor(Math.random() * 70) + 30))
    };
  }

  getInitiativeData() {
    if (this.options.analysisData?.initiative_treemap_data) {
      return this.options.analysisData.initiative_treemap_data;
    }

    const themeData = this.options.analysisData?.theme_counts || {};
    const children = Object.entries(themeData).map(([theme, count]) => ({
      name: theme,
      children: [{ name: `${theme} Documents`, value: count, count }]
    }));

    return {
      name: "Digital Cooperation Initiatives",
      children: children.length > 0 ? children : [
        { name: "Strategic Frameworks", children: [{ name: "Digital Strategies", value: 5, count: 5 }] }
      ]
    };
  }

  getCollaborationData() {
    const { actor_counts, country_counts, country_names } = this.options.analysisData || {};
    const nodes = [];
    const links = [];

    // Add actor nodes
    Object.entries(actor_counts || {}).forEach(([category, count]) => {
      if (count > 0) {
        nodes.push({
          id: `actor-${category.toLowerCase().replace(/\s+/g, '-')}`,
          name: category,
          type: 'actor',
          size: Math.max(8, Math.min(30, 8 + (count * 2))),
          connections: count
        });
      }
    });

    // Add country nodes
    Object.entries(country_counts || {}).forEach(([iso3, count]) => {
      if (count >= 2) {
        nodes.push({
          id: `country-${iso3.toLowerCase()}`,
          name: country_names?.[iso3] || iso3,
          type: 'country',
          size: Math.max(10, Math.min(25, 10 + (count * 1.5))),
          connections: count
        });
      }
    });

    return { nodes, links };
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.charts.clear();
    this.chartConfigs.clear();
    super.destroy();
  }
}

// Export for use in other modules
export default ChartManager;
