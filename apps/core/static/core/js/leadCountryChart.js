/**
 * Lead Country Chart Module
 * Renders horizontal bar chart showing documents by lead country
 */

/**
 * Render horizontal bar chart of lead countries.
 * @param {Object.<string, number>} counts - e.g. { "Brazil": 25, "Argentina": 18, "Chile": 12 }
 */
export const renderLeadCountryChart = async (counts) => {
  const container = document.getElementById('lead-countries-chart');
  if (!container) {
    console.warn('Lead countries chart container not found');
    return;
  }

  // Check if we have valid data
  if (!counts || typeof counts !== 'object' || Object.keys(counts).length === 0) {
    console.warn('Lead countries chart: No valid data provided');
    container.innerHTML = '<div class="placeholder-content">No lead country data available</div>';
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

  // Prepare data - sort by count descending and take top countries
  const sortedEntries = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10); // Show top 10 countries

  const labels = sortedEntries.map(([country]) => country);
  const data = sortedEntries.map(([, count]) => count);

  // Enhanced color scheme for countries
  const countryColors = [
    '#2563EB', // Strong Blue
    '#059669', // Emerald
    '#DC2626', // Red
    '#D97706', // Amber
    '#7C3AED', // Purple
    '#0891B2', // Cyan
    '#C2410C', // Orange
    '#BE185D', // Pink
    '#4338CA', // Indigo
    '#059212'  // Green
  ];

  const backgroundColor = data.map((_, index) => countryColors[index % countryColors.length]);
  const hoverColors = backgroundColor.map(color => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgb(${Math.max(0, r-30)}, ${Math.max(0, g-30)}, ${Math.max(0, b-30)})`;
  });

  const total = data.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(...data);

  canvas.__chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Number of Documents',
        data,
        backgroundColor,
        hoverBackgroundColor: hoverColors,
        borderColor: backgroundColor.map(color => color + 'DD'),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 32,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 30,
          top: 15,
          bottom: 15
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: maxValue > 0 ? Math.ceil(maxValue * 1.15) : 10,
          ticks: {
            stepSize: Math.ceil(maxValue / 6) || 1,
            precision: 0,
            font: {
              family: 'Roboto',
              size: 12,
              weight: '500'
            },
            color: '#6B7280',
            callback: function(value) {
              return Number.isInteger(value) ? value : '';
            }
          },
          grid: {
            color: 'rgba(107, 114, 128, 0.1)',
            lineWidth: 1
          },
          title: {
            display: true,
            text: 'Number of Documents',
            font: {
              family: 'Roboto',
              size: 12,
              weight: '600'
            },
            color: '#374151',
            padding: 12
          }
        },
        y: {
          grid: { 
            display: false 
          },
          ticks: {
            font: {
              family: 'Roboto',
              size: 12,
              weight: '500'
            },
            color: '#374151',
            padding: 8,
            maxRotation: 0,
            callback: function(value, index) {
              // Truncate long country names
              const label = this.getLabelForValue(value);
              return label.length > 20 ? label.substring(0, 17) + '...' : label;
            }
          }
        }
      },
      plugins: {
        legend: { 
          display: false 
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
              return context[0].label; // Full country name
            },
            label: (context) => {
              const value = context.parsed.x;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const documentText = value === 1 ? 'document' : 'documents';
              
              return [
                `${value} ${documentText}`,
                `${percentage}% of lead country documents`,
                `Rank: #${context.dataIndex + 1} of ${labels.length}`,
                total > 0 ? `${total} total documents` : 'No data available'
              ];
            }
          },
          displayColors: true,
          padding: 12,
          caretPadding: 8,
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
        onComplete: () => container.classList.remove('loading')
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
      id: 'countryLabels',
      afterDatasetsDraw: (chart) => {
        const { ctx, data, scales } = chart;
        
        ctx.save();
        ctx.font = 'bold 11px Roboto';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#374151';
        
        data.datasets[0].data.forEach((value, index) => {
          if (value > 0) {
            const y = scales.y.getPixelForTick(index);
            const x = scales.x.getPixelForValue(value);
            
            // Add some padding from the bar end
            const labelX = x + 8;
            
            // Show value and percentage for significant bars
            if (value / maxValue > 0.08) { // Only show percentage for bars > 8% of max
              const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : '0';
              const label = `${value} (${percentage}%)`;
              ctx.fillText(label, labelX, y);
            } else {
              // Just show the number for smaller bars
              ctx.fillText(value.toString(), labelX, y);
            }
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
          
          ctx.fillText('No lead country data available', width / 2, height / 2 - 10);
          ctx.font = '14px Roboto';
          ctx.fillText('Lead countries will appear here once documents are analyzed', width / 2, height / 2 + 15);
          
          ctx.restore();
        }
      }
    }]
  });

  // Handle responsive resize with debouncing
  let resizeTimeout;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (canvas.__chart) {
        canvas.__chart.resize();
      }
    }, 100);
  });
  
  resizeObserver.observe(container);
  canvas.__resizeObserver = resizeObserver;

  // Add accessibility
  const topCountries = labels.slice(0, 5).join(', ');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 
    `Lead country distribution chart showing ${total} total documents across ${labels.length} countries. ` +
    `Top countries include: ${topCountries}${labels.length > 5 ? ' and others' : ''}.`
  );
};

/**
 * Clean up chart and observers
 * @param {string} containerId - ID of the chart container
 */
export const destroyLeadCountryChart = (containerId = 'lead-countries-chart') => {
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
