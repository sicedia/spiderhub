/**
 * Chart Data Service
 * Handles chart data processing and transformation
 * ES6 Module Export
 */

import { DataService } from './DataService.js';
import { CONFIG } from '../core/constants/config.js';

export class ChartDataService extends DataService {
  constructor() {
    super();
    this.dataTransformers = new Map();
    this.chartDataCache = new Map();
    this.registerDefaultTransformers();
  }

  /**
   * Register default data transformers
   */
  registerDefaultTransformers() {
    // Bar chart transformer
    this.registerTransformer('bar', (data, options = {}) => {
      return this.transformToBarChartData(data, options);
    });

    // Pie chart transformer
    this.registerTransformer('pie', (data, options = {}) => {
      return this.transformToPieChartData(data, options);
    });

    // Line chart transformer
    this.registerTransformer('line', (data, options = {}) => {
      return this.transformToLineChartData(data, options);
    });

    // Radar chart transformer
    this.registerTransformer('radar', (data, options = {}) => {
      return this.transformToRadarChartData(data, options);
    });

    // Map chart transformer
    this.registerTransformer('map', (data, options = {}) => {
      return this.transformToMapChartData(data, options);
    });

    // Treemap transformer
    this.registerTransformer('treemap', (data, options = {}) => {
      return this.transformToTreemapData(data, options);
    });

    // Heatmap transformer
    this.registerTransformer('heatmap', (data, options = {}) => {
      return this.transformToHeatmapData(data, options);
    });
  }

  /**
   * Register a custom data transformer
   */
  registerTransformer(chartType, transformerFunction) {
    this.dataTransformers.set(chartType, transformerFunction);
  }

  /**
   * Transform data for a specific chart type
   */
  async transformDataForChart(chartType, rawData, options = {}) {
    const cacheKey = `${chartType}:${JSON.stringify(options)}:${this.hashData(rawData)}`;
    
    // Check cache first
    if (this.chartDataCache.has(cacheKey)) {
      const cached = this.chartDataCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const transformer = this.dataTransformers.get(chartType);
    if (!transformer) {
      throw new Error(`No transformer registered for chart type: ${chartType}`);
    }

    try {
      const transformedData = await transformer(rawData, options);
      
      // Cache the result
      this.chartDataCache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      return transformedData;
    } catch (error) {
      console.error(`Failed to transform data for ${chartType}:`, error);
      throw error;
    }
  }

  /**
   * Transform data to bar chart format
   */
  transformToBarChartData(data, options = {}) {
    const {
      labelField = 'label',
      valueField = 'value',
      colorField = 'color',
      maxItems = 20,
      sortBy = 'value',
      sortOrder = 'desc',
      aggregateOthers = true
    } = options;

    if (!Array.isArray(data)) {
      throw new Error('Bar chart data must be an array');
    }

    // Extract and process data
    let processedData = data.map((item, index) => ({
      label: this.getNestedValue(item, labelField) || `Item ${index + 1}`,
      value: parseFloat(this.getNestedValue(item, valueField) || 0),
      color: this.getNestedValue(item, colorField) || CONFIG.CHARTS.DEFAULT_COLORS[index % CONFIG.CHARTS.DEFAULT_COLORS.length],
      originalData: item
    }));

    // Sort data
    if (sortBy === 'value') {
      processedData.sort((a, b) => sortOrder === 'desc' ? b.value - a.value : a.value - b.value);
    } else if (sortBy === 'label') {
      processedData.sort((a, b) => sortOrder === 'desc' ? b.label.localeCompare(a.label) : a.label.localeCompare(b.label));
    }

    // Limit items and aggregate others
    if (processedData.length > maxItems && aggregateOthers) {
      const mainItems = processedData.slice(0, maxItems - 1);
      const otherItems = processedData.slice(maxItems - 1);
      const othersSum = otherItems.reduce((sum, item) => sum + item.value, 0);

      if (othersSum > 0) {
        mainItems.push({
          label: 'Others',
          value: othersSum,
          color: '#9CA3AF',
          isAggregated: true,
          aggregatedItems: otherItems
        });
      }

      processedData = mainItems;
    } else {
      processedData = processedData.slice(0, maxItems);
    }

    return {
      labels: processedData.map(item => item.label),
      datasets: [{
        data: processedData.map(item => item.value),
        backgroundColor: processedData.map(item => item.color),
        borderColor: processedData.map(item => item.color),
        borderWidth: 1
      }],
      processedData
    };
  }

  /**
   * Transform data to pie chart format
   */
  transformToPieChartData(data, options = {}) {
    const barData = this.transformToBarChartData(data, options);
    
    return {
      labels: barData.labels,
      datasets: [{
        data: barData.datasets[0].data,
        backgroundColor: barData.datasets[0].backgroundColor,
        borderColor: '#ffffff',
        borderWidth: 2
      }],
      processedData: barData.processedData
    };
  }

  /**
   * Transform data to line chart format
   */
  transformToLineChartData(data, options = {}) {
    const {
      xField = 'x',
      yField = 'y',
      seriesField = 'series',
      dateFormat = null,
      fillMissingDates = false
    } = options;

    if (!Array.isArray(data)) {
      throw new Error('Line chart data must be an array');
    }

    // Group data by series
    const seriesMap = new Map();
    
    data.forEach(item => {
      const seriesName = this.getNestedValue(item, seriesField) || 'Default';
      const xValue = this.getNestedValue(item, xField);
      const yValue = parseFloat(this.getNestedValue(item, yField) || 0);

      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, []);
      }

      seriesMap.get(seriesName).push({
        x: dateFormat ? new Date(xValue) : xValue,
        y: yValue,
        originalData: item
      });
    });

