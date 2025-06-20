/**
 * Agreements by Theme – vertical bar chart.
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

  canvas.__chart = new Chart(ctx, {
    type: 'bar',
    plugins,
    data: {
      labels,
      datasets: [{
        label: 'Agreements',
        data,
        borderRadius: 6,
        backgroundColor: '#094EB2',
        maxBarThickness: 32,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false },
             ticks: { font: { family: 'Roboto', size: 12 }, color: '#333' } },
        y: { beginAtZero: true,
             ticks: { precision: 0,
                      font: { family: 'Roboto', size: 12 }, color: '#666' },
             grid: { color: 'rgba(9, 78, 178, 0.1)' } }
      },
      plugins: {
        legend: { display: false },
        datalabels: ChartDataLabels ? {
          anchor: 'end',
          align: 'top',
          font: { family: 'Roboto', weight: '600', size: 11 },
          color: '#333',
          formatter: v => v
        } : undefined,
        tooltip: {
          callbacks: {
            title: ctx => ctx[0].label,
            label: ctx =>
              `${ctx.parsed.y} agreement${ctx.parsed.y === 1 ? '' : 's'}`
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
