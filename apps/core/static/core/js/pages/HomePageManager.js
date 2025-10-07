/**
 * Home Page Manager
 * Orchestrates all components on the home page
 * Uses @js/ alias for clean imports
 */

import { BasePageManager } from '../core/base/BasePageManager.js';
import { CONFIG } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';
import { AnimationUtils } from '../core/utils/animations.js';
import { EventUtils } from '../core/utils/events.js';

export class HomePageManager extends BasePageManager {
  constructor(element = document.body, options = {}) {
    super(element, options);
    
    this.heroAnimationObserver = null;
    this.statsAnimationObserver = null;
    this.featuresAnimationObserver = null;
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
      carouselInterval: 5000
    };
  }

  /**
   * Initialize services
   */
  async initializeServices() {
    // Home page doesn't need complex services
    this.logger.debug('Services initialized');
  }

  /**
   * Load page data
   */
  async loadPageData() {
    try {
      // Load any dynamic data for the home page
      this.pageData = {
        stats: await this.loadStats(),
        featuredDocuments: await this.loadFeaturedDocuments(),
        recentUpdates: await this.loadRecentUpdates()
      };
    } catch (error) {
      this.logger.warn('Failed to load some page data', error);
      // Set fallback data
      this.pageData = {
        stats: this.getFallbackStats(),
        featuredDocuments: [],
        recentUpdates: []
      };
    }
  }

  /**
   * Initialize components
   */
  async initializeComponents() {
    // Initialize hero section
    if (this.options.enableHeroAnimation) {
      this.initializeHeroSection();
    }

    // Initialize statistics section
    if (this.options.enableStatsAnimation) {
      this.initializeStatsSection();
    }

    // Initialize features section
    if (this.options.enableFeaturesAnimation) {
      this.initializeFeaturesSection();
    }

    // Initialize node web animation
    if (this.options.enableNodeWebAnimation) {
      this.initializeNodeWebAnimation();
    }

    // Initialize carousel
    if (this.options.enableCarousel) {
      this.initializeCarousel();
    }

    // Initialize call-to-action buttons
    this.initializeCTAButtons();
  }

  /**
   * Initialize hero section
   */
  initializeHeroSection() {
    const heroSection = DOMUtils.getElement('.hero-section');
    if (!heroSection) return;

    // Animate hero elements on scroll
    const heroElements = heroSection.querySelectorAll('.hero-title, .hero-subtitle, .hero-cta');
    
    this.heroAnimationObserver = AnimationUtils.createScrollObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const delay = Array.from(heroElements).indexOf(element) * 200;
          
          setTimeout(() => {
            AnimationUtils.fadeIn(element);
          }, delay);
          
          this.heroAnimationObserver.unobserve(element);
        }
      });
    });

    heroElements.forEach(element => {
      element.style.opacity = '0';
      this.heroAnimationObserver.observe(element);
    });
  }

  /**
   * Initialize statistics section
   */
  initializeStatsSection() {
    const statsSection = DOMUtils.getElement('.stats-section');
    if (!statsSection) return;

    const statNumbers = statsSection.querySelectorAll('.stat-number');
    
    this.statsAnimationObserver = AnimationUtils.createScrollObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const statNumber = entry.target;
          const targetValue = parseInt(statNumber.getAttribute('data-target') || statNumber.textContent);
          const suffix = statNumber.getAttribute('data-suffix') || '';
          
          AnimationUtils.animateCounter(statNumber, targetValue, CONFIG.ANIMATION.DURATION, suffix);
          this.statsAnimationObserver.unobserve(statNumber);
        }
      });
    });

    statNumbers.forEach(statNumber => {
      this.statsAnimationObserver.observe(statNumber);
    });
  }

  /**
   * Initialize features section
   */
  initializeFeaturesSection() {
    const featuresSection = DOMUtils.getElement('.features-section');
    if (!featuresSection) return;

    const featureCards = featuresSection.querySelectorAll('.feature-card');
    
    this.featuresAnimationObserver = AnimationUtils.createScrollObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cards = Array.from(featureCards);
          AnimationUtils.staggerAnimation(cards, (card) => {
            return AnimationUtils.fadeIn(card);
          }, 150);
          
          // Unobserve all cards after animation starts
          featureCards.forEach(card => this.featuresAnimationObserver.unobserve(card));
        }
      });
    });

    // Observe the first card to trigger stagger animation
    if (featureCards.length > 0) {
      featureCards.forEach(card => {
        card.style.opacity = '0';
      });
      this.featuresAnimationObserver.observe(featureCards[0]);
    }
  }

  /**
   * Initialize node web animation
   */
  initializeNodeWebAnimation() {
    const nodeWebContainer = DOMUtils.getElement('.node-web-container');
    if (!nodeWebContainer) return;

    this.createNodeWebAnimation(nodeWebContainer);
  }

  /**
   * Create node web animation
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
      
      requestAnimationFrame(animate);
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
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }

  /**
   * Initialize carousel
   */
  initializeCarousel() {
    const carousel = DOMUtils.getElement('.featured-carousel');
    if (!carousel) return;

    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const indicators = carousel.querySelector('.carousel-indicators');

    if (!track || slides.length === 0) return;

    let currentSlide = 0;
    let autoPlayInterval = null;

    // Create indicators
    if (indicators) {
      slides.forEach((_, index) => {
        const indicator = DOMUtils.createElement('button', {
          className: `carousel-indicator ${index === 0 ? 'active' : ''}`,
          'data-slide': index,
          'aria-label': `Go to slide ${index + 1}`
        });
        indicators.appendChild(indicator);
      });
    }

    // Update carousel
    const updateCarousel = () => {
      const slideWidth = slides[0].offsetWidth;
      track.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
      
      // Update indicators
      const indicatorButtons = indicators?.querySelectorAll('.carousel-indicator');
      indicatorButtons?.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
      });
      
      // Update navigation buttons
      if (prevBtn) prevBtn.disabled = currentSlide === 0;
      if (nextBtn) nextBtn.disabled = currentSlide === slides.length - 1;
    };

    // Navigation functions
    const goToSlide = (index) => {
      currentSlide = Math.max(0, Math.min(slides.length - 1, index));
      updateCarousel();
      restartAutoPlay();
    };

    const nextSlide = () => {
      goToSlide(currentSlide + 1);
    };

    const prevSlide = () => {
      goToSlide(currentSlide - 1);
    };

    // Auto play
    const startAutoPlay = () => {
      if (!this.options.autoPlayCarousel) return;
      
      autoPlayInterval = setInterval(() => {
        if (currentSlide >= slides.length - 1) {
          goToSlide(0);
        } else {
          nextSlide();
        }
      }, this.options.carouselInterval);
    };

    const stopAutoPlay = () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    };

    const restartAutoPlay = () => {
      stopAutoPlay();
      startAutoPlay();
    };

    // Event listeners
    if (prevBtn) {
      this.addEventListener(prevBtn, 'click', prevSlide);
    }

    if (nextBtn) {
      this.addEventListener(nextBtn, 'click', nextSlide);
    }

    // Indicator clicks
    if (indicators) {
      this.addEventListener(indicators, 'click', (event) => {
        const indicator = event.target.closest('.carousel-indicator');
        if (indicator) {
          const slideIndex = parseInt(indicator.getAttribute('data-slide'));
          goToSlide(slideIndex);
        }
      });
    }

    // Pause auto play on hover
    this.addEventListener(carousel, 'mouseenter', stopAutoPlay);
    this.addEventListener(carousel, 'mouseleave', startAutoPlay);

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;

    this.addEventListener(track, 'touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.addEventListener(track, 'touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeThreshold = 50;
      const swipeDistance = touchStartX - touchEndX;

      if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }, { passive: true });

    // Initialize
    updateCarousel();
    startAutoPlay();

    // Store cleanup function
    this.carouselCleanup = () => {
      stopAutoPlay();
    };
  }

  /**
   * Initialize call-to-action buttons
   */
  initializeCTAButtons() {
    const ctaButtons = DOMUtils.getElements('.cta-button');
    
    ctaButtons.forEach(button => {
      // Add ripple effect on click
      this.addEventListener(button, 'click', (event) => {
        AnimationUtils.createRipple(button, event);
      });

      // Add hover animation
      this.addEventListener(button, 'mouseenter', () => {
        AnimationUtils.scale(button, 1, 1.05, 200);
      });

      this.addEventListener(button, 'mouseleave', () => {
        AnimationUtils.scale(button, 1.05, 1, 200);
      });
    });
  }

  /**
   * Load statistics data
   */
  async loadStats() {
    try {
      // In a real application, this would fetch from an API
      // For now, return mock data
      return {
        totalDocuments: 1247,
        countries: 89,
        themes: 15,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to load stats', error);
      return this.getFallbackStats();
    }
  }

  /**
   * Load featured documents
   */
  async loadFeaturedDocuments() {
    try {
      // Mock featured documents
      return [
        {
          id: 1,
          title: "Digital Cooperation Framework 2024",
          country: "Global",
          type: "Framework",
          date: "2024-01-15"
        },
        {
          id: 2,
          title: "AI Ethics Guidelines",
          country: "European Union",
          type: "Guidelines",
          date: "2024-02-20"
        },
        {
          id: 3,
          title: "Cybersecurity Cooperation Agreement",
          country: "United States",
          type: "Agreement",
          date: "2024-03-10"
        }
      ];
    } catch (error) {
      this.logger.error('Failed to load featured documents', error);
      return [];
    }
  }

  /**
   * Load recent updates
   */
  async loadRecentUpdates() {
    try {
      // Mock recent updates
      return [
        {
          type: "document_added",
          title: "New policy document added",
          date: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          type: "analysis_updated",
          title: "Analysis dashboard updated",
          date: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        }
      ];
    } catch (error) {
      this.logger.error('Failed to load recent updates', error);
      return [];
    }
  }

  /**
   * Get fallback statistics
   */
  getFallbackStats() {
    return {
      totalDocuments: 1000,
      countries: 80,
      themes: 12,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Bind page-specific events
   */
  bindPageEvents() {
    // Search form submission
    const searchForm = DOMUtils.getElement('.hero-search-form');
    if (searchForm) {
      this.addEventListener(searchForm, 'submit', (event) => {
        event.preventDefault();
        const searchInput = searchForm.querySelector('input[type="search"]');
        if (searchInput && searchInput.value.trim()) {
          // Redirect to explore page with search query
          window.location.href = `/explore?search=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
    }

    // Quick action buttons
    const quickActionButtons = DOMUtils.getElements('.quick-action-btn');
    quickActionButtons.forEach(button => {
      this.addEventListener(button, 'click', (event) => {
        const action = button.getAttribute('data-action');
        this.handleQuickAction(action, event);
      });
    });
  }

  /**
   * Handle quick action button clicks
   */
  handleQuickAction(action, event) {
    switch (action) {
      case 'explore':
        window.location.href = '/explore';
        break;
      case 'analysis':
        window.location.href = '/analysis';
        break;
      case 'about':
        window.location.href = '/about';
        break;
      default:
        this.logger.warn('Unknown quick action', { action });
    }
  }

  /**
   * Cleanup page manager
   */
  destroy() {
    // Stop animations and intervals
    if (this.carouselCleanup) {
      this.carouselCleanup();
    }

    if (this.nodeWebCleanup) {
      this.nodeWebCleanup();
    }

    // Disconnect observers
    if (this.heroAnimationObserver) {
      this.heroAnimationObserver.disconnect();
    }

    if (this.statsAnimationObserver) {
      this.statsAnimationObserver.disconnect();
    }

    if (this.featuresAnimationObserver) {
      this.featuresAnimationObserver.disconnect();
    }

    super.destroy();
  }
}

// Default export
export default HomePageManager;
