/**
 * About Page JavaScript
 * Handles animations, interactions, and enhanced user experience
 * Following modern ES6+ practices and accessibility guidelines
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize about page components
  initializePulseAnimation();
  initializeScrollAnimations();
  initializeContactForm();
  initializeAccessibilityEnhancements();
});

// ========================================
// Pulse Animation for Connection Map
// ========================================

/**
 * Initialize pulse animation with staggered delays
 * Creates a visual connection effect for the SVG map elements
 */
function initializePulseAnimation() {
  const pulseCircles = document.querySelectorAll('.pulse-circle');
  
  if (pulseCircles.length === 0) return;
  
  pulseCircles.forEach((circle, index) => {
    // Add staggered animation delay for visual appeal
    circle.style.animationDelay = `${index * 0.5}s`;
    
    // Add hover interaction
    circle.addEventListener('mouseenter', () => {
      circle.style.animationPlayState = 'paused';
      circle.style.transform = 'scale(1.2)';
    });
    
    circle.addEventListener('mouseleave', () => {
      circle.style.animationPlayState = 'running';
      circle.style.transform = '';
    });
  });
}

// ========================================
// Scroll Animations
// ========================================

/**
 * Initialize scroll-triggered animations
 * Uses Intersection Observer for performance
 */
function initializeScrollAnimations() {
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    addFallbackAnimations();
    return;
  }

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        
        // Special handling for methodology steps
        if (entry.target.classList.contains('methodology-step')) {
          animateMethodologyStep(entry.target);
        }
        
        // Special handling for partner cards
        if (entry.target.classList.contains('partner-card')) {
          animatePartnerCard(entry.target);
        }
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animateElements = document.querySelectorAll(
    '.methodology-step, .partner-card, .about-section, .spider-content'
  );
  
  animateElements.forEach(el => observer.observe(el));
}

/**
 * Animate methodology step with staggered effect
 */
function animateMethodologyStep(step) {
  const icon = step.querySelector('.step-icon');
  const content = step.querySelector('.step-content');
  
  if (icon && content) {
    setTimeout(() => {
      icon.style.transform = 'scale(1)';
      icon.style.opacity = '1';
    }, 200);
    
    setTimeout(() => {
      content.style.transform = 'translateY(0)';
      content.style.opacity = '1';
    }, 400);
  }
}

/**
 * Animate partner card with staggered effect
 */
function animatePartnerCard(card) {
  const logo = card.querySelector('.partner-logo');
  const info = card.querySelector('.partner-info');
  
  if (logo && info) {
    setTimeout(() => {
      logo.style.transform = 'scale(1)';
      logo.style.opacity = '1';
    }, 150);
    
    setTimeout(() => {
      info.style.transform = 'translateY(0)';
      info.style.opacity = '1';
    }, 300);
  }
}

/**
 * Fallback animations for browsers without Intersection Observer
 */
function addFallbackAnimations() {
  const animateElements = document.querySelectorAll(
    '.methodology-step, .partner-card, .about-section'
  );
  
  animateElements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('animate-in');
    }, index * 100);
  });
}

// ========================================
// Contact Form Handling
// ========================================

/**
 * Initialize contact form with validation
 * Handles form submission and user feedback
 */
function initializeContactForm() {
  const contactForm = document.querySelector('.contact-form');
  if (!contactForm) return;
  
  const formFields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    message: document.getElementById('message')
  };
  
  // Form validation utilities
  const validation = {
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    validateForm(fields) {
      const errors = [];
      
      if (!fields.name?.value.trim()) {
        errors.push('Name is required');
      }
      
      if (!fields.email?.value.trim()) {
        errors.push('Email is required');
      } else if (!this.isValidEmail(fields.email.value)) {
        errors.push('Please enter a valid email address');
      }
      
      if (!fields.message?.value.trim()) {
        errors.push('Message is required');
      }
      
      return errors;
    }
  };
  
  // Form submission handler
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const errors = validation.validateForm(formFields);
    
    if (errors.length > 0) {
      showFormErrors(errors);
      return;
    }
    
    // Show success feedback
    showFormSuccess();
    contactForm.reset();
  });
  
  // Real-time validation
  Object.values(formFields).forEach(field => {
    if (field) {
      field.addEventListener('blur', () => validateField(field, validation));
      field.addEventListener('input', () => clearFieldError(field));
    }
  });
}

/**
 * Show form validation errors
 */
function showFormErrors(errors) {
  const errorContainer = document.querySelector('.form-errors') || createErrorContainer();
  
  errorContainer.innerHTML = `
    <div class="error-message">
      <h4>Please correct the following errors:</h4>
      <ul>
        ${errors.map(error => `<li>${error}</li>`).join('')}
      </ul>
    </div>
  `;
  
  errorContainer.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorContainer.style.display = 'none';
  }, 5000);
}

