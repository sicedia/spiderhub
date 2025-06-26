/**
 * Agreements by Actor-Type – Enhanced horizontal bar chart using D3.js
 * Expects { "Political Actors": 10, "Academic Institutions": 5, ... }
 */
export const renderActorBar = async (counts) => {
  const container = document.getElementById('actor-bar-chart');
  if (!container) return;

  // Wait for D3 to be available (add to HTML if not already included)
  if (typeof d3 === 'undefined') {
    // Fallback to Chart.js implementation
    return renderActorBarFallback(counts);
  }

  container.classList.add('loading');

  // Clear previous content
  d3.select(container).selectAll('*').remove();

  // Sort data by value (descending)
  const sortedData = Object.entries(counts)
    .map(([key, value]) => ({ actor: key, count: value }))
    .sort((a, b) => b.count - a.count);

  if (sortedData.length === 0) {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #9CA3AF; font-family: Roboto;">
        <div style="text-align: center;">
          <div style="font-size: 16px; margin-bottom: 8px;">No actor data available</div>
          <div style="font-size: 14px;">Data will appear here once agreements are analyzed</div>
        </div>
      </div>
    `;
    container.classList.remove('loading');
    return;
  }

  // Set dimensions and margins
  const margin = { top: 20, right: 60, bottom: 40, left: 120 };
  const containerRect = container.getBoundingClientRect();
  const width = containerRect.width - margin.left - margin.right;
  const height = Math.max(300, sortedData.length * 40) - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .attr('role', 'img')
    .attr('aria-label', `Actor distribution chart showing agreements across ${sortedData.length} actor types`);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(sortedData, d => d.count)])
    .range([0, width]);

  const yScale = d3.scaleBand()
    .domain(sortedData.map(d => d.actor))
    .range([0, height])
    .padding(0.2);

  // Color scale
  const colorScale = d3.scaleOrdinal()
    .domain(sortedData.map(d => d.actor))
    .range([
      '#2563EB', // Blue
      '#059669', // Emerald  
      '#DC2626', // Red
      '#D97706', // Amber
      '#7C3AED', // Purple
      '#0891B2', // Cyan
      '#C2410C', // Orange
      '#BE185D', // Pink
      '#4338CA', // Indigo
      '#059212'  // Green
    ]);

  // Create axes
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.format('d'))
    .ticks(Math.min(10, d3.max(sortedData, d => d.count)));

  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => d.length > 20 ? d.substring(0, 17) + '...' : d);

  // Add axes
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('font-family', 'Roboto')
    .style('font-size', '12px')
    .style('fill', '#6B7280');

  g.append('g')
    .attr('class', 'y-axis')
    .call(yAxis)
    .selectAll('text')
    .style('font-family', 'Roboto')
    .style('font-size', '12px')
    .style('font-weight', '500')
    .style('fill', '#374151');

  // Style axes
  g.selectAll('.domain, .tick line')
    .style('stroke', '#E5E7EB')
    .style('stroke-width', 1);

  // Add grid lines
  g.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis
      .tickSize(-height)
      .tickFormat('')
    )
    .selectAll('line')
    .style('stroke', 'rgba(107, 114, 128, 0.1)')
    .style('stroke-width', 1);

  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'actor-chart-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(17, 24, 39, 0.95)')
    .style('color', '#F9FAFB')
    .style('padding', '12px')
    .style('border-radius', '8px')
    .style('font-family', 'Roboto')
    .style('font-size', '13px')
    .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
    .style('pointer-events', 'none')
    .style('z-index', '1000');

  // Calculate total for percentages
  const total = d3.sum(sortedData, d => d.count);

  // Create bars
  const bars = g.selectAll('.bar')
    .data(sortedData)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.actor))
    .attr('width', 0) // Start with 0 width for animation
    .attr('height', yScale.bandwidth())
    .attr('rx', 6)
    .attr('ry', 6)
    .style('fill', d => colorScale(d.actor))
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      // Highlight bar
      d3.select(this)
        .style('fill', d3.color(colorScale(d.actor)).darker(0.2));
      
      // Show tooltip
      const percentage = ((d.count / total) * 100).toFixed(1);
      const agreementText = d.count === 1 ? 'agreement' : 'agreements';
      
      tooltip
        .style('visibility', 'visible')
        .html(`
          <div style="font-weight: 600; margin-bottom: 4px;">${d.actor}</div>
          <div>${d.count} ${agreementText}</div>
          <div>${percentage}% of total</div>
          <div style="font-size: 11px; color: #D1D5DB; margin-top: 4px;">Rank: #${sortedData.indexOf(d) + 1}</div>
        `);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function(event, d) {
      // Reset bar color
      d3.select(this)
        .style('fill', colorScale(d.actor));
      
      // Hide tooltip
      tooltip.style('visibility', 'hidden');
    });

  // Animate bars
  bars.transition()
    .duration(800)
    .ease(d3.easeQuadOut)
    .attr('width', d => xScale(d.count))
    .on('end', () => container.classList.remove('loading'));

  // Add value labels
  const labels = g.selectAll('.bar-label')
    .data(sortedData)
    .enter().append('text')
    .attr('class', 'bar-label')
    .attr('x', d => xScale(d.count) + 8)
    .attr('y', d => yScale(d.actor) + yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-family', 'Roboto')
    .style('font-size', '11px')
    .style('font-weight', '600')
    .style('fill', '#374151')
    .style('opacity', 0)
    .text(d => {
      const percentage = ((d.count / total) * 100).toFixed(0);
      return d.count > 0 ? `${d.count} (${percentage}%)` : d.count;
    });

  // Animate labels
  labels.transition()
    .duration(800)
    .delay(400)
    .ease(d3.easeQuadOut)
    .style('opacity', 1);

  // Add chart title
  g.append('text')
    .attr('x', width / 2)
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .style('font-family', 'Roboto')
    .style('font-size', '14px')
    .style('font-weight', '600')
    .style('fill', '#374151')
    .text('Agreements by Actor Type');

  // Handle window resize
  const handleResize = () => {
    const newRect = container.getBoundingClientRect();
    const newWidth = newRect.width - margin.left - margin.right;
    
    if (Math.abs(newWidth - width) > 50) {
      // Re-render if significant size change
      renderActorBar(counts);
    }
  };

  window.addEventListener('resize', handleResize);
  
  // Store cleanup function
  container._cleanup = () => {
    window.removeEventListener('resize', handleResize);
    tooltip.remove();
  };
};

/**
 * Fallback Chart.js implementation for when D3 is not available
 */
const renderActorBarFallback = async (counts) => {
  const container = document.getElementById('actor-bar-chart');
  if (!container) return;

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

  // Sort data by value (descending)
  const sortedEntries = Object.entries(counts)
    .sort(([,a], [,b]) => b - a);

  const labels = sortedEntries.map(([label]) => label);
  const data = sortedEntries.map(([, value]) => value);

  const total = data.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(...data);

  canvas.__chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Number of Agreements',
        data,
        backgroundColor: [
          '#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED',
          '#0891B2', '#C2410C', '#BE185D', '#4338CA', '#059212'
        ],
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { left: 10, right: 30, top: 15, bottom: 15 }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: maxValue > 0 ? Math.ceil(maxValue * 1.15) : 10,
          ticks: {
            stepSize: Math.ceil(maxValue / 6) || 1,
            font: { family: 'Roboto', size: 12 },
            color: '#6B7280'
          },
          grid: { color: 'rgba(107, 114, 128, 0.1)' }
        },
        y: {
          ticks: {
            font: { family: 'Roboto', size: 12, weight: '500' },
            color: '#374151',
            callback: function(value) {
              const label = this.getLabelForValue(value);
              return label.length > 20 ? label.substring(0, 17) + '...' : label;
            }
          },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#F9FAFB',
          bodyColor: '#F3F4F6',
          callbacks: {
            title: (context) => context[0].label,
            label: (context) => {
              const value = context.parsed.x;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const agreementText = value === 1 ? 'agreement' : 'agreements';
              return [
                `${value} ${agreementText}`,
                `${percentage}% of total`,
                `Rank: #${context.dataIndex + 1}`
              ];
            }
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
        onComplete: () => container.classList.remove('loading')
      }
    }
  });
};

/**
 * Clean up chart and observers
 */
export const destroyActorBar = (containerId = 'actor-bar-chart') => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (container._cleanup) {
    container._cleanup();
    container._cleanup = null;
  }
  
  // Clean up tooltips
  d3.selectAll('.actor-chart-tooltip').remove();
  
  const canvas = container.querySelector('canvas');
  if (canvas && canvas.__chart) {
    canvas.__chart.destroy();
    canvas.__chart = null;
  }
};