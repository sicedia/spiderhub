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
    container.classList.remove('loading');
    return;
  }

  // Enhanced data structure with better labels
  const dataValues = [
    counts.nonBinding || 0,
    counts.politicallyBinding || 0,
    counts.legallyBinding || 0,
    counts.uncategorised || 0,
  ];

  const total = dataValues.reduce((sum, value) => sum + value, 0);

  const data = {
    labels: ['Non-binding', 'Politically-binding', 'Legally-binding', 'Uncategorised'],
    datasets: [{
      data: dataValues,
      backgroundColor: [
        '#94A3B8',   // Non-binding - Slate gray
        '#F59E0B',   // Politically-binding - Amber
        '#10B981',   // Legally-binding - Emerald
        '#6366F1',   // Uncategorised - Indigo
      ],
      borderColor: '#FFFFFF',
      borderWidth: 3,
      hoverBackgroundColor: [
        '#64748B',   // Darker slate gray
        '#D97706',   // Darker amber
        '#059669',   // Darker emerald
        '#4F46E5',   // Darker indigo
      ],
      hoverBorderWidth: 4,
    }],
  };

  canvas.__chart = new Chart(ctx, {
    type: 'doughnut',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { 
            boxWidth: 16, 
            boxHeight: 16, 
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              family: 'Roboto',
              size: 13,
              weight: '500'
            },
            color: '#374151',
            generateLabels: (chart) => {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const dataset = data.datasets[0];
                  const value = dataset.data[i];
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  
                  return {
                    text: `${label}: ${value} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor[i],
                    strokeStyle: dataset.borderColor,
                    lineWidth: dataset.borderWidth,
                    hidden: isNaN(dataset.data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                    index: i
                  };
                });
              }
              return [];
            }
          },
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
              return context[0].label || '';
            },
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const documentText = value === 1 ? 'document' : 'documents';
              
              return [
                `${value} ${documentText}`,
                `${percentage}% of total`,
                total > 0 ? `${total} total documents` : 'No data available'
              ];
            },
          },
          displayColors: true,
          padding: 12,
          caretPadding: 8,
        },
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
        mode: 'point'
      },
      onHover: (event, activeElements) => {
        event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw: (chart) => {
        if (total > 0) {
          const { ctx, width, height } = chart;
          
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const centerX = width / 2;
          const centerY = height / 2;
          
          // Main total number
          ctx.fillStyle = '#1F2937';
          ctx.font = 'bold 24px Roboto';
          ctx.fillText(total.toString(), centerX, centerY - 8);
          
          // Label
          ctx.fillStyle = '#6B7280';
          ctx.font = '14px Roboto';
          ctx.fillText('Total Documents', centerX, centerY + 12);
          
          ctx.restore();
        }
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
          
          ctx.fillText('No legal binding data available', width / 2, height / 2 - 10);
          ctx.font = '14px Roboto';
          ctx.fillText('Legal binding status will appear here once documents are analyzed', width / 2, height / 2 + 15);
          
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
  const bindingBreakdown = data.labels.map((label, index) => {
    const value = dataValues[index];
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return `${label}: ${value} documents (${percentage}%)`;
  }).join(', ');

  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 
    `Legal binding status distribution showing ${total} total documents. Breakdown: ${bindingBreakdown}`
  );
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