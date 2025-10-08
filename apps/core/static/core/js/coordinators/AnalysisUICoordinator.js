/**
 * AnalysisUICoordinator
 * Coordinates UI interactions and animations for the analysis page
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { AnimationUtils } from '../core/utils/animations.js';

export class AnalysisUICoordinator {
  constructor(dataCoordinator, options = {}) {
    this.logger = logger.child({
      component: 'AnalysisUICoordinator'
    });
    
    this.dataCoordinator = dataCoordinator;
    this.options = {
      enableAnimations: true,
      counterDuration: 2000,
      ...options
    };
    
    this.observers = [];
    
    this.logger.debug('AnalysisUICoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing AnalysisUICoordinator');
    
    try {
      // Animate KPI cards
      this.animateKPICards();
      
      // Setup scroll animations for charts
      this.setupScrollAnimations();
      
      // Setup responsive handlers
      this.setupResponsiveHandlers();
      
      this.logger.info('AnalysisUICoordinator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AnalysisUICoordinator', error);
      throw error;
    }
  }

  /**
   * Animate KPI cards with counter effect
   */
  animateKPICards() {
    const kpiCards = DOMUtils.getElements('.kpi-value');
    if (kpiCards.length === 0) {
      this.logger.debug('No KPI cards found');
      return;
    }
    
    kpiCards.forEach(card => {
      const target = parseInt(card.getAttribute('data-target')) || 0;
      const duration = this.options.counterDuration;
      
      this.animateCounter(card, 0, target, duration);
    });
    
    this.logger.debug('KPI cards animated', { count: kpiCards.length });
  }

  /**
   * Animate a counter from start to end value
   */
  animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    const range = end - start;
    
    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (range * easeOut));
      
      // Format number with commas
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = end.toLocaleString();
        element.classList.add('animated');
      }
    };
    
    requestAnimationFrame(updateCounter);
  }

  /**
   * Setup scroll animations for charts
   */
  setupScrollAnimations() {
    const chartCards = DOMUtils.getElements('.chart-card');
    if (chartCards.length === 0) {
      this.logger.debug('No chart cards found for scroll animation');
      return;
    }
    
    const observer = AnimationUtils.createScrollObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
          this.logger.debug('Chart card animated', {
            chartId: entry.target.id
          });
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    chartCards.forEach(card => observer.observe(card));
    this.observers.push(observer);
    
    this.logger.debug('Scroll animations setup', { cardsCount: chartCards.length });
  }

  /**
   * Setup responsive handlers
   */
  setupResponsiveHandlers() {
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.logger.debug('Window resized, updating UI');
        eventBus.emit('ui:resize', {
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 250);
    };
    
    window.addEventListener('resize', handleResize);
    
    this.logger.debug('Responsive handlers configured');
  }

  /**
   * Show loading state
   */
  showLoading() {
    const container = DOMUtils.getElement('.analysis-content');
    if (container) {
      container.classList.add('loading');
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const container = DOMUtils.getElement('.analysis-content');
    if (container) {
      container.classList.remove('loading');
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying AnalysisUICoordinator');
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    eventBus.offContext(this);
    
    this.logger.debug('AnalysisUICoordinator destroyed');
  }
}

export default AnalysisUICoordinator;

