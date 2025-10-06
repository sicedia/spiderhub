/**
 * Animation Utilities
 * Centralized animation functions and effects
 * ES6 Module Export
 */

import { CONFIG } from '../constants/config.js';
import { DOMUtils } from './dom.js';

export class AnimationUtils {
  /**
   * Animation state tracking
   */
  static activeAnimations = new Map();

  /**
   * Create intersection observer for scroll animations
   */
  static createScrollObserver(callback, options = {}) {
    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
  }

  /**
   * Animate counter from 0 to target value
   */
  static animateCounter(element, targetValue, duration = CONFIG.ANIMATION.DURATION, suffix = '') {
    const startValue = 0;
    const increment = targetValue / (duration / 16);
    let currentValue = startValue;
    
    const animationId = `counter-${Date.now()}-${Math.random()}`;
    
    const updateCounter = () => {
      currentValue = Math.min(currentValue + increment, targetValue);
      element.textContent = Math.floor(currentValue) + suffix;
      
      if (currentValue < targetValue) {
        const frameId = requestAnimationFrame(updateCounter);
        this.activeAnimations.set(animationId, frameId);
      } else {
        this.activeAnimations.delete(animationId);
      }
    };
    
    updateCounter();
    return animationId;
  }

  /**
   * Animate progress bar
   */
  static animateProgressBar(element, targetPercent, duration = CONFIG.ANIMATION.DURATION) {
    const startPercent = 0;
    const increment = targetPercent / (duration / 16);
    let currentPercent = startPercent;
    
    const animationId = `progress-${Date.now()}-${Math.random()}`;
    
    const updateProgress = () => {
      currentPercent = Math.min(currentPercent + increment, targetPercent);
      element.style.width = `${currentPercent}%`;
      
      if (currentPercent < targetPercent) {
        const frameId = requestAnimationFrame(updateProgress);
        this.activeAnimations.set(animationId, frameId);
      } else {
        this.activeAnimations.delete(animationId);
      }
    };
    
    updateProgress();
    return animationId;
  }

