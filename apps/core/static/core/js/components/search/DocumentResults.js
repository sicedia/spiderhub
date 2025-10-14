/**
 * DocumentResults Component
 * Handles rendering of document search results and pagination
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { EVENTS } from '../../core/constants/config.js';
import { logger } from '../../core/logger/Logger.js';
import { gettext as _ } from '../../core/i18n/i18n.js';

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
      emptyMessage: _('No documents match your criteria.'),
      loadingMessage: _('Loading…')
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
    this._savedScrollPosition = 0; // Save scroll position during updates
    
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
      const { count, page_size: pageSize, results, current_page } = data;
      
      this.state.documents = results;
      this.state.totalCount = count;
      this.state.pageSize = pageSize;
      
      // Update current page from server response if available
      // This ensures the pagination reflects the actual page being displayed
      if (current_page !== undefined) {
        this.state.currentPage = current_page;
      }

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
      // Save current scroll position to prevent jump
      this._savedScrollPosition = window.scrollY;
      
      // Get the current height to maintain layout during loading
      const currentHeight = this.element.offsetHeight;
      
      // Set minimum height to prevent page collapse
      if (currentHeight > 0) {
        this.element.style.minHeight = `${currentHeight}px`;
      }
      
      this.element.innerHTML = `<p class="loading">${this.options.loadingMessage}</p>`;
      
      if (this.options.paginationElement) {
        this.options.paginationElement.innerHTML = '';
      }
      
      if (this.options.countElement) {
        this.options.countElement.textContent = '';
      }
      
      // Restore scroll position immediately to prevent any jump
      window.scrollTo(0, this._savedScrollPosition);
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
    
    this.element.innerHTML = `<p class="error">${_('Error loading results.')}</p>`;
    
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
    // Save scroll position before updating content
    const scrollY = window.scrollY;
    
    this.element.innerHTML = `<p class="no-results">${this.options.emptyMessage}</p>`;
    
    // Remove the minimum height constraint
    this.element.style.minHeight = '';
    
    // Restore scroll position
    window.scrollTo(0, scrollY);
  }

  /**
   * Show documents
   */
  showDocuments(documents) {
    // Save scroll position before updating content
    const scrollY = window.scrollY;
    
    // Update the content
    this.element.innerHTML = documents.map(doc => this.createDocumentCard(doc)).join('');
    
    // Remove the minimum height constraint set during loading
    this.element.style.minHeight = '';
    
    // Restore scroll position to prevent unwanted jumps
    // This prevents the "whiplash" effect when filters change
    window.scrollTo(0, scrollY);
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

    // Build tags: location + actors + themes (limit to 5 with overflow indicator)
    const MAX_VISIBLE_TAGS = 5;
    const allTags = [
      doc.event_country ? { text: doc.event_country, type: 'location' } : null,
      ...(doc.actors || []).map(a => ({ text: a, type: 'actor' })),
      ...(doc.themes || []).map(t => ({ text: t, type: 'theme' }))
    ].filter(Boolean);
    
    const visibleTags = allTags.slice(0, MAX_VISIBLE_TAGS);
    const hiddenCount = allTags.length - visibleTags.length;
    
    const tagsHtml = visibleTags.map(tag => {
      if (tag.type === 'location') {
        // Add location icon and tooltip for event country
        return `<span class="doc-tag ${tag.type}" title="Host Country (Event Location)">
          <svg class="doc-tag__icon" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
          ${this.escapeHtml(tag.text)}
        </span>`;
      }
      return `<span class="doc-tag ${tag.type}">${this.escapeHtml(tag.text)}</span>`;
    }).join('');
    
    const moreIndicator = hiddenCount > 0 
      ? `<span class="doc-tag doc-tag--more">+${hiddenCount} more</span>` 
      : '';
    
    const tags = tagsHtml + moreIndicator;

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
            ${_('View Details')}
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
      // Use both 'active' and 'pagination-btn--active' classes for compatibility
      const activeClass = isActive ? 'pagination-btn--active active' : '';
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
  goToPage(page, shouldScroll = true) {
    this.state.currentPage = page;
    
    // Only scroll when explicitly requested (e.g., user clicks pagination)
    if (shouldScroll) {
      this.scrollToResults();
    }
    
    this.emit('page:changed', { page });
  }

  /**
   * Scroll to the top of the results list
   */
  scrollToResults() {
    // Find the main content area or results header to scroll to
    const searchHeader = document.querySelector('.explore-header');
    
    if (searchHeader) {
      // Scroll to the search header area smoothly
      searchHeader.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    } else {
      // Fallback: scroll to top of page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
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

