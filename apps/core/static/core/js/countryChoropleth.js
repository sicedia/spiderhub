/**
 * Country Choropleth Chart Module
 * Renders choropleth map showing documents per lead country
 */

/**
 * Render choropleth showing documents per lead country.
 * @param {Object.<string, number>} counts - e.g. { URY:7, ECU:15, BRA:20 }
 */
export const renderCountryChoropleth = async (counts) => {
  const container = document.getElementById('choropleth-chart');
  if (!container) {
    console.warn('Choropleth chart container not found');
    return;
  }

  // Create canvas if it doesn't exist
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');

  // Clean up if chart already exists
  if (canvas.__chart) { 
    canvas.__chart.destroy(); 
  }

  // Add loading state
  container.classList.add('loading');

  // Wait for Chart.js to be available
  const Chart = window.Chart;
  
  if (!Chart) {
    console.error('Chart.js not loaded');
    container.classList.remove('loading');
    return;
  }

  // Check if chartjs-chart-geo is available and try to register
  const hasGeoChart = window.ChartGeo;
  let hasChoropleth = false;
  
  if (hasGeoChart) {
    try {
      // Try to register the choropleth controller
      Chart.register(
        hasGeoChart.ChoroplethController,
        hasGeoChart.GeoFeature,
        hasGeoChart.ColorScale,
        hasGeoChart.ProjectionScale
      );
      hasChoropleth = Chart.registry.getController('choropleth');
    } catch (error) {
      console.warn('Failed to register choropleth components:', error);
    }
  }

  if (!hasChoropleth) {
    console.warn('choropleth no disponible – pintaré bar chart');
    // Create a simple bar chart instead of choropleth
    canvas.__chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          label: 'Documents by Country',
          data: Object.values(counts),
          backgroundColor: 'rgba(9, 78, 178, 0.6)',
          borderColor: '#094EB2',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: false 
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#333',
            bodyColor: '#666',
            borderColor: '#094EB2',
            borderWidth: 1,
            cornerRadius: 6,
            titleFont: {
              family: 'Roboto',
              weight: '600'
            },
            bodyFont: {
              family: 'Roboto'
            },
            callbacks: {
              title: (context) => '',
              label: (context) => {
                const flag = getCountryFlag(context.label);
                return `${flag} ${context.label}: ${context.parsed.y} document${context.parsed.y !== 1 ? 's' : ''}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeOutCubic',
          onComplete: () => {
            container.classList.remove('loading');
          },
        },
      },
    });

    // Handle responsive resize
    const resizeObserver = new ResizeObserver(() => {
      if (canvas.__chart) {
        canvas.__chart.resize();
      }
    });
    
    resizeObserver.observe(container);
    
    // Store observer for cleanup
    canvas.__resizeObserver = resizeObserver;
    return;
  }

  // If we get here, choropleth is available - implement choropleth chart
  // Fetch world countries data - using a simplified approach with mock data
  const countries = createMockCountries();

  // Create choropleth chart (this code would only run if choropleth is properly registered)
  try {
    canvas.__chart = new Chart(ctx, {
      type: 'choropleth',
      data: {
        labels: countries.map(c => c.properties.name),
        datasets: [{
          label: 'Documents',
          data: countries.map(country => ({
            feature: country,
            value: counts[country.properties.iso_a3] || 0,
          })),
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        showOutline: true,
        showGraticule: false,
        scales: {
          projection: {
            axis: 'x',
            projection: 'equalEarth',
          },
          color: {
            axis: 'r',
            quantize: 6,
            interpolate: (v) => `rgba(9, 78, 178, ${0.15 + 0.85 * v})`,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#333',
            bodyColor: '#666',
            borderColor: '#094EB2',
            borderWidth: 1,
            cornerRadius: 6,
            callbacks: {
              title: () => '',
              label: (context) => {
                const { feature, value } = context.raw;
                const flag = getCountryFlag(feature.properties.iso_a3);
                return `${flag} ${feature.properties.name}: ${value} document${value !== 1 ? 's' : ''}`;
              },
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeOutCubic',
          onComplete: () => {
            container.classList.remove('loading');
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to create choropleth chart, falling back to bar chart:', error);
    // Fallback to bar chart if choropleth creation fails
    canvas.__chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          label: 'Documents by Country',
          data: Object.values(counts),
          backgroundColor: 'rgba(9, 78, 178, 0.6)',
          borderColor: '#094EB2',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const flag = getCountryFlag(context.label);
                return `${flag} ${context.label}: ${context.parsed.y} document${context.parsed.y !== 1 ? 's' : ''}`;
              },
            },
          },
        },
        animation: {
          onComplete: () => container.classList.remove('loading'),
        },
      },
    });
  }

  // Handle responsive resize
  const resizeObserver = new ResizeObserver(() => {
    if (canvas.__chart) {
      canvas.__chart.resize();
    }
  });
  
  resizeObserver.observe(container);
  
  // Store observer for cleanup
  canvas.__resizeObserver = resizeObserver;
};

/**
 * Clean up chart and observers
 * @param {string} containerId - ID of the chart container
 */
export const destroyCountryChoropleth = (containerId = 'choropleth-chart') => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const canvas = container.querySelector('canvas');
  if (canvas) {
    if (canvas.__chart) {
      canvas.__chart.destroy();
      canvas.__chart = null;
    }
    if (canvas.__resizeObserver) {
      canvas.__resizeObserver.disconnect();
      canvas.__resizeObserver = null;
    }
  }
};

/**
 * Create mock country data for demonstration
 * @returns {Array} Array of country features
 */
function createMockCountries() {
  const countries = [
    { properties: { name: 'Uruguay', iso_a3: 'URY' }, geometry: { type: 'Polygon', coordinates: [[[-58, -30], [-53, -30], [-53, -35], [-58, -35], [-58, -30]]] } },
    { properties: { name: 'Ecuador', iso_a3: 'ECU' }, geometry: { type: 'Polygon', coordinates: [[[-81, -5], [-75, -5], [-75, 2], [-81, 2], [-81, -5]]] } },
    { properties: { name: 'Brazil', iso_a3: 'BRA' }, geometry: { type: 'Polygon', coordinates: [[[-74, -34], [-34, -34], [-34, 6], [-74, 6], [-74, -34]]] } },
    { properties: { name: 'Argentina', iso_a3: 'ARG' }, geometry: { type: 'Polygon', coordinates: [[[-73, -55], [-53, -55], [-53, -22], [-73, -22], [-73, -55]]] } },
    { properties: { name: 'Chile', iso_a3: 'CHL' }, geometry: { type: 'Polygon', coordinates: [[[-76, -56], [-66, -56], [-66, -17], [-76, -17], [-76, -56]]] } },
    { properties: { name: 'Colombia', iso_a3: 'COL' }, geometry: { type: 'Polygon', coordinates: [[[-79, -4], [-66, -4], [-66, 13], [-79, 13], [-79, -4]]] } },
    { properties: { name: 'Peru', iso_a3: 'PER' }, geometry: { type: 'Polygon', coordinates: [[[-81, -18], [-68, -18], [-68, 0], [-81, 0], [-81, -18]]] } },
    { properties: { name: 'Mexico', iso_a3: 'MEX' }, geometry: { type: 'Polygon', coordinates: [[[-117, 14], [-86, 14], [-86, 33], [-117, 33], [-117, 14]]] } },
    { properties: { name: 'Spain', iso_a3: 'ESP' }, geometry: { type: 'Polygon', coordinates: [[[-10, 36], [4, 36], [4, 44], [-10, 44], [-10, 36]]] } },
    { properties: { name: 'Germany', iso_a3: 'DEU' }, geometry: { type: 'Polygon', coordinates: [[[5, 47], [15, 47], [15, 55], [5, 55], [5, 47]]] } },
    { properties: { name: 'France', iso_a3: 'FRA' }, geometry: { type: 'Polygon', coordinates: [[[-5, 42], [8, 42], [8, 51], [-5, 51], [-5, 42]]] } },
    { properties: { name: 'Italy', iso_a3: 'ITA' }, geometry: { type: 'Polygon', coordinates: [[[6, 36], [19, 36], [19, 47], [6, 47], [6, 36]]] } },
    { properties: { name: 'Portugal', iso_a3: 'PRT' }, geometry: { type: 'Polygon', coordinates: [[[-10, 36], [-6, 36], [-6, 42], [-10, 42], [-10, 36]]] } },
    { properties: { name: 'Panama', iso_a3: 'PAN' }, geometry: { type: 'Polygon', coordinates: [[[-83, 7], [-77, 7], [-77, 10], [-83, 10], [-83, 7]]] } },
    { properties: { name: 'Guatemala', iso_a3: 'GTM' }, geometry: { type: 'Polygon', coordinates: [[[-92, 13], [-88, 13], [-88, 18], [-92, 18], [-92, 13]]] } },
  ];
  
  return countries;
}

/**
 * Get country flag emoji by ISO code
 * @param {string} isoCode - ISO 3-letter country code
 * @returns {string} Flag emoji
 */
function getCountryFlag(isoCode) {
  const flags = {
    URY: '🇺🇾', ECU: '🇪🇨', BRA: '🇧🇷', ARG: '🇦🇷', CHL: '🇨🇱',
    COL: '🇨🇴', PER: '🇵🇪', MEX: '🇲🇽', ESP: '🇪🇸', DEU: '🇩🇪',
    FRA: '🇫🇷', ITA: '🇮🇹', PRT: '🇵🇹', PAN: '🇵🇦', GTM: '🇬🇹'
  };
  return flags[isoCode] || '🌍';
}