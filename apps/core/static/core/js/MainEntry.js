/**
 * Main Application Entry Point
 * Initializes global utilities and shared functionality
 * Clean modular structure with standardized imports
 */

import { DOMUtils } from './core/utils/dom.js';
import { AnimationUtils } from './core/utils/animations.js';
import { CONFIG } from './core/constants/config.js';
import { MobileNav } from './components/navigation/MobileNav.js';

// Global utilities object for backward compatibility
export const Utils = {
  // Animation and interaction constants (now imported from CONFIG)
  ANIMATION_DURATION: CONFIG.ANIMATION.DURATION,
  RESIZE_DEBOUNCE_DELAY: CONFIG.ANIMATION.DEBOUNCE_DELAY,
  CAROUSEL_CARDS_PER_VIEW: CONFIG.CAROUSEL.CARDS_PER_VIEW,
  BREAKPOINTS: CONFIG.BREAKPOINTS,

  // Delegate to DOMUtils for intersection observer
  createIntersectionObserver(callback, options = {}) {
    return DOMUtils.createIntersectionObserver(callback, options);
  },

  // Delegate to DOMUtils for debounce
  debounce(func, wait) {
    return DOMUtils.debounce(func, wait);
  },

  // Delegate to AnimationUtils for counter animation
  animateCounter(target, duration = CONFIG.ANIMATION.DURATION) {
    return AnimationUtils.animateCounter(target, duration);
  },

  // Get responsive cards per view for carousel
  getCardsPerView() {
    const width = window.innerWidth;
    if (width < CONFIG.BREAKPOINTS.MOBILE) return CONFIG.CAROUSEL.CARDS_PER_VIEW.mobile;
    if (width < CONFIG.BREAKPOINTS.TABLET) return CONFIG.CAROUSEL.CARDS_PER_VIEW.tablet;
    return CONFIG.CAROUSEL.CARDS_PER_VIEW.desktop;
  },

  // Mobile navigation handler - now uses the MobileNav component
  initializeMobileNavigation() {
    const overlay = DOMUtils.getElement('.navigation__overlay');
    if (overlay) {
      const mobileNav = new MobileNav(overlay);
      mobileNav.init();
      return mobileNav;
    }
    return null;
  }
};

// Initialize shared functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Initializing main application utilities...');
    
    // Initialize shared mobile navigation using the new component
    const mobileNav = Utils.initializeMobileNavigation();
    if (mobileNav) {
      console.log('✅ Mobile navigation initialized');
    }

    // Initialize stat counters if present
    const statNumbers = document.querySelectorAll('.card-number[data-target]');
    if (statNumbers.length > 0) {
      initializeStatCounters(statNumbers);
      console.log(`✅ Initialized ${statNumbers.length} stat counters`);
    }

    // Initialize node web animation if container exists
    const nodeWebContainer = document.querySelector('.node-web-animation');
    if (nodeWebContainer) {
      createNodeWebAnimation(nodeWebContainer);
      console.log('✅ Node web animation initialized');
    }

    // Initialize carousel if present
    const carouselTrack = document.querySelector('.carousel-track');
    if (carouselTrack) {
      initializeCarousel();
      console.log('✅ Carousel initialized');
    }

    console.log('✅ Main application utilities initialized successfully');

  } catch (error) {
    console.error('❌ Error initializing main application utilities:', error);
  }
});

// Modular stat counter initialization using new utilities
function initializeStatCounters(statNumbers) {
  const observer = DOMUtils.createIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        AnimationUtils.animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  statNumbers.forEach(stat => observer.observe(stat));
}

