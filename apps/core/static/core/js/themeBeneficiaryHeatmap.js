/**
 * Heat-map Theme × Beneficiary-Group
 * get an object:
 * {
 *   "Digital Transformation & Strategy": {
 *        "General": 3, "Age Groups": 1, … },
 *   ...
 * }
 */
export const renderThemeBeneficiaryHeatmap = async (matrix) => {
  const container = document.getElementById('heatmap-chart');
  if (!container) return console.warn('Heatmap container not found');

  // canvas único
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

  if (!Chart ) {
    return console.error('Chart.js o chartjs-chart-matrix no cargados');
  }

  const themeCats = Object.keys(matrix);
  const benCats   = Object.keys(matrix[themeCats[0]]);         

  // convierte a puntos {x, y, v}
  const data = [];
  themeCats.forEach((t, xIdx) => {
    benCats.forEach((b, yIdx) => {
      data.push({ x: xIdx, y: yIdx, v: matrix[t][b] });
    });
  });

  // escala de colores sencilla: de claro a azul
  const max = Math.max(...data.map(d => d.v));
  const bgColor = (v) => `rgba(9, 78, 178, ${v / max || 0.05})`;

  canvas.__chart = new Chart(ctx, {
    type: 'matrix',
    data: {
      datasets: [{
        label: 'Documents',
        data,
        backgroundColor: ({raw}) => bgColor(raw.v),
        width: ({chart}) => (chart.chartArea || {}).width / themeCats.length - 2,
        height: ({chart}) => (chart.chartArea || {}).height / benCats.length - 2,
        borderWidth: 1,
        borderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'category',
          labels: themeCats,
          offset: true,
          grid: {display: false},
          ticks: {
            font: {family: 'Roboto', size: 11},
            color: '#333'
          }
        },
        y: {
          type: 'category',
          labels: benCats,
          offset: true,
          grid: {display: false},
          reverse: true,
          ticks: {
            font: {family: 'Roboto', size: 11},
            color: '#333'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: ctx => `${benCats[ctx[0].raw.y]} × ${themeCats[ctx[0].raw.x]}`,
            label:  ctx => `${ctx.raw.v} document${ctx.raw.v === 1 ? '' : 's'}`
          }
        },
        legend: {display: false}
      },
      animation: {
        duration: 600,
        onComplete: () => container.classList.remove('loading')
      }
    }
  });
};
