/**
 * Generic Radar Chart Component
 * Reusable radar chart implementation
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { CONFIG } from '../../core/constants/config.js';

export class RadarChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
  }

  /**
   * Default options for radar charts
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      showLegend: true,
      showTooltips: true,
      showLabels: true,
      showGrid: true,
      maxValue: null, // Auto-calculate if null
      levels: 5, // Number of grid levels
      colors: CONFIG.CHARTS.DEFAULT_COLORS,
      fillOpacity: 0.2,
      strokeWidth: 2,
      pointRadius: 4,
      labelOffset: 20
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (this.options.dataSource) {
      if (typeof this.options.dataSource === 'function') {
        this.data = await this.options.dataSource();
      } else {
        this.data = this.options.dataSource;
      }
    } else {
      throw new Error('RadarChart requires dataSource option or override loadData method');
    }
  }

  /**
   * Process and validate data
   */
  processData(rawData) {
    if (!rawData || typeof rawData !== 'object') {
      throw new Error('Radar chart data must be an object with axes and datasets');
    }

    const { axes, datasets } = rawData;

    if (!Array.isArray(axes) || axes.length === 0) {
      throw new Error('Radar chart must have at least one axis');
    }

    if (!Array.isArray(datasets) || datasets.length === 0) {
      throw new Error('Radar chart must have at least one dataset');
    }

    // Process axes
    const processedAxes = axes.map(axis => ({
      label: axis.label || axis.name || 'Axis',
      max: axis.max || null,
      ...axis
    }));

    // Process datasets
    const processedDatasets = datasets.map((dataset, index) => ({
      label: dataset.label || `Dataset ${index + 1}`,
      data: dataset.data || [],
      color: dataset.color || this.options.colors[index % this.options.colors.length],
      fillColor: dataset.fillColor || this.hexToRgba(dataset.color || this.options.colors[index % this.options.colors.length], this.options.fillOpacity),
      ...dataset
    }));

    // Validate data consistency
    processedDatasets.forEach(dataset => {
      if (dataset.data.length !== processedAxes.length) {
        throw new Error(`Dataset "${dataset.label}" has ${dataset.data.length} values but there are ${processedAxes.length} axes`);
      }
    });

    // Calculate max value if not provided
    let maxValue = this.options.maxValue;
    if (maxValue === null) {
      const allValues = processedDatasets.flatMap(dataset => dataset.data);
      maxValue = Math.max(...allValues);
      // Round up to nearest nice number
      maxValue = Math.ceil(maxValue / 10) * 10;
    }

    return {
      axes: processedAxes,
      datasets: processedDatasets,
      maxValue
    };
  }

  /**
   * Render chart using custom SVG implementation
   */
  async render() {
    if (!this.data) {
      throw new Error('No data available for rendering');
    }

    const processedData = this.processData(this.data);
    
    // Clear previous chart
    this.element.innerHTML = '';

    await this.renderWithSVG(processedData);
  }

  /**
   * Render using custom SVG implementation
   */
  async renderWithSVG(data) {
    const { width, height } = this.getChartDimensions();
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60; // Leave space for labels

    // Create container
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      height: 100%;
    `;
    this.element.appendChild(container);

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    container.appendChild(svg);

    // Draw grid
    if (this.options.showGrid) {
      this.drawGrid(svg, centerX, centerY, radius, data);
    }

    // Draw axes
    this.drawAxes(svg, centerX, centerY, radius, data);

    // Draw datasets
    data.datasets.forEach((dataset, index) => {
      this.drawDataset(svg, centerX, centerY, radius, dataset, data, index);
    });

    // Add legend if requested
    if (this.options.showLegend) {
      this.addLegend(container, data.datasets);
    }

    this.chartInstance = { svg, data };
  }

  /**
   * Draw grid lines
   */
  drawGrid(svg, centerX, centerY, radius, data) {
    const { levels } = this.options;
    const { axes } = data;
    
    // Draw concentric polygons
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius / levels) * level;
      const points = [];
      
      for (let i = 0; i < axes.length; i++) {
        const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
        const x = centerX + Math.cos(angle) * levelRadius;
        const y = centerY + Math.sin(angle) * levelRadius;
        points.push(`${x},${y}`);
      }
      
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', points.join(' '));
      polygon.setAttribute('fill', 'none');
      polygon.setAttribute('stroke', '#e0e0e0');
      polygon.setAttribute('stroke-width', '1');
      svg.appendChild(polygon);
      
      // Add level labels
      if (level === levels) {
        const labelValue = (data.maxValue / levels) * level;
        const labelX = centerX + levelRadius + 5;
        const labelY = centerY + 4;
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX);
        label.setAttribute('y', labelY);
        label.setAttribute('font-size', '10');
        label.setAttribute('fill', '#666');
        label.textContent = this.formatValue(labelValue);
        svg.appendChild(label);
      }
    }
  }

  /**
   * Draw axes lines and labels
   */
  drawAxes(svg, centerX, centerY, radius, data) {
    const { axes } = data;
    
    axes.forEach((axis, index) => {
      const angle = (index * 2 * Math.PI) / axes.length - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Draw axis line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', centerX);
      line.setAttribute('y1', centerY);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#ccc');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
      
      // Draw axis label
      if (this.options.showLabels) {
        const labelRadius = radius + this.options.labelOffset;
        const labelX = centerX + Math.cos(angle) * labelRadius;
        const labelY = centerY + Math.sin(angle) * labelRadius;
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX);
        label.setAttribute('y', labelY);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('font-size', '12');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', '#333');
        label.textContent = axis.label;
        svg.appendChild(label);
      }
    });
  }

  /**
   * Draw dataset
   */
  drawDataset(svg, centerX, centerY, radius, dataset, data, index) {
    const { axes, maxValue } = data;
    const points = [];
    const dataPoints = [];
    
    // Calculate points
    dataset.data.forEach((value, i) => {
      const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
      const normalizedValue = Math.max(0, Math.min(value, maxValue)) / maxValue;
      const pointRadius = radius * normalizedValue;
      const x = centerX + Math.cos(angle) * pointRadius;
      const y = centerY + Math.sin(angle) * pointRadius;
      
      points.push(`${x},${y}`);
      dataPoints.push({ x, y, value, axis: axes[i] });
    });
    
    // Draw filled area
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', dataset.fillColor);
    polygon.setAttribute('stroke', dataset.color);
    polygon.setAttribute('stroke-width', this.options.strokeWidth);
    polygon.setAttribute('data-dataset', dataset.label);
    
    // Add hover effects
    polygon.addEventListener('mouseenter', (e) => this.showDatasetTooltip(e, dataset));
    polygon.addEventListener('mouseleave', () => this.hideTooltip());
    
    svg.appendChild(polygon);
    
    // Draw data points
    dataPoints.forEach((point, i) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', this.options.pointRadius);
      circle.setAttribute('fill', dataset.color);
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('data-value', point.value);
      circle.setAttribute('data-axis', point.axis.label);
      circle.setAttribute('data-dataset', dataset.label);
      
      // Add hover effects
      circle.addEventListener('mouseenter', (e) => this.showPointTooltip(e, point, dataset));
      circle.addEventListener('mouseleave', () => this.hideTooltip());
      
      svg.appendChild(circle);
    });
  }

  /**
   * Add legend to chart
   */
  addLegend(container, datasets) {
    const legend = document.createElement('div');
    legend.className = 'radar-chart-legend';
    legend.style.cssText = `
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
      font-size: 12px;
    `;

    datasets.forEach(dataset => {
      const legendItem = document.createElement('div');
      legendItem.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      `;

      const colorBox = document.createElement('div');
      colorBox.style.cssText = `
        width: 12px;
        height: 12px;
        background-color: ${dataset.color};
        border-radius: 2px;
        flex-shrink: 0;
      `;

      const labelText = document.createElement('span');
      labelText.textContent = dataset.label;
      labelText.style.cssText = `
        color: #333;
        line-height: 1.2;
      `;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelText);
      
      // Add click handler
      legendItem.addEventListener('click', () => this.handleLegendClick(dataset));
      
      legend.appendChild(legendItem);
    });

    container.appendChild(legend);
  }

  /**
   * Show dataset tooltip
   */
  showDatasetTooltip(event, dataset) {
    if (!this.options.showTooltips) return;

    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    
    const dataInfo = dataset.data.map((value, index) => {
      const axis = this.data.axes ? this.data.axes[index] : { label: `Axis ${index + 1}` };
      return `${axis.label}: ${this.formatValue(value)}`;
    }).join('<br>');
    
    tooltip.innerHTML = `
      <strong>${dataset.label}</strong><br>
      ${dataInfo}
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
      max-width: 200px;
    `;
    
    document.body.appendChild(tooltip);
    this.currentTooltip = tooltip;
  }

  /**
   * Show point tooltip
   */
  showPointTooltip(event, point, dataset) {
    if (!this.options.showTooltips) return;

    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.innerHTML = `
      <strong>${dataset.label}</strong><br>
      ${point.axis.label}: ${this.formatValue(point.value)}
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
   * Handle legend click
   */
  handleLegendClick(dataset) {
    this.emit('dataset:clicked', { dataset });
  }

  /**
   * Get chart dimensions
   */
  getChartDimensions() {
    const rect = this.element.getBoundingClientRect();
    return {
      width: rect.width || 400,
      height: rect.height || 400
    };
  }

  /**
   * Format value for display
   */
  formatValue(value) {
    if (typeof this.options.valueFormatter === 'function') {
      return this.options.valueFormatter(value);
    }
    
    return parseFloat(value).toFixed(1);
  }

  /**
   * Convert hex color to rgba
   */
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
export default RadarChart;
