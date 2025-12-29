/**
 * FilterAccordion Component
 * Manages accordion-style filter groups with smooth animations
 * Follows SOLID principles and component-based architecture
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { EVENTS } from '../../core/constants/config.js';
import { logger } from '../../core/logger/Logger.js';

export class FilterAccordion extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    // Create child logger with component context
    this.logger = logger.child({
      component: 'FilterAccordion',
      instance: Math.random().toString(36).substr(2, 9)
    });
  }

  getDefaultOptions() {
    return {
      allowMultiple: true,
      defaultOpen: [],
      animationDuration: 300,
      saveState: true,
      storageKey: 'filter-accordion-state'
    };
  }

  init() {
    if (this.logger) {
      this.logger.debug('FilterAccordion initialized', {
        options: this.options
      });
    }
    
    this.cacheElements();
    this.restoreState();
    this.bindEvents();
  }

  cacheElements() {
    this.elements = {
      groups: Array.from(DOMUtils.getElements('.filter-group', this.element) || []),
      headers: Array.from(DOMUtils.getElements('.filter-group__header', this.element) || []),
      contents: Array.from(DOMUtils.getElements('.filter-group__content', this.element) || [])
    };
    
    // Ensure headers have proper accessibility attributes
    this.elements.headers.forEach((header, index) => {
      const content = this.elements.contents[index];
      if (content && !header.getAttribute('aria-controls')) {
        header.setAttribute('aria-controls', content.id || `filter-content-${index}`);
      }
      if (!header.getAttribute('aria-expanded')) {
        const isExpanded = header.getAttribute('aria-expanded') === 'true' || 
                         header.closest('.filter-group')?.classList.contains('filter-group--expanded');
        header.setAttribute('aria-expanded', isExpanded.toString());
      }
    });
  }

  bindEvents() {
    this.elements.headers.forEach((header, index) => {
      this.addEventListener(header, 'click', () => this.toggleGroup(index));
      this.addEventListener(header, 'keydown', (e) => this.handleKeyboard(e, index));
    });
  }

  /**
   * Toggle a filter group
   */
  toggleGroup(index) {
    const group = this.elements.groups[index];
    const isExpanded = group.classList.contains('filter-group--expanded');

    if (!this.options.allowMultiple) {
      this.closeAllGroups();
    }

    if (isExpanded) {
      this.closeGroup(index);
    } else {
      this.openGroup(index);
    }

    this.saveState();
  }

  /**
   * Open a specific group
   */
  openGroup(index) {
    const group = this.elements.groups[index];
    const header = this.elements.headers[index];
    const content = this.elements.contents[index];

    group.classList.add('filter-group--expanded');
    header.setAttribute('aria-expanded', 'true');
    
    // Smooth height animation
    this.animateHeight(content, 0, content.scrollHeight);
    
    // Scroll to header when opening (only if not already visible)
    requestAnimationFrame(() => {
      const headerRect = header.getBoundingClientRect();
      const sidebar = header.closest('.explore-sidebar');
      if (sidebar) {
        const sidebarRect = sidebar.getBoundingClientRect();
        // Only scroll if header is not fully visible
        if (headerRect.top < sidebarRect.top || headerRect.bottom > sidebarRect.bottom) {
          header.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      }
    });

    this.emit(EVENTS.ACCORDION_OPENED, { 
      index, 
      groupName: group.getAttribute('data-filter-group') 
    });
  }

  /**
   * Close a specific group
   */
  closeGroup(index) {
    const group = this.elements.groups[index];
    const header = this.elements.headers[index];
    const content = this.elements.contents[index];

    group.classList.remove('filter-group--expanded');
    header.setAttribute('aria-expanded', 'false');
    
    // Smooth height animation
    this.animateHeight(content, content.scrollHeight, 0);

    this.emit(EVENTS.ACCORDION_CLOSED, { 
      index, 
      groupName: group.getAttribute('data-filter-group') 
    });
  }

  /**
   * Close all groups
   */
  closeAllGroups() {
    this.elements.groups.forEach((_, index) => {
      this.closeGroup(index);
    });
  }

  /**
   * Open all groups
   */
  openAllGroups() {
    this.elements.groups.forEach((_, index) => {
      this.openGroup(index);
    });
  }

  /**
   * Animate height transition
   */
  animateHeight(element, startHeight, endHeight) {
    element.style.height = `${startHeight}px`;
    element.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
      element.style.transition = `height ${this.options.animationDuration}ms var(--ease-out)`;
      element.style.height = `${endHeight}px`;
      
      setTimeout(() => {
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
      }, this.options.animationDuration);
    });
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboard(event, index) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleGroup(index);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextHeader(index);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousHeader(index);
        break;
      case 'Home':
        event.preventDefault();
        this.elements.headers[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        this.elements.headers[this.elements.headers.length - 1]?.focus();
        break;
    }
  }

  /**
   * Focus next header
   */
  focusNextHeader(currentIndex) {
    const nextIndex = (currentIndex + 1) % this.elements.headers.length;
    this.elements.headers[nextIndex]?.focus();
  }

  /**
   * Focus previous header
   */
  focusPreviousHeader(currentIndex) {
    const prevIndex = currentIndex === 0 
      ? this.elements.headers.length - 1 
      : currentIndex - 1;
    this.elements.headers[prevIndex]?.focus();
  }

  /**
   * Save accordion state to localStorage
   */
  saveState() {
    if (!this.options.saveState) return;

    const state = this.elements.groups.map((group, index) => ({
      name: group.getAttribute('data-filter-group'),
      expanded: group.classList.contains('filter-group--expanded')
    }));

    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(state));
    } catch (error) {
      this.logger.warn('Failed to save accordion state to localStorage', error);
    }
  }

  /**
   * Restore accordion state from localStorage
   */
  restoreState() {
    if (!this.options.saveState) {
      // Open default groups if specified
      this.options.defaultOpen.forEach(groupName => {
        const index = this.elements.groups.findIndex(
          g => g.getAttribute('data-filter-group') === groupName
        );
        if (index !== -1) {
          this.openGroup(index);
        }
      });
      return;
    }

    try {
      const savedState = localStorage.getItem(this.options.storageKey);
      if (!savedState) {
        // Open default groups if no saved state
        this.options.defaultOpen.forEach(groupName => {
          const index = this.elements.groups.findIndex(
            g => g.getAttribute('data-filter-group') === groupName
          );
          if (index !== -1) {
            this.openGroup(index);
          }
        });
        return;
      }

      const state = JSON.parse(savedState);
      state.forEach(({ name, expanded }) => {
        if (expanded) {
          const index = this.elements.groups.findIndex(
            g => g.getAttribute('data-filter-group') === name
          );
          if (index !== -1) {
            this.openGroup(index);
          }
        }
      });
    } catch (error) {
      this.logger.warn('Failed to restore accordion state from localStorage', error);
    }
  }

  /**
   * Get current accordion state
   */
  getState() {
    return this.elements.groups.map(group => ({
      name: group.getAttribute('data-filter-group'),
      expanded: group.classList.contains('filter-group--expanded')
    }));
  }

  /**
   * Reset accordion to initial state
   */
  reset() {
    this.closeAllGroups();
    this.options.defaultOpen.forEach(groupName => {
      const index = this.elements.groups.findIndex(
        g => g.getAttribute('data-filter-group') === groupName
      );
      if (index !== -1) {
        this.openGroup(index);
      }
    });
  }
}

export default FilterAccordion;

