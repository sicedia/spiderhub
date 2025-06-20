// Global utilities and reusable functions
export const Utils = {
  // Animation and interaction constants
  ANIMATION_DURATION: 2000,
  RESIZE_DEBOUNCE_DELAY: 250,
  CAROUSEL_CARDS_PER_VIEW: {
    mobile: 1,
    tablet: 2,
    desktop: 3
  },
  BREAKPOINTS: {
    mobile: 768,
    tablet: 992
  },

  // Optimized intersection observer for animations
  createIntersectionObserver(callback, options = {}) {
    const defaultOptions = { threshold: 0.5, ...options };
    return new IntersectionObserver(callback, defaultOptions);
  },

  // Debounced resize handler
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Animate counter with modern syntax
  animateCounter(target, duration = 2000) {
    const targetValue = parseInt(target.getAttribute('data-target'));
    const suffix = target.getAttribute('data-suffix') || '';
    const increment = targetValue / (duration / 16);
    let count = 0;
    
    const updateCounter = () => {
      count = Math.min(count + increment, targetValue);
      target.textContent = Math.floor(count) + suffix;
      
      if (count < targetValue) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    updateCounter();
  },

  // Get responsive cards per view for carousel
  getCardsPerView() {
    const width = window.innerWidth;
    if (width < this.BREAKPOINTS.mobile) return this.CAROUSEL_CARDS_PER_VIEW.mobile;
    if (width < this.BREAKPOINTS.tablet) return this.CAROUSEL_CARDS_PER_VIEW.tablet;
    return this.CAROUSEL_CARDS_PER_VIEW.desktop;
  },

  // Mobile navigation handler - shared across pages
  initializeMobileNavigation(toggleSelector = '.mobile-menu-toggle', overlaySelector = '.mobile-nav-overlay') {
    const toggleButton = document.querySelector(toggleSelector);
    const overlay = document.querySelector(overlaySelector);
    
    if (!toggleButton || !overlay) return;
    
    let isMenuOpen = false;
    
    // Improved event handling for mobile
    const toggleMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      isMenuOpen = !isMenuOpen;
      toggleButton.classList.toggle('active', isMenuOpen);
      overlay.classList.toggle('active', isMenuOpen);
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    };
    
    // Use both click and touchstart for better mobile support
    toggleButton.addEventListener('click', toggleMenu);
    toggleButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      toggleMenu(e);
    }, { passive: false });
    
    // Close menu when clicking on a link
    const mobileNavLinks = overlay.querySelectorAll('.mobile-nav-links a');
    mobileNavLinks.forEach(link => {
      const closeMenu = () => {
        isMenuOpen = false;
        toggleButton.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      };
      
      link.addEventListener('click', closeMenu);
      link.addEventListener('touchstart', closeMenu, { passive: true });
    });
    
    // Close menu when clicking outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        isMenuOpen = false;
        toggleButton.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    
    // Close menu on window resize if it becomes too wide
    window.addEventListener('resize', () => {
      if (window.innerWidth > 992 && isMenuOpen) {
        isMenuOpen = false;
        toggleButton.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Initialize shared mobile navigation using utility
  Utils.initializeMobileNavigation();
});

// Modular stat counter initialization
function initializeStatCounters(statNumbers) {
  const observer = Utils.createIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        Utils.animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  });
  
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
  
  // Debounced resize handler
  const handleResize = Utils.debounce(() => {
    setupCanvas();
    nodes.forEach(node => {
      node.x = Math.min(node.x, canvas.width - 20);
      node.y = Math.min(node.y, canvas.height - 20);
    });
  }, 250);
  
  window.addEventListener('resize', handleResize);
  animate();
}

// Modern carousel implementation
function initializeCarousel() {
  const track = document.querySelector('.carousel-track');
  if (!track) return;
  
  const config = {
    cards: track.querySelectorAll('.document-card'),
    prevButton: document.querySelector('.carousel-prev'),
    nextButton: document.querySelector('.carousel-next'),
    indicatorsContainer: document.querySelector('.carousel-indicators'),
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
  
  // Resize handler
  window.addEventListener('resize', Utils.debounce(() => {
    if (config.cards[0]) {
      cardWidth = config.cards[0].offsetWidth + 20;
      carouselControls.updateState();
    }
  }, 250));
  
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

function getCardsPerView() {
  return Utils.getCardsPerView();
}

function createCarouselIndicators(config, maxIndex) {
  if (!config.indicatorsContainer) return;
  
  config.cards.forEach((_, index) => {
    if (index <= maxIndex) {
      const indicator = document.createElement('button');
      indicator.classList.add('carousel-indicator');
      indicator.setAttribute('aria-label', `Slide ${index + 1}`);
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
    indicator.classList.toggle('active', index === config.currentIndex);
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