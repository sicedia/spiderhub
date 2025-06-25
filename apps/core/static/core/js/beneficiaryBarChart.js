/**
 * Agreements by Beneficiary-Category – Enhanced horizontal bar chart
 * Expects { "General": 12, "Age Groups": 3, "Gender": 8, "Vulnerable Groups": 5, … }
 */
export const renderBeneficiaryBar = async (counts) => {
  const container = document.getElementById('beneficiary-bar-chart');
  if (!container) return console.warn('Beneficiary bar chart container missing');

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
  if (!Chart) return console.error('Chart.js not loaded');

  // Sort beneficiaries by count (descending) for better visual hierarchy
  const sortedEntries = Object.entries(counts)
    .sort(([,a], [,b]) => b - a);

  const labels = sortedEntries.map(([label]) => label);
  const data = sortedEntries.map(([, value]) => value);

  // Enhanced color scheme specifically for beneficiary categories
  const beneficiaryColors = {
    'General': '#2563EB',           // Blue - General population
    'Age Groups': '#059669',        // Emerald - Age-specific
    'Gender': '#DC2626',           // Red - Gender-related
    'Vulnerable Groups': '#D97706', // Amber - Vulnerable populations
    'Economic Groups': '#7C3AED',   // Purple - Economic categories
    'Geographic': '#0891B2',        // Cyan - Geographic beneficiaries
    'Professional': '#C2410C',      // Orange - Professional groups
    'Educational': '#BE185D',       // Pink - Educational beneficiaries
    'Health': '#4338CA',           // Indigo - Health-related
    'Environmental': '#059212',     // Green - Environmental beneficiaries
    'Cultural': '#92400E',         // Brown - Cultural groups
    'Indigenous': '#B91C1C'        // Dark Red - Indigenous populations
  };

  // Generate colors based on category names or use defaults
  const backgroundColor = labels.map((label, index) => {
    // Try to match common beneficiary category patterns
    for (const [key, color] of Object.entries(beneficiaryColors)) {
      if (label.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(label.toLowerCase())) {
        return color;
      }
    }
    // Fallback to gradient blue scheme
    const baseBlue = [9, 78, 178]; // #094EB2
    const intensity = 1 - (index * 0.15);
    return `rgb(${Math.floor(baseBlue[0] * intensity)}, ${Math.floor(baseBlue[1] * intensity)}, ${Math.floor(baseBlue[2] * intensity)})`;
  });

  const hoverColors = backgroundColor.map(color => {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgb(${Math.max(0, r-30)}, ${Math.max(0, g-30)}, ${Math.max(0, b-30)})`;
    } else {
      // Handle rgb format
      return color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, (match, r, g, b) => {
        return `rgb(${Math.max(0, r-30)}, ${Math.max(0, g-30)}, ${Math.max(0, b-30)})`;
      });
    }
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
        borderRadius: 8,
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
              // Truncate long beneficiary category names
              const label = this.getLabelForValue(value);
              return label.length > 22 ? label.substring(0, 19) + '...' : label;
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
              return context[0].label; // Full beneficiary category name
            },
            label: (context) => {
              const value = context.parsed.x;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const agreementText = value === 1 ? 'agreement' : 'agreements';
              
              return [
                `${value} ${agreementText}`,
                `${percentage}% of beneficiary focus`,
                `Rank: #${context.dataIndex + 1} of ${labels.length}`,
                total > 0 ? `${total} total beneficiary agreements` : 'No data available'
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
      id: 'beneficiaryLabels',
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
          
          ctx.fillText('No beneficiary data available', width / 2, height / 2 - 10);
          ctx.font = '14px Roboto';
          ctx.fillText('Beneficiary categories will appear here once agreements are analyzed', width / 2, height / 2 + 15);
          
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
  const topBeneficiaries = labels.slice(0, 5).join(', ');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 
    `Beneficiary distribution chart showing ${total} total agreements across ${labels.length} beneficiary categories. ` +
    `Top categories include: ${topBeneficiaries}${labels.length > 5 ? ' and others' : ''}.`
  );
};

/**
 * Clean up chart and observers
 * @param {string} containerId - ID of the chart container
 */
export const destroyBeneficiaryBar = (containerId = 'beneficiary-bar-chart') => {
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