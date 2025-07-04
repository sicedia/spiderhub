/**
 * Lead Country Choropleth Chart Module
 * Renders a world map showing documents by lead country using color intensity
 */

// Mapping from numeric ISO codes to 3-letter ISO codes
const numericToAlpha3ISO = {
  '004': 'AFG', '008': 'ALB', '012': 'DZA', '016': 'ASM', '020': 'AND',
  '024': 'AGO', '028': 'ATG', '032': 'ARG', '036': 'AUS', '040': 'AUT',
  '044': 'BHS', '048': 'BHR', '050': 'BGD', '052': 'BRB', '056': 'BEL',
  '084': 'BLZ', '204': 'BEN', '060': 'BMU', '064': 'BTN', '068': 'BOL',
  '070': 'BIH', '072': 'BWA', '074': 'BVT', '076': 'BRA', '086': 'IOT',
  '096': 'BRN', '100': 'BGR', '854': 'BFA', '108': 'BDI', '116': 'KHM',
  '120': 'CMR', '124': 'CAN', '132': 'CPV', '136': 'CYM', '140': 'CAF',
  '148': 'TCD', '152': 'CHL', '156': 'CHN', '162': 'CXR', '166': 'CCK',
  '170': 'COL', '174': 'COM', '178': 'COG', '180': 'COD', '184': 'COK',
  '188': 'CRI', '191': 'HRV', '192': 'CUB', '196': 'CYP', '203': 'CZE',
  '208': 'DNK', '262': 'DJI', '212': 'DMA', '214': 'DOM', '218': 'ECU',
  '818': 'EGY', '222': 'SLV', '226': 'GNQ', '232': 'ERI', '233': 'EST',
  '231': 'ETH', '238': 'FLK', '234': 'FRO', '242': 'FJI', '246': 'FIN',
  '250': 'FRA', '254': 'GUF', '258': 'PYF', '260': 'ATF', '266': 'GAB',
  '270': 'GMB', '268': 'GEO', '276': 'DEU', '288': 'GHA', '292': 'GIB',
  '300': 'GRC', '304': 'GRL', '308': 'GRD', '312': 'GLP', '316': 'GUM',
  '320': 'GTM', '324': 'GIN', '624': 'GNB', '328': 'GUY', '332': 'HTI',
  '334': 'HMD', '336': 'VAT', '340': 'HND', '344': 'HKG', '348': 'HUN',
  '352': 'ISL', '356': 'IND', '360': 'IDN', '364': 'IRN', '368': 'IRQ',
  '372': 'IRL', '376': 'ISR', '380': 'ITA', '384': 'CIV', '388': 'JAM',
  '392': 'JPN', '400': 'JOR', '398': 'KAZ', '404': 'KEN', '296': 'KIR',
  '408': 'PRK', '410': 'KOR', '414': 'KWT', '417': 'KGZ', '418': 'LAO',
  '428': 'LVA', '422': 'LBN', '426': 'LSO', '430': 'LBR', '434': 'LBY',
  '438': 'LIE', '440': 'LTU', '442': 'LUX', '446': 'MAC', '807': 'MKD',
  '450': 'MDG', '454': 'MWI', '458': 'MYS', '462': 'MDV', '466': 'MLI',
  '470': 'MLT', '584': 'MHL', '474': 'MTQ', '478': 'MRT', '480': 'MUS',
  '175': 'MYT', '484': 'MEX', '583': 'FSM', '498': 'MDA', '492': 'MCO',
  '496': 'MNG', '499': 'MNE', '500': 'MSR', '504': 'MAR', '508': 'MOZ',
  '104': 'MMR', '516': 'NAM', '520': 'NRU', '524': 'NPL', '528': 'NLD',
  '530': 'ANT', '540': 'NCL', '554': 'NZL', '558': 'NIC', '562': 'NER',
  '566': 'NGA', '570': 'NIU', '574': 'NFK', '580': 'MNP', '578': 'NOR',
  '512': 'OMN', '586': 'PAK', '585': 'PLW', '275': 'PSE', '591': 'PAN',
  '598': 'PNG', '600': 'PRY', '604': 'PER', '608': 'PHL', '612': 'PCN',
  '616': 'POL', '620': 'PRT', '630': 'PRI', '634': 'QAT', '638': 'REU',
  '642': 'ROU', '643': 'RUS', '646': 'RWA', '652': 'BLM', '654': 'SHN',
  '659': 'KNA', '662': 'LCA', '663': 'MAF', '666': 'SPM', '670': 'VCT',
  '674': 'SMR', '678': 'STP', '682': 'SAU', '686': 'SEN', '688': 'SRB',
  '690': 'SYC', '694': 'SLE', '702': 'SGP', '703': 'SVK', '705': 'SVN',
  '090': 'SLB', '706': 'SOM', '710': 'ZAF', '239': 'SGS', '724': 'ESP',
  '144': 'LKA', '736': 'SDN', '740': 'SUR', '744': 'SJM', '748': 'SWZ',
  '752': 'SWE', '756': 'CHE', '760': 'SYR', '158': 'TWN', '762': 'TJK',
  '834': 'TZA', '764': 'THA', '626': 'TLS', '768': 'TGO', '772': 'TKL',
  '776': 'TON', '780': 'TTO', '788': 'TUN', '792': 'TUR', '795': 'TKM',
  '796': 'TCA', '798': 'TUV', '800': 'UGA', '804': 'UKR', '784': 'ARE',
  '826': 'GBR', '840': 'USA', '581': 'UMI', '858': 'URY', '860': 'UZB',
  '548': 'VUT', '862': 'VEN', '704': 'VNM', '092': 'VGB', '850': 'VIR',
  '876': 'WLF', '732': 'ESH', '887': 'YEM', '894': 'ZMB', '716': 'ZWE'
};

