/**
 * Cooperation Diversity Index - Multi-dimensional diversity analysis across themes, actors, and geography
 * Uses Shannon diversity index and other metrics to assess variety and inclusivity in cooperation initiatives
 */
export const renderDiversityRadarChart = async (data) => {
  const container = document.getElementById('diversity-radar-chart');
  if (!container) return console.warn('Diversity radar chart container missing');

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

  // Use the provided data (now comes from real backend data via fetchDiversityData)
  const diversityData = data || {
    dimensions: {
      'Partnership Themes': { value: 0, description: 'Diversity of cooperation themes and focus areas', categories: 0, shannonIndex: 0 },
      'Stakeholder Types': { value: 0, description: 'Variety of participating organizations and actors', categories: 0, shannonIndex: 0 },
      'Geographic Coverage': { value: 0, description: 'Spatial distribution of cooperation initiatives', categories: 0, shannonIndex: 0 },
      'Economic Sectors': { value: 0, description: 'Range of economic sectors involved', categories: 0, shannonIndex: 0 },
      'Cooperation Mechanisms': { value: 0, description: 'Types of cooperation instruments used', categories: 0, shannonIndex: 0 },
      'Beneficiary Reach': { value: 0, description: 'Inclusivity of target populations', categories: 0, shannonIndex: 0 },
      'Financial Instruments': { value: 0, description: 'Diversity of funding sources and mechanisms', categories: 0, shannonIndex: 0 },
      'Implementation Timeline': { value: 0, description: 'Temporal spread of cooperation activities', categories: 0, shannonIndex: 0 }
    }
  };

  const labels = Object.keys(diversityData.dimensions);
  const values = Object.values(diversityData.dimensions).map(dim => dim.value);
  const maxValue = 100;

  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Current Cooperation Diversity',
          data: values,
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          borderColor: '#2563EB',
          borderWidth: 3,
          pointBackgroundColor: '#2563EB',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#1d4ed8',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3,
          fill: true
        },
        {
          label: 'Optimal Diversity Target',
          data: [90, 85, 95, 80, 75, 92, 78, 88],
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          borderColor: '#059669',
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#059669',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false
        },
        {
          label: 'Regional Benchmark',
          data: [75, 70, 80, 65, 60, 78, 68, 72],
          backgroundColor: 'rgba(251, 188, 4, 0.1)',
          borderColor: '#FBBC04',
          borderWidth: 2,
          borderDash: [2, 2],
          pointBackgroundColor: '#FBBC04',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: ['Cooperation Diversity Index', '(BETA)'],
          font: {
            size: 18,
            weight: 'bold',
            family: 'Inter, -apple-system, sans-serif'
          },
          color: '#1f2937',
          padding: {
            top: 10,
            bottom: 20
          }
        },
        subtitle: {
          display: true,
          text: 'Multi-dimensional analysis of cooperation initiative diversity',
          font: {
            size: 12,
            style: 'italic',
            family: 'Inter, -apple-system, sans-serif'
          },
          color: '#6b7280',
          padding: {
            bottom: 15
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
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
          displayColors: true,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const datasetLabel = context.dataset.label;
              const value = context.parsed.r;
              return `${datasetLabel}: ${value}/100 (${value >= 90 ? 'Excellent' : value >= 70 ? 'Good' : value >= 50 ? 'Fair' : 'Needs Improvement'})`;
            },
            afterBody: function(context) {
              const label = context[0].label;
              const dimension = diversityData.dimensions[label];
              
              if (dimension && context[0].datasetIndex === 0) {
                return [
                  '',
                  `📊 Categories: ${dimension.categories}`,
                  `🔍 Shannon Index: ${dimension.shannonIndex}`,
                  `💡 ${dimension.description}`,
                  '',
                  '🎯 Higher scores indicate greater diversity in cooperation initiatives'
                ];
              }
              return [];
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: maxValue,
          ticks: {
            stepSize: 20,
            font: {
              size: 10
            },
            callback: function(value) {
              return value;
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
          },
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
          },
          pointLabels: {
            font: {
              size: 10,
              weight: '500'
            },
            color: '#374151',
            callback: function(label) {
              // Better wrapping for cooperation-specific labels
              const maxLineLength = 10;
              if (label.length > maxLineLength) {
                const words = label.split(' ');
                if (words.length > 1) {
                  // Try to split at meaningful boundaries
                  if (words.length === 2) {
                    return words;
                  } else {
                    const mid = Math.ceil(words.length / 2);
                    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
                  }
                } else {
                  // Single long word - try to break at meaningful points
                  if (label.includes('Coverage')) {
                    return [label.replace('Coverage', ''), 'Coverage'];
                  } else if (label.includes('Mechanisms')) {
                    return [label.replace('Mechanisms', ''), 'Mechanisms'];
                  }
                }
              }
              return label;
            }
          }
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'point'
      }
    },
    plugins: [{
      id: 'diversityInsights',
      afterDraw: function(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        // Calculate overall diversity score
        const avgScore = (values.reduce((a, b) => a + b) / values.length).toFixed(1);
        const targetAvg = 84.125; // Average of target values
        const benchmarkAvg = 71; // Average of benchmark values
        
        // Determine performance level for cooperation diversity
        let performanceLevel = 'Emerging';
        let performanceColor = '#DC2626';
        let performanceIcon = '⚠️';
        
        if (avgScore >= targetAvg * 0.9) {
          performanceLevel = 'Highly Diverse';
          performanceColor = '#059669';
          performanceIcon = '🌟';
        } else if (avgScore >= benchmarkAvg) {
          performanceLevel = 'Well Diversified';
          performanceColor = '#FBBC04';
          performanceIcon = '✅';
        } else if (avgScore >= benchmarkAvg * 0.8) {
          performanceLevel = 'Moderately Diverse';
          performanceColor = '#F59E0B';
          performanceIcon = '📈';
        }
        
        // Draw enhanced center score
        const centerX = chartArea.left + (chartArea.right - chartArea.left) / 2;
        const centerY = chartArea.top + (chartArea.bottom - chartArea.top) / 2;
        
        // Outer ring for emphasis
        ctx.beginPath();
        ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Inner background circle with better size
        ctx.beginPath();
        ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
        ctx.strokeStyle = performanceColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Score text with better positioning
        ctx.fillStyle = performanceColor;
        ctx.font = 'bold 16px Inter, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(avgScore, centerX, centerY - 10);
        
        // Label with cooperation context - better spacing
        ctx.fillStyle = '#6b7280';
        ctx.font = '8px Inter, -apple-system, sans-serif';
        ctx.fillText('Cooperation', centerX, centerY + 6);
        ctx.fillText('Diversity Index', centerX, centerY + 16);
        
        // Performance indicator with better spacing
        const indicatorY = chartArea.bottom - 30;
        
        // Background for status text
        const statusWidth = 280;
        const statusHeight = 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(centerX - statusWidth/2, indicatorY - 12, statusWidth, statusHeight);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX - statusWidth/2, indicatorY - 12, statusWidth, statusHeight);
        
        // Status text with proper alignment
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 11px Inter, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Icon and label
        ctx.fillText(`${performanceIcon} Status:`, centerX - 60, indicatorY);
        
        // Performance level
        ctx.fillStyle = performanceColor;
        ctx.font = 'bold 11px Inter, -apple-system, sans-serif';
        ctx.fillText(performanceLevel, centerX + 40, indicatorY);
      }
    },
    {
      id: 'cooperationDiversityLegend',
      afterDraw: function(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        // Draw cooperation diversity interpretation guide
        const guideX = chartArea.right - 145;
        const guideY = chartArea.top + 40;
        
        // Background with rounded corners effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(guideX - 10, guideY - 5, 150, 100);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.strokeRect(guideX - 10, guideY - 5, 150, 100);
        
        // Header with beta indicator
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 11px Inter, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Cooperation Diversity Scale:', guideX, guideY + 10);
        
        // Beta indicator
        ctx.fillStyle = '#7c3aed';
        ctx.font = '8px Inter, -apple-system, sans-serif';
        ctx.fillText('(BETA)', guideX + 125, guideY + 10);
        
        ctx.font = '9px Inter, -apple-system, sans-serif';
        const scales = [
          { range: '90-100', label: 'Highly Diverse', color: '#059669', icon: '🌟' },
          { range: '70-89', label: 'Well Diversified', color: '#FBBC04', icon: '✅' },
          { range: '50-69', label: 'Moderately Diverse', color: '#F59E0B', icon: '📈' },
          { range: '0-49', label: 'Emerging Diversity', color: '#DC2626', icon: '⚠️' }
        ];
        
        scales.forEach((scale, index) => {
          const y = guideY + 28 + (index * 14);
          
          // Color indicator
          ctx.fillStyle = scale.color;
          ctx.fillRect(guideX, y - 4, 8, 8);
          
          // Icon
          ctx.font = '10px Arial';
          ctx.fillText(scale.icon, guideX + 12, y + 1);
          
          // Text
          ctx.font = '9px Inter, -apple-system, sans-serif';
          ctx.fillStyle = '#374151';
          ctx.fillText(`${scale.range}: ${scale.label}`, guideX + 24, y);
        });
        
        // Footer note
        ctx.fillStyle = '#6b7280';
        ctx.font = '8px Inter, -apple-system, sans-serif';
        ctx.fillText('Based on cooperation initiative', guideX, guideY + 90);
        ctx.fillText('analysis across 8 dimensions', guideX, guideY + 100);
      }
    }]
  });

  canvas.__chart = chart;
  container.classList.remove('loading');
  
  return chart;
};
