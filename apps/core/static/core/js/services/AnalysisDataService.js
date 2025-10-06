/**
 * Analysis Data Service
 * Handles data fetching, processing, and caching for analysis page
 * Follows Single Responsibility Principle - only manages analysis data
 * ES6 Module Export
 */

import { CONFIG } from '../core/constants/config.js';

export class AnalysisDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.apiEndpoints = {
      analysisData: '/api/analysis-data/',
      leadCountries: '/api/lead-countries/',
      sdgData: '/api/sdg-data/',
      bindingData: '/api/binding-data/',
      diversityData: '/api/diversity-data/',
      initiativeData: '/api/initiative-data/',
      collaborationData: '/api/collaboration-data/'
    };
  }

  /**
   * Fetch analysis data with caching
   */
  async fetchAnalysisData() {
    return await this.fetchWithCache('analysis-data', async () => {
      try {
        const response = await fetch(this.apiEndpoints.analysisData);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Could not fetch analysis data from API, using fallback data');
      }
      
      // Fallback to mock data
      return this.generateMockAnalysisData();
    });
  }

  /**
   * Fetch lead countries data
   */
  async fetchLeadCountriesData() {
    return await this.fetchWithCache('lead-countries', async () => {
      try {
        const response = await fetch(this.apiEndpoints.leadCountries);
        if (response.ok) {
          const data = await response.json();
          return data.counts || {};
        }
      } catch (error) {
        console.warn('Could not fetch lead countries data from API');
      }
      
      return this.generateMockLeadCountriesData();
    });
  }

  /**
   * Fetch SDG data
   */
  async fetchSdgData() {
    return await this.fetchWithCache('sdg-data', async () => {
      try {
        const response = await fetch(this.apiEndpoints.sdgData);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Could not fetch SDG data from API');
      }
      
      return this.generateMockSdgData();
    });
  }

  /**
   * Fetch legal binding data
   */
  async fetchBindingData() {
    return await this.fetchWithCache('binding-data', async () => {
      try {
        const response = await fetch(this.apiEndpoints.bindingData);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Could not fetch binding data from API');
      }
      
      return this.generateMockBindingData();
    });
  }

  /**
   * Fetch diversity data
   */
  async fetchDiversityData() {
    return await this.fetchWithCache('diversity-data', async () => {
      try {
        const response = await fetch(this.apiEndpoints.diversityData);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Could not fetch diversity data from API');
      }
      
      return this.generateMockDiversityData();
    });
  }

  /**
   * Fetch initiative data
   */
  async fetchInitiativeData() {
    return await this.fetchWithCache('initiative-data', async () => {
      try {
        const response = await fetch(this.apiEndpoints.initiativeData);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Could not fetch initiative data from API');
      }
      
      return this.generateMockInitiativeData();
    });
  }

  /**
   * Fetch collaboration data
   */
  async fetchCollaborationData() {
    return await this.fetchWithCache('collaboration-data', async () => {
      try {
        const response = await fetch(this.apiEndpoints.collaborationData);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Could not fetch collaboration data from API');
      }
      
      return this.generateMockCollaborationData();
    });
  }

  /**
   * Fetch data with caching
   */
  async fetchWithCache(key, fetchFunction, ttl = this.cacheTimeout) {
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
    }

    try {
      const data = await fetchFunction();
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Generate mock analysis data
   */
  generateMockAnalysisData() {
    return {
      theme_counts: {
        'Digital Infrastructure': 45,
        'Artificial Intelligence': 32,
        'Cybersecurity': 28,
        'E-Government': 35,
        'Digital Skills': 41,
        'Green Technology': 29,
        'Innovation': 38,
        'Trade': 33,
        'Education': 26,
        'Health': 22
      },
      actor_counts: {
        'Political Actors': 67,
        'Research and Innovation Actors': 45,
        'Economic Actors': 38,
        'Civil Society Actors': 23,
        'Uncategorised': 12
      },
      beneficiary_counts: {
        'Small and Medium Enterprises': 45,
        'Rural Communities': 38,
        'Youth': 42,
        'Women': 35,
        'Indigenous Communities': 28,
        'Academic Institutions': 33,
        'Government Agencies': 41,
        'International Organizations': 29
      },
      scope_counts: {
        'bilateral': 45,
        'multilateral': 32,
        'regional': 28,
        'global': 15
      },
      country_counts: {
        'BRA': 25,
        'ARG': 18,
        'CHL': 22,
        'COL': 16,
        'MEX': 20,
        'PER': 14,
        'ECU': 12,
        'URY': 10,
        'ESP': 28,
        'DEU': 24,
        'FRA': 22,
        'ITA': 19,
        'PRT': 15
      },
      country_names: {
        'BRA': 'Brazil',
        'ARG': 'Argentina',
        'CHL': 'Chile',
        'COL': 'Colombia',
        'MEX': 'Mexico',
        'PER': 'Peru',
        'ECU': 'Ecuador',
        'URY': 'Uruguay',
        'ESP': 'Spain',
        'DEU': 'Germany',
        'FRA': 'France',
        'ITA': 'Italy',
        'PRT': 'Portugal'
      },
      lead_country_counts: {
        'Brazil': 25,
        'Spain': 28,
        'Germany': 24,
        'Chile': 22,
        'France': 22,
        'Mexico': 20,
        'Italy': 19,
        'Argentina': 18
      },
      sdg_counts: {
        'SDG 4': 35,
        'SDG 8': 42,
        'SDG 9': 38,
        'SDG 10': 29,
        'SDG 11': 33,
        'SDG 13': 31,
        'SDG 16': 27,
        'SDG 17': 45
      },
      binding_counts: {
        'Legally Binding': 45,
        'Non-Binding': 38,
        'Framework Agreement': 29,
        'Memorandum of Understanding': 22
      }
    };
  }

  /**
   * Generate mock lead countries data
   */
  generateMockLeadCountriesData() {
    return {
      'Brazil': 25,
      'Spain': 28,
      'Germany': 24,
      'Chile': 22,
      'France': 22,
      'Mexico': 20,
      'Italy': 19,
      'Argentina': 18,
      'Colombia': 16,
      'Peru': 14,
      'Ecuador': 12,
      'Uruguay': 10
    };
  }

  /**
   * Generate mock SDG data
   */
  generateMockSdgData() {
    return {
      'SDG 4 - Quality Education': 35,
      'SDG 8 - Decent Work and Economic Growth': 42,
      'SDG 9 - Industry, Innovation and Infrastructure': 38,
      'SDG 10 - Reduced Inequalities': 29,
      'SDG 11 - Sustainable Cities and Communities': 33,
      'SDG 13 - Climate Action': 31,
      'SDG 16 - Peace, Justice and Strong Institutions': 27,
      'SDG 17 - Partnerships for the Goals': 45
    };
  }

  /**
   * Generate mock binding data
   */
  generateMockBindingData() {
    return {
      'Legally Binding': 45,
      'Non-Binding': 38,
      'Framework Agreement': 29,
      'Memorandum of Understanding': 22,
      'Joint Declaration': 18,
      'Action Plan': 15
    };
  }

  /**
   * Generate mock diversity data
   */
  generateMockDiversityData() {
    return {
      dimensions: {
        'Thematic Diversity': {
          value: 75,
          description: 'Distribution across digital themes',
          categories: 8,
          shannonIndex: 1.8
        },
        'Actor Diversity': {
          value: 68,
          description: 'Variety of participating stakeholders',
          categories: 5,
          shannonIndex: 1.5
        },
        'Geographic Spread': {
          value: 82,
          description: 'Regional and country coverage',
          categories: 12,
          shannonIndex: 2.1
        },
        'Sector Coverage': {
          value: 59,
          description: 'Economic sector representation',
          categories: 6,
          shannonIndex: 1.3
        },
        'Initiative Types': {
          value: 71,
          description: 'Variety of cooperation formats',
          categories: 7,
          shannonIndex: 1.6
        },
        'Beneficiary Inclusion': {
          value: 78,
          description: 'Diversity of target groups',
          categories: 8,
          shannonIndex: 1.9
        },
        'Funding Sources': {
          value: 52,
          description: 'Financial mechanism diversity',
          categories: 4,
          shannonIndex: 1.1
        },
        'Temporal Distribution': {
          value: 85,
          description: 'Timeline and duration variety',
          categories: 6,
          shannonIndex: 1.7
        }
      }
    };
  }

  /**
   * Generate mock initiative data
   */
  generateMockInitiativeData() {
    return {
      name: "Digital Cooperation Initiatives",
      children: [
        {
          name: "Strategic Frameworks",
          children: [
            { name: "Digital Strategies", value: 15, count: 15 },
            { name: "Policy Documents", value: 12, count: 12 },
            { name: "Action Plans", value: 8, count: 8 }
          ]
        },
        {
          name: "Cooperation Agreements",
          children: [
            { name: "Bilateral MOUs", value: 18, count: 18 },
            { name: "Multilateral Programs", value: 14, count: 14 },
            { name: "Regional Initiatives", value: 10, count: 10 }
          ]
        },
        {
          name: "Research & Innovation",
          children: [
            { name: "Joint Research Projects", value: 22, count: 22 },
            { name: "Innovation Hubs", value: 16, count: 16 },
            { name: "Technology Transfer", value: 12, count: 12 }
          ]
        },
        {
          name: "Capacity Building",
          children: [
            { name: "Training Programs", value: 20, count: 20 },
            { name: "Educational Exchanges", value: 15, count: 15 },
            { name: "Skills Development", value: 18, count: 18 }
          ]
        }
      ]
    };
  }

  /**
   * Generate mock collaboration data
   */
  generateMockCollaborationData() {
    const nodes = [
      // Actor nodes
      {
        id: 'actor-political',
        name: 'Political Actors',
        type: 'government',
        sector: 'Public',
        size: 25,
        connections: 8
      },
      {
        id: 'actor-research',
        name: 'Research and Innovation Actors',
        type: 'academia',
        sector: 'Research',
        size: 20,
        connections: 6
      },
      {
        id: 'actor-economic',
        name: 'Economic Actors',
        type: 'private',
        sector: 'Private',
        size: 18,
        connections: 5
      },
      {
        id: 'actor-civil',
        name: 'Civil Society Actors',
        type: 'civil-society',
        sector: 'Civil Society',
        size: 15,
        connections: 4
      },
      // Country nodes
      {
        id: 'country-brazil',
        name: 'Brazil',
        type: 'government',
        sector: 'Public',
        size: 22,
        connections: 7
      },
      {
        id: 'country-spain',
        name: 'Spain',
        type: 'government',
        sector: 'Public',
        size: 20,
        connections: 6
      },
      {
        id: 'country-germany',
        name: 'Germany',
        type: 'government',
        sector: 'Public',
        size: 18,
        connections: 5
      },
      {
        id: 'country-chile',
        name: 'Chile',
        type: 'government',
        sector: 'Public',
        size: 16,
        connections: 4
      }
    ];

    const links = [
      { source: 'actor-political', target: 'country-brazil', strength: 5, type: 'public-collaboration' },
      { source: 'actor-political', target: 'country-spain', strength: 4, type: 'public-collaboration' },
      { source: 'actor-research', target: 'country-germany', strength: 3, type: 'research-collaboration' },
      { source: 'actor-economic', target: 'country-chile', strength: 2, type: 'public-private' },
      { source: 'country-brazil', target: 'country-spain', strength: 6, type: 'bilateral' },
      { source: 'country-germany', target: 'country-chile', strength: 4, type: 'bilateral' }
    ];

    return { nodes, links };
  }

  /**
   * Process and enrich analysis data
   */
  processAnalysisData(rawData) {
    const processed = { ...rawData };
    
    // Calculate totals
    processed.totals = {
      themes: Object.values(processed.theme_counts || {}).reduce((sum, count) => sum + count, 0),
      actors: Object.values(processed.actor_counts || {}).reduce((sum, count) => sum + count, 0),
      beneficiaries: Object.values(processed.beneficiary_counts || {}).reduce((sum, count) => sum + count, 0),
      countries: Object.values(processed.country_counts || {}).reduce((sum, count) => sum + count, 0)
    };

    // Calculate percentages
    processed.percentages = {
      themes: this.calculatePercentages(processed.theme_counts),
      actors: this.calculatePercentages(processed.actor_counts),
      beneficiaries: this.calculatePercentages(processed.beneficiary_counts),
      countries: this.calculatePercentages(processed.country_counts)
    };

    // Add metadata
    processed.metadata = {
      lastUpdated: new Date().toISOString(),
      dataSource: 'analysis-service',
      version: '1.0'
    };

    return processed;
  }

  /**
   * Calculate percentages from counts
   */
  calculatePercentages(counts) {
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (total === 0) return {};
    
    const percentages = {};
    Object.entries(counts).forEach(([key, count]) => {
      percentages[key] = Math.round((count / total) * 100);
    });
    
    return percentages;
  }

  /**
   * Get data statistics
   */
  getDataStats() {
    return {
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
      cacheTimeout: this.cacheTimeout,
      apiEndpoints: Object.keys(this.apiEndpoints)
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(key) {
    this.cache.delete(key);
  }

  /**
   * Update cache timeout
   */
  setCacheTimeout(timeout) {
    this.cacheTimeout = timeout;
  }

  /**
   * Validate data structure
   */
  validateDataStructure(data) {
    const requiredFields = ['theme_counts', 'actor_counts', 'country_counts'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.warn('AnalysisDataService: Missing required fields:', missingFields);
      return false;
    }
    
    return true;
  }

  /**
   * Merge multiple data sources
   */
  mergeDataSources(...dataSources) {
    const merged = {};
    
    dataSources.forEach(source => {
      Object.entries(source).forEach(([key, value]) => {
        if (merged[key] && typeof merged[key] === 'object' && typeof value === 'object') {
          merged[key] = { ...merged[key], ...value };
        } else {
          merged[key] = value;
        }
      });
    });
    
    return merged;
  }

  /**
   * Export data
   */
  exportData(data, format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert data to CSV
   */
  convertToCSV(data) {
    // Simple CSV conversion for counts data
    const csvRows = [];
    
    Object.entries(data).forEach(([category, counts]) => {
      if (typeof counts === 'object' && counts !== null) {
        csvRows.push(`\n${category}`);
        csvRows.push('Name,Count');
        Object.entries(counts).forEach(([name, count]) => {
          csvRows.push(`"${name}",${count}`);
        });
      }
    });
    
    return csvRows.join('\n');
  }
}

// Create singleton instance
export const analysisDataService = new AnalysisDataService();

// Default export
export default AnalysisDataService;
