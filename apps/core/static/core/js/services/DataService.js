/**
 * Data Service
 * Handles data fetching, processing, and caching
 * ES6 Module Export
 */

import { CONFIG } from '../core/constants/config.js';

export class DataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
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
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Simulate API call for search results
   */
  async searchDocuments(filters = [], page = 1, pageSize = 10) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data based on filters
    const totalResults = Math.max(10, 100 - (filters.length * 15));
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalResults);

    const documents = [];
    for (let i = startIndex; i < endIndex; i++) {
      documents.push({
        id: i + 1,
        title: `Document ${i + 1}`,
        type: ['Agreement', 'Declaration', 'Framework'][i % 3],
        country: ['Spain', 'Germany', 'Brazil', 'Argentina'][i % 4],
        theme: ['Climate', 'Trade', 'Technology', 'Education'][i % 4],
        date: new Date(2020 + (i % 4), i % 12, (i % 28) + 1).toISOString().split('T')[0]
      });
    }

    return {
      documents,
      totalResults,
      currentPage: page,
      totalPages: Math.ceil(totalResults / pageSize),
      hasMore: endIndex < totalResults
    };
  }

  /**
   * Get filter options
   */
  async getFilterOptions() {
    return await this.fetchWithCache('filter-options', async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        countries: [
          { value: 'spain', label: 'Spain', count: 45 },
          { value: 'germany', label: 'Germany', count: 38 },
          { value: 'brazil', label: 'Brazil', count: 52 },
          { value: 'argentina', label: 'Argentina', count: 29 }
        ],
        themes: [
          { value: 'climate', label: 'Climate Change', count: 67 },
          { value: 'trade', label: 'Trade', count: 43 },
          { value: 'technology', label: 'Technology', count: 35 },
          { value: 'education', label: 'Education', count: 28 }
        ],
        types: [
          { value: 'agreement', label: 'Agreement', count: 89 },
          { value: 'declaration', label: 'Declaration', count: 34 },
          { value: 'framework', label: 'Framework', count: 23 }
        ]
      };
    });
  }

  /**
   * Get document by ID
   */
  async getDocument(id) {
    return await this.fetchWithCache(`document-${id}`, async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        id,
        title: `Document ${id}`,
        content: `This is the content of document ${id}...`,
        metadata: {
          type: 'Agreement',
          country: 'Spain',
          theme: 'Climate Change',
          date: '2023-01-15',
          actors: ['EU', 'Spain', 'Brazil'],
          beneficiaries: ['Small Island States', 'Rural Communities']
        }
      };
    });
  }
}

// Create singleton instance
export const dataService = new DataService();

// Default export
export default DataService;
