/**
 * Agreements by Theme – pie chart for better proportion visualization.
 * Recibe { "<Theme label>": <nº acuerdos>, … }
 */
export const renderThemeBar = async (counts) => {
  const container = document.getElementById('theme-bar-chart');
  if (!container) return console.warn('Theme bar chart container missing');

  // crea / reutiliza canvas
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
  if (!Chart) return console.error('Chart.js no cargado');

  const ChartDataLabels = window.ChartDataLabels;
  const plugins = ChartDataLabels ? [ChartDataLabels] : [];

  const labels = Object.keys(counts);
  const data   = Object.values(counts);
  
  // Generate distinct colors for each theme
  const colors = [
    '#094EB2', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3',
    '#FF9F43', '#10AC84', '#EE5A6F', '#C44569', '#F8B500'
  ];

  canvas.__chart = new Chart(ctx, {
    type: 'pie',
    plugins,
    data: {
      labels,
      datasets: [{
        label: 'Agreements',
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            padding: 20,
            font: { family: 'Roboto', size: 12 },
            color: '#333',
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        datalabels: ChartDataLabels ? {
          color: '#fff',
          font: { family: 'Roboto', weight: '600', size: 11 },
          formatter: (value, ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return percentage > 5 ? `${percentage}%` : ''; // Only show labels for segments > 5%
          }
        } : undefined,
        tooltip: {
          callbacks: {
            title: ctx => ctx[0].label,
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((ctx.parsed / total) * 100).toFixed(1);
              return `${ctx.parsed} agreement${ctx.parsed === 1 ? '' : 's'} (${percentage}%)`;
            }
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

  // Responsivo
  const ro = new ResizeObserver(() => canvas.__chart?.resize());
  ro.observe(container);
  canvas.__resizeObserver = ro;
};