// Home page specific functionality
import { Utils } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all home page components
  const components = {
    statNumbers: document.querySelectorAll('.stat-number'),
    nodeWeb: document.getElementById('node-web'),
    carouselTrack: document.querySelector('.carousel-track')
  };

  // Initialize stat counters if present
  if (components.statNumbers.length > 0) {
    initializeStatCounters(components.statNumbers);
  }
  
  // Initialize node web animation if present
  if (components.nodeWeb) {
    createNodeWebAnimation(components.nodeWeb);
  }
  
  // Initialize carousel if present
  if (components.carouselTrack) {
    initializeCarousel();
  }
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