// Optimized node web animation with better performance
function createNodeWebAnimation(container) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Canvas setup with performance optimization
  const setupCanvas = () => {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  };
  
  setupCanvas();
  container.appendChild(canvas);
  
  // Create optimized node system
  const nodeCount = Math.min(30, Math.floor((canvas.width * canvas.height) / 8000));
  const nodes = Array.from({ length: nodeCount }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 1.5,
    vx: (Math.random() * 0.4 - 0.2) * 0.5,
    vy: (Math.random() * 0.4 - 0.2) * 0.5
  }));
  
  // Generate connections efficiently
  const connections = [];
  const maxDistance = 120;
  
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < maxDistance && Math.random() > 0.85) {
        connections.push({ from: i, to: j });
      }
    }
  }
  
  // Animation loop with performance optimizations
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections in batch
    ctx.strokeStyle = 'rgba(9, 78, 178, 0.15)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    
    connections.forEach(({ from, to }) => {
      const fromNode = nodes[from];
      const toNode = nodes[to];
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
    });
    
    ctx.stroke();
    
    // Update and draw nodes
    ctx.fillStyle = 'rgba(9, 78, 178, 0.6)';
    
    nodes.forEach(node => {
      // Update position with boundary checking
      node.x += node.vx;
      node.y += node.vy;
      
      const padding = 20;
      if (node.x < padding || node.x > canvas.width - padding) {
        node.vx *= -1;
        node.x = Math.max(padding, Math.min(canvas.width - padding, node.x));
      }
      if (node.y < padding || node.y > canvas.height - padding) {
        node.vy *= -1;
        node.y = Math.max(padding, Math.min(canvas.height - padding, node.y));
      }
      
      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  // Debounced resize handler using new utilities
  const handleResize = DOMUtils.debounce(() => {
    setupCanvas();
    nodes.forEach(node => {
      node.x = Math.min(node.x, canvas.width - 20);
      node.y = Math.min(node.y, canvas.height - 20);
    });
  }, CONFIG.ANIMATION.DEBOUNCE_DELAY);
  
  window.addEventListener('resize', handleResize);
  animate();
}

// Modern carousel implementation using new utilities
function initializeCarousel() {
  const track = DOMUtils.getElement('.carousel-track');
  if (!track) return;
  
  const config = {
    cards: track.querySelectorAll('.document-card'),
    prevButton: DOMUtils.getElement('.carousel-prev'),
    nextButton: DOMUtils.getElement('.carousel-next'),
    indicatorsContainer: DOMUtils.getElement('.carousel-indicators'),
    currentIndex: 0
  };
  
  if (!config.cards || config.cards.length === 0) return;
  
  let { cardWidth, cardsPerView, maxIndex } = calculateCarouselDimensions(config.cards);
  
  // Create indicators
  createCarouselIndicators(config, maxIndex);
  
  // Carousel control functions
  const carouselControls = {
    updateState() {
      cardsPerView = Utils.getCardsPerView();
      maxIndex = Math.max(0, config.cards.length - cardsPerView);
      config.currentIndex = Math.min(config.currentIndex, maxIndex);
      
      cardWidth = config.cards[0] ? config.cards[0].offsetWidth + 20 : 0;
      track.style.transform = `translateX(-${config.currentIndex * cardWidth}px)`;
      
      if (config.prevButton) config.prevButton.disabled = config.currentIndex === 0;
      if (config.nextButton) config.nextButton.disabled = config.currentIndex >= maxIndex;
      
      updateIndicators(config);
    },
    
    goToSlide(index) {
      config.currentIndex = Math.min(Math.max(0, index), maxIndex);
      this.updateState();
    },
    
    goToPrev() {
      this.goToSlide(config.currentIndex - 1);
    },
    
    goToNext() {
      this.goToSlide(config.currentIndex + 1);
    }
  };
  
  // Event listeners
  if (config.prevButton) {
    config.prevButton.addEventListener('click', () => carouselControls.goToPrev());
  }
  if (config.nextButton) {
    config.nextButton.addEventListener('click', () => carouselControls.goToNext());
  }
  
  // Touch events for mobile
  addTouchSupport(track, carouselControls);
  
  // Resize handler using new utilities
  window.addEventListener('resize', DOMUtils.debounce(() => {
    if (config.cards[0]) {
      cardWidth = config.cards[0].offsetWidth + 20;
      carouselControls.updateState();
    }
  }, CONFIG.ANIMATION.DEBOUNCE_DELAY));
  
  // Initialize
  carouselControls.updateState();
}

// Helper functions for carousel
function calculateCarouselDimensions(cards) {
  if (!cards || cards.length === 0) {
    return { cardWidth: 0, cardsPerView: 1, maxIndex: 0 };
  }
  const cardWidth = cards[0].offsetWidth;
  const cardsPerView = Utils.getCardsPerView();
  const maxIndex = Math.max(0, cards.length - cardsPerView);
  return { cardWidth, cardsPerView, maxIndex };
}

function createCarouselIndicators(config, maxIndex) {
  if (!config.indicatorsContainer) return;
  
  config.cards.forEach((_, index) => {
    if (index <= maxIndex) {
      const indicator = DOMUtils.createElement('button', {
        className: 'carousel-indicator',
        'aria-label': `Slide ${index + 1}`
      });
      
      indicator.addEventListener('click', () => {
        config.currentIndex = index;
        updateIndicators(config);
      });
      
      config.indicatorsContainer.appendChild(indicator);
    }
  });
}

function updateIndicators(config) {
  if (!config.indicatorsContainer) return;
  
  const indicators = config.indicatorsContainer.querySelectorAll('.carousel-indicator');
  indicators.forEach((indicator, index) => {
    DOMUtils.toggleClass(indicator, 'active', index === config.currentIndex);
  });
}

function addTouchSupport(track, controls) {
  let touchStartX = 0;
  let touchEndX = 0;
  
  track.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  track.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const SWIPE_THRESHOLD = 50;
    const swipeDistance = touchStartX - touchEndX;
    
    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
      if (swipeDistance > 0) {
        controls.goToNext();
      } else {
        controls.goToPrev();
      }
    }
  }
}

// Export for module systems and backward compatibility
export default Utils;
