/**
 * Investment Flow Chart - Sunburst visualization for multi-level investment distribution
 * Shows hierarchical flow of investments across initiative types, funding sources, and sectors
 */
export const renderInvestmentFlowChart = async (data) => {
  const container = document.getElementById('investment-flow-chart');
  if (!container) return console.warn('Investment flow chart container missing');

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

  // Mock data structure for investment flow
  const mockData = data || {
    public_funding: {
      bilateral: { amount: 125000000, initiatives: 15 },
      multilateral: { amount: 380000000, initiatives: 28 },
      eu_programs: { amount: 620000000, initiatives: 42 }
    },
    private_investment: {
      direct_investment: { amount: 890000000, initiatives: 67 },
      partnerships: { amount: 340000000, initiatives: 23 },
      venture_capital: { amount: 180000000, initiatives: 31 }
    },
    hybrid_funding: {
      public_private: { amount: 250000000, initiatives: 19 },
      development_banks: { amount: 420000000, initiatives: 34 }
    }
  };

  // Prepare data for sunburst-style doughnut chart
  const prepareChartData = (data) => {
    const categories = [];
    const amounts = [];
    const colors = [];
    const subcategories = [];

    const categoryColors = {
      'Public Funding': ['#2563EB', '#3B82F6', '#60A5FA'],
      'Private Investment': ['#059669', '#10B981', '#34D399'],
      'Hybrid Funding': ['#DC2626', '#EF4444', '#F87171']
    };

    Object.entries(data).forEach(([mainCategory, subData], categoryIndex) => {
      const categoryName = mainCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const categoryTotal = Object.values(subData).reduce((sum, item) => sum + item.amount, 0);
      
      categories.push(categoryName);
      amounts.push(categoryTotal);
      colors.push(Object.values(categoryColors)[categoryIndex][0]);
      
      // Add subcategories
      Object.entries(subData).forEach(([subCategory, subValue], subIndex) => {
        const subName = subCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        subcategories.push({
          label: subName,
          amount: subValue.amount,
          initiatives: subValue.initiatives,
          parent: categoryName,
          color: Object.values(categoryColors)[categoryIndex][subIndex + 1]
        });
      });
    });

    return { categories, amounts, colors, subcategories };
  };

  const chartData = prepareChartData(mockData);

  // Create nested doughnut chart
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartData.categories,
      datasets: [
        {
          label: 'Investment Categories',
          data: chartData.amounts,
          backgroundColor: chartData.colors,
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverBorderWidth: 4,
          hoverBorderColor: '#ffffff',
          radius: '85%',
          cutout: '45%'
        },
        {
          label: 'Investment Subcategories',
          data: chartData.subcategories.map(sub => sub.amount),
          backgroundColor: chartData.subcategories.map(sub => sub.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverBorderWidth: 3,
          hoverBorderColor: '#ffffff',
          radius: '45%',
          cutout: '20%'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
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
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              
              if (context.datasetIndex === 0) {
                return [
                  `Investment: €${(value / 1000000).toFixed(1)}M`,
                  `Share: ${percentage}%`
                ];
              } else {
                const subcat = chartData.subcategories[context.dataIndex];
                return [
                  `Investment: €${(value / 1000000).toFixed(1)}M`,
                  `Initiatives: ${subcat.initiatives}`,
                  `Share: ${percentage}%`
                ];
              }
            }
          }
        },
        datalabels: {
          display: function(context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = (value / total) * 100;
            return percentage > 8; // Only show labels for segments > 8%
          },
          color: '#ffffff',
          font: {
            weight: 'bold',
            size: 11
          },
          formatter: function(value, context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(0);
            return percentage + '%';
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500,
        easing: 'easeOutQuart'
      },
      interaction: {
        intersect: false,
        mode: 'nearest'
      }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw: function(chart) {
        const ctx = chart.ctx;
        const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
        const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
        
        const total = chartData.amounts.reduce((a, b) => a + b, 0);
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Total amount
        ctx.font = 'bold 20px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(`€${(total / 1000000000).toFixed(1)}B`, centerX, centerY - 10);
        
        // Label
        ctx.font = '14px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Total Investment', centerX, centerY + 15);
        
        ctx.restore();
      }
    }]
  });

  canvas.__chart = chart;
  container.classList.remove('loading');

  // Add click handler for drill-down functionality
  canvas.addEventListener('click', (event) => {
    const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
    if (points.length) {
      const point = points[0];
      const label = chart.data.labels[point.index];
      console.log(`Clicked on: ${label} - implement drill-down functionality`);
      // Here you can implement drill-down to show more detailed breakdown
    }
  });

  return chart;
};
