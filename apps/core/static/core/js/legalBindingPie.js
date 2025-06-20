/**
 * Legal Binding Pie Chart Module
 * Renders donut chart showing legal bindingness distribution
 */

/**
 * Render a donut chart of legal bindingness.
 * @param {{nonBinding:number, politicallyBinding:number, legallyBinding:number}} counts
 */
export const renderLegalBindingPie = async (counts) => {
  const container = document.getElementById('pie-chart');
  if (!container) {
    console.warn('Legal binding pie chart container not found');
    return;
  }

  // Create canvas if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');

  // Clean up if chart already exists
  if (canvas.__chart) { 
    canvas.__chart.destroy(); 
  }

  // Add loading state
  container.classList.add('loading');

  // Wait for Chart.js to be available
  const Chart = window.Chart;
  if (!Chart) {
    console.error('Chart.js not loaded');
    container.classList.remove('loading');
    return;
  }

  const data = {
    labels: ['Non-binding', 'Politically-binding', 'Legally-binding', 'Uncategorised'],
    datasets: [{
      data: [
        counts.nonBinding || 0,
        counts.politicallyBinding || 0,
        counts.legallyBinding || 0,
        counts.uncategorised || 0,
      ],
      backgroundColor: [
        '#999',      // Non-binding
        '#FBBC04',   // Politically-binding
        '#34A853',   // Legally-binding
        '#4285F4',   // Uncategorised
      ],
      borderColor: 'white',
      borderWidth: 2,
      hoverBackgroundColor: [
        '#777',
        '#e6a600',
        '#2d8a3d',
        '#3367D6',
      ],
    }],
  };

  canvas.__chart = new Chart(ctx, {
    type: 'doughnut',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { 
            boxWidth: 14, 
            boxHeight: 14, 
            padding: 12,
            font: {
              family: 'Roboto',
              size: 12
            },
            color: '#333'
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#094EB2',
          borderWidth: 1,
          cornerRadius: 6,
          titleFont: {
            family: 'Roboto',
            weight: '600'
          },
          bodyFont: {
            family: 'Roboto'
          },
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
              return ` ${label}: ${value} documents (${percentage}%)`;
            },
          },
        },
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
        onComplete: () => {
          container.classList.remove('loading');
        },
      },
      interaction: {
        intersect: false,
        mode: 'point'
      }
    },
  });

  // Handle responsive resize
  const resizeObserver = new ResizeObserver(() => {
    if (canvas.__chart) {
      canvas.__chart.resize();
    }
  });
  
  resizeObserver.observe(container);
  
  // Store observer for cleanup
  canvas.__resizeObserver = resizeObserver;
};

/**
 * Clean up chart and observers
 * @param {string} containerId - ID of the chart container
 */
export const destroyLegalBindingPie = (containerId = 'pie-chart') => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const canvas = container.querySelector('canvas');
  if (canvas) {
    if (canvas.__chart) {
      canvas.__chart.destroy();
      canvas.__chart = null;
    }
    if (canvas.__resizeObserver) {
      canvas.__resizeObserver.disconnect();
      canvas.__resizeObserver = null;
    }
  }
};