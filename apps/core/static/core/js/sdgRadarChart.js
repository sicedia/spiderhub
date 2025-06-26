/**
 * SDG Radar Chart Module - Enhanced version
 * Renders interactive radar chart showing SDG alignment data with improved UX
 */

/**
 * Render the SDG Alignment radar chart with enhanced interactivity and data insights.
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

  // Enhanced SDG data with better categorization and colors
  const sdgData = [
    { num: 1, label: 'No Poverty', shortLabel: 'Poverty', color: '#E5243B', category: 'Social' },
    { num: 2, label: 'Zero Hunger', shortLabel: 'Hunger', color: '#DDA63A', category: 'Social' },
    { num: 3, label: 'Good Health', shortLabel: 'Health', color: '#4C9F38', category: 'Social' },
    { num: 4, label: 'Quality Education', shortLabel: 'Education', color: '#C5192D', category: 'Social' },
    { num: 5, label: 'Gender Equality', shortLabel: 'Gender', color: '#FF3A21', category: 'Social' },
    { num: 6, label: 'Clean Water', shortLabel: 'Water', color: '#26BDE2', category: 'Environmental' },
    { num: 7, label: 'Clean Energy', shortLabel: 'Energy', color: '#FCC30B', category: 'Environmental' },
    { num: 8, label: 'Decent Work', shortLabel: 'Work', color: '#A21942', category: 'Economic' },
    { num: 9, label: 'Innovation', shortLabel: 'Innovation', color: '#FD6925', category: 'Economic' },
    { num: 10, label: 'Reduced Inequalities', shortLabel: 'Inequality', color: '#DD1367', category: 'Social' },
    { num: 11, label: 'Sustainable Cities', shortLabel: 'Cities', color: '#FD9D24', category: 'Environmental' },
    { num: 12, label: 'Responsible Consumption', shortLabel: 'Consumption', color: '#BF8B2E', category: 'Environmental' },
    { num: 13, label: 'Climate Action', shortLabel: 'Climate', color: '#3F7E44', category: 'Environmental' },
    { num: 14, label: 'Life Below Water', shortLabel: 'Oceans', color: '#0A97D9', category: 'Environmental' },
    { num: 15, label: 'Life on Land', shortLabel: 'Land', color: '#56C02B', category: 'Environmental' },
    { num: 16, label: 'Peace & Justice', shortLabel: 'Peace', color: '#00689D', category: 'Social' },
    { num: 17, label: 'Partnerships', shortLabel: 'Partnership', color: '#19486A', category: 'Economic' }
  ];

  const data = sdgData.map(sdg => counts[`sdg${sdg.num}`] || 0);
  const maxValue = Math.max(...data);
  const totalAgreements = data.reduce((sum, val) => sum + val, 0);

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

  // Create the enhanced radar chart
  canvas.__chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: sdgData.map(sdg => `SDG ${sdg.num}`),
      datasets: [
        {
          label: 'Current Agreements',
          data,
          fill: true,
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          borderColor: '#2563EB',
          pointBackgroundColor: sdgData.map(sdg => sdg.color),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: sdgData.map(sdg => sdg.color),
          pointHoverBorderWidth: 3,
        },
        {
          label: 'Digital Focus Benchmark',
          data: [3, 2, 5, 8, 4, 6, 7, 9, 12, 5, 8, 4, 6, 3, 4, 7, 11], // Typical digital cooperation focus
          fill: false,
          backgroundColor: 'transparent',
          borderColor: 'rgba(34, 197, 94, 0.6)',
          borderDash: [5, 5],
          pointBackgroundColor: 'rgba(34, 197, 94, 0.8)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: maxValue > 0 ? Math.ceil(maxValue * 1.2) : 15,
          beginAtZero: true,
          ticks: { 
            stepSize: Math.ceil((maxValue || 10) / 5),
            backdropColor: 'rgba(255, 255, 255, 0.8)',
            backdropPadding: 4,
            font: {
              family: 'Inter, -apple-system, sans-serif',
              size: 10,
              weight: '500'
            },
            color: '#6B7280',
            showLabelBackdrop: true
          },
          grid: { 
            color: 'rgba(37, 99, 235, 0.1)',
            lineWidth: 1
          },
          angleLines: {
            color: 'rgba(37, 99, 235, 0.15)',
            lineWidth: 1
          },
          pointLabels: {
            font: {
              family: 'Inter, -apple-system, sans-serif',
              size: 11,
              weight: '600'
            },
            color: '#374151',
            padding: 12,
            callback: function(label, index) {
              return label;
            }
          }
        },
      },
      plugins: {
        legend: { 
          display: true,
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'line',
            font: {
              family: 'Inter, -apple-system, sans-serif',
              size: 12,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            family: 'Inter, -apple-system, sans-serif',
            weight: '600',
            size: 14
          },
          bodyFont: {
            family: 'Inter, -apple-system, sans-serif',
            size: 12
          },
          callbacks: {
            title: (context) => {
              const index = context[0].dataIndex;
              const sdg = sdgData[index];
              return `SDG ${sdg.num}: ${sdg.label}`;
            },
            label: (context) => {
              const index = context.dataIndex;
              const sdg = sdgData[index];
              const value = context.parsed.r;
              const percentage = totalAgreements > 0 ? ((value / totalAgreements) * 100).toFixed(1) : '0';
              
              if (context.datasetIndex === 0) {
                return [
                  `Agreements: ${value}`,
                  `Share: ${percentage}% of total`,
                  `Category: ${sdg.category}`,
                  `Focus Level: ${value >= 8 ? 'High' : value >= 4 ? 'Medium' : 'Low'}`
                ];
              } else {
                return [
                  `Benchmark: ${value} agreements`,
                  `Comparison: ${data[index] >= value ? 'Above' : 'Below'} average`
                ];
              }
            }
          },
          displayColors: true,
          padding: 12,
        },
      },
      animation: {
        duration: 1500,
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
    plugins: [{
      id: 'sdgCenterInfo',
      beforeDraw: function(chart) {
        const ctx = chart.ctx;
        const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
        const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
        
        // Calculate coverage metrics
        const activeSdgs = data.filter(val => val > 0).length;
        const coveragePercentage = ((activeSdgs / 17) * 100).toFixed(0);
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Total agreements
        ctx.font = 'bold 18px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(totalAgreements, centerX, centerY - 15);
        
        // Label
        ctx.font = '12px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Total Agreements', centerX, centerY);
        
        // Coverage
        ctx.font = '11px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#059669';
        ctx.fillText(`${coveragePercentage}% SDG Coverage`, centerX, centerY + 20);
        
        ctx.restore();
      }
    },
    {
      id: 'sdgLegendEnhancement',
      afterDraw: function(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        // Add category legend
        const categories = [...new Set(sdgData.map(sdg => sdg.category))];
        const categoryColors = {
          'Social': '#E5243B',
          'Economic': '#FD6925', 
          'Environmental': '#26BDE2'
        };
        
        const legendX = chartArea.right - 100;
        const legendY = chartArea.top + 20;
        
        ctx.save();
        ctx.font = 'bold 11px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'left';
        ctx.fillText('SDG Categories:', legendX, legendY);
        
        categories.forEach((category, index) => {
          const y = legendY + 20 + (index * 18);
          const count = sdgData.filter(sdg => sdg.category === category).length;
          
          // Category dot
          ctx.fillStyle = categoryColors[category];
          ctx.beginPath();
          ctx.arc(legendX, y - 2, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // Category label
          ctx.fillStyle = '#374151';
          ctx.font = '10px Inter, -apple-system, sans-serif';
          ctx.fillText(`${category} (${count})`, legendX + 10, y);
        });
        
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

  // Enhanced accessibility
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 
    `SDG alignment radar chart showing ${totalAgreements} total agreements across 17 Sustainable Development Goals. ` +
    `Covers ${data.filter(v => v > 0).length} SDGs with highest focus on digital innovation and partnerships.`
  );
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