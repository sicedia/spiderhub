/**
 * Event Detail Manager
 * Manages the event detail page rendering
 * ES6 Module Export
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { DOMUtils } from '../core/utils/dom.js';
import { APIUtils } from '../core/utils/api.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { gettext as _ } from '../core/i18n/i18n.js';

export class EventDetailManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    this.eventId = null;
    this.eventData = null;
    
    this.logger.info('EventDetailManager initialized');
  }

  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      apiEndpoint: '/api/v1/events/'
    };
  }

  async initializeComponents() {
    this.logger.debug('No additional components to initialize');
  }

  bindPageEvents() {
    this.logger.debug('No page-specific events to bind');
  }

  cacheElements() {
    const eventPage = DOMUtils.getElement('#event-page');
    if (eventPage) {
      this.eventId = eventPage.dataset.eventId || eventPage.getAttribute('data-event-id');
    } else {
      this.eventId = null;
    }
    
    if (!this.eventId) {
      const urlMatch = window.location.pathname.match(/\/events\/(\d+)\/?/);
      if (urlMatch && urlMatch[1]) {
        this.eventId = urlMatch[1];
      }
    }
    
    this.elements = {
      loading: DOMUtils.getElement('#event-loading'),
      error: DOMUtils.getElement('#event-error'),
      errorMessage: DOMUtils.getElement('#event-error-message'),
      content: DOMUtils.getElement('#event-content'),
      title: DOMUtils.getElement('#event-title'),
      meta: DOMUtils.getElement('#event-meta'),
      sidebar: DOMUtils.getElement('#event-sidebar'),
      description: DOMUtils.getElement('#event-description'),
      descriptionSection: DOMUtils.getElement('#section-description'),
      tagsSection: DOMUtils.getElement('#section-tags'),
      tagsContainer: DOMUtils.getElement('#tags-container'),
      sourceSection: DOMUtils.getElement('#section-source'),
      sourceContent: DOMUtils.getElement('#source-content'),
    };
  }

  async initializeServices() {
    this.cacheElements();
  }

  async loadPageData() {
    if (!this.eventId) {
      const eventPage = DOMUtils.getElement('#event-page');
      if (eventPage) {
        this.eventId = eventPage.dataset.eventId || eventPage.getAttribute('data-event-id');
      }
    }
    
    if (!this.eventId) {
      this.showError('Event ID not found');
      return;
    }
    
    this.eventId = String(this.eventId).trim();
    if (!this.eventId) {
      this.showError('Event ID not found');
      return;
    }
    
    await this.loadEvent();
  }

  async loadEvent() {
    try {
      this.showLoading();
      this.hideError();

      eventBus.emit(EVENTS.EVENT_LOADING_START, { eventId: this.eventId });

      const url = `${this.options.apiEndpoint}${this.eventId}/`;
      this.eventData = await APIUtils.get(url);
      
      this.logger.info('Event loaded', { eventId: this.eventId, title: this.eventData.title });

      this.renderEvent();
      this.hideLoading();

      eventBus.emit(EVENTS.EVENT_LOADED, { eventId: this.eventId, eventData: this.eventData });
      eventBus.emit(EVENTS.EVENT_CONTENT_READY, { eventId: this.eventId });

    } catch (error) {
      this.logger.error('Error loading event', error);
      eventBus.emit(EVENTS.EVENT_LOAD_ERROR, { eventId: this.eventId, error: error.message });
      
      let message = 'Failed to load event';
      if (error.status === 404) message = 'Event not found';
      else if (error.code === 'NETWORK_ERROR') message = 'Network error. Please check your connection.';
      else if (error.code === 'TIMEOUT') message = 'Request timeout. Please try again.';
      else if (error.message) message = error.message;
      
      this.showError(message);
      this.hideLoading();
    }
  }

  // ─── Source config ────────────────────────────────────
  getSourceConfig(ev) {
    const defaults = {
      oas: { color: '#1B5E8C', label: 'OAS' },
      itu: { color: '#0072BC', label: 'ITU' },
      caf: { color: '#00A651', label: 'CAF' },
      idrc: { color: '#2E3192', label: 'IDRC' },
      iesalc: { color: '#0077C8', label: 'IESALC' },
      eucelac: { color: '#003399', label: 'EU-CELAC' },
      iadb: { color: '#005DA6', label: 'IDB' },
    };
    const d = defaults[ev.source_slug] || { color: '#6B7280', label: (ev.source_slug || '?').toUpperCase() };
    return {
      ...d,
      logoUrl: ev.source_logo_url || '',
      fullName: ev.source_name || d.label,
    };
  }

  // ─── Render ───────────────────────────────────────────
  renderEvent() {
    if (!this.eventData) return;
    const ev = this.eventData;

    if (this.elements.title) {
      this.elements.title.textContent = ev.title || 'Untitled Event';
    }

    document.title = `${ev.title || 'Event'} - SPIDERHUB`;

    this.renderMeta();
    this.renderSidebar();
    this.renderImage();
    this.renderDescription();
    this.renderTags();
    this.renderSource();

    if (this.elements.content) {
      this.elements.content.hidden = false;
    }
  }

  renderMeta() {
    if (!this.elements.meta) return;
    const ev = this.eventData;
    const src = this.getSourceConfig(ev);

    let html = '';

    const logoHtml = src.logoUrl
      ? `<img src="${this.escapeHtml(src.logoUrl)}" alt="${this.escapeHtml(src.label)}" class="event-meta__source-img" />`
      : `<span class="event-meta__source-badge" style="--source-color: ${src.color}">${this.escapeHtml(src.label)}</span>`;

    html += `
      <div class="event-meta__row event-meta__row--primary">
        ${logoHtml}`;

    if (ev.start_at) {
      const dateStr = this.formatEventDate(ev.start_at, ev.end_at);
      html += `
        <span class="event-meta__item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          ${this.escapeHtml(dateStr)}
        </span>`;
    }

    const locationStr = ev.location_text || ev.country_name || '';
    if (locationStr) {
      html += `
        <span class="event-meta__item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${this.escapeHtml(locationStr)}
        </span>`;
    }

    if (ev.modality_display) {
      const modalityIcon = ev.modality === 'virtual'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
        : ev.modality === 'hybrid'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
      html += `
        <span class="event-meta__badge event-meta__badge--modality">${modalityIcon} ${this.escapeHtml(ev.modality_display)}</span>`;
    }

    html += `</div>`;

    if (ev.organizer) {
      html += `
        <div class="event-meta__row event-meta__row--secondary">
          <span class="event-meta__item event-meta__item--org">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/></svg>
            ${_('Organized by')} <strong>${this.escapeHtml(ev.organizer)}</strong>
          </span>
        </div>`;
    }

    this.elements.meta.innerHTML = html;
  }

  renderSidebar() {
    if (!this.elements.sidebar) return;
    const ev = this.eventData;
    const src = this.getSourceConfig(ev);

    let html = '';

    // Action buttons
    if (ev.source_url) {
      html += `
        <a href="${this.escapeHtml(ev.source_url)}" target="_blank" rel="noopener"
           class="event-sidebar__action event-sidebar__action--primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          ${_('View on')} ${this.escapeHtml(ev.source_name || src.label)}
        </a>`;
    }

    if (ev.registration_url) {
      html += `
        <a href="${this.escapeHtml(ev.registration_url)}" target="_blank" rel="noopener"
           class="event-sidebar__action event-sidebar__action--register">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          ${_('Register')}
        </a>`;
    }

    // Quick info card
    html += `<div class="event-sidebar__info">`;
    html += `<h3 class="event-sidebar__info-title">${_('Event details')}</h3>`;

    const infoRows = [];
    
    if (ev.start_at) {
      const dateStr = this.formatEventDate(ev.start_at, ev.end_at);
      infoRows.push({ label: _('Date'), value: dateStr });
    }
    if (ev.location_text || ev.country_name) {
      infoRows.push({ label: _('Location'), value: ev.location_text || ev.country_name });
    }
    if (ev.modality_display) {
      infoRows.push({ label: _('Format'), value: ev.modality_display });
    }
    if (ev.category_display && ev.category !== 'other') {
      infoRows.push({ label: _('Category'), value: ev.category_display });
    }
    if (ev.organizer) {
      infoRows.push({ label: _('Organizer'), value: ev.organizer });
    }
    if (ev.language) {
      const langNames = { en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese' };
      infoRows.push({ label: _('Language'), value: langNames[ev.language] || ev.language.toUpperCase() });
    }

    for (const row of infoRows) {
      html += `
        <div class="event-sidebar__row">
          <span class="event-sidebar__label">${this.escapeHtml(row.label)}</span>
          <span class="event-sidebar__value">${this.escapeHtml(row.value)}</span>
        </div>`;
    }

    html += `</div>`;

    // Source attribution card with real logo
    const srcLogoHtml = src.logoUrl
      ? `<img src="${this.escapeHtml(src.logoUrl)}" alt="${this.escapeHtml(src.label)}" class="event-sidebar__source-logo-img" />`
      : `<span class="event-sidebar__source-logo" style="background:${src.color}">${this.escapeHtml(src.label)}</span>`;

    html += `
      <div class="event-sidebar__source" style="--source-color: ${src.color}">
        ${srcLogoHtml}
        <div class="event-sidebar__source-info">
          <span class="event-sidebar__source-name">${this.escapeHtml(src.fullName)}</span>
          <a href="${this.escapeHtml(ev.source_base_url || '#')}" target="_blank" rel="noopener"
             class="event-sidebar__source-url">${this.escapeHtml((ev.source_base_url || '').replace(/^https?:\/\//, ''))}</a>
        </div>
      </div>`;

    this.elements.sidebar.innerHTML = html;
  }

  renderImage() {
    const ev = this.eventData;
    if (!ev.image_url) return;

    const imgSection = document.getElementById('section-image');
    if (imgSection) {
      const imgContainer = document.getElementById('event-image');
      if (imgContainer) {
        imgContainer.innerHTML = `<img src="${this.escapeHtml(ev.image_url)}" alt="${this.escapeHtml(ev.title)}" class="event-hero-image" loading="lazy" />`;
      }
      imgSection.hidden = false;
    }
  }

  renderDescription() {
    const text = this.eventData.description || this.eventData.summary || '';
    if (!text.trim()) {
      if (this.elements.descriptionSection) {
        this.elements.descriptionSection.hidden = true;
      }
      return;
    }

    if (this.elements.description) {
      this.elements.description.textContent = text;
    }
    if (this.elements.descriptionSection) {
      this.elements.descriptionSection.hidden = false;
    }
  }

  renderTags() {
    const tags = this.eventData.tags_raw || [];
    if (tags.length === 0) {
      if (this.elements.tagsSection) this.elements.tagsSection.hidden = true;
      return;
    }

    if (this.elements.tagsContainer) {
      this.elements.tagsContainer.innerHTML = tags
        .map(tag => `<span class="event-tag">${this.escapeHtml(tag)}</span>`)
        .join('');
    }
    if (this.elements.tagsSection) this.elements.tagsSection.hidden = false;
  }

  renderSource() {
    if (!this.elements.sourceSection || !this.elements.sourceContent) return;
    const ev = this.eventData;
    if (!ev.source_url) {
      this.elements.sourceSection.hidden = true;
      return;
    }

    const src = this.getSourceConfig(ev);
    const srcLogoHtml = src.logoUrl
      ? `<img src="${this.escapeHtml(src.logoUrl)}" alt="${this.escapeHtml(src.label)}" class="event-source-card__logo-img" />`
      : `<span class="event-source-card__logo" style="background:${src.color}">${this.escapeHtml(src.label)}</span>`;

    this.elements.sourceContent.innerHTML = `
      <div class="event-source-card" style="--source-color: ${src.color}">
        <div class="event-source-card__header">
          ${srcLogoHtml}
          <div>
            <strong>${this.escapeHtml(src.fullName)}</strong>
            <p>${_('This event was sourced from')} ${this.escapeHtml(ev.source_name || src.label)}.</p>
          </div>
        </div>
        <a href="${this.escapeHtml(ev.source_url)}" target="_blank" rel="noopener" class="event-source-card__link">
          ${_('View original event page')}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
      </div>`;
    this.elements.sourceSection.hidden = false;
  }

  formatEventDate(startAt, endAt) {
    if (!startAt) return '';
    try {
      const start = new Date(startAt);
      const locale = document.documentElement.lang || 'en';
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      const startStr = start.toLocaleDateString(locale, options);
      
      if (endAt) {
        const end = new Date(endAt);
        const endStr = end.toLocaleDateString(locale, options);
        if (startStr === endStr) return startStr;
        return `${startStr} – ${endStr}`;
      }
      return startStr;
    } catch (e) {
      return '';
    }
  }

  showLoading() {
    if (this.elements.loading) this.elements.loading.hidden = false;
    if (this.elements.content) this.elements.content.hidden = true;
  }

  hideLoading() {
    if (this.elements.loading) this.elements.loading.hidden = true;
  }

  showError(message) {
    if (this.elements.error) this.elements.error.hidden = false;
    if (this.elements.errorMessage) this.elements.errorMessage.textContent = message;
    if (this.elements.content) this.elements.content.hidden = true;
  }

  hideError() {
    if (this.elements.error) this.elements.error.hidden = true;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
