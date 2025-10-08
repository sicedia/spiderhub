/**
 * Home Page Manager (V2 - Refactored with Coordinators)
 * Manages the home page functionality using coordinator pattern
 * ES6 Module Export
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';

// Coordinators
import { HomeAnimationCoordinator } from '../coordinators/HomeAnimationCoordinator.js';
import { HomeCarouselCoordinator } from '../coordinators/HomeCarouselCoordinator.js';
import { HomeDataCoordinator } from '../coordinators/HomeDataCoordinator.js';
import { HomeInteractionCoordinator } from '../coordinators/HomeInteractionCoordinator.js';

export class HomePageManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    this.coordinators = {};
    this.pageData = null;
    
    this.logger.info('HomePageManager V2 initialized');
  }

  /**
   * Default options for home page
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      enableHeroAnimation: true,
      enableStatsAnimation: true,
      enableFeaturesAnimation: true,
      enableNodeWebAnimation: true,
      enableCarousel: true,
      autoPlayCarousel: true,
      carouselInterval: 5000,
      enableSearchForm: true,
      enableCTAEffects: true,
      enableQuickActions: true
    };
  }

  /**
   * Initialize services
   */
  async initializeServices() {
    if (this.logger) {
      this.logger.debug('No additional services to initialize');
    }
  }

  /**
   * Load page data (handled by coordinators)
   */
  async loadPageData() {
    // Data loading is now handled by HomeDataCoordinator
    if (this.logger) {
      this.logger.debug('Data loading delegated to HomeDataCoordinator');
    }
  }

  /**
   * Initialize components (now using coordinators)
   */
  async initializeComponents() {
    if (this.logger) {
      this.logger.debug('Initializing coordinators');
    }
    
    try {
      // Initialize HomeDataCoordinator first (loads data needed by other coordinators)
      this.coordinators.data = new HomeDataCoordinator({
        enableStatsLoading: true,
        enableFeaturedDocs: true,
        enableRecentUpdates: true
      });
      await this.coordinators.data.init();
      
      // Get page data from data coordinator
      this.pageData = this.coordinators.data.getPageData();
      
      if (this.logger) {
        this.logger.info('✅ HomeDataCoordinator initialized');
      }
      
      // Initialize HomeAnimationCoordinator
      this.coordinators.animation = new HomeAnimationCoordinator({
        enableHeroAnimation: this.options.enableHeroAnimation,
        enableStatsAnimation: this.options.enableStatsAnimation,
        enableFeaturesAnimation: this.options.enableFeaturesAnimation,
        enableNodeWebAnimation: this.options.enableNodeWebAnimation
      });
      await this.coordinators.animation.init();
      
      if (this.logger) {
        this.logger.info('✅ HomeAnimationCoordinator initialized');
      }
      
      // Initialize HomeCarouselCoordinator
      this.coordinators.carousel = new HomeCarouselCoordinator({
        autoPlay: this.options.autoPlayCarousel,
        interval: this.options.carouselInterval
      });
      await this.coordinators.carousel.init();
      
      if (this.logger) {
        this.logger.info('✅ HomeCarouselCoordinator initialized');
      }
      
      // Initialize HomeInteractionCoordinator
      this.coordinators.interaction = new HomeInteractionCoordinator({
        enableSearchForm: this.options.enableSearchForm,
        enableCTAEffects: this.options.enableCTAEffects,
        enableQuickActions: this.options.enableQuickActions
      });
      await this.coordinators.interaction.init();
      
      if (this.logger) {
        this.logger.info('✅ HomeInteractionCoordinator initialized');
      }
      
      // Setup coordinator communication
      this.setupCoordinatorCommunication();
      
      if (this.logger) {
        this.logger.info('All coordinators initialized successfully', {
          coordinatorCount: Object.keys(this.coordinators).length
        });
      }
      
    } catch (error) {
      if (this.logger) {
        this.logger.error('Error initializing coordinators', error);
      }
      throw error;
    }
  }

  /**
   * Setup communication between coordinators
   */
  setupCoordinatorCommunication() {
    if (this.logger) {
      this.logger.debug('Setting up coordinator communication');
    }
    
    // Listen for data loaded event
    eventBus.on(EVENTS.HOME_DATA_LOADED, (data) => {
      if (this.logger) {
        this.logger.debug('Home data loaded event received', data);
      }
    }, this);
    
    // Listen for search submission
    eventBus.on(EVENTS.HOME_SEARCH_SUBMITTED, (data) => {
      if (this.logger) {
        this.logger.info('Search submitted from home page', data);
      }
    }, this);
    
    // Listen for quick actions
    eventBus.on(EVENTS.HOME_QUICK_ACTION, (data) => {
      if (this.logger) {
        this.logger.info('Quick action triggered', data);
      }
    }, this);
    
    if (this.logger) {
      this.logger.debug('Coordinator communication configured');
    }
  }

  /**
   * Get page data
   */
  getPageData() {
    return this.pageData;
  }

  /**
   * Get statistics
   */
  getStats() {
    return this.coordinators.data?.getStats() || null;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.logger) {
      this.logger.debug('Destroying HomePageManager');
    }
    
    // Destroy all coordinators
    Object.values(this.coordinators).forEach(coordinator => {
      if (coordinator && coordinator.destroy) {
        coordinator.destroy();
      }
    });
    
    this.coordinators = {};
    this.pageData = null;
    
    // Call parent destroy
    super.destroy();
    
    if (this.logger) {
      this.logger.info('HomePageManager destroyed');
    }
  }
}

// Default export
export default HomePageManager;

