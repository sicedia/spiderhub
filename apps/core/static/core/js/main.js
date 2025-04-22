document.addEventListener('DOMContentLoaded', function() {
  // Initialize confidence bars
  const confidenceBars = document.querySelectorAll('.confidence-level');
  confidenceBars.forEach(bar => {
    const confidence = parseInt(bar.getAttribute('data-confidence'));
    bar.style.width = `${confidence}%`;
    
    // Color based on confidence level
    if (confidence >= 80) {
      bar.style.backgroundColor = '#34A853'; // Green for high confidence
    } else if (confidence >= 50) {
      bar.style.backgroundColor = '#FBBC04'; // Yellow for medium confidence
    } else {
      bar.style.backgroundColor = '#EA4335'; // Red for low confidence
    }
  });
  
  // Animation for stats counting
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
  
  // World map connections animation
  initWorldMap();
});

function initWorldMap() {
  const svg = document.getElementById('world-map');
  if (!svg) return;
  
  // Add pulsing effect to connection points
  const connectionPoints = svg.querySelectorAll('.connection-point');
  connectionPoints.forEach(point => {
    setInterval(() => {
      point.classList.toggle('pulse');
    }, 2000);
  });
  
  // Animate connection lines
  const connectionLines = svg.querySelectorAll('.connection-line');
  connectionLines.forEach(line => {
    const length = line.getTotalLength();
    line.style.strokeDasharray = length;
    line.style.strokeDashoffset = length;
    
    setTimeout(() => {
      line.style.transition = 'stroke-dashoffset 2s ease-in-out';
      line.style.strokeDashoffset = '0';
    }, 500);
  });
}