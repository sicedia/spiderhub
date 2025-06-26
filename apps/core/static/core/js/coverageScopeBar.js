/**
 * Coverage Scope Radial/Polar Chart Module
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
    container.classList.remove('loading');
    return;
  }

  const labels = [
    'Bilateral Partnerships',
    'Sub-regional Initiatives', 
    'Regional Frameworks',
    'Multilateral Agreements',
    'Global Agreements'
  ];

  const data = [
    counts.bilateral       ?? 0,
    counts.subRegional     ?? 0,
    counts.regional        ?? 0,
    counts.multilateral    ?? 0,
    counts.global          ?? 0
  ];

  // Vibrant color scheme for polar chart
  const backgroundColors = [
    'rgba(124, 58, 237, 0.8)',  // Purple - Bilateral
    'rgba(217, 119, 6, 0.8)',   // Amber - Sub-regional
    'rgba(220, 38, 38, 0.8)',   // Red - Regional
    'rgba(5, 150, 105, 0.8)',   // Emerald - Multilateral
    'rgba(37, 99, 235, 0.8)'    // Blue - Global
  ];

  const borderColors = [
    'rgb(124, 58, 237)',
    'rgb(217, 119, 6)', 
    'rgb(220, 38, 38)',
    'rgb(5, 150, 105)',
    'rgb(37, 99, 235)'
  ];

  // Calculate total for better scaling and empty state
  const total = data.reduce((sum, value) => sum + value, 0);

  canvas.__chart = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels,
      datasets: [{
        label: 'Coverage Scope Distribution',
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderAlign: 'inner'
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 50, // Más espacio arriba para los labels de mayor/menor
          bottom: 20,
          left: 20,
          right: 20
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: total > 0 ? Math.max(...data) * 1.2 : 10,
          ticks: {
            stepSize: Math.ceil(Math.max(...data) / 5) || 1,
            font: {
              family: 'Roboto',
              size: 11,
              weight: '500'
            },
            color: '#6B7280',
            callback: function(value) {
              return Number.isInteger(value) ? value : '';
            },
            backdropColor: 'rgba(255, 255, 255, 0.9)',
            backdropPadding: 4
          },
          grid: {
            color: 'rgba(107, 114, 128, 0.3)',
            lineWidth: 1,
          },
          angleLines: {
            color: 'rgba(107, 114, 128, 0.2)',
            lineWidth: 1
          },
          pointLabels: {
            font: {
              family: 'Roboto',
              size: 12,
              weight: '600'
            },
            color: '#374151',
            padding: 15,
            callback: function(label, index) {
              // Add count to label
              const count = data[index];
              return count > 0 ? `${label}\n(${count})` : label;
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              family: 'Roboto',
              size: 12,
              weight: '500'
            },
            color: '#374151',
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            generateLabels: function(chart) {
              const original = Chart.defaults.plugins.legend.labels.generateLabels;
              const labels = original.call(this, chart);
              
              // Add percentages to legend labels
              labels.forEach((label, index) => {
                const value = data[index];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                label.text = `${labels[index].text}: ${value} (${percentage}%)`;
              });
              
              return labels;
            }
          }
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
                'Bilateral Partnerships': 'Bilateral',
                'Sub-regional Initiatives': 'Sub-regional',
                'Regional Frameworks': 'Regional',
                'Multilateral Agreements': 'Multilateral',
                'Global Agreements': 'Global'
              };
              return scopeTypes[context[0].label] || context[0].label;
            },
            label: (context) => {
              const value = context.parsed.r;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const agreementText = value === 1 ? 'agreement' : 'agreements';
              
              return [
                `${value} ${agreementText}`,
                `${percentage}% of total coverage`,
                `Scope: ${context.label.split(' ')[0].toLowerCase()}`
              ];
            },
            afterBody: (context) => {
              if (total > 0) {
                return [`\nTotal: ${total} agreements across all scopes`];
              }
              return [];
            }
          },
          displayColors: true,
          padding: 12,
          caretPadding: 8,
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeOutBack',
        animateRotate: true,
        animateScale: true,
        onComplete: () => {
          container.classList.remove('loading');
        },
      },
      interaction: {
        intersect: false,
        mode: 'point',
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      },
      // Custom hover animations
      hover: {
        animationDuration: 300,
      },
      elements: {
        arc: {
          hoverBorderWidth: 3,
          hoverBorderColor: '#1F2937'
        }
      }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw: (chart) => {
        if (total === 0) {
          const { ctx, width, height } = chart;
          
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#9CA3AF';
          ctx.font = 'bold 16px Roboto';
          
          ctx.fillText('No Coverage Data', width / 2, height / 2 - 10);
          ctx.font = '14px Roboto';
          ctx.fillText('Data will appear once agreements are analyzed', width / 2, height / 2 + 15);
          
          ctx.restore();
        } else {
          // Add center statistics
          const { ctx, width, height } = chart;
          
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 18px Roboto';
          
          ctx.fillText(`${total}`, width / 2, height / 2 - 8);
          ctx.font = '12px Roboto';
          ctx.fillStyle = '#6B7280';
          ctx.fillText('Total Agreements', width / 2, height / 2 + 12);
          
          ctx.restore();
        }
      }
    }, {
      id: 'scopeRanking',
      afterDraw: (chart) => {
        if (total > 0) {
          // Find dominant and least common scopes
          const maxIndex = data.indexOf(Math.max(...data));
          const maxValue = Math.max(...data);
          const maxLabel = labels[maxIndex];
          
          // Find minimum value (excluding zeros)
          const nonZeroData = data.filter(val => val > 0);
          const minValue = nonZeroData.length > 0 ? Math.min(...nonZeroData) : 0;
          const minIndex = data.indexOf(minValue);
          const minLabel = labels[minIndex];
          
          const { ctx, width } = chart;
          
          if (maxValue > 0) {
            ctx.save();
            ctx.textAlign = 'center';
            
            // Highest label
            ctx.fillStyle = '#059669';
            ctx.font = 'bold 11px Roboto';
            const dominantText = `🏆 Highest: ${maxLabel.split(' ')[0]} (${maxValue})`;
            ctx.fillText(dominantText, width / 2, 20);
            
            // Lowest label (only if there are multiple non-zero values)
            if (nonZeroData.length > 1 && minValue > 0 && minValue < maxValue) {
              ctx.fillStyle = '#dc2626';
              ctx.font = 'bold 11px Roboto';
              const leastText = `📊 Lowest: ${minLabel.split(' ')[0]} (${minValue})`;
              ctx.fillText(leastText, width / 2, 35);
            }
            
            ctx.restore();
          }
        }
      }
    }]
  }  );

  // Handle responsive resize
  const chartResizeObserver = new ResizeObserver(() => {
    if (canvas.__chart) {
      canvas.__chart.resize();
    }
  });
  
  chartResizeObserver.observe(container);
  
  // Store observer for cleanup
  canvas.__resizeObserver = chartResizeObserver;

  // Add accessibility
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 
    `Coverage scope polar chart showing ${total} total agreements: ` +
    `${data[0]} bilateral, ${data[1]} sub-regional, ${data[2]} regional, ` +
    `${data[3]} multilateral, and ${data[4]} global agreements`
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