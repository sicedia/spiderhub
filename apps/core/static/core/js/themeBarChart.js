/**
 * Agreements by Theme – horizontal bar chart for better readability and comparison
 * Receives { "<Theme label>": <number of agreements>, … }
 */
export const renderThemeBar = async (counts) => {
  const container = document.getElementById('theme-bar-chart');
  if (!container) return console.warn('Theme bar chart container missing');

  // Create or reuse canvas
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  if (canvas.__chart) canvas.__chart.destroy();
  container.classList.add('loading');

  const Chart = window.Chart;
  if (!Chart) return;

  // Sort themes by count (descending) for better visual hierarchy
  const sortedEntries = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 12); // Limit to top 12 themes for readability

  const labels = sortedEntries.map(([label]) => label);
  const data = sortedEntries.map(([, value]) => value);
  
  // Enhanced color scheme with gradients
  const generateColors = (count) => {
    const baseColors = [
      '#2563EB', // Blue
      '#059669', // Emerald
      '#DC2626', // Red
      '#D97706', // Amber
      '#7C3AED', // Purple
      '#0891B2', // Cyan
      '#C2410C', // Orange
      '#BE185D', // Pink
      '#4338CA', // Indigo
      '#059212', // Green
      '#B91C1C', // Red variant
      '#92400E'  // Yellow variant
    ];
    
    return Array.from({ length: count }, (_, i) => 
      baseColors[i % baseColors.length]
    );
  };

  const backgroundColor = generateColors(labels.length);
  const hoverColors = backgroundColor.map(color => {
    // Darken on hover
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgb(${Math.max(0, r-20)}, ${Math.max(0, g-20)}, ${Math.max(0, b-20)})`;
  });

  const total = data.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(...data);

  canvas.__chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Number of Agreements',
        data,
        backgroundColor,
        hoverBackgroundColor: hoverColors,
        borderColor: backgroundColor.map(color => color + 'DD'),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y', // Horizontal bars
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
          max: maxValue > 0 ? Math.ceil(maxValue * 1.2) : 10,
          ticks: {
            stepSize: Math.ceil(maxValue / 6) || 1,
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
            padding: 12
          }
        },
        y: {
          ticks: {
            font: {
              family: 'Roboto',
              size: 11,
              weight: '500'
            },
            color: '#374151',
            padding: 8,
            maxRotation: 0,
            callback: function(value, index) {
              // Truncate long theme names
              const label = this.getLabelForValue(value);
              return label.length > 25 ? label.substring(0, 22) + '...' : label;
            }
          },
          grid: {
            display: false,
          }
        }
      },
      plugins: {
        legend: {
          display: false // Hide legend for cleaner look
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
            size: 13
          },
          bodyFont: {
            family: 'Roboto',
            size: 12,
            weight: '400'
          },
          callbacks: {
            title: (context) => {
              return context[0].label; // Full theme name
            },
            label: (context) => {
              const value = context.parsed.x;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const agreementText = value === 1 ? 'agreement' : 'agreements';
              
              return [
                `${value} ${agreementText}`,
                `${percentage}% of total themes`,
                `Rank: #${context.dataIndex + 1} of ${labels.length}`
              ];
            }
          },
          displayColors: true,
          padding: 12,
          caretPadding: 8,
        }
      },
      animation: {
        duration: 1000,
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
      id: 'barLabels',
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
            
            // Position label with padding from bar end
            const labelX = x + 8;
            
            // Show value and percentage for significant bars
            if (value / maxValue > 0.1) { // Only show labels for bars > 10% of max
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
          
          ctx.fillText('No theme data available', width / 2, height / 2 - 10);
          ctx.font = '14px Roboto';
          ctx.fillText('Themes will appear here once agreements are categorized', width / 2, height / 2 + 15);
          
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
  canvas.__resizeObserver = resizeObserver;

  // Add accessibility
  const themeList = labels.slice(0, 5).join(', ');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 
    `Theme distribution chart showing ${total} total agreements across ${labels.length} themes. ` +
    `Top themes include: ${themeList}${labels.length > 5 ? ' and others' : ''}.`
  );
};

/**
 * Clean up chart and observers
 * @param {string} containerId - ID of the chart container
 */
export const destroyThemeBar = (containerId = 'theme-bar-chart') => {
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