document.addEventListener('DOMContentLoaded', function() {
  // Add animation for the pulse effect on connection points
  const pulseCircles = document.querySelectorAll('.pulse-circle');
  let delay = 0;
  
  pulseCircles.forEach(circle => {
    // Add staggered animation delay
    circle.style.animationDelay = `${delay}s`;
    delay += 0.5;
  });
  
  // Form submission handler
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;
      
      // Validate form (simple validation)
      if (!name || !email || !message) {
        alert('Por favor, complete todos los campos del formulario.');
        return;
      }
      
      // In a real application, this would send the data to a server
      // For now, we'll just show a success message
      alert('Gracias por tu mensaje. Te responderemos a la brevedad.');
      
      // Reset form
      contactForm.reset();
    });
  }
});