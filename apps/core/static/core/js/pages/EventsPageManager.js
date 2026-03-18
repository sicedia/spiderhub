/**
 * Events Page Manager
 * Manages the events discovery page with upcoming and past events
 * ES6 Module Export
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { DOMUtils } from '../core/utils/dom.js';
import { APIUtils } from '../core/utils/api.js';
import { EVENTS } from '../core/constants/config.js';
import { Pagination } from '../components/navigation/Pagination.js';
import { gettext as _ } from '../core/i18n/i18n.js';

export class EventsPageManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);

    // Upcoming state
    this.upcomingPage = 1;
    this.upcomingTotalPages = 1;
    this.upcomingTotalCount = 0;
    this.upcomingFilters = {};
    this.upcomingEvents = [];

    // Archive state
    this.archiveMode = false;
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalCount = 0;
    this.archiveEvents = [];

    this.pageSize = this.options.pageSize || 20;

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
      sourcesEndpoint: '/api/v1/events/sources/',
      pageSize: 20,
      enablePagination: true,
    };
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Sources bar
      sourcesBar: DOMUtils.getElement('#events-sources'),
      sourcesList: DOMUtils.getElement('#events-sources-list'),
      sourcesFooter: DOMUtils.getElement('#events-sources-footer'),

      // Filters
      filterSource: DOMUtils.getElement('#filter-source'),
      filterCategory: DOMUtils.getElement('#filter-category'),
      filterModality: DOMUtils.getElement('#filter-modality'),
      filterClear: DOMUtils.getElement('#filter-clear'),

      // Upcoming events section
      upcomingSection: DOMUtils.getElement('.events-section--upcoming'),
      upcomingLoading: DOMUtils.getElement('#upcoming-loading'),
      upcomingEmpty: DOMUtils.getElement('#upcoming-empty'),
      upcomingGrid: DOMUtils.getElement('#upcoming-events-grid'),
      upcomingPagination: DOMUtils.getElement('#upcoming-pagination'),

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
   * Initialize services
   */
  async initializeServices() {
    this.cacheElements();
  }

  /**
   * Load page data
   */
  async loadPageData() {
    await Promise.all([
      this.loadSources(),
      this.loadUpcomingEvents(),
    ]);
  }

  /**
   * Load active event sources for the logos strip
   */
  async loadSources() {
    try {
      const sources = await APIUtils.get(this.options.sourcesEndpoint);
      if (!Array.isArray(sources) || sources.length === 0) return;

      this.renderSourcesBar(sources);
      this.populateSourceFilter(sources);
    } catch (error) {
      this.logger.warn('Could not load event sources', error);
    }
  }

  /**
   * Populate the source filter <select> with fetched sources
   */
  populateSourceFilter(sources) {
    const sel = this.elements.filterSource;
    if (!sel) return;

    const current = sel.value;
    while (sel.options.length > 1) sel.remove(1);

    for (const src of sources) {
      const opt = document.createElement('option');
      opt.value = src.slug;
      opt.textContent = src.event_count > 0
        ? `${src.name} (${src.event_count})`
        : src.name;
      sel.appendChild(opt);
    }

    if (current) sel.value = current;
  }

  /**
   * Render the sources logo bar
   */
  renderSourcesBar(sources) {
    if (!this.elements.sourcesList || !this.elements.sourcesBar) return;

    const totalEvents = sources.reduce((sum, s) => sum + (s.event_count || 0), 0);
    const activeSources = sources.filter(s => s.event_count > 0).length;

    const html = sources.map(src => {
      const cfg = this.getSourceConfig({ source_slug: src.slug, source_name: src.name, source_logo_url: src.logo_url });
      const hasEvents = src.event_count > 0;
      const itemClass = hasEvents ? 'events-sources__item' : 'events-sources__item events-sources__item--empty';

      const logoInner = src.logo_url
        ? `<img src="${this.escapeHtml(src.logo_url)}" alt="${this.escapeHtml(src.name)}" class="events-sources__logo-img" />`
        : `<span class="events-sources__logo-text" style="background:${cfg.color}">${this.escapeHtml(cfg.label)}</span>`;

      const countBadge = hasEvents
        ? `<span class="events-sources__count">${src.event_count}</span>`
        : '';

      const tooltip = hasEvents
        ? `${src.event_count} ${src.event_count === 1 ? _('event') : _('events')}`
        : _('No upcoming events');

      return `
        <a href="${this.escapeHtml(src.events_url || src.base_url)}" target="_blank" rel="noopener"
           class="${itemClass}" title="${this.escapeHtml(src.name)} — ${tooltip}">
          <div class="events-sources__logo-wrap">${logoInner}${countBadge}</div>
          <span class="events-sources__name">${this.escapeHtml(src.name)}</span>
        </a>`;
    }).join('');

    this.elements.sourcesList.innerHTML = html;

    if (this.elements.sourcesFooter) {
      const infoIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="events-sources__info-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
      this.elements.sourcesFooter.innerHTML = `
        <div class="events-sources__footer-inner">
          <span class="events-sources__stat">
            ${infoIcon}
            ${totalEvents} ${_('upcoming events from')} ${activeSources} ${_('of')} ${sources.length} ${_('monitored sources')}
          </span>
          <span class="events-sources__filter-note">${_('Events are filtered for relevance — courses, MOOCs and similar are excluded.')}</span>
        </div>`;
    }

    this.elements.sourcesBar.hidden = false;
  }

  /**
   * Read current values from filter selects
   */
  readFilters() {
    this.upcomingFilters = {};
    const source = this.elements.filterSource?.value;
    const category = this.elements.filterCategory?.value;
    const modality = this.elements.filterModality?.value;
    if (source) this.upcomingFilters.source = source;
    if (category) this.upcomingFilters.category = category;
    if (modality) this.upcomingFilters.modality = modality;
  }

  /**
   * Show/hide the clear-filters button based on active filters
   */
  updateClearButton() {
    if (!this.elements.filterClear) return;
    const active = Object.keys(this.upcomingFilters).length > 0;
    this.elements.filterClear.hidden = !active;
  }

  /**
   * Load upcoming events (start_at >= now) with pagination and filters
   */
  async loadUpcomingEvents() {
    try {
      this.showUpcomingLoading();
      this.hideUpcomingEmpty();
      this.hideUpcomingGrid();

      const now = new Date().toISOString();
      const params = new URLSearchParams();
      params.append('start_at_after', now);
      params.append('page', this.upcomingPage.toString());
      params.append('page_size', this.pageSize.toString());

      for (const [key, val] of Object.entries(this.upcomingFilters)) {
        params.append(key, val);
      }

      const url = `${this.options.apiEndpoint}?${params.toString()}`;
      const response = await APIUtils.get(url);

      this.upcomingEvents = response.results || [];
      this.upcomingTotalCount = response.count || 0;
      this.upcomingTotalPages = response.total_pages || 1;
      this.upcomingPage = response.current_page || 1;

      this.logger.info('Upcoming events loaded', {
        count: this.upcomingEvents.length,
        total: this.upcomingTotalCount,
        page: this.upcomingPage,
      });

      if (this.upcomingEvents.length === 0) {
        this.showUpcomingEmpty();
      } else {
        this.renderUpcomingEvents();
        this.showUpcomingGrid();
      }

      this.updateUpcomingPagination();
      this.hideUpcomingLoading();
      this.updateArchiveToggle();

    } catch (error) {
      this.logger.error('Error loading upcoming events', error);
      this.hideUpcomingLoading();
      this.showUpcomingEmpty();
    }
  }

  /**
   * Update upcoming pagination component (mirrors archive pattern)
   */
  updateUpcomingPagination() {
    if (!this.elements.upcomingPagination || !this.options.enablePagination) return;

    if (this.upcomingTotalCount === 0 || this.upcomingEvents.length === 0) {
      this.elements.upcomingPagination.innerHTML = '';
      return;
    }

    this.elements.upcomingPagination.innerHTML = '';

    const pagination = new Pagination(this.elements.upcomingPagination, {
      currentPage: this.upcomingPage,
      totalPages: this.upcomingTotalPages,
      totalItems: this.upcomingTotalCount,
      itemsPerPage: this.pageSize,
      showItemsPerPageSelector: false,
    });

    pagination.render();
    pagination.bindEvents();

    pagination.on(EVENTS.PAGE_CHANGED, (data) => {
      this.upcomingPage = data.currentPage;
      this.loadUpcomingEvents();
      this.elements.upcomingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
   * Get source visual config (color + abbreviation)
   */
  getSourceConfig(event) {
    const defaults = {
      oas: { color: '#1B5E8C', label: 'OAS' },
      itu: { color: '#0072BC', label: 'ITU' },
      caf: { color: '#00A651', label: 'CAF' },
      idrc: { color: '#2E3192', label: 'IDRC' },
      iesalc: { color: '#0077C8', label: 'IESALC' },
      eucelac: { color: '#003399', label: 'EU-CELAC' },
      iadb: { color: '#005DA6', label: 'IDB' },
      eclac: { color: '#1A3668', label: 'ECLAC' },
    };
    const d = defaults[event.source_slug] || { color: '#6B7280', label: (event.source_slug || '?').toUpperCase() };
    return {
      ...d,
      logoUrl: event.source_logo_url || '',
      fullName: event.source_name || d.label,
    };
  }

  /**
   * Render event card (for upcoming and archive events)
   */
  renderEventCard(event, type = 'upcoming') {
    const isUpcoming = type === 'upcoming';
    const dateStr = this.formatEventDate(event.start_at, event.end_at);
    const locationStr = event.location_text || event.country_name || '';
    const summaryText = event.summary || event.description || '';
    const descriptionLength = isUpcoming ? 150 : 120;
    const src = this.getSourceConfig(event);

    // Thumbnail image (if available from scraper)
    const thumbnail = event.image_url
      ? `<div class="event-card__thumb">
           <img src="${this.escapeHtml(event.image_url)}" alt="" loading="lazy" />
         </div>`
      : '';

    // Source logo (real image or colored text fallback)
    const logoInner = src.logoUrl
      ? `<img src="${this.escapeHtml(src.logoUrl)}" alt="${this.escapeHtml(src.label)}" class="event-card__logo-img" />`
      : `<span class="event-card__logo-text" style="background:${src.color}">${this.escapeHtml(src.label)}</span>`;

    const sourceBadge = `
      <a href="${this.escapeHtml(event.source_url || '#')}" target="_blank" rel="noopener"
         class="event-card__source" title="${this.escapeHtml(src.fullName)}" onclick="event.stopPropagation()">
        ${logoInner}
      </a>`;

    const modalityBadge = event.modality_display 
      ? `<span class="event-card__badge event-card__badge--modality">${this.escapeHtml(event.modality_display)}</span>`
      : '';

    const categoryBadge = event.category_display && event.category !== 'other'
      ? `<span class="event-card__badge event-card__badge--category">${this.escapeHtml(event.category_display)}</span>`
      : '';

    const orgLine = event.organizer
      ? `<span class="event-card__organizer">${_('By')} ${this.escapeHtml(event.organizer)}</span>`
      : '';

    const sourceLink = event.source_url
      ? `<a href="${this.escapeHtml(event.source_url)}" target="_blank" rel="noopener"
            class="event-card__source-link" onclick="event.stopPropagation()"
            title="${_('View on')} ${this.escapeHtml(src.fullName)}">${_('View original')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>`
      : '';

    return `
      <article class="event-card event-card--${type}" data-event-id="${event.id}">
        ${thumbnail}
        <div class="event-card__body">
          <div class="event-card__header">
            ${sourceBadge}
            <div class="event-card__date-block">
              <span class="event-card__date">${dateStr}</span>
              ${orgLine}
            </div>
          </div>
          <h3 class="event-card__title">
            <a href="/events/${event.id}/" class="event-card__link">${this.escapeHtml(event.title)}</a>
          </h3>
          ${locationStr ? `<div class="event-card__location">${this.escapeHtml(locationStr)}</div>` : ''}
          ${summaryText ? `<p class="event-card__description">${this.truncateText(summaryText, descriptionLength)}</p>` : ''}
          <div class="event-card__footer">
            <div class="event-card__badges">${modalityBadge}${categoryBadge}</div>
            ${sourceLink}
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render event list item (for archive)
   */
  renderEventListItem(event) {
    const modalityBadge = event.modality_display 
      ? `<span class="tag tag--info">${this.escapeHtml(event.modality_display)}</span>`
      : '';
    
    const dateStr = this.formatEventDate(event.start_at, event.end_at);
    const locationStr = event.location_text || event.country_name || '';
    const orgStr = event.organizer 
      ? `<span class="event-item__org">${this.escapeHtml(event.organizer)}</span>`
      : '';

    const metadataParts = [];
    if (dateStr) metadataParts.push(`<span class="event-item__date">${dateStr}</span>`);
    if (locationStr) metadataParts.push(`<span class="event-item__location">${locationStr}</span>`);
    if (orgStr) metadataParts.push(orgStr);
    const metadata = metadataParts.length > 0 
      ? `<div class="event-item__meta">${metadataParts.join(' • ')}</div>`
      : '';

    const summaryText = event.summary || event.description || '';

    return `
      <li class="event-item document-item" data-event-id="${event.id}">
        <div class="event-item__content">
          <div class="event-item__header">
            <h3 class="event-item__title">
              <a href="/events/${event.id}/" class="event-item__link">${this.escapeHtml(event.title)}</a>
            </h3>
            ${modalityBadge}
          </div>
          ${metadata}
          ${summaryText ? `<p class="event-item__description">${this.truncateText(summaryText, 200)}</p>` : ''}
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

    if (this.totalCount === 0 || this.archiveEvents.length === 0) {
      this.elements.archivePagination.innerHTML = '';
      return;
    }

    this.elements.archivePagination.innerHTML = '';

    const pagination = new Pagination(this.elements.archivePagination, {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.totalCount,
      itemsPerPage: this.pageSize,
      showItemsPerPageSelector: false,
    });

    pagination.render();
    pagination.bindEvents();

    pagination.on(EVENTS.PAGE_CHANGED, (data) => {
      this.currentPage = data.currentPage;
      this.loadArchiveEvents();
      this.elements.archiveSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    // Filter selects
    const onFilterChange = () => {
      this.readFilters();
      this.updateClearButton();
      this.upcomingPage = 1;
      this.loadUpcomingEvents();
    };

    for (const sel of [this.elements.filterSource, this.elements.filterCategory, this.elements.filterModality]) {
      if (sel) this.addEventListener(sel, 'change', onFilterChange);
    }

    // Clear filters
    if (this.elements.filterClear) {
      this.addEventListener(this.elements.filterClear, 'click', () => {
        if (this.elements.filterSource) this.elements.filterSource.value = '';
        if (this.elements.filterCategory) this.elements.filterCategory.value = '';
        if (this.elements.filterModality) this.elements.filterModality.value = '';
        onFilterChange();
      });
    }

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
    
    this.upcomingEvents = [];
    this.archiveEvents = [];
    this.upcomingFilters = {};

    this.archiveMode = false;
    this.upcomingPage = 1;
    this.currentPage = 1;
    
    // Call parent destroy (this will clean up all event listeners and components)
    super.destroy();
    
    if (this.logger) {
      this.logger.info('EventsPageManager destroyed');
    }
  }
}
