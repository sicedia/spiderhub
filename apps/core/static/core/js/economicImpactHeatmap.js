/**
 * Economic Impact Heatmap - Matrix visualization showing economic impact across sectors and regions
 * Uses Chart.js matrix chart to display cross-dimensional value analysis
 */
export const renderEconomicImpactHeatmap = async (data) => {
  const container = document.getElementById('economic-impact-heatmap');
  if (!container) return console.warn('Economic impact heatmap container missing');

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
  if (!Chart) return console.error('Chart.js not loaded');

  // Mock data structure for economic impact
  const mockData = data || {
    sectors: ['Digital Infrastructure', 'AI & Innovation', 'E-Government', 'Cybersecurity', 'Digital Skills', 'Green Tech'],
    regions: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Mexico', 'Peru', 'Ecuador', 'EU-27'],
    impact_matrix: [
      [85, 72, 68, 91, 45, 78, 52, 95], // Digital Infrastructure
      [78, 89, 82, 67, 71, 65, 48, 92], // AI & Innovation
      [92, 85, 88, 84, 78, 72, 69, 88], // E-Government
      [67, 75, 91, 89, 82, 78, 71, 94], // Cybersecurity
      [88, 82, 79, 76, 85, 89, 92, 87], // Digital Skills
      [75, 78, 85, 82, 67, 71, 78, 89]  // Green Tech
    ]
  };

  // Prepare data for matrix chart
  const matrixData = [];
  mockData.impact_matrix.forEach((row, sectorIndex) => {
    row.forEach((value, regionIndex) => {
      matrixData.push({
        x: regionIndex,
        y: sectorIndex,
        v: value
      });
    });
  });

  // Color scale function
  const getColor = (value) => {
    const intensity = value / 100;
    if (intensity < 0.3) return `rgba(220, 38, 38, ${0.3 + intensity * 0.7})`;
    if (intensity < 0.6) return `rgba(251, 188, 4, ${0.3 + intensity * 0.7})`;
    if (intensity < 0.8) return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
    return `rgba(5, 150, 105, ${0.3 + intensity * 0.7})`;
  };

  const chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Economic Impact Score',
        data: matrixData,
        backgroundColor: function(context) {
          if (context.parsed) {
            return getColor(context.parsed.v);
          }
          return 'rgba(0, 0, 0, 0.1)';
        },
        borderColor: '#ffffff',
        borderWidth: 2,
        pointRadius: function(context) {
          if (context.parsed) {
            return 15 + (context.parsed.v / 100) * 10; // Size based on value
          }
          return 15;
        },
        pointHoverRadius: function(context) {
          if (context.parsed) {
            return 18 + (context.parsed.v / 100) * 12;
          }
          return 18;
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: function(context) {
              const point = context[0];
              const sector = mockData.sectors[point.parsed.y];
              const region = mockData.regions[point.parsed.x];
              return `${sector} × ${region}`;
            },
            label: function(context) {
              const impact = context.parsed.v;
              let impactLevel = 'Low';
              if (impact >= 80) impactLevel = 'Very High';
              else if (impact >= 65) impactLevel = 'High';
              else if (impact >= 45) impactLevel = 'Medium';
              
              return [
                `Impact Score: ${impact}/100`,
                `Impact Level: ${impactLevel}`,
                `Relative Strength: ${((impact / Math.max(...mockData.impact_matrix.flat())) * 100).toFixed(0)}%`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Regions',
            font: {
              size: 14,
              weight: '600'
            }
          },
          min: -0.5,
          max: mockData.regions.length - 0.5,
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return mockData.regions[value] || '';
            },
            maxRotation: 45,
            font: {
              size: 11
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: 'Sectors',
            font: {
              size: 14,
              weight: '600'
            }
          },
          min: -0.5,
          max: mockData.sectors.length - 0.5,
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return mockData.sectors[value] || '';
            },
            font: {
              size: 11
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'point'
      }
    },
    plugins: [{
      id: 'heatmapLegend',
      afterDraw: function(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        // Draw color scale legend
        const legendWidth = 200;
        const legendHeight = 15;
        const legendX = chartArea.right - legendWidth - 20;
        const legendY = chartArea.top + 20;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
        gradient.addColorStop(0, 'rgba(220, 38, 38, 0.6)');
        gradient.addColorStop(0.3, 'rgba(251, 188, 4, 0.7)');
        gradient.addColorStop(0.6, 'rgba(34, 197, 94, 0.8)');
        gradient.addColorStop(1, 'rgba(5, 150, 105, 1)');
        
        // Draw legend background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(legendX - 10, legendY - 5, legendWidth + 20, legendHeight + 40);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.strokeRect(legendX - 10, legendY - 5, legendWidth + 20, legendHeight + 40);
        
        // Draw gradient bar
        ctx.fillStyle = gradient;
        ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
        
        // Draw scale labels
        ctx.fillStyle = '#374151';
        ctx.font = '11px Inter, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Low', legendX, legendY + legendHeight + 15);
        ctx.textAlign = 'center';
        ctx.fillText('Medium', legendX + legendWidth / 2, legendY + legendHeight + 15);
        ctx.textAlign = 'right';
        ctx.fillText('High', legendX + legendWidth, legendY + legendHeight + 15);
        
        // Title
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Inter, -apple-system, sans-serif';
        ctx.fillText('Impact Score', legendX + legendWidth / 2, legendY - 10);
      }
    },
    {
      id: 'heatmapStats',
      afterDraw: function(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        // Calculate statistics
        const allValues = mockData.impact_matrix.flat();
        const avgImpact = (allValues.reduce((a, b) => a + b) / allValues.length).toFixed(1);
        const maxImpact = Math.max(...allValues);
        const minImpact = Math.min(...allValues);
        
        // Find highest impact combination
        let maxSector = '', maxRegion = '';
        mockData.impact_matrix.forEach((row, sectorIndex) => {
          row.forEach((value, regionIndex) => {
            if (value === maxImpact) {
              maxSector = mockData.sectors[sectorIndex];
              maxRegion = mockData.regions[regionIndex];
            }
          });
        });
        
        // Draw statistics box
        const statsX = chartArea.left + 20;
        const statsY = chartArea.bottom - 80;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(statsX - 10, statsY - 5, 280, 70);
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.3)';
        ctx.strokeRect(statsX - 10, statsY - 5, 280, 70);
        
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 12px Inter, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Key Insights:', statsX, statsY + 12);
        
        ctx.font = '11px Inter, -apple-system, sans-serif';
        ctx.fillText(`Average Impact: ${avgImpact}/100`, statsX, statsY + 28);
        ctx.fillText(`Range: ${minImpact} - ${maxImpact}`, statsX, statsY + 42);
        ctx.fillText(`Highest: ${maxSector} × ${maxRegion} (${maxImpact})`, statsX, statsY + 56);
      }
    }]
  });

  canvas.__chart = chart;
  container.classList.remove('loading');
  
  return chart;
};
