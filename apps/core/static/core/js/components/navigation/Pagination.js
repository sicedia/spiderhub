/**
 * Pagination Component
 * Reusable pagination with customizable options
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { CONFIG, EVENTS } from '../../core/constants/config.js';
import { darkModeManager } from '../../core/utils/darkMode.js';

export class Pagination extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.currentPage = this.options.currentPage || 1;
    this.totalPages = this.options.totalPages || 1;
    this.totalItems = this.options.totalItems || 0;
    this.itemsPerPage = this.options.itemsPerPage || CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
  }

  /**
   * Default options for pagination
   */
  getDefaultOptions() {
    return {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
      maxVisiblePages: CONFIG.PAGINATION.MAX_VISIBLE_PAGES,
      showFirstLast: true,
      showPrevNext: true,
      showPageInfo: true,
      showItemsPerPageSelector: true,
      itemsPerPageOptions: [10, 25, 50, 100],
      labels: {
        first: 'First',
        previous: 'Previous',
        next: 'Next',
        last: 'Last',
        page: 'Page',
        of: 'of',
        items: 'items',
        itemsPerPage: 'Items per page'
      },
      theme: 'default' // 'default', 'minimal', 'compact'
    };
  }

  /**
   * Initialize pagination
   */
  init() {
    this.render();
    super.init();
  }

  /**
   * Render pagination
   */
  render() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Add CSS classes
    this.element.className = this.buildCSSClasses();
    
    // Create pagination content
    const content = this.createPaginationContent();
    this.element.appendChild(content);
    
    // Add styles
    this.addStyles();
  }

  /**
   * Build CSS classes
   */
  buildCSSClasses() {
    const classes = ['pagination-component'];
    classes.push(`pagination-component--${this.options.theme}`);
    return classes.join(' ');
  }

  /**
   * Create pagination content
   */
  createPaginationContent() {
    const content = DOMUtils.createElement('div', {
      className: 'pagination-content'
    });
    
    // Page info section
    if (this.options.showPageInfo) {
      const pageInfo = this.createPageInfo();
      content.appendChild(pageInfo);
    }
    
    // Navigation section
    const navigation = this.createNavigation();
    content.appendChild(navigation);
    
    // Items per page selector
    if (this.options.showItemsPerPageSelector) {
      const itemsPerPageSelector = this.createItemsPerPageSelector();
      content.appendChild(itemsPerPageSelector);
    }
    
    return content;
  }

  /**
   * Create page info section
   */
  createPageInfo() {
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    
    const pageInfo = DOMUtils.createElement('div', {
      className: 'pagination-info'
    });
    
    if (this.totalItems > 0) {
      pageInfo.innerHTML = `
        Showing ${startItem.toLocaleString()} - ${endItem.toLocaleString()} 
        of ${this.totalItems.toLocaleString()} ${this.options.labels.items}
      `;
    } else {
      pageInfo.innerHTML = `No ${this.options.labels.items} found`;
    }
    
    return pageInfo;
  }

  /**
   * Create navigation section
   */
  createNavigation() {
    const navigation = DOMUtils.createElement('div', {
      className: 'pagination-navigation'
    });
    
    // First page button
    if (this.options.showFirstLast) {
      const firstBtn = this.createNavButton('first', this.options.labels.first, 1);
      navigation.appendChild(firstBtn);
    }
    
    // Previous page button
    if (this.options.showPrevNext) {
      const prevBtn = this.createNavButton('prev', this.options.labels.previous, this.currentPage - 1);
      navigation.appendChild(prevBtn);
    }
    
    // Page number buttons
    const pageButtons = this.createPageButtons();
    pageButtons.forEach(button => navigation.appendChild(button));
    
    // Next page button
    if (this.options.showPrevNext) {
      const nextBtn = this.createNavButton('next', this.options.labels.next, this.currentPage + 1);
      navigation.appendChild(nextBtn);
    }
    
    // Last page button
    if (this.options.showFirstLast) {
      const lastBtn = this.createNavButton('last', this.options.labels.last, this.totalPages);
      navigation.appendChild(lastBtn);
    }
    
    return navigation;
  }

  /**
   * Create navigation button
   */
  createNavButton(type, label, page) {
    const button = DOMUtils.createElement('button', {
      type: 'button',
      className: `pagination-btn pagination-btn--${type}`,
      'data-page': page,
      'aria-label': `${label} page`
    }, label);
    
    // Disable if not applicable
    const isDisabled = 
      (type === 'first' && this.currentPage === 1) ||
      (type === 'prev' && this.currentPage === 1) ||
      (type === 'next' && this.currentPage === this.totalPages) ||
      (type === 'last' && this.currentPage === this.totalPages) ||
      this.totalPages <= 1;
    
    if (isDisabled) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }
    
    return button;
  }

  /**
   * Create page number buttons
   */
  createPageButtons() {
    const buttons = [];
    const { maxVisiblePages } = this.options;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= this.totalPages; i++) {
        buttons.push(this.createPageButton(i));
      }
    } else {
      // Show subset with ellipsis
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, this.currentPage - halfVisible);
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      // Adjust if we're near the end
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // First page + ellipsis
      if (startPage > 1) {
        buttons.push(this.createPageButton(1));
        if (startPage > 2) {
          buttons.push(this.createEllipsis());
        }
      }
      
      // Visible page range
      for (let i = startPage; i <= endPage; i++) {
        buttons.push(this.createPageButton(i));
      }
      
      // Ellipsis + last page
      if (endPage < this.totalPages) {
        if (endPage < this.totalPages - 1) {
          buttons.push(this.createEllipsis());
        }
        buttons.push(this.createPageButton(this.totalPages));
      }
    }
    
    return buttons;
  }

  /**
   * Create page number button
   */
  createPageButton(pageNumber) {
    const button = DOMUtils.createElement('button', {
      type: 'button',
      className: `pagination-btn pagination-btn--page ${pageNumber === this.currentPage ? 'pagination-btn--active' : ''}`,
      'data-page': pageNumber,
      'aria-label': `Go to page ${pageNumber}`,
      'aria-current': pageNumber === this.currentPage ? 'page' : null
    }, pageNumber.toString());
    
    return button;
  }

  /**
   * Create ellipsis element
   */
  createEllipsis() {
    return DOMUtils.createElement('span', {
      className: 'pagination-ellipsis',
      'aria-hidden': 'true'
    }, '...');
  }

  /**
   * Create items per page selector
   */
  createItemsPerPageSelector() {
    const container = DOMUtils.createElement('div', {
      className: 'pagination-items-per-page'
    });
    
    const label = DOMUtils.createElement('label', {
      for: 'items-per-page-select',
      className: 'items-per-page-label'
    }, this.options.labels.itemsPerPage + ':');
    
    const select = DOMUtils.createElement('select', {
      id: 'items-per-page-select',
      className: 'items-per-page-select'
    });
    
    this.options.itemsPerPageOptions.forEach(option => {
      const optionElement = DOMUtils.createElement('option', {
        value: option,
        selected: option === this.itemsPerPage
      }, option.toString());
      select.appendChild(optionElement);
    });
    
    container.appendChild(label);
    container.appendChild(select);
    
    return container;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Page navigation buttons
    const navButtons = this.findAll('.pagination-btn');
    navButtons.forEach(button => {
      this.addEventListener(button, 'click', this.handlePageClick);
    });
    
    // Items per page selector
    const itemsPerPageSelect = this.find('.items-per-page-select');
    if (itemsPerPageSelect) {
      this.addEventListener(itemsPerPageSelect, 'change', this.handleItemsPerPageChange);
    }
    
    // Keyboard navigation
    this.addEventListener(this.element, 'keydown', this.handleKeydown);
  }

  /**
   * Handle page button click
   */
  handlePageClick(event) {
    const button = event.target;
    const page = parseInt(button.getAttribute('data-page'));
    
    if (!button.disabled && page !== this.currentPage) {
      this.goToPage(page);
    }
  }

  /**
   * Handle items per page change
   */
  handleItemsPerPageChange(event) {
    const newItemsPerPage = parseInt(event.target.value);
    this.setItemsPerPage(newItemsPerPage);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event) {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.goToPreviousPage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.goToNextPage();
        break;
      case 'Home':
        event.preventDefault();
        this.goToPage(1);
        break;
      case 'End':
        event.preventDefault();
        this.goToPage(this.totalPages);
        break;
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    const oldPage = this.currentPage;
    this.currentPage = page;
    
    this.render();
    
    this.emit(EVENTS.PAGE_CHANGED, {
      currentPage: this.currentPage,
      previousPage: oldPage,
      totalPages: this.totalPages,
      itemsPerPage: this.itemsPerPage
    });
  }

  /**
   * Go to next page
   */
  goToNextPage() {
    this.goToPage(this.currentPage + 1);
  }

  /**
   * Go to previous page
   */
  goToPreviousPage() {
    this.goToPage(this.currentPage - 1);
  }

  /**
   * Set items per page
   */
  setItemsPerPage(itemsPerPage) {
    if (itemsPerPage === this.itemsPerPage) {
      return;
    }
    
    const oldItemsPerPage = this.itemsPerPage;
    this.itemsPerPage = itemsPerPage;
    
    // Recalculate total pages
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Adjust current page if necessary
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    
    this.render();
    
    this.emit(EVENTS.PAGE_SIZE_CHANGED, {
      itemsPerPage: this.itemsPerPage,
      previousItemsPerPage: oldItemsPerPage,
      currentPage: this.currentPage,
      totalPages: this.totalPages
    });
  }

  /**
   * Update pagination data
   */
  updateData(data) {
    const { totalItems, currentPage, itemsPerPage } = data;
    
    this.totalItems = totalItems || this.totalItems;
    this.itemsPerPage = itemsPerPage || this.itemsPerPage;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = Math.min(currentPage || this.currentPage, this.totalPages);
    
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    
    this.render();
  }

  /**
   * Get current pagination state
   */
  getState() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.totalItems,
      itemsPerPage: this.itemsPerPage,
      startItem: (this.currentPage - 1) * this.itemsPerPage + 1,
      endItem: Math.min(this.currentPage * this.itemsPerPage, this.totalItems)
    };
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('pagination-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'pagination-styles';
    style.textContent = darkModeManager.generateAdaptiveCSS(`
      .pagination-component {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        padding: 16px 0;
      }

      .pagination-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        width: 100%;
      }

      .pagination-info {
        font-size: 14px;
        color: #6b7280;
        text-align: center;
      }

      .pagination-navigation {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .pagination-btn {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        background: white;
        color: #374151;
        font-size: 14px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pagination-btn:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #9ca3af;
      }

      .pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #f9fafb;
      }

      .pagination-btn--active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .pagination-btn--active:hover {
        background: #2563eb;
        border-color: #2563eb;
      }

      .pagination-ellipsis {
        padding: 8px 4px;
        color: #6b7280;
        font-size: 14px;
      }

      .pagination-items-per-page {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }

      .items-per-page-label {
        color: #374151;
        font-weight: 500;
      }

      .items-per-page-select {
        padding: 4px 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
        color: #374151;
        font-size: 14px;
        cursor: pointer;
      }

      .items-per-page-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      /* Themes */
      .pagination-component--minimal .pagination-btn {
        border: none;
        background: transparent;
      }

      .pagination-component--minimal .pagination-btn:hover:not(:disabled) {
        background: #f3f4f6;
      }

      .pagination-component--minimal .pagination-btn--active {
        background: #3b82f6;
        color: white;
      }

      .pagination-component--compact .pagination-content {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }

      .pagination-component--compact .pagination-navigation {
        order: 2;
      }

      .pagination-component--compact .pagination-info {
        order: 1;
        font-size: 12px;
      }

      .pagination-component--compact .pagination-items-per-page {
        order: 3;
        font-size: 12px;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .pagination-component {
          font-size: 12px;
        }
        
        .pagination-btn {
          padding: 6px 8px;
          font-size: 12px;
          min-width: 32px;
        }
        
        .pagination-btn--first,
        .pagination-btn--last {
          display: none;
        }
        
        .pagination-info {
          font-size: 12px;
        }
        
        .pagination-items-per-page {
          font-size: 12px;
        }
      }

      @media (max-width: 480px) {
        .pagination-content {
          flex-direction: column;
        }
        
        .pagination-navigation {
          flex-wrap: wrap;
          justify-content: center;
        }
      }
    `, {
      '.pagination-component': {
        'color': 'var(--color-text-primary)'
      },
      '.pagination-info': {
        'color': 'var(--color-text-secondary)'
      },
      '.pagination-navigation': {
        'background': 'var(--color-bg-primary)',
        'border-color': 'var(--color-border-medium)'
      },
      '.pagination-button': {
        'background': 'var(--color-bg-primary)',
        'border-color': 'var(--color-border-medium)',
        'color': 'var(--color-text-primary)'
      },
      '.pagination-button:hover': {
        'background': 'var(--color-bg-secondary)',
        'border-color': 'var(--color-primary-300)',
        'color': 'var(--color-primary-400)'
      },
      '.pagination-button:disabled': {
        'background': 'var(--color-bg-muted)',
        'color': 'var(--color-text-muted)',
        'border-color': 'var(--color-border-light)'
      },
      '.pagination-button--active': {
        'background': 'var(--color-primary-400)',
        'border-color': 'var(--color-primary-400)',
        'color': 'var(--color-text-inverse)'
      },
      '.pagination-button--active:hover': {
        'background': 'var(--color-primary-500)',
        'border-color': 'var(--color-primary-500)'
      },
      '.pagination-ellipsis': {
        'color': 'var(--color-text-muted)'
      },
      '.pagination-jump': {
        'background': 'var(--color-bg-primary)',
        'border-color': 'var(--color-border-medium)',
        'color': 'var(--color-text-primary)'
      },
      '.pagination-jump:focus': {
        'border-color': 'var(--color-primary-400)',
        'box-shadow': '0 0 0 2px var(--focus-ring-color)'
      }
    });
    
    document.head.appendChild(style);
  }
}

// Default export
export default Pagination;
