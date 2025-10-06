/**
 * Accordion Component
 * Reusable accordion with animation and accessibility
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { AnimationUtils } from '../../core/utils/animations.js';
import { EVENT_TYPES } from '../../core/constants/enums.js';

export class Accordion extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.items = [];
    this.activeItems = new Set();
  }

  /**
   * Default options for accordion
   */
  getDefaultOptions() {
    return {
      allowMultiple: false, // Allow multiple items to be open
      closeOthers: true, // Close other items when opening one (if allowMultiple is false)
      animationDuration: 300,
      itemSelector: '.accordion-item',
      headerSelector: '.accordion-header',
      contentSelector: '.accordion-content',
      toggleSelector: '.accordion-toggle',
      activeClass: 'accordion-item--active',
      expandedClass: 'accordion-content--expanded',
      icons: {
        collapsed: '+',
        expanded: '−'
      },
      keyboard: true // Enable keyboard navigation
    };
  }

  /**
   * Initialize accordion
   */
  init() {
    this.initializeItems();
    this.addStyles();
    super.init();
  }

  /**
   * Initialize accordion items
   */
  initializeItems() {
    const itemElements = this.findAll(this.options.itemSelector);
    
    this.items = itemElements.map((element, index) => {
      const item = {
        id: `accordion-item-${index}`,
        element,
        header: element.querySelector(this.options.headerSelector),
        content: element.querySelector(this.options.contentSelector),
        toggle: element.querySelector(this.options.toggleSelector),
        isOpen: element.classList.contains(this.options.activeClass)
      };

      this.setupItem(item);
      
      if (item.isOpen) {
        this.activeItems.add(item.id);
      }

      return item;
    });
  }

  /**
   * Setup individual accordion item
   */
  setupItem(item) {
    if (!item.header || !item.content) {
      console.warn('Accordion item missing header or content:', item.element);
      return;
    }

    // Setup ARIA attributes
    item.header.setAttribute('role', 'button');
    item.header.setAttribute('aria-expanded', item.isOpen.toString());
    item.header.setAttribute('aria-controls', `${item.id}-content`);
    item.header.setAttribute('tabindex', '0');
    
    item.content.setAttribute('id', `${item.id}-content`);
    item.content.setAttribute('role', 'region');
    item.content.setAttribute('aria-labelledby', `${item.id}-header`);
    
    item.header.setAttribute('id', `${item.id}-header`);

    // Setup initial state
    if (!item.isOpen) {
      item.content.style.display = 'none';
      item.content.setAttribute('aria-hidden', 'true');
    } else {
      item.content.setAttribute('aria-hidden', 'false');
    }

    // Add toggle icon if specified
    if (item.toggle) {
      this.updateToggleIcon(item);
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.items.forEach(item => {
      // Click events
      this.addEventListener(item.header, 'click', (event) => {
        event.preventDefault();
        this.toggleItem(item.id);
      });

      // Keyboard events
      if (this.options.keyboard) {
        this.addEventListener(item.header, 'keydown', (event) => {
          this.handleKeydown(event, item);
        });
      }
    });
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(event, item) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleItem(item.id);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextItem(item);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousItem(item);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirstItem();
        break;
      case 'End':
        event.preventDefault();
        this.focusLastItem();
        break;
    }
  }

  /**
   * Focus next accordion item
   */
  focusNextItem(currentItem) {
    const currentIndex = this.items.indexOf(currentItem);
    const nextIndex = (currentIndex + 1) % this.items.length;
    this.items[nextIndex].header.focus();
  }

  /**
   * Focus previous accordion item
   */
  focusPreviousItem(currentItem) {
    const currentIndex = this.items.indexOf(currentItem);
    const prevIndex = currentIndex === 0 ? this.items.length - 1 : currentIndex - 1;
    this.items[prevIndex].header.focus();
  }

  /**
   * Focus first accordion item
   */
  focusFirstItem() {
    if (this.items.length > 0) {
      this.items[0].header.focus();
    }
  }

  /**
   * Focus last accordion item
   */
  focusLastItem() {
    if (this.items.length > 0) {
      this.items[this.items.length - 1].header.focus();
    }
  }

  /**
   * Toggle accordion item
   */
  toggleItem(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;

    if (item.isOpen) {
      this.closeItem(itemId);
    } else {
      this.openItem(itemId);
    }
  }

  /**
   * Open accordion item
   */
  openItem(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item || item.isOpen) return;

    // Close other items if not allowing multiple
    if (!this.options.allowMultiple && this.options.closeOthers) {
      this.closeAllItems();
    }

    // Open this item
    item.isOpen = true;
    this.activeItems.add(itemId);
    
    // Update classes
    item.element.classList.add(this.options.activeClass);
    item.content.classList.add(this.options.expandedClass);
    
    // Update ARIA attributes
    item.header.setAttribute('aria-expanded', 'true');
    item.content.setAttribute('aria-hidden', 'false');
    
    // Update toggle icon
    this.updateToggleIcon(item);
    
    // Animate open
    this.animateOpen(item);
    
    // Emit event
    this.emit(EVENT_TYPES.ACCORDION_ITEM_OPENED, {
      itemId,
      item: item.element
    });
  }

  /**
   * Close accordion item
   */
  closeItem(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item || !item.isOpen) return;

    // Close this item
    item.isOpen = false;
    this.activeItems.delete(itemId);
    
    // Update classes
    item.element.classList.remove(this.options.activeClass);
    item.content.classList.remove(this.options.expandedClass);
    
    // Update ARIA attributes
    item.header.setAttribute('aria-expanded', 'false');
    item.content.setAttribute('aria-hidden', 'true');
    
    // Update toggle icon
    this.updateToggleIcon(item);
    
    // Animate close
    this.animateClose(item);
    
    // Emit event
    this.emit(EVENT_TYPES.ACCORDION_ITEM_CLOSED, {
      itemId,
      item: item.element
    });
  }

  /**
   * Close all accordion items
   */
  closeAllItems() {
    this.items.forEach(item => {
      if (item.isOpen) {
        this.closeItem(item.id);
      }
    });
  }

  /**
   * Open all accordion items (if multiple allowed)
   */
  openAllItems() {
    if (!this.options.allowMultiple) return;
    
    this.items.forEach(item => {
      if (!item.isOpen) {
        this.openItem(item.id);
      }
    });
  }

  /**
   * Animate item open
   */
  animateOpen(item) {
    const content = item.content;
    
    // Get the natural height
    content.style.display = 'block';
    const height = content.scrollHeight;
    
    // Start from 0 height
    content.style.height = '0px';
    content.style.overflow = 'hidden';
    
    // Animate to full height
    requestAnimationFrame(() => {
      content.style.transition = `height ${this.options.animationDuration}ms ease-out`;
      content.style.height = `${height}px`;
      
      // Clean up after animation
      setTimeout(() => {
        content.style.height = '';
        content.style.overflow = '';
        content.style.transition = '';
      }, this.options.animationDuration);
    });
  }

  /**
   * Animate item close
   */
  animateClose(item) {
    const content = item.content;
    const height = content.scrollHeight;
    
    // Set current height
    content.style.height = `${height}px`;
    content.style.overflow = 'hidden';
    
    // Animate to 0 height
    requestAnimationFrame(() => {
      content.style.transition = `height ${this.options.animationDuration}ms ease-in`;
      content.style.height = '0px';
      
      // Hide after animation
      setTimeout(() => {
        content.style.display = 'none';
        content.style.height = '';
        content.style.overflow = '';
        content.style.transition = '';
      }, this.options.animationDuration);
    });
  }

  /**
   * Update toggle icon
   */
  updateToggleIcon(item) {
    if (!item.toggle) return;
    
    const icon = item.isOpen ? this.options.icons.expanded : this.options.icons.collapsed;
    item.toggle.textContent = icon;
  }

  /**
   * Get open items
   */
  getOpenItems() {
    return this.items.filter(item => item.isOpen);
  }

  /**
   * Get closed items
   */
  getClosedItems() {
    return this.items.filter(item => !item.isOpen);
  }

  /**
   * Check if item is open
   */
  isItemOpen(itemId) {
    return this.activeItems.has(itemId);
  }

  /**
   * Add new accordion item
   */
  addItem(element) {
    const index = this.items.length;
    const item = {
      id: `accordion-item-${index}`,
      element,
      header: element.querySelector(this.options.headerSelector),
      content: element.querySelector(this.options.contentSelector),
      toggle: element.querySelector(this.options.toggleSelector),
      isOpen: element.classList.contains(this.options.activeClass)
    };

    this.setupItem(item);
    this.items.push(item);

    // Bind events for new item
    this.addEventListener(item.header, 'click', (event) => {
      event.preventDefault();
      this.toggleItem(item.id);
    });

    if (this.options.keyboard) {
      this.addEventListener(item.header, 'keydown', (event) => {
        this.handleKeydown(event, item);
      });
    }

    if (item.isOpen) {
      this.activeItems.add(item.id);
    }

    return item;
  }

  /**
   * Remove accordion item
   */
  removeItem(itemId) {
    const itemIndex = this.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.items[itemIndex];
    
    // Remove from active items
    this.activeItems.delete(itemId);
    
    // Remove from items array
    this.items.splice(itemIndex, 1);
    
    // Remove element from DOM
    if (item.element && item.element.parentNode) {
      item.element.parentNode.removeChild(item.element);
    }
  }

  /**
   * Update accordion options
   */
  updateOptions(newOptions) {
    Object.assign(this.options, newOptions);
    
    // Re-initialize if certain options changed
    if (newOptions.allowMultiple !== undefined || newOptions.closeOthers !== undefined) {
      // If multiple is no longer allowed, close all but first open item
      if (!this.options.allowMultiple && this.activeItems.size > 1) {
        const openItems = Array.from(this.activeItems);
        for (let i = 1; i < openItems.length; i++) {
          this.closeItem(openItems[i]);
        }
      }
    }
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('accordion-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'accordion-styles';
    style.textContent = `
      .accordion {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
      }

      .accordion-item {
        border-bottom: 1px solid #e5e7eb;
      }

      .accordion-item:last-child {
        border-bottom: none;
      }

      .accordion-header {
        width: 100%;
        padding: 16px 20px;
        background: #f9fafb;
        border: none;
        text-align: left;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        color: #374151;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: background-color 0.2s ease;
      }

      .accordion-header:hover {
        background: #f3f4f6;
      }

      .accordion-header:focus {
        outline: none;
        background: #f3f4f6;
        box-shadow: inset 0 0 0 2px #3b82f6;
      }

      .accordion-item--active .accordion-header {
        background: #eff6ff;
        color: #1d4ed8;
      }

      .accordion-toggle {
        font-size: 18px;
        font-weight: bold;
        color: #6b7280;
        transition: transform 0.2s ease;
      }

      .accordion-item--active .accordion-toggle {
        transform: rotate(45deg);
        color: #1d4ed8;
      }

      .accordion-content {
        padding: 0 20px;
        background: white;
        overflow: hidden;
      }

      .accordion-content--expanded {
        padding: 20px;
      }

      /* Responsive */
      @media (max-width: 640px) {
        .accordion-header {
          padding: 12px 16px;
          font-size: 14px;
        }
        
        .accordion-content--expanded {
          padding: 16px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Static method to initialize accordions
Accordion.init = function(selector = '.accordion', options = {}) {
  const elements = document.querySelectorAll(selector);
  const accordions = [];
  
  elements.forEach(element => {
    const accordion = new Accordion(element, options);
    accordions.push(accordion);
  });
  
  return accordions;
};

// Default export
export default Accordion;