/**
 * Get ISO3 code from country feature, handling both numeric and alpha-3 codes
 */
function getISO3Code(feature) {
  // Try to get direct alpha-3 codes first
  const directIso3 = feature.properties.ISO_A3 || 
                     feature.properties.iso_a3 || 
                     feature.properties.ADM0_A3 || 
                     feature.properties.ISO3 || 
                     feature.properties.iso3 || 
                     feature.properties.ADM0_ISO || 
                     feature.properties.SOV_A3 ||
                     feature.properties.SU_A3;
  
  if (directIso3 && directIso3.length === 3 && directIso3.match(/^[A-Z]{3}$/)) {
    return directIso3;
  }
  
  // Try to convert numeric codes to alpha-3
  const numericCode = feature.id || feature.properties.id || feature.properties.ISO_N3;
  if (numericCode) {
    const paddedCode = String(numericCode).padStart(3, '0');
    const convertedIso3 = numericToAlpha3ISO[paddedCode];
    if (convertedIso3) {
      return convertedIso3;
    }
  }
  
  // Fallback to any available identifier
  return directIso3 || numericCode || 'UNKNOWN';
}

/**
 * Render choropleth map of lead countries.
 * @param {Object.<string, number>} counts - e.g. { "BRA": 25, "ARG": 18, "CHL": 12 }
 */
