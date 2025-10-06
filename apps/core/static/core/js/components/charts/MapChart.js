/**
 * Interactive Map Chart Component
 * Reusable map visualization component
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { CONFIG } from '../../core/constants/config.js';

export class MapChart extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.mapInstance = null;
    this.markers = new Map();
  }

  /**
   * Default options for map charts
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      mapType: 'world', // 'world', 'country', 'region'
      showTooltips: true,
      showLegend: true,
      enableZoom: true,
      enablePan: true,
      defaultZoom: CONFIG.MAP.DEFAULT_ZOOM,
      center: [0, 0], // [lat, lng]
      colorScale: ['#f0f9ff', '#0369a1'], // Light to dark blue
      markerSize: 8,
      strokeWidth: 1,
      strokeColor: '#ffffff',
      hoverColor: '#fbbf24',
      selectedColor: '#dc2626'
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
      throw new Error('MapChart requires dataSource option or override loadData method');
    }
  }

  /**
   * Process and validate data
   */
  processData(rawData) {
    if (!rawData || typeof rawData !== 'object') {
      throw new Error('Map chart data must be an object');
    }

    const { regions = [], markers = [], bounds = null } = rawData;

    // Process regions (for choropleth maps)
    const processedRegions = regions.map(region => ({
      id: region.id || region.code,
      name: region.name || region.id,
      value: parseFloat(region.value || 0),
      color: region.color || null,
      ...region
    }));

    // Process markers (for point maps)
    const processedMarkers = markers.map(marker => ({
      id: marker.id || `marker-${Date.now()}-${Math.random()}`,
      lat: parseFloat(marker.lat || marker.latitude || 0),
      lng: parseFloat(marker.lng || marker.longitude || 0),
      value: parseFloat(marker.value || 1),
      label: marker.label || marker.name || 'Marker',
      color: marker.color || this.options.colors[0],
      size: marker.size || this.options.markerSize,
      ...marker
    }));

    // Calculate color scale for regions
    if (processedRegions.length > 0) {
      const values = processedRegions.map(r => r.value).filter(v => v > 0);
      if (values.length > 0) {
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        processedRegions.forEach(region => {
          if (!region.color && region.value > 0) {
            region.color = this.interpolateColor(
              region.value, minValue, maxValue,
              this.options.colorScale[0], this.options.colorScale[1]
            );
          }
        });
      }
    }

    return {
      regions: processedRegions,
      markers: processedMarkers,
      bounds
    };
  }

  /**
   * Render chart using SVG implementation
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

    // Create container
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `;
    this.element.appendChild(container);

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.cssText = `
      width: 100%;
      height: 100%;
      cursor: ${this.options.enablePan ? 'grab' : 'default'};
    `;
    
    container.appendChild(svg);

    // Create map group for transformations
    const mapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mapGroup.setAttribute('class', 'map-group');
    svg.appendChild(mapGroup);

    // Load and render map data
    await this.loadMapGeometry(mapGroup, data);

    // Add zoom and pan functionality
    if (this.options.enableZoom || this.options.enablePan) {
      this.addInteractivity(svg, mapGroup);
    }

    // Add legend if requested
    if (this.options.showLegend && data.regions.length > 0) {
      this.addLegend(container, data);
    }

    this.chartInstance = { svg, mapGroup, data };
  }

  /**
   * Load map geometry (simplified world map)
   */
  async loadMapGeometry(mapGroup, data) {
    // This is a simplified implementation
    // In a real application, you would load actual map data (GeoJSON, TopoJSON, etc.)
    
    if (this.options.mapType === 'world') {
      await this.renderWorldMap(mapGroup, data);
    } else {
      // Fallback to simple visualization
      await this.renderSimpleMap(mapGroup, data);
    }
  }

  /**
   * Render simplified world map
   */
  async renderWorldMap(mapGroup, data) {
    // This is a very simplified world map representation
    // In production, you would use actual geographic data
    
    const { width, height } = this.getChartDimensions();
    
    // Create simplified continents as rectangles (placeholder)
    const continents = [
      { name: 'North America', x: 50, y: 100, width: 150, height: 100 },
      { name: 'South America', x: 100, y: 250, width: 80, height: 150 },
      { name: 'Europe', x: 250, y: 80, width: 80, height: 80 },
      { name: 'Africa', x: 240, y: 160, width: 100, height: 180 },
      { name: 'Asia', x: 330, y: 60, width: 200, height: 160 },
      { name: 'Australia', x: 450, y: 280, width: 80, height: 60 }
    ];

    continents.forEach(continent => {
      const region = data.regions.find(r => r.name === continent.name);
      const color = region ? region.color : '#e5e7eb';
      
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', continent.x);
      rect.setAttribute('y', continent.y);
      rect.setAttribute('width', continent.width);
      rect.setAttribute('height', continent.height);
      rect.setAttribute('fill', color);
      rect.setAttribute('stroke', this.options.strokeColor);
      rect.setAttribute('stroke-width', this.options.strokeWidth);
      rect.setAttribute('data-region', continent.name);
      
      // Add hover effects
      rect.addEventListener('mouseenter', (e) => {
        rect.setAttribute('fill', this.options.hoverColor);
        if (region) {
          this.showRegionTooltip(e, region);
        }
      });
      
      rect.addEventListener('mouseleave', () => {
        rect.setAttribute('fill', color);
        this.hideTooltip();
      });
      
      rect.addEventListener('click', () => {
        if (region) {
          this.handleRegionClick(region);
        }
      });
      
      mapGroup.appendChild(rect);
    });

    // Add markers
    this.renderMarkers(mapGroup, data.markers);
  }

  /**
   * Render simple map (fallback)
   */
  async renderSimpleMap(mapGroup, data) {
    const { width, height } = this.getChartDimensions();
    
    // Create a simple grid-based map
    const gridSize = 50;
    const cols = Math.floor(width / gridSize);
    const rows = Math.floor(height / gridSize);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const regionId = `${row}-${col}`;
        const region = data.regions.find(r => r.id === regionId);
        const color = region ? region.color : '#f3f4f6';
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', col * gridSize);
        rect.setAttribute('y', row * gridSize);
        rect.setAttribute('width', gridSize - 1);
        rect.setAttribute('height', gridSize - 1);
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', this.options.strokeColor);
        rect.setAttribute('stroke-width', '0.5');
        
        if (region) {
          rect.addEventListener('mouseenter', (e) => this.showRegionTooltip(e, region));
          rect.addEventListener('mouseleave', () => this.hideTooltip());
          rect.addEventListener('click', () => this.handleRegionClick(region));
        }
        
        mapGroup.appendChild(rect);
      }
    }

    // Add markers
    this.renderMarkers(mapGroup, data.markers);
  }

  /**
   * Render markers on the map
   */
  renderMarkers(mapGroup, markers) {
    markers.forEach(marker => {
      // Convert lat/lng to SVG coordinates (simplified)
      const { x, y } = this.latLngToSVG(marker.lat, marker.lng);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', marker.size);
      circle.setAttribute('fill', marker.color);
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('data-marker', marker.id);
      
      // Add hover effects
      circle.addEventListener('mouseenter', (e) => this.showMarkerTooltip(e, marker));
      circle.addEventListener('mouseleave', () => this.hideTooltip());
      circle.addEventListener('click', () => this.handleMarkerClick(marker));
      
      mapGroup.appendChild(circle);
      this.markers.set(marker.id, { element: circle, data: marker });
    });
  }

  /**
   * Convert lat/lng to SVG coordinates (simplified projection)
   */
  latLngToSVG(lat, lng) {
    const { width, height } = this.getChartDimensions();
    
    // Simple equirectangular projection
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    
    return { x, y };
  }

  /**
   * Add interactivity (zoom and pan)
   */
  addInteractivity(svg, mapGroup) {
    let isMouseDown = false;
    let startX, startY;
    let currentTransform = { x: 0, y: 0, scale: 1 };
    
    // Mouse events for panning
    if (this.options.enablePan) {
      svg.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        startX = e.clientX - currentTransform.x;
        startY = e.clientY - currentTransform.y;
        svg.style.cursor = 'grabbing';
      });
      
      svg.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        
        currentTransform.x = e.clientX - startX;
        currentTransform.y = e.clientY - startY;
        this.updateTransform(mapGroup, currentTransform);
      });
      
      svg.addEventListener('mouseup', () => {
        isMouseDown = false;
        svg.style.cursor = 'grab';
      });
      
      svg.addEventListener('mouseleave', () => {
        isMouseDown = false;
        svg.style.cursor = 'grab';
      });
    }
    
    // Wheel event for zooming
    if (this.options.enableZoom) {
      svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        currentTransform.scale *= delta;
        
        // Limit zoom levels
        currentTransform.scale = Math.max(0.5, Math.min(5, currentTransform.scale));
        
        this.updateTransform(mapGroup, currentTransform);
      });
    }
  }

  /**
   * Update map transform
   */
  updateTransform(mapGroup, transform) {
    mapGroup.setAttribute('transform', 
      `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`
    );
  }

  /**
   * Show region tooltip
   */
  showRegionTooltip(event, region) {
    if (!this.options.showTooltips) return;

    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.innerHTML = `
      <strong>${region.name}</strong><br>
      Value: ${this.formatValue(region.value)}
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
   * Show marker tooltip
   */
  showMarkerTooltip(event, marker) {
    if (!this.options.showTooltips) return;

    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.innerHTML = `
      <strong>${marker.label}</strong><br>
      Location: ${marker.lat.toFixed(2)}, ${marker.lng.toFixed(2)}<br>
      Value: ${this.formatValue(marker.value)}
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
   * Handle region click
   */
  handleRegionClick(region) {
    this.emit('region:clicked', { region });
  }

  /**
   * Handle marker click
   */
  handleMarkerClick(marker) {
    this.emit('marker:clicked', { marker });
  }

  /**
   * Add legend
   */
  addLegend(container, data) {
    const legend = document.createElement('div');
    legend.className = 'map-chart-legend';
    legend.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(255, 255, 255, 0.9);
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

    // Create color scale legend
    const values = data.regions.map(r => r.value).filter(v => v > 0);
    if (values.length > 0) {
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      
      legend.innerHTML = `
        <div style="margin-bottom: 5px; font-weight: bold;">Value Scale</div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <span>${this.formatValue(minValue)}</span>
          <div style="width: 100px; height: 10px; background: linear-gradient(to right, ${this.options.colorScale[0]}, ${this.options.colorScale[1]}); border: 1px solid #ccc;"></div>
          <span>${this.formatValue(maxValue)}</span>
        </div>
      `;
    }

    container.appendChild(legend);
  }

  /**
   * Interpolate color between two colors
   */
  interpolateColor(value, min, max, colorStart, colorEnd) {
    const ratio = (value - min) / (max - min);
    
    // Convert hex to RGB
    const startRGB = this.hexToRgb(colorStart);
    const endRGB = this.hexToRgb(colorEnd);
    
    // Interpolate
    const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * ratio);
    const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * ratio);
    const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Convert hex to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Get chart dimensions
   */
  getChartDimensions() {
    const rect = this.element.getBoundingClientRect();
    return {
      width: rect.width || 600,
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
    
    return value.toLocaleString();
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
    this.markers.clear();
    super.destroy();
  }
}

// Default export
export default MapChart;
