/**
 * World Map GeoJSON data
 * Uses comprehensive world topology with ISO3 codes matching your database
 */

/**
 * Fetch countries from the Django API
 */
export const fetchCountriesFromAPI = async () => {
  try {
    const response = await fetch('/api/countries/');
    const data = await response.json();
    return data.countries;
  } catch (error) {
    return [];
  }
};

/**
 * Generate world map features from your database countries
 */
export const generateWorldMapFromDatabase = async () => {
  const countries = await fetchCountriesFromAPI();
  
  // Try to get real coordinates using a library or service first
  try {
    // Check if we can load coordinates from a CDN/library
    const realCoordinates = await loadRealCountryCoordinates();
    if (realCoordinates) {
      const features = countries.map(country => {
        const coords = realCoordinates[country.iso3] || getCountryCoordinates(country.iso3);
        return {
          "type": "Feature",
          "properties": {
            "NAME": country.name,
            "ISO_A3": country.iso3,
            "ISO_A2": country.iso2,
            "iso_a3": country.iso3,
            "name": country.name
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [coords]
          }
        };
      });
      return {
        "type": "FeatureCollection",
        "features": features
      };
    }
  } catch (error) {
    console.warn('Could not load real coordinates, using simplified ones:', error);
  }
  
  // Fallback to simplified coordinates
  const features = countries.map(country => {
    const coords = getCountryCoordinates(country.iso3);
    return {
      "type": "Feature",
      "properties": {
        "NAME": country.name,
        "ISO_A3": country.iso3,
        "ISO_A2": country.iso2,
        "iso_a3": country.iso3,
        "name": country.name
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [coords]
      }
    };
  });

  return {
    "type": "FeatureCollection",
    "features": features
  };
};

/**
 * Try to load real country coordinates from a CDN or library
 */
async function loadRealCountryCoordinates() {
  try {
    // Try loading a simplified country boundaries dataset
    const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
    if (response.ok) {
      const data = await response.json();
      const coordsMap = {};
      
      data.features.forEach(feature => {
        const iso3 = feature.properties.ISO_A3 || feature.properties.iso_a3 || feature.properties.ADM0_A3;
        if (iso3 && feature.geometry && feature.geometry.coordinates) {
          // For polygons, take the first ring
          if (feature.geometry.type === 'Polygon') {
            coordsMap[iso3] = feature.geometry.coordinates[0];
          } else if (feature.geometry.type === 'MultiPolygon') {
            // For multipolygons, take the largest polygon
            let largestPolygon = feature.geometry.coordinates[0][0];
            feature.geometry.coordinates.forEach(polygon => {
              if (polygon[0].length > largestPolygon.length) {
                largestPolygon = polygon[0];
              }
            });
            coordsMap[iso3] = largestPolygon;
          }
        }
      });
      
      return coordsMap;
    }
  } catch (error) {
    // Failed to load real coordinates
  }
  return null;
}

/**
 * Get simplified coordinates for countries based on ISO3 code
 * This creates a basic rectangular approximation for visualization when real coordinates aren't available
 */
