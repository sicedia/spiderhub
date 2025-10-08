/**
 * AnalysisDataCoordinator
 * Coordinates data loading and processing for the analysis page
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';

export class AnalysisDataCoordinator {
  constructor(options = {}) {
    this.logger = logger.child({
      component: 'AnalysisDataCoordinator'
    });
    
    this.options = {
      dataScriptId: 'analysis-data',
      ...options
    };
    
    this.data = {
      summary: null,
      analysis: null,
      isLoaded: false
    };
    
    this.logger.debug('AnalysisDataCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing AnalysisDataCoordinator');
    
    try {
      await this.loadData();
      this.logger.info('AnalysisDataCoordinator initialized successfully', {
        hasSummary: !!this.data.summary,
        hasAnalysis: !!this.data.analysis
      });
    } catch (error) {
      this.logger.error('Failed to initialize AnalysisDataCoordinator', error);
      throw error;
    }
  }

  /**
   * Load analysis data from page or API
   */
  async loadData() {
    try {
      this.logger.debug('Loading analysis data');
      
      // Try to load from page script tag first
      const dataFromPage = this.loadDataFromPage();
      
      if (dataFromPage) {
        // Django passes analysis_data directly as the root object
        // Check if it has summary as a separate key or if it's all chart data
        if (dataFromPage.summary && dataFromPage.analysis_data) {
          // New structure with separate summary
          this.data.summary = dataFromPage.summary;
          this.data.analysis = dataFromPage.analysis_data;
        } else {
          // Old structure - analysis_data is the root object
          // Extract summary from template context (it's in {{ summary }})
          this.data.summary = this.extractSummaryFromDOM();
          this.data.analysis = dataFromPage; // All data is chart data
        }
        
        this.data.isLoaded = true;
        
        this.logger.info('Analysis data loaded from page', {
          documentsCount: this.data.summary?.total_documents,
          chartsAvailable: Object.keys(this.data.analysis).length
        });
        
        // Emit data loaded event
        eventBus.emit(EVENTS.DATA_LOADED, {
          summary: this.data.summary,
          analysis: this.data.analysis
        });
        
        return;
      }
      
      // Fallback to mock data for development
      this.logger.warn('No data found, using mock data');
      this.loadMockData();
      
    } catch (error) {
      this.logger.error('Failed to load analysis data', error);
      this.loadMockData();
    }
  }
  
  /**
   * Extract summary data from DOM (from template variables)
   */
  extractSummaryFromDOM() {
    const kpiValues = document.querySelectorAll('.kpi-value[data-target]');
    const metricValues = document.querySelectorAll('.metric-value');
    
    const summary = {};
    
    // Extract from KPI cards
    if (kpiValues.length >= 4) {
      summary.total_documents = parseInt(kpiValues[0].getAttribute('data-target')) || 0;
      summary.total_agreements = parseInt(kpiValues[1].getAttribute('data-target')) || 0;
      summary.active_countries = parseInt(kpiValues[2].getAttribute('data-target')) || 0;
      summary.total_dialogues = parseInt(kpiValues[3].getAttribute('data-target')) || 0;
    }
    
    // Extract from metric cards
    if (metricValues.length >= 4) {
      summary.active_themes = parseInt(metricValues[0].textContent) || 0;
      summary.total_actors = parseInt(metricValues[1].textContent) || 0;
      summary.total_beneficiaries = parseInt(metricValues[2].textContent) || 0;
      summary.total_commitments = parseInt(metricValues[3].textContent) || 0;
    }
    
    this.logger.debug('Summary extracted from DOM', summary);
    return summary;
  }

  /**
   * Load data from page script tag
   */
  loadDataFromPage() {
    const dataScript = document.getElementById(this.options.dataScriptId);
    if (!dataScript) {
      this.logger.debug('Data script not found');
      return null;
    }
    
    try {
      const data = JSON.parse(dataScript.textContent);
      this.logger.debug('Data parsed from script tag', {
        keys: Object.keys(data)
      });
      return data;
    } catch (error) {
      this.logger.error('Failed to parse data from script tag', error);
      return null;
    }
  }

  /**
   * Load mock data for development/fallback
   */
  loadMockData() {
    this.data.summary = {
      total_documents: 1247,
      active_countries: 89,
      total_agreements: 156,
      total_dialogues: 91,
      active_themes: 15,
      total_actors: 240,
      total_beneficiaries: 12,
      total_commitments: 450
    };
    
    this.data.analysis = {
      sdg_counts: {
        'SDG 1': 45, 'SDG 4': 89, 'SDG 8': 124, 'SDG 9': 156,
        'SDG 10': 67, 'SDG 13': 98, 'SDG 16': 112, 'SDG 17': 178
      },
      binding_counts: {
        'Legally Binding': 45,
        'Politically Binding': 78,
        'Non-Binding': 32
      },
      country_counts: {
        'ESP': 45, 'DEU': 38, 'FRA': 35, 'ITA': 28, 'BRA': 52,
        'ARG': 41, 'MEX': 38, 'COL': 34, 'CHL': 29, 'PER': 24
      },
      theme_counts: {
        'Digital Economy': 156,
        'AI & Emerging Tech': 134,
        'Cybersecurity': 98,
        'Digital Skills': 87,
        'E-Government': 76,
        'Digital Infrastructure': 65,
        'Data Governance': 54
      },
      actor_counts: {
        'Government': 120,
        'Private Sector': 85,
        'Academia': 67,
        'Civil Society': 43,
        'International Org': 28
      },
      beneficiary_counts: {
        'SMEs': 156,
        'Citizens': 234,
        'Researchers': 98,
        'Startups': 76,
        'Students': 145,
        'Public Sector': 89
      }
    };
    
    this.data.isLoaded = true;
    
    eventBus.emit(EVENTS.DATA_LOADED, {
      summary: this.data.summary,
      analysis: this.data.analysis,
      isMock: true
    });
  }

  /**
   * Get data formatted for specific chart
   */
  getChartData(chartType) {
    if (!this.data.isLoaded) {
      this.logger.warn('Data not loaded yet');
      return null;
    }
    
    switch (chartType) {
      case 'sdg':
        return this.formatSDGData();
      case 'binding':
        return this.formatBindingData();
      case 'countries':
        return this.formatCountriesData();
      case 'lead_countries':
        return this.formatLeadCountriesData();
      case 'themes':
        return this.formatThemesData();
      case 'actors':
        return this.formatActorsData();
      case 'beneficiaries':
        return this.formatBeneficiariesData();
      default:
        this.logger.warn('Unknown chart type', { chartType });
        return null;
    }
  }

  /**
   * Format SDG data for chart
   */
  formatSDGData() {
    const sdgCounts = this.data.analysis.sdg_counts || {};
    return {
      labels: Object.keys(sdgCounts),
      datasets: [{
        label: 'Documents',
        data: Object.values(sdgCounts),
        backgroundColor: 'rgba(9, 78, 178, 0.8)',
        borderColor: 'rgba(9, 78, 178, 1)',
        borderWidth: 1
      }]
    };
  }

  /**
   * Format binding data for chart
   */
  formatBindingData() {
    const bindingCounts = this.data.analysis.binding_counts || {};
    return {
      labels: Object.keys(bindingCounts),
      datasets: [{
        data: Object.values(bindingCounts),
        backgroundColor: [
          'rgba(52, 168, 83, 0.8)',   // Green - Legally Binding
          'rgba(251, 188, 4, 0.8)',    // Yellow - Politically Binding
          'rgba(234, 67, 53, 0.8)'     // Red - Non-Binding
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }

  /**
   * Format countries data for chart (Top 10)
   */
  formatCountriesData() {
    const countryCounts = this.data.analysis.country_counts || {};
    
    // Sort and get top 10
    const sorted = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      labels: sorted.map(([country]) => country),
      datasets: [{
        label: 'Documents',
        data: sorted.map(([, count]) => count),
        backgroundColor: 'rgba(9, 78, 178, 0.7)',
        borderColor: 'rgba(9, 78, 178, 1)',
        borderWidth: 1
      }]
    };
  }

  /**
   * Format lead countries data for chart (Top 10) - Uses ISO3 codes
   */
  formatLeadCountriesData() {
    const leadCountryCounts = this.data.analysis.lead_country_counts || {};
    const countryNames = this.data.analysis.country_names || {};
    
    // Sort and get top 10
    const sorted = Object.entries(leadCountryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      labels: sorted.map(([iso3]) => iso3),
      countryNames: countryNames, // Include full country names mapping
      datasets: [{
        label: 'Documents Led',
        data: sorted.map(([, count]) => count),
        backgroundColor: 'rgba(9, 78, 178, 0.7)',
        borderColor: 'rgba(9, 78, 178, 1)',
        borderWidth: 1
      }]
    };
  }

  /**
   * Format themes data for chart (Top 10)
   */
  formatThemesData() {
    const themeCounts = this.data.analysis.theme_counts || {};
    
    // Sort and get top 10
    const sorted = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      labels: sorted.map(([theme]) => theme),
      datasets: [{
        label: 'Documents',
        data: sorted.map(([, count]) => count),
        backgroundColor: 'rgba(156, 39, 176, 0.7)',
        borderColor: 'rgba(156, 39, 176, 1)',
        borderWidth: 1
      }]
    };
  }

  /**
   * Format actors data for chart
   */
  formatActorsData() {
    const actorCounts = this.data.analysis.actor_counts || {};
    return {
      labels: Object.keys(actorCounts),
      datasets: [{
        label: 'Participation',
        data: Object.values(actorCounts),
        backgroundColor: [
          'rgba(9, 78, 178, 0.8)',
          'rgba(52, 168, 83, 0.8)',
          'rgba(251, 188, 4, 0.8)',
          'rgba(234, 67, 53, 0.8)',
          'rgba(156, 39, 176, 0.8)'
        ],
        borderWidth: 1,
        borderColor: '#fff'
      }]
    };
  }

  /**
   * Format beneficiaries data for chart
   */
  formatBeneficiariesData() {
    const beneficiaryCounts = this.data.analysis.beneficiary_counts || {};
    return {
      labels: Object.keys(beneficiaryCounts),
      datasets: [{
        label: 'Benefited',
        data: Object.values(beneficiaryCounts),
        backgroundColor: 'rgba(0, 188, 212, 0.7)',
        borderColor: 'rgba(0, 188, 212, 1)',
        borderWidth: 1
      }]
    };
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    return this.data.summary;
  }

  /**
   * Get raw analysis data
   */
  getAnalysisData() {
    return this.data.analysis;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying AnalysisDataCoordinator');
    eventBus.offContext(this);
    this.data = null;
    this.logger.debug('AnalysisDataCoordinator destroyed');
  }
}

export default AnalysisDataCoordinator;

