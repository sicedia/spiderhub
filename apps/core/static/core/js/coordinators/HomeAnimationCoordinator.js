/**
 * HomeAnimationCoordinator
 * Coordinates all animations on the home page
 */

import { logger } from '../core/logger/Logger.js';
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { AnimationUtils } from '../core/utils/animations.js';
import { EventUtils } from '../core/utils/events.js';
import { CONFIG } from '../core/constants/config.js';

export class HomeAnimationCoordinator {
  constructor(options = {}) {
    this.logger = logger.child({
      component: 'HomeAnimationCoordinator'
    });
    
    this.options = {
      enableHeroAnimation: true,
      enableStatsAnimation: true,
      enableFeaturesAnimation: true,
      enableNodeWebAnimation: true,
      ...options
    };
    
    this.observers = {
      hero: null,
      stats: null,
      features: null
    };
    
    this.nodeWebCleanup = null;
    
    this.logger.debug('HomeAnimationCoordinator initialized');
  }

  /**
   * Initialize the coordinator
   */
  async init() {
    this.logger.debug('Initializing HomeAnimationCoordinator');
    
    if (this.options.enableHeroAnimation) {
      this.initializeHeroSection();
    }
    
    if (this.options.enableStatsAnimation) {
      this.initializeStatsSection();
    }
    
    if (this.options.enableFeaturesAnimation) {
      this.initializeFeaturesSection();
    }
    
    if (this.options.enableNodeWebAnimation) {
      this.initializeNodeWebAnimation();
    }
    
    this.logger.info('HomeAnimationCoordinator initialized successfully');
  }

  /**
   * Initialize hero section animations
   */
  initializeHeroSection() {
    const heroSection = DOMUtils.getElement('.home-hero');
    if (!heroSection) {
      this.logger.debug('Hero section not found');
      return;
    }

    const heroElements = heroSection.querySelectorAll('.home-hero__title, .home-hero__description, .home-hero__actions');
    if (heroElements.length === 0) {
      this.logger.debug('No hero elements found');
      return;
    }
    
    this.observers.hero = AnimationUtils.createScrollObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const delay = Array.from(heroElements).indexOf(element) * 200;
          
          setTimeout(() => {
            AnimationUtils.fadeIn(element);
          }, delay);
          
          this.observers.hero.unobserve(element);
        }
      });
    });

    heroElements.forEach(element => {
      element.style.opacity = '0';
      this.observers.hero.observe(element);
    });
    
    this.logger.debug('Hero section animations initialized', {
      elementsCount: heroElements.length
    });
  }

  /**
   * Initialize statistics section animations
   */
  initializeStatsSection() {
    const statsSection = DOMUtils.getElement('.home-stats');
    if (!statsSection) {
      this.logger.debug('Stats section not found');
      return;
    }

    const statNumbers = statsSection.querySelectorAll('.home-stats__number');
    if (statNumbers.length === 0) {
      this.logger.debug('No stat numbers found');
      return;
    }
    
    this.observers.stats = AnimationUtils.createScrollObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const statNumber = entry.target;
          const targetValue = parseInt(statNumber.getAttribute('data-target') || statNumber.textContent);
          const suffix = statNumber.getAttribute('data-suffix') || '';
          
          AnimationUtils.animateCounter(statNumber, targetValue, CONFIG.ANIMATION.DURATION, suffix);
          this.observers.stats.unobserve(statNumber);
        }
      });
    });

    statNumbers.forEach(statNumber => {
      this.observers.stats.observe(statNumber);
    });
    
    this.logger.debug('Statistics animations initialized', {
      statsCount: statNumbers.length
    });
  }

  /**
   * Initialize features section animations
   */
  initializeFeaturesSection() {
    // NOTE: Features section doesn't exist in current home.html template
    // Keeping this for future use when features section is added
    const featuresSection = DOMUtils.getElement('.home-features');
    if (!featuresSection) {
      this.logger.debug('Features section not found (not in current template)');
      return;
    }

    const featureCards = featuresSection.querySelectorAll('.home-features__card');
    if (featureCards.length === 0) {
      this.logger.debug('No feature cards found');
      return;
    }
    
    this.observers.features = AnimationUtils.createScrollObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cards = Array.from(featureCards);
          AnimationUtils.staggerAnimation(cards, (card) => {
            return AnimationUtils.fadeIn(card);
          }, 150);
          
          // Unobserve all cards after animation starts
          featureCards.forEach(card => this.observers.features.unobserve(card));
        }
      });
    });

    // Observe the first card to trigger stagger animation
    featureCards.forEach(card => {
      card.style.opacity = '0';
    });
    this.observers.features.observe(featureCards[0]);
    
    this.logger.debug('Features animations initialized', {
      cardsCount: featureCards.length
    });
  }

  /**
   * Initialize node web animation
   */
  initializeNodeWebAnimation() {
    const nodeWebContainer = DOMUtils.getElement('#node-web');
    if (!nodeWebContainer) {
      this.logger.debug('Node web container not found');
      return;
    }

    this.createNodeWebAnimation(nodeWebContainer);
    this.logger.debug('Node web animation initialized');
  }

  /**
   * Create node web canvas animation
   */
  createNodeWebAnimation(container) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Canvas setup
    const setupCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '1';
    };
    
    setupCanvas();
    container.appendChild(canvas);
    
    // Create nodes
    const nodeCount = Math.min(25, Math.floor((canvas.width * canvas.height) / 10000));
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() * 0.4 - 0.2) * 0.3,
      vy: (Math.random() * 0.4 - 0.2) * 0.3,
      opacity: Math.random() * 0.5 + 0.3
    }));
    
    // Animation loop
    let animationFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const opacity = (100 - distance) / 100 * 0.2;
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      
      // Update and draw nodes
      nodes.forEach(node => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        
        // Keep within bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
        
        // Draw node
        ctx.fillStyle = `rgba(59, 130, 246, ${node.opacity})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle resize
    const resizeHandler = EventUtils.debounce(() => {
      setupCanvas();
      nodes.forEach(node => {
        node.x = Math.min(node.x, canvas.width);
        node.y = Math.min(node.y, canvas.height);
      });
    }, 250);
    
    window.addEventListener('resize', resizeHandler);
    
    // Store cleanup function
    this.nodeWebCleanup = () => {
      window.removeEventListener('resize', resizeHandler);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.logger.debug('Destroying HomeAnimationCoordinator');
    
    // Disconnect all observers
    Object.values(this.observers).forEach(observer => {
      if (observer) {
        observer.disconnect();
      }
    });
    
    // Cleanup node web animation
    if (this.nodeWebCleanup) {
      this.nodeWebCleanup();
    }
    
    this.logger.debug('HomeAnimationCoordinator destroyed');
  }
}

export default HomeAnimationCoordinator;