function getCountryCoordinates(iso3) {
  const coordinates = {
    // Latin America & Caribbean
    "ARG": [[-73.4, -21.8], [-53.6, -21.8], [-53.6, -55.2], [-73.4, -55.2], [-73.4, -21.8]],
    "BOL": [[-69.6, -9.8], [-57.5, -9.8], [-57.5, -22.9], [-69.6, -22.9], [-69.6, -9.8]],
    "BRA": [[-73.9, 5.2], [-34.7, 5.2], [-34.7, -33.8], [-73.9, -33.8], [-73.9, 5.2]],
    "CHL": [[-75.6, -17.6], [-67.0, -17.6], [-67.0, -55.6], [-75.6, -55.6], [-75.6, -17.6]],
    "COL": [[-79.0, 12.4], [-66.9, 12.4], [-66.9, -4.2], [-79.0, -4.2], [-79.0, 12.4]],
    "CRI": [[-85.9, 11.2], [-82.5, 11.2], [-82.5, 8.0], [-85.9, 8.0], [-85.9, 11.2]],
    "CUB": [[-84.9, 23.2], [-74.1, 23.2], [-74.1, 19.8], [-84.9, 19.8], [-84.9, 23.2]],
    "DOM": [[-72.0, 19.9], [-68.3, 19.9], [-68.3, 17.5], [-72.0, 17.5], [-72.0, 19.9]],
    "ECU": [[-81.0, 1.7], [-75.2, 1.7], [-75.2, -5.0], [-81.0, -5.0], [-81.0, 1.7]],
    "SLV": [[-90.1, 14.4], [-87.7, 14.4], [-87.7, 13.1], [-90.1, 13.1], [-90.1, 14.4]],
    "GTM": [[-92.2, 17.8], [-88.2, 17.8], [-88.2, 13.7], [-92.2, 13.7], [-92.2, 17.8]],
    "GUY": [[-61.4, 8.4], [-56.5, 8.4], [-56.5, 1.3], [-61.4, 1.3], [-61.4, 8.4]],
    "HTI": [[-74.5, 20.1], [-71.6, 20.1], [-71.6, 18.0], [-74.5, 18.0], [-74.5, 20.1]],
    "HND": [[-89.4, 16.0], [-83.1, 16.0], [-83.1, 13.0], [-89.4, 13.0], [-89.4, 16.0]],
    "JAM": [[-78.4, 18.5], [-76.2, 18.5], [-76.2, 17.7], [-78.4, 17.7], [-78.4, 18.5]],
    "MEX": [[-117.1, 32.4], [-86.8, 32.4], [-86.8, 14.5], [-117.1, 14.5], [-117.1, 32.4]],
    "NIC": [[-87.7, 15.0], [-82.7, 15.0], [-82.7, 10.7], [-87.7, 10.7], [-87.7, 15.0]],
    "PAN": [[-83.1, 9.6], [-77.2, 9.6], [-77.2, 7.2], [-83.1, 7.2], [-83.1, 9.6]],
    "PRY": [[-62.6, -19.3], [-54.3, -19.3], [-54.3, -27.5], [-62.6, -27.5], [-62.6, -19.3]],
    "PER": [[-81.3, -0.1], [-68.7, -0.1], [-68.7, -18.3], [-81.3, -18.3], [-81.3, -0.1]],
    "SUR": [[-58.0, 6.0], [-53.9, 6.0], [-53.9, 1.8], [-58.0, 1.8], [-58.0, 6.0]],
    "TTO": [[-62.0, 11.3], [-60.5, 11.3], [-60.5, 10.0], [-62.0, 10.0], [-62.0, 11.3]],
    "URY": [[-58.4, -30.1], [-53.2, -30.1], [-53.2, -35.0], [-58.4, -35.0], [-58.4, -30.1]],
    "VEN": [[-73.3, 12.2], [-59.8, 12.2], [-59.8, 0.7], [-73.3, 0.7], [-73.3, 12.2]],
    "BLZ": [[-89.2, 18.5], [-87.5, 18.5], [-87.5, 15.9], [-89.2, 15.9], [-89.2, 18.5]],
    "GUF": [[-54.5, 5.8], [-51.6, 5.8], [-51.6, 2.1], [-54.5, 2.1], [-54.5, 5.8]],

    // Europe
    "ESP": [[-9.3, 43.8], [3.3, 43.8], [3.3, 36.0], [-9.3, 36.0], [-9.3, 43.8]],
    "FRA": [[-5.1, 51.1], [9.6, 51.1], [9.6, 41.3], [-5.1, 41.3], [-5.1, 51.1]],
    "DEU": [[5.9, 55.1], [15.0, 55.1], [15.0, 47.3], [5.9, 47.3], [5.9, 55.1]],
    "ITA": [[6.6, 47.1], [18.5, 47.1], [18.5, 36.6], [6.6, 36.6], [6.6, 47.1]],
    "PRT": [[-9.5, 42.2], [-6.2, 42.2], [-6.2, 36.9], [-9.5, 36.9], [-9.5, 42.2]],
    "GBR": [[-8.2, 60.8], [1.8, 60.8], [1.8, 49.9], [-8.2, 49.9], [-8.2, 60.8]],
    "NLD": [[3.4, 53.6], [7.2, 53.6], [7.2, 50.7], [3.4, 50.7], [3.4, 53.6]],
    "BEL": [[2.5, 51.5], [6.4, 51.5], [6.4, 49.5], [2.5, 49.5], [2.5, 51.5]],
    "POL": [[14.1, 54.8], [24.1, 54.8], [24.1, 49.0], [14.1, 49.0], [14.1, 54.8]],
    "AUT": [[9.5, 49.0], [17.2, 49.0], [17.2, 46.4], [9.5, 46.4], [9.5, 49.0]],
    "CHE": [[5.9, 47.8], [10.5, 47.8], [10.5, 45.8], [5.9, 45.8], [5.9, 47.8]],
    "SWE": [[11.0, 69.1], [24.2, 69.1], [24.2, 55.3], [11.0, 55.3], [11.0, 69.1]],
    "NOR": [[4.6, 71.2], [31.1, 71.2], [31.1, 58.0], [4.6, 58.0], [4.6, 71.2]],
    "DNK": [[8.1, 57.7], [15.2, 57.7], [15.2, 54.6], [8.1, 54.6], [8.1, 57.7]],
    "FIN": [[20.5, 70.1], [31.6, 70.1], [31.6, 59.8], [20.5, 59.8], [20.5, 70.1]],
    "GRC": [[19.4, 42.0], [28.2, 42.0], [28.2, 34.8], [19.4, 34.8], [19.4, 42.0]],
    "CZE": [[12.1, 51.1], [18.9, 51.1], [18.9, 48.5], [12.1, 48.5], [12.1, 51.1]],
    "HUN": [[16.1, 48.6], [22.9, 48.6], [22.9, 45.7], [16.1, 45.7], [16.1, 48.6]],
    "ROU": [[20.3, 48.3], [29.7, 48.3], [29.7, 43.6], [20.3, 43.6], [20.3, 48.3]],
    "BGR": [[22.4, 44.2], [28.6, 44.2], [28.6, 41.2], [22.4, 41.2], [22.4, 44.2]],
    "HRV": [[13.5, 46.5], [19.4, 46.5], [19.4, 42.4], [13.5, 42.4], [13.5, 46.5]],
    "SVN": [[13.4, 46.9], [16.6, 46.9], [16.6, 45.4], [13.4, 45.4], [13.4, 46.9]],
    "SVK": [[16.8, 49.6], [22.6, 49.6], [22.6, 47.7], [16.8, 47.7], [16.8, 49.6]],
    "EST": [[21.8, 59.7], [28.2, 59.7], [28.2, 57.5], [21.8, 57.5], [21.8, 59.7]],
    "LVA": [[20.9, 58.1], [28.2, 58.1], [28.2, 55.7], [20.9, 55.7], [20.9, 58.1]],
    "LTU": [[20.9, 56.4], [26.8, 56.4], [26.8, 53.9], [20.9, 53.9], [20.9, 56.4]],
    "IRL": [[-10.5, 55.4], [-5.4, 55.4], [-5.4, 51.4], [-10.5, 51.4], [-10.5, 55.4]],

    // North America  
    "USA": [[-171.8, 71.4], [-66.9, 71.4], [-66.9, 18.9], [-171.8, 18.9], [-171.8, 71.4]],
    "CAN": [[-141.0, 83.1], [-52.6, 83.1], [-52.6, 41.7], [-141.0, 41.7], [-141.0, 83.1]],

    // Asia
    "CHN": [[73.6, 53.6], [135.0, 53.6], [135.0, 18.2], [73.6, 18.2], [73.6, 53.6]],
    "JPN": [[129.4, 45.5], [145.8, 45.5], [145.8, 30.3], [129.4, 30.3], [129.4, 45.5]],
    "IND": [[68.2, 37.1], [97.4, 37.1], [97.4, 8.1], [68.2, 8.1], [68.2, 37.1]],
    "RUS": [[-180.0, 81.9], [180.0, 81.9], [180.0, 41.2], [-180.0, 41.2], [-180.0, 81.9]],
    "KOR": [[125.9, 38.6], [129.6, 38.6], [129.6, 33.1], [125.9, 33.1], [125.9, 38.6]],

    // Africa
    "ZAF": [[16.4, -22.1], [32.9, -22.1], [32.9, -34.8], [16.4, -34.8], [16.4, -22.1]],
    "NGA": [[2.7, 13.9], [14.7, 13.9], [14.7, 4.3], [2.7, 4.3], [2.7, 13.9]],
    "EGY": [[24.7, 31.7], [36.9, 31.7], [36.9, 22.0], [24.7, 22.0], [24.7, 31.7]],
    "MAR": [[-13.2, 35.9], [-1.0, 35.9], [-1.0, 27.7], [-13.2, 27.7], [-13.2, 35.9]],

    // Oceania
    "AUS": [[113.3, -10.7], [153.6, -10.7], [153.6, -43.6], [113.3, -43.6], [113.3, -10.7]],
    "NZL": [[166.4, -34.4], [178.5, -34.4], [178.5, -47.3], [166.4, -47.3], [166.4, -34.4]]
  };

  // Return coordinates if available, otherwise create a generic small rectangle
  return coordinates[iso3] || [
    [0, 1], [1, 1], [1, 0], [0, 0], [0, 1]  // Generic 1x1 degree rectangle
  ];
}

