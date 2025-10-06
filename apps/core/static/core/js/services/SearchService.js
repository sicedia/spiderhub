/**
 * Search Service
 * Handles search functionality with advanced features
 * ES6 Module Export
 */

import { CONFIG } from '../core/constants/config.js';
import { EVENT_TYPES } from '../core/constants/enums.js';
import { EventUtils } from '../core/utils/events.js';
import { ValidationUtils } from '../core/utils/validation.js';

export class SearchService {
  constructor() {
    this.searchHistory = [];
    this.maxHistorySize = 20;
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.eventBus = EventUtils;
    this.searchStats = {
      totalSearches: 0,
      popularTerms: new Map(),
      avgResponseTime: 0
    };
  }

  /**
   * Perform search with caching and analytics
   */
  async search(query, options = {}) {
    const startTime = Date.now();
    
    // Validate and clean query
    const cleanQuery = this.cleanQuery(query);
    if (!this.isValidQuery(cleanQuery)) {
      throw new Error('Invalid search query');
    }

    const searchOptions = {
      fuzzy: false,
      caseSensitive: false,
      wholeWords: false,
      fields: ['title', 'content', 'summary'],
      limit: CONFIG.SEARCH.MAX_RESULTS,
      offset: 0,
      sortBy: 'relevance',
      sortOrder: 'desc',
      ...options
    };

    // Check cache first
    const cacheKey = this.generateCacheKey(cleanQuery, searchOptions);
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      this.trackSearch(cleanQuery, cachedResult.results.length, Date.now() - startTime, true);
      return cachedResult;
    }

