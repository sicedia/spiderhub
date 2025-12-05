/**
 * HomeDataCoordinator
 * SPA Mode: Coordinates all data loading for the home page via API
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS, CONFIG } from '../core/constants/config.js';
import { AnimationUtils } from '../core/utils/animations.js';

export class HomeDataCoordinator {
  constructor(options = {}) {
    this.logger = logger.child({
      component: 'HomeDataCoordinator'
    });
    
    this.options = {
      enableStatsLoading: true,
      enableFeaturedDocs: true,
      ...options
    };
    
    this.pageData = {
      stats: null,
      featuredDocuments: []
    };
    
    this.logger.debug('HomeDataCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing HomeDataCoordinator');
    
    await this.loadAllData();
    
    this.logger.info('HomeDataCoordinator initialized successfully');
  }

  /**
   * Load all page data from API
   */
  async loadAllData() {
    try {
      const promises = [];
      
      if (this.options.enableStatsLoading) {
        promises.push(this.loadStats());
      }
      
      if (this.options.enableFeaturedDocs) {
        promises.push(this.loadFeaturedDocuments());
      }
      
      await Promise.all(promises);
      
      this.logger.info('All page data loaded successfully');
      
      eventBus.emit(EVENTS.HOME_DATA_LOADED, {
        stats: this.pageData.stats,
        featuredCount: this.pageData.featuredDocuments.length
      });
      
    } catch (error) {
      this.logger.warn('Failed to load some page data', error);
    }
  }

  /**
   * Load statistics data from API
   */
  async loadStats() {
    try {
      this.logger.debug('Loading statistics from API');
      
      const response = await fetch('/api/v1/home/stats/');
      if (response.ok) {
        const data = await response.json();
      this.pageData.stats = {
          totalDocuments: data.total_documents || 0,
          countries: data.total_countries || 0,
          themes: data.total_themes || 0,
          beneficiaryGroups: data.total_beneficiary_groups || 0,
        lastUpdated: new Date().toISOString()
      };
      
        this.logger.info('Statistics loaded from API', this.pageData.stats);
        this.updateStatsDisplay();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      this.logger.error('Failed to load stats from API', error);
    }
  }

  /**
   * Update stats display in DOM
   */
  updateStatsDisplay() {
    const stats = this.pageData.stats;
    if (!stats) return;
    
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;
    
    // Find all stat number elements and update them
    const statElements = [
      { selector: '[data-stat="total_documents"]', value: stats.totalDocuments, suffix: '+' },
      { selector: '[data-stat="total_countries"]', value: stats.countries, suffix: '' },
      { selector: '[data-stat="total_themes"]', value: stats.themes, suffix: '' },
      { selector: '[data-stat="total_beneficiary_groups"]', value: stats.beneficiaryGroups, suffix: '' }
    ];
    
    statElements.forEach(({ selector, value, suffix }) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('data-target', value);
        el.textContent = '0' + suffix;
        AnimationUtils.animateCounter(el, value, CONFIG.ANIMATION?.DURATION || 1500, suffix);
      }
    });
  }

  /**
   * Load featured/recent documents from API
   */
  async loadFeaturedDocuments() {
    try {
      this.logger.debug('Loading recent documents from API');
      
      const response = await fetch('/api/v1/home/recent-documents/');
      if (response.ok) {
        const data = await response.json();
        this.pageData.featuredDocuments = data.documents || [];
        this.logger.info('Recent documents loaded from API', {
        count: this.pageData.featuredDocuments.length
      });
        this.renderFeaturedDocuments();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      this.logger.error('Failed to load recent documents from API', error);
      this.pageData.featuredDocuments = [];
      this.renderEmptyState();
    }
  }

  /**
   * Render featured documents to DOM
   */
  renderFeaturedDocuments() {
    const container = document.getElementById('recent-documents-container');
    if (!container) return;
    
    if (this.pageData.featuredDocuments.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    // Get current language from URL
    const lang = window.location.pathname.split('/')[1] || 'en';
    
    container.innerHTML = this.pageData.featuredDocuments.map(doc => `
      <div class="carousel__item">
        <div class="card card--document">
          <div class="card__header">
            <div class="card__title">${this.escapeHtml(doc.title)}</div>
            <div class="card__meta">
              <span>${doc.event_country?.name || 'Unknown'}</span>
              <span>${doc.event_date ? new Date(doc.event_date).getFullYear() : 'N/A'}</span>
            </div>
          </div>
          <div class="card__body">
            <p class="card__content">${this.truncateText(doc.executive_summary || 'No summary available.', 100)}</p>
          </div>
          <div class="card__footer">
            <div class="card__actions">
              <a href="/${lang}/document_detail/${doc.id}/" class="button button--secondary button--small">
                View Details
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    const container = document.getElementById('recent-documents-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="carousel__item">
        <div class="card card--document">
          <div class="card__header">
            <div class="card__title">No documents available</div>
            <div class="card__meta">
              <span>-</span>
              <span>-</span>
            </div>
          </div>
          <div class="card__body">
            <p class="card__content">No documents have been uploaded yet.</p>
          </div>
          <div class="card__footer">
            <div class="card__actions">
              <span class="button button--secondary button--small button--disabled">View Details</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML for XSS prevention
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Truncate text to specified length
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return this.escapeHtml(text);
    return this.escapeHtml(text.substring(0, maxLength)) + '...';
  }

  /**
   * Get page data
   */
  getPageData() {
    return this.pageData;
  }

  /**
   * Get statistics
   */
  getStats() {
    return this.pageData.stats;
  }

  /**
   * Get featured documents
   */
  getFeaturedDocuments() {
    return this.pageData.featuredDocuments;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying HomeDataCoordinator');
    
    this.pageData = {
      stats: null,
      featuredDocuments: []
    };
    
    this.logger.debug('HomeDataCoordinator destroyed');
  }
}

export default HomeDataCoordinator;
