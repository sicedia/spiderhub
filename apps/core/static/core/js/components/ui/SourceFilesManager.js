/**
 * Source Files Manager Component
 * Handles source files interactions, analytics, and user feedback
 * Simplified version without dropdown logic - files are now in sidebar card
 * ES6 Module following the established architecture
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { eventBus } from '../../core/events/EventBus.js';
import { EVENTS } from '../../core/constants/config.js';
import { logger } from '../../core/logger/Logger.js';

export class SourceFilesManager extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    // Initialize logger after super() call
    this.logger = logger.child({ component: 'SourceFilesManager' });
    
    this.interactionStats = {
      downloads: 0,
      externalLinksOpened: 0,
    };
    
    // Options
    this.options = {
      enableAnalytics: true,
      enableCopyToClipboard: true,
      enableDownloadTracking: true,
      enableExternalLinkTracking: true,
      showFileSizeTooltips: true,
      showDownloadProgress: true,
      ...options
    };
    
    // Log initialization after everything is set up
    if (this.logger) {
      this.logger.debug('SourceFilesManager constructor completed');
    }
  }

  init() {
    try {
      // The element passed is the source files card itself
      this.sourceFilesCard = this.element;
      
      if (!this.sourceFilesCard) {
        return;
      }
      
      // Log success after logger is initialized
      if (this.logger) {
        this.logger.info('SourceFilesManager initialized successfully');
      }
    } catch (error) {
      // Log error after logger is initialized
      if (this.logger) {
        this.logger.error('Failed to initialize SourceFilesManager', error);
      }
      throw error;
    }
  }

  bindEvents() {
    this.setupEventListeners();
    this.setupKeyboardNavigation();
  }

  setupEventListeners() {
    // Download links
    const downloadLinks = this.sourceFilesCard.querySelectorAll('.source-file-item__action--download');
    downloadLinks.forEach(link => {
      this.addEventListener(link, 'click', this.handleDownload);
    });
    
    // External links
    const externalLinks = this.sourceFilesCard.querySelectorAll('.source-file-item__action--external');
    externalLinks.forEach(link => {
      this.addEventListener(link, 'click', this.handleExternalLinkClick);
    });
    
    // File items hover effects
    const fileItems = this.sourceFilesCard.querySelectorAll('.source-file-item');
    fileItems.forEach(item => {
      this.addEventListener(item, 'mouseenter', this.handleItemHover);
      this.addEventListener(item, 'mouseleave', this.handleItemLeave);
    });
  }

  setupKeyboardNavigation() {
    const fileItems = this.sourceFilesCard.querySelectorAll('.source-file-item');
    
    fileItems.forEach(item => {
      item.addEventListener('keydown', (e) => {
        const actions = item.querySelectorAll('.source-file-item__action');
        
        switch (e.key) {
          case 'Enter':
          case ' ':
            e.preventDefault();
            // Focus first action button
            if (actions.length > 0) {
              actions[0].focus();
            }
            break;
          case 'ArrowRight':
            e.preventDefault();
            const nextAction = this.getNextAction(item, actions, 1);
            if (nextAction) nextAction.focus();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            const prevAction = this.getNextAction(item, actions, -1);
            if (prevAction) prevAction.focus();
            break;
        }
      });
      
      // Make file items focusable
      item.setAttribute('tabindex', '0');
    });
  }

  getNextAction(currentItem, actions, direction) {
    const currentIndex = Array.from(actions).indexOf(document.activeElement);
    const nextIndex = currentIndex + direction;
    
    if (nextIndex >= 0 && nextIndex < actions.length) {
      return actions[nextIndex];
    }
    
    // Move to next/previous file item
    const allItems = Array.from(this.sourceFilesCard.querySelectorAll('.source-file-item'));
    const currentItemIndex = allItems.indexOf(currentItem);
    const nextItemIndex = currentItemIndex + direction;
    
    if (nextItemIndex >= 0 && nextItemIndex < allItems.length) {
      const nextItem = allItems[nextItemIndex];
      const nextItemActions = nextItem.querySelectorAll('.source-file-item__action');
      return direction > 0 ? nextItemActions[0] : nextItemActions[nextItemActions.length - 1];
    }
    
    return null;
  }

  handleItemHover(e) {
    const item = e.currentTarget;
    const icon = item.querySelector('.source-file-item__icon');
    const filename = item.querySelector('.source-file-item__name');
    
    if (icon && filename) {
      icon.style.transform = 'scale(1.05)';
      filename.style.color = 'var(--color-primary-600)';
    }
  }

  handleItemLeave(e) {
    const item = e.currentTarget;
    const icon = item.querySelector('.source-file-item__icon');
    const filename = item.querySelector('.source-file-item__name');
    
    if (icon && filename) {
      icon.style.transform = 'scale(1)';
      filename.style.color = '';
    }
  }

  handleDownload(e) {
    const link = e.currentTarget;
    const filename = link.getAttribute('aria-label') || 'Unknown file';
    
    this.interactionStats.downloads++;
    
    // Analytics
    if (this.options.enableAnalytics) {
      eventBus.emit(EVENTS.ANALYTICS.TRACK, {
        event: 'source_file_downloaded',
        properties: {
          filename: filename,
          fileType: this.getFileTypeFromElement(link)
        }
      });
    }
    
    // Visual feedback
    if (this.options.showDownloadProgress) {
      this.showDownloadFeedback(link);
    }
    
    this.logger.info('File download initiated', { filename });
  }

  handleExternalLinkClick(e) {
    const link = e.currentTarget;
    const filename = link.getAttribute('aria-label') || 'Unknown file';
    
    this.interactionStats.externalLinksOpened++;
    
    // Analytics
    if (this.options.enableAnalytics) {
      eventBus.emit(EVENTS.ANALYTICS.TRACK, {
        event: 'external_link_opened',
        properties: {
          filename: filename,
          url: link.href
        }
      });
    }
    
    // Copy to clipboard if enabled
    if (this.options.enableCopyToClipboard) {
      this.copyToClipboard(link.href);
    }
    
    this.logger.info('External link opened', { filename, url: link.href });
  }

  getFileTypeFromElement(element) {
    const item = element.closest('.source-file-item');
    const icon = item?.querySelector('.source-file-item__icon');
    return icon?.className.match(/source-file-item__icon--(\w+)/)?.[1] || 'unknown';
  }

  showDownloadFeedback(element) {
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = 'var(--color-success-500)';
    
    setTimeout(() => {
      element.style.backgroundColor = originalBg;
    }, 500);
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.logger.debug('URL copied to clipboard');
      
      // Emit notification event using event bus
      eventBus.emit(EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: 'Link copied to clipboard',
        duration: 3000
      });
    } catch (error) {
      this.logger.warn('Failed to copy to clipboard', error);
      
      // Emit error notification
      eventBus.emit(EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: 'Failed to copy link to clipboard',
        duration: 5000
      });
    }
  }

  getInteractionStats() {
    return {
      ...this.interactionStats
    };
  }

  destroy() {
    this.logger.debug('SourceFilesManager destroyed');
    // BaseComponent handles cleanup automatically
  }
}

// Default export
export default SourceFilesManager;