    // Convert to Chart.js format
    const datasets = Array.from(seriesMap.entries()).map(([seriesName, seriesData], index) => {
      // Sort by x value
      seriesData.sort((a, b) => {
        if (a.x instanceof Date && b.x instanceof Date) {
          return a.x - b.x;
        }
        return a.x - b.x;
      });

      return {
        label: seriesName,
        data: seriesData,
        borderColor: CONFIG.CHARTS.DEFAULT_COLORS[index % CONFIG.CHARTS.DEFAULT_COLORS.length],
        backgroundColor: this.hexToRgba(CONFIG.CHARTS.DEFAULT_COLORS[index % CONFIG.CHARTS.DEFAULT_COLORS.length], 0.1),
        fill: false,
        tension: 0.1
      };
    });

    return {
      datasets,
      processedData: Array.from(seriesMap.entries())
    };
  }

  /**
   * Transform data to radar chart format
   */
  transformToRadarChartData(data, options = {}) {
    const {
      axisField = 'axis',
      valueField = 'value',
      seriesField = 'series',
      maxValue = null
    } = options;

    if (!Array.isArray(data)) {
      throw new Error('Radar chart data must be an array');
    }

    // Extract unique axes
    const axes = [...new Set(data.map(item => this.getNestedValue(item, axisField)))];
    
    // Group data by series
    const seriesMap = new Map();
    
    data.forEach(item => {
      const seriesName = this.getNestedValue(item, seriesField) || 'Default';
      const axis = this.getNestedValue(item, axisField);
      const value = parseFloat(this.getNestedValue(item, valueField) || 0);

      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, new Map());
      }

      seriesMap.get(seriesName).set(axis, value);
    });

    // Convert to radar chart format
    const datasets = Array.from(seriesMap.entries()).map(([seriesName, seriesData], index) => {
      const data = axes.map(axis => seriesData.get(axis) || 0);
      const color = CONFIG.CHARTS.DEFAULT_COLORS[index % CONFIG.CHARTS.DEFAULT_COLORS.length];

      return {
        label: seriesName,
        data,
        borderColor: color,
        backgroundColor: this.hexToRgba(color, 0.2),
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color
      };
    });

    return {
      labels: axes,
      datasets,
      axes: axes.map(axis => ({ label: axis, max: maxValue })),
      maxValue: maxValue || Math.max(...data.map(item => parseFloat(this.getNestedValue(item, valueField) || 0)))
    };
  }

  /**
   * Transform data to map chart format
   */
  transformToMapChartData(data, options = {}) {
    const {
      regionField = 'region',
      valueField = 'value',
      latField = 'lat',
      lngField = 'lng',
      labelField = 'label',
      type = 'choropleth' // 'choropleth' or 'markers'
    } = options;

    if (!Array.isArray(data)) {
      throw new Error('Map chart data must be an array');
    }

    if (type === 'choropleth') {
      // Transform for choropleth map
      const regions = data.map(item => ({
        id: this.getNestedValue(item, regionField),
        name: this.getNestedValue(item, labelField) || this.getNestedValue(item, regionField),
        value: parseFloat(this.getNestedValue(item, valueField) || 0),
        originalData: item
      }));

      return {
        type: 'choropleth',
        regions,
        bounds: this.calculateBounds(regions)
      };
    } else {
      // Transform for marker map
      const markers = data.map((item, index) => ({
        id: `marker-${index}`,
        lat: parseFloat(this.getNestedValue(item, latField) || 0),
        lng: parseFloat(this.getNestedValue(item, lngField) || 0),
        value: parseFloat(this.getNestedValue(item, valueField) || 0),
        label: this.getNestedValue(item, labelField) || `Marker ${index + 1}`,
        originalData: item
      }));

      return {
        type: 'markers',
        markers,
        bounds: this.calculateMarkerBounds(markers)
      };
    }
  }

  /**
   * Transform data to treemap format
   */
  transformToTreemapData(data, options = {}) {
    const {
      nameField = 'name',
      valueField = 'value',
      parentField = 'parent',
      colorField = 'color'
    } = options;

    if (!Array.isArray(data)) {
      throw new Error('Treemap data must be an array');
    }

    // Build hierarchy
    const hierarchy = this.buildHierarchy(data, nameField, valueField, parentField);
    
    // Add colors
    this.addColorsToHierarchy(hierarchy, colorField);

    return hierarchy;
  }

  /**
   * Transform data to heatmap format
   */
  transformToHeatmapData(data, options = {}) {
    const {
      xField = 'x',
      yField = 'y',
      valueField = 'value'
    } = options;

    if (!Array.isArray(data)) {
      throw new Error('Heatmap data must be an array');
    }

    // Extract unique x and y values
    const xValues = [...new Set(data.map(item => this.getNestedValue(item, xField)))].sort();
    const yValues = [...new Set(data.map(item => this.getNestedValue(item, yField)))].sort();

    // Create matrix
    const matrix = yValues.map(y => 
      xValues.map(x => {
        const item = data.find(d => 
          this.getNestedValue(d, xField) === x && 
          this.getNestedValue(d, yField) === y
        );
        return item ? parseFloat(this.getNestedValue(item, valueField) || 0) : 0;
      })
    );

    // Calculate min/max for color scaling
    const allValues = matrix.flat().filter(v => v !== 0);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    return {
      xLabels: xValues,
      yLabels: yValues,
      matrix,
      minValue,
      maxValue,
      processedData: data
    };
  }

  /**
   * Aggregate data by field
   */
  aggregateData(data, groupByField, aggregateField, aggregateFunction = 'sum') {
    if (!Array.isArray(data)) {
      return [];
    }

    const groups = new Map();

    data.forEach(item => {
      const groupKey = this.getNestedValue(item, groupByField);
      const value = parseFloat(this.getNestedValue(item, aggregateField) || 0);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(value);
    });

    const result = [];
    for (const [groupKey, values] of groups) {
      let aggregatedValue;

      switch (aggregateFunction) {
        case 'sum':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'count':
          aggregatedValue = values.length;
          break;
        case 'min':
          aggregatedValue = Math.min(...values);
          break;
        case 'max':
          aggregatedValue = Math.max(...values);
          break;
        default:
          aggregatedValue = values.reduce((sum, val) => sum + val, 0);
      }

      result.push({
        [groupByField]: groupKey,
        [aggregateField]: aggregatedValue,
        count: values.length
      });
    }

    return result;
  }

  /**
   * Filter data by date range
   */
  filterByDateRange(data, dateField, startDate, endDate) {
    if (!Array.isArray(data)) {
      return [];
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return data.filter(item => {
      const itemDate = new Date(this.getNestedValue(item, dateField));
      return itemDate >= start && itemDate <= end;
    });
  }

  /**
   * Calculate moving average
   */
  calculateMovingAverage(data, valueField, windowSize = 7) {
    if (!Array.isArray(data) || data.length < windowSize) {
      return data;
    }

    const result = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < windowSize - 1) {
        result.push({ ...data[i] });
      } else {
        const window = data.slice(i - windowSize + 1, i + 1);
        const average = window.reduce((sum, item) => 
          sum + parseFloat(this.getNestedValue(item, valueField) || 0), 0
        ) / windowSize;
        
        result.push({
          ...data[i],
          [valueField + '_ma']: average
        });
      }
    }

    return result;
  }

  /**
   * Helper methods
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  hashData(data) {
    return JSON.stringify(data).split('').reduce((hash, char) => {
      hash = ((hash << 5) - hash) + char.charCodeAt(0);
      return hash & hash;
    }, 0);
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  calculateBounds(regions) {
    // This would calculate geographic bounds for regions
    // For now, return a default bounds
    return {
      north: 85,
      south: -85,
      east: 180,
      west: -180
    };
  }

  calculateMarkerBounds(markers) {
    if (markers.length === 0) {
      return this.calculateBounds([]);
    }

    const lats = markers.map(m => m.lat);
    const lngs = markers.map(m => m.lng);

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };
  }

  buildHierarchy(data, nameField, valueField, parentField) {
    const root = {
      name: 'Root',
      children: []
    };

    // Group by parent
    const groups = new Map();
    data.forEach(item => {
      const parent = this.getNestedValue(item, parentField) || 'Root';
      if (!groups.has(parent)) {
        groups.set(parent, []);
      }
      groups.get(parent).push(item);
    });

    // Build tree recursively
    const buildNode = (parentName) => {
      const children = groups.get(parentName) || [];
      return children.map(item => {
        const name = this.getNestedValue(item, nameField);
        const value = parseFloat(this.getNestedValue(item, valueField) || 0);
        
        const node = {
          name,
          value,
          originalData: item
        };

        // Check if this node has children
        if (groups.has(name)) {
          node.children = buildNode(name);
        }

        return node;
      });
    };

    root.children = buildNode('Root');
    return root;
  }

  addColorsToHierarchy(node, colorField, colorIndex = 0) {
    if (node.originalData && colorField) {
      node.color = this.getNestedValue(node.originalData, colorField);
    }
    
    if (!node.color) {
      node.color = CONFIG.CHARTS.DEFAULT_COLORS[colorIndex % CONFIG.CHARTS.DEFAULT_COLORS.length];
    }

    if (node.children) {
      node.children.forEach((child, index) => {
        this.addColorsToHierarchy(child, colorField, colorIndex + index + 1);
      });
    }
  }

  /**
   * Clear chart data cache
   */
  clearChartDataCache() {
    this.chartDataCache.clear();
  }

  /**
   * Get cache statistics
   */
  getChartDataCacheStats() {
    return {
      size: this.chartDataCache.size,
      transformers: Array.from(this.dataTransformers.keys())
    };
  }
}

// Default export
export default ChartDataService;
