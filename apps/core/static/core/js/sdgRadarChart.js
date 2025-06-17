/**
 * SDG Radar Chart Module
 * Renders interactive radar chart showing SDG alignment data
 */

/**
 * Render the SDG Alignment radar chart.
 * @param {Object.<string, number>} counts - Key/value pairs for sdg1 … sdg17.
 */
export const renderSdgRadar = async (counts) => {
  const container = document.getElementById('radar-chart');
  if (!container) {
    console.warn('SDG radar chart container not found');
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

  // SDG labels with proper names
  const sdgLabels = [
    'SDG 1: No Poverty',
    'SDG 2: Zero Hunger', 
    'SDG 3: Good Health',
    'SDG 4: Quality Education',
    'SDG 5: Gender Equality',
    'SDG 6: Clean Water',
    'SDG 7: Clean Energy',
    'SDG 8: Decent Work',
    'SDG 9: Innovation',
    'SDG 10: Reduced Inequalities',
    'SDG 11: Sustainable Cities',
    'SDG 12: Responsible Consumption',
    'SDG 13: Climate Action',
    'SDG 14: Life Below Water',
    'SDG 15: Life on Land',
    'SDG 16: Peace & Justice',
    'SDG 17: Partnerships'
  ];

  const data = sdgLabels.map((_, i) => counts[`sdg${i + 1}`] || 0);

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

  // Create the radar chart
  canvas.__chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: sdgLabels,
      datasets: [{
        label: 'Agreements per SDG',
        data,
        fill: true,
        backgroundColor: 'rgba(9, 78, 178, 0.15)',
        borderColor: '#094EB2',
        pointBackgroundColor: '#094EB2',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          suggestedMin: 0,
          beginAtZero: true,
          max: Math.max(...data) + 5,
          ticks: { 
            stepSize: Math.ceil(Math.max(...data) / 5) || 1,
            backdropColor: 'transparent',
            font: {
              family: 'Roboto',
              size: 11
            },
            color: '#666'
          },
          grid: { 
            color: 'rgba(9, 78, 178, 0.1)',
            lineWidth: 1
          },
          angleLines: {
            color: 'rgba(9, 78, 178, 0.1)',
            lineWidth: 1
          },
          pointLabels: {
            font: {
              family: 'Roboto',
              size: 11,
              weight: '500'
            },
            color: '#333',
            padding: 8
          }
        },
      },
      plugins: {
        legend: { 
          display: false 
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
            title: (context) => context[0].label,
            label: (context) => `${context.parsed.r} agreement${context.parsed.r !== 1 ? 's' : ''}`,
          },
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeOutCubic',
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
export const destroySdgRadar = (containerId = 'radar-chart') => {
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