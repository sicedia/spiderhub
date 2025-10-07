/**
 * ResultsList Component
 * Enhanced component for displaying search results with better visual hierarchy
 * Follows SOLID principles and component-based architecture
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { EVENTS } from '../../core/constants/config.js';

export class ResultsList extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
  }

  getDefaultOptions() {
    return {
      emptyMessage: 'No documents found',
      emptyDescription: 'Try adjusting your search or filters to find what you\'re looking for.',
      loadingMessage: 'Loading documents...',
      itemTemplate: null,
      enableVirtualization: false,
      itemsPerPage: 20
    };
  }

  init() {
    this.cacheElements();
    this.state = {
      items: [],
      isLoading: false,
      isEmpty: false
    };
  }

  cacheElements() {
    this.elements = {
      list: this.element,
      emptyState: DOMUtils.getElement('.explore-results__empty'),
      loadingState: DOMUtils.getElement('.explore-results__loading')
    };
  }

  /**
   * Render results with improved visual hierarchy
   */
  renderResults(items = []) {
    this.state.items = items;
    this.state.isEmpty = items.length === 0;
    
    if (this.state.isEmpty) {
      this.showEmptyState();
      return;
    }

    this.hideEmptyState();
    this.hideLoadingState();
    
    // Clear existing items
    this.clearResults();

    // Render new items
    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
      const itemElement = this.renderItem(item, index);
      if (itemElement) {
        fragment.appendChild(itemElement);
      }
    });

    this.elements.list.appendChild(fragment);
    this.elements.list.setAttribute('aria-busy', 'false');
    
    // Emit event
    this.emit(EVENTS.DATA_LOADED, { 
      count: items.length,
      items 
    });
  }

  /**
   * Render a single result item
   */
  renderItem(item, index) {
    const li = DOMUtils.createElement('li', {
      className: 'documents-list__item',
      role: 'listitem'
    });

    const article = DOMUtils.createElement('article', {
      className: 'document-list-item',
      'data-item-id': item.id,
      tabindex: '0'
    });

    // Icon
    const icon = this.createIcon(item);
    
    // Content
    const content = this.createContent(item);
    
    // Actions
    const actions = this.createActions(item);

    article.appendChild(icon);
    article.appendChild(content);
    if (actions) {
      article.appendChild(actions);
    }

    li.appendChild(article);
    
    // Add intersection observer for lazy loading
    if (this.options.enableVirtualization) {
      this.observeItem(article, index);
    }

    return li;
  }

  /**
   * Create item icon
   */
  createIcon(item) {
    const iconContainer = DOMUtils.createElement('div', {
      className: 'document-icon',
      'aria-hidden': 'true'
    });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z');
    
    svg.appendChild(path);
    iconContainer.appendChild(svg);
    
    return iconContainer;
  }

  /**
   * Create item content
   */
  createContent(item) {
    const content = DOMUtils.createElement('div', {
      className: 'document-list-content'
    });

    // Title
    const title = DOMUtils.createElement('h3', {
      className: 'document-list-title'
    }, item.title || 'Untitled Document');

    // Meta information
    const meta = DOMUtils.createElement('div', {
      className: 'document-list-meta'
    });

    if (item.date) {
      const dateSpan = DOMUtils.createElement('span', {
        className: 'document-list-meta-item'
      }, `📅 ${item.date}`);
      meta.appendChild(dateSpan);
    }

    if (item.type) {
      const typeSpan = DOMUtils.createElement('span', {
        className: 'document-list-meta-item'
      }, item.type);
      meta.appendChild(typeSpan);
    }

    // Tags
    const tags = this.createTags(item);

    // Excerpt (if available)
    let excerpt = null;
    if (item.excerpt) {
      excerpt = DOMUtils.createElement('p', {
        className: 'document-excerpt'
      }, item.excerpt);
    }

    content.appendChild(title);
    content.appendChild(meta);
    if (tags) {
      content.appendChild(tags);
    }
    if (excerpt) {
      content.appendChild(excerpt);
    }

    return content;
  }

  /**
   * Create tags
   */
  createTags(item) {
    if (!item.tags || item.tags.length === 0) {
      return null;
    }

    const tagsContainer = DOMUtils.createElement('div', {
      className: 'document-list-tags'
    });

    item.tags.forEach(tag => {
      const tagElement = DOMUtils.createElement('span', {
        className: `doc-tag ${tag.type || ''}`,
        'aria-label': `${tag.label} tag`
      }, tag.label);
      
      tagsContainer.appendChild(tagElement);
    });

    return tagsContainer;
  }

  /**
   * Create item actions
   */
  createActions(item) {
    const actions = DOMUtils.createElement('div', {
      className: 'document-list-actions'
    });

    if (item.url) {
      const viewButton = DOMUtils.createElement('a', {
        href: item.url,
        className: 'button button--sm button--primary',
        'aria-label': `View details for ${item.title}`
      }, 'View Details');
      
      actions.appendChild(viewButton);
    }

    return actions.children.length > 0 ? actions : null;
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    this.state.isLoading = true;
    this.elements.list.setAttribute('aria-busy', 'true');
    
    if (this.elements.loadingState) {
      this.elements.loadingState.hidden = false;
    }
    
    this.elements.list.hidden = true;
    this.hideEmptyState();
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    this.state.isLoading = false;
    
    if (this.elements.loadingState) {
      this.elements.loadingState.hidden = true;
    }
    
    this.elements.list.hidden = false;
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    if (this.elements.emptyState) {
      this.elements.emptyState.hidden = false;
    }
    
    this.elements.list.hidden = true;
    this.hideLoadingState();
  }

  /**
   * Hide empty state
   */
  hideEmptyState() {
    if (this.elements.emptyState) {
      this.elements.emptyState.hidden = true;
    }
    
    this.elements.list.hidden = false;
  }

  /**
   * Clear all results
   */
  clearResults() {
    while (this.elements.list.firstChild) {
      this.elements.list.removeChild(this.elements.list.firstChild);
    }
  }

  /**
   * Append items to existing list
   */
  appendItems(items = []) {
    const fragment = document.createDocumentFragment();
    
    items.forEach((item, index) => {
      const itemElement = this.renderItem(item, this.state.items.length + index);
      if (itemElement) {
        fragment.appendChild(itemElement);
      }
    });

    this.elements.list.appendChild(fragment);
    this.state.items = [...this.state.items, ...items];
    
    this.emit('items:appended', { 
      count: items.length,
      total: this.state.items.length 
    });
  }

  /**
   * Observe item for lazy loading
   */
  observeItem(element, index) {
    if (!this.observer) {
      this.observer = DOMUtils.createIntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '50px' });
    }

    this.observer.observe(element);
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update count
   */
  updateCount(count) {
    this.emit('count:updated', { count });
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    super.destroy();
  }
}

export default ResultsList;