    try {
      // Perform search
      const results = await this.performSearch(cleanQuery, searchOptions);
      
      // Process and rank results
      const processedResults = this.processSearchResults(results, cleanQuery, searchOptions);
      
      // Create search result object
      const searchResult = {
        query: cleanQuery,
        originalQuery: query,
        results: processedResults,
        totalResults: processedResults.length,
        searchTime: Date.now() - startTime,
        options: searchOptions,
        suggestions: this.generateSuggestions(cleanQuery, processedResults),
        facets: this.generateFacets(processedResults)
      };

      // Cache result
      this.addToCache(cacheKey, searchResult);
      
      // Track search
      this.trackSearch(cleanQuery, processedResults.length, searchResult.searchTime, false);
      
      // Add to history
      this.addToHistory(cleanQuery, searchResult);
      
      // Emit search event
      this.eventBus.emit(EVENT_TYPES.SEARCH_COMPLETED, {
        query: cleanQuery,
        resultCount: processedResults.length,
        searchTime: searchResult.searchTime
      });

      return searchResult;
      
    } catch (error) {
      console.error('Search failed:', error);
      this.eventBus.emit(EVENT_TYPES.SEARCH_ERROR, {
        query: cleanQuery,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Perform the actual search operation
   */
  async performSearch(query, options) {
    // In a real application, this would make an API call
    // For now, we'll simulate search with mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResults = this.getMockSearchResults(query, options);
        resolve(mockResults);
      }, 100 + Math.random() * 200); // Simulate network delay
    });
  }

  /**
   * Clean and normalize search query
   */
  cleanQuery(query) {
    if (typeof query !== 'string') {
      return '';
    }

    return query
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s\-"']/g, '') // Remove special characters except quotes and hyphens
      .substring(0, 200); // Limit length
  }

  /**
   * Validate search query
   */
  isValidQuery(query) {
    if (!query || query.length < CONFIG.SEARCH.MIN_QUERY_LENGTH) {
      return false;
    }

    // Check for common spam patterns
    const spamPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /^[^a-zA-Z0-9]*$/, // Only special characters
    ];

    return !spamPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Process and rank search results
   */
  processSearchResults(results, query, options) {
    if (!Array.isArray(results)) {
      return [];
    }

    // Score and rank results
    const scoredResults = results.map(result => ({
      ...result,
      score: this.calculateRelevanceScore(result, query, options),
      highlights: this.generateHighlights(result, query, options)
    }));

    // Sort by relevance score
    scoredResults.sort((a, b) => {
      if (options.sortBy === 'relevance') {
        return options.sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      } else if (options.sortBy === 'date') {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return options.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else if (options.sortBy === 'title') {
        const titleA = (a.title || '').toLowerCase();
        const titleB = (b.title || '').toLowerCase();
        return options.sortOrder === 'desc' ? titleB.localeCompare(titleA) : titleA.localeCompare(titleB);
      }
      return 0;
    });

    // Apply pagination
    const start = options.offset || 0;
    const end = start + (options.limit || CONFIG.SEARCH.MAX_RESULTS);
    
    return scoredResults.slice(start, end);
  }

  /**
   * Calculate relevance score for a search result
   */
  calculateRelevanceScore(result, query, options) {
    let score = 0;
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    // Title matching (highest weight)
    const title = (result.title || '').toLowerCase();
    queryTerms.forEach(term => {
      if (title.includes(term)) {
        score += title === term ? 100 : 50; // Exact match vs partial
      }
    });

    // Content matching
    const content = (result.content || '').toLowerCase();
    queryTerms.forEach(term => {
      const matches = (content.match(new RegExp(term, 'g')) || []).length;
      score += matches * 5;
    });

    // Summary matching
    const summary = (result.summary || '').toLowerCase();
    queryTerms.forEach(term => {
      if (summary.includes(term)) {
        score += 20;
      }
    });

    // Boost recent documents
    if (result.date) {
      const daysSincePublished = (Date.now() - new Date(result.date)) / (1000 * 60 * 60 * 24);
      if (daysSincePublished < 30) {
        score += 10;
      } else if (daysSincePublished < 90) {
        score += 5;
      }
    }

    // Boost by document type importance
    const typeBoosts = {
      'framework': 15,
      'agreement': 12,
      'policy': 10,
      'guideline': 8,
      'report': 5
    };
    
    if (result.type && typeBoosts[result.type.toLowerCase()]) {
      score += typeBoosts[result.type.toLowerCase()];
    }

    return Math.max(0, score);
  }

  /**
   * Generate search result highlights
   */
  generateHighlights(result, query, options) {
    const highlights = {};
    const queryTerms = query.toLowerCase().split(/\s+/);
    const highlightTag = '<mark>';
    const highlightEndTag = '</mark>';

    // Highlight in title
    if (result.title) {
      let highlightedTitle = result.title;
      queryTerms.forEach(term => {
        const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
        highlightedTitle = highlightedTitle.replace(regex, `${highlightTag}$1${highlightEndTag}`);
      });
      highlights.title = highlightedTitle;
    }

    // Highlight in summary with context
    if (result.summary) {
      highlights.summary = this.generateContextualHighlight(result.summary, queryTerms, 200);
    }

    // Highlight in content with context
    if (result.content) {
      highlights.content = this.generateContextualHighlight(result.content, queryTerms, 300);
    }

    return highlights;
  }

  /**
   * Generate contextual highlight with surrounding text
   */
  generateContextualHighlight(text, queryTerms, maxLength) {
    const highlightTag = '<mark>';
    const highlightEndTag = '</mark>';
    
    // Find the best match position
    let bestMatch = { position: -1, score: 0 };
    
    queryTerms.forEach(term => {
      const regex = new RegExp(this.escapeRegex(term), 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const score = queryTerms.length; // Simple scoring
        if (score > bestMatch.score) {
          bestMatch = { position: match.index, score };
        }
      }
    });

    if (bestMatch.position === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    // Extract context around the match
    const contextStart = Math.max(0, bestMatch.position - maxLength / 2);
    const contextEnd = Math.min(text.length, contextStart + maxLength);
    let contextText = text.substring(contextStart, contextEnd);

    // Add ellipsis if needed
    if (contextStart > 0) {
      contextText = '...' + contextText;
    }
    if (contextEnd < text.length) {
      contextText = contextText + '...';
    }

    // Apply highlights
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      contextText = contextText.replace(regex, `${highlightTag}$1${highlightEndTag}`);
    });

    return contextText;
  }

  /**
   * Generate search suggestions
   */
  generateSuggestions(query, results) {
    const suggestions = [];
    
    // Spelling suggestions (simplified)
    const commonTerms = this.getCommonSearchTerms();
    const queryWords = query.toLowerCase().split(/\s+/);
    
    queryWords.forEach(word => {
      const similar = commonTerms.filter(term => 
        this.calculateLevenshteinDistance(word, term) <= 2 && 
        term !== word
      );
      
      if (similar.length > 0) {
        const suggestion = query.replace(new RegExp(word, 'gi'), similar[0]);
        suggestions.push({
          type: 'spelling',
          text: suggestion,
          reason: `Did you mean "${similar[0]}"?`
        });
      }
    });

    // Related terms from results
    if (results.length > 0) {
      const relatedTerms = this.extractRelatedTerms(results, query);
      relatedTerms.forEach(term => {
        suggestions.push({
          type: 'related',
          text: `${query} ${term}`,
          reason: `Try adding "${term}"`
        });
      });
    }

    return suggestions.slice(0, 5); // Limit suggestions
  }

  /**
   * Generate search facets for filtering
   */
  generateFacets(results) {
    const facets = {
      types: {},
      countries: {},
      themes: {},
      years: {}
    };

    results.forEach(result => {
      // Document types
      if (result.type) {
        facets.types[result.type] = (facets.types[result.type] || 0) + 1;
      }

      // Countries
      if (result.country) {
        facets.countries[result.country] = (facets.countries[result.country] || 0) + 1;
      }

      // Themes
      if (result.themes && Array.isArray(result.themes)) {
        result.themes.forEach(theme => {
          facets.themes[theme] = (facets.themes[theme] || 0) + 1;
        });
      }

      // Years
      if (result.date) {
        const year = new Date(result.date).getFullYear();
        if (!isNaN(year)) {
          facets.years[year] = (facets.years[year] || 0) + 1;
        }
      }
    });

    // Convert to sorted arrays
    Object.keys(facets).forEach(facetType => {
      facets[facetType] = Object.entries(facets[facetType])
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10) // Top 10 per facet
        .map(([name, count]) => ({ name, count }));
    });

    return facets;
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(partialQuery, limit = 10) {
    const cleanQuery = this.cleanQuery(partialQuery);
    if (cleanQuery.length < 2) {
      return [];
    }

    // Get from search history
    const historySuggestions = this.searchHistory
      .filter(item => item.query.toLowerCase().includes(cleanQuery.toLowerCase()))
      .map(item => ({
        text: item.query,
        type: 'history',
        resultCount: item.resultCount
      }))
      .slice(0, 5);

    // Get popular terms
    const popularSuggestions = Array.from(this.searchStats.popularTerms.entries())
      .filter(([term]) => term.toLowerCase().includes(cleanQuery.toLowerCase()))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([term, count]) => ({
        text: term,
        type: 'popular',
        searchCount: count
      }));

    // Combine and deduplicate
    const allSuggestions = [...historySuggestions, ...popularSuggestions];
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.text === suggestion.text)
    );

    return uniqueSuggestions.slice(0, limit);
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
  }

  /**
   * Get search history
   */
  getSearchHistory() {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearSearchHistory() {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  /**
   * Get search statistics
   */
  getSearchStats() {
    return {
      ...this.searchStats,
      popularTerms: Array.from(this.searchStats.popularTerms.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
    };
  }

  /**
   * Private helper methods
   */
  generateCacheKey(query, options) {
    return `${query}:${JSON.stringify(options)}`;
  }

  getFromCache(key) {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  addToCache(key, data) {
    this.searchCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.searchCache.size > 100) {
      const oldestKey = this.searchCache.keys().next().value;
      this.searchCache.delete(oldestKey);
    }
  }

  addToHistory(query, result) {
    const historyItem = {
      query,
      resultCount: result.totalResults,
      timestamp: Date.now()
    };

    // Remove duplicate
    this.searchHistory = this.searchHistory.filter(item => item.query !== query);
    
    // Add to beginning
    this.searchHistory.unshift(historyItem);
    
    // Limit size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }

    this.saveSearchHistory();
  }

  trackSearch(query, resultCount, responseTime, fromCache) {
    this.searchStats.totalSearches++;
    
    // Update popular terms
    const currentCount = this.searchStats.popularTerms.get(query) || 0;
    this.searchStats.popularTerms.set(query, currentCount + 1);
    
    // Update average response time
    if (!fromCache) {
      const totalTime = this.searchStats.avgResponseTime * (this.searchStats.totalSearches - 1);
      this.searchStats.avgResponseTime = (totalTime + responseTime) / this.searchStats.totalSearches;
    }
  }

  saveSearchHistory() {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  loadSearchHistory() {
    try {
      const saved = localStorage.getItem('searchHistory');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
      this.searchHistory = [];
    }
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  calculateLevenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  getCommonSearchTerms() {
    return [
      'digital', 'cooperation', 'policy', 'framework', 'agreement',
      'governance', 'technology', 'innovation', 'cybersecurity',
      'privacy', 'data', 'artificial', 'intelligence', 'blockchain'
    ];
  }

  extractRelatedTerms(results, query) {
    const terms = new Set();
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    
    results.forEach(result => {
      // Extract from title and summary
      const text = `${result.title || ''} ${result.summary || ''}`.toLowerCase();
      const words = text.match(/\b\w{4,}\b/g) || [];
      
      words.forEach(word => {
        if (!queryWords.has(word) && word.length > 3) {
          terms.add(word);
        }
      });
    });
    
    return Array.from(terms).slice(0, 5);
  }

  getMockSearchResults(query, options) {
    // Mock search results for development
    const mockData = [
      {
        id: 1,
        title: "Digital Cooperation Framework 2024",
        summary: "A comprehensive framework for international digital cooperation",
        content: "This framework outlines the principles and mechanisms for digital cooperation...",
        country: "Global",
        type: "Framework",
        date: "2024-01-15",
        themes: ["Digital Governance", "International Cooperation"]
      },
      {
        id: 2,
        title: "AI Ethics Guidelines",
        summary: "Guidelines for ethical artificial intelligence development",
        content: "These guidelines provide a framework for developing AI systems ethically...",
        country: "European Union",
        type: "Guidelines",
        date: "2024-02-20",
        themes: ["Artificial Intelligence", "Ethics"]
      },
      {
        id: 3,
        title: "Cybersecurity Cooperation Agreement",
        summary: "International agreement on cybersecurity cooperation",
        content: "This agreement establishes mechanisms for international cybersecurity cooperation...",
        country: "United States",
        type: "Agreement",
        date: "2024-03-10",
        themes: ["Cybersecurity", "International Relations"]
      }
    ];

    // Simple filtering based on query
    const queryLower = query.toLowerCase();
    return mockData.filter(item => 
      item.title.toLowerCase().includes(queryLower) ||
      item.summary.toLowerCase().includes(queryLower) ||
      item.content.toLowerCase().includes(queryLower)
    );
  }
}

// Default export
export default SearchService;