export const renderLeadCountryChoroplethChart = async (counts) => {
  const container = document.getElementById('lead-countries-chart');
  if (!container) {
    console.warn('Lead countries chart container not found');
    return;
  }

  // Always show the map - even if no lead countries
  const hasLeadCountryData = counts && typeof counts === 'object' && Object.keys(counts).length > 0;
  const safeCountsData = hasLeadCountryData ? counts : {};

  // Clear existing content
  container.innerHTML = '';
  
  // Add loading state
  container.classList.add('loading');

  // Wait for D3 to be available
  if (!window.d3) {
    container.classList.remove('loading');
    container.innerHTML = '<div class="placeholder-content">Map library not available</div>';
    return;
  }

  // Set up dimensions for world map with better centering
  const containerRect = container.getBoundingClientRect();
  const margin = { top: 50, right: 50, bottom: 100, left: 50 }; // Márgenes más equilibrados
  const width = Math.max(800, containerRect.width) - margin.left - margin.right;
  const height = Math.max(500, width * 0.55) - margin.top - margin.bottom;

  // Create SVG with zoom capability
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('background', '#f8fafc')
    .style('border-radius', '8px');

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.5, 8])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'choropleth-tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background', 'rgba(17, 24, 39, 0.95)')
    .style('color', '#F9FAFB')
    .style('padding', '12px')
    .style('border-radius', '8px')
    .style('border', '1px solid #4B5563')
    .style('font-family', 'Roboto, sans-serif')
    .style('font-size', '13px')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
    .style('pointer-events', 'none')
    .style('z-index', '1000');

  try {
    // Load world map data (try CDN first, fallback to database)
    const worldMapData = await loadWorldMapData();
    
    if (!worldMapData || !worldMapData.features || worldMapData.features.length === 0) {
      throw new Error('No world map data available');
    }
    
    // Set up projection for world view - better centered
    const projection = d3.geoNaturalEarth1()
      .scale(width / 7)
      .translate([width / 2, height / 2 + 10]) // Ajustar para centrar mejor considerando la leyenda
      .precision(0.1);

    const path = d3.geoPath().projection(projection);

    // Get data values for color scale
    const values = Object.values(safeCountsData);
    const maxValue = values.length > 0 ? d3.max(values) : 0;
    const minValue = values.length > 0 ? d3.min(values.filter(v => v > 0)) : 0;

    // Enhanced color scheme with better visual hierarchy
    const colorScheme = {
      // High-impact countries (7-10+ documents)
      high: ['#1e3a8a', '#1e40af', '#3b82f6'],
      // Medium-impact countries (4-6 documents) 
      medium: ['#059669', '#10b981', '#34d399'],
      // Low-impact countries (1-3 documents)
      low: ['#f59e0b', '#fbbf24', '#fde047'],
      // No data
      none: '#f3f4f6'
    };

    // Create enhanced discrete color scale based on data distribution
    const getCountryColor = (count) => {
      if (count === 0) return colorScheme.none;
      if (count >= 7) return colorScheme.high[Math.min(2, Math.floor((count - 7) / 2))];
      if (count >= 4) return colorScheme.medium[Math.min(2, count - 4)];
      return colorScheme.low[Math.min(2, count - 1)];
    };

    // Legacy color scales for comparison
    const colorScale = d3.scaleSequential()
      .domain([0, maxValue || 1])
      .interpolator(d3.interpolateYlOrRd)
      .clamp(true);

    const discreteColorScale = d3.scaleThreshold()
      .domain([1, 3, 5, 7, 10])
      .range(['#fde047', '#fbbf24', '#34d399', '#10b981', '#3b82f6', '#1e40af']);

    // Create countries group
    const countriesGroup = g.append('g').attr('class', 'countries');

    // Draw countries
    const countries = countriesGroup.selectAll('path')
      .data(worldMapData.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', d => {
        // Use the new robust ISO3 detection function
        const iso3 = getISO3Code(d);
                     
        const count = safeCountsData[iso3] || 0;
        
        return `country ${count > 0 ? 'lead' : 'non-lead'}`;
      })
      .style('fill', d => {
        // Use the new robust ISO3 detection function
        const iso3 = getISO3Code(d);
        const count = safeCountsData[iso3] || 0;
        
        // Use the enhanced color scheme
        const color = getCountryColor(count);
        
        return color;
      })
      .style('stroke', '#ffffff')
      .style('stroke-width', 0.5)
      .style('cursor', d => {
        const iso3 = getISO3Code(d);
        return safeCountsData[iso3] > 0 ? 'pointer' : 'default';
      })
      .on('mouseover', function(event, d) {
        const iso3 = getISO3Code(d);
                     
        const countryName = d.properties.name || d.properties.NAME || d.properties.NAME_EN || iso3;
        const count = safeCountsData[iso3] || 0;
        
        // Always show border highlight on hover
        d3.select(this)
          .style('stroke', count > 0 ? '#1e40af' : '#6b7280')
          .style('stroke-width', 2);

        // Show tooltip for all countries
        tooltip.transition()
          .duration(200)
          .style('opacity', 1);
        
        if (count > 0) {
          // Enhanced lead country tooltip
          const total = Object.values(safeCountsData).reduce((sum, val) => sum + val, 0);
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          const documentText = count === 1 ? 'document' : 'documents';
          
          // Determine leadership level
          let leadershipLevel = 'Emerging';
          let levelColor = '#fbbf24';
          if (count >= 10) { leadershipLevel = 'Champion'; levelColor = '#1e40af'; }
          else if (count >= 7) { leadershipLevel = 'Leading'; levelColor = '#3b82f6'; }
          else if (count >= 4) { leadershipLevel = 'Active'; levelColor = '#10b981'; }
          
          // Get ranking
          const sortedCountries = Object.entries(safeCountsData).sort(([,a], [,b]) => b - a);
          const rank = sortedCountries.findIndex(([iso]) => iso === iso3) + 1;
          const rankSuffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
          
          tooltip.html(`
            <div style="border-bottom: 1px solid rgba(59, 130, 246, 0.3); padding-bottom: 8px; margin-bottom: 8px;">
              <div style="font-weight: 700; font-size: 16px; color: #F9FAFB; margin-bottom: 4px;">${countryName}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="
                  background: ${levelColor}; 
                  color: white; 
                  padding: 2px 8px; 
                  border-radius: 12px; 
                  font-size: 11px; 
                  font-weight: 600;
                ">${leadershipLevel}</span>
                <span style="color: #D1D5DB; font-size: 12px;">#${rank} globally</span>
              </div>
            </div>
            <div style="margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 18px;">📋</span>
                <span style="font-weight: 600; color: #F9FAFB;">${count} ${documentText}</span>
                <span style="color: #93C5FD;">as lead country</span>
              </div>
              <div style="color: #D1D5DB; font-size: 13px;">
                <span style="color: #34D399;">${percentage}%</span> of all EU-LAC digital initiatives
              </div>
            </div>
            <div style="border-top: 1px solid rgba(156, 163, 175, 0.3); padding-top: 6px; font-size: 11px; color: #9CA3AF;">
              ISO Code: ${iso3} • Rank: ${rank}${rankSuffix} of ${sortedCountries.length}
            </div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        } else {
          // Enhanced non-lead country tooltip
          const message = hasLeadCountryData ? 'No documents as lead country' : 'No lead country data available yet';
          const totalLeadCountries = Object.keys(safeCountsData).length;
          const totalDocuments = Object.values(safeCountsData).reduce((sum, val) => sum + val, 0);
          
          tooltip.html(`
            <div style="border-bottom: 1px solid rgba(156, 163, 175, 0.3); padding-bottom: 8px; margin-bottom: 8px;">
              <div style="font-weight: 700; font-size: 16px; color: #F9FAFB; margin-bottom: 4px;">${countryName}</div>
              <span style="
                background: #6b7280; 
                color: white; 
                padding: 2px 8px; 
                border-radius: 12px; 
                font-size: 11px; 
                font-weight: 600;
              ">Participant</span>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 16px;">🤝</span>
                <span style="color: #9CA3AF; font-size: 14px;">${message}</span>
              </div>
              <div style="color: #D1D5DB; font-size: 13px;">
                May participate in initiatives led by other countries
              </div>
            </div>
            <div style="border-top: 1px solid rgba(156, 163, 175, 0.3); padding-top: 6px; font-size: 11px; color: #9CA3AF;">
              ISO Code: ${iso3} • ${totalLeadCountries} countries leading ${totalDocuments} initiatives
            </div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        }
      })
      .on('mouseout', function(event, d) {
        // Reset stroke for all countries
        d3.select(this)
          .style('stroke', '#ffffff')
          .style('stroke-width', 0.5);

        tooltip.transition()
          .duration(200)
          .style('opacity', 0);
      });

    // Add enhanced title and subtitle - perfectly centered
    const titleGroup = g.append('g').attr('class', 'title-group');
    
    titleGroup.append('text')
      .attr('x', width / 2)
      .attr('y', -30) // Más espacio arriba con nuevos márgenes
      .attr('text-anchor', 'middle')
      .style('font-family', 'Roboto, sans-serif')
      .style('font-size', '18px')
      .style('font-weight', '700')
      .style('fill', '#1f2937')
      .text('EU-LAC Digital Cooperation Leadership');

    titleGroup.append('text')
      .attr('x', width / 2)
      .attr('y', -12) // Ajustar posición del subtítulo
      .attr('text-anchor', 'middle')
      .style('font-family', 'Roboto, sans-serif')
      .style('font-size', '13px')
      .style('font-weight', '400')
      .style('fill', '#6b7280')
      .text(`${Object.keys(safeCountsData).length} countries leading ${Object.values(safeCountsData).reduce((sum, count) => sum + count, 0)} digital transformation initiatives`);

    // Create legend with enhanced design
    createLegend(g, maxValue > 10 ? colorScale : discreteColorScale, maxValue, width, height);

    // Country labels removed per user request - keeping only color coding and tooltips
    // addCountryLabels(g, projection, safeCountsData, worldMapData);

    // Remove loading state
    container.classList.remove('loading');
    
    // Add success message
  } catch (error) {
    container.classList.remove('loading');
    
    // Show detailed error message
    container.innerHTML = `
      <div class="placeholder-content">
        <div class="chart-icon">⚠️</div>
        <div>Error loading choropleth map</div>
        <small>${error.message || 'Unknown error occurred'}</small>
        <div style="margin-top: 10px;">
          <button onclick="window.location.reload()" style="padding: 8px 16px; background: #094EB2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
};

/**
 * Create enhanced color legend for the choropleth map
 */
function createLegend(g, colorScale, maxValue, width, height) {
  const legendWidth = 240;
  const legendHeight = 20;
  const legendX = (width - legendWidth) / 2; // Centrar horizontalmente
  const legendY = height - 40; // Ajustar para los nuevos márgenes

  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${legendX}, ${legendY})`);

  // Enhanced legend with meaningful categories
  const legendData = [
    { range: '1-3', color: '#fde047', label: 'Emerging' },
    { range: '4-6', color: '#34d399', label: 'Active' },
    { range: '7-9', color: '#3b82f6', label: 'Leading' },
    { range: '10+', color: '#1e40af', label: 'Champion' }
  ];

  const rectWidth = legendWidth / legendData.length;

  legendData.forEach((item, i) => {
    // Create legend item group
    const legendItem = legend.append('g')
      .attr('class', 'legend-item')
      .attr('transform', `translate(${i * rectWidth}, 0)`);

    // Color rectangle
    legendItem.append('rect')
      .attr('width', rectWidth - 2)
      .attr('height', legendHeight)
      .style('fill', item.color)
      .style('stroke', '#ffffff')
      .style('stroke-width', 1)
      .style('rx', 3);

    // Range text
    legendItem.append('text')
      .attr('x', rectWidth / 2 - 1)
      .attr('y', legendHeight + 15)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Roboto, sans-serif')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', '#374151')
      .text(item.range);

    // Category label
    legendItem.append('text')
      .attr('x', rectWidth / 2 - 1)
      .attr('y', legendHeight + 30)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Roboto, sans-serif')
      .style('font-size', '10px')
      .style('font-weight', '500')
      .style('fill', '#6b7280')
      .text(item.label);
  });

  // Legend title
  legend.append('text')
    .attr('x', legendWidth / 2)
    .attr('y', -12)
    .attr('text-anchor', 'middle')
    .style('font-family', 'Roboto, sans-serif')
    .style('font-size', '13px')
    .style('font-weight', '600')
    .style('fill', '#374151')
    .text('Documents as Lead Country');
}

