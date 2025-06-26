/**
 * Collaboration Network Chart - Network visualization showing cross-sector collaborations
 * Uses D3.js force simulation to display relationships and interconnections
 */
export const renderCollaborationNetworkChart = async (data) => {
  const container = document.getElementById('collaboration-network-chart');
  if (!container) return console.warn('Collaboration network chart container missing');

  // Clear existing content
  container.innerHTML = '';
  container.classList.add('loading');

  // Check if D3 is loaded
  if (typeof d3 === 'undefined') {
    console.error('D3.js not loaded');
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">D3.js required for network visualization</div>';
    return;
  }

  // Use the provided data (now comes from real backend data via fetchCollaborationData)
  const networkData = data || { nodes: [], links: [] };
  
  // If no data provided, show empty state
  if (!networkData.nodes || networkData.nodes.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">No collaboration data available</div>';
    container.classList.remove('loading');
    return;
  }

  // Set dimensions
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const width = container.offsetWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Define color schemes
  const nodeColors = {
    'government': '#2563EB',
    'private': '#059669',
    'academia': '#FBBC04',
    'civil-society': '#DC2626',
    'international': '#7C3AED'
  };

  const linkColors = {
    'bilateral': '#2563EB',
    'regional': '#059669',
    'public-private': '#FBBC04',
    'public-academia': '#F59E0B',
    'private-academia': '#10B981',
    'public-civil': '#EF4444',
    'academia-civil': '#F97316',
    'international': '#7C3AED',
    'innovation': '#06B6D4'
  };

  // Create force simulation
  const simulation = d3.forceSimulation(networkData.nodes)
    .force('link', d3.forceLink(networkData.links).id(d => d.id).distance(d => 80 + (10 - d.strength) * 10))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.size + 5));

  // Create links
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(networkData.links)
    .enter().append('line')
    .attr('stroke', d => linkColors[d.type] || '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', d => Math.sqrt(d.strength))
    .style('cursor', 'pointer');

  // Create nodes
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(networkData.nodes)
    .enter().append('circle')
    .attr('r', d => d.size)
    .attr('fill', d => nodeColors[d.type])
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  // Add labels
  const label = g.append('g')
    .attr('class', 'labels')
    .selectAll('text')
    .data(networkData.nodes)
    .enter().append('text')
    .text(d => {
      // Truncate long names
      if (d.name.length > 15) {
        return d.name.substring(0, 12) + '...';
      }
      return d.name;
    })
    .attr('font-family', 'Roboto, -apple-system, sans-serif')
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .attr('fill', '#374151')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .style('pointer-events', 'none')
    .style('user-select', 'none');

  // Add interactivity
  node
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke-width', 4)
        .attr('r', d.size + 2);
      
      // Highlight connected links
      link
        .attr('stroke-opacity', l => (l.source === d || l.target === d) ? 1 : 0.1)
        .attr('stroke-width', l => (l.source === d || l.target === d) ? Math.sqrt(l.strength) + 1 : Math.sqrt(l.strength));
      
      // Highlight connected nodes
      node
        .attr('fill-opacity', n => {
          if (n === d) return 1;        return networkData.links.some(l => 
          (l.source === d && l.target === n) || (l.target === d && l.source === n)
        ) ? 0.8 : 0.3;
        });
      
      showNodeTooltip(event, d);
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .attr('stroke-width', 2)
        .attr('r', d.size);
      
      // Reset link styles
      link
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', l => Math.sqrt(l.strength));
      
      // Reset node opacity
      node.attr('fill-opacity', 1);
      
      hideNodeTooltip();
    })
    .on('click', function(event, d) {
      console.log(`Clicked on: ${d.name} - implement node details`);
    });

  link
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke-opacity', 1)
        .attr('stroke-width', Math.sqrt(d.strength) + 2);
      
      showLinkTooltip(event, d);
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', Math.sqrt(d.strength));
      
      hideLinkTooltip();
    });

  // Update positions on tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('cx', d => Math.max(d.size, Math.min(width - d.size, d.x)))
      .attr('cy', d => Math.max(d.size, Math.min(height - d.size, d.y)));

    label
      .attr('x', d => Math.max(d.size, Math.min(width - d.size, d.x)))
      .attr('y', d => Math.max(d.size, Math.min(height - d.size, d.y)) + d.size + 12);
  });

  // Drag functions
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Create legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(20, 20)`);

  // Node type legend
  const nodeTypes = Object.keys(nodeColors);
  const nodeLegend = legend.append('g').attr('class', 'node-legend');

  nodeLegend.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .text('Actor Types')
    .attr('font-family', 'Roboto, -apple-system, sans-serif')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', '#1f2937');

  const nodeItems = nodeLegend.selectAll('.node-legend-item')
    .data(nodeTypes)
    .enter().append('g')
    .attr('class', 'node-legend-item')
    .attr('transform', (d, i) => `translate(0, ${20 + i * 18})`);

  nodeItems.append('circle')
    .attr('r', 6)
    .attr('fill', d => nodeColors[d])
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1);

  nodeItems.append('text')
    .attr('x', 12)
    .attr('y', 0)
    .attr('dy', '.35em')
    .text(d => d.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .attr('font-family', 'Roboto, -apple-system, sans-serif')
    .attr('font-size', '10px')
    .attr('fill', '#374151');

  // Network statistics
  const stats = svg.append('g')
    .attr('class', 'network-stats')
    .attr('transform', `translate(${width - 150}, 20)`);

  stats.append('rect')
    .attr('width', 140)
    .attr('height', 90)
    .attr('fill', 'rgba(255, 255, 255, 0.95)')
    .attr('stroke', 'rgba(0, 0, 0, 0.1)')
    .attr('rx', 6);

  stats.append('text')
    .attr('x', 10)
    .attr('y', 16)
    .text('Network Metrics')
    .attr('font-family', 'Roboto, -apple-system, sans-serif')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', '#1f2937');

  const totalNodes = networkData.nodes.length;
  const totalLinks = networkData.links.length;
  const avgConnections = (totalLinks * 2 / totalNodes).toFixed(1);
  const networkDensity = ((totalLinks * 2) / (totalNodes * (totalNodes - 1)) * 100).toFixed(1);

  stats.append('text')
    .attr('x', 10)
    .attr('y', 32)
    .text(`Actors: ${totalNodes}`)
    .attr('font-family', 'Roboto, -apple-system, sans-serif')
    .attr('font-size', '10px')
    .attr('fill', '#374151');

  stats.append('text')
    .attr('x', 10)
    .attr('y', 46)
    .text(`Connections: ${totalLinks}`)
    .attr('font-family', 'Roboto, -apple-system, sans-serif')
    .attr('font-size', '10px')
    .attr('fill', '#374151');

  stats.append('text')
    .attr('x', 10)
    .attr('y', 60)
    .text(`Avg. Degree: ${avgConnections}`)
    .attr('font-family', 'Roboto, -apple-system, sans-serif')
    .attr('font-size', '10px')
    .attr('fill', '#374151');

  stats.append('text')
    .attr('x', 10)
    .attr('y', 74)
    .text(`Density: ${networkDensity}%`)
    .attr('font-family', 'Roboto, -apple-system, sans-serif')
    .attr('font-size', '10px')
    .attr('fill', '#374151');

  // Tooltip functions
  let nodeTooltip = null;
  let linkTooltip = null;

  function showNodeTooltip(event, d) {
    if (nodeTooltip) hideNodeTooltip();
    
    nodeTooltip = d3.select('body').append('div')
      .attr('class', 'network-node-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#ffffff')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('font-family', 'Roboto, -apple-system, sans-serif')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('opacity', 0);

    const actorType = d.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    nodeTooltip.html(`
      <strong>${d.name}</strong><br>
      Type: ${actorType}<br>
      Sector: ${d.sector}<br>
      Connections: ${d.connections}<br>
      Influence: ${d.size > 20 ? 'High' : d.size > 15 ? 'Medium' : 'Low'}
    `);

    const tooltipNode = nodeTooltip.node();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    
    nodeTooltip
      .style('left', (event.pageX - tooltipRect.width / 2) + 'px')
      .style('top', (event.pageY - tooltipRect.height - 10) + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  }

  function hideNodeTooltip() {
    if (nodeTooltip) {
      nodeTooltip.transition()
        .duration(200)
        .style('opacity', 0)
        .remove();
      nodeTooltip = null;
    }
  }

  function showLinkTooltip(event, d) {
    if (linkTooltip) hideLinkTooltip();
    
    linkTooltip = d3.select('body').append('div')
      .attr('class', 'network-link-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#ffffff')
      .style('padding', '10px')
      .style('border-radius', '6px')
      .style('font-family', 'Roboto, -apple-system, sans-serif')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('opacity', 0);

    const collaborationType = d.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    linkTooltip.html(`
      <strong>${d.source.name}</strong> ↔ <strong>${d.target.name}</strong><br>
      Type: ${collaborationType}<br>
      Strength: ${d.strength}/10
    `);

    const tooltipNode = linkTooltip.node();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    
    linkTooltip
      .style('left', (event.pageX - tooltipRect.width / 2) + 'px')
      .style('top', (event.pageY - tooltipRect.height - 10) + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  }

  function hideLinkTooltip() {
    if (linkTooltip) {
      linkTooltip.transition()
        .duration(200)
        .style('opacity', 0)
        .remove();
      linkTooltip = null;
    }
  }

  container.classList.remove('loading');
  
  // Store chart reference for cleanup
  container.__networkChart = { svg, simulation };
  
  // Add accessibility
  svg.attr('role', 'img')
     .attr('aria-label', 
       `Collaboration network showing ${totalNodes} actors and ${totalLinks} connections. ` +
       `Network density is ${networkDensity}% with average ${avgConnections} connections per actor.`
     );
  
  return { svg, simulation, nodes: networkData.nodes, links: networkData.links };
};

/**
 * Clean up network chart
 * @param {string} containerId - ID of the chart container
 */
export const destroyCollaborationNetworkChart = (containerId = 'collaboration-network-chart') => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Stop simulation
  if (container.__networkChart && container.__networkChart.simulation) {
    container.__networkChart.simulation.stop();
  }
  
  // Remove any existing tooltips
  d3.selectAll('.network-node-tooltip').remove();
  d3.selectAll('.network-link-tooltip').remove();
  
  // Clear container
  container.innerHTML = '';
  container.__networkChart = null;
};
