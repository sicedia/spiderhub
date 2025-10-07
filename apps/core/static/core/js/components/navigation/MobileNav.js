/**
 * Mobile Navigation Component
 * Handles mobile menu functionality with touch support
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { EventUtils } from '../../core/utils/events.js';
import { EVENT_TYPES } from '../../core/constants/enums.js';
import { logger } from '../../core/logger/Logger.js';

export class MobileNav extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    // Create child logger with component context
    this.logger = logger.child({
      component: 'MobileNav',
      instance: Math.random().toString(36).substr(2, 9)
    });
    
    this.isOpen = false;
    this.isAnimating = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
  }

  /**
   * Default options for mobile navigation
   */
  getDefaultOptions() {
    return {
      toggleSelector: '.mobile-menu-toggle',
      overlaySelector: '.mobile-nav-overlay',
      menuSelector: '.mobile-nav-menu',
      closeOnLinkClick: true,
      closeOnOutsideClick: true,
      enableSwipeGestures: true,
      swipeThreshold: 50,
      animationDuration: 300,
      breakpoint: 992, // Hide mobile nav above this width
      preventBodyScroll: true
    };
  }

  /**
   * Initialize mobile navigation
   */
  init() {
    this.cacheElements();
    this.setupInitialState();
    super.init();
    this.checkBreakpoint();
    
    if (this.logger) {
      this.logger.debug('MobileNav initialized', {
        options: this.options,
        elementsFound: {
          toggle: !!this.elements.toggle,
          overlay: !!this.elements.overlay,
          menu: !!this.elements.menu,
          navLinksCount: this.elements.navLinks.length
        }
      });
    }
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      toggle: DOMUtils.getElement(this.options.toggleSelector),
      overlay: DOMUtils.getElement(this.options.overlaySelector),
      menu: DOMUtils.getElement(this.options.menuSelector),
      navLinks: DOMUtils.getElements('.mobile-nav-links a')
    };

    // Warn about missing elements
    if (!this.elements.toggle) {
      this.logger.warn('Toggle button not found', {
        selector: this.options.toggleSelector
      });
    }
    if (!this.elements.overlay) {
      this.logger.warn('Overlay element not found', {
        selector: this.options.overlaySelector
      });
    }
    if (!this.elements.menu) {
      this.logger.warn('Menu element not found', {
        selector: this.options.menuSelector
      });
    }
  }

  /**
   * Setup initial state
   */
  setupInitialState() {
    // Ensure menu is closed initially
    this.isOpen = false;
    
    if (this.elements.toggle) {
      this.elements.toggle.classList.remove('active');
      this.elements.toggle.setAttribute('aria-expanded', 'false');
    }
    
    if (this.elements.overlay) {
      this.elements.overlay.classList.remove('active');
      this.elements.overlay.style.display = 'none';
    }
    
    if (this.elements.menu) {
      this.elements.menu.classList.remove('active');
    }
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Toggle button
    if (this.elements.toggle) {
      this.addEventListener(this.elements.toggle, 'click', this.handleToggleClick);
      this.addEventListener(this.elements.toggle, 'touchstart', this.handleToggleTouch, { passive: false });
    }

    // Overlay clicks
    if (this.elements.overlay && this.options.closeOnOutsideClick) {
      this.addEventListener(this.elements.overlay, 'click', this.handleOverlayClick);
    }

    // Navigation links
    if (this.options.closeOnLinkClick) {
      this.elements.navLinks.forEach(link => {
        this.addEventListener(link, 'click', this.handleLinkClick);
        this.addEventListener(link, 'touchend', this.handleLinkTouch, { passive: false });
      });
    }

    // Swipe gestures
    if (this.options.enableSwipeGestures && this.elements.menu) {
      this.addEventListener(this.elements.menu, 'touchstart', this.handleTouchStart, { passive: true });
      this.addEventListener(this.elements.menu, 'touchmove', this.handleTouchMove, { passive: true });
      this.addEventListener(this.elements.menu, 'touchend', this.handleTouchEnd, { passive: true });
    }

    // Keyboard events
    this.addEventListener(document, 'keydown', this.handleKeydown);

    // Window resize
    this.addEventListener(window, 'resize', this.debounce(this.handleResize.bind(this), 250));

    // Focus trap
    this.addEventListener(document, 'focusin', this.handleFocusIn);
  }

  /**
   * Handle toggle button click
   */
  handleToggleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.toggle();
  }

  /**
   * Handle toggle button touch (for better mobile responsiveness)
   */
  handleToggleTouch(event) {
    event.preventDefault();
    event.stopPropagation();
    this.toggle();
  }

  /**
   * Handle overlay click
   */
  handleOverlayClick(event) {
    if (event.target === this.elements.overlay) {
      this.close();
    }
  }

  /**
   * Handle navigation link click
   */
  handleLinkClick(event) {
    // Allow the link to navigate, then close the menu
    setTimeout(() => {
      this.close();
    }, 100);
  }

  /**
   * Handle navigation link touch
   */
  handleLinkTouch(event) {
    event.preventDefault();
    const link = event.target.closest('a');
    if (link && link.href) {
      this.close();
      // Navigate after closing
      setTimeout(() => {
        window.location.href = link.href;
      }, this.options.animationDuration);
    }
  }

  /**
   * Handle touch start for swipe gestures
   */
  handleTouchStart(event) {
    if (!this.isOpen) return;
    
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  /**
   * Handle touch move for swipe gestures
   */
  handleTouchMove(event) {
    if (!this.isOpen) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    
    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Prevent vertical scrolling during horizontal swipe
      event.preventDefault();
    }
  }

  /**
   * Handle touch end for swipe gestures
   */
  handleTouchEnd(event) {
    if (!this.isOpen) return;
    
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    
    // Check if it's a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.options.swipeThreshold) {
      // Swipe left to close (assuming menu slides in from left)
      if (deltaX < 0) {
        this.close();
      }
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeydown(event) {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.handleTabNavigation(event);
        break;
    }
  }

  /**
   * Handle tab navigation (focus trap)
   */
  handleTabNavigation(event) {
    if (!this.isOpen || !this.elements.menu) return;

    const focusableElements = this.elements.menu.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Handle focus events (focus trap)
   */
  handleFocusIn(event) {
    if (!this.isOpen || !this.elements.menu) return;

    // If focus moves outside the menu, bring it back
    if (!this.elements.menu.contains(event.target) && 
        !this.elements.toggle.contains(event.target)) {
      const firstFocusable = this.elements.menu.querySelector(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.checkBreakpoint();
  }

  /**
   * Check if we're above the breakpoint and close menu if needed
   */
  checkBreakpoint() {
    if (window.innerWidth > this.options.breakpoint && this.isOpen) {
      this.close();
    }
  }

  /**
   * Toggle menu open/closed
   */
  toggle() {
    if (this.isAnimating) return;
    
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open menu
   */
  open() {
    if (this.isOpen || this.isAnimating) return;
    
    this.isAnimating = true;
    this.isOpen = true;

    // Update toggle button
    if (this.elements.toggle) {
      this.elements.toggle.classList.add('active');
      this.elements.toggle.setAttribute('aria-expanded', 'true');
    }

    // Show overlay
    if (this.elements.overlay) {
      this.elements.overlay.style.display = 'block';
      
      // Trigger animation
      requestAnimationFrame(() => {
        this.elements.overlay.classList.add('active');
      });
    }

    // Show menu
    if (this.elements.menu) {
      this.elements.menu.classList.add('active');
    }

    // Prevent body scroll
    if (this.options.preventBodyScroll) {
      document.body.style.overflow = 'hidden';
    }

    // Focus first menu item
    setTimeout(() => {
      const firstFocusable = this.elements.menu?.querySelector(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
      
      this.isAnimating = false;
    }, this.options.animationDuration);

    // Emit event
    this.emit(EVENT_TYPES.NAVIGATION_OPENED, {
      type: 'mobile'
    });
  }

  /**
   * Close menu
   */
  close() {
    if (!this.isOpen || this.isAnimating) return;
    
    this.isAnimating = true;
    this.isOpen = false;

    // Update toggle button
    if (this.elements.toggle) {
      this.elements.toggle.classList.remove('active');
      this.elements.toggle.setAttribute('aria-expanded', 'false');
    }

    // Hide overlay
    if (this.elements.overlay) {
      this.elements.overlay.classList.remove('active');
      
      // Hide after animation
      setTimeout(() => {
        if (!this.isOpen) { // Check again in case it was reopened
          this.elements.overlay.style.display = 'none';
        }
      }, this.options.animationDuration);
    }

    // Hide menu
    if (this.elements.menu) {
      this.elements.menu.classList.remove('active');
    }

    // Restore body scroll
    if (this.options.preventBodyScroll) {
      document.body.style.overflow = '';
    }

    // Return focus to toggle button
    setTimeout(() => {
      if (this.elements.toggle) {
        this.elements.toggle.focus();
      }
      
      this.isAnimating = false;
    }, this.options.animationDuration);

    // Emit event
    this.emit(EVENT_TYPES.NAVIGATION_CLOSED, {
      type: 'mobile'
    });
  }

  /**
   * Check if menu is open
   */
  isMenuOpen() {
    return this.isOpen;
  }

  /**
   * Update navigation links
   */
  updateLinks(links) {
    if (!this.elements.menu) return;

    const linksContainer = this.elements.menu.querySelector('.mobile-nav-links');
    if (!linksContainer) return;

    // Clear existing links
    linksContainer.innerHTML = '';

    // Add new links
    links.forEach(link => {
      const linkElement = DOMUtils.createElement('a', {
        href: link.href,
        className: 'mobile-nav-link'
      }, link.text);

      if (link.isActive) {
        linkElement.classList.add('active');
      }

      linksContainer.appendChild(linkElement);
    });

    // Re-cache nav links
    this.elements.navLinks = DOMUtils.getElements('.mobile-nav-links a');

    // Re-bind link events
    if (this.options.closeOnLinkClick) {
      this.elements.navLinks.forEach(link => {
        this.addEventListener(link, 'click', this.handleLinkClick);
        this.addEventListener(link, 'touchend', this.handleLinkTouch, { passive: false });
      });
    }
  }

  /**
   * Destroy component
   */
  destroy() {
    // Close menu if open
    if (this.isOpen) {
      this.close();
    }

    // Restore body scroll
    document.body.style.overflow = '';

    super.destroy();
  }
}

// Default export
export default MobileNav;
