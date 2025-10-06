/**
 * Home Page Entry Point - Updated Modular Version
 * Uses @js/ alias for clean imports and proper separation of concerns
 */

import { HomePageManager } from './pages/HomePageManager.js';
import { DOMUtils } from './core/utils/dom.js';
import { AnimationUtils } from './core/utils/animations.js';
import { CONFIG } from './core/constants/config.js';

// Initialize home page when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Initializing Home Page with new modular architecture...');
    
    // Initialize the home page manager
    const pageManager = new HomePageManager(document.body, {
      autoInitialize: true,
      enableStatCounters: true,
      enableNodeWebAnimation: true,
      enableCarousel: true
    });
    
    // Make it globally available for debugging and backward compatibility
    window.homePageManager = pageManager;
    
    console.log('✅ Home page initialized successfully');
    
    // Emit a custom event to notify other scripts
    document.dispatchEvent(new CustomEvent('homePageReady', {
      detail: { pageManager }
    }));
    
  } catch (error) {
    console.error('❌ Failed to initialize home page:', error);
    
    // Fallback to basic initialization
    initializeBasicHomePage();
  }
});

/**
 * Basic fallback initialization if the modular system fails
 */
function initializeBasicHomePage() {
  console.log('Initializing basic home page functionality...');
  
  try {
    // Initialize all home page components
    const components = {
      statNumbers: document.querySelectorAll('.stat-number, .card-number[data-target]'),
      nodeWeb: document.getElementById('node-web'),
      carouselTrack: document.querySelector('.carousel-track')
    };

    // Initialize stat counters if present
    if (components.statNumbers.length > 0) {
      initializeStatCounters(components.statNumbers);
      console.log(`✅ Initialized ${components.statNumbers.length} stat counters`);
    }
    
    // Initialize node web animation if present
    if (components.nodeWeb) {
      createNodeWebAnimation(components.nodeWeb);
      console.log('✅ Node web animation initialized');
    }
    
    // Initialize carousel if present
    if (components.carouselTrack) {
      initializeCarousel();
      console.log('✅ Carousel initialized');
    }

    console.log('✅ Basic home page functionality initialized');
    
  } catch (error) {
    console.error('❌ Error in basic home page initialization:', error);
  }
}

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
      cardsPerView = getCardsPerView();
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
  const cardsPerView = getCardsPerView();
  const maxIndex = Math.max(0, cards.length - cardsPerView);
  return { cardWidth, cardsPerView, maxIndex };
}

function getCardsPerView() {
  const width = window.innerWidth;
  if (width < CONFIG.BREAKPOINTS.MOBILE) return CONFIG.CAROUSEL.CARDS_PER_VIEW.mobile;
  if (width < CONFIG.BREAKPOINTS.TABLET) return CONFIG.CAROUSEL.CARDS_PER_VIEW.tablet;
  return CONFIG.CAROUSEL.CARDS_PER_VIEW.desktop;
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

// Legacy compatibility exports
export { 
  initializeBasicHomePage,
  initializeStatCounters,
  createNodeWebAnimation,
  initializeCarousel
};
