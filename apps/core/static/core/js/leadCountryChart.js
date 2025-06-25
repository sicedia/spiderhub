/**
 * Lead Country Chart Module
 * Renders horizontal bar chart showing documents by lead country
 */

/**
 * Render horizontal bar chart of lead countries.
 * @param {Object.<string, number>} counts - e.g. { "Brazil": 25, "Argentina": 18, "Chile": 12 }
 */
export const renderLeadCountryChart = async (counts) => {
  console.log('=== LEAD COUNTRY CHART RENDER ===');
  console.log('Received counts:', counts);
  console.log('Counts type:', typeof counts);
  console.log('Counts keys:', Object.keys(counts || {}));
  console.log('Counts values:', Object.values(counts || {}));
  
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

  // Check if chartjs-plugin-datalabels is available
  const ChartDataLabels = window.ChartDataLabels;
  const plugins = ChartDataLabels ? [ChartDataLabels] : [];

  // Prepare data - sort by count descending and take top countries
  const sortedEntries = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10); // Show top 10 countries

  console.log('Sorted entries for chart:', sortedEntries);

  const labels = sortedEntries.map(([country]) => country);
  const data = sortedEntries.map(([, count]) => count);

  console.log('Chart labels (country names):', labels);
  console.log('Chart data:', data);

  canvas.__chart = new Chart(ctx, {
    type: 'bar',
    plugins: plugins,
    data: {
      labels,
      datasets: [{
        label: 'Documents',
        data,
        borderRadius: 6,
        backgroundColor: [
          '#094EB2','#0f63c9','#1680e0','#1c9cf0','#22b0ff','#4cc0ff',
          '#66d4ff','#80dcff','#99e4ff','#b3ebff'
        ],
        maxBarThickness: 28
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          ticks: { 
            precision: 0, 
            font: { family: 'Roboto', size: 12 }, 
            color: '#666' 
          },
          grid: { color: 'rgba(9,78,178,0.1)' }
        },
        y: {
          grid: { display: false },
          ticks: { 
            font: { family: 'Roboto', size: 12, weight: '500' }, 
            color: '#333' 
          }
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: ChartDataLabels ? {
          anchor: 'end', 
          align: 'right', 
          padding: 4,
          font: { family: 'Roboto', weight: '600', size: 11 },
          color: '#333',
          formatter: v => v
        } : undefined,
        tooltip: {
          callbacks: {
            title: () => '',
            label: ctx => ` ${ctx.label}: ${ctx.parsed.x} document${ctx.parsed.x !== 1 ? 's' : ''}`
          }
        }
      },
      animation: {
        duration: 700,
        easing: 'easeOutCubic',
        onComplete: () => container.classList.remove('loading')
      }
    }
  });

  const ro = new ResizeObserver(() => canvas.__chart?.resize());
  ro.observe(container);
  canvas.__resizeObserver = ro;
};