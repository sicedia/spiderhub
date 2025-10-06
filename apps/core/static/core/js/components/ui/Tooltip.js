/**
 * Tooltip Component
 * Reusable tooltip with positioning and animation
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { CONFIG } from '../../core/constants/config.js';

export class Tooltip extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.tooltipElement = null;
    this.isVisible = false;
    this.showTimeout = null;
    this.hideTimeout = null;
  }

  /**
   * Default options for tooltip
   */
  getDefaultOptions() {
    return {
      content: '',
      position: 'top', // 'top', 'bottom', 'left', 'right', 'auto'
      trigger: 'hover', // 'hover', 'click', 'focus', 'manual'
      delay: CONFIG.MAP.TOOLTIP_DELAY,
      hideDelay: 0,
      offset: 8,
      arrow: true,
      animation: true,
      theme: 'dark', // 'dark', 'light'
      maxWidth: 200,
      zIndex: 1000,
      container: document.body,
      html: false, // Allow HTML content
      interactive: false // Keep tooltip visible when hovering over it
    };
  }

  /**
   * Initialize tooltip
   */
  init() {
    this.createTooltip();
    super.init();
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    this.tooltipElement = DOMUtils.createElement('div', {
      className: this.buildTooltipClasses(),
      role: 'tooltip'
    });

    // Add arrow if enabled
    if (this.options.arrow) {
      const arrow = DOMUtils.createElement('div', {
        className: 'tooltip-arrow'
      });
      this.tooltipElement.appendChild(arrow);
    }

    // Add content container
    const content = DOMUtils.createElement('div', {
      className: 'tooltip-content'
    });
    this.tooltipElement.appendChild(content);

    // Set initial styles
    this.tooltipElement.style.cssText = `
      position: absolute;
      z-index: ${this.options.zIndex};
      max-width: ${this.options.maxWidth}px;
      opacity: 0;
      pointer-events: none;
      transform: scale(0.8);
      transition: all 0.2s ease;
    `;

    // Add to container
    this.options.container.appendChild(this.tooltipElement);

    // Add styles
    this.addStyles();
  }

  /**
   * Build tooltip CSS classes
   */
  buildTooltipClasses() {
    const classes = ['tooltip'];
    classes.push(`tooltip--${this.options.theme}`);
    
    if (this.options.animation) {
      classes.push('tooltip--animated');
    }
    
    return classes.join(' ');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    const { trigger } = this.options;

    if (trigger === 'hover') {
      this.addEventListener(this.element, 'mouseenter', this.handleMouseEnter);
      this.addEventListener(this.element, 'mouseleave', this.handleMouseLeave);
      
      if (this.options.interactive) {
        this.addEventListener(this.tooltipElement, 'mouseenter', this.handleTooltipMouseEnter);
        this.addEventListener(this.tooltipElement, 'mouseleave', this.handleTooltipMouseLeave);
      }
    } else if (trigger === 'click') {
      this.addEventListener(this.element, 'click', this.handleClick);
      this.addEventListener(document, 'click', this.handleDocumentClick);
    } else if (trigger === 'focus') {
      this.addEventListener(this.element, 'focus', this.handleFocus);
      this.addEventListener(this.element, 'blur', this.handleBlur);
    }

    // Keyboard events
    this.addEventListener(this.element, 'keydown', this.handleKeydown);
  }

  /**
   * Handle mouse enter
   */
  handleMouseEnter() {
    this.clearTimeouts();
    this.showTimeout = setTimeout(() => {
      this.show();
    }, this.options.delay);
  }

  /**
   * Handle mouse leave
   */
  handleMouseLeave() {
    this.clearTimeouts();
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, this.options.hideDelay);
  }

  /**
   * Handle tooltip mouse enter (for interactive tooltips)
   */
  handleTooltipMouseEnter() {
    this.clearTimeouts();
  }

  /**
   * Handle tooltip mouse leave (for interactive tooltips)
   */
  handleTooltipMouseLeave() {
    this.clearTimeouts();
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, this.options.hideDelay);
  }

  /**
   * Handle click
   */
  handleClick(event) {
    event.preventDefault();
    this.toggle();
  }

  /**
   * Handle document click (for click trigger)
   */
  handleDocumentClick(event) {
    if (!this.element.contains(event.target) && 
        !this.tooltipElement.contains(event.target)) {
      this.hide();
    }
  }

  /**
   * Handle focus
   */
  handleFocus() {
    this.show();
  }

  /**
   * Handle blur
   */
  handleBlur() {
    this.hide();
  }

  /**
   * Handle keyboard events
   */
  handleKeydown(event) {
    if (event.key === 'Escape' && this.isVisible) {
      this.hide();
    }
  }

  /**
   * Show tooltip
   */
  show() {
    if (this.isVisible) return;

    // Update content
    this.updateContent();

    // Position tooltip
    this.position();

    // Show tooltip
    this.isVisible = true;
    this.tooltipElement.style.opacity = '1';
    this.tooltipElement.style.transform = 'scale(1)';
    this.tooltipElement.style.pointerEvents = this.options.interactive ? 'auto' : 'none';

    // Update aria attributes
    this.element.setAttribute('aria-describedby', this.tooltipElement.id || 'tooltip');

    this.emit('tooltip:shown');
  }

  /**
   * Hide tooltip
   */
  hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.tooltipElement.style.opacity = '0';
    this.tooltipElement.style.transform = 'scale(0.8)';
    this.tooltipElement.style.pointerEvents = 'none';

    // Remove aria attributes
    this.element.removeAttribute('aria-describedby');

    this.emit('tooltip:hidden');
  }

  /**
   * Toggle tooltip visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update tooltip content
   */
  updateContent() {
    const contentElement = this.tooltipElement.querySelector('.tooltip-content');
    if (!contentElement) return;

    let content = this.options.content;

    // Get content from data attribute if not provided
    if (!content) {
      content = this.element.getAttribute('data-tooltip') ||
                this.element.getAttribute('title') ||
                this.element.getAttribute('aria-label') ||
                '';
    }

    // Clear title attribute to prevent native tooltip
    if (this.element.hasAttribute('title')) {
      this.element.setAttribute('data-original-title', this.element.getAttribute('title'));
      this.element.removeAttribute('title');
    }

    // Set content
    if (this.options.html) {
      contentElement.innerHTML = content;
    } else {
      contentElement.textContent = content;
    }
  }

  /**
   * Position tooltip
   */
  position() {
    const elementRect = this.element.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;
    const scrollLeft = window.pageXOffset;

    let position = this.options.position;

    // Auto positioning
    if (position === 'auto') {
      position = this.calculateBestPosition(elementRect, tooltipRect, viewportWidth, viewportHeight);
    }

    const coords = this.calculatePosition(position, elementRect, tooltipRect);

    // Apply position
    this.tooltipElement.style.left = `${coords.left + scrollLeft}px`;
    this.tooltipElement.style.top = `${coords.top + scrollTop}px`;

    // Update tooltip class for styling
    this.tooltipElement.className = this.tooltipElement.className.replace(/tooltip--\w+/g, '');
    this.tooltipElement.classList.add(`tooltip--${position}`);

    // Position arrow
    if (this.options.arrow) {
      this.positionArrow(position, elementRect, tooltipRect);
    }
  }

  /**
   * Calculate best position for auto positioning
   */
  calculateBestPosition(elementRect, tooltipRect, viewportWidth, viewportHeight) {
    const positions = ['top', 'bottom', 'left', 'right'];
    const space = {
      top: elementRect.top,
      bottom: viewportHeight - elementRect.bottom,
      left: elementRect.left,
      right: viewportWidth - elementRect.right
    };

    // Find position with most space
    let bestPosition = 'top';
    let maxSpace = space.top;

    positions.forEach(pos => {
      if (space[pos] > maxSpace) {
        maxSpace = space[pos];
        bestPosition = pos;
      }
    });

    return bestPosition;
  }

  /**
   * Calculate tooltip position coordinates
   */
  calculatePosition(position, elementRect, tooltipRect) {
    const offset = this.options.offset;
    let left, top;

    switch (position) {
      case 'top':
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        top = elementRect.top - tooltipRect.height - offset;
        break;
      case 'bottom':
        left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
        top = elementRect.bottom + offset;
        break;
      case 'left':
        left = elementRect.left - tooltipRect.width - offset;
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        break;
      case 'right':
        left = elementRect.right + offset;
        top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
        break;
      default:
        left = elementRect.left;
        top = elementRect.top;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    left = Math.max(0, Math.min(left, viewportWidth - tooltipRect.width));
    top = Math.max(0, Math.min(top, viewportHeight - tooltipRect.height));

    return { left, top };
  }

  /**
   * Position arrow
   */
  positionArrow(position, elementRect, tooltipRect) {
    const arrow = this.tooltipElement.querySelector('.tooltip-arrow');
    if (!arrow) return;

    // Reset arrow styles
    arrow.style.cssText = '';

    const arrowSize = 6; // Should match CSS

    switch (position) {
      case 'top':
        arrow.style.bottom = `-${arrowSize}px`;
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        arrow.style.top = `-${arrowSize}px`;
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        arrow.style.right = `-${arrowSize}px`;
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%)';
        break;
      case 'right':
        arrow.style.left = `-${arrowSize}px`;
        arrow.style.top = '50%';
        arrow.style.transform = 'translateY(-50%)';
        break;
    }
  }

  /**
   * Clear timeouts
   */
  clearTimeouts() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Update tooltip options
   */
  updateOptions(newOptions) {
    Object.assign(this.options, newOptions);
    
    // Update tooltip classes if theme changed
    if (newOptions.theme) {
      this.tooltipElement.className = this.buildTooltipClasses();
    }
    
    // Update max width
    if (newOptions.maxWidth) {
      this.tooltipElement.style.maxWidth = `${newOptions.maxWidth}px`;
    }
  }

  /**
   * Set tooltip content
   */
  setContent(content) {
    this.options.content = content;
    if (this.isVisible) {
      this.updateContent();
      this.position(); // Reposition in case content size changed
    }
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('tooltip-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'tooltip-styles';
    style.textContent = `
      .tooltip {
        font-size: 12px;
        line-height: 1.4;
        border-radius: 4px;
        padding: 6px 8px;
        word-wrap: break-word;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .tooltip--animated {
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .tooltip--dark {
        background: rgba(0, 0, 0, 0.9);
        color: white;
      }

      .tooltip--light {
        background: white;
        color: #333;
        border: 1px solid #ddd;
      }

      .tooltip-content {
        position: relative;
        z-index: 1;
      }

      .tooltip-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border: 6px solid transparent;
      }

      .tooltip--top .tooltip-arrow {
        border-top-color: rgba(0, 0, 0, 0.9);
      }

      .tooltip--bottom .tooltip-arrow {
        border-bottom-color: rgba(0, 0, 0, 0.9);
      }

      .tooltip--left .tooltip-arrow {
        border-left-color: rgba(0, 0, 0, 0.9);
      }

      .tooltip--right .tooltip-arrow {
        border-right-color: rgba(0, 0, 0, 0.9);
      }

      .tooltip--light.tooltip--top .tooltip-arrow {
        border-top-color: white;
      }

      .tooltip--light.tooltip--bottom .tooltip-arrow {
        border-bottom-color: white;
      }

      .tooltip--light.tooltip--left .tooltip-arrow {
        border-left-color: white;
      }

      .tooltip--light.tooltip--right .tooltip-arrow {
        border-right-color: white;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Destroy tooltip
   */
  destroy() {
    this.clearTimeouts();
    this.hide();
    
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
    }
    
    // Restore original title
    const originalTitle = this.element.getAttribute('data-original-title');
    if (originalTitle) {
      this.element.setAttribute('title', originalTitle);
      this.element.removeAttribute('data-original-title');
    }
    
    super.destroy();
  }
}

// Static method to initialize tooltips on elements
Tooltip.init = function(selector = '[data-tooltip]', options = {}) {
  const elements = document.querySelectorAll(selector);
  const tooltips = [];
  
  elements.forEach(element => {
    const tooltip = new Tooltip(element, options);
    tooltips.push(tooltip);
  });
  
  return tooltips;
};

// Default export
export default Tooltip;
