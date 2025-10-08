/**
 * HomeCarouselCoordinator
 * Coordinates the featured documents carousel on home page
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';

export class HomeCarouselCoordinator {
  constructor(options = {}) {
    this.logger = logger.child({
      component: 'HomeCarouselCoordinator'
    });
    
    this.options = {
      autoPlay: true,
      interval: 5000,
      ...options
    };
    
    this.currentSlide = 0;
    this.autoPlayInterval = null;
    this.elements = {};
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    this.logger.debug('HomeCarouselCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing HomeCarouselCoordinator');
    
    this.cacheElements();
    
    if (!this.elements.carousel) {
      this.logger.debug('Carousel not found on page');
      return;
    }
    
    this.createIndicators();
    this.setupEventListeners();
    this.updateCarousel();
    this.startAutoPlay();
    
    this.logger.info('HomeCarouselCoordinator initialized successfully', {
      slidesCount: this.elements.slides.length
    });
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements.carousel = DOMUtils.getElement('.carousel');
    
    if (!this.elements.carousel) {
      return;
    }
    
    this.elements.track = this.elements.carousel.querySelector('.carousel__track');
    this.elements.slides = this.elements.carousel.querySelectorAll('.carousel__item');
    this.elements.prevBtn = this.elements.carousel.querySelector('.carousel__nav--prev');
    this.elements.nextBtn = this.elements.carousel.querySelector('.carousel__nav--next');
    this.elements.indicators = this.elements.carousel.querySelector('.carousel__indicators');
  }

  /**
   * Create carousel indicators
   */
  createIndicators() {
    if (!this.elements.indicators || !this.elements.slides) {
      return;
    }
    
    this.elements.slides.forEach((_, index) => {
      const indicator = DOMUtils.createElement('button', {
        className: `carousel-indicator ${index === 0 ? 'active' : ''}`,
        'data-slide': index,
        'aria-label': `Go to slide ${index + 1}`
      });
      this.elements.indicators.appendChild(indicator);
    });
    
    this.logger.debug('Carousel indicators created', {
      count: this.elements.slides.length
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const { prevBtn, nextBtn, indicators, carousel, track } = this.elements;
    
    // Previous button
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevSlide());
    }

    // Next button
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextSlide());
    }

    // Indicator clicks
    if (indicators) {
      indicators.addEventListener('click', (event) => {
        const indicator = event.target.closest('.carousel-indicator');
        if (indicator) {
          const slideIndex = parseInt(indicator.getAttribute('data-slide'));
          this.goToSlide(slideIndex);
        }
      });
    }

    // Pause auto play on hover
    if (carousel) {
      carousel.addEventListener('mouseenter', () => this.stopAutoPlay());
      carousel.addEventListener('mouseleave', () => this.startAutoPlay());
    }

    // Touch support
    if (track) {
      track.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      track.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
      }, { passive: true });
    }
    
    this.logger.debug('Event listeners configured');
  }

  /**
   * Handle swipe gesture
   */
  handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = this.touchStartX - this.touchEndX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
  }

  /**
   * Update carousel UI
   */
  updateCarousel() {
    const { track, slides, indicators, prevBtn, nextBtn } = this.elements;
    
    if (!track || !slides || slides.length === 0) {
      return;
    }
    
    const slideWidth = slides[0].offsetWidth;
    track.style.transform = `translateX(-${this.currentSlide * slideWidth}px)`;
    
    // Update indicators
    const indicatorButtons = indicators?.querySelectorAll('.carousel-indicator');
    indicatorButtons?.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentSlide);
    });
    
    // Update navigation buttons
    if (prevBtn) prevBtn.disabled = this.currentSlide === 0;
    if (nextBtn) nextBtn.disabled = this.currentSlide === slides.length - 1;
  }

  /**
   * Go to specific slide
   */
  goToSlide(index) {
    this.currentSlide = Math.max(0, Math.min(this.elements.slides.length - 1, index));
    this.updateCarousel();
    this.restartAutoPlay();
    
    this.logger.debug('Moved to slide', { slideIndex: this.currentSlide });
    
    // Emit event
    eventBus.emit(EVENTS.CAROUSEL_SLIDE_CHANGED, {
      currentSlide: this.currentSlide,
      totalSlides: this.elements.slides.length
    });
  }

  /**
   * Go to next slide
   */
  nextSlide() {
    this.goToSlide(this.currentSlide + 1);
  }

  /**
   * Go to previous slide
   */
  prevSlide() {
    this.goToSlide(this.currentSlide - 1);
  }

  /**
   * Start auto play
   */
  startAutoPlay() {
    if (!this.options.autoPlay || this.autoPlayInterval) {
      return;
    }
    
    this.autoPlayInterval = setInterval(() => {
      if (this.currentSlide >= this.elements.slides.length - 1) {
        this.goToSlide(0);
      } else {
        this.nextSlide();
      }
    }, this.options.interval);
    
    this.logger.debug('Auto play started');
  }

  /**
   * Stop auto play
   */
  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
      this.logger.debug('Auto play stopped');
    }
  }

  /**
   * Restart auto play
   */
  restartAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying HomeCarouselCoordinator');
    
    this.stopAutoPlay();
    
    this.logger.debug('HomeCarouselCoordinator destroyed');
  }
}

export default HomeCarouselCoordinator;