  /**
   * Fade in animation
   */
  static fadeIn(element, duration = CONFIG.ANIMATION.FADE_DURATION) {
    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.display = '';
      element.classList.remove('hidden');
      
      const animationId = `fadeIn-${Date.now()}-${Math.random()}`;
      
      requestAnimationFrame(() => {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '1';
        
        const timeoutId = setTimeout(() => {
          element.style.transition = '';
          this.activeAnimations.delete(animationId);
          resolve();
        }, duration);
        
        this.activeAnimations.set(animationId, timeoutId);
      });
    });
  }

  /**
   * Fade out animation
   */
  static fadeOut(element, duration = CONFIG.ANIMATION.FADE_DURATION) {
    return new Promise(resolve => {
      const animationId = `fadeOut-${Date.now()}-${Math.random()}`;
      
      element.style.transition = `opacity ${duration}ms ease`;
      element.style.opacity = '0';
      
      const timeoutId = setTimeout(() => {
        element.style.display = 'none';
        element.style.transition = '';
        this.activeAnimations.delete(animationId);
        resolve();
      }, duration);
      
      this.activeAnimations.set(animationId, timeoutId);
    });
  }

  /**
   * Slide down animation
   */
  static slideDown(element, duration = CONFIG.ANIMATION.SLIDE_DURATION) {
    return new Promise(resolve => {
      const height = element.scrollHeight;
      element.style.height = '0px';
      element.style.overflow = 'hidden';
      element.style.display = '';
      element.classList.remove('hidden');
      
      const animationId = `slideDown-${Date.now()}-${Math.random()}`;
      
      requestAnimationFrame(() => {
        element.style.transition = `height ${duration}ms ease`;
        element.style.height = `${height}px`;
        
        const timeoutId = setTimeout(() => {
          element.style.height = '';
          element.style.overflow = '';
          element.style.transition = '';
          this.activeAnimations.delete(animationId);
          resolve();
        }, duration);
        
        this.activeAnimations.set(animationId, timeoutId);
      });
    });
  }

  /**
   * Slide up animation
   */
  static slideUp(element, duration = CONFIG.ANIMATION.SLIDE_DURATION) {
    return new Promise(resolve => {
      const height = element.scrollHeight;
      element.style.height = `${height}px`;
      element.style.overflow = 'hidden';
      
      const animationId = `slideUp-${Date.now()}-${Math.random()}`;
      
      requestAnimationFrame(() => {
        element.style.transition = `height ${duration}ms ease`;
        element.style.height = '0px';
        
        const timeoutId = setTimeout(() => {
          element.style.display = 'none';
          element.style.height = '';
          element.style.overflow = '';
          element.style.transition = '';
          this.activeAnimations.delete(animationId);
          resolve();
        }, duration);
        
        this.activeAnimations.set(animationId, timeoutId);
      });
    });
  }

  /**
   * Scale animation
   */
  static scale(element, fromScale = 0, toScale = 1, duration = CONFIG.ANIMATION.FADE_DURATION) {
    return new Promise(resolve => {
      element.style.transform = `scale(${fromScale})`;
      element.style.display = '';
      element.classList.remove('hidden');
      
      const animationId = `scale-${Date.now()}-${Math.random()}`;
      
      requestAnimationFrame(() => {
        element.style.transition = `transform ${duration}ms ease`;
        element.style.transform = `scale(${toScale})`;
        
        const timeoutId = setTimeout(() => {
          element.style.transition = '';
          element.style.transform = '';
          this.activeAnimations.delete(animationId);
          resolve();
        }, duration);
        
        this.activeAnimations.set(animationId, timeoutId);
      });
    });
  }

  /**
   * Bounce animation
   */
  static bounce(element, intensity = 10, duration = 600) {
    return new Promise(resolve => {
      const animationId = `bounce-${Date.now()}-${Math.random()}`;
      
      element.style.animation = `bounce ${duration}ms ease-in-out`;
      
      // Create keyframes if they don't exist
      if (!document.querySelector('#bounce-keyframes')) {
        const style = document.createElement('style');
        style.id = 'bounce-keyframes';
        style.textContent = `
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate3d(0, 0, 0);
            }
            40%, 43% {
              transform: translate3d(0, -${intensity}px, 0);
            }
            70% {
              transform: translate3d(0, -${intensity/2}px, 0);
            }
            90% {
              transform: translate3d(0, -${intensity/4}px, 0);
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      const timeoutId = setTimeout(() => {
        element.style.animation = '';
        this.activeAnimations.delete(animationId);
        resolve();
      }, duration);
      
      this.activeAnimations.set(animationId, timeoutId);
    });
  }

  /**
   * Pulse animation
   */
  static pulse(element, scale = 1.05, duration = 1000) {
    return new Promise(resolve => {
      const animationId = `pulse-${Date.now()}-${Math.random()}`;
      
      element.style.animation = `pulse ${duration}ms ease-in-out infinite`;
      
      // Create keyframes if they don't exist
      if (!document.querySelector('#pulse-keyframes')) {
        const style = document.createElement('style');
        style.id = 'pulse-keyframes';
        style.textContent = `
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(${scale});
            }
            100% {
              transform: scale(1);
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      // Return function to stop the animation
      const stopPulse = () => {
        element.style.animation = '';
        this.activeAnimations.delete(animationId);
        resolve();
      };
      
      this.activeAnimations.set(animationId, stopPulse);
      
      return stopPulse;
    });
  }

  /**
   * Shake animation
   */
  static shake(element, intensity = 10, duration = 600) {
    return new Promise(resolve => {
      const animationId = `shake-${Date.now()}-${Math.random()}`;
      
      element.style.animation = `shake ${duration}ms ease-in-out`;
      
      // Create keyframes if they don't exist
      if (!document.querySelector('#shake-keyframes')) {
        const style = document.createElement('style');
        style.id = 'shake-keyframes';
        style.textContent = `
          @keyframes shake {
            0%, 100% {
              transform: translate3d(0, 0, 0);
            }
            10%, 30%, 50%, 70%, 90% {
              transform: translate3d(-${intensity}px, 0, 0);
            }
            20%, 40%, 60%, 80% {
              transform: translate3d(${intensity}px, 0, 0);
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      const timeoutId = setTimeout(() => {
        element.style.animation = '';
        this.activeAnimations.delete(animationId);
        resolve();
      }, duration);
      
      this.activeAnimations.set(animationId, timeoutId);
    });
  }

  /**
   * Stagger animation for multiple elements
   */
  static staggerAnimation(elements, animationFn, delay = 100) {
    const promises = [];
    
    elements.forEach((element, index) => {
      const promise = new Promise(resolve => {
        setTimeout(() => {
          animationFn(element).then(resolve);
        }, index * delay);
      });
      promises.push(promise);
    });
    
    return Promise.all(promises);
  }

  /**
   * Animate on scroll
   */
  static animateOnScroll(elements, animationFn, options = {}) {
    const observer = this.createScrollObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animationFn(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, options);
    
    elements.forEach(element => observer.observe(element));
    
    return observer;
  }

  /**
   * Create loading spinner animation
   */
  static createLoadingSpinner(container, size = 'medium') {
    const sizeClasses = {
      small: 'spinner-border-sm',
      medium: '',
      large: 'spinner-border-lg'
    };
    
    const spinner = DOMUtils.createElement('div', {
      className: `spinner-border ${sizeClasses[size]} text-primary`,
      role: 'status',
      innerHTML: '<span class="sr-only">Loading...</span>'
    });
    
    container.appendChild(spinner);
    
    return {
      element: spinner,
      remove: () => spinner.remove()
    };
  }

  /**
   * Create ripple effect
   */
  static createRipple(element, event) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = DOMUtils.createElement('div', {
      className: 'ripple-effect',
      style: `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 600ms linear;
        pointer-events: none;
      `
    });
    
    // Create keyframes if they don't exist
    if (!document.querySelector('#ripple-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Cancel animation by ID
   */
  static cancelAnimation(animationId) {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      if (typeof animation === 'number') {
        cancelAnimationFrame(animation);
      } else if (typeof animation === 'function') {
        animation();
      } else {
        clearTimeout(animation);
      }
      this.activeAnimations.delete(animationId);
    }
  }

  /**
   * Cancel all active animations
   */
  static cancelAllAnimations() {
    this.activeAnimations.forEach((animation, id) => {
      this.cancelAnimation(id);
    });
  }

  /**
   * Get easing functions
   */
  static easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
  };

  /**
   * Custom animation with easing
   */
  static animate(element, properties, duration = CONFIG.ANIMATION.DURATION, easingFn = this.easing.easeInOutQuad) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const startValues = {};
      
      // Get initial values
      Object.keys(properties).forEach(prop => {
        const computedStyle = window.getComputedStyle(element);
        startValues[prop] = parseFloat(computedStyle[prop]) || 0;
      });
      
      const animationId = `custom-${Date.now()}-${Math.random()}`;
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);
        
        Object.entries(properties).forEach(([prop, endValue]) => {
          const startValue = startValues[prop];
          const currentValue = startValue + (endValue - startValue) * easedProgress;
          element.style[prop] = `${currentValue}px`;
        });
        
        if (progress < 1) {
          const frameId = requestAnimationFrame(animate);
          this.activeAnimations.set(animationId, frameId);
        } else {
          this.activeAnimations.delete(animationId);
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
}

// Default export
export default AnimationUtils;
