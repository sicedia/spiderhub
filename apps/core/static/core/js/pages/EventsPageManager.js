/**
 * Events Page Manager
 * Manages the events discovery page with upcoming and past events
 * ES6 Module Export
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { DOMUtils } from '../core/utils/dom.js';
import { APIUtils } from '../core/utils/api.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { Pagination } from '../components/navigation/Pagination.js';
import { FilterManager } from '../components/filters/FilterManager.js';
import { FilterAccordion } from '../components/filters/FilterAccordion.js';
import { SearchManager } from '../components/search/SearchManager.js';
import { SuggestionsBox } from '../components/search/SuggestionsBox.js';
import { gettext as _ } from '../core/i18n/i18n.js';

export class EventsPageManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    // Archive/search mode state
    this.archiveMode = false;
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalCount = 0;
    this.filters = {};
    this.searchQuery = '';
    
    // Events data
    this.upcomingEvents = [];
    this.archiveEvents = [];
    
    // Set pageSize from options (will be set after getDefaultOptions is called)
    this.pageSize = this.options.pageSize || 3;
    
    this.logger.info('EventsPageManager initialized', {
      pageSize: this.pageSize
    });
  }

  /**
   * Default options
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      apiEndpoint: '/api/v1/events/',
      suggestEndpoint: '/api/v1/events/suggest/',
      pageSize: 3, // For testing - show 3 events per page
      enableFilters: true,
      enablePagination: true,
      enableSearch: true
    };
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Hero section
      hero: DOMUtils.getElement('.events-hero'),
      
      // Upcoming events section
      upcomingSection: DOMUtils.getElement('.events-section--upcoming'),
      upcomingLoading: DOMUtils.getElement('#upcoming-loading'),
      upcomingEmpty: DOMUtils.getElement('#upcoming-empty'),
      upcomingGrid: DOMUtils.getElement('#upcoming-events-grid'),
      
      // Archive section
      archiveSection: DOMUtils.getElement('#events-archive'),
      archiveToggle: DOMUtils.getElement('#events-archive-toggle'),
      viewArchiveButton: DOMUtils.getElement('#view-archive-button'),
      archiveClose: DOMUtils.getElement('#archive-close'),
      
      // Archive results elements
      archiveLoading: DOMUtils.getElement('#archive-loading'),
      archiveError: DOMUtils.getElement('#archive-error'),
      archiveErrorMessage: DOMUtils.getElement('#archive-error-message'),
      archiveEmpty: DOMUtils.getElement('#archive-empty'),
      archiveEventsGrid: DOMUtils.getElement('#archive-events-grid'),
      archivePagination: DOMUtils.getElement('#archive-pagination')
    };
  }

  /**
   * Initialize components
   */
  async initializeComponents() {
    // Only initialize archive components when archive is opened
    // They will be initialized when needed
  }

  /**
   * Initialize archive components (simplified - no search/filters)
   */
  async initializeArchiveComponents() {
    if (this.archiveComponentsInitialized) return;
    // No components needed for simple archive
    this.archiveComponentsInitialized = true;
  }

  /**
   * Initialize services
   */
  async initializeServices() {
    // Cache elements before loading data
    this.cacheElements();
    
    // Hide filters loading state if exists
    if (this.elements.filtersLoading) {
      this.elements.filtersLoading.hidden = true;
    }
  }

  /**
   * Load page data
   */
  async loadPageData() {
    // Load upcoming events
    await this.loadUpcomingEvents();
  }

  /**
   * Load upcoming events (start_at >= now)
   */
  async loadUpcomingEvents() {
    try {
      this.showUpcomingLoading();
      this.hideUpcomingEmpty();
      this.hideUpcomingGrid();

      const now = new Date().toISOString();
      const params = new URLSearchParams();
      params.append('published', 'true');
      params.append('start_at_after', now);
      params.append('page_size', '20'); // Get more upcoming events

      const url = `${this.options.apiEndpoint}?${params.toString()}`;
      const response = await APIUtils.get(url);
      
      // Sort upcoming events by start_at ascending (most upcoming first)
      const events = response.results || [];
      this.upcomingEvents = events.sort((a, b) => {
        const dateA = a.start_at ? new Date(a.start_at).getTime() : 0;
        const dateB = b.start_at ? new Date(b.start_at).getTime() : 0;
        return dateA - dateB; // Ascending order
      });

      this.logger.info('Upcoming events loaded', {
        count: this.upcomingEvents.length
      });

      if (this.upcomingEvents.length === 0) {
        this.showUpcomingEmpty();
      } else {
        this.renderUpcomingEvents();
        this.showUpcomingGrid();
      }

      this.hideUpcomingLoading();
      
      // Show archive toggle if there are any events
      this.updateArchiveToggle();

    } catch (error) {
      this.logger.error('Error loading upcoming events', error);
      this.hideUpcomingLoading();
      this.showUpcomingEmpty();
    }
  }

  /**
   * Load archive events (simple paginated list of past events)
   */
  async loadArchiveEvents() {
    try {
      this.showArchiveLoading();
      this.hideArchiveError();
      this.hideArchiveEmpty();
      this.hideArchiveGrid();

      this.logger.debug('Loading archive events from API', {
        page: this.currentPage
      });

      const now = new Date().toISOString();
      const params = new URLSearchParams();
      params.append('published', 'true');
      params.append('start_at_before', now); // Only past events
      params.append('page', this.currentPage.toString());
      params.append('page_size', this.pageSize.toString());
      
      const url = `${this.options.apiEndpoint}?${params.toString()}`;
      const response = await APIUtils.get(url);
      
      this.archiveEvents = response.results || [];
      
      this.totalCount = response.count || 0;
      this.totalPages = response.total_pages || 1;
      this.currentPage = response.current_page || 1;

      this.logger.info('Archive events loaded successfully', {
        count: this.archiveEvents.length,
        total: this.totalCount
      });

      if (this.archiveEvents.length === 0) {
        this.showArchiveEmpty();
        this.hideArchiveGrid();
      } else {
        this.renderArchiveEvents();
        this.showArchiveGrid();
        this.hideArchiveEmpty();
      }

      this.updateArchivePagination();
      this.hideArchiveLoading();

    } catch (error) {
      this.logger.error('Error loading archive events', error);
      this.showArchiveError(error.message || _('Failed to load events'));
      this.hideArchiveLoading();
    }
  }

  /**
   * Render upcoming events in grid
   */
  renderUpcomingEvents() {
    if (!this.elements.upcomingGrid) return;

    if (this.upcomingEvents.length === 0) {
      this.elements.upcomingGrid.innerHTML = '';
      return;
    }

    const html = this.upcomingEvents.map(event => this.renderEventCard(event, 'upcoming')).join('');
    this.elements.upcomingGrid.innerHTML = html;

    // Add click handlers
    this.elements.upcomingGrid.querySelectorAll('.event-card').forEach(card => {
      const eventId = card.dataset.eventId;
      if (eventId) {
        this.addEventListener(card, 'click', () => {
          window.location.href = `/events/${eventId}/`;
        });
      }
    });
  }


  /**
   * Render archive events in grid (as cards)
   */
  renderArchiveEvents() {
    if (!this.elements.archiveEventsGrid) return;

    if (this.archiveEvents.length === 0) {
      this.elements.archiveEventsGrid.innerHTML = '';
      return;
    }

    const html = this.archiveEvents.map(event => this.renderEventCard(event, 'archive')).join('');
    this.elements.archiveEventsGrid.innerHTML = html;

    // Add click handlers
    this.elements.archiveEventsGrid.querySelectorAll('.event-card').forEach(card => {
      const eventId = card.dataset.eventId;
      if (eventId) {
        this.addEventListener(card, 'click', () => {
          window.location.href = `/events/${eventId}/`;
        });
      }
    });
  }

  /**
   * Render event card (for upcoming and archive events)
   */
  renderEventCard(event, type = 'upcoming') {
    const isUpcoming = type === 'upcoming';
    const isArchive = type === 'archive';
    const dateStr = this.formatEventDate(event.start_at, event.end_at);
    const locationStr = this.formatLocation(event.city_name, event.country_name);
    const formatBadge = event.event_format_display 
      ? `<span class="event-card__format">${this.escapeHtml(event.event_format_display)}</span>`
      : '';
    
    const statusBadge = isUpcoming 
      ? `<span class="event-card__status event-card__status--upcoming">${_('Upcoming')}</span>`
      : `<span class="event-card__status event-card__status--past">${_('Past')}</span>`;
    
    const descriptionLength = isArchive ? 120 : (isUpcoming ? 150 : 120);

    return `
      <article class="event-card event-card--${type}" data-event-id="${event.id}">
        <div class="event-card__header">
          <div class="event-card__date">${dateStr}</div>
          ${statusBadge}
        </div>
        <h3 class="event-card__title">
          <a href="/events/${event.id}/" class="event-card__link">${this.escapeHtml(event.title)}</a>
        </h3>
        ${locationStr ? `<div class="event-card__location">${this.escapeHtml(locationStr)}</div>` : ''}
        ${event.description ? `<p class="event-card__description">${this.truncateText(event.description, descriptionLength)}</p>` : ''}
        ${formatBadge}
      </article>
    `;
  }

  /**
   * Render event list item (for archive)
   */
  renderEventListItem(event) {
    const formatBadge = event.event_format_display 
      ? `<span class="tag tag--info">${this.escapeHtml(event.event_format_display)}</span>`
      : '';
    
    const dateStr = this.formatEventDate(event.start_at, event.end_at);
    const locationStr = this.formatLocation(event.city_name, event.country_name);
    const orgStr = event.organization_name 
      ? `<span class="event-item__org">${this.escapeHtml(event.organization_name)}</span>`
      : '';

    const metadataParts = [];
    if (dateStr) metadataParts.push(`<span class="event-item__date">${dateStr}</span>`);
    if (locationStr) metadataParts.push(`<span class="event-item__location">${locationStr}</span>`);
    if (orgStr) metadataParts.push(orgStr);
    const metadata = metadataParts.length > 0 
      ? `<div class="event-item__meta">${metadataParts.join(' • ')}</div>`
      : '';

    return `
      <li class="event-item document-item" data-event-id="${event.id}">
        <div class="event-item__content">
          <div class="event-item__header">
            <h3 class="event-item__title">
              <a href="/events/${event.id}/" class="event-item__link">${this.escapeHtml(event.title)}</a>
            </h3>
            ${formatBadge}
          </div>
          ${metadata}
          ${event.description ? `<p class="event-item__description">${this.truncateText(event.description, 200)}</p>` : ''}
        </div>
      </li>
    `;
  }

  /**
   * Format event date
   */
  formatEventDate(startAt, endAt) {
    if (!startAt) return '';
    
    try {
      const start = new Date(startAt);
      // Get locale from document or default to 'en'
      const locale = document.documentElement.lang || 'en';
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const startStr = start.toLocaleDateString(locale, options);
      
      if (endAt) {
        const end = new Date(endAt);
        const endStr = end.toLocaleDateString(locale, options);
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
   * Update pagination (for archive)
   */
  updateArchivePagination() {
    if (!this.elements.archivePagination || !this.options.enablePagination) return;

    // Always show pagination if there are events, even if only one page
    // This helps with testing and makes it clear pagination is available
    if (this.totalCount === 0 || this.archiveEvents.length === 0) {
      this.elements.archivePagination.innerHTML = '';
      return;
    }

    let pagination = this.getComponent('archivePagination');
    if (!pagination) {
      pagination = new Pagination(this.elements.archivePagination, {
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        totalItems: this.totalCount,
        itemsPerPage: this.pageSize
      });
      
      this.registerComponent('archivePagination', pagination);

      pagination.on(EVENTS.PAGE_CHANGED, (page) => {
        this.logger.debug('Archive page changed', { page });
        this.currentPage = page;
        this.loadArchiveEvents();
        this.elements.archiveSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      pagination.updateData({
        currentPage: this.currentPage,
        totalItems: this.totalCount,
        itemsPerPage: this.pageSize
      });
    }
    
    this.logger.debug('Archive pagination updated', {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalCount: this.totalCount,
      pageSize: this.pageSize
    });
  }

  /**
   * Update archive toggle visibility
   */
  updateArchiveToggle() {
    if (!this.elements.archiveToggle) return;
    
    // Always show toggle to access past events
    this.elements.archiveToggle.hidden = false;
  }


  /**
   * Show archive section
   */
  showArchive() {
    if (!this.elements.archiveSection) return;
    
    this.archiveMode = true;
    this.elements.archiveSection.hidden = false;
    
    // Hide the "View archive" button when archive is open
    if (this.elements.archiveToggle) {
      this.elements.archiveToggle.hidden = true;
    }
    
    // Initialize archive components if not already done
    this.initializeArchiveComponents();
    
    // Reset to first page
    this.currentPage = 1;
    
    // Load archive events
    this.loadArchiveEvents();
    
    // Scroll to archive
    this.elements.archiveSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Hide archive section
   */
  hideArchive() {
    if (!this.elements.archiveSection) return;
    
    this.archiveMode = false;
    this.elements.archiveSection.hidden = true;
    
    // Show the "View archive" button when archive is closed
    if (this.elements.archiveToggle) {
      this.elements.archiveToggle.hidden = false;
    }
    
    // Reset to first page
    this.currentPage = 1;
  }

  /**
   * Bind page events
   */
  bindPageEvents() {
    // View archive button
    if (this.elements.viewArchiveButton) {
      this.addEventListener(this.elements.viewArchiveButton, 'click', () => {
        this.showArchive();
      });
    }

    // Close archive button
    if (this.elements.archiveClose) {
      this.addEventListener(this.elements.archiveClose, 'click', () => {
        this.hideArchive();
      });
    }

  }

  // ========================================
  // Upcoming Events UI State Methods
  // ========================================

  showUpcomingLoading() {
    if (this.elements.upcomingLoading) {
      this.elements.upcomingLoading.hidden = false;
    }
  }

  hideUpcomingLoading() {
    if (this.elements.upcomingLoading) {
      this.elements.upcomingLoading.hidden = true;
    }
  }

  showUpcomingEmpty() {
    if (this.elements.upcomingEmpty) {
      this.elements.upcomingEmpty.hidden = false;
    }
  }

  hideUpcomingEmpty() {
    if (this.elements.upcomingEmpty) {
      this.elements.upcomingEmpty.hidden = true;
    }
  }

  showUpcomingGrid() {
    if (this.elements.upcomingGrid) {
      this.elements.upcomingGrid.hidden = false;
    }
  }

  hideUpcomingGrid() {
    if (this.elements.upcomingGrid) {
      this.elements.upcomingGrid.hidden = true;
    }
  }

  // ========================================
  // Archive Events UI State Methods
  // ========================================

  showArchiveLoading() {
    if (this.elements.archiveLoading) {
      this.elements.archiveLoading.hidden = false;
    }
    if (this.elements.archiveEventsGrid) {
      this.elements.archiveEventsGrid.hidden = true;
      this.elements.archiveEventsGrid.setAttribute('aria-busy', 'true');
    }
  }

  hideArchiveLoading() {
    if (this.elements.archiveLoading) {
      this.elements.archiveLoading.hidden = true;
    }
    if (this.elements.archiveEventsGrid) {
      this.elements.archiveEventsGrid.setAttribute('aria-busy', 'false');
    }
  }

  showArchiveError(message) {
    if (this.elements.archiveError) {
      this.elements.archiveError.hidden = false;
    }
    if (this.elements.archiveErrorMessage) {
      this.elements.archiveErrorMessage.textContent = message;
    }
  }

  hideArchiveError() {
    if (this.elements.archiveError) {
      this.elements.archiveError.hidden = true;
    }
  }

  showArchiveEmpty() {
    if (this.elements.archiveEmpty) {
      this.elements.archiveEmpty.hidden = false;
    }
  }

  hideArchiveEmpty() {
    if (this.elements.archiveEmpty) {
      this.elements.archiveEmpty.hidden = true;
    }
  }

  showArchiveGrid() {
    if (this.elements.archiveEventsGrid) {
      this.elements.archiveEventsGrid.hidden = false;
    }
  }

  hideArchiveGrid() {
    if (this.elements.archiveEventsGrid) {
      this.elements.archiveEventsGrid.hidden = true;
    }
  }

  /**
   * Utility: Escape HTML
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Utility: Truncate text
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return this.escapeHtml(text);
    return this.escapeHtml(text.substring(0, maxLength)) + '...';
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.logger) {
      this.logger.debug('Destroying EventsPageManager');
    }
    
    // Clear data
    this.upcomingEvents = [];
    this.archiveEvents = [];
    this.filters = {};
    this.searchQuery = '';
    
    // Reset state
    this.archiveMode = false;
    this.currentPage = 1;
    
    // Call parent destroy (this will clean up all event listeners and components)
    super.destroy();
    
    if (this.logger) {
      this.logger.info('EventsPageManager destroyed');
    }
  }
}
