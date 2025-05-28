document.addEventListener('DOMContentLoaded', function() {
  // Initialize animation for stats counting
  const statNumbers = document.querySelectorAll('.stat-number');
  
  const observerOptions = {
    threshold: 0.5
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const targetValue = parseInt(target.getAttribute('data-target'));
        let count = 0;
        const duration = 2000; // ms
        const interval = duration / targetValue;
        
        const counter = setInterval(() => {
          count++;
          target.textContent = count + (target.getAttribute('data-suffix') || '');
          
          if (count >= targetValue) {
            clearInterval(counter);
          }
        }, interval);
        
        observer.unobserve(target);
      }
    });
  }, observerOptions);
  
  statNumbers.forEach(stat => {
    observer.observe(stat);
  });
  
  // Initialize node web animation
  createNodeWeb();
  
  // Initialize carousel for recent documents
  initCarousel();
});

// Animación de red de nodos para el hero
function createNodeWeb() {
    const nodeWeb = document.getElementById('node-web');
    if (!nodeWeb) return;
    
    // Crear elemento canvas
    const canvas = document.createElement('canvas');
    canvas.width = nodeWeb.offsetWidth;
    canvas.height = nodeWeb.offsetHeight;
    nodeWeb.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Datos de nodos y conexiones
    const nodes = [];
    const connections = [];
    const nodeCount = 50;
    
    // Crear nodos aleatorios
    for (let i = 0; i < nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 2,
            vx: Math.random() * 0.5 - 0.25,
            vy: Math.random() * 0.5 - 0.25
        });
    }
    
    // Crear conexiones entre nodos
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            if (Math.random() > 0.9) {
                connections.push({
                    from: i,
                    to: j
                });
            }
        }
    }
    
    // Función de animación
    function animate() {
        // Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Actualizar y dibujar conexiones
        ctx.strokeStyle = 'rgba(0, 151, 167, 0.2)';
        ctx.lineWidth = 1;
        
        connections.forEach(connection => {
            const fromNode = nodes[connection.from];
            const toNode = nodes[connection.to];
            
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.stroke();
        });
        
        // Actualizar y dibujar nodos
        ctx.fillStyle = 'rgba(0, 151, 167, 0.7)';
        
        nodes.forEach(node => {
            // Actualizar posición
            node.x += node.vx;
            node.y += node.vy;
            
            // Rebotar en los bordes
            if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
            
            // Dibujar nodo
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        requestAnimationFrame(animate);
    }
    
    // Ajustar tamaño del canvas al redimensionar la ventana
    window.addEventListener('resize', function() {
        canvas.width = nodeWeb.offsetWidth;
        canvas.height = nodeWeb.offsetHeight;
    });
    
    // Iniciar animación
    animate();
}

function initCarousel() {
  const track = document.querySelector('.carousel-track');
  if (!track) return;
  
  const cards = track.querySelectorAll('.document-card');
  const prevButton = document.querySelector('.carousel-prev');
  const nextButton = document.querySelector('.carousel-next');
  const indicatorsContainer = document.querySelector('.carousel-indicators');
  
  let currentIndex = 0;
  let cardWidth = cards[0].offsetWidth;
  let cardsPerView = getCardsPerView();
  let maxIndex = Math.max(0, cards.length - cardsPerView);
  
  // Create indicators
  cards.forEach((_, index) => {
    if (index <= maxIndex) {
      const indicator = document.createElement('button');
      indicator.classList.add('carousel-indicator');
      indicator.setAttribute('aria-label', `Slide ${index + 1}`);
      indicator.addEventListener('click', () => goToSlide(index));
      indicatorsContainer.appendChild(indicator);
    }
  });
  
  const indicators = indicatorsContainer.querySelectorAll('.carousel-indicator');
  if (indicators.length > 0) {
    indicators[0].classList.add('active');
  }
  
  // Update carousel state
  function updateCarousel() {
    // Calculate how many cards can be displayed at once
    cardsPerView = getCardsPerView();
    maxIndex = Math.max(0, cards.length - cardsPerView);
    
    // Limit currentIndex to valid range
    currentIndex = Math.min(currentIndex, maxIndex);
    
    // Update track position
    cardWidth = cards[0].offsetWidth + 20; // card width + gap
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    
    // Update button states
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex >= maxIndex;
    
    // Update indicators
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === currentIndex);
    });
  }
  
  // Navigate to specific slide
  function goToSlide(index) {
    currentIndex = Math.min(Math.max(0, index), maxIndex);
    updateCarousel();
  }
  
  // Previous slide
  function goToPrevSlide() {
    goToSlide(currentIndex - 1);
  }
  
  // Next slide
  function goToNextSlide() {
    goToSlide(currentIndex + 1);
  }
  
  // Calculate cards per view based on screen size
  function getCardsPerView() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 992) return 2;
    return 3;
  }
  
  // Event listeners
  prevButton.addEventListener('click', goToPrevSlide);
  nextButton.addEventListener('click', goToNextSlide);
  
  // Handle resize
  window.addEventListener('resize', () => {
    // Reset card width and cards per view on resize
    cardWidth = cards[0].offsetWidth + 20;
    updateCarousel();
  });
  
  // Touch events for mobile swiping
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
    if (touchStartX - touchEndX > SWIPE_THRESHOLD) {
      // Swipe left, go to next slide
      goToNextSlide();
    } else if (touchEndX - touchStartX > SWIPE_THRESHOLD) {
      // Swipe right, go to previous slide
      goToPrevSlide();
    }
  }
  
  // Initialize carousel state
  updateCarousel();
}