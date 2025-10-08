/**
 * Network Graph Component
 * Interactive network visualization for cross-sector collaboration
 * Uses vis-network library
 * ES6 Module Export
 */

import { BaseChart } from '../../core/base/BaseChart.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { eventBus } from '../../core/events/EventBus.js';

export class NetworkGraph extends BaseChart {
  constructor(element, options = {}) {
    super(element, options);
    this.network = null;
  }

  /**
   * Default options for network graphs
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      actorData: null,
      themeData: null,
      colors: {
        actor: {
          background: '#094EB2',
          border: '#034092',
          highlight: {
            background: '#0D5FD9',
            border: '#034092'
          }
        },
        theme: {
          background: '#34A853',
          border: '#2D8F47',
          highlight: {
            background: '#41C863',
            border: '#2D8F47'
          }
        },
        edge: {
          color: 'rgba(28, 115, 119, 0.3)',
          highlight: 'rgba(28, 115, 119, 0.7)',
          hover: 'rgba(28, 115, 119, 0.5)'
        }
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 120,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 0.5
        },
        stabilization: {
          enabled: true,
          iterations: 150,
          updateInterval: 25
        }
      }
    };
  }

  /**
   * Load chart data
   */
  async loadData() {
    if (!this.options.actorData || !this.options.themeData) {
      throw new Error('NetworkGraph requires actorData and themeData options');
    }
    
    this.data = {
      actors: this.options.actorData,
      themes: this.options.themeData
    };
  }

  /**
   * Render network graph
   */
  async render() {
    // Check if vis-network is available
    if (typeof vis === 'undefined') {
      this.logger.warn('Vis-network library not loaded');
      return;
    }

    const { nodes, edges, metrics } = this.prepareNetworkData();
    this.updateMetrics(metrics);
    this.renderNetwork(nodes, edges);
  }

  /**
   * Prepare network data from actors and themes
   */
  prepareNetworkData() {
    const nodes = [];
    const edges = [];
    let nodeId = 0;

    // Actor categories as nodes
    const actorCategories = this.data.actors.labels || [];
    const actorCounts = this.data.actors.datasets[0].data || [];
    
    const actorNodeMap = {};
    actorCategories.forEach((category, index) => {
      const count = actorCounts[index];
      if (count > 0) {
        actorNodeMap[category] = nodeId;
        nodes.push({
          id: nodeId,
          label: `${category}\n(${count})`,
          value: count * 3,
          group: 'actor',
          title: `Actor Type: ${category}<br/>Documents: ${count}`
        });
        nodeId++;
      }
    });

    // Theme categories as nodes
    const themeCategories = this.data.themes.labels || [];
    const themeCounts = this.data.themes.datasets[0].data || [];
    
    const themeNodeMap = {};
    themeCategories.forEach((category, index) => {
      const count = themeCounts[index];
      if (count > 0) {
        themeNodeMap[category] = nodeId;
        nodes.push({
          id: nodeId,
          label: `${category}\n(${count})`,
          value: count * 2,
          group: 'theme',
          title: `Theme: ${category}<br/>Documents: ${count}`
        });
        nodeId++;
      }
    });

    // Create edges (connections) based on shared documents
    let edgeId = 0;
    Object.keys(actorNodeMap).forEach(actorCat => {
      Object.keys(themeNodeMap).forEach(themeCat => {
        // Simulate connection strength (in real implementation, use actual co-occurrence data)
        const connectionStrength = Math.floor(Math.random() * 15) + 5;
        if (connectionStrength > 8) {
          edges.push({
            id: edgeId++,
            from: actorNodeMap[actorCat],
            to: themeNodeMap[themeCat],
            value: connectionStrength / 3,
            title: `${connectionStrength} shared documents`
          });
        }
      });
    });

    // Calculate network metrics
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const avgDegree = totalNodes > 0 ? (totalEdges * 2 / totalNodes).toFixed(1) : 0;
    const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    const density = maxPossibleEdges > 0 ? ((totalEdges / maxPossibleEdges) * 100).toFixed(1) : 0;

    return {
      nodes,
      edges,
      metrics: {
        actorTypes: actorCategories.length,
        connections: totalEdges,
        avgDegree,
        density: `${density}%`
      }
    };
  }

  /**
   * Update metrics in DOM
   */
  updateMetrics(metrics) {
    const updateMetric = (selector, value) => {
      const el = DOMUtils.getElement(selector);
      if (el) el.textContent = value;
    };
    
    updateMetric('#network-actor-types', metrics.actorTypes);
    updateMetric('#network-connections', metrics.connections);
    updateMetric('#network-avg-degree', metrics.avgDegree);
    updateMetric('#network-density', metrics.density);
  }

  /**
   * Render network using vis-network
   */
  renderNetwork(nodes, edges) {
    const data = {
      nodes: new vis.DataSet(nodes),
      edges: new vis.DataSet(edges)
    };

    const options = {
      nodes: {
        shape: 'dot',
        scaling: {
          min: 10,
          max: 40
        },
        font: {
          size: 12,
          color: '#ffffff',
          face: 'Poppins',
          bold: {
            size: 13
          }
        },
        borderWidth: 2,
        borderWidthSelected: 3,
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 5
        }
      },
      edges: {
        color: {
          color: this.options.colors.edge.color,
          highlight: this.options.colors.edge.highlight,
          hover: this.options.colors.edge.hover
        },
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5
        },
        width: 1,
        selectionWidth: 3
      },
      groups: {
        actor: {
          color: this.options.colors.actor
        },
        theme: {
          color: this.options.colors.theme
        }
      },
      physics: this.options.physics,
      interaction: {
        hover: true,
        tooltipDelay: 100,
        hideEdgesOnDrag: true,
        hideEdgesOnZoom: false
      },
      layout: {
        improvedLayout: true
      }
    };

    this.network = new vis.Network(this.element, data, options);
    
    // Stop physics after stabilization
    this.network.on('stabilizationIterationsDone', () => {
      this.network.setOptions({ physics: false });
    });

    this.chartInstance = this.network;
    eventBus.emit('chart:rendered', { chartId: this.element.id, type: 'network' });
    
    this.logger.info('Network graph rendered', { 
      nodes: nodes.length, 
      edges: edges.length
    });
  }

  /**
   * Destroy network instance
   */
  destroy() {
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }
    super.destroy();
  }
}

