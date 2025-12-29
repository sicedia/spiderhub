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
   * Load analysis data from API
   */
  async loadData() {
    try {
      this.logger.debug('Loading analysis data from API');
      
      // Fetch all analysis data from API endpoints in parallel
      const [summary, sdgs, themes, actors, beneficiaries, timeline, diversity, network] = await Promise.all([
        fetch('/api/v1/analysis/summary/').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/v1/analysis/sdgs/').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/v1/analysis/themes/').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/v1/analysis/actors/').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/v1/analysis/beneficiaries/').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/v1/analysis/timeline/').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/v1/analysis/diversity/').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/v1/analysis/network/').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      
      // Combine all data
      this.data.summary = summary || {};
      this.data.analysis = {
        ...sdgs,
        ...themes,
        ...actors,
        ...beneficiaries,
        timeline_data: timeline,
        diversity_radar_data: diversity,
        ...network,
      };
      
      this.data.isLoaded = true;
      
      this.logger.info('Analysis data loaded from API', {
        documentsCount: this.data.summary?.total_documents,
        chartsAvailable: Object.keys(this.data.analysis).length
      });
      
      // Emit data loaded event
      eventBus.emit(EVENTS.DATA_LOADED, {
        summary: this.data.summary,
        analysis: this.data.analysis
      });
      
    } catch (error) {
      this.logger.error('Failed to load analysis data from API', error);
      
      // Fallback: Try to load from page script tag (backwards compatibility)
      const dataFromPage = this.loadDataFromPage();
      if (dataFromPage) {
        if (dataFromPage.summary && dataFromPage.analysis_data) {
          this.data.summary = dataFromPage.summary;
          this.data.analysis = dataFromPage.analysis_data;
        } else {
          this.data.summary = this.extractSummaryFromDOM();
          this.data.analysis = dataFromPage;
        }
        this.data.isLoaded = true;
        eventBus.emit(EVENTS.DATA_LOADED, {
          summary: this.data.summary,
          analysis: this.data.analysis
        });
        return;
      }
      
      // Final fallback to mock data
      this.logger.warn('No data found, using mock data');
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
        'sdg1': 45, 'sdg4': 89, 'sdg5': 67, 'sdg8': 124, 'sdg9': 156,
        'sdg10': 67, 'sdg11': 78, 'sdg13': 98, 'sdg16': 112, 'sdg17': 178
      },
      sdg_avg_relevance: {
        'sdg1': 0.67, 'sdg4': 0.85, 'sdg5': 0.73, 'sdg8': 0.91, 'sdg9': 0.95,
        'sdg10': 0.78, 'sdg11': 0.82, 'sdg13': 0.88, 'sdg16': 0.79, 'sdg17': 0.93
      },
      sdg_info: {
        'sdg1': {'number': 1, 'name': 'No Poverty', 'description': 'End poverty in all its forms everywhere'},
        'sdg4': {'number': 4, 'name': 'Quality Education', 'description': 'Ensure inclusive and equitable quality education'},
        'sdg5': {'number': 5, 'name': 'Gender Equality', 'description': 'Achieve gender equality and empower all women and girls'},
        'sdg8': {'number': 8, 'name': 'Decent Work', 'description': 'Promote sustained, inclusive economic growth and decent work'},
        'sdg9': {'number': 9, 'name': 'Innovation', 'description': 'Build resilient infrastructure, promote innovation'},
        'sdg10': {'number': 10, 'name': 'Reduced Inequalities', 'description': 'Reduce inequality within and among countries'},
        'sdg11': {'number': 11, 'name': 'Sustainable Cities', 'description': 'Make cities and settlements inclusive, safe, resilient'},
        'sdg13': {'number': 13, 'name': 'Climate Action', 'description': 'Take urgent action to combat climate change'},
        'sdg16': {'number': 16, 'name': 'Peace & Justice', 'description': 'Promote peaceful and inclusive societies for sustainable development'},
        'sdg17': {'number': 17, 'name': 'Partnerships', 'description': 'Strengthen global partnership for sustainable development'},
      },
      sdg_labels: {
        'sdg1': 'SDG 1', 'sdg4': 'SDG 4', 'sdg5': 'SDG 5', 'sdg8': 'SDG 8', 'sdg9': 'SDG 9',
        'sdg10': 'SDG 10', 'sdg11': 'SDG 11', 'sdg13': 'SDG 13', 'sdg16': 'SDG 16', 'sdg17': 'SDG 17'
      },
      binding_counts: {
        'legallyBinding': 45,
        'politicallyBinding': 78,
        'nonBinding': 32,
        'uncategorised': 10
      },
      binding_info: {
        'legallyBinding': {
          'name': 'Legally Binding',
          'description': 'Agreements with enforceable legal obligations under international law',
          'icon': '⚖️',
          'strength': 'Strong'
        },
        'politicallyBinding': {
          'name': 'Politically Binding',
          'description': 'Commitments based on political will without legal enforcement mechanisms',
          'icon': '🤝',
          'strength': 'Medium'
        },
        'nonBinding': {
          'name': 'Non-Binding',
          'description': 'Voluntary cooperation frameworks without formal obligations',
          'icon': '📋',
          'strength': 'Soft'
        },
        'uncategorised': {
          'name': 'Uncategorised',
          'description': 'Documents without specified binding level',
          'icon': '❓',
          'strength': 'Undefined'
        }
      },
      country_counts: {
        'ESP': 45, 'DEU': 38, 'FRA': 35, 'ITA': 28, 'BRA': 52,
        'ARG': 41, 'MEX': 38, 'COL': 34, 'CHL': 29, 'PER': 24
      },
      lead_country_counts: {
        'ESP': 89, 'DEU': 76, 'FRA': 64, 'BRA': 98, 'ARG': 72,
        'MEX': 67, 'COL': 54, 'CHL': 48, 'ITA': 42, 'PER': 38,
        'NLD': 34, 'BEL': 28, 'URY': 24, 'ECU': 21, 'POL': 18
      },
      country_names: {
        'ESP': 'Spain', 'DEU': 'Germany', 'FRA': 'France', 'ITA': 'Italy',
        'BRA': 'Brazil', 'ARG': 'Argentina', 'MEX': 'Mexico', 'COL': 'Colombia',
        'CHL': 'Chile', 'PER': 'Peru', 'NLD': 'Netherlands', 'BEL': 'Belgium',
        'URY': 'Uruguay', 'ECU': 'Ecuador', 'POL': 'Poland'
      },
      theme_counts: {
        'Digital Transformation & Strategy': 156,
        'Technology & Innovation': 134,
        'Data & Governance': 98,
        'Inclusion & Social Development': 87,
        'Regional & International Cooperation': 76,
        'Uncategorised': 12
      },
      theme_info: {
        "Digital Transformation & Strategy": {
          "description": "Strategic frameworks and policies for digital transformation initiatives",
          "icon": "🚀",
          "focus": "Strategy & Planning"
        },
        "Technology & Innovation": {
          "description": "Emerging technologies, R&D, and innovation ecosystems",
          "icon": "💡",
          "focus": "Tech Development"
        },
        "Data & Governance": {
          "description": "Data management, privacy, security, and digital governance frameworks",
          "icon": "🔒",
          "focus": "Governance & Security"
        },
        "Inclusion & Social Development": {
          "description": "Digital inclusion, accessibility, and social impact initiatives",
          "icon": "🤝",
          "focus": "Social Impact"
        },
        "Regional & International Cooperation": {
          "description": "Cross-border collaboration and international digital partnerships",
          "icon": "🌍",
          "focus": "Global Cooperation"
        },
        "Uncategorised": {
          "description": "Themes without specified category",
          "icon": "📋",
          "focus": "Other"
        }
      },
      actor_counts: {
        'Political Actors': 120,
        'Research and Innovation Actors': 85,
        'Economic Actors': 67,
        'Civil Society Actors': 43,
        'Uncategorised': 15
      },
      actor_info: {
        "Political Actors": {
          "description": "Governments, ministries, public institutions, and policy-making bodies",
          "icon": "🏛️",
          "role": "Policy & Governance"
        },
        "Research and Innovation Actors": {
          "description": "Universities, research centers, R&D institutions, and innovation hubs",
          "icon": "🔬",
          "role": "Knowledge & Development"
        },
        "Economic Actors": {
          "description": "Private companies, business associations, SMEs, and economic organizations",
          "icon": "💼",
          "role": "Business & Economy"
        },
        "Civil Society Actors": {
          "description": "NGOs, foundations, community organizations, and advocacy groups",
          "icon": "🤝",
          "role": "Social & Community"
        },
        "Uncategorised": {
          "description": "Actors without specified category",
          "icon": "📋",
          "role": "Other"
        }
      },
      beneficiary_counts: {
        'SMEs / Businesses': 156,
        'General Citizens / Consumers': 234,
        'Researchers & Academia': 98,
        'Start-ups / Innovators': 76,
        'Students & Youth': 145,
        'Public Sector / Governments': 89,
        'Women & Girls': 67,
        'Rural & Remote Communities': 45,
        'Health Sector': 34,
        'Civil Society / NGOs': 28
      },
      beneficiary_info: {
        "SMEs / Businesses": {
          "description": "Small and medium enterprises driving digital transformation",
          "icon": "🏪",
          "category": "Economic"
        },
        "Start-ups / Innovators": {
          "description": "Innovative startups and entrepreneurial ventures",
          "icon": "🚀",
          "category": "Economic"
        },
        "Researchers & Academia": {
          "description": "University researchers, scientists, and academic institutions",
          "icon": "🎓",
          "category": "Knowledge"
        },
        "Students & Youth": {
          "description": "Young people and students benefiting from digital education",
          "icon": "👨‍🎓",
          "category": "Education"
        },
        "Women & Girls": {
          "description": "Female population empowered through digital inclusion",
          "icon": "👩",
          "category": "Inclusion"
        },
        "Rural & Remote Communities": {
          "description": "Communities in rural and remote areas gaining digital access",
          "icon": "🏘️",
          "category": "Geographic"
        },
        "General Citizens / Consumers": {
          "description": "General public benefiting from digital services",
          "icon": "👥",
          "category": "General"
        },
        "Public Sector / Governments": {
          "description": "Government entities improving digital public services",
          "icon": "🏛️",
          "category": "Public"
        },
        "Civil Society / NGOs": {
          "description": "Non-governmental organizations leveraging digital tools",
          "icon": "🤝",
          "category": "Social"
        },
        "Health Sector": {
          "description": "Healthcare providers and patients using digital health",
          "icon": "🏥",
          "category": "Health"
        }
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
      case 'timeline':
        return this.formatTimelineData();
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
   * Format SDG data for dual radar chart (Coverage + Intensity)
   * Coverage is normalized to 0-100% relative to max
   * Intensity is converted to absolute percentage (0-100% based on 0-1 scale)
   */
  formatSDGData() {
    const sdgCounts = this.data.analysis.sdg_counts || {};
    const sdgAvgRelevance = this.data.analysis.sdg_avg_relevance || {};
    const sdgLabels = this.data.analysis.sdg_labels || {};
    
    // Get ordered SDG keys (sdg1, sdg2, etc.)
    const sdgKeys = Object.keys(sdgCounts).sort((a, b) => {
      const numA = parseInt(a.replace('sdg', ''));
      const numB = parseInt(b.replace('sdg', ''));
      return numA - numB;
    });
    
    // Format labels
    const labels = sdgKeys.map(key => {
      if (sdgLabels[key]) {
        return sdgLabels[key];
      }
      const number = key.replace('sdg', '');
      return `SDG ${number}`;
    });
    
    // Extract raw values
    const rawCounts = sdgKeys.map(key => sdgCounts[key] || 0);
    const rawRelevance = sdgKeys.map(key => sdgAvgRelevance[key] || 0);
    
    // Normalize counts to 0-100% relative to max count
    const maxCount = Math.max(...rawCounts, 1);
    const normalizedCounts = rawCounts.map(val => (val / maxCount) * 100);
    
    // Convert intensity to absolute percentage (0-1 → 0-100%)
    // No normalization to max! Just multiply by 100 to get percentage
    const absoluteIntensity = rawRelevance.map(val => val * 100);
    
    return {
      labels: labels,
      datasets: [
        {
          label: 'Document Count',
          data: normalizedCounts,
          rawData: rawCounts,  // Store original for tooltips
          backgroundColor: 'rgba(9, 78, 178, 0.2)',
          borderColor: 'rgba(9, 78, 178, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(9, 78, 178, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(9, 78, 178, 1)',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Avg Intensity',
          data: absoluteIntensity,
          rawData: rawRelevance,  // Store original 0-1 values for tooltips
          backgroundColor: 'rgba(52, 168, 83, 0.2)',
          borderColor: 'rgba(52, 168, 83, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(52, 168, 83, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(52, 168, 83, 1)',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  }

  /**
   * Format binding data for chart
   */
  formatBindingData() {
    const bindingCounts = this.data.analysis.binding_counts || {};
    const bindingInfo = this.data.analysis.binding_info || {};
    
    // Create arrays maintaining order
    const keys = Object.keys(bindingCounts);
    const labels = keys.map(key => bindingInfo[key]?.name || key);
    const values = Object.values(bindingCounts);
    
    return {
      labels: labels,
      keys: keys, // Keep keys for mapping to bindingInfo
      datasets: [{
        data: values,
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
   * Format lead countries data for chart (Top 15) - Uses ISO3 codes
   */
  formatLeadCountriesData() {
    const leadCountryCounts = this.data.analysis.lead_country_counts || {};
    const countryNames = this.data.analysis.country_names || {};
    
    // Sort by count descending and get top 15
    const sorted = Object.entries(leadCountryCounts)
      .filter(([iso3, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    return {
      labels: sorted.map(([iso3]) => iso3),
      countryNames: countryNames, // Include full country names mapping
      datasets: [{
        label: 'Documents Led',
        data: sorted.map(([, count]) => count)
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
   * Format timeline data for evolution chart
   * Handles both API format (Chart.js with labels/datasets) and legacy format (object by year)
   */
  formatTimelineData() {
    const timelineData = this.data.analysis.timeline_data || {};
    
    // Check if data is already in Chart.js format (from API)
    if (timelineData.labels && timelineData.datasets) {
      // API returns data in Chart.js format, return as-is
      return timelineData;
    }
    
    // Legacy format: object with years as keys
    // Get years sorted
    const years = Object.keys(timelineData).sort();
    
    // Extract data for each series
    const totalData = years.map(year => timelineData[year]?.total || 0);
    const agreementsData = years.map(year => timelineData[year]?.agreements || 0);
    const dialoguesData = years.map(year => timelineData[year]?.dialogues || 0);
    
    return {
      labels: years,
      datasets: [
        {
          label: 'Total',
          data: totalData
        },
        {
          label: 'Agreements',
          data: agreementsData
        },
        {
          label: 'Dialogues',
          data: dialoguesData
        }
      ]
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
   * Format beneficiaries data for chart (sorted by count descending)
   */
  formatBeneficiariesData() {
    const beneficiaryCounts = this.data.analysis.beneficiary_counts || {};
    
    // Sort by count descending and take top 10
    const sorted = Object.entries(beneficiaryCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(([key, value]) => value > 0)
      .slice(0, 10);
    
    return {
      labels: sorted.map(([label]) => label),
      datasets: [{
        label: 'Benefited',
        data: sorted.map(([, count]) => count),
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
   * Get actor-theme co-occurrence matrix
   */
  getCoOccurrenceMatrix() {
    return this.data.analysis?.actor_theme_matrix || null;
  }

  /**
   * Get SDG information (names and descriptions)
   */
  getSDGInfo() {
    return this.data.analysis?.sdg_info || null;
  }

  /**
   * Get binding information (names, descriptions, icons)
   */
  getBindingInfo() {
    return this.data.analysis?.binding_info || null;
  }

  /**
   * Get theme information (descriptions, icons, focus areas)
   */
  getThemeInfo() {
    return this.data.analysis?.theme_info || null;
  }

  /**
   * Get actor information (descriptions, icons, roles)
   */
  getActorInfo() {
    return this.data.analysis?.actor_info || null;
  }

  /**
   * Get beneficiary information (descriptions, icons, categories)
   */
  getBeneficiaryInfo() {
    return this.data.analysis?.beneficiary_info || null;
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