/**
 * Add enhanced labels for top countries with better visibility and information
 */
function addCountryLabels(g, projection, counts, worldMapData) {
  // Get top 8 countries for better coverage
  const topCountries = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);

  const labels = g.append('g').attr('class', 'country-labels');

  // Country name mapping for better display
  const countryNames = {
    'URY': 'Uruguay', 'ARG': 'Argentina', 'CHL': 'Chile', 'ESP': 'Spain',
    'BEL': 'Belgium', 'USA': 'United States', 'FRA': 'France', 'COL': 'Colombia',
    'BRA': 'Brazil', 'DOM': 'Dominican Rep.', 'CRI': 'Costa Rica', 'DEU': 'Germany',
    'ECU': 'Ecuador', 'AUT': 'Austria', 'BLZ': 'Belize', 'BRB': 'Barbados',
    'GBR': 'United Kingdom', 'CHE': 'Switzerland', 'VCT': 'St. Vincent', 
    'NLD': 'Netherlands', 'ATG': 'Antigua', 'PAN': 'Panama', 'ETH': 'Ethiopia',
    'BWA': 'Botswana', 'PER': 'Peru', 'CZE': 'Czech Rep.', 'BHR': 'Bahrain'
  };

  topCountries.forEach(([iso3, count], index) => {
    const feature = worldMapData.features.find(f => {
      const featureIso3 = getISO3Code(f);
      return featureIso3 === iso3;
    });
    
    if (feature) {
      const centroid = d3.geoPath().projection(projection).centroid(feature);
      
      if (centroid[0] && centroid[1] && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
        // Create label group for this country
        const labelGroup = labels.append('g')
          .attr('class', `country-label-${iso3}`)
          .attr('transform', `translate(${centroid[0]}, ${centroid[1]})`);

        // Determine size based on ranking and count
        const baseRadius = Math.max(14, Math.min(22, 14 + (count / 2)));
        const isTopThree = index < 3;
        
        // Add glow effect for top countries
        if (isTopThree) {
          labelGroup.append('circle')
            .attr('r', baseRadius + 4)
            .style('fill', '#1e40af')
            .style('opacity', 0.3)
            .style('filter', 'blur(2px)');
        }

        // Main background circle with gradient
        labelGroup.append('circle')
          .attr('r', baseRadius)
          .style('fill', isTopThree ? '#1e40af' : '#3b82f6')
          .style('stroke', '#ffffff')
          .style('stroke-width', isTopThree ? 3 : 2)
          .style('opacity', 0.95)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');

        // Add count text (larger and bolder)
        labelGroup.append('text')
          .attr('y', -2)
          .attr('text-anchor', 'middle')
          .style('font-family', 'Roboto, sans-serif')
          .style('font-size', isTopThree ? '14px' : '12px')
          .style('font-weight', '700')
          .style('fill', '#ffffff')
          .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.5)')
          .style('pointer-events', 'none')
          .text(count);

        // Add rank indicator for top 3
        if (isTopThree) {
          labelGroup.append('text')
            .attr('y', 10)
            .attr('text-anchor', 'middle')
            .style('font-family', 'Roboto, sans-serif')
            .style('font-size', '9px')
            .style('font-weight', '600')
            .style('fill', '#fbbf24')
            .style('text-shadow', '1px 1px 1px rgba(0,0,0,0.8)')
            .style('pointer-events', 'none')
            .text(`#${index + 1}`);
        }

        // Add country name tooltip on hover
        labelGroup
          .style('cursor', 'pointer')
          .on('mouseover', function(event) {
            const tooltip = d3.select('body').append('div')
              .attr('class', 'country-label-tooltip')
              .style('position', 'absolute')
              .style('background', 'rgba(17, 24, 39, 0.95)')
              .style('color', '#F9FAFB')
              .style('padding', '8px 12px')
              .style('border-radius', '6px')
              .style('font-family', 'Roboto, sans-serif')
              .style('font-size', '13px')
              .style('font-weight', '500')
              .style('pointer-events', 'none')
              .style('z-index', '1001')
              .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
              .style('opacity', 0)
              .html(`
                <div style="font-weight: 600; margin-bottom: 4px;">${countryNames[iso3] || iso3}</div>
                <div>${count} documents as lead country</div>
                <div style="color: #93C5FD; font-size: 11px;">Rank #${index + 1}</div>
              `);

            tooltip.transition()
              .duration(200)
              .style('opacity', 1);

            tooltip
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');

            // Highlight the circle
            d3.select(this).select('circle')
              .transition()
              .duration(200)
              .style('stroke-width', isTopThree ? 4 : 3)
              .style('stroke', '#fbbf24');
          })
          .on('mouseout', function() {
            d3.select('.country-label-tooltip').remove();
            
            // Reset circle highlight
            d3.select(this).select('circle')
              .transition()
              .duration(200)
              .style('stroke-width', isTopThree ? 3 : 2)
              .style('stroke', '#ffffff');
          });
      }
    }
  });
}

