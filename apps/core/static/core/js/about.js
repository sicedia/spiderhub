document.addEventListener('DOMContentLoaded', () => {
  // Initialize about page components
  initializePulseAnimation();
  initializeContactForm();
});

// Modular pulse animation with staggered delays
function initializePulseAnimation() {
  const pulseCircles = document.querySelectorAll('.pulse-circle');
  
  pulseCircles.forEach((circle, index) => {
    circle.style.animationDelay = `${index * 0.5}s`;
  });
}

// Enhanced form handling with validation
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
      
      if (!fields.name.value.trim()) {
        errors.push('Name is required');
      }
      
      if (!fields.email.value.trim()) {
        errors.push('Email is required');
      } else if (!this.isValidEmail(fields.email.value)) {
        errors.push('Please enter a valid email address');
      }
      
      if (!fields.message.value.trim()) {
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
      alert(`Please correct the following errors:\n• ${errors.join('\n• ')}`);
      return;
    }
    
    // Success feedback
    alert('Thank you for your message. We will respond to you shortly.');
    contactForm.reset();
  });
}