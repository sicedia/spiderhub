/**
 * HomeDataCoordinator
 * SPA Mode: Coordinates all data loading for the home page via API
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS, CONFIG } from '../core/constants/config.js';
import { AnimationUtils } from '../core/utils/animations.js';
import { gettext as _ } from '../core/i18n/i18n.js';

export class HomeDataCoordinator {
  constructor(options = {}) {
    this.logger = logger.child({
      component: 'HomeDataCoordinator'
    });
    
    this.options = {
      enableStatsLoading: true,
      enableFeaturedDocs: true,
      enableUpcomingEvents: true,
      ...options
    };
    
    this.pageData = {
      stats: null,
      featuredDocuments: [],
      upcomingEvents: []
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
      
      if (this.options.enableUpcomingEvents) {
        promises.push(this.loadUpcomingEvents());
      }
      
      await Promise.all(promises);
      
      this.logger.info('All page data loaded successfully');
      
      eventBus.emit(EVENTS.HOME_DATA_LOADED, {
        stats: this.pageData.stats,
        featuredCount: this.pageData.featuredDocuments.length,
        upcomingEventsCount: this.pageData.upcomingEvents.length
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
            <p class="card__content">${this.truncateText(doc.executive_summary || _('No summary available.'), 100)}</p>
          </div>
          <div class="card__footer">
            <div class="card__actions">
              <a href="/${lang}/document_detail/${doc.id}/" class="button button--secondary button--small">
                ${_('View Details')}
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
              <span class="button button--secondary button--small button--disabled">${_('View Details')}</span>
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
   * Load upcoming events from API
   */
  async loadUpcomingEvents() {
    try {
      this.logger.debug('Loading upcoming events from API');
      
      const response = await fetch('/api/v1/events/upcoming/');
      if (response.ok) {
        const data = await response.json();
        this.pageData.upcomingEvents = data.events || [];
      this.logger.info('Upcoming events loaded from API', {
        count: this.pageData.upcomingEvents.length
      });
      this.renderUpcomingEvents();
      
      eventBus.emit(EVENTS.EVENTS_LOADED, {
        events: this.pageData.upcomingEvents,
        context: 'home'
      });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      this.logger.error('Failed to load upcoming events from API', error);
      this.pageData.upcomingEvents = [];
      this.renderUpcomingEventsEmpty();
    }
  }

  /**
   * Render upcoming events to DOM
   */
  renderUpcomingEvents() {
    const container = document.getElementById('upcoming-events-container');
    if (!container) return;
    
    if (this.pageData.upcomingEvents.length === 0) {
      this.renderUpcomingEventsEmpty();
      return;
    }

    // Hide loading skeleton
    const loading = container.querySelector('.home-events__loading');
    if (loading) {
      loading.hidden = true;
    }
    
    // Limit to only one row (3-4 events max depending on screen size)
    // For desktop: 3 events per row, for larger screens: 4 events
    const maxEvents = window.innerWidth >= 1200 ? 4 : 3;
    const eventsToShow = this.pageData.upcomingEvents.slice(0, maxEvents);
    
    // Get current language from URL
    const lang = window.location.pathname.split('/')[1] || 'en';
    
    container.innerHTML = eventsToShow.map(event => {
      const dateStr = this.formatEventDate(event.start_at, event.end_at);
      const locationStr = this.formatLocation(event.city_name, event.country_name);
      const formatBadge = event.event_format_display 
        ? `<span class="tag tag--info">${this.escapeHtml(event.event_format_display)}</span>`
        : '';
      
      return `
        <div class="home-events__card">
          <div class="home-events__card-header">
            <h3 class="home-events__card-title">${this.escapeHtml(event.title)}</h3>
            ${formatBadge}
          </div>
          <div class="home-events__card-body">
            ${dateStr ? `<div class="home-events__card-date">${this.escapeHtml(dateStr)}</div>` : ''}
            ${locationStr ? `<div class="home-events__card-location">${this.escapeHtml(locationStr)}</div>` : ''}
            ${event.organization_name ? `<div class="home-events__card-org">${this.escapeHtml(event.organization_name)}</div>` : ''}
          </div>
          <div class="home-events__card-footer">
            <a href="/${lang}/events/${event.id}/" class="button button--secondary button--small">${_('View Details')}</a>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render empty state for upcoming events
   */
  renderUpcomingEventsEmpty() {
    const container = document.getElementById('upcoming-events-container');
    if (!container) return;
    
    // Hide loading skeleton
    const loading = container.querySelector('.home-events__loading');
    if (loading) {
      loading.hidden = true;
    }
    
    // Hide the entire section if no events
    const section = document.getElementById('home-events-section');
    if (section) {
      section.hidden = true;
    }
  }

  /**
   * Format event date
   */
  formatEventDate(startAt, endAt) {
    if (!startAt) return '';
    
    try {
      const start = new Date(startAt);
      const startStr = start.toLocaleDateString();
      
      if (endAt) {
        const end = new Date(endAt);
        const endStr = end.toLocaleDateString();
        if (startStr === endStr) {
          return startStr;
        }
        return `${startStr} - ${endStr}`;
      }
      
      return startStr;
    } catch (e) {
      return '';
    }
  }

  /**
   * Format location string
   */
  formatLocation(city, country) {
    const parts = [];
    if (city) parts.push(city);
    if (country) parts.push(country);
    return parts.join(', ') || '';
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying HomeDataCoordinator');
    
    this.pageData = {
      stats: null,
      featuredDocuments: [],
      upcomingEvents: []
    };
    
    this.logger.debug('HomeDataCoordinator destroyed');
  }
}

export default HomeDataCoordinator;
