/**
 * Document Detail Page Manager
 * Manages the document detail page functionality
 * ES6 Module Export
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { DOMUtils } from '../core/utils/dom.js';
import { APIUtils } from '../core/utils/api.js';
import { ValidationUtils } from '../core/utils/validation.js';
import { Tooltip } from '../components/ui/Tooltip.js';
import { EVENT_TYPES } from '../core/constants/enums.js';

export class DocumentDetailManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    this.documentId = this.getDocumentId();
    this.documentData = null;
    this.relatedDocuments = [];
    this.userInteractions = {
      viewStartTime: Date.now(),
      scrollDepth: 0,
      sectionsViewed: new Set()
    };
  }

  /**
   * Default options for document detail page
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      enablePrintMode: true,
      enableSharing: true,
      enableBookmarking: true,
      enableComments: false,
      enableRelatedDocuments: true,
      enableAnalytics: true,
      scrollSpyOffset: 100,
      lazyLoadImages: true
    };
  }

  /**
   * Get document ID from URL or data attribute
   */
  getDocumentId() {
    // Try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let docId = urlParams.get('id');
    
    // Try to get from data attribute
    if (!docId) {
      docId = this.element.getAttribute('data-document-id');
    }
    
    // Try to get from path
    if (!docId) {
      const pathMatch = window.location.pathname.match(/\/document\/(\d+)/);
      if (pathMatch) {
        docId = pathMatch[1];
      }
    }
    
    return docId;
  }

  /**
   * Initialize services
   */
  async initializeServices() {
    // Initialize analytics if enabled
    if (this.options.enableAnalytics) {
      this.initializeAnalytics();
    }
  }

  /**
   * Load page data
   */
  async loadPageData() {
    if (!this.documentId) {
      throw new Error('No document ID provided');
    }

    try {
      // Load document data
      this.documentData = await this.loadDocumentData(this.documentId);
      
      // Load related documents if enabled
      if (this.options.enableRelatedDocuments) {
        this.relatedDocuments = await this.loadRelatedDocuments(this.documentId);
      }
      
      this.pageData = {
        document: this.documentData,
        relatedDocuments: this.relatedDocuments
      };
      
    } catch (error) {
      this.logger.error('Failed to load document data', error, {
        documentId: this.documentId
      });
      this.handleDocumentLoadError(error);
    }
  }

  /**
   * Initialize components
   */
  async initializeComponents() {
    // Initialize document content
    this.initializeDocumentContent();
    
    // Initialize navigation
    this.initializeTableOfContents();
    
    // Initialize sharing
    if (this.options.enableSharing) {
      this.initializeSharing();
    }
    
    // Initialize bookmarking
    if (this.options.enableBookmarking) {
      this.initializeBookmarking();
    }
    
    // Initialize print mode
    if (this.options.enablePrintMode) {
      this.initializePrintMode();
    }
    
    // Initialize related documents
    if (this.options.enableRelatedDocuments && this.relatedDocuments.length > 0) {
      this.initializeRelatedDocuments();
    }
    
    // Initialize tooltips
    this.initializeTooltips();
    
    // Initialize lazy loading
    if (this.options.lazyLoadImages) {
      this.initializeLazyLoading();
    }
    
    // Initialize scroll tracking
    this.initializeScrollTracking();
  }

  /**
   * Load document data
   */
  async loadDocumentData(documentId) {
    try {
      // In a real application, this would be an API call
      const response = await APIUtils.get(`/api/documents/${documentId}`);
      return response;
    } catch (error) {
      // Fallback to mock data for development
      this.logger.warn('Using mock document data', {
        documentId
      });
      return this.getMockDocumentData(documentId);
    }
  }

  /**
   * Load related documents
   */
  async loadRelatedDocuments(documentId) {
    try {
      const response = await APIUtils.get(`/api/documents/${documentId}/related`);
      return response.documents || [];
    } catch (error) {
      this.logger.warn('Failed to load related documents', error);
      return [];
    }
  }

  /**
   * Initialize document content
   */
  initializeDocumentContent() {
    if (!this.documentData) return;
    
    // Update page title
    document.title = `${this.documentData.title} - SpiderHub`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && this.documentData.summary) {
      metaDescription.setAttribute('content', this.documentData.summary);
    }
    
    // Populate document metadata
    this.populateDocumentMetadata();
    
    // Process document content
    this.processDocumentContent();
  }

  /**
   * Populate document metadata
   */
  populateDocumentMetadata() {
    const metadata = {
      title: this.documentData.title,
      date: this.formatDate(this.documentData.date),
      country: this.documentData.country,
      type: this.documentData.type,
      theme: this.documentData.theme,
      actors: this.documentData.actors,
      beneficiaries: this.documentData.beneficiaries,
      sdgs: this.documentData.sdgs
    };
    
    Object.entries(metadata).forEach(([key, value]) => {
      const element = DOMUtils.getElement(`[data-document-${key}]`);
      if (element && value) {
        if (Array.isArray(value)) {
          element.textContent = value.join(', ');
        } else {
          element.textContent = value;
        }
      }
    });
  }

  /**
   * Process document content
   */
  processDocumentContent() {
    const contentContainer = DOMUtils.getElement('.document-content');
    if (!contentContainer || !this.documentData.content) return;
    
    // Set content
    contentContainer.innerHTML = this.documentData.content;
    
    // Add section IDs for navigation
    const headings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = `section-${index + 1}`;
      }
    });
    
    // Process links to open in new tab if external
    const links = contentContainer.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('http') || href.startsWith('//')) && !href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  /**
   * Initialize table of contents
   */
  initializeTableOfContents() {
    const tocContainer = DOMUtils.getElement('.table-of-contents');
    const contentContainer = DOMUtils.getElement('.document-content');
    
    if (!tocContainer || !contentContainer) return;
    
    const headings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) return;
    
    // Create TOC list
    const tocList = DOMUtils.createElement('ul', {
      className: 'toc-list'
    });
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      const listItem = DOMUtils.createElement('li', {
        className: `toc-item toc-level-${level}`
      });
      
      const link = DOMUtils.createElement('a', {
        href: `#${heading.id}`,
        className: 'toc-link'
      }, heading.textContent);
      
      listItem.appendChild(link);
      tocList.appendChild(listItem);
    });
    
    tocContainer.appendChild(tocList);
    
    // Add smooth scrolling
    this.addEventListener(tocContainer, 'click', (event) => {
      const link = event.target.closest('.toc-link');
      if (link) {
        event.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          DOMUtils.scrollToElement(targetElement, {
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
    
    // Highlight current section
    this.initializeScrollSpy(headings);
  }

  /**
   * Initialize scroll spy for TOC
   */
  initializeScrollSpy(headings) {
    const tocLinks = this.findAll('.toc-link');
    if (tocLinks.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const tocLink = this.find(`.toc-link[href="#${id}"]`);
        
        if (entry.isIntersecting) {
          // Remove active class from all links
          tocLinks.forEach(link => link.classList.remove('active'));
          // Add active class to current link
          if (tocLink) {
            tocLink.classList.add('active');
          }
          
          // Track section view
          this.userInteractions.sectionsViewed.add(id);
        }
      });
    }, {
      rootMargin: `-${this.options.scrollSpyOffset}px 0px -50% 0px`
    });
    
    headings.forEach(heading => observer.observe(heading));
  }

  /**
   * Initialize sharing functionality
   */
  initializeSharing() {
    const shareButtons = this.findAll('.share-button');
    
    shareButtons.forEach(button => {
      this.addEventListener(button, 'click', (event) => {
        event.preventDefault();
        const platform = button.getAttribute('data-platform');
        this.shareDocument(platform);
      });
    });
    
    // Copy link button
    const copyLinkButton = this.find('.copy-link-button');
    if (copyLinkButton) {
      this.addEventListener(copyLinkButton, 'click', (event) => {
        event.preventDefault();
        this.copyDocumentLink();
      });
    }
  }

  /**
   * Share document on social platform
   */
  shareDocument(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.documentData.title);
    const summary = encodeURIComponent(this.documentData.summary || '');
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${title}&body=${summary}%0A%0A${url}`;
        break;
      default:
        this.logger.warn('Unknown sharing platform', { platform });
        return;
    }
    
    if (platform === 'email') {
      window.location.href = shareUrl;
    } else {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    // Track sharing
    this.emit(EVENT_TYPES.DOCUMENT_SHARED, {
      documentId: this.documentId,
      platform
    });
  }

  /**
   * Copy document link to clipboard
   */
  async copyDocumentLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      
      // Show success message
      this.showNotification('Link copied to clipboard!', 'success');
      
      // Track copy action
      this.emit(EVENT_TYPES.DOCUMENT_LINK_COPIED, {
        documentId: this.documentId
      });
      
    } catch (error) {
      this.logger.error('Failed to copy link', error);
      this.showNotification('Failed to copy link', 'error');
    }
  }

  /**
   * Initialize bookmarking
   */
  initializeBookmarking() {
    const bookmarkButton = this.find('.bookmark-button');
    if (!bookmarkButton) return;
    
    // Check if document is bookmarked
    const isBookmarked = this.isDocumentBookmarked(this.documentId);
    this.updateBookmarkButton(bookmarkButton, isBookmarked);
    
    this.addEventListener(bookmarkButton, 'click', (event) => {
      event.preventDefault();
      this.toggleBookmark();
    });
  }

  /**
   * Toggle document bookmark
   */
  async toggleBookmark() {
    const bookmarkButton = this.find('.bookmark-button');
    if (!bookmarkButton) return;
    
    const isCurrentlyBookmarked = this.isDocumentBookmarked(this.documentId);
    
    try {
      if (isCurrentlyBookmarked) {
        await this.removeBookmark(this.documentId);
        this.updateBookmarkButton(bookmarkButton, false);
        this.showNotification('Bookmark removed', 'info');
      } else {
        await this.addBookmark(this.documentId);
        this.updateBookmarkButton(bookmarkButton, true);
        this.showNotification('Document bookmarked', 'success');
      }
    } catch (error) {
      this.logger.error('Failed to toggle bookmark', error);
      this.showNotification('Failed to update bookmark', 'error');
    }
  }

  /**
   * Initialize print mode
   */
  initializePrintMode() {
    const printButton = this.find('.print-button');
    if (!printButton) return;
    
    this.addEventListener(printButton, 'click', (event) => {
      event.preventDefault();
      this.printDocument();
    });
    
    // Add print styles
    this.addPrintStyles();
  }

  /**
   * Print document
   */
  printDocument() {
    // Track print action
    this.emit(EVENT_TYPES.DOCUMENT_PRINTED, {
      documentId: this.documentId
    });
    
    window.print();
  }

  /**
   * Initialize related documents
   */
  initializeRelatedDocuments() {
    const relatedContainer = this.find('.related-documents');
    if (!relatedContainer || this.relatedDocuments.length === 0) return;
    
    const relatedList = DOMUtils.createElement('div', {
      className: 'related-documents-list'
    });
    
    this.relatedDocuments.forEach(doc => {
      const docCard = this.createRelatedDocumentCard(doc);
      relatedList.appendChild(docCard);
    });
    
    relatedContainer.appendChild(relatedList);
  }

  /**
   * Create related document card
   */
  createRelatedDocumentCard(doc) {
    const card = DOMUtils.createElement('div', {
      className: 'related-document-card'
    });
    
    card.innerHTML = `
      <h4 class="related-doc-title">
        <a href="/document/${doc.id}">${doc.title}</a>
      </h4>
      <div class="related-doc-meta">
        <span class="doc-country">${doc.country}</span>
        <span class="doc-type">${doc.type}</span>
        <span class="doc-date">${this.formatDate(doc.date)}</span>
      </div>
      ${doc.summary ? `<p class="related-doc-summary">${doc.summary}</p>` : ''}
    `;
    
    return card;
  }

  /**
   * Initialize tooltips
   */
  initializeTooltips() {
    // Initialize tooltips for metadata terms
    const tooltipElements = this.findAll('[data-tooltip]');
    tooltipElements.forEach(element => {
      new Tooltip(element, {
        position: 'top',
        theme: 'dark'
      });
    });
  }

  /**
   * Initialize lazy loading for images
   */
  initializeLazyLoading() {
    const images = this.findAll('img[data-src]');
    if (images.length === 0) return;
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }

  /**
   * Initialize scroll tracking
   */
  initializeScrollTracking() {
    if (!this.options.enableAnalytics) return;
    
    let maxScrollDepth = 0;
    
    const trackScroll = () => {
      const scrollTop = window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        this.userInteractions.scrollDepth = maxScrollDepth;
      }
    };
    
    this.addEventListener(window, 'scroll', this.throttle(trackScroll, 250));
  }

  /**
   * Initialize analytics
   */
  initializeAnalytics() {
    // Track page view
    this.emit(EVENT_TYPES.DOCUMENT_VIEWED, {
      documentId: this.documentId,
      timestamp: Date.now()
    });
    
    // Track time on page when leaving
    this.addEventListener(window, 'beforeunload', () => {
      const timeOnPage = Date.now() - this.userInteractions.viewStartTime;
      this.emit(EVENT_TYPES.DOCUMENT_TIME_TRACKED, {
        documentId: this.documentId,
        timeOnPage,
        scrollDepth: this.userInteractions.scrollDepth,
        sectionsViewed: Array.from(this.userInteractions.sectionsViewed)
      });
    });
  }

  /**
   * Handle document load error
   */
  handleDocumentLoadError(error) {
    const errorContainer = DOMUtils.createElement('div', {
      className: 'document-error alert alert-danger'
    });
    
    if (error.status === 404) {
      errorContainer.innerHTML = `
        <h3>Document Not Found</h3>
        <p>The requested document could not be found. It may have been moved or deleted.</p>
        <a href="/explore" class="btn btn-primary">Browse Documents</a>
      `;
    } else {
      errorContainer.innerHTML = `
        <h3>Error Loading Document</h3>
        <p>There was an error loading the document. Please try again later.</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      `;
    }
    
    // Insert error message at the beginning of the page
    const main = this.find('main') || this.element;
    main.insertBefore(errorContainer, main.firstChild);
  }

  /**
   * Utility methods
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

  isDocumentBookmarked(documentId) {
    // Check localStorage for bookmarks
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDocuments') || '[]');
    return bookmarks.includes(documentId);
  }

  async addBookmark(documentId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDocuments') || '[]');
    if (!bookmarks.includes(documentId)) {
      bookmarks.push(documentId);
      localStorage.setItem('bookmarkedDocuments', JSON.stringify(bookmarks));
    }
  }

  async removeBookmark(documentId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDocuments') || '[]');
    const index = bookmarks.indexOf(documentId);
    if (index > -1) {
      bookmarks.splice(index, 1);
      localStorage.setItem('bookmarkedDocuments', JSON.stringify(bookmarks));
    }
  }

  updateBookmarkButton(button, isBookmarked) {
    const icon = button.querySelector('.bookmark-icon');
    const text = button.querySelector('.bookmark-text');
    
    if (isBookmarked) {
      button.classList.add('bookmarked');
      if (icon) icon.textContent = '★';
      if (text) text.textContent = 'Bookmarked';
    } else {
      button.classList.remove('bookmarked');
      if (icon) icon.textContent = '☆';
      if (text) text.textContent = 'Bookmark';
    }
  }

  showNotification(message, type = 'info') {
    // Simple notification implementation
    const notification = DOMUtils.createElement('div', {
      className: `notification notification--${type}`,
      style: `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 4px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
      `
    }, message);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  addPrintStyles() {
    if (document.getElementById('document-print-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'document-print-styles';
    style.textContent = `
      @media print {
        .no-print,
        .share-buttons,
        .bookmark-button,
        .print-button,
        .table-of-contents,
        .related-documents {
          display: none !important;
        }
        
        .document-content {
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .document-header {
          border-bottom: 2px solid #000;
          margin-bottom: 20px;
          padding-bottom: 10px;
        }
        
        body {
          font-size: 12pt;
          line-height: 1.4;
        }
        
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
        
        p, li {
          orphans: 3;
          widows: 3;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  getMockDocumentData(documentId) {
    return {
      id: documentId,
      title: "Sample Digital Cooperation Document",
      date: "2024-01-15",
      country: "Global",
      type: "Framework",
      theme: "Digital Cooperation",
      actors: ["Government", "Private Sector"],
      beneficiaries: ["Citizens", "Businesses"],
      sdgs: ["SDG 9", "SDG 17"],
      summary: "This is a sample document for demonstration purposes.",
      content: `
        <h2>Introduction</h2>
        <p>This document outlines the framework for digital cooperation...</p>
        
        <h2>Key Principles</h2>
        <p>The following principles guide our approach to digital cooperation...</p>
        
        <h2>Implementation</h2>
        <p>The implementation of this framework will follow these steps...</p>
      `
    };
  }
}

// Default export
export default DocumentDetailManager;
