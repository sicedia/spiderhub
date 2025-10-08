/**
 * HomeInteractionCoordinator
 * Coordinates user interactions on the home page
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { AnimationUtils } from '../core/utils/animations.js';

export class HomeInteractionCoordinator {
  constructor(options = {}) {
    this.logger = logger.child({
      component: 'HomeInteractionCoordinator'
    });
    
    this.options = {
      enableSearchForm: true,
      enableCTAEffects: true,
      enableQuickActions: true,
      ...options
    };
    
    this.logger.debug('HomeInteractionCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing HomeInteractionCoordinator');
    
    if (this.options.enableSearchForm) {
      this.initializeSearchForm();
    }
    
    if (this.options.enableCTAEffects) {
      this.initializeCTAButtons();
    }
    
    if (this.options.enableQuickActions) {
      this.initializeQuickActions();
    }
    
    this.logger.info('HomeInteractionCoordinator initialized successfully');
  }

  /**
   * Initialize search form
   */
  initializeSearchForm() {
    // NOTE: Current home.html doesn't have a search form
    // Keeping this for future use when search form is added
    const searchForm = DOMUtils.getElement('.home-hero__search-form');
    if (!searchForm) {
      this.logger.debug('Search form not found (not in current template)');
      return;
    }

    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const searchInput = searchForm.querySelector('input[type="search"]');
      if (searchInput && searchInput.value.trim()) {
        const query = searchInput.value.trim();
        
        this.logger.info('Search submitted from home page', { query });
        
        // Emit event
        eventBus.emit(EVENTS.HOME_SEARCH_SUBMITTED, { query });
        
        // Redirect to explore page with search query
        window.location.href = `/explore?search=${encodeURIComponent(query)}`;
      }
    });
    
    this.logger.debug('Search form initialized');
  }

  /**
   * Initialize call-to-action buttons
   */
  initializeCTAButtons() {
    const ctaButtons = DOMUtils.getElements('.home-hero__actions .button, .home-cta__actions .button');
    if (ctaButtons.length === 0) {
      this.logger.debug('No CTA buttons found');
      return;
    }
    
    ctaButtons.forEach(button => {
      // Add ripple effect on click
      button.addEventListener('click', (event) => {
        AnimationUtils.createRipple(button, event);
      });

      // Add hover animation
      button.addEventListener('mouseenter', () => {
        AnimationUtils.scale(button, 1, 1.05, 200);
      });

      button.addEventListener('mouseleave', () => {
        AnimationUtils.scale(button, 1.05, 1, 200);
      });
    });
    
    this.logger.debug('CTA buttons initialized', {
      count: ctaButtons.length
    });
  }

  /**
   * Initialize quick action buttons
   */
  initializeQuickActions() {
    // NOTE: Current home.html doesn't have quick action buttons with data-action
    // Keeping this for future use
    const quickActionButtons = DOMUtils.getElements('[data-action]');
    if (quickActionButtons.length === 0) {
      this.logger.debug('No quick action buttons found (not in current template)');
      return;
    }
    
    quickActionButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const action = button.getAttribute('data-action');
        this.handleQuickAction(action, event);
      });
    });
    
    this.logger.debug('Quick action buttons initialized', {
      count: quickActionButtons.length
    });
  }

  /**
   * Handle quick action button clicks
   */
  handleQuickAction(action, event) {
    this.logger.info('Quick action triggered', { action });
    
    // Emit event
    eventBus.emit(EVENTS.HOME_QUICK_ACTION, { action });
    
    switch (action) {
      case 'explore':
        window.location.href = '/explore';
        break;
      case 'analysis':
        window.location.href = '/analysis';
        break;
      case 'about':
        window.location.href = '/about';
        break;
      default:
        this.logger.warn('Unknown quick action', { action });
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying HomeInteractionCoordinator');
    
    // Event listeners will be automatically cleaned up by the browser
    // when elements are removed from DOM
    
    this.logger.debug('HomeInteractionCoordinator destroyed');
  }
}

export default HomeInteractionCoordinator;

