/**
 * Commitment Timeline Chart - Line chart showing commitment values and trends over time
 * Tracks evolution of financial commitments and their fulfillment patterns
 */
export const renderCommitmentTimelineChart = async (data) => {
  const container = document.getElementById('commitment-timeline-chart');
  if (!container) return console.warn('Commitment timeline chart container missing');

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

  // Mock time series data for commitments
  const mockData = data || {
    timeline: [
      { date: '2020-01', committed: 45000000, fulfilled: 38000000, pending: 7000000 },
      { date: '2020-07', committed: 87000000, fulfilled: 72000000, pending: 15000000 },
      { date: '2021-01', committed: 156000000, fulfilled: 128000000, pending: 28000000 },
      { date: '2021-07', committed: 234000000, fulfilled: 198000000, pending: 36000000 },
      { date: '2022-01', committed: 312000000, fulfilled: 267000000, pending: 45000000 },
      { date: '2022-07', committed: 425000000, fulfilled: 356000000, pending: 69000000 },
      { date: '2023-01', committed: 567000000, fulfilled: 478000000, pending: 89000000 },
      { date: '2023-07', committed: 689000000, fulfilled: 592000000, pending: 97000000 },
      { date: '2024-01', committed: 823000000, fulfilled: 715000000, pending: 108000000 },
      { date: '2024-07', committed: 945000000, fulfilled: 834000000, pending: 111000000 }
    ]
  };

  const labels = mockData.timeline.map(item => {
    const date = new Date(item.date + '-01');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  });

  const committedData = mockData.timeline.map(item => item.committed / 1000000);
  const fulfilledData = mockData.timeline.map(item => item.fulfilled / 1000000);
  const pendingData = mockData.timeline.map(item => item.pending / 1000000);

  // Calculate fulfillment rate
  const fulfillmentRate = mockData.timeline.map(item => 
    (item.fulfilled / item.committed * 100).toFixed(1)
  );

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Committed',
          data: committedData,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#2563EB',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Fulfilled',
          data: fulfilledData,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#059669',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Pending',
          data: pendingData,
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#DC2626',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Fulfillment Rate (%)',
          data: fulfillmentRate,
          borderColor: '#FBBC04',
          backgroundColor: 'rgba(251, 188, 4, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#FBBC04',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          yAxisID: 'y1',
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'line',
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
              return `Period: ${context[0].label}`;
            },
            label: function(context) {
              const datasetLabel = context.dataset.label;
              const value = context.parsed.y;
              
              if (datasetLabel === 'Fulfillment Rate (%)') {
                return `${datasetLabel}: ${value}%`;
              } else {
                return `${datasetLabel}: €${value.toFixed(0)}M`;
              }
            },
            afterBody: function(context) {
              const dataIndex = context[0].dataIndex;
              const item = mockData.timeline[dataIndex];
              const efficiency = ((item.fulfilled / item.committed) * 100).toFixed(1);
              return [`Efficiency Rate: ${efficiency}%`];
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time Period',
            font: {
              size: 14,
              weight: '600'
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Investment Amount (€ Millions)',
            font: {
              size: 14,
              weight: '600'
            },
            color: '#374151'
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            font: {
              size: 11
            },
            callback: function(value) {
              return '€' + value + 'M';
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Fulfillment Rate (%)',
            font: {
              size: 14,
              weight: '600'
            },
            color: '#FBBC04'
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            font: {
              size: 11
            },
            callback: function(value) {
              return value + '%';
            }
          },
          min: 0,
          max: 100
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeOutQuart'
      }
    },
    plugins: [{
      id: 'trendAnnotation',
      afterDatasetsDraw: function(chart) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        
        // Calculate trend for committed values
        const committedTrend = calculateTrend(committedData);
        const lastValue = committedData[committedData.length - 1];
        const trendPercentage = ((committedTrend / lastValue) * 100).toFixed(1);
        
        // Draw trend indicator
        ctx.save();
        ctx.font = 'bold 12px Inter, -apple-system, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        
        const trendColor = committedTrend > 0 ? '#059669' : '#DC2626';
        const trendSymbol = committedTrend > 0 ? '↗' : '↘';
        
        ctx.fillStyle = trendColor;
        ctx.fillText(
          `Trend: ${trendSymbol} ${Math.abs(trendPercentage)}%`, 
          chartArea.right - 10, 
          chartArea.top + 10
        );
        
        ctx.restore();
      }
    }]
  });

  // Helper function to calculate trend
  function calculateTrend(data) {
    if (data.length < 2) return 0;
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  canvas.__chart = chart;
  container.classList.remove('loading');
  
  return chart;
};
