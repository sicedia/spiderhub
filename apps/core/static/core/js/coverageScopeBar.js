/**
 * Coverage Scope Polar Area Chart Module
 * Renders polar area chart showing agreements by coverage scope
 */

/**
 * Render polar area chart of coverage scopes.
 * @param {{bilateral:number, subRegional:number, regional:number, multilateral:number, global:number}} counts
 */
export const renderCoverageBar = async (counts) => {
  const container = document.getElementById('coverage-bar-chart');
  if (!container) {
    console.warn('Coverage chart container not found');
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

  const labels = [
    'Global',
    'Multilateral',
    'Regional',
    'Sub-regional',
    'Bilateral',
  ];

  const data = [
    counts.global          ?? 0,
    counts.multilateral    ?? 0,
    counts.regional        ?? 0,
    counts.subRegional     ?? 0,
    counts.bilateral       ?? 0,
  ];

  // Create gradient colors for polar area
  const backgroundColors = [
    '#FF6B6B', // Global - Red
    '#4ECDC4', // Multilateral - Teal
    '#45B7D1', // Regional - Blue
    '#96CEB4', // Sub-regional - Green
    '#FECA57', // Bilateral - Yellow
  ];

  const borderColors = [
    '#FF5252',
    '#26C6DA',
    '#2196F3',
    '#66BB6A',
    '#FFC107',
    '#9C27B0',
  ];

  // Calculate total for statistics
  const total = data.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(...data);

  canvas.__chart = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors.map(color => color + '80'), // Add transparency
        borderColor: borderColors,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBackgroundColor: backgroundColors.map(color => color + 'CC'),
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10,
          ticks: {
            stepSize: Math.ceil(maxValue / 5) || 1,
            font: {
              family: 'Roboto',
              size: 11
            },
            color: '#666',
            backdropColor: 'rgba(255, 255, 255, 0.8)',
            backdropPadding: 4,
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1,
          },
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1,
          },
          pointLabels: {
            font: {
              family: 'Roboto',
              size: 12,
              weight: '500'
            },
            color: '#333',
            padding: 15,
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: {
              family: 'Roboto',
              size: 12,
              weight: '500'
            },
            color: '#333',
            generateLabels: (chart) => {
              const data = chart.data;
              return data.labels.map((label, index) => {
                const value = data.datasets[0].data[index];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: backgroundColors[index],
                  strokeStyle: borderColors[index],
                  pointStyle: 'circle',
                  hidden: false,
                  index: index
                };
              });
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#ddd',
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            family: 'Roboto',
            weight: '600',
            size: 14
          },
          bodyFont: {
            family: 'Roboto',
            size: 13
          },
          callbacks: {
            title: (context) => context[0].label,
            label: (context) => {
              const value = context.parsed.r;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return [
                `Count: ${value} agreement${value !== 1 ? 's' : ''}`,
                `Percentage: ${percentage}%`
              ];
            },
          },
          displayColors: true,
          padding: 12,
        },
      },
      animation: {
        duration: 1200,
        easing: 'easeOutQuart',
        onComplete: () => {
          container.classList.remove('loading');
        },
      },
      interaction: {
        intersect: false,
      },
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20
        }
      }
    },
    plugins: [{
      id: 'centerStats',
      beforeDraw: (chart) => {
        if (total === 0) return;
        
        const { ctx, width, height } = chart;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Total count
        ctx.font = 'bold 18px Roboto';
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(total.toString(), centerX, centerY - 8);
        
        // Label
        ctx.font = '10px Roboto';
        ctx.fillStyle = '#7f8c8d';
        ctx.fillText('TOTAL', centerX, centerY + 12);
        
        ctx.restore();
      }
    }]
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
export const destroyCoverageBar = (containerId = 'coverage-bar-chart') => {
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