document.addEventListener('DOMContentLoaded', function() {
  // References to key elements
  const filterSidebar = document.querySelector('.filter-sidebar');
  const filterToggle = document.querySelector('.filter-toggle');
  const clearFiltersBtn = document.querySelector('.clear-filters');
  const filterCheckboxes = document.querySelectorAll('.filter-checkbox input');
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  const searchForm = document.querySelector('.search-bar');
  const searchInput = document.querySelector('.search-bar input');
  const activeFiltersContainer = document.querySelector('.active-filters');
  const applyFiltersBtn = document.querySelector('.apply-filters');
  const viewTabs = document.querySelectorAll('.view-tab');
  const listView = document.querySelector('.list-view');
  const mapView = document.querySelector('.map-view');
  const displayOptions = document.querySelectorAll('.display-option');
  const documentsGrid = document.querySelector('.documents-grid');
  const loadMoreBtn = document.querySelector('.load-more');
  const searchBoxInputs = document.querySelectorAll('.search-box input');
  const paginationButtons = document.querySelectorAll('.pagination-btn');
  const prevPageBtn = document.querySelector('.prev-page');
  const nextPageBtn = document.querySelector('.next-page');
  const accordionItems = document.querySelectorAll('.accordion-item');
  const regionTabs = document.querySelectorAll('.region-tab');
  const countryFilters = document.querySelector('.filter-options.scrollable');
  const datePresets = document.querySelectorAll('.date-preset');
  const resetFiltersBtn = document.querySelector('.btn-reset-filters');
  
  // Current state of filters
  let activeFilters = [];
  let currentPage = 1;
  const totalPages = 12; // This would be dynamic in a real application
  
  // Initialize view based on URL (query param)
  initializeViewFromUrl();
  
  // Function to initialize view based on URL
  function initializeViewFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    
    if (viewParam === 'map') {
      setActiveView('map');
    } else {
      setActiveView('list');
    }
  }
  
  // Function to set the active view
  function setActiveView(viewType) {
    viewTabs.forEach(tab => {
      if (tab.getAttribute('data-view') === viewType) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    if (viewType === 'list') {
      listView.classList.add('active');
      mapView.classList.remove('active');
    } else if (viewType === 'map') {
      mapView.classList.add('active');
      listView.classList.remove('active');
      
      // Initialize map if not already done
      initializeMap();
    }
    
    // Update URL without reloading the page
    const url = new URL(window.location);
    url.searchParams.set('view', viewType);
    window.history.pushState({}, '', url);
  }
  
  // Event listeners for view tabs
  viewTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const viewType = this.getAttribute('data-view');
      setActiveView(viewType);
    });
  });
  
  // Handle display options (cards or list)
  displayOptions.forEach(option => {
    option.addEventListener('click', function() {
      const displayType = this.getAttribute('data-display');
      
      // Update active buttons
      displayOptions.forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      
      // Update view
      if (displayType === 'card') {
        listView.classList.remove('list-display-mode-list');
      } else if (displayType === 'list') {
        listView.classList.add('list-display-mode-list');
      }
    });
  });
  
  // Expand/collapse sidebar on mobile
  if (filterToggle) {
    filterToggle.addEventListener('click', function() {
      filterSidebar.classList.toggle('expanded');
    });
  }
  
  // Search by keywords
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const searchTerm = searchInput.value.trim();
      
      if (searchTerm) {
        // Add search filter
        addFilter('search', searchTerm);
        
        // Simulate search
        simulateSearch();
        
        // Clear search field
        searchInput.value = '';
      }
    });
  }
  
  // Clear all filters
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function() {
      // Clear checkboxes
      filterCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
      
      // Clear dates
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';
      
      // Clear search boxes in filters
      searchBoxInputs.forEach(input => {
        input.value = '';
      });
      
      // Clear active filters
      activeFilters = [];
      updateActiveFiltersDisplay();
      
      // Simulate results update
      simulateSearch();
    });
  }
  
  // Apply filters
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', function() {
      // Collect selected filters
      collectActiveFilters();
      
      // Simulate search with filters
      simulateSearch();
      
      // On mobile, close the filter panel after applying
      if (window.innerWidth <= 992) {
        filterSidebar.classList.remove('expanded');
      }
    });
  }
  
  // Handler for individual filter checkboxes
  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        // Optionally, apply filter immediately
        // addFilter(this.name, this.value);
        // simulateSearch();
      }
    });
  });
  
  // Function to collect active filters from controls
  function collectActiveFilters() {
    // Clear current filters (except search)
    activeFilters = activeFilters.filter(filter => filter.type === 'search');
    
    // Collect selected checkboxes
    filterCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        addFilter(checkbox.name, checkbox.value);
      }
    });
    
    // Add date filters if defined
    if (dateFromInput && dateFromInput.value) {
      addFilter('date-from', formatDate(dateFromInput.value));
    }
    
    if (dateToInput && dateToInput.value) {
      addFilter('date-to', formatDate(dateToInput.value));
    }
  }
  
  // Function to add an active filter
  function addFilter(type, value) {
    // Check if this filter already exists
    const existingFilterIndex = activeFilters.findIndex(
      filter => filter.type === type && filter.value === value
    );
    
    // If it doesn't exist, add it
    if (existingFilterIndex === -1) {
      activeFilters.push({
        type,
        value,
        id: Date.now() // Unique ID for event handling
      });
      
      // Update the display
      updateActiveFiltersDisplay();
    }
  }
  
  // Function to remove an active filter
  function removeFilter(filterId) {
    activeFilters = activeFilters.filter(filter => filter.id !== filterId);
    updateActiveFiltersDisplay();
    
    // Update UI to reflect filter removal
    simulateSearch();
  }
  
  // Function to update the active filters display
  function updateActiveFiltersDisplay() {
    if (!activeFiltersContainer) return;
    
    // Clear container
    activeFiltersContainer.innerHTML = '';
    
    // Create and add chips for each active filter
    activeFilters.forEach(filter => {
      const filterChip = document.createElement('div');
      filterChip.className = 'filter-chip';
      
      // Show friendly name for filter type
      let filterTypeName = '';
      switch (filter.type) {
        case 'search':
          filterTypeName = 'Búsqueda';
          break;
        case 'type':
          filterTypeName = 'Tipo';
          break;
        case 'country':
          filterTypeName = 'País';
          break;
        case 'theme':
          filterTypeName = 'Tema';
          break;
        case 'actor':
          filterTypeName = 'Actor';
          break;
        case 'date-from':
          filterTypeName = 'Desde';
          break;
        case 'date-to':
          filterTypeName = 'Hasta';
          break;
        default:
          filterTypeName = filter.type;
      }
      
      filterChip.innerHTML = `
        <span class="filter-type">${filterTypeName}:</span>
        <span class="filter-value">${filter.value}</span>
        <span class="remove-filter" data-id="${filter.id}">×</span>
      `;
      
      activeFiltersContainer.appendChild(filterChip);
      
      // Add event to remove filter
      const removeBtn = filterChip.querySelector('.remove-filter');
      removeBtn.addEventListener('click', function() {
        const filterId = parseInt(this.getAttribute('data-id'));
        removeFilter(filterId);
      });
    });
  }
  
  // Function to format date in a more friendly format
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  // Initialize Infinite Scroll with Intersection Observer API
  function initInfiniteScroll() {
    // Only if the sentinel element exists and we're on desktop
    const scrollSentinel = document.getElementById('scroll-sentinel');
    if (!scrollSentinel || window.innerWidth <= 992) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Load more results when the sentinel is visible
          loadMoreResults();
        }
      });
    }, {
      rootMargin: '200px', // Load before reaching the end
    });
    
    observer.observe(scrollSentinel);
  }
  
  // Event listener for "Load more" button (mobile)
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreResults);
  }
  
  // Function to load more results
  function loadMoreResults() {
    // Simulation of loading more results
    setTimeout(() => {
      // Clone existing cards to simulate new results
      const existingCards = documentsGrid.querySelectorAll('.document-card');
      const sentinel = document.getElementById('scroll-sentinel');
      
      if (existingCards.length > 0) {
        // Remove sentinel temporarily
        if (sentinel) sentinel.remove();
        
        // Clone and add some cards
        for (let i = 0; i < Math.min(3, existingCards.length); i++) {
          const clone = existingCards[i].cloneNode(true);
          // Modify the clone to make it look like a different result
          const title = clone.querySelector('.document-title');
          if (title) {
            title.textContent += ' (Nuevo)';
          }
          documentsGrid.appendChild(clone);
        }
        
        // Add sentinel back to the end
        if (sentinel) documentsGrid.appendChild(sentinel);
      }
    }, 800);
  }
  
  // Simulation of search/filtering
  function simulateSearch() {
    // Loading animation
    documentsGrid.classList.add('loading');
    
    // Update results counter
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
      resultsCount.textContent = 'Cargando resultados...';
    }
    
    // Simulate network delay
    setTimeout(() => {
      // Update counter with "filtered" results
      if (resultsCount) {
        // Number of results based on the number of filters
        const resultNumber = Math.max(10, 50 - (activeFilters.length * 8));
        resultsCount.textContent = `${resultNumber} documentos encontrados`;
      }
      
      // Remove loading class
      documentsGrid.classList.remove('loading');
    }, 800);
  }
  
  // Initialize interactive map
  function initializeMap() {
    const mapContainer = document.getElementById('interactive-map');
    if (!mapContainer) return;
    
    // Check if the map has already been initialized
    if (mapContainer.getAttribute('data-initialized') === 'true') return;
    
    // Mark the map as initialized
    mapContainer.setAttribute('data-initialized', 'true');
    
    // Remove placeholder
    const placeholder = mapContainer.querySelector('.map-placeholder');
    if (placeholder) placeholder.remove();
    
    // Create SVG map container
    const mapSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mapSvg.setAttribute('width', '100%');
    mapSvg.setAttribute('height', '100%');
    mapSvg.setAttribute('viewBox', '0 0 1000 500');
    mapSvg.setAttribute('id', 'map-svg');
    mapSvg.style.backgroundColor = '#f0f6ff';
    
    // Add the map to the container
    mapContainer.appendChild(mapSvg);
    
    // Define SVG defs for animations and effects
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <!-- Pulse animation -->
      <radialGradient id="markerGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="white" stop-opacity="1" />
        <stop offset="100%" stop-color="white" stop-opacity="0" />
      </radialGradient>
      
      <!-- Animation definitions -->
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feComposite in="SourceGraphic" in2="coloredBlur" operator="over"/>
      </filter>
    `;
    mapSvg.appendChild(defs);
    
    // Add continents with enhanced styling
    const continentsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    continentsGroup.setAttribute('class', 'continents');
    
    // Enhanced Europe with better styling
    const europe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    europe.setAttribute('d', 'M550 80 Q650 50 700 80 Q750 110 800 100 Q840 80 860 120 Q830 180 780 200 Q730 220 680 190 Q630 160 590 170 Q560 190 550 150 Z');
    europe.setAttribute('fill', '#d4e2ff');
    europe.setAttribute('stroke', '#094EB2');
    europe.setAttribute('stroke-width', '2');
    europe.setAttribute('class', 'continent europe');
    continentsGroup.appendChild(europe);
    
    // Enhanced Latin America with better styling
    const latam = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    latam.setAttribute('d', 'M350 220 Q370 200 390 220 Q410 240 400 270 Q390 300 370 330 Q340 350 310 380 Q280 400 250 390 Q230 370 250 340 Q280 310 310 290 Q330 270 350 220 Z');
    latam.setAttribute('fill', '#d4ffe6');
    latam.setAttribute('stroke', '#34A853');
    latam.setAttribute('stroke-width', '2');
    latam.setAttribute('class', 'continent latam');
    continentsGroup.appendChild(latam);
    
    mapSvg.appendChild(continentsGroup);
    
    // Add connection lines between regions
    const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connectionsGroup.setAttribute('class', 'connections');
    
    // Add some connection lines with animation
    const connections = [
      { 
        start: { x: 650, y: 150 }, 
        end: { x: 320, y: 280 },
        color: '#094EB2',
        delay: 0
      },
      { 
        start: { x: 700, y: 120 }, 
        end: { x: 300, y: 260 },
        color: '#34A853',
        delay: 0.5
      },
      { 
        start: { x: 600, y: 180 }, 
        end: { x: 350, y: 300 },
        color: '#FBBC04',
        delay: 1
      }
    ];
    
    connections.forEach((conn, index) => {
      const connectionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const pathData = `M${conn.start.x},${conn.start.y} Q${(conn.start.x + conn.end.x)/2},${(conn.start.y + conn.end.y)/2 - 80} ${conn.end.x},${conn.end.y}`;
      
      connectionPath.setAttribute('d', pathData);
      connectionPath.setAttribute('fill', 'none');
      connectionPath.setAttribute('stroke', conn.color);
      connectionPath.setAttribute('stroke-width', '2');
      connectionPath.setAttribute('stroke-dasharray', '5,3');
      connectionPath.setAttribute('class', 'connection-line');
      connectionPath.style.opacity = '0';
      
      // Add animation
      connectionPath.animate(
        [
          { 
            opacity: 0,
            strokeDashoffset: '1000'
          },
          { 
            opacity: 1,
            strokeDashoffset: '0'
          }
        ],
        {
          duration: 2000,
          delay: conn.delay * 1000,
          fill: 'forwards',
          easing: 'ease-out'
        }
      );
      
      connectionsGroup.appendChild(connectionPath);
    });
    
    mapSvg.appendChild(connectionsGroup);
    
    // Add markers for documents (simulated locations)
    const markers = [
      { x: 600, y: 120, label: 'Unión Europea', count: 25, color: '#094EB2' },
      { x: 650, y: 180, label: 'España', count: 15, color: '#094EB2' },
      { x: 720, y: 150, label: 'Alemania', count: 12, color: '#094EB2' },
      { x: 780, y: 130, label: 'Francia', count: 10, color: '#094EB2' },
      { x: 300, y: 260, label: 'Brasil', count: 18, color: '#34A853' },
      { x: 320, y: 320, label: 'Argentina', count: 13, color: '#34A853' },
      { x: 350, y: 280, label: 'Colombia', count: 11, color: '#34A853' },
      { x: 310, y: 230, label: 'México', count: 14, color: '#34A853' },
      { x: 470, y: 200, label: 'Acuerdos EU-LATAM', count: 30, color: '#FBBC04' }
    ];
    
    // Create group for markers
    const markersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    markersGroup.setAttribute('class', 'markers');
    mapSvg.appendChild(markersGroup);
    
    // Add markers to the map with staggered animations
    markers.forEach((marker, index) => {
      // Scale marker size based on document count
      const size = 10 + marker.count * 0.5;
      
      // Create group for this marker
      const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      markerGroup.setAttribute('class', 'map-marker');
      markerGroup.setAttribute('data-label', marker.label);
      markerGroup.setAttribute('data-count', marker.count);
      markerGroup.style.opacity = '0';
      markerGroup.style.cursor = 'pointer';
      
      // Base circle
      const baseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      baseCircle.setAttribute('cx', marker.x);
      baseCircle.setAttribute('cy', marker.y);
      baseCircle.setAttribute('r', size);
      baseCircle.setAttribute('fill', marker.color);
      baseCircle.setAttribute('fill-opacity', '0.6');
      baseCircle.setAttribute('stroke', marker.color);
      baseCircle.setAttribute('stroke-width', '2');
      
      // Pulse effect circles
      const pulseCircle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulseCircle1.setAttribute('cx', marker.x);
      pulseCircle1.setAttribute('cy', marker.y);
      pulseCircle1.setAttribute('r', size + 5);
      pulseCircle1.setAttribute('fill', 'none');
      pulseCircle1.setAttribute('stroke', marker.color);
      pulseCircle1.setAttribute('stroke-width', '1.5');
      pulseCircle1.setAttribute('class', 'pulse-circle pulse-1');
      
      const pulseCircle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulseCircle2.setAttribute('cx', marker.x);
      pulseCircle2.setAttribute('cy', marker.y);
      pulseCircle2.setAttribute('r', size + 10);
      pulseCircle2.setAttribute('fill', 'none');
      pulseCircle2.setAttribute('stroke', marker.color);
      pulseCircle2.setAttribute('stroke-width', '1');
      pulseCircle2.setAttribute('class', 'pulse-circle pulse-2');
      
      // Document count text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', marker.x);
      text.setAttribute('y', marker.y + 5); // Vertical centering adjustment
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'white');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('font-size', '12');
      text.textContent = marker.count;
      
      // Tooltip/label (appears on hover)
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tooltip.setAttribute('class', 'marker-tooltip');
      tooltip.style.opacity = '0';
      tooltip.style.pointerEvents = 'none';
      tooltip.setAttribute('transform', `translate(${marker.x},${marker.y - size - 15})`);
      
      const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      tooltipBg.setAttribute('x', -60);
      tooltipBg.setAttribute('y', -25);
      tooltipBg.setAttribute('width', '120');
      tooltipBg.setAttribute('height', '25');
      tooltipBg.setAttribute('rx', '4');
      tooltipBg.setAttribute('ry', '4');
      tooltipBg.setAttribute('fill', 'white');
      tooltipBg.setAttribute('stroke', '#ddd');
      tooltipBg.setAttribute('stroke-width', '1');
      tooltipBg.setAttribute('filter', 'url(#glow)');
      
      const tooltipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tooltipText.setAttribute('x', '0');
      tooltipText.setAttribute('y', '-8');
      tooltipText.setAttribute('text-anchor', 'middle');
      tooltipText.setAttribute('font-size', '12');
      tooltipText.setAttribute('fill', '#333');
      tooltipText.textContent = marker.label;
      
      tooltip.appendChild(tooltipBg);
      tooltip.appendChild(tooltipText);
      
      // Add elements to the marker group
      markerGroup.appendChild(pulseCircle2);
      markerGroup.appendChild(pulseCircle1);
      markerGroup.appendChild(baseCircle);
      markerGroup.appendChild(text);
      markerGroup.appendChild(tooltip);
      
      // Apply pulse animations
      animatePulse(pulseCircle1, 2, 0);
      animatePulse(pulseCircle2, 3, 1);
      
      // Add fade-in animation with staggered delay
      markerGroup.animate(
        [
          { opacity: 0, transform: 'scale(0.5)' },
          { opacity: 1, transform: 'scale(1)' }
        ],
        {
          duration: 800,
          delay: index * 200,
          fill: 'forwards',
          easing: 'ease-out'
        }
      );
      
      // Add hover events
      markerGroup.addEventListener('mouseenter', function() {
        // Highlight the marker
        baseCircle.setAttribute('fill-opacity', '0.8');
        baseCircle.setAttribute('stroke-width', '3');
        
        // Show tooltip
        tooltip.style.opacity = '1';
        tooltip.style.transition = 'opacity 0.3s';
      });
      
      markerGroup.addEventListener('mouseleave', function() {
        // Return to normal state
        baseCircle.setAttribute('fill-opacity', '0.6');
        baseCircle.setAttribute('stroke-width', '2');
        
        // Hide tooltip
        tooltip.style.opacity = '0';
      });
      
      // Add click event
      markerGroup.addEventListener('click', function() {
        showMarkerPopup(marker, mapContainer);
      });
      
      // Add to markers group
      markersGroup.appendChild(markerGroup);
    });
    
    // Add country labels
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('class', 'map-labels');
    
    // EU label with enhanced styling
    const euLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    euLabel.setAttribute('x', '680');
    euLabel.setAttribute('y', '120');
    euLabel.setAttribute('font-size', '16');
    euLabel.setAttribute('font-weight', 'bold');
    euLabel.setAttribute('fill', '#094EB2');
    euLabel.setAttribute('filter', 'url(#glow)');
    euLabel.textContent = 'EUROPA';
    
    // LATAM label with enhanced styling
    const latamLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    latamLabel.setAttribute('x', '300');
    latamLabel.setAttribute('y', '350');
    latamLabel.setAttribute('font-size', '16');
    latamLabel.setAttribute('font-weight', 'bold');
    latamLabel.setAttribute('fill', '#34A853');
    latamLabel.setAttribute('filter', 'url(#glow)');
    latamLabel.textContent = 'AMÉRICA LATINA';
    
    labelsGroup.appendChild(euLabel);
    labelsGroup.appendChild(latamLabel);
    mapSvg.appendChild(labelsGroup);
    
    // Function to animate pulse effect
    function animatePulse(circle, duration, delay) {
      // Create animation
      const pulseAnim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      pulseAnim.setAttribute('attributeName', 'r');
      pulseAnim.setAttribute('values', `${circle.getAttribute('r')};${parseInt(circle.getAttribute('r')) + 10};${circle.getAttribute('r')}`);
      pulseAnim.setAttribute('dur', `${duration}s`);
      pulseAnim.setAttribute('begin', `${delay}s`);
      pulseAnim.setAttribute('repeatCount', 'indefinite');
      
      const opacityAnim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      opacityAnim.setAttribute('attributeName', 'opacity');
      opacityAnim.setAttribute('values', '0.8;0.2;0.8');
      opacityAnim.setAttribute('dur', `${duration}s`);
      opacityAnim.setAttribute('begin', `${delay}s`);
      opacityAnim.setAttribute('repeatCount', 'indefinite');
      
      circle.appendChild(pulseAnim);
      circle.appendChild(opacityAnim);
    }
  }
  
  // Function to show popup when clicking on a marker
  function showMarkerPopup(marker, container) {
    // Remove existing popup if any
    const existingPopup = document.querySelector('.map-popup');
    if (existingPopup) existingPopup.remove();
    
    // Create the popup
    const popup = document.createElement('div');
    popup.className = 'map-popup';
    popup.innerHTML = `
      <div class="popup-header">
        <h3>${marker.label}</h3>
        <button class="popup-close">×</button>
      </div>
      <div class="popup-content">
        <p>${marker.count} documentos encontrados</p>
        <button class="btn btn-primary view-docs-btn">Ver documentos</button>
      </div>
    `;
    
    // Apply styles to create a nice popup
    Object.assign(popup.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
      width: '300px',
      zIndex: '1000',
      animation: 'fadeIn 0.3s ease-out forwards',
      border: '1px solid #ddd'
    });
    
    // Style header
    const popupHeader = popup.querySelector('.popup-header');
    Object.assign(popupHeader.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      borderBottom: '1px solid #eee',
      backgroundColor: '#f8f8f8',
      borderRadius: '8px 8px 0 0'
    });
    
    // Style title
    const popupTitle = popup.querySelector('.popup-header h3');
    Object.assign(popupTitle.style, {
      margin: '0',
      color: '#333',
      fontSize: '1.2rem'
    });
    
    // Style content
    const popupContent = popup.querySelector('.popup-content');
    Object.assign(popupContent.style, {
      padding: '1rem'
    });
    
    // Style close button
    const closeBtn = popup.querySelector('.popup-close');
    Object.assign(closeBtn.style, {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#999',
      lineHeight: '1'
    });
    
    // Style action button
    const actionBtn = popup.querySelector('.view-docs-btn');
    Object.assign(actionBtn.style, {
      marginTop: '1rem',
      display: 'block',
      width: '100%'
    });
    
    // Add event to close button
    closeBtn.addEventListener('click', function() {
      popup.style.animation = 'fadeOut 0.2s forwards';
      setTimeout(() => {
        popup.remove();
      }, 200);
    });
    
    // Add event to view documents button
    const viewDocsBtn = popup.querySelector('.view-docs-btn');
    viewDocsBtn.addEventListener('click', function() {
      // Switch to list view and apply filter by location
      setActiveView('list');
      
      // Add filter for this location
      addFilter('country', marker.label);
      
      // Simulate search
      simulateSearch();
      
      // Close popup
      popup.remove();
    });
    
    // Add to map container
    container.appendChild(popup);
    
    // Add keyframes for animations if not already present
    if (!document.getElementById('map-animations')) {
      const style = document.createElement('style');
      style.id = 'map-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -60%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; transform: translate(-50%, -50%); }
          to { opacity: 0; transform: translate(-50%, -60%); }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Initialize infinite scroll
  initInfiniteScroll();
  
  // Pagination handling
  // Function to update pagination UI
  function updatePaginationUI() {
    // Update pagination buttons active state
    paginationButtons.forEach(btn => {
      if (!btn.classList.contains('prev-page') && !btn.classList.contains('next-page')) {
        const pageNum = parseInt(btn.textContent);
        if (pageNum === currentPage) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
    
    // Enable/disable prev/next buttons
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    // Update results display
    simulatePageChange();
  }
  
  // Add click handlers to pagination buttons
  paginationButtons.forEach(btn => {
    if (!btn.classList.contains('prev-page') && !btn.classList.contains('next-page') && 
        !btn.parentElement.classList.contains('pagination-ellipsis')) {
      btn.addEventListener('click', function() {
        currentPage = parseInt(this.textContent);
        updatePaginationUI();
      });
    }
  });
  
  // Previous page button
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        updatePaginationUI();
      }
    });
  }
  
  // Next page button
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', function() {
      if (currentPage < totalPages) {
        currentPage++;
        updatePaginationUI();
      }
    });
  }
  
  // Simulate page change - would fetch new data in real app
  function simulatePageChange() {
    // Show loading state
    const documentsGrid = document.querySelector('.documents-grid');
    const documentsList = document.querySelector('.documents-list');
    
    if (documentsGrid) documentsGrid.style.opacity = '0.5';
    if (documentsList) documentsList.style.opacity = '0.5';
    
    // Update results count with page info
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
      resultsCount.textContent = `Cargando página ${currentPage}...`;
    }
    
    // Simulate network delay
    setTimeout(() => {
      // Restore opacity
      if (documentsGrid) documentsGrid.style.opacity = '1';
      if (documentsList) documentsList.style.opacity = '1';
      
      // Update page indicator
      if (resultsCount) {
        const startItem = (currentPage - 1) * 10 + 1;
        const endItem = Math.min(currentPage * 10, 120); // Assuming 120 total items
        resultsCount.textContent = `Mostrando ${startItem}-${endItem} de 120 documentos`;
      }
      
      // Scroll to top of results
      const resultsContainer = document.querySelector('.results-container');
      if (resultsContainer) {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 800);
  }
  
  // Toggle between pagination and infinite scroll modes
  function setPaginationMode(enabled) {
    const resultsContainer = document.querySelector('.results-container');
    if (resultsContainer) {
      if (enabled) {
        resultsContainer.classList.add('pagination-mode');
      } else {
        resultsContainer.classList.remove('pagination-mode');
      }
    }
  }
  
  // Default to pagination mode
  setPaginationMode(true);
  
  // Accordion functionality for filter sidebar
  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    
    header.addEventListener('click', () => {
      // Toggle active state for this item
      item.classList.toggle('active');
      
      // Optional: Close other items when opening one
      // if (item.classList.contains('active')) {
      //   accordionItems.forEach(otherItem => {
      //     if (otherItem !== item) {
      //       otherItem.classList.remove('active');
      //     }
      //   });
      // }
    });
  });
  
  // Make the first accordion item active by default
  if (accordionItems.length > 0) {
    accordionItems[0].classList.add('active');
  }
  
  // Region tabs for countries
  regionTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      regionTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Get region
      const region = tab.getAttribute('data-region');
      
      // Update filter options display
      countryFilters.className = 'filter-options scrollable';
      countryFilters.classList.add(`show-${region}`);
    });
  });
  
  // Initialize to show all countries
  countryFilters.classList.add('show-all');
  
  // Date preset functionality
  datePresets.forEach(preset => {
    preset.addEventListener('click', () => {
      // Remove active class from all presets
      datePresets.forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked preset
      preset.classList.add('active');
      
      // Get years from data attribute
      const years = parseInt(preset.getAttribute('data-years')) || 1;
      
      // Calculate date range
      const today = new Date();
      const fromDate = new Date();
      fromDate.setFullYear(today.getFullYear() - years);
      
      // Format dates for input fields (YYYY-MM-DD)
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Set input values
      dateFromInput.value = formatDate(fromDate);
      dateToInput.value = formatDate(today);
    });
  });
  
  // Search functionality for filter options
  searchInputs.forEach(input => {
    input.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase().trim();
      const filterOptions = this.closest('.accordion-content').querySelectorAll('.filter-checkbox');
      
      filterOptions.forEach(option => {
        const label = option.querySelector('span').textContent.toLowerCase();
        if (label.includes(searchTerm) || searchTerm === '') {
          option.style.display = 'flex';
        } else {
          option.style.display = 'none';
        }
      });
    });
  });
  
  // Reset filters button
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      // Uncheck all checkboxes
      document.querySelectorAll('.filter-checkbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
      });
      
      // Reset date inputs
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';
      
      // Reset search inputs
      document.querySelectorAll('.search-box input').forEach(input => {
        input.value = '';
        
        // Show all options that might have been hidden by search
        const filterOptions = input.closest('.accordion-content')?.querySelectorAll('.filter-checkbox');
        if (filterOptions) {
          filterOptions.forEach(option => {
            option.style.display = 'flex';
          });
        }
      });
      
      // Reset date presets
      document.querySelectorAll('.date-preset').forEach(preset => {
        preset.classList.remove('active');
      });
      
      // Reset region tabs
      if (regionTabs.length > 0 && countryFilters) {
        regionTabs.forEach(tab => tab.classList.remove('active'));
        regionTabs[0].classList.add('active');
        countryFilters.className = 'filter-options scrollable show-all';
      }
      
      // Reset active filters display
      const activeFiltersContainer = document.querySelector('.active-filters');
      if (activeFiltersContainer) {
        activeFiltersContainer.innerHTML = '';
      }
    });
  }
});