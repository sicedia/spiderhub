/**
 * DocumentResults Component
 * Handles rendering of document search results and pagination
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { EVENTS } from '../../core/constants/config.js';
import { logger } from '../../core/logger/Logger.js';

export class DocumentResults extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    // Create child logger with component context
    this.logger = logger.child({
      component: 'DocumentResults',
      instance: Math.random().toString(36).substr(2, 9)
    });
  }

  getDefaultOptions() {
    return {
      paginationElement: null,
      countElement: null,
      emptyMessage: 'No documents match your criteria.',
      loadingMessage: 'Loading…'
    };
  }

  init() {
    this.state = {
      documents: [],
      currentPage: 1,
      pageSize: 10,
      totalCount: 0
    };
    this._isRenderingResults = false; // Flag to prevent recursive renderResults
    this._isShowingLoading = false; // Flag to prevent recursive showLoading
    
    if (this.logger) {
      this.logger.debug('DocumentResults initialized', {
        options: this.options,
        initialState: this.state
      });
    }
  }

  /**
   * Render search results
   */
  renderResults(data) {
    // Prevent recursive rendering
    if (this._isRenderingResults) {
      return;
    }

    this._isRenderingResults = true;
    this._isShowingLoading = false; // Clear loading flag when rendering results
    try {
      const { count, page_size: pageSize, results } = data;
      
      this.state.documents = results;
      this.state.totalCount = count;
      this.state.pageSize = pageSize;

      // Update count display
      this.updateCountDisplay(count, pageSize);

      // Render documents
      if (results.length === 0) {
        this.showEmpty();
      } else {
        this.showDocuments(results);
      }

      // Update pagination
      this.renderPagination(count, pageSize);
    } finally {
      this._isRenderingResults = false;
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    // Prevent recursive calls
    if (this._isShowingLoading) {
      return;
    }

    this._isShowingLoading = true;
    try {
      this.element.innerHTML = `<p class="loading">${this.options.loadingMessage}</p>`;
      
      if (this.options.paginationElement) {
        this.options.paginationElement.innerHTML = '';
      }
      
      if (this.options.countElement) {
        this.options.countElement.textContent = '';
      }
    } finally {
      // Don't set to false here - let renderResults clear it
      // this._isShowingLoading = false;
    }
  }

  /**
   * Show error state
   */
  showError(error) {
    // Ignore phantom showError() calls with no actual error
    if (!error) {
      this.logger.warn('showError() called without error object');
      return;
    }
    
    this.element.innerHTML = '<p class="error">Error loading results.</p>';
    
    if (this.options.paginationElement) {
      this.options.paginationElement.innerHTML = '';
    }
    
    if (this.options.countElement) {
      this.options.countElement.textContent = '';
    }

    // Don't emit RESULTS_ERROR to avoid potential loops
    // this.emit(EVENTS.RESULTS_ERROR, { error });
  }

  /**
   * Show empty state
   */
  showEmpty() {
    this.element.innerHTML = `<p class="no-results">${this.options.emptyMessage}</p>`;
  }

  /**
   * Show documents
   */
  showDocuments(documents) {
    this.element.innerHTML = documents.map(doc => this.createDocumentCard(doc)).join('');
  }

  /**
   * Create document card HTML (matching original design)
   */
  createDocumentCard(doc) {
    const formatDate = (dateStr) => {
      const d = new Date(dateStr);
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    };

    // Build metadata text (type + date)
    const metaParts = [];
    if (doc.document_type) metaParts.push(doc.document_type);
    if (doc.event_date) metaParts.push(formatDate(doc.event_date));
    const metaText = metaParts.join(' • ');

    // Build tags: location + actors + themes
    const tags = [
      doc.event_country ? `<span class="doc-tag location">${this.escapeHtml(doc.event_country)}</span>` : '',
      ...(doc.actors || []).map(a => `<span class="doc-tag actor">${this.escapeHtml(a)}</span>`),
      ...(doc.themes || []).map(t => `<span class="doc-tag theme">${this.escapeHtml(t)}</span>`)
    ].join('');

    // Excerpt
    const excerpt = this.escapeHtml(doc.executive_summary || '');

    return `
      <div class="document-list-item">
        <div class="document-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 
                    20C4 21.1 4.89 22 5.99 22H18C19.1 
                    22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 
                    14H8V12H16V14ZM13 9V3.5L18.5 9H13Z"
                  fill="currentColor"/>
          </svg>
        </div>
        <div class="document-list-content">
          <div class="document-list-title">${this.escapeHtml(doc.title || 'Untitled Document')}</div>
          ${metaText ? `<div class="document-list-meta"><span>${metaText}</span></div>` : ''}
          <div class="document-list-tags">
            ${tags}
          </div>
          ${excerpt ? `<p class="document-excerpt">${excerpt}</p>` : ''}
        </div>
        <div class="document-list-actions">
          <a href="/document_detail/${doc.id}/" class="btn btn-secondary btn-sm">
            View Details
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Update count display
   */
  updateCountDisplay(totalCount, pageSize) {
    if (!this.options.countElement) return;

    const start = (this.state.currentPage - 1) * pageSize + 1;
    const end = Math.min(this.state.currentPage * pageSize, totalCount);

    const countText = totalCount > 0 
      ? `Showing ${start}–${end} of ${totalCount} documents`
      : '';

    this.options.countElement.textContent = countText;
  }

  /**
   * Render pagination
   */
  renderPagination(totalCount, pageSize) {
    if (!this.options.paginationElement) return;

    const totalPages = Math.ceil(totalCount / pageSize);
    
    if (totalPages <= 1) {
      this.options.paginationElement.innerHTML = '';
      return;
    }

    const createButton = (page, label = page, isActive = false, isDisabled = false) => {
      const activeClass = isActive ? 'pagination-btn--active' : '';
      const disabledAttr = isDisabled ? 'disabled' : '';
      const ariaLabel = typeof page === 'number' ? `Go to page ${page}` : label;
      
      return `
        <button class="pagination-btn ${activeClass}" 
                data-page="${page}"
                ${disabledAttr}
                aria-label="${ariaLabel}"
                ${isActive ? 'aria-current="page"' : ''}>
          ${label}
        </button>
      `;
    };

    let html = '';

    // Previous button
    html += createButton(
      this.state.currentPage - 1,
      '← Previous',
      false,
      this.state.currentPage === 1
    );

    // Page numbers with smart ellipsis
    const maxVisible = 5;
    let startPage = Math.max(1, this.state.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      html += createButton(1);
      if (startPage > 2) {
        html += '<span class="pagination-ellipsis">…</span>';
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      html += createButton(i, i, i === this.state.currentPage);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += '<span class="pagination-ellipsis">…</span>';
      }
      html += createButton(totalPages);
    }

    // Next button
    html += createButton(
      this.state.currentPage + 1,
      'Next →',
      false,
      this.state.currentPage === totalPages
    );

    this.options.paginationElement.innerHTML = html;

    // Add event listeners
    this.options.paginationElement.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (!isNaN(page)) {
          this.goToPage(page);
        }
      });
    });
  }

  /**
   * Go to specific page
   */
  goToPage(page) {
    this.state.currentPage = page;
    this.emit('page:changed', { page });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get current page
   */
  getCurrentPage() {
    return this.state.currentPage;
  }

  /**
   * Reset to page 1
   */
  resetPagination() {
    this.state.currentPage = 1;
  }
}

export default DocumentResults;

