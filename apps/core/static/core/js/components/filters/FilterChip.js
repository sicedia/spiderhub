/**
 * Filter Chip Component
 * Individual filter chip with remove functionality
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { EVENTS } from '../../core/constants/config.js';
import { darkModeManager } from '../../core/utils/darkMode.js';

export class FilterChip extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.filterId = this.options.filterId || this.generateId();
    this.filterType = this.options.filterType;
    this.filterValue = this.options.filterValue;
    this.filterLabel = this.options.filterLabel || this.filterValue;
  }

  /**
   * Default options for filter chips
   */
  getDefaultOptions() {
    return {
      removable: true,
      animated: true,
      showIcon: true,
      theme: 'default', // 'default', 'primary', 'secondary', 'success', 'warning', 'danger'
      size: 'medium' // 'small', 'medium', 'large'
    };
  }

  /**
   * Initialize the filter chip
   */
  init() {
    this.render();
    super.init();
  }

  /**
   * Render the filter chip
   */
  render() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Add CSS classes
    this.element.className = this.buildCSSClasses();
    
    // Set data attributes
    this.element.setAttribute('data-filter-id', this.filterId);
    this.element.setAttribute('data-filter-type', this.filterType);
    this.element.setAttribute('data-filter-value', this.filterValue);
    
    // Create chip content
    const content = this.createChipContent();
    this.element.appendChild(content);
    
    // Add styles if not already added
    this.addStyles();
  }

  /**
   * Build CSS classes for the chip
   */
  buildCSSClasses() {
    const classes = ['filter-chip'];
    
    // Add theme class
    classes.push(`filter-chip--${this.options.theme}`);
    
    // Add size class
    classes.push(`filter-chip--${this.options.size}`);
    
    // Add removable class
    if (this.options.removable) {
      classes.push('filter-chip--removable');
    }
    
    // Add animated class
    if (this.options.animated) {
      classes.push('filter-chip--animated');
    }
    
    return classes.join(' ');
  }

  /**
   * Create chip content
   */
  createChipContent() {
    const content = DOMUtils.createElement('div', {
      className: 'filter-chip__content'
    });
    
    // Add icon if requested
    if (this.options.showIcon) {
      const icon = this.createIcon();
      if (icon) {
        content.appendChild(icon);
      }
    }
    
    // Add label
    const label = DOMUtils.createElement('span', {
      className: 'filter-chip__label'
    }, this.filterLabel);
    content.appendChild(label);
    
    // Add remove button if removable
    if (this.options.removable) {
      const removeBtn = this.createRemoveButton();
      content.appendChild(removeBtn);
    }
    
    return content;
  }

  /**
   * Create icon based on filter type
   */
  createIcon() {
    const iconMap = {
      search: '🔍',
      type: '📄',
      country: '🌍',
      theme: '🏷️',
      actor: '👤',
      beneficiary: '🎯',
      sdg: '🎯',
      legal_bindingness: '⚖️',
      agreement_type: '📋',
      date_from: '📅',
      date_to: '📅',
      coverage_scope: '📊',
      investment_amount: '💰'
    };
    
    const iconText = iconMap[this.filterType] || '🏷️';
    
    return DOMUtils.createElement('span', {
      className: 'filter-chip__icon'
    }, iconText);
  }

  /**
   * Create remove button
   */
  createRemoveButton() {
    const removeBtn = DOMUtils.createElement('button', {
      className: 'filter-chip__remove',
      type: 'button',
      'aria-label': `Remove ${this.filterLabel} filter`,
      title: `Remove ${this.filterLabel} filter`
    }, '×');
    
    return removeBtn;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Remove button click
    if (this.options.removable) {
      const removeBtn = this.find('.filter-chip__remove');
      if (removeBtn) {
        this.addEventListener(removeBtn, 'click', this.handleRemove);
      }
    }
    
    // Chip click (for selection/deselection)
    this.addEventListener(this.element, 'click', this.handleClick);
    
    // Keyboard events
    this.addEventListener(this.element, 'keydown', this.handleKeydown);
  }

  /**
   * Handle remove button click
   */
  handleRemove(event) {
    event.stopPropagation();
    this.remove();
  }

  /**
   * Handle chip click
   */
  handleClick(event) {
    // Don't handle click if it's on the remove button
    if (event.target.classList.contains('filter-chip__remove')) {
      return;
    }
    
    this.emit(EVENTS.FILTER_CHIP_CLICKED, {
      filterId: this.filterId,
      filterType: this.filterType,
      filterValue: this.filterValue,
      filterLabel: this.filterLabel
    });
  }

  /**
   * Handle keyboard events
   */
  handleKeydown(event) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.handleClick(event);
        break;
      case 'Delete':
      case 'Backspace':
        if (this.options.removable) {
          event.preventDefault();
          this.remove();
        }
        break;
      case 'Escape':
        this.element.blur();
        break;
    }
  }

  /**
   * Remove the filter chip
   */
  remove() {
    // Emit remove event
    this.emit(EVENTS.FILTER_CHIP_REMOVED, {
      filterId: this.filterId,
      filterType: this.filterType,
      filterValue: this.filterValue,
      filterLabel: this.filterLabel
    });
    
    // Animate out if enabled
    if (this.options.animated) {
      this.animateOut(() => {
        this.destroy();
      });
    } else {
      this.destroy();
    }
  }

  /**
   * Animate chip out
   */
  animateOut(callback) {
    this.element.style.transition = 'all 0.3s ease-out';
    this.element.style.transform = 'scale(0)';
    this.element.style.opacity = '0';
    
    setTimeout(() => {
      if (callback) callback();
    }, 300);
  }

  /**
   * Update chip label
   */
  updateLabel(newLabel) {
    this.filterLabel = newLabel;
    const labelElement = this.find('.filter-chip__label');
    if (labelElement) {
      labelElement.textContent = newLabel;
    }
  }

  /**
   * Update chip theme
   */
  updateTheme(newTheme) {
    // Remove old theme class
    this.element.classList.remove(`filter-chip--${this.options.theme}`);
    
    // Update option and add new class
    this.options.theme = newTheme;
    this.element.classList.add(`filter-chip--${newTheme}`);
  }

  /**
   * Set chip as active/inactive
   */
  setActive(active = true) {
    if (active) {
      this.element.classList.add('filter-chip--active');
    } else {
      this.element.classList.remove('filter-chip--active');
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `filter-chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('filter-chip-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'filter-chip-styles';
    style.textContent = darkModeManager.generateAdaptiveCSS(`
      .filter-chip {
        display: inline-flex;
        align-items: center;
        margin: 2px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
        outline: none;
        border: 1px solid transparent;
      }

      .filter-chip:focus {
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
      }

      .filter-chip--animated {
        animation: filterChipIn 0.3s ease-out;
      }

      @keyframes filterChipIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* Sizes */
      .filter-chip--small {
        padding: 4px 8px;
        font-size: 11px;
      }

      .filter-chip--medium {
        padding: 6px 12px;
        font-size: 12px;
      }

      .filter-chip--large {
        padding: 8px 16px;
        font-size: 13px;
      }

      /* Themes */
      .filter-chip--default {
        background-color: #f3f4f6;
        color: #374151;
        border-color: #d1d5db;
      }

      .filter-chip--default:hover {
        background-color: #e5e7eb;
        border-color: #9ca3af;
      }

      .filter-chip--primary {
        background-color: #dbeafe;
        color: #1e40af;
        border-color: #93c5fd;
      }

      .filter-chip--primary:hover {
        background-color: #bfdbfe;
        border-color: #60a5fa;
      }

      .filter-chip--secondary {
        background-color: #f1f5f9;
        color: #475569;
        border-color: #cbd5e1;
      }

      .filter-chip--secondary:hover {
        background-color: #e2e8f0;
        border-color: #94a3b8;
      }

      .filter-chip--success {
        background-color: #dcfce7;
        color: #166534;
        border-color: #86efac;
      }

      .filter-chip--success:hover {
        background-color: #bbf7d0;
        border-color: #4ade80;
      }

      .filter-chip--warning {
        background-color: #fef3c7;
        color: #92400e;
        border-color: #fcd34d;
      }

      .filter-chip--warning:hover {
        background-color: #fde68a;
        border-color: #f59e0b;
      }

      .filter-chip--danger {
        background-color: #fee2e2;
        color: #991b1b;
        border-color: #fca5a5;
      }

      .filter-chip--danger:hover {
        background-color: #fecaca;
        border-color: #f87171;
      }

      .filter-chip--active {
        box-shadow: 0 0 0 2px currentColor;
      }

      .filter-chip__content {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .filter-chip__icon {
        font-size: 0.9em;
        line-height: 1;
      }

      .filter-chip__label {
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 150px;
      }

      .filter-chip__remove {
        background: none;
        border: none;
        color: currentColor;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        padding: 0;
        margin-left: 4px;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }

      .filter-chip__remove:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .filter-chip__remove:focus {
        outline: none;
        background-color: rgba(0, 0, 0, 0.1);
      }

      /* Responsive */
      @media (max-width: 640px) {
        .filter-chip {
          font-size: 11px;
        }
        
        .filter-chip__label {
          max-width: 100px;
        }
      }
    `, {
      '.filter-chip': {
        'background-color': 'var(--color-bg-primary)',
        'color': 'var(--color-text-primary)',
        'border-color': 'var(--color-border-medium)'
      },
      '.filter-chip:hover': {
        'background-color': 'var(--color-bg-secondary)',
        'border-color': 'var(--color-primary-300)'
      },
      '.filter-chip--primary': {
        'background-color': 'var(--color-primary-400)',
        'color': 'var(--color-text-inverse)',
        'border-color': 'var(--color-primary-400)'
      },
      '.filter-chip--primary:hover': {
        'background-color': 'var(--color-primary-500)',
        'border-color': 'var(--color-primary-500)'
      },
      '.filter-chip--secondary': {
        'background-color': 'var(--color-secondary-400)',
        'color': 'var(--color-text-inverse)',
        'border-color': 'var(--color-secondary-400)'
      },
      '.filter-chip--secondary:hover': {
        'background-color': 'var(--color-secondary-500)',
        'border-color': 'var(--color-secondary-500)'
      },
      '.filter-chip--success': {
        'background-color': 'var(--color-accent-success)',
        'color': 'var(--color-text-inverse)',
        'border-color': 'var(--color-accent-success)'
      },
      '.filter-chip--success:hover': {
        'background-color': 'var(--color-accent-success)',
        'opacity': '0.9'
      },
      '.filter-chip--warning': {
        'background-color': 'var(--color-accent-warning)',
        'color': 'var(--color-text-inverse)',
        'border-color': 'var(--color-accent-warning)'
      },
      '.filter-chip--warning:hover': {
        'background-color': 'var(--color-accent-warning)',
        'opacity': '0.9'
      },
      '.filter-chip--danger': {
        'background-color': 'var(--color-accent-error)',
        'color': 'var(--color-text-inverse)',
        'border-color': 'var(--color-accent-error)'
      },
      '.filter-chip--danger:hover': {
        'background-color': 'var(--color-accent-error)',
        'opacity': '0.9'
      }
    });
    
    document.head.appendChild(style);
  }

  /**
   * Destroy the component
   */
  destroy() {
    // Remove from DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    super.destroy();
  }
}

// Default export
export default FilterChip;
