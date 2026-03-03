/**
 * DocumentContentCoordinator
 * SPA Mode: Coordinates document content loading and rendering via API
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';

export class DocumentContentCoordinator {
  constructor(documentId, options = {}) {
    this.logger = logger.child({
      component: 'DocumentContentCoordinator'
    });
    
    this.documentId = documentId;
    this.options = {
      enableMetadata: true,
      enableContentProcessing: true,
      ...options
    };
    
    this.documentData = null;
    this.isLoading = false;
    
    this.logger.debug('DocumentContentCoordinator initialized', {
      documentId: this.documentId
    });
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing DocumentContentCoordinator');
    
    this.setupEventListeners();
    await this.loadDocumentData();
    
    this.logger.info('DocumentContentCoordinator initialized successfully');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    eventBus.on(EVENTS.DOCUMENT_RELOAD_REQUESTED, this.handleReloadRequest.bind(this), this);
    this.logger.debug('Event listeners configured');
  }

  /**
   * Load document data from API
   */
  async loadDocumentData() {
    if (this.isLoading) {
      this.logger.debug('Document already loading, skipping');
      return;
    }

    this.isLoading = true;
    this.showLoadingState();
    
    try {
      this.logger.debug('Loading document data from API', { documentId: this.documentId });
      
      eventBus.emit(EVENTS.DOCUMENT_LOADING_START, {
        documentId: this.documentId
      });

      const response = await fetch(`/api/v1/documents/${this.documentId}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      this.documentData = await response.json();
      
      this.logger.info('Document data loaded successfully', {
        documentId: this.documentId,
        title: this.documentData.title
      });

      this.renderDocument();
      
      eventBus.emit(EVENTS.DOCUMENT_LOADED, {
        documentId: this.documentId,
        documentData: this.documentData
      });

    } catch (error) {
      this.logger.error('Failed to load document data', error, {
        documentId: this.documentId
      });

      this.showErrorState(error.message);
      
      eventBus.emit(EVENTS.DOCUMENT_LOAD_ERROR, {
        documentId: this.documentId,
        error: error
      });
      
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const loading = document.getElementById('document-loading');
    const error = document.getElementById('document-error');
    const content = document.getElementById('document-content');
    
    if (loading) {
      loading.hidden = false;
      loading.style.display = ''; 
    }
    if (error) {
      error.hidden = true;
      error.style.display = 'none';
    }
    if (content) {
      content.hidden = true;
      content.style.display = 'none';
    }
  }

  /**
   * Show error state
   */
  showErrorState(message) {
    const loading = document.getElementById('document-loading');
    const error = document.getElementById('document-error');
    const errorMessage = document.getElementById('document-error-message');
    const content = document.getElementById('document-content');
    
    if (loading) {
      loading.hidden = true;
      loading.style.display = 'none';
    }
    if (error) {
      error.hidden = false;
      error.style.display = '';
    }
    if (content) {
      content.hidden = true;
      content.style.display = 'none';
    }
    if (errorMessage) errorMessage.textContent = message || 'An error occurred while loading the document.';
  }

  /**
   * Show content
   */
  showContent() {
    const loading = document.getElementById('document-loading');
    const error = document.getElementById('document-error');
    const content = document.getElementById('document-content');
    
    if (loading) {
      loading.hidden = true;
      loading.style.display = 'none';
    }
    if (error) {
      error.hidden = true;
      error.style.display = 'none';
      // Remove error element from DOM to ensure it doesn't interfere
      if (error.parentNode) {
        error.parentNode.removeChild(error);
      }
    }
    if (content) {
      content.hidden = false;
      content.style.display = '';
    }
  }

  /**
   * Render document content and metadata
   */
  renderDocument() {
    if (!this.documentData) {
      this.logger.warn('No document data to render');
      return;
    }

    this.logger.debug('Rendering document');

    // Update page title
    this.updatePageTitle();
    
    // Render header
    this.renderHeader();
    
    // Render main content sections
    this.renderSummary();
    this.renderThemes();
    this.renderActors();
    this.renderApplications();
    this.renderCommitments();
    this.renderTechnicalDetails();
    this.renderAlignment();
    this.renderQualitativeIndicators();
    this.renderBeneficiaries();
    this.renderKPIs();
    this.renderCountries();
    
    // Render sidebar
    this.renderBasicInfo();
    this.renderSourceFiles();
    this.renderRelatedDocuments();
    this.renderRelatedEvents();

    this.showContent();
    
    eventBus.emit(EVENTS.DOCUMENT_CONTENT_READY, {
      documentId: this.documentId
    });

    this.logger.debug('Document rendered successfully');
  }

  /**
   * Update page title and meta tags
   */
  updatePageTitle() {
    const title = `${this.documentData.title} - SPIDERHUB`;
    document.title = title;

    if (this.documentData.executive_summary) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', this.truncateText(this.documentData.executive_summary, 160));
      }
    }
  }

  /**
   * Render document header
   */
  renderHeader() {
    const titleEl = document.getElementById('document-title');
    const metaEl = document.getElementById('document-meta');
    const actionsEl = document.getElementById('document-actions');
    
    if (titleEl) {
      titleEl.textContent = this.documentData.title;
    }
    
    if (metaEl) {
      const parts = [];
      if (this.documentData.event_city?.name || this.documentData.event_country?.name) {
        const location = [
          this.documentData.event_city?.name,
          this.documentData.event_country?.name
        ].filter(Boolean).join(', ');
        parts.push(`<span>${this.escapeHtml(location)}</span>`);
      }
      if (this.documentData.event_date) {
        parts.push(`<span>${this.formatDate(this.documentData.event_date)}</span>`);
      }
      if (this.documentData.document_type) {
        parts.push(`<span>${this.escapeHtml(this.documentData.document_type)}</span>`);
      }
      metaEl.innerHTML = parts.join(' • ');
    }
    
    if (actionsEl) {
      const lang = window.location.pathname.split('/')[1] || 'en';
      actionsEl.innerHTML = `
        <a href="/${lang}/documents/${this.documentId}/export-pdf/" class="button button--primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="white"/>
          </svg>
          Export Summary PDF
        </a>
      `;
    }
  }

  /**
   * Render executive summary
   */
  renderSummary() {
    const section = document.getElementById('section-summary');
    const container = document.getElementById('executive-summary');
    
    if (section && container && this.documentData.executive_summary) {
      section.hidden = false;
      container.innerHTML = this.escapeHtml(this.documentData.executive_summary).replace(/\n/g, '<br>');
    }
  }

  /**
   * Render themes
   */
  renderThemes() {
    const section = document.getElementById('section-themes');
    const container = document.getElementById('themes-container');
    
    if (section && container && this.documentData.themes?.length > 0) {
      section.hidden = false;
      container.innerHTML = `
        <div class="tags-container">
          ${this.documentData.themes.map(t => 
            `<span class="doc-tag theme">${this.escapeHtml(t.name)}</span>`
          ).join('')}
        </div>
      `;
    }
  }

  /**
   * Render actors
   */
  renderActors() {
    const section = document.getElementById('section-actors');
    const container = document.getElementById('actors-container');
    
    if (section && container && this.documentData.actors?.length > 0) {
      section.hidden = false;
      container.innerHTML = `
        <div class="tags-container">
          ${this.documentData.actors.map(a => 
            `<span class="doc-tag actor">${this.escapeHtml(a.name)}</span>`
          ).join('')}
        </div>
      `;
    }
  }

  /**
   * Render practical applications
   */
  renderApplications() {
    const section = document.getElementById('section-applications');
    const container = document.getElementById('applications-list');
    
    if (section && container && this.documentData.practical_applications?.length > 0) {
      section.hidden = false;
      container.innerHTML = this.documentData.practical_applications.map(app => 
        `<li>${this.escapeHtml(app.description || app.title)}</li>`
      ).join('');
    }
  }

  /**
   * Render commitments
   */
  renderCommitments() {
    const container = document.getElementById('commitments-container');
    
    if (container && this.documentData.commitments?.length > 0) {
      container.innerHTML = `
        <ul class="document-list">
          ${this.documentData.commitments.map(c => {
            // API returns 'text', but fallbacks provided for compatibility
            const text = c.text || c.description || c.title;
            const details = c.details && c.details.length > 0 ? c.details[0] : null;
            const type = details?.commitment_class;
            
            return `
              <li>
                ${type ? `<span class="doc-tag commitment-type ${type.toLowerCase()}">${this.escapeHtml(type)}</span>` : ''}
                <span class="commitment-text">${this.escapeHtml(text)}</span>
              </li>
            `;
          }).join('')}
        </ul>
      `;
    }
  }

  /**
   * Render technical details
   */
  renderTechnicalDetails() {
    const container = document.getElementById('technical-grid');
    
    if (container) {
      container.innerHTML = `
        <div class="technical-item">
          <div class="technical-label">Scope</div>
          <div class="technical-value">${this.escapeHtml(this.documentData.coverage_scope || 'N/A')}</div>
        </div>
        <div class="technical-item">
          <div class="technical-label">Lead Country</div>
          <div class="technical-value">${this.escapeHtml(this.documentData.lead_country?.name || 'N/A')}</div>
        </div>
      `;
    }
  }

  /**
   * Render policy alignment
   */
  renderAlignment() {
    const container = document.getElementById('alignment-container');
    
    if (container) {
      const euPolicies = this.documentData.eu_policy_alignments || [];
      const sdgs = this.documentData.sdgs || [];
      
      container.innerHTML = `
        <div class="alignment-card eu-policies">
          <div class="alignment-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#094EB2" opacity="0.1"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#094EB2"/>
            </svg>
            <h3>EU Policy Alignment</h3>
          </div>
          <div class="alignment-content">
            ${euPolicies.length > 0 ? `
              <div class="policy-tags-grid">
                ${euPolicies.map(p => `<div class="policy-tag">${this.escapeHtml(p.name)}</div>`).join('')}
              </div>
            ` : '<div class="policy-tag">No EU policy alignment defined.</div>'}
          </div>
        </div>
        <div class="alignment-card sdg-alignment">
          <div class="alignment-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#34A853" opacity="0.1"/>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#34A853"/>
            </svg>
            <h3>SDG Alignment</h3>
          </div>
          <div class="alignment-content">
            ${sdgs.length > 0 ? `
              <div class="sdg-tags-grid">
                ${sdgs.map(s => `<div class="sdg-tag">${this.escapeHtml(s.label)}</div>`).join('')}
              </div>
            ` : '<div class="sdg-tag">No SDG alignment defined.</div>'}
          </div>
        </div>
      `;
    }
  }

  /**
   * Render Qualitative Indicators section grouped by level (micro → meso → macro)
   */
  renderQualitativeIndicators() {
    const section = document.getElementById('section-qualitative');
    const container = document.getElementById('qualitative-indicators-container');

    if (!section || !container) return;

    const indicators = this.documentData.qualitative_indicators || [];
    if (indicators.length === 0) return;

    section.hidden = false;

    // Level config: display order, label, CSS modifier
    const LEVEL_ORDER = ['micro', 'meso', 'macro'];
    const LEVEL_META = {
      micro: { label: 'Micro',  mod: 'micro' },
      meso:  { label: 'Meso',   mod: 'meso'  },
      macro: { label: 'Macro',  mod: 'macro' },
    };

    // Group by level preserving order
    const grouped = {};
    LEVEL_ORDER.forEach(l => { grouped[l] = []; });
    indicators.forEach(ind => {
      const key = ind.level in grouped ? ind.level : 'micro';
      grouped[key].push(ind);
    });

    // ── Category helpers (mirror backend thresholds) ─────────────────────────
    const scoreToCategory = score => {
      if (score === null || score === undefined)
        return { slug: 'pending',         label: 'Pending analysis', icon: '⏳' };
      if (score <= 0.30)
        return { slug: 'not_evident',     label: 'Not evident',      icon: '○' };
      if (score <= 0.60)
        return { slug: 'partially',       label: 'Partially evident',icon: '◑' };
      if (score <= 0.90)
        return { slug: 'clearly_evident', label: 'Clearly evident',  icon: '●' };
      return   { slug: 'central_focus',   label: 'Central focus',    icon: '★' };
    };

    const dimensionLabel = dim => {
      const map = {
        engagement:      'Stakeholder Engagement',
        policy:          'Policy Influence',
        trust:           'Collaborative Trust',
        inclusivity:     'Communication Inclusivity',
        impact:          'Long-term Impact',
        alignment:       'Regional Alignment',
        continuity:      'Continuity of Practice',
        representation:  'Institutional Representation',
        diversity:       'Stakeholder Diversity',
      };
      return map[dim] || dim;
    };

    const renderCard = ind => {
      const hasScore = ind.score !== null && ind.score !== undefined;
      const cat      = scoreToCategory(ind.score);
      const dimLabel = dimensionLabel(ind.dimension);

      const scoreHtml = hasScore ? `
        <div class="qi-category-badge qi-category-badge--${cat.slug}">
          <span class="qi-category-icon">${cat.icon}</span>
          <span class="qi-category-label">${this.escapeHtml(cat.label)}</span>
        </div>
      ` : `<div class="qi-category-badge qi-category-badge--pending">⏳ Pending analysis</div>`;

      const justHtml = ind.justification
        ? `<p class="qi-justification">${this.escapeHtml(ind.justification)}</p>`
        : '';

      const evidenceHtml = ind.evidence
        ? `<blockquote class="qi-evidence"><span class="qi-evidence-icon">📎</span>${this.escapeHtml(ind.evidence)}</blockquote>`
        : '';

      return `
        <div class="qi-card qi-card--${cat.slug}">
          <div class="qi-card__header">
            ${dimLabel ? `<span class="qi-dimension-tag">${this.escapeHtml(dimLabel)}</span>` : ''}
          </div>
          <h4 class="qi-card__title">${this.escapeHtml(ind.label)}</h4>
          ${scoreHtml}
          ${justHtml}
          ${evidenceHtml}
        </div>
      `;
    };

    const html = LEVEL_ORDER
      .filter(level => grouped[level].length > 0)
      .map(level => {
        const meta = LEVEL_META[level];
        const cards = grouped[level].map(renderCard).join('');
        return `
          <div class="qi-level-group">
            <div class="qi-level-header">
              <span class="qi-level-badge qi-level-badge--${meta.mod}">${meta.label}</span>
              <span class="qi-level-description">${this._levelDescription(level)}</span>
            </div>
            <div class="qi-cards-grid">
              ${cards}
            </div>
          </div>
        `;
      })
      .join('');

    container.innerHTML = html;
  }

  /**
   * Human-readable level descriptions for qualitative indicators
   */
  _levelDescription(level) {
    const descs = {
      micro: 'Institutional practices & actor-level participation',
      meso:  'Project implementation & stakeholder collaboration',
      macro: 'Regional policy alignment, continuity & impact',
    };
    return descs[level] || '';
  }

  /**
   * Get beneficiary icon based on category or name
   */
  getBeneficiaryIcon(beneficiaryCategory, beneficiaryName) {
    const beneficiaryIcons = {
      "SMEs / Businesses": "🏪",
      "Start-ups / Innovators": "🚀",
      "Large Corporations": "🏢",
      "Researchers & Academia": "🎓",
      "Students & Youth": "👨‍🎓",
      "Migrants & Refugees": "🌍",
      "Women & Girls": "👩",
      "Rural & Remote Communities": "🏘️",
      "Indigenous Peoples & Ethnic Groups": "🪶",
      "Persons with Disabilities": "♿",
      "General Citizens / Consumers": "👥",
      "Public Sector / Governments": "🏛️",
      "Civil Society / NGOs": "🤝",
      "Farmers & Primary Producers": "🌾",
      "Health Sector": "🏥",
      "Investors & Financial Actors": "💰",
      "Uncategorised": "📋"
    };
    
    // First try by category, then by name, then default
    return beneficiaryIcons[beneficiaryCategory] || 
           beneficiaryIcons[beneficiaryName] || 
           "👥";
  }

  /**
   * Render beneficiaries
   */
  renderBeneficiaries() {
    const section = document.getElementById('section-beneficiaries');
    const container = document.getElementById('beneficiaries-grid');
    
    if (section && container && this.documentData.beneficiary_groups?.length > 0) {
      section.hidden = false;
      container.innerHTML = this.documentData.beneficiary_groups.map(b => {
        const icon = this.getBeneficiaryIcon(b.category || '', b.name);
        return `
        <div class="beneficiary-card">
          <div class="beneficiary-icon-wrapper">
            <span class="beneficiary-icon" style="font-size: 32px; line-height: 1;">${icon}</span>
          </div>
          <div class="beneficiary-info">
            <div class="beneficiary-title">${this.escapeHtml(b.name)}</div>
          </div>
        </div>
      `;
      }).join('');
    }
  }

  /**
   * Render KPIs
   */
  renderKPIs() {
    const section = document.getElementById('section-kpis');
    const container = document.getElementById('kpis-container');
    
    if (section && container && this.documentData.kpis?.length > 0) {
      section.hidden = false;
      container.innerHTML = this.documentData.kpis.map(kpi => {
        const isQuantitative = kpi.kpi_type === 'quantitative' || (kpi.target_value && !isNaN(parseFloat(kpi.target_value)));
        
        return `
        <div class="kpi-card">
          <div class="kpi-card__header">
            <span class="kpi-card__type-badge ${isQuantitative ? 'kpi-card__type-badge--quantitative' : 'kpi-card__type-badge--qualitative'}">
              ${isQuantitative ? 'Quantitative' : 'Qualitative'}
            </span>
            ${kpi.sector ? `<span class="kpi-card__sector">${this.escapeHtml(kpi.sector)}</span>` : ''}
          </div>
          
          <div class="kpi-card__body">
            <h3 class="kpi-card__title">${this.escapeHtml(kpi.metric_name)}</h3>
            
            ${kpi.target_value ? `
              <div class="kpi-card__target">
                <div class="kpi-card__value">${this.escapeHtml(kpi.target_value)}</div>
                ${kpi.unit ? `<div class="kpi-card__unit">${this.escapeHtml(kpi.unit)}</div>` : ''}
              </div>
            ` : ''}
            
            ${kpi.kpi_text ? `<p class="kpi-card__description">${this.escapeHtml(kpi.kpi_text)}</p>` : ''}
          </div>
          
          ${(kpi.timeframe || kpi.responsible_entity) ? `
            <div class="kpi-card__footer">
              ${kpi.timeframe ? `
                <div class="kpi-card__meta-item" title="Timeframe">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>${this.escapeHtml(kpi.timeframe)}</span>
                </div>
              ` : ''}
              
              ${kpi.responsible_entity ? `
                <div class="kpi-card__meta-item" title="Responsible Entity">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span class="truncate">${this.escapeHtml(kpi.responsible_entity)}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `}).join('');
    }
  }

  /**
   * Render countries involved
   */
  renderCountries() {
    const section = document.getElementById('section-countries');
    const container = document.getElementById('countries-grid');
    
    if (section && container && this.documentData.countries_involved?.length > 0) {
      section.hidden = false;
      container.innerHTML = this.documentData.countries_involved.map(c => `
        <div class="country-card">
          <div class="country-flag-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
            </svg>
          </div>
          <div class="country-info">
            <div class="country-name">${this.escapeHtml(c.name)}</div>
            ${c.iso3 ? `<div class="country-code">${this.escapeHtml(c.iso3)}</div>` : ''}
          </div>
        </div>
      `).join('');
    }
  }

  /**
   * Render basic info sidebar
   */
  renderBasicInfo() {
    const container = document.getElementById('basic-info-container');
    
    if (container) {
      const items = [
        { label: 'Title', value: this.documentData.title },
        { label: 'Date', value: this.documentData.event_date ? this.formatDate(this.documentData.event_date) : null },
        { label: 'Type', value: this.documentData.document_type },
        { label: 'Legal Character', value: this.documentData.legal_bindingness }
      ].filter(item => item.value);
      
      container.innerHTML = items.map(item => `
        <div class="info-item">
          <div class="info-label">${item.label}</div>
          <div class="info-value">${this.escapeHtml(item.value)}</div>
        </div>
      `).join('');
    }
  }

  /**
   * Render source files
   */
  renderSourceFiles() {
    const card = document.getElementById('source-files-card');
    const countEl = document.getElementById('source-files-count');
    const listEl = document.getElementById('source-files-list');
    
    if (card && this.documentData.source_files?.length > 0) {
      card.hidden = false;
      
      if (countEl) {
        const count = this.documentData.source_files.length;
        countEl.textContent = `${count} file${count !== 1 ? 's' : ''}`;
      }
      
      if (listEl) {
        listEl.innerHTML = this.documentData.source_files.map(sf => `
          <div class="source-file-item">
            <div class="source-file-item__icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
              </svg>
            </div>
            <div class="source-file-item__info">
              <div class="source-file-item__name">${this.escapeHtml(sf.original_filename)}</div>
            </div>
            ${sf.file_url ? `
              <div class="source-file-item__actions">
                <a href="${sf.file_url}" class="source-file-item__action source-file-item__action--download" download>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>
              </div>
            ` : ''}
          </div>
        `).join('');
      }
    }
  }

  /**
   * Render related documents
   */
  async renderRelatedDocuments() {
    const card = document.getElementById('related-documents-card');
    const countEl = document.getElementById('related-documents-count');
    const listEl = document.getElementById('related-documents-list');
    
    if (!card) return;
    
    try {
      const response = await fetch(`/api/v1/documents/${this.documentId}/related/`);
      if (!response.ok) return;
      
      const data = await response.json();
      const relatedDocs = data.documents || [];
      
      if (relatedDocs.length === 0) return;
      
      card.hidden = false;
      
      if (countEl) {
        countEl.textContent = `${relatedDocs.length} related document${relatedDocs.length !== 1 ? 's' : ''}`;
      }
      
      if (listEl) {
        const lang = window.location.pathname.split('/')[1] || 'en';
        listEl.innerHTML = relatedDocs.map(rd => `
          <div class="related-document">
            <a href="/${lang}/document_detail/${rd.id}/" class="related-document__link">
              <div class="related-document__content">
                <div class="related-title">${this.escapeHtml(this.truncateText(rd.title, 60))}</div>
                <div class="related-meta">
                  ${rd.event_country?.name ? `<span class="related-meta__item">${this.escapeHtml(rd.event_country.name)}</span>` : ''}
                  ${rd.event_date ? `<span class="related-meta__item">${new Date(rd.event_date).getFullYear()}</span>` : ''}
                </div>
              </div>
            </a>
          </div>
        `).join('');
      }
      
    } catch (error) {
      this.logger.warn('Failed to load related documents', error);
    }
  }

  /**
   * Render related events
   */
  async renderRelatedEvents() {
    const card = document.getElementById('related-events-card');
    const countEl = document.getElementById('related-events-count');
    const listEl = document.getElementById('related-events-list');
    
    if (!card) return;
    
    try {
      this.logger.debug('Loading related events for document', { documentId: this.documentId });
      
      const response = await fetch(`/api/v1/documents/${this.documentId}/events/`);
      if (!response.ok) {
        this.logger.warn('Failed to load related events', { status: response.status });
        return;
      }
      
      const data = await response.json();
      const relatedEvents = data.events || [];
      
      this.logger.info('Related events loaded', {
        documentId: this.documentId,
        count: relatedEvents.length
      });
      
      if (relatedEvents.length === 0) {
        card.hidden = true;
        return;
      }
      
      card.hidden = false;
      
      if (countEl) {
        countEl.textContent = `${relatedEvents.length} related event${relatedEvents.length !== 1 ? 's' : ''}`;
      }
      
      if (listEl) {
        const lang = window.location.pathname.split('/')[1] || 'en';
        listEl.innerHTML = relatedEvents.map(event => {
          const dateStr = event.start_at 
            ? new Date(event.start_at).toLocaleDateString()
            : '';
          
          return `
            <div class="related-event">
              <a href="/${lang}/events/${event.id}/" class="related-event__link">
                <div class="related-event__content">
                  <div class="related-title">${this.escapeHtml(this.truncateText(event.title, 60))}</div>
                  <div class="related-meta">
                    ${dateStr ? `<span class="related-meta__item">${this.escapeHtml(dateStr)}</span>` : ''}
                    ${event.country_name ? `<span class="related-meta__item">${this.escapeHtml(event.country_name)}</span>` : ''}
                  </div>
                </div>
              </a>
            </div>
          `;
        }).join('');
      }
      
      eventBus.emit(EVENTS.RELATED_DOCUMENTS_LOADED, {
        documentId: this.documentId,
        events: relatedEvents,
        type: 'events'
      });
      
    } catch (error) {
      this.logger.warn('Failed to load related events', error, {
        documentId: this.documentId
      });
      card.hidden = true;
    }
  }

  /**
   * Handle document reload request
   */
  async handleReloadRequest() {
    this.logger.info('Document reload requested');
    await this.loadDocumentData();
  }

  /**
   * Get current document data
   */
  getDocumentData() {
    return this.documentData;
  }

  /**
   * Format date string
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
   * Truncate text
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying DocumentContentCoordinator');
    eventBus.offContext(this);
    this.documentData = null;
    this.logger.debug('DocumentContentCoordinator destroyed');
  }
}

export default DocumentContentCoordinator;
