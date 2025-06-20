/**
 * Coverage Scope Bar Chart Module
 * Renders horizontal bar chart showing agreements by coverage scope
 */

/**
 * Render horizontal bar chart of coverage scopes.
 * @param {{bilateral:number, subRegional:number, regional:number, multilateral:number, global:number}} counts
 */
export const renderCoverageBar = async (counts) => {
  const container = document.getElementById('coverage-bar-chart');
  if (!container) {
    console.warn('Coverage bar chart container not found');
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

  const labels = [
    'Regional',
    'Bilateral', 
    'Multilateral',
    'National',
    'Global',
    'Sub-regional',
    'Uncategorised',
  ];

  const data = [
    counts.regional        ?? 0,
    counts.bilateral       ?? 0,
    counts.multilateral    ?? 0,
    counts.national        ?? 0,
    counts.global          ?? 0,
    counts.subRegional     ?? 0,
    counts.uncategorised   ?? 0,
  ];

  canvas.__chart = new Chart(ctx, {
    type: 'bar',
    plugins: plugins,
    data: {
      labels,
      datasets: [{
        label: 'Agreements',
        data,
        backgroundColor: [
          '#094EB2',
          '#0f63c9',
          '#1680e0',
          '#1c9cf0',
          '#22b0ff',
        ],
        borderRadius: 6,
        maxBarThickness: 28,
        borderWidth: 0,
      }],
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
            font: {
              family: 'Roboto',
              size: 12
            },
            color: '#666'
          },
          grid: { 
            color: 'rgba(9, 78, 178, 0.1)',
            lineWidth: 1
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            font: {
              family: 'Roboto',
              size: 12,
              weight: '500'
            },
            color: '#333'
          }
        },
      },
      plugins: {
        legend: { display: false },
        datalabels: ChartDataLabels ? {
          anchor: 'end',
          align: 'right',
          color: '#333',
          font: { 
            weight: '600',
            family: 'Roboto',
            size: 11
          },
          formatter: v => v,
          padding: 4,
        } : undefined,
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: '#094EB2',
          borderWidth: 1,
          cornerRadius: 6,
          titleFont: {
            family: 'Roboto',
            weight: '600'
          },
          bodyFont: {
            family: 'Roboto'
          },
          callbacks: {
            title: (context) => '',
            label: (context) => ` ${context.label}: ${context.parsed.x} agreement${context.parsed.x !== 1 ? 's' : ''}`,
          },
        },
      },
      animation: {
        duration: 700,
        easing: 'easeOutCubic',
        onComplete: () => {
          container.classList.remove('loading');
        },
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    },
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