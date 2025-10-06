/**
 * Animation Manager Service
 * Handles UI animations and transitions
 * Follows Single Responsibility Principle - only manages animations
 * ES6 Module Export
 */

import { BaseComponent } from '../core/base/BaseComponent.js';
import { CONFIG, EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';

export class AnimationManager extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.animations = new Map();
    this.animationQueue = [];
    this.isAnimating = false;
    
    this.init();
  }

  getDefaultOptions() {
    return {
      enableStaggeredAnimations: true,
      defaultDuration: 600,
      defaultDelay: 100,
      enableReducedMotion: true,
      animationEasing: 'ease-out'
    };
  }

  init() {
    this.checkReducedMotionPreference();
    this.addAnimationStyles();
    this.bindEvents();
  }

  /**
   * Check user's reduced motion preference
   */
  checkReducedMotionPreference() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.options.enableReducedMotion = this.options.enableReducedMotion && !prefersReducedMotion;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Listen for reduced motion preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', (e) => {
        this.options.enableReducedMotion = !e.matches;
      });
    }
  }

  /**
   * Animate summary cards with staggered effect
   */
  animateSummaryCards(cards, options = {}) {
    if (!this.options.enableReducedMotion) {
      return this.animateWithoutMotion(cards);
    }

    const {
      duration = this.options.defaultDuration,
      delay = this.options.defaultDelay,
      staggerDelay = 100,
      easing = this.options.animationEasing
    } = options;

    cards.forEach((card, index) => {
      // Initial state
      this.setInitialState(card, {
        opacity: '0',
        transform: 'translateY(20px)'
      });

      // Animate with stagger
      setTimeout(() => {
        this.animateElement(card, {
          opacity: '1',
          transform: 'translateY(0)'
        }, {
          duration,
          easing,
          fill: 'forwards'
        });
      }, index * staggerDelay);
    });
  }

  /**
   * Setup chart loading animations
   */
  setupChartAnimations(chartContainers) {
    chartContainers.forEach(container => {
      this.addEventListener(container, 'click', () => {
        this.animateChartLoad(container);
      });
    });
  }

  /**
   * Animate chart load
   */
  animateChartLoad(chartElement) {
    if (!this.options.enableReducedMotion) {
      return;
    }

    const animationId = `chart-load-${Date.now()}`;
    
    this.animateElement(chartElement, {
      transform: 'scale(0.98)'
    }, {
      duration: 150,
      easing: 'ease-out',
      fill: 'forwards'
    }).then(() => {
      return this.animateElement(chartElement, {
        transform: 'scale(1)'
      }, {
        duration: 300,
        easing: 'ease-out',
        fill: 'forwards'
      });
    });

    this.animations.set(animationId, {
      element: chartElement,
      type: 'chart-load',
      startTime: Date.now()
    });
  }

  /**
   * Animate element with CSS transitions
   */
  animateElement(element, properties, options = {}) {
    if (!this.options.enableReducedMotion) {
      // Apply properties immediately without animation
      Object.assign(element.style, properties);
      return Promise.resolve();
    }

    const {
      duration = this.options.defaultDuration,
      easing = this.options.animationEasing,
      delay = 0,
      fill = 'forwards'
    } = options;

    return new Promise((resolve) => {
      // Set transition
      element.style.transition = `all ${duration}ms ${easing}`;
      
      if (delay > 0) {
        element.style.transitionDelay = `${delay}ms`;
      }

      // Apply properties
      Object.assign(element.style, properties);

      // Clean up after animation
      const cleanup = () => {
        element.style.transition = '';
        element.style.transitionDelay = '';
        resolve();
      };

      if (fill === 'forwards') {
        // Keep final state
        setTimeout(cleanup, duration + delay);
      } else {
        // Revert to initial state
        setTimeout(() => {
          Object.keys(properties).forEach(prop => {
            element.style[prop] = '';
          });
          cleanup();
        }, duration + delay);
      }
    });
  }

  /**
   * Animate element with keyframes
   */
  animateWithKeyframes(element, keyframes, options = {}) {
    if (!this.options.enableReducedMotion) {
      return Promise.resolve();
    }

    const {
      duration = this.options.defaultDuration,
      easing = this.options.animationEasing,
      iterations = 1,
      fill = 'forwards'
    } = options;

    return new Promise((resolve) => {
      const animation = element.animate(keyframes, {
        duration,
        easing,
        iterations,
        fill
      });

      animation.onfinish = () => resolve();
      animation.oncancel = () => resolve();
    });
  }

  /**
   * Fade in element
   */
  fadeIn(element, options = {}) {
    return this.animateElement(element, {
      opacity: '1'
    }, {
      duration: options.duration || 300,
      easing: options.easing || 'ease-out'
    });
  }

  /**
   * Fade out element
   */
  fadeOut(element, options = {}) {
    return this.animateElement(element, {
      opacity: '0'
    }, {
      duration: options.duration || 300,
      easing: options.easing || 'ease-in'
    });
  }

  /**
   * Slide in from direction
   */
  slideIn(element, direction = 'up', options = {}) {
    const transforms = {
      up: { initial: 'translateY(20px)', final: 'translateY(0)' },
      down: { initial: 'translateY(-20px)', final: 'translateY(0)' },
      left: { initial: 'translateX(20px)', final: 'translateX(0)' },
      right: { initial: 'translateX(-20px)', final: 'translateX(0)' }
    };

    const transform = transforms[direction] || transforms.up;

    this.setInitialState(element, {
      opacity: '0',
      transform: transform.initial
    });

    return this.animateElement(element, {
      opacity: '1',
      transform: transform.final
    }, options);
  }

  /**
   * Bounce animation
   */
  bounce(element, options = {}) {
    const keyframes = [
      { transform: 'scale(1)', offset: 0 },
      { transform: 'scale(1.1)', offset: 0.3 },
      { transform: 'scale(0.95)', offset: 0.6 },
      { transform: 'scale(1.05)', offset: 0.8 },
      { transform: 'scale(1)', offset: 1 }
    ];

    return this.animateWithKeyframes(element, keyframes, {
      duration: options.duration || 600,
      easing: options.easing || 'ease-out'
    });
  }

  /**
   * Pulse animation
   */
  pulse(element, options = {}) {
    const keyframes = [
      { transform: 'scale(1)', offset: 0 },
      { transform: 'scale(1.05)', offset: 0.5 },
      { transform: 'scale(1)', offset: 1 }
    ];

    return this.animateWithKeyframes(element, keyframes, {
      duration: options.duration || 1000,
      iterations: options.iterations || 'infinite',
      easing: options.easing || 'ease-in-out'
    });
  }

  /**
   * Shake animation
   */
  shake(element, options = {}) {
    const keyframes = [
      { transform: 'translateX(0)', offset: 0 },
      { transform: 'translateX(-5px)', offset: 0.1 },
      { transform: 'translateX(5px)', offset: 0.2 },
      { transform: 'translateX(-5px)', offset: 0.3 },
      { transform: 'translateX(5px)', offset: 0.4 },
      { transform: 'translateX(-5px)', offset: 0.5 },
      { transform: 'translateX(5px)', offset: 0.6 },
      { transform: 'translateX(-5px)', offset: 0.7 },
      { transform: 'translateX(5px)', offset: 0.8 },
      { transform: 'translateX(-5px)', offset: 0.9 },
      { transform: 'translateX(0)', offset: 1 }
    ];

    return this.animateWithKeyframes(element, keyframes, {
      duration: options.duration || 500,
      easing: options.easing || 'ease-in-out'
    });
  }

  /**
   * Stagger animation for multiple elements
   */
  stagger(elements, animationFn, options = {}) {
    const {
      delay = this.options.defaultDelay,
      reverse = false
    } = options;

    const elementArray = Array.from(elements);
    if (reverse) {
      elementArray.reverse();
    }

    return Promise.all(
      elementArray.map((element, index) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            animationFn(element).then(resolve);
          }, index * delay);
        });
      })
    );
  }

  /**
   * Animate without motion (for reduced motion preference)
   */
  animateWithoutMotion(elements) {
    const elementArray = Array.from(elements);
    elementArray.forEach(element => {
      element.style.opacity = '1';
      element.style.transform = 'none';
    });
  }

  /**
   * Set initial state for element
   */
  setInitialState(element, properties) {
    Object.assign(element.style, properties);
  }

  /**
   * Reset element styles
   */
  resetElement(element) {
    element.style.opacity = '';
    element.style.transform = '';
    element.style.transition = '';
    element.style.transitionDelay = '';
  }

  /**
   * Create loading spinner animation
   */
  createLoadingSpinner(container, options = {}) {
    const {
      size = 24,
      color = '#3b82f6',
      thickness = 3
    } = options;

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border: ${thickness}px solid #e5e7eb;
      border-top: ${thickness}px solid ${color};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    container.appendChild(spinner);
    return spinner;
  }

  /**
   * Create progress bar animation
   */
  createProgressBar(container, options = {}) {
    const {
      width = '100%',
      height = '4px',
      color = '#3b82f6',
      duration = 2000
    } = options;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.cssText = `
      width: ${width};
      height: ${height};
      background-color: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    `;

    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background-color: ${color};
      transition: width ${duration}ms ease-out;
    `;

    progressBar.appendChild(progressFill);
    container.appendChild(progressBar);

    // Start animation
    setTimeout(() => {
      progressFill.style.width = '100%';
    }, 100);

    return { progressBar, progressFill };
  }

  /**
   * Animate counter from 0 to target value
   */
  animateCounter(element, targetValue, options = {}) {
    const {
      duration = 2000,
      easing = 'ease-out',
      format = (value) => value.toLocaleString()
    } = options;

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easedProgress = this.getEasingValue(progress, easing);
      const currentValue = startValue + (targetValue - startValue) * easedProgress;
      
      element.textContent = format(Math.floor(currentValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Get easing value
   */
  getEasingValue(t, easing) {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'linear':
        return t;
      default:
        return 1 - (1 - t) * (1 - t); // Default to ease-out
    }
  }

  /**
   * Add animation styles
   */
  addAnimationStyles() {
    if (document.getElementById('animation-manager-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'animation-manager-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes slideInUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes slideInDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes slideInLeft {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes slideInRight {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% { transform: scale(1); }
        40%, 43% { transform: scale(1.1); }
        70% { transform: scale(0.95); }
        90% { transform: scale(1.05); }
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }

      .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
      }

      .animate-fade-out {
        animation: fadeOut 0.3s ease-in;
      }

      .animate-slide-in-up {
        animation: slideInUp 0.6s ease-out;
      }

      .animate-slide-in-down {
        animation: slideInDown 0.6s ease-out;
      }

      .animate-slide-in-left {
        animation: slideInLeft 0.6s ease-out;
      }

      .animate-slide-in-right {
        animation: slideInRight 0.6s ease-out;
      }

      .animate-bounce {
        animation: bounce 0.6s ease-out;
      }

      .animate-pulse {
        animation: pulse 1s ease-in-out infinite;
      }

      .animate-shake {
        animation: shake 0.5s ease-in-out;
      }

      @media (prefers-reduced-motion: reduce) {
        .animate-fade-in,
        .animate-fade-out,
        .animate-slide-in-up,
        .animate-slide-in-down,
        .animate-slide-in-left,
        .animate-slide-in-right,
        .animate-bounce,
        .animate-pulse,
        .animate-shake {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get animation statistics
   */
  getAnimationStats() {
    return {
      activeAnimations: this.animations.size,
      animationQueue: this.animationQueue.length,
      isAnimating: this.isAnimating,
      reducedMotionEnabled: !this.options.enableReducedMotion
    };
  }

  /**
   * Stop all animations
   */
  stopAllAnimations() {
    this.animations.forEach((animation, id) => {
      if (animation.element && animation.element.getAnimations) {
        animation.element.getAnimations().forEach(anim => anim.cancel());
      }
    });
    
    this.animations.clear();
    this.animationQueue = [];
    this.isAnimating = false;
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.stopAllAnimations();
    super.destroy();
  }
}

// Export for use in other modules
export default AnimationManager;
