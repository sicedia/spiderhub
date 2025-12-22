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

export class EventDetailManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    this.eventId = null;
    this.eventData = null;
    
    this.logger.info('EventDetailManager initialized');
  }

  /**
   * Default options
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      apiEndpoint: '/api/v1/events/'
    };
  }

  /**
   * Initialize components
   */
  async initializeComponents() {
    // No additional components needed for event detail page
    this.logger.debug('No additional components to initialize');
  }

  /**
   * Bind page events
   */
  bindPageEvents() {
    // No page-specific events needed for event detail page
    this.logger.debug('No page-specific events to bind');
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    // Get event ID from data attribute
    const eventPage = DOMUtils.getElement('#event-page');
    if (eventPage) {
      // Try both camelCase and kebab-case
      this.eventId = eventPage.dataset.eventId || eventPage.getAttribute('data-event-id');
      if (this.logger) {
        this.logger.debug('Event ID from DOM', { 
          eventId: this.eventId,
          dataset: eventPage.dataset,
          hasAttribute: eventPage.hasAttribute('data-event-id')
        });
      }
    } else {
      if (this.logger) {
        this.logger.warn('Event page element not found');
      }
      this.eventId = null;
    }
    
    // Fallback: try to get event ID from URL if not found in DOM
    if (!this.eventId) {
      const urlMatch = window.location.pathname.match(/\/events\/(\d+)\/?/);
      if (urlMatch && urlMatch[1]) {
        this.eventId = urlMatch[1];
        if (this.logger) {
          this.logger.info('Event ID extracted from URL', { eventId: this.eventId });
        }
      }
    }
    
    this.elements = {
      loading: DOMUtils.getElement('#event-loading'),
      error: DOMUtils.getElement('#event-error'),
      errorMessage: DOMUtils.getElement('#event-error-message'),
      content: DOMUtils.getElement('#event-content'),
      title: DOMUtils.getElement('#event-title'),
      meta: DOMUtils.getElement('#event-meta'),
      description: DOMUtils.getElement('#event-description'),
      descriptionSection: DOMUtils.getElement('#section-description'),
      links: DOMUtils.getElement('#event-links'),
      linksSection: DOMUtils.getElement('#section-links'),
      documents: DOMUtils.getElement('#event-documents'),
      documentsSection: DOMUtils.getElement('#section-documents'),
      themesContainer: DOMUtils.getElement('#themes-container'),
      actorsContainer: DOMUtils.getElement('#actors-container'),
      sdgsContainer: DOMUtils.getElement('#sdgs-container'),
      beneficiariesContainer: DOMUtils.getElement('#beneficiaries-container'),
      euPoliciesContainer: DOMUtils.getElement('#eu-policies-container'),
      taxonomySection: DOMUtils.getElement('#section-taxonomy'),
      taxonomyThemes: DOMUtils.getElement('#taxonomy-themes'),
      taxonomyActors: DOMUtils.getElement('#taxonomy-actors'),
      taxonomySdgs: DOMUtils.getElement('#taxonomy-sdgs'),
      taxonomyBeneficiaries: DOMUtils.getElement('#taxonomy-beneficiaries'),
      taxonomyEuPolicies: DOMUtils.getElement('#taxonomy-eu-policies')
    };
  }

  /**
   * Initialize services
   */
  async initializeServices() {
    // Cache elements before loading data
    this.cacheElements();
  }

  /**
   * Load page data
   */
  async loadPageData() {
    // Re-check eventId if it wasn't found initially
    if (!this.eventId) {
      const eventPage = DOMUtils.getElement('#event-page');
      if (eventPage) {
        this.eventId = eventPage.dataset.eventId || eventPage.getAttribute('data-event-id');
        this.logger.debug('Re-checked event ID', { eventId: this.eventId });
      }
    }
    
    if (!this.eventId) {
      this.logger.error('Event ID not found in DOM');
      this.showError('Event ID not found');
      return;
    }
    
    // Ensure eventId is a string for the API call
    this.eventId = String(this.eventId).trim();
    
    if (!this.eventId) {
      this.logger.error('Event ID is empty after processing');
      this.showError('Event ID not found');
      return;
    }
    
    this.logger.info('Loading event data', { eventId: this.eventId });
    await this.loadEvent();
  }

  /**
   * Load event from API
   */
  async loadEvent() {
    try {
      this.showLoading();
      this.hideError();

      this.logger.debug('Loading event from API', { eventId: this.eventId });

      eventBus.emit(EVENTS.EVENT_LOADING_START, {
        eventId: this.eventId
      });

      const url = `${this.options.apiEndpoint}${this.eventId}/`;
      this.logger.debug('Fetching event from API', { url, eventId: this.eventId });
      this.eventData = await APIUtils.get(url);
      
      this.logger.info('Event loaded successfully', {
        eventId: this.eventId,
        title: this.eventData.title
      });

      this.renderEvent();
      this.hideLoading();

      eventBus.emit(EVENTS.EVENT_LOADED, {
        eventId: this.eventId,
        eventData: this.eventData
      });

      eventBus.emit(EVENTS.EVENT_CONTENT_READY, {
        eventId: this.eventId
      });

    } catch (error) {
      this.logger.error('Error loading event', error, {
        eventId: this.eventId,
        errorMessage: error.message,
        errorStatus: error.status,
        errorCode: error.code,
        errorStack: error.stack
      });
      
      eventBus.emit(EVENTS.EVENT_LOAD_ERROR, {
        eventId: this.eventId,
        error: error.message
      });
      
      let message = 'Failed to load event';
      if (error.status === 404) {
        message = 'Event not found';
      } else if (error.code === 'NETWORK_ERROR') {
        message = 'Network error. Please check your connection.';
      } else if (error.code === 'TIMEOUT') {
        message = 'Request timeout. Please try again.';
      } else if (error.message) {
        message = error.message;
      }
      
      this.showError(message);
      this.hideLoading();
    }
  }

  /**
   * Render event content
   */
  renderEvent() {
    if (!this.eventData) return;

    // Render title
    if (this.elements.title) {
      this.elements.title.textContent = this.eventData.title || 'Untitled Event';
    }

    // Render meta information
    this.renderMeta();

    // Render description
    this.renderDescription();

    // Render links
    this.renderLinks();

    // Render taxonomy
    this.renderTaxonomy();

    // Render related documents
    this.renderDocuments();

    // Show content
    if (this.elements.content) {
      this.elements.content.hidden = false;
    }
  }

  /**
   * Render meta information
   */
  renderMeta() {
    if (!this.elements.meta) return;

    const parts = [];

    // Date range
    if (this.eventData.start_at) {
      const dateStr = this.formatEventDate(this.eventData.start_at, this.eventData.end_at);
      if (dateStr) {
        parts.push(`<span class="event-meta__date">${this.escapeHtml(dateStr)}</span>`);
      }
    }

    // Location
    const locationStr = this.formatLocation(this.eventData.city_name, this.eventData.country_name);
    if (locationStr) {
      parts.push(`<span class="event-meta__location">${this.escapeHtml(locationStr)}</span>`);
    }

    // Format badge
    if (this.eventData.event_format_display) {
      parts.push(`<span class="tag tag--info">${this.escapeHtml(this.eventData.event_format_display)}</span>`);
    }

    // Organization
    if (this.eventData.organization_name) {
      parts.push(`<span class="event-meta__org">${this.escapeHtml(this.eventData.organization_name)}</span>`);
    }

    this.elements.meta.innerHTML = parts.join(' • ');
  }

  /**
   * Render description
   */
  renderDescription() {
    if (!this.eventData.description || !this.eventData.description.trim()) {
      if (this.elements.descriptionSection) {
        this.elements.descriptionSection.hidden = true;
      }
      return;
    }

    if (this.elements.description) {
      this.elements.description.textContent = this.eventData.description;
    }
    if (this.elements.descriptionSection) {
      this.elements.descriptionSection.hidden = false;
    }
  }

  /**
   * Render links
   */
  renderLinks() {
    if (!this.eventData.links || this.eventData.links.length === 0) {
      if (this.elements.linksSection) {
        this.elements.linksSection.hidden = true;
      }
      return;
    }

    if (this.elements.links) {
      const linksHtml = this.eventData.links.map(link => {
        const label = link.label || link.link_type || 'Link';
        return `
          <a href="${this.escapeHtml(link.url)}" 
             target="_blank" 
             rel="noopener noreferrer" 
             class="event-link">
            <span class="event-link__label">${this.escapeHtml(label)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        `;
      }).join('');
      this.elements.links.innerHTML = linksHtml;
    }
    if (this.elements.linksSection) {
      this.elements.linksSection.hidden = false;
    }
  }

  /**
   * Render taxonomy chips
   */
  renderTaxonomy() {
    let hasAnyTaxonomy = false;

    // Themes
    if (this.eventData.themes && this.eventData.themes.length > 0) {
      hasAnyTaxonomy = true;
      if (this.elements.themesContainer) {
        this.elements.themesContainer.innerHTML = this.eventData.themes
          .map(theme => `<span class="tag tag--theme">${this.escapeHtml(theme.name)}</span>`)
          .join('');
      }
      if (this.elements.taxonomyThemes) {
        this.elements.taxonomyThemes.hidden = false;
      }
    } else {
      if (this.elements.taxonomyThemes) {
        this.elements.taxonomyThemes.hidden = true;
      }
    }

    // Actors
    if (this.eventData.actors && this.eventData.actors.length > 0) {
      hasAnyTaxonomy = true;
      if (this.elements.actorsContainer) {
        this.elements.actorsContainer.innerHTML = this.eventData.actors
          .map(actor => `<span class="tag tag--actor">${this.escapeHtml(actor.name)}</span>`)
          .join('');
      }
      if (this.elements.taxonomyActors) {
        this.elements.taxonomyActors.hidden = false;
      }
    } else {
      if (this.elements.taxonomyActors) {
        this.elements.taxonomyActors.hidden = true;
      }
    }

    // SDGs
    if (this.eventData.sdgs && this.eventData.sdgs.length > 0) {
      hasAnyTaxonomy = true;
      if (this.elements.sdgsContainer) {
        this.elements.sdgsContainer.innerHTML = this.eventData.sdgs
          .map(sdg => `<span class="tag tag--sdg">SDG ${sdg.number}: ${this.escapeHtml(sdg.label)}</span>`)
          .join('');
      }
      if (this.elements.taxonomySdgs) {
        this.elements.taxonomySdgs.hidden = false;
      }
    } else {
      if (this.elements.taxonomySdgs) {
        this.elements.taxonomySdgs.hidden = true;
      }
    }

    // Beneficiary Groups
    if (this.eventData.beneficiary_groups && this.eventData.beneficiary_groups.length > 0) {
      hasAnyTaxonomy = true;
      if (this.elements.beneficiariesContainer) {
        this.elements.beneficiariesContainer.innerHTML = this.eventData.beneficiary_groups
          .map(bg => `<span class="tag tag--beneficiary">${this.escapeHtml(bg.name)}</span>`)
          .join('');
      }
      if (this.elements.taxonomyBeneficiaries) {
        this.elements.taxonomyBeneficiaries.hidden = false;
      }
    } else {
      if (this.elements.taxonomyBeneficiaries) {
        this.elements.taxonomyBeneficiaries.hidden = true;
      }
    }

    // EU Policy Alignments
    if (this.eventData.eu_policy_alignments && this.eventData.eu_policy_alignments.length > 0) {
      hasAnyTaxonomy = true;
      if (this.elements.euPoliciesContainer) {
        this.elements.euPoliciesContainer.innerHTML = this.eventData.eu_policy_alignments
          .map(policy => `<span class="tag tag--policy">${this.escapeHtml(policy.name)}</span>`)
          .join('');
      }
      if (this.elements.taxonomyEuPolicies) {
        this.elements.taxonomyEuPolicies.hidden = false;
      }
    } else {
      if (this.elements.taxonomyEuPolicies) {
        this.elements.taxonomyEuPolicies.hidden = true;
      }
    }

    // Show/hide taxonomy section
    if (this.elements.taxonomySection) {
      this.elements.taxonomySection.hidden = !hasAnyTaxonomy;
    }
  }

  /**
   * Render related documents
   */
  renderDocuments() {
    if (!this.eventData.document_links || this.eventData.document_links.length === 0) {
      if (this.elements.documentsSection) {
        this.elements.documentsSection.hidden = true;
      }
      return;
    }

    if (this.elements.documents) {
      const documentsHtml = this.eventData.document_links.map(docLink => {
        const roleLabel = this.formatRole(docLink.role);
        const dateStr = docLink.document_event_date 
          ? new Date(docLink.document_event_date).toLocaleDateString()
          : '';
        
        return `
          <div class="event-document">
            <h3 class="event-document__title">
              <a href="/document_detail/${docLink.document_id}/">${this.escapeHtml(docLink.document_title)}</a>
            </h3>
            <div class="event-document__meta">
              ${roleLabel ? `<span class="event-document__role">${this.escapeHtml(roleLabel)}</span>` : ''}
              ${dateStr ? `<span class="event-document__date">${this.escapeHtml(dateStr)}</span>` : ''}
              ${docLink.document_type ? `<span class="tag tag--info">${this.escapeHtml(docLink.document_type)}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
      this.elements.documents.innerHTML = documentsHtml;
    }
    if (this.elements.documentsSection) {
      this.elements.documentsSection.hidden = false;
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
   * Format role label
   */
  formatRole(role) {
    const roleMap = {
      'minutes': 'Minutes',
      'agenda': 'Agenda',
      'report': 'Report',
      'statement': 'Statement',
      'other': 'Other'
    };
    return roleMap[role] || role;
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.elements.loading) {
      this.elements.loading.hidden = false;
    }
    if (this.elements.content) {
      this.elements.content.hidden = true;
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.elements.loading) {
      this.elements.loading.hidden = true;
    }
  }

  /**
   * Show error state
   */
  showError(message) {
    if (this.elements.error) {
      this.elements.error.hidden = false;
    }
    if (this.elements.errorMessage) {
      this.elements.errorMessage.textContent = message;
    }
    if (this.elements.content) {
      this.elements.content.hidden = true;
    }
  }

  /**
   * Hide error state
   */
  hideError() {
    if (this.elements.error) {
      this.elements.error.hidden = true;
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
}