/**
 * Show form success message
 */
function showFormSuccess() {
  const successContainer = document.querySelector('.form-success') || createSuccessContainer();
  
  successContainer.innerHTML = `
    <div class="success-message">
      <h4>Thank you!</h4>
      <p>Your message has been sent successfully. We will respond to you shortly.</p>
    </div>
  `;
  
  successContainer.style.display = 'block';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    successContainer.style.display = 'none';
  }, 3000);
}

/**
 * Create error container if it doesn't exist
 */
function createErrorContainer() {
  const container = document.createElement('div');
  container.className = 'form-errors';
  container.style.cssText = `
    display: none;
    margin: 1rem 0;
    padding: 1rem;
    background-color: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c33;
  `;
  
  const form = document.querySelector('.contact-form');
  if (form) {
    form.insertBefore(container, form.firstChild);
  }
  
  return container;
}

/**
 * Create success container if it doesn't exist
 */
function createSuccessContainer() {
  const container = document.createElement('div');
  container.className = 'form-success';
  container.style.cssText = `
    display: none;
    margin: 1rem 0;
    padding: 1rem;
    background-color: #efe;
    border: 1px solid #cfc;
    border-radius: 4px;
    color: #363;
  `;
  
  const form = document.querySelector('.contact-form');
  if (form) {
    form.insertBefore(container, form.firstChild);
  }
  
  return container;
}

/**
 * Validate individual field
 */
function validateField(field, validation) {
  const value = field.value.trim();
  let isValid = true;
  let errorMessage = '';
  
  if (field.required && !value) {
    isValid = false;
    errorMessage = 'This field is required';
  } else if (field.type === 'email' && value && !validation.isValidEmail(value)) {
    isValid = false;
    errorMessage = 'Please enter a valid email address';
  }
  
  if (isValid) {
    clearFieldError(field);
  } else {
    showFieldError(field, errorMessage);
  }
  
  return isValid;
}

/**
 * Show field error
 */
function showFieldError(field, message) {
  clearFieldError(field);
  
  field.style.borderColor = '#e74c3c';
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    color: #e74c3c;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  `;
  
  field.parentNode.appendChild(errorDiv);
}

/**
 * Clear field error
 */
function clearFieldError(field) {
  field.style.borderColor = '';
  
  const existingError = field.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

// ========================================
// Accessibility Enhancements
// ========================================

/**
 * Initialize accessibility enhancements
 * Improves keyboard navigation and screen reader support
 */
function initializeAccessibilityEnhancements() {
  // Skip to content link
  addSkipToContentLink();
  
  // Enhanced keyboard navigation
  enhanceKeyboardNavigation();
  
  // Screen reader announcements
  setupScreenReaderAnnouncements();
  
  // Focus management
  setupFocusManagement();
}

/**
 * Add skip to content link for keyboard users
 */
function addSkipToContentLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-to-content';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 1000;
    border-radius: 4px;
    transition: top 0.3s;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Enhance keyboard navigation
 */
function enhanceKeyboardNavigation() {
  // Make methodology steps and partner cards focusable
  const interactiveElements = document.querySelectorAll('.methodology-step, .partner-card');
  
  interactiveElements.forEach(el => {
    el.setAttribute('tabindex', '0');
    
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });
}

/**
 * Setup screen reader announcements
 */
function setupScreenReaderAnnouncements() {
  // Create live region for announcements
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  
  document.body.appendChild(liveRegion);
  
  // Announce section changes
  const sections = document.querySelectorAll('.about-section');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const title = entry.target.querySelector('.section-title');
        if (title) {
          liveRegion.textContent = `Now viewing: ${title.textContent}`;
        }
      }
    });
  }, { threshold: 0.5 });
  
  sections.forEach(section => sectionObserver.observe(section));
}

/**
 * Setup focus management
 */
function setupFocusManagement() {
  // Trap focus within modal-like elements (if any)
  const modalElements = document.querySelectorAll('[role="dialog"], .modal');
  
  modalElements.forEach(modal => {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  });
}

// ========================================
// Utility Functions
// ========================================

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll events
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ========================================
// Performance Monitoring
// ========================================

/**
 * Monitor performance and log metrics
 */
function monitorPerformance() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('About page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
      }, 0);
    });
  }
}

// Initialize performance monitoring
monitorPerformance();

// ========================================
// Export for testing (if needed)
// ========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializePulseAnimation,
    initializeScrollAnimations,
    initializeContactForm,
    initializeAccessibilityEnhancements
  };
}