/**
 * Initiative Type Distribution - Hierarchical visualization of initiative types and their proportions
 * Uses D3.js to create a treemap showing the variety and relative importance of different cooperation initiatives
 */
export const renderInitiativeTreemapChart = async (data) => {
  const container = document.getElementById('initiative-treemap-chart');
  if (!container) return console.warn('Initiative treemap chart container missing');

  // Clear existing content
  container.innerHTML = '';
  container.classList.add('loading');

  // Check if D3 is loaded
  if (typeof d3 === 'undefined') {
    console.error('D3.js not loaded');
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">D3.js required for treemap visualization</div>';
    return;
  }

  // Use the provided data (now comes from real backend data via fetchInitiativeData)
  const treemapData = data || {
    name: "Digital Cooperation Initiatives",
    children: []
  };
  
  // If no data provided, show empty state
  if (!treemapData.children || treemapData.children.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">No initiative data available</div>';
    container.classList.remove('loading');
    return;
  }

  // Set dimensions with better spacing for overlays
  const margin = { top: 40, right: 10, bottom: 60, left: 10 };
  const width = container.offsetWidth - margin.left - margin.right;
  const height = 380 - margin.top - margin.bottom;

  // Create SVG with title
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  // Add title
  svg.append('text')
    .attr('x', (width + margin.left + margin.right) / 2)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .text('Initiative Type Distribution')
    .attr('font-family', 'Inter, -apple-system, sans-serif')
    .attr('font-size', '18px')
    .attr('font-weight', 'bold')
    .attr('fill', '#1f2937');

  // Add subtitle
  svg.append('text')
    .attr('x', (width + margin.left + margin.right) / 2)
    .attr('y', 42)
    .attr('text-anchor', 'middle')
    .text('Hierarchical view of cooperation initiative categories and types')
    .attr('font-family', 'Inter, -apple-system, sans-serif')
    .attr('font-size', '12px')
    .attr('font-style', 'italic')
    .attr('fill', '#6b7280');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create hierarchy
  const root = d3.hierarchy(treemapData)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  // Create treemap layout
  const treemap = d3.treemap()
    .size([width, height])
    .padding(2)
    .round(true);

  treemap(root);

  // Color scale with better cooperation-themed colors
  const colorScale = d3.scaleOrdinal()
    .domain(treemapData.children.map(d => d.name))
    .range([
      '#2563EB', // Blue - Technology & Digital
      '#059669', // Green - Environmental & Sustainability  
      '#DC2626', // Red - Health & Social
      '#F59E0B', // Orange - Economic & Trade
      '#7C3AED', // Purple - Education & Research
      '#0891B2', // Cyan - Infrastructure
      '#BE185D', // Pink - Cultural & Arts
      '#65A30D'  // Lime - Governance & Policy
    ]);

  // Create leaf nodes
  const leaf = g.selectAll('.leaf')
    .data(root.leaves())
    .enter().append('g')
    .attr('class', 'leaf')
    .attr('transform', d => `translate(${d.x0},${d.y0})`);

  // Add rectangles
  leaf.append('rect')
    .attr('width', d => Math.max(0, d.x1 - d.x0))
    .attr('height', d => Math.max(0, d.y1 - d.y0))
    .attr('fill', d => {
      const parentName = d.parent.data.name;
      return colorScale(parentName);
    })
    .attr('fill-opacity', 0.8)
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 2)
    .attr('rx', 4)
    .attr('ry', 4)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('fill-opacity', 1)
        .attr('stroke-width', 3);
      
      showTooltip(event, d);
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .attr('fill-opacity', 0.8)
        .attr('stroke-width', 2);
      
      hideTooltip();
    })
    .on('click', function(event, d) {
      console.log(`Clicked on: ${d.data.name} - implement drill-down`);
    });

  // Add enhanced text labels with better contrast
  leaf.append('text')
    .attr('x', 6)
    .attr('y', 16)
    .text(d => {
      const rectWidth = d.x1 - d.x0;
      const rectHeight = d.y1 - d.y0;
      
      // Only show text if rectangle is large enough
      if (rectWidth < 60 || rectHeight < 30) return '';
      
      let text = d.data.name;
      // Smarter truncation based on available space
      const maxChars = Math.floor(rectWidth / 8);
      if (text.length > maxChars && rectWidth < 120) {
        // Try to break at word boundaries
        const words = text.split(' ');
        if (words.length > 1) {
          text = words[0];
          if (text.length < maxChars - 3) {
            text += '...';
          }
        } else {
          text = text.substring(0, maxChars - 3) + '...';
        }
      }
      return text;
    })
    .attr('font-family', 'Inter, -apple-system, sans-serif')
    .attr('font-size', d => {
      const rectWidth = d.x1 - d.x0;
      const rectHeight = d.y1 - d.y0;
      
      if (rectWidth < 80 || rectHeight < 40) return '9px';
      if (rectWidth < 120 || rectHeight < 60) return '10px';
      return '11px';
    })
    .attr('font-weight', '600')
    .attr('fill', '#ffffff')
    .style('text-shadow', '1px 1px 3px rgba(0,0,0,0.7)')
    .style('paint-order', 'stroke fill')
    .style('stroke', 'rgba(0,0,0,0.3)')
    .style('stroke-width', '0.5px');

  // Add enhanced value labels
  leaf.append('text')
    .attr('x', 6)
    .attr('y', d => {
      const rectHeight = d.y1 - d.y0;
      const rectWidth = d.x1 - d.x0;
      
      if (rectWidth < 60 || rectHeight < 45) return 0; // Don't show if too small
      return rectHeight > 60 ? 32 : 28;
    })
    .text(d => {
      const rectWidth = d.x1 - d.x0;
      const rectHeight = d.y1 - d.y0;
      
      if (rectWidth < 60 || rectHeight < 45) return '';
      
      // Display count with better formatting
      const displayValue = d.data.count || d.data.value;
      if (displayValue === 1) return '1 doc';
      if (displayValue < 10) return `${displayValue} docs`;
      return `${displayValue} docs`;
    })
    .attr('font-family', 'Inter, -apple-system, sans-serif')
    .attr('font-size', '9px')
    .attr('font-weight', '500')
    .attr('fill', '#ffffff')
    .attr('fill-opacity', 0.9)
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)');

  // Add percentage labels for larger rectangles
  leaf.append('text')
    .attr('x', d => (d.x1 - d.x0) - 6)
    .attr('y', 16)
    .attr('text-anchor', 'end')
    .text(d => {
      const rectWidth = d.x1 - d.x0;
      const rectHeight = d.y1 - d.y0;
      
      if (rectWidth < 100 || rectHeight < 50) return '';
      
      const percentage = ((d.data.value / root.value) * 100).toFixed(1);
      return `${percentage}%`;
    })
    .attr('font-family', 'Inter, -apple-system, sans-serif')
    .attr('font-size', '9px')
    .attr('font-weight', '600')
    .attr('fill', '#ffffff')
    .attr('fill-opacity', 0.8)
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)');

  // Create enhanced category legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(200, ${height + margin.top + 20})`);

  // Legend background
  const legendWidth = Math.min(width - 180, treemapData.children.length * 150);
  legend.append('rect')
    .attr('x', -10)
    .attr('y', -5)
    .attr('width', legendWidth + 20)
    .attr('height', 55)
    .attr('fill', 'rgba(248, 250, 252, 0.95)')
    .attr('stroke', 'rgba(0, 0, 0, 0.1)')
    .attr('stroke-width', 1)
    .attr('rx', 8)
    .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

  // Legend title
  legend.append('text')
    .attr('x', 2)
    .attr('y', 12)
    .text('🏷️ Initiative Categories')
    .attr('font-family', 'Inter, -apple-system, sans-serif')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', '#1f2937');

  const legendItems = legend.selectAll('.legend-item')
    .data(treemapData.children)
    .enter().append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => {
      const itemsPerRow = Math.floor(legendWidth / 150);
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      return `translate(${col * 150}, ${25 + row * 20})`;
    })
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      // Highlight all rectangles of this category
      leaf.selectAll('rect')
        .transition()
        .duration(200)
        .attr('fill-opacity', rect => {
          return rect.parent.data.name === d.name ? 1 : 0.3;
        });
    })
    .on('mouseout', function() {
      // Reset all rectangles
      leaf.selectAll('rect')
        .transition()
        .duration(200)
        .attr('fill-opacity', 0.8);
    });

  legendItems.append('rect')
    .attr('width', 14)
    .attr('height', 14)
    .attr('fill', d => colorScale(d.name))
    .attr('rx', 3)
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 1);

  legendItems.append('text')
    .attr('x', 20)
    .attr('y', 11)
    .text(d => {
      // Truncate long category names for legend
      const maxLength = 15;
      return d.name.length > maxLength ? d.name.substring(0, maxLength) + '...' : d.name;
    })
    .attr('font-family', 'Inter, -apple-system, sans-serif')
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .attr('fill', '#374151');

  // Add count badge for each category
  legendItems.append('text')
    .attr('x', 140)
    .attr('y', 11)
    .attr('text-anchor', 'end')
    .text(d => `(${d.children ? d.children.length : d.value})`)
    .attr('font-family', 'Inter, -apple-system, sans-serif')
    .attr('font-size', '9px')
    .attr('font-weight', '400')
    .attr('fill', '#6b7280');

  // Enhanced tooltip with better positioning and content
  let tooltip = null;

  function showTooltip(event, d) {
    if (tooltip) hideTooltip();
    
    tooltip = d3.select('body').append('div')
      .attr('class', 'treemap-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#ffffff')
      .style('padding', '12px 16px')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.3)')
      .style('font-family', 'Inter, -apple-system, sans-serif')
      .style('font-size', '13px')
      .style('line-height', '1.4')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('max-width', '250px')
      .style('opacity', 0);

    const parentName = d.parent.data.name;
    const percentage = ((d.data.value / root.value) * 100).toFixed(1);
    const docCount = d.data.count || d.data.value;
    
    tooltip.html(`
      <div style="font-weight: 600; margin-bottom: 6px; color: #ffffff;">${d.data.name}</div>
      <div style="margin-bottom: 4px;">📂 Category: ${parentName}</div>
      <div style="margin-bottom: 4px;">📊 Initiatives: ${d.data.value}</div>
      <div style="margin-bottom: 4px;">📈 Share: ${percentage}%</div>
      <div>📄 Documents: ${docCount}</div>
    `);

    const tooltipNode = tooltip.node();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    
    // Better positioning to avoid edge cases
    let left = event.pageX - tooltipRect.width / 2;
    let top = event.pageY - tooltipRect.height - 15;
    
    // Adjust if tooltip would go off screen
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) top = event.pageY + 15;
    
    tooltip
      .style('left', left + 'px')
      .style('top', top + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  }

  function hideTooltip() {
    if (tooltip) {
      tooltip.transition()
        .duration(200)
        .style('opacity', 0)
        .remove();
      tooltip = null;
    }
  }

  // Add statistics overlay with better positioning
  const stats = svg.append('g')
    .attr('class', 'stats-overlay')
    .attr('transform', `translate(20, ${height + margin.top + 20})`);

  stats.append('rect')
    .attr('width', 160)
    .attr('height', 90)
    .attr('fill', 'rgba(248, 250, 252, 0.95)')
    .attr('stroke', 'rgba(0, 0, 0, 0.1)')
    .attr('stroke-width', 1)
    .attr('rx', 8)
    .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

  // Header with icon
  stats.append('text')
    .attr('x', 12)
    .attr('y', 18)
    .text('📊 Initiative Overview')
    .attr('font-family', 'Inter, -apple-system, sans-serif')
    .attr('font-size', '13px')
    .attr('font-weight', '600')
    .attr('fill', '#1f2937');

  const totalInitiatives = root.value;
  const totalCategories = treemapData.children.length;
  const totalSubTypes = root.leaves().length;
  const avgPerCategory = (totalInitiatives / totalCategories).toFixed(1);

  // Statistics with better spacing and icons
  const statsData = [
    { label: 'Total Initiatives', value: totalInitiatives, icon: '🎯' },
    { label: 'Categories', value: totalCategories, icon: '📂' },
    { label: 'Initiative Types', value: totalSubTypes, icon: '🔍' },
    { label: 'Avg per Category', value: avgPerCategory, icon: '📈' }
  ];

  statsData.forEach((stat, i) => {
    const y = 36 + (i * 14);
    
    stats.append('text')
      .attr('x', 12)
      .attr('y', y)
      .text(`${stat.icon} ${stat.label}:`)
      .attr('font-family', 'Inter, -apple-system, sans-serif')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', '#374151');
    
    stats.append('text')
      .attr('x', 135)
      .attr('y', y)
      .attr('text-anchor', 'end')
      .text(stat.value)
      .attr('font-family', 'Inter, -apple-system, sans-serif')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#1f2937');
  });

  // Animation
  leaf.selectAll('rect')
    .attr('width', 0)
    .attr('height', 0)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 50)
    .attr('width', d => Math.max(0, d.x1 - d.x0))
    .attr('height', d => Math.max(0, d.y1 - d.y0));

  container.classList.remove('loading');
  
  return { svg, root, treemap };
};