/**
 * Load world map data - try CDN first, then database, then fallback
 */
async function loadWorldMapData() {
  
  try {
    // First try to load from Natural Earth CDN (real world boundaries)
    const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    if (response.ok) {
      const worldData = await response.json();
      
      // Convert topojson to geojson if needed
      if (window.topojson && worldData.objects && worldData.objects.countries) {
        const countries = window.topojson.feature(worldData, worldData.objects.countries);
        return countries;
      } else if (worldData.features) {
        // Already in GeoJSON format
        return worldData;
      } else {
        console.warn('CDN data format not recognized:', Object.keys(worldData));
      }
    } else {
      console.warn('CDN response not ok:', response.status, response.statusText);
    }
  } catch (error) {
    console.warn('❌ Could not load world map from CDN:', error);
  }

  try {
    // Fallback to simplified world boundaries from CDN
    const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
    if (response.ok) {
      const worldData = await response.json();
      return worldData;
    }
  } catch (error) {
    // Could not load simplified world map
  }

  try {
    // Try the database approach
    const { generateWorldMapFromDatabase } = await import('./worldMapData.js');
    const dbMap = await generateWorldMapFromDatabase();
    if (dbMap && dbMap.features && dbMap.features.length > 0) {
      return dbMap;
    }
  } catch (error) {
    console.warn('❌ Could not generate map from database:', error);
  }

  // Ultimate fallback - minimal world map
  console.warn('⚠️  Using minimal fallback world map');
  const fallbackMap = {
    "type": "FeatureCollection",
    "features": [
      // Brazil
      {
        "type": "Feature",
        "properties": { "NAME": "Brazil", "ISO_A3": "BRA", "iso_a3": "BRA" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[-74.0, 5.0], [-34.0, 5.0], [-34.0, -33.0], [-74.0, -33.0], [-74.0, 5.0]]]
        }
      },
      // Argentina
      {
        "type": "Feature", 
        "properties": { "NAME": "Argentina", "ISO_A3": "ARG", "iso_a3": "ARG" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[-73.0, -21.0], [-53.0, -21.0], [-53.0, -55.0], [-73.0, -55.0], [-73.0, -21.0]]]
        }
      },
      // United States
      {
        "type": "Feature",
        "properties": { "NAME": "United States", "ISO_A3": "USA", "iso_a3": "USA" },
        "geometry": {
          "type": "Polygon", 
          "coordinates": [[[-171.8, 71.4], [-66.9, 71.4], [-66.9, 18.9], [-171.8, 18.9], [-171.8, 71.4]]]
        }
      },
      // Spain
      {
        "type": "Feature",
        "properties": { "NAME": "Spain", "ISO_A3": "ESP", "iso_a3": "ESP" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[-9.3, 43.8], [3.3, 43.8], [3.3, 36.0], [-9.3, 36.0], [-9.3, 43.8]]]
        }
      },
      // Germany
      {
        "type": "Feature",
        "properties": { "NAME": "Germany", "ISO_A3": "DEU", "iso_a3": "DEU" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[5.9, 55.1], [15.0, 55.1], [15.0, 47.3], [5.9, 47.3], [5.9, 55.1]]]
        }
      },
      // France
      {
        "type": "Feature",
        "properties": { "NAME": "France", "ISO_A3": "FRA", "iso_a3": "FRA" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[-5.1, 51.1], [9.6, 51.1], [9.6, 41.3], [-5.1, 41.3], [-5.1, 51.1]]]
        }
      },
      // Chile
      {
        "type": "Feature",
        "properties": { "NAME": "Chile", "ISO_A3": "CHL", "iso_a3": "CHL" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[-75.6, -17.6], [-67.0, -17.6], [-67.0, -55.6], [-75.6, -55.6], [-75.6, -17.6]]]
        }
      },
      // Colombia
      {
        "type": "Feature",
        "properties": { "NAME": "Colombia", "ISO_A3": "COL", "iso_a3": "COL" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[-79.0, 12.4], [-66.9, 12.4], [-66.9, -4.2], [-79.0, -4.2], [-79.0, 12.4]]]
        }
      }
    ]
  };
  
  return fallbackMap;
}

/**
 * Clean up chart and observers
 * @param {string} containerId - ID of the chart container
 */
export const destroyLeadCountryChoroplethChart = (containerId = 'lead-countries-chart') => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Remove tooltip if it exists
  d3.select('.choropleth-tooltip').remove();
  
  // Clear container
  container.innerHTML = '';
  container.classList.remove('loading');
};
