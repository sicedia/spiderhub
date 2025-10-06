/**
 * Modal Manager Component
 * Handles modal creation, display, and management
 * Follows Single Responsibility Principle - only manages modals
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { CONFIG, EVENTS } from '../../core/constants/config.js';
import { DOMUtils } from '../../core/utils/dom.js';

export class ModalManager extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.activeModals = new Map();
    this.modalStack = [];
    this.zIndexBase = 10000;
    
    this.init();
  }

  getDefaultOptions() {
    return {
      analysisData: null,
      enableAnimations: true,
      enableKeyboardNavigation: true,
      enableClickOutsideToClose: true,
      maxModals: 5,
      animationDuration: 300
    };
  }

  init() {
    this.bindEvents();
    this.addModalStyles();
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Listen for document view requests
    this.addEventListener(document, EVENTS.DOCUMENT_VIEW_REQUESTED, this.handleDocumentViewRequest.bind(this));
    
    // Global keyboard events
    if (this.options.enableKeyboardNavigation) {
      this.addEventListener(document, 'keydown', this.handleGlobalKeydown.bind(this));
    }
  }

  /**
   * Handle document view request
   */
  handleDocumentViewRequest(event) {
    const { document: documentData } = event.detail;
    this.showDocumentModal(documentData);
  }

  /**
   * Show document preview modal
   */
  showDocumentModal(documentData) {
    const modalId = `document-modal-${documentData.id}`;
    
    // Check if modal already exists
    if (this.activeModals.has(modalId)) {
      this.bringToFront(modalId);
      return;
    }

    // Check modal limit
    if (this.activeModals.size >= this.options.maxModals) {
      this.closeOldestModal();
    }

    const modal = this.createDocumentModal(modalId, documentData);
    this.element.appendChild(modal);
    
    // Store modal reference
    this.activeModals.set(modalId, {
      element: modal,
      data: documentData,
      createdAt: Date.now()
    });
    
    this.modalStack.push(modalId);
    
    // Show modal with animation
    if (this.options.enableAnimations) {
      this.animateModalIn(modal);
    } else {
      modal.style.display = 'flex';
    }

    // Emit modal opened event
    this.emit(EVENTS.MODAL_OPENED, {
      modalId,
      document: documentData,
      totalModals: this.activeModals.size
    });
  }

  /**
   * Create document modal
   */
  createDocumentModal(modalId, documentData) {
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'document-preview-modal';
    
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${this.escapeHtml(documentData.title)}</h3>
            <button class="modal-close" aria-label="Close modal">×</button>
          </div>
          <div class="modal-body">
            <div class="document-metadata">
              <div class="metadata-item">
                <strong>Date:</strong> ${documentData.date}
              </div>
              <div class="metadata-item">
                <strong>Country:</strong> ${this.escapeHtml(documentData.country)}
              </div>
              <div class="metadata-item">
                <strong>Type:</strong> ${this.escapeHtml(documentData.type)}
              </div>
              ${documentData.theme ? `
                <div class="metadata-item">
                  <strong>Theme:</strong> ${this.escapeHtml(documentData.theme)}
                </div>
              ` : ''}
              ${documentData.actor ? `
                <div class="metadata-item">
                  <strong>Actor:</strong> ${this.escapeHtml(documentData.actor)}
                </div>
              ` : ''}
            </div>
            <div class="document-actions">
              <a href="document_detail.html?id=${documentData.id}" 
                 class="btn btn-primary">
                View Full Details
              </a>
              <button class="btn btn-secondary export-document" 
                      data-document-id="${documentData.id}">
                Export Document
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Set z-index
    modal.style.zIndex = this.zIndexBase + this.activeModals.size;

    // Add event listeners
    this.addModalEventListeners(modal, modalId);

    return modal;
  }

  /**
   * Add event listeners to modal
   */
  addModalEventListeners(modal, modalId) {
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');
    const exportBtn = modal.querySelector('.export-document');

    // Close button
    if (closeBtn) {
      this.addEventListener(closeBtn, 'click', () => this.closeModal(modalId));
    }

    // Click outside to close
    if (this.options.enableClickOutsideToClose && overlay) {
      this.addEventListener(overlay, 'click', (event) => {
        if (event.target === overlay) {
          this.closeModal(modalId);
        }
      });
    }

    // Export button
    if (exportBtn) {
      this.addEventListener(exportBtn, 'click', () => this.exportDocument(modalId));
    }

    // Prevent modal content clicks from closing modal
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      this.addEventListener(modalContent, 'click', (event) => {
        event.stopPropagation();
      });
    }
  }

  /**
   * Close modal
   */
  closeModal(modalId) {
    const modalInfo = this.activeModals.get(modalId);
    if (!modalInfo) return;

    const { element } = modalInfo;

    if (this.options.enableAnimations) {
      this.animateModalOut(element, () => {
        this.removeModal(modalId);
      });
    } else {
      this.removeModal(modalId);
    }
  }

  /**
   * Remove modal from DOM and cleanup
   */
  removeModal(modalId) {
    const modalInfo = this.activeModals.get(modalId);
    if (!modalInfo) return;

    const { element } = modalInfo;
    
    // Remove from DOM
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }

    // Cleanup references
    this.activeModals.delete(modalId);
    this.modalStack = this.modalStack.filter(id => id !== modalId);

    // Emit modal closed event
    this.emit(EVENTS.MODAL_CLOSED, {
      modalId,
      totalModals: this.activeModals.size
    });
  }

  /**
   * Close oldest modal
   */
  closeOldestModal() {
    if (this.modalStack.length === 0) return;

    const oldestModalId = this.modalStack[0];
    this.closeModal(oldestModalId);
  }

  /**
   * Bring modal to front
   */
  bringToFront(modalId) {
    const modalInfo = this.activeModals.get(modalId);
    if (!modalInfo) return;

    // Move to end of stack
    this.modalStack = this.modalStack.filter(id => id !== modalId);
    this.modalStack.push(modalId);

    // Update z-index
    modalInfo.element.style.zIndex = this.zIndexBase + this.activeModals.size;
  }

  /**
   * Animate modal in
   */
  animateModalIn(modal) {
    modal.style.display = 'flex';
    modal.style.opacity = '0';
    
    const overlay = modal.querySelector('.modal-overlay');
    const content = modal.querySelector('.modal-content');
    
    if (overlay) {
      overlay.style.transform = 'scale(0.95)';
      overlay.style.opacity = '0';
    }
    
    if (content) {
      content.style.transform = 'translateY(-20px)';
      content.style.opacity = '0';
    }

    // Trigger animation
    requestAnimationFrame(() => {
      modal.style.transition = `opacity ${this.options.animationDuration}ms ease-out`;
      modal.style.opacity = '1';
      
      if (overlay) {
        overlay.style.transition = `transform ${this.options.animationDuration}ms ease-out, opacity ${this.options.animationDuration}ms ease-out`;
        overlay.style.transform = 'scale(1)';
        overlay.style.opacity = '1';
      }
      
      if (content) {
        content.style.transition = `transform ${this.options.animationDuration}ms ease-out, opacity ${this.options.animationDuration}ms ease-out`;
        content.style.transform = 'translateY(0)';
        content.style.opacity = '1';
      }
    });
  }

  /**
   * Animate modal out
   */
  animateModalOut(modal, callback) {
    const overlay = modal.querySelector('.modal-overlay');
    const content = modal.querySelector('.modal-content');
    
    modal.style.transition = `opacity ${this.options.animationDuration}ms ease-in`;
    modal.style.opacity = '0';
    
    if (overlay) {
      overlay.style.transition = `transform ${this.options.animationDuration}ms ease-in, opacity ${this.options.animationDuration}ms ease-in`;
      overlay.style.transform = 'scale(0.95)';
      overlay.style.opacity = '0';
    }
    
    if (content) {
      content.style.transition = `transform ${this.options.animationDuration}ms ease-in, opacity ${this.options.animationDuration}ms ease-in`;
      content.style.transform = 'translateY(-20px)';
      content.style.opacity = '0';
    }

    setTimeout(callback, this.options.animationDuration);
  }

  /**
   * Handle global keyboard events
   */
  handleGlobalKeydown(event) {
    if (this.activeModals.size === 0) return;

    switch (event.key) {
      case 'Escape':
        this.closeTopModal();
        break;
      case 'Tab':
        this.handleTabNavigation(event);
        break;
    }
  }

  /**
   * Close top modal
   */
  closeTopModal() {
    if (this.modalStack.length === 0) return;
    
    const topModalId = this.modalStack[this.modalStack.length - 1];
    this.closeModal(topModalId);
  }

  /**
   * Handle tab navigation within modals
   */
  handleTabNavigation(event) {
    const topModal = this.getTopModal();
    if (!topModal) return;

    const focusableElements = topModal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Get top modal element
   */
  getTopModal() {
    if (this.modalStack.length === 0) return null;
    
    const topModalId = this.modalStack[this.modalStack.length - 1];
    const modalInfo = this.activeModals.get(topModalId);
    
    return modalInfo ? modalInfo.element : null;
  }

  /**
   * Export document
   */
  exportDocument(modalId) {
    const modalInfo = this.activeModals.get(modalId);
    if (!modalInfo) return;

    const { data } = modalInfo;
    
    // Create export data
    const exportData = {
      title: data.title,
      date: data.date,
      country: data.country,
      type: data.type,
      theme: data.theme || '',
      actor: data.actor || '',
      exportedAt: new Date().toISOString()
    };

    // Convert to JSON and download
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${data.id}.json`;
    a.click();
    
    window.URL.revokeObjectURL(url);

    // Emit export event
    this.emit(EVENTS.DOCUMENT_EXPORTED, {
      documentId: data.id,
      format: 'json'
    });
  }

  /**
   * Show custom modal
   */
  showCustomModal(modalId, title, content, options = {}) {
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'custom-modal';
    
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${this.escapeHtml(title)}</h3>
            <button class="modal-close" aria-label="Close modal">×</button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      </div>
    `;

    this.element.appendChild(modal);
    
    // Store modal reference
    this.activeModals.set(modalId, {
      element: modal,
      data: { title, content, options },
      createdAt: Date.now()
    });
    
    this.modalStack.push(modalId);
    
    // Add event listeners
    this.addModalEventListeners(modal, modalId);
    
    // Show modal
    if (this.options.enableAnimations) {
      this.animateModalIn(modal);
    } else {
      modal.style.display = 'flex';
    }
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    const modalIds = Array.from(this.activeModals.keys());
    modalIds.forEach(modalId => this.closeModal(modalId));
  }

  /**
   * Get modal statistics
   */
  getModalStats() {
    return {
      activeModals: this.activeModals.size,
      modalStack: this.modalStack.length,
      modalIds: Array.from(this.activeModals.keys())
    };
  }

  /**
   * Add modal styles
   */
  addModalStyles() {
    if (document.getElementById('modal-manager-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'modal-manager-styles';
    style.textContent = `
      .document-preview-modal,
      .custom-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }

      .modal-content {
        background: white;
        border-radius: 8px;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        transition: background-color 0.2s;
      }

      .modal-close:hover {
        background-color: #f3f4f6;
        color: #374151;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .document-metadata {
        margin-bottom: 1.5rem;
      }

      .metadata-item {
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .metadata-item strong {
        color: #374151;
        margin-right: 0.5rem;
      }

      .document-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        border: 1px solid transparent;
        cursor: pointer;
      }

      .btn-primary {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .btn-primary:hover {
        background-color: #2563eb;
        border-color: #2563eb;
      }

      .btn-secondary {
        background-color: #6b7280;
        color: white;
        border-color: #6b7280;
      }

      .btn-secondary:hover {
        background-color: #4b5563;
        border-color: #4b5563;
      }

      @media (max-width: 640px) {
        .modal-content {
          margin: 1rem;
          max-width: none;
        }

        .document-actions {
          flex-direction: column;
        }

        .btn {
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.closeAllModals();
    super.destroy();
  }
}

// Export for use in other modules
export default ModalManager;
