/**
 * Generic Bar Chart Component
 * Reusable bar chart implementation using Chart.js or D3
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { CONFIG } from '../../core/constants/config.js';

export class BarChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
  }

  /**
   * Default options for bar charts
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      orientation: 'vertical', // 'vertical' or 'horizontal'
      showLegend: true,
      showTooltips: true,
      showGrid: true,
      stacked: false,
      maxBars: 20,
      sortBy: 'value', // 'value', 'label', 'none'
      sortOrder: 'desc', // 'asc', 'desc'
      colors: CONFIG.CHARTS.DEFAULT_COLORS,
      margin: {
        top: 20,
        right: 30,
        bottom: 40,
        left: 60
      }
    };
  }

  /**
   * Load chart data - to be implemented by child classes or provided via options
   */
  async loadData() {
    if (this.options.dataSource) {
      if (typeof this.options.dataSource === 'function') {
        this.data = await this.options.dataSource();
      } else {
        this.data = this.options.dataSource;
      }
    } else {
      throw new Error('BarChart requires dataSource option or override loadData method');
    }
  }

  /**
   * Process and validate data
   */
  processData(rawData) {
    if (!Array.isArray(rawData)) {
      throw new Error('Bar chart data must be an array');
    }

    // Ensure data has required properties
    const processedData = rawData.map((item, index) => ({
      label: item.label || item.name || `Item ${index + 1}`,
      value: parseFloat(item.value || item.count || 0),
      color: item.color || this.options.colors[index % this.options.colors.length],
      ...item
    }));

    // Sort data if requested
    if (this.options.sortBy !== 'none') {
      processedData.sort((a, b) => {
        let comparison = 0;
        
        if (this.options.sortBy === 'value') {
          comparison = a.value - b.value;
        } else if (this.options.sortBy === 'label') {
          comparison = a.label.localeCompare(b.label);
        }
        
        return this.options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Limit number of bars
    if (processedData.length > this.options.maxBars) {
      const limited = processedData.slice(0, this.options.maxBars - 1);
      
      // Aggregate remaining items into "Others"
      const others = processedData.slice(this.options.maxBars - 1);
      const othersSum = others.reduce((sum, item) => sum + item.value, 0);
      
      limited.push({
        label: 'Others',
        value: othersSum,
        color: '#9AA0A6',
        isAggregated: true
      });
      
      return limited;
    }

    return processedData;
  }

  /**
   * Render chart using Chart.js (if available) or fallback to D3/custom implementation
   */
  async render() {
    if (!this.data) {
      throw new Error('No data available for rendering');
    }

    const processedData = this.processData(this.data);
    
    // Clear previous chart
    this.element.innerHTML = '';

    // Try Chart.js first
    if (typeof Chart !== 'undefined') {
      await this.renderWithChartJS(processedData);
    } else {
      // Fallback to custom SVG implementation
      await this.renderWithSVG(processedData);
    }
  }

  /**
   * Render using Chart.js
   */
  async renderWithChartJS(data) {
    const canvas = document.createElement('canvas');
    this.element.appendChild(canvas);

    const config = {
      type: this.options.orientation === 'horizontal' ? 'horizontalBar' : 'bar',
      data: {
        labels: data.map(item => item.label),
        datasets: [{
          label: this.options.title || 'Data',
          data: data.map(item => item.value),
          backgroundColor: data.map(item => item.color),
          borderColor: data.map(item => item.color),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.options.showLegend
          },
          tooltip: {
            enabled: this.options.showTooltips
          }
        },
        scales: {
          x: {
            grid: {
              display: this.options.showGrid
            }
          },
          y: {
            grid: {
              display: this.options.showGrid
            },
            beginAtZero: true
          }
        },
        animation: {
          duration: this.options.animation.duration
        }
      }
    };

    this.chartInstance = new Chart(canvas, config);
  }

  /**
   * Render using custom SVG implementation
   */
  async renderWithSVG(data) {
    const { width, height } = this.getChartDimensions();
    const { margin } = this.options;
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    this.element.appendChild(svg);

    // Create chart group
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    chartGroup.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
    svg.appendChild(chartGroup);

    // Calculate scales
    const maxValue = Math.max(...data.map(item => item.value));
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = index * (barWidth + barSpacing) + barSpacing / 2;
      const y = chartHeight - barHeight;

      // Create bar
      const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bar.setAttribute('x', x);
      bar.setAttribute('y', y);
      bar.setAttribute('width', barWidth);
      bar.setAttribute('height', barHeight);
      bar.setAttribute('fill', item.color);
      bar.setAttribute('data-label', item.label);
      bar.setAttribute('data-value', item.value);
      
      // Add hover effects
      bar.addEventListener('mouseenter', (e) => this.showTooltip(e, item));
      bar.addEventListener('mouseleave', () => this.hideTooltip());
      
      chartGroup.appendChild(bar);

      // Add label
      if (this.options.showLabels !== false) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x + barWidth / 2);
        label.setAttribute('y', height - margin.bottom + 15);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', '#666');
        label.textContent = this.truncateLabel(item.label, 10);
        
        svg.appendChild(label);
      }
    });

    // Add axes if requested
    if (this.options.showAxes !== false) {
      this.drawAxes(svg, chartWidth, chartHeight, margin, maxValue);
    }

    this.chartInstance = { svg, data };
  }

  /**
   * Draw chart axes
   */
  drawAxes(svg, chartWidth, chartHeight, margin, maxValue) {
    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left);
    yAxis.setAttribute('y1', margin.top);
    yAxis.setAttribute('x2', margin.left);
    yAxis.setAttribute('y2', margin.top + chartHeight);
    yAxis.setAttribute('stroke', '#ccc');
    yAxis.setAttribute('stroke-width', '1');
    svg.appendChild(yAxis);

    // X-axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left);
    xAxis.setAttribute('y1', margin.top + chartHeight);
    xAxis.setAttribute('x2', margin.left + chartWidth);
    xAxis.setAttribute('y2', margin.top + chartHeight);
    xAxis.setAttribute('stroke', '#ccc');
    xAxis.setAttribute('stroke-width', '1');
    svg.appendChild(xAxis);

    // Y-axis labels
    const tickCount = 5;
    for (let i = 0; i <= tickCount; i++) {
      const value = (maxValue / tickCount) * i;
      const y = margin.top + chartHeight - (i / tickCount) * chartHeight;
      
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', margin.left - 5);
      tick.setAttribute('y1', y);
      tick.setAttribute('x2', margin.left);
      tick.setAttribute('y2', y);
      tick.setAttribute('stroke', '#ccc');
      svg.appendChild(tick);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', margin.left - 10);
      label.setAttribute('y', y + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#666');
      label.textContent = this.formatValue(value);
      svg.appendChild(label);
    }
  }

  /**
   * Show tooltip
   */
  showTooltip(event, item) {
    if (!this.options.showTooltips) return;

    // Remove existing tooltip
    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.innerHTML = `
      <strong>${item.label}</strong><br>
      Value: ${this.formatValue(item.value)}
    `;
    
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      left: ${event.pageX + 10}px;
      top: ${event.pageY - 10}px;
    `;
    
    document.body.appendChild(tooltip);
    this.currentTooltip = tooltip;
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }

  /**
   * Get chart dimensions
   */
  getChartDimensions() {
    const rect = this.element.getBoundingClientRect();
    return {
      width: rect.width || 400,
      height: rect.height || 300
    };
  }

  /**
   * Format value for display
   */
  formatValue(value) {
    if (typeof this.options.valueFormatter === 'function') {
      return this.options.valueFormatter(value);
    }
    
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    
    return value.toString();
  }

  /**
   * Truncate label if too long
   */
  truncateLabel(label, maxLength) {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
  }

  /**
   * Update chart with new data
   */
  async updateData(newData) {
    this.data = newData;
    await this.render();
  }

  /**
   * Destroy chart and cleanup
   */
  destroy() {
    this.hideTooltip();
    super.destroy();
  }
}

// Default export
export default BarChart;
