/**
 * Coverage Scope Horizontal Bar Chart Module
 * Renders horizontal bar chart showing agreements by coverage scope
 */

/**
 * Render horizontal bar chart of coverage scopes.
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
    'Global Agreements',
    'Multilateral',
    'Regional Frameworks', 
    'Sub-regional Initiatives',
    'Bilateral Partnerships'
  ];

  const data = [
    counts.global          ?? 0,
    counts.multilateral    ?? 0,
    counts.regional        ?? 0,
    counts.subRegional     ?? 0,
    counts.bilateral       ?? 0
  ];

  // Enhanced color scheme with better accessibility
  const backgroundColors = [
    '#2563EB', // Global - Strong Blue
    '#059669', // Multilateral - Emerald
    '#DC2626', // Regional - Red
    '#D97706', // Sub-regional - Amber
    '#7C3AED'  // Bilateral - Purple
  ];

  const hoverColors = [
    '#1D4ED8',
    '#047857', 
    '#B91C1C',
    '#B45309',
    '#6D28D9'
  ];

  // Calculate total and max for better scaling
  const total = data.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(...data);

  canvas.__chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Number of Agreements',
        data,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: hoverColors,
        borderColor: backgroundColors.map(color => color + 'DD'),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y', // This makes it horizontal
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 20,
          top: 10,
          bottom: 10
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: maxValue > 0 ? Math.ceil(maxValue * 1.15) : 10,
          ticks: {
            stepSize: Math.ceil(maxValue / 8) || 1,
            font: {
              family: 'Roboto',
              size: 11,
              weight: '500'
            },
            color: '#6B7280',
            callback: function(value) {
              return Number.isInteger(value) ? value : '';
            }
          },
          grid: {
            color: 'rgba(107, 114, 128, 0.1)',
            lineWidth: 1,
          },
          title: {
            display: true,
            text: 'Number of Agreements',
            font: {
              family: 'Roboto',
              size: 12,
              weight: '600'
            },
            color: '#374151',
            padding: 10
          }
        },
        y: {
          ticks: {
            font: {
              family: 'Roboto',
              size: 12,
              weight: '500'
            },
            color: '#374151',
            padding: 8,
            maxRotation: 0,
          },
          grid: {
            display: false,
          }
        }
      },
      plugins: {
        legend: {
          display: false, // Hide legend for cleaner look
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#F9FAFB',
          bodyColor: '#F3F4F6',
          borderColor: '#4B5563',
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            family: 'Roboto',
            weight: '600',
            size: 14
          },
          bodyFont: {
            family: 'Roboto',
            size: 13,
            weight: '400'
          },
          callbacks: {
            title: (context) => {
              const scopeTypes = {
                'Global Agreements': 'Global',
                'Multilateral (3+ countries)': 'Multilateral', 
                'Regional Frameworks': 'Regional',
                'Sub-regional Initiatives': 'Sub-regional',
                'Bilateral Partnerships': 'Bilateral'
              };
              return scopeTypes[context[0].label] || context[0].label;
            },
            label: (context) => {
              const value = context.parsed.x;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const agreementText = value === 1 ? 'agreement' : 'agreements';
              
              return [
                `${value} ${agreementText}`,
                `${percentage}% of total`,
                total > 0 ? `${total} total agreements` : 'No data available'
              ];
            },
          },
          displayColors: true,
          padding: 12,
          caretPadding: 8,
        },
        // Custom plugin for value labels on bars
        datalabels: false, // Disable chartjs-plugin-datalabels if loaded
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart',
        onComplete: () => {
          container.classList.remove('loading');
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    },
    plugins: [{
      id: 'barLabels',
      afterDatasetsDraw: (chart) => {
        const { ctx, data, scales } = chart;
        
        ctx.save();
        ctx.font = 'bold 12px Roboto';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        data.datasets[0].data.forEach((value, index) => {
          if (value > 0) {
            const y = scales.y.getPixelForTick(index);
            const x = scales.x.getPixelForValue(value);
            
            // Add some padding from the bar end
            const labelX = x + 8;
            
            // Use white text on dark bars, dark text on light bars
            ctx.fillStyle = '#374151';
            
            // Show value and percentage
            const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
            const label = `${value} (${percentage}%)`;
            
            ctx.fillText(label, labelX, y);
          }
        });
        
        ctx.restore();
      }
    }, {
      id: 'emptyState',
      beforeDraw: (chart) => {
        if (total === 0) {
          const { ctx, width, height } = chart;
          
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#9CA3AF';
          ctx.font = '16px Roboto';
          
          ctx.fillText('No coverage data available', width / 2, height / 2 - 10);
          ctx.font = '14px Roboto';
          ctx.fillText('Data will appear here once agreements are analyzed', width / 2, height / 2 + 15);
          
          ctx.restore();
        }
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

  // Add accessibility
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 
    `Coverage scope distribution chart showing ${total} total agreements: ` +
    `${data[0]} global, ${data[1]} multilateral, ${data[2]} regional, ` +
    `${data[3]} sub-regional, and ${data[4]} bilateral agreements`
  );
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