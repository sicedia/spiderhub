/**
 * SocialInteractionCoordinator
 * Coordinates social interactions (sharing, bookmarking, copying links)
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';

export class SocialInteractionCoordinator {
  constructor(documentId, documentData, options = {}) {
    this.logger = logger.child({
      component: 'SocialInteractionCoordinator'
    });
    
    this.documentId = documentId;
    this.documentData = documentData;
    this.options = {
      enableSharing: true,
      enableBookmarking: true,
      notificationDuration: 3000,
      ...options
    };
    
    this.logger.debug('SocialInteractionCoordinator initialized', {
      documentId: this.documentId
    });
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing SocialInteractionCoordinator');
    
    if (this.options.enableSharing) {
      this.initializeSharing();
    }
    
    if (this.options.enableBookmarking) {
      this.initializeBookmarking();
    }
    
    this.setupEventListeners();
    
    this.logger.info('SocialInteractionCoordinator initialized successfully');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for document data updates
    eventBus.on(EVENTS.DOCUMENT_LOADED, this.handleDocumentLoaded.bind(this), this);
    
    this.logger.debug('Event listeners configured');
  }

  /**
   * Handle document loaded event
   */
  handleDocumentLoaded(data) {
    if (data.documentId === this.documentId) {
      this.documentData = data.documentData;
      this.logger.debug('Document data updated');
    }
  }

  /**
   * Initialize sharing functionality
   */
  initializeSharing() {
    const shareButtons = document.querySelectorAll('.share-button');
    
    shareButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const platform = button.getAttribute('data-platform');
        this.shareDocument(platform);
      });
    });

    // Copy link button
    const copyLinkButton = document.querySelector('.copy-link-button');
    if (copyLinkButton) {
      copyLinkButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.copyDocumentLink();
      });
    }

    this.logger.debug('Sharing initialized', { 
      shareButtonsCount: shareButtons.length,
      hasCopyLink: !!copyLinkButton
    });
  }

  /**
   * Share document on social platform
   */
  shareDocument(platform) {
    if (!this.documentData) {
      this.logger.warn('No document data available for sharing');
      return;
    }

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
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${title}%0A${url}`;
        break;
      default:
        this.logger.warn('Unknown sharing platform', { platform });
        return;
    }
    
    this.logger.info('Sharing document', { platform, documentId: this.documentId });

    // Open share URL
    if (platform === 'email') {
      window.location.href = shareUrl;
    } else {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    
    // Emit sharing event
    eventBus.emit(EVENTS.DOCUMENT_SHARED, {
      documentId: this.documentId,
      platform: platform
    });
  }

  /**
   * Copy document link to clipboard
   */
  async copyDocumentLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      
      this.logger.info('Link copied to clipboard', { documentId: this.documentId });
      
      // Show success notification
      this.showNotification('Link copied to clipboard!', 'success');
      
      // Emit copy event
      eventBus.emit(EVENTS.DOCUMENT_LINK_COPIED, {
        documentId: this.documentId,
        url: window.location.href
      });
      
    } catch (error) {
      this.logger.error('Failed to copy link', error);
      this.showNotification('Failed to copy link', 'error');
    }
  }

  /**
   * Initialize bookmarking functionality
   */
  initializeBookmarking() {
    const bookmarkButton = document.querySelector('.bookmark-button');
    if (!bookmarkButton) {
      this.logger.debug('No bookmark button found');
      return;
    }
    
    // Check if document is bookmarked
    const isBookmarked = this.isDocumentBookmarked(this.documentId);
    this.updateBookmarkButton(bookmarkButton, isBookmarked);
    
    // Add click handler
    bookmarkButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.toggleBookmark();
    });

    this.logger.debug('Bookmarking initialized', { 
      isBookmarked: isBookmarked
    });
  }

  /**
   * Toggle document bookmark
   */
  async toggleBookmark() {
    const bookmarkButton = document.querySelector('.bookmark-button');
    if (!bookmarkButton) return;
    
    const isCurrentlyBookmarked = this.isDocumentBookmarked(this.documentId);
    
    try {
      if (isCurrentlyBookmarked) {
        await this.removeBookmark(this.documentId);
        this.updateBookmarkButton(bookmarkButton, false);
        this.showNotification('Bookmark removed', 'info');
        
        this.logger.info('Bookmark removed', { documentId: this.documentId });
        
        // Emit unbookmark event
        eventBus.emit(EVENTS.DOCUMENT_UNBOOKMARKED, {
          documentId: this.documentId
        });
        
      } else {
        await this.addBookmark(this.documentId);
        this.updateBookmarkButton(bookmarkButton, true);
        this.showNotification('Document bookmarked', 'success');
        
        this.logger.info('Document bookmarked', { documentId: this.documentId });
        
        // Emit bookmark event
        eventBus.emit(EVENTS.DOCUMENT_BOOKMARKED, {
          documentId: this.documentId
        });
      }
      
    } catch (error) {
      this.logger.error('Failed to toggle bookmark', error);
      this.showNotification('Failed to update bookmark', 'error');
    }
  }

  /**
   * Check if document is bookmarked
   */
  isDocumentBookmarked(documentId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDocuments') || '[]');
    return bookmarks.includes(documentId);
  }

  /**
   * Add bookmark
   */
  async addBookmark(documentId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDocuments') || '[]');
    if (!bookmarks.includes(documentId)) {
      bookmarks.push(documentId);
      localStorage.setItem('bookmarkedDocuments', JSON.stringify(bookmarks));
    }
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(documentId) {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDocuments') || '[]');
    const index = bookmarks.indexOf(documentId);
    if (index > -1) {
      bookmarks.splice(index, 1);
      localStorage.setItem('bookmarkedDocuments', JSON.stringify(bookmarks));
    }
  }

  /**
   * Update bookmark button UI
   */
  updateBookmarkButton(button, isBookmarked) {
    const icon = button.querySelector('.bookmark-icon');
    const text = button.querySelector('.bookmark-text');
    
    if (isBookmarked) {
      button.classList.add('bookmarked');
      button.setAttribute('aria-label', 'Remove bookmark');
      if (icon) icon.textContent = '★';
      if (text) text.textContent = 'Bookmarked';
    } else {
      button.classList.remove('bookmarked');
      button.setAttribute('aria-label', 'Add bookmark');
      if (icon) icon.textContent = '☆';
      if (text) text.textContent = 'Bookmark';
    }
  }

  /**
   * Show notification message
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = DOMUtils.createElement('div', {
      className: `notification notification--${type}`,
      role: 'alert',
      'aria-live': 'polite'
    });

    // Set styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      background: type === 'success' ? '#10b981' : 
                  type === 'error' ? '#ef4444' : 
                  type === 'warning' ? '#f59e0b' : '#3b82f6',
      color: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: '10000',
      animation: 'slideIn 0.3s ease-out',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '300px'
    });

    notification.textContent = message;
    document.body.appendChild(notification);

    this.logger.debug('Notification shown', { message, type });

    // Remove after duration
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, this.options.notificationDuration);
  }

  /**
   * Get all bookmarked documents
   */
  getAllBookmarks() {
    return JSON.parse(localStorage.getItem('bookmarkedDocuments') || '[]');
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying SocialInteractionCoordinator');
    
    // Remove event listeners
    eventBus.offContext(this);
    
    this.logger.debug('SocialInteractionCoordinator destroyed');
  }
}

export default SocialInteractionCoordinator;