/**
 * Get the complete world map data (fallback to current data for now)
 */
export const getWorldMapData = async () => {
  try {
    // Try to generate from database first
    return await generateWorldMapFromDatabase();
  } catch (error) {
    console.warn('Could not generate map from database, using static data:', error);
    
    // Fallback to static data (current implementation)
    return {
      "type": "FeatureCollection",
      "features": [
        // ...existing features... (keeping current Latin America data as fallback)
        {
          "type": "Feature",
          "properties": {
            "NAME": "Brazil",
            "ISO_A3": "BRA"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [-73.9872354804, 5.24448639569],
              [-34.7299934555, 5.24448639569],
              [-34.7299934555, -33.7683777809],
              [-73.9872354804, -33.7683777809],
              [-73.9872354804, 5.24448639569]
            ]]
          }
        },
        // Add more fallback countries if needed
        {
          "type": "Feature",
          "properties": {
            "NAME": "Argentina",
            "ISO_A3": "ARG"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [-73.4154357571, -21.8323104794],
              [-53.6284120723, -21.8323104794],
              [-53.6284120723, -55.25],
              [-73.4154357571, -55.25],
              [-73.4154357571, -21.8323104794]
            ]]
          }
        },
        {
          "type": "Feature",
          "properties": {
            "NAME": "United States",
            "ISO_A3": "USA"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [-171.8, 71.4], [-66.9, 71.4], [-66.9, 18.9], [-171.8, 18.9], [-171.8, 71.4]
            ]]
          }
        },
        {
          "type": "Feature",
          "properties": {
            "NAME": "Spain",
            "ISO_A3": "ESP"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [-9.3, 43.8], [3.3, 43.8], [3.3, 36.0], [-9.3, 36.0], [-9.3, 43.8]
            ]]
          }
        },
        {
          "type": "Feature",
          "properties": {
            "NAME": "European Union",
            "ISO_A3": "EUU"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [2.5, 51.5], [6.4, 51.5], [6.4, 49.5], [2.5, 49.5], [2.5, 51.5]
            ]]
          }
        }
      ]
    };
  }
};
