/**
 * Generic Pie Chart Component
 * Reusable pie chart implementation using Chart.js or D3
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { CONFIG } from '../../core/constants/config.js';

export class PieChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
  }

  /**
   * Default options for pie charts
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      showLegend: true,
      showTooltips: true,
      showLabels: true,
      showPercentages: true,
      innerRadius: 0, // Set > 0 for donut chart
      maxSlices: 10,
      sortBy: 'value', // 'value', 'label', 'none'
      sortOrder: 'desc', // 'asc', 'desc'
      colors: CONFIG.CHARTS.DEFAULT_COLORS,
      legendPosition: 'right', // 'top', 'right', 'bottom', 'left'
      animationDuration: 1000
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
      throw new Error('PieChart requires dataSource option or override loadData method');
    }
  }

  /**
   * Process and validate data
   */
  processData(rawData) {
    if (!Array.isArray(rawData)) {
      throw new Error('Pie chart data must be an array');
    }

    // Ensure data has required properties
    let processedData = rawData.map((item, index) => ({
      label: item.label || item.name || `Item ${index + 1}`,
      value: parseFloat(item.value || item.count || 0),
      color: item.color || this.options.colors[index % this.options.colors.length],
      ...item
    }));

    // Filter out zero values
    processedData = processedData.filter(item => item.value > 0);

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

    // Limit number of slices
    if (processedData.length > this.options.maxSlices) {
      const limited = processedData.slice(0, this.options.maxSlices - 1);
      
      // Aggregate remaining items into "Others"
      const others = processedData.slice(this.options.maxSlices - 1);
      const othersSum = others.reduce((sum, item) => sum + item.value, 0);
      
      limited.push({
        label: 'Others',
        value: othersSum,
        color: '#9AA0A6',
        isAggregated: true,
        aggregatedItems: others
      });
      
      processedData = limited;
    }

    // Calculate percentages
    const total = processedData.reduce((sum, item) => sum + item.value, 0);
    processedData.forEach(item => {
      item.percentage = total > 0 ? (item.value / total) * 100 : 0;
    });

    return processedData;
  }

  /**
   * Render chart using Chart.js (if available) or fallback to SVG implementation
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
      type: this.options.innerRadius > 0 ? 'doughnut' : 'pie',
      data: {
        labels: data.map(item => item.label),
        datasets: [{
          data: data.map(item => item.value),
          backgroundColor: data.map(item => item.color),
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.options.showLegend,
            position: this.options.legendPosition
          },
          tooltip: {
            enabled: this.options.showTooltips,
            callbacks: {
              label: (context) => {
                const item = data[context.dataIndex];
                let label = item.label;
                if (this.options.showPercentages) {
                  label += `: ${item.percentage.toFixed(1)}%`;
                }
                label += ` (${this.formatValue(item.value)})`;
                return label;
              }
            }
          }
        },
        animation: {
          duration: this.options.animationDuration
        }
      }
    };

    if (this.options.innerRadius > 0) {
      config.options.cutout = `${this.options.innerRadius}%`;
    }

    this.chartInstance = new Chart(canvas, config);
  }

  /**
   * Render using custom SVG implementation
   */
  async renderWithSVG(data) {
    const { width, height } = this.getChartDimensions();
    const radius = Math.min(width, height) / 2 - 20;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create container
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
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

    // Calculate angles
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2; // Start at top

    // Draw slices
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = currentAngle + sliceAngle;

      // Create path for slice
      const path = this.createSlicePath(
        centerX, centerY, radius, 
        currentAngle, endAngle, 
        this.options.innerRadius
      );

      const slice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      slice.setAttribute('d', path);
      slice.setAttribute('fill', item.color);
      slice.setAttribute('stroke', '#ffffff');
      slice.setAttribute('stroke-width', '2');
      slice.setAttribute('data-label', item.label);
      slice.setAttribute('data-value', item.value);
      slice.setAttribute('data-percentage', item.percentage.toFixed(1));
      
      // Add hover effects
      slice.addEventListener('mouseenter', (e) => this.showTooltip(e, item));
      slice.addEventListener('mouseleave', () => this.hideTooltip());
      slice.addEventListener('click', () => this.handleSliceClick(item));
      
      // Add animation
      if (this.options.animationDuration > 0) {
        slice.style.opacity = '0';
        slice.style.transition = `opacity ${this.options.animationDuration}ms ease-in-out`;
        setTimeout(() => {
          slice.style.opacity = '1';
        }, index * 100);
      }
      
      svg.appendChild(slice);

      // Add labels if requested
      if (this.options.showLabels) {
        this.addSliceLabel(svg, centerX, centerY, radius, currentAngle, endAngle, item);
      }

      currentAngle = endAngle;
    });

    // Add legend if requested
    if (this.options.showLegend) {
      this.addLegend(container, data);
    }

    this.chartInstance = { svg, data };
  }

  /**
   * Create SVG path for pie slice
   */
  createSlicePath(centerX, centerY, radius, startAngle, endAngle, innerRadius = 0) {
    const x1 = centerX + Math.cos(startAngle) * radius;
    const y1 = centerY + Math.sin(startAngle) * radius;
    const x2 = centerX + Math.cos(endAngle) * radius;
    const y2 = centerY + Math.sin(endAngle) * radius;
    
    const largeArcFlag = endAngle - startAngle <= Math.PI ? '0' : '1';
    
    if (innerRadius > 0) {
      // Donut chart
      const innerRadiusActual = radius * (innerRadius / 100);
      const x3 = centerX + Math.cos(endAngle) * innerRadiusActual;
      const y3 = centerY + Math.sin(endAngle) * innerRadiusActual;
      const x4 = centerX + Math.cos(startAngle) * innerRadiusActual;
      const y4 = centerY + Math.sin(startAngle) * innerRadiusActual;
      
      return [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadiusActual} ${innerRadiusActual} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');
    } else {
      // Regular pie chart
      return [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
    }
  }

  /**
   * Add label to slice
   */
  addSliceLabel(svg, centerX, centerY, radius, startAngle, endAngle, item) {
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius * 0.7;
    const x = centerX + Math.cos(midAngle) * labelRadius;
    const y = centerY + Math.sin(midAngle) * labelRadius;

    // Only show label if slice is large enough
    if (item.percentage < 5) return;

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('fill', this.getContrastColor(item.color));
    
    let labelText = '';
    if (this.options.showPercentages) {
      labelText = `${item.percentage.toFixed(1)}%`;
    } else {
      labelText = this.truncateLabel(item.label, 8);
    }
    
    label.textContent = labelText;
    svg.appendChild(label);
  }

  /**
   * Add legend to chart
   */
  addLegend(container, data) {
    const legend = document.createElement('div');
    legend.className = 'pie-chart-legend';
    legend.style.cssText = `
      margin-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 12px;
    `;

    data.forEach(item => {
      const legendItem = document.createElement('div');
      legendItem.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      `;

      const colorBox = document.createElement('div');
      colorBox.style.cssText = `
        width: 12px;
        height: 12px;
        background-color: ${item.color};
        border-radius: 2px;
        flex-shrink: 0;
      `;

      const labelText = document.createElement('span');
      labelText.textContent = `${item.label} (${item.percentage.toFixed(1)}%)`;
      labelText.style.cssText = `
        color: #333;
        line-height: 1.2;
      `;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelText);
      
      // Add click handler
      legendItem.addEventListener('click', () => this.handleLegendClick(item));
      
      legend.appendChild(legendItem);
    });

    container.appendChild(legend);
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
      Value: ${this.formatValue(item.value)}<br>
      Percentage: ${item.percentage.toFixed(1)}%
      ${item.isAggregated ? `<br><small>(${item.aggregatedItems.length} items)</small>` : ''}
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
   * Hide tooltip
   */
  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }

  /**
   * Handle slice click
   */
  handleSliceClick(item) {
    this.emit('slice:clicked', { item });
    
    // If it's an aggregated slice, show details
    if (item.isAggregated && item.aggregatedItems) {
      this.showAggregatedDetails(item);
    }
  }

  /**
   * Handle legend click
   */
  handleLegendClick(item) {
    this.handleSliceClick(item);
  }

  /**
   * Show details for aggregated items
   */
  showAggregatedDetails(item) {
    const details = item.aggregatedItems.map(subItem => 
      `${subItem.label}: ${this.formatValue(subItem.value)}`
    ).join('\n');
    
    alert(`${item.label} contains:\n\n${details}`);
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
   * Get contrasting color for text
   */
  getContrastColor(backgroundColor) {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
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
export default PieChart;
