/**
 * Agreements by Beneficiary-Category – horizontal bar
 * Espera { "General": 12, "Age Groups": 3, … }
 */
export const renderBeneficiaryBar = async (counts) => {
  const container = document.getElementById('beneficiary-bar-chart');
  if (!container) return console.warn('Beneficiary bar chart container missing');

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
        backgroundColor: [
          '#094EB2','#0f63c9','#1680e0','#1c9cf0','#22b0ff','#4cc0ff'
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
          ticks: { precision:0, font:{family:'Roboto',size:12}, color:'#666' },
          grid: { color:'rgba(9,78,178,0.1)' }
        },
        y: {
          grid: { display:false },
          ticks: { font:{family:'Roboto',size:12,weight:'500'}, color:'#333' }
        }
      },
      plugins: {
        legend: { display:false },
        datalabels: ChartDataLabels ? {
          anchor:'end', align:'right', padding:4,
          font:{family:'Roboto',weight:'600',size:11},
          color:'#333',
          formatter:v=>v
        } : undefined,
        tooltip: {
          callbacks: {
            title: () => '',
            label: ctx => ` ${ctx.label}: ${ctx.parsed.x} agreement${ctx.parsed.x!==1?'s':''}`
          }
        }
      },
      animation: {
        duration:700,
        easing:'easeOutCubic',
        onComplete: () => container.classList.remove('loading')
      }
    }
  });

  const ro = new ResizeObserver(() => canvas.__chart?.resize());
  ro.observe(container);
  canvas.__resizeObserver = ro;
};
