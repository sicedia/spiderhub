// JS PARA FRONTEND DE BÚSQUEDA Y FILTROS (/apps/core/static/core/js/explore.js)

// Modern explore page functionality with improved organization
class ExplorePageManager {
  constructor() {
    this.elements = this.cacheElements();
    this.state = {
      activeFilters: [],
      currentPage: 1,
      totalPages: 12,
      currentView: 'list'
    };
    
    this.init();
  }
  
  // Cache all DOM elements for better performance
  cacheElements() {
    return {
      filterSidebar: document.querySelector('.filter-sidebar'),
      filterToggle: document.querySelector('.filter-toggle'),
      clearFiltersBtn: document.querySelector('.clear-filters'),
      searchForm: document.querySelector('.search-bar'),
      searchInput: document.querySelector('.search-bar input'),
      searchButton: document.getElementById('search-button'),
      activeFiltersContainer: document.getElementById('active-filters'),
      viewTabs: document.querySelectorAll('.view-tab'),
      listView: document.querySelector('.list-view'),
      mapView: document.querySelector('.map-view'),
      documentsGrid: document.querySelector('.documents-grid'),
      loadMoreBtn: document.querySelector('.load-more'),
      paginationButtons: document.querySelectorAll('.pagination-btn'),
      prevPageBtn: document.querySelector('.prev-page'),
      nextPageBtn: document.querySelector('.next-page'),
      accordionItems: document.querySelectorAll('.accordion-item'),
      regionTabs: document.querySelectorAll('.region-tab'),
      countryFilters: document.querySelector('.filter-options.scrollable'),
      datePresets: document.querySelectorAll('.date-preset'),
      resetFiltersBtn: document.querySelector('.btn-reset-filters'),
      applyFiltersBtn:  document.querySelector('.apply-filters'),
      dateFromInput: document.getElementById('date_from'),
      dateToInput: document.getElementById('date_to'),
      filterCheckboxes: document.querySelectorAll('.filter-checkbox input'),
      searchBoxMain: document.getElementById('searchbox'),
      searchBoxInputs: document.querySelectorAll('.search-box input'),
      mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
      mobileNavOverlay: document.querySelector('.mobile-nav-overlay')
    };
  }
  
  // Initialize all functionality
  init() {
    this.initializeViewFromUrl();
    this.setupEventListeners();
    this.initInfiniteScroll();
    // Use shared mobile navigation utility
    if (typeof Utils !== 'undefined' && Utils.initializeMobileNavigation) {
      Utils.initializeMobileNavigation();
    }
  }
  
  // Event listener setup with modern syntax
  setupEventListeners() {
    // View tabs
    this.elements.viewTabs.forEach(tab => {
      tab.addEventListener('click', () => this.setActiveView(tab.getAttribute('data-view')));
    });

    // Filter sidebar toggle
    this.elements.filterToggle?.addEventListener('click', () => {
      this.elements.filterSidebar.classList.toggle('expanded');
    });

    // Search form
    this.elements.searchForm?.addEventListener('submit', (e) => this.handleSearch(e));

    // Clear filters
    this.elements.clearFiltersBtn?.addEventListener('click', () => this.resetAllFilters());

    // Pagination
    this.setupPagination();
    
    // Accordion functionality
    this.setupAccordion();
    
    // Region tabs
    this.setupRegionTabs();
    
    // Date presets
    this.setupDatePresets();
    
    // Search functionality
    this.setupSearchBoxes();

    // Search button
    this.setupSearchButton();

    // Apply filters
    this.setupApplyFilters();

    // Reset filters
    this.elements.resetFiltersBtn?.addEventListener('click', () => this.resetAllFilters());

    // Clear filters
    this.elements.clearFiltersBtn?.addEventListener('click', () => this.resetAllFilters());

    // Apply filters
    this.elements.activeFiltersContainer.addEventListener( 'click', this.onChipClick.bind(this))
  }
  
  // Pagination setup
  setupPagination() {
    this.elements.paginationButtons.forEach(btn => {
      if (!btn.classList.contains('prev-page') && !btn.classList.contains('next-page') && 
          !btn.parentElement.classList.contains('pagination-ellipsis')) {
        btn.addEventListener('click', () => {
          this.state.currentPage = parseInt(btn.textContent);
          this.updatePaginationUI();
        });
      }
    });

    this.elements.prevPageBtn?.addEventListener('click', () => {
      if (this.state.currentPage > 1) {
        this.state.currentPage--;
        this.updatePaginationUI();
      }
    });

    this.elements.nextPageBtn?.addEventListener('click', () => {
      if (this.state.currentPage < this.state.totalPages) {
        this.state.currentPage++;
        this.updatePaginationUI();
      }
    });
  }
  
  // Accordion setup
  setupAccordion() {
    this.elements.accordionItems.forEach(item => {
      const header = item.querySelector('.accordion-header');
      header.addEventListener('click', () => {
        item.classList.toggle('active');
      });
    });
    
    // Make first accordion item active
    this.elements.accordionItems[0]?.classList.add('active');
  }
  
  // Region tabs setup
  setupRegionTabs() {
    this.elements.regionTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.elements.regionTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const region = tab.getAttribute('data-region');
        this.elements.countryFilters.className = 'filter-options scrollable';
        this.elements.countryFilters.classList.add(`show-${region}`);
      });
    });
    
    this.elements.countryFilters?.classList.add('show-all');
  }
  
  // Date presets setup
  setupDatePresets() {
    this.elements.datePresets.forEach(preset => {
      preset.addEventListener('click', () => {
        this.elements.datePresets.forEach(p => p.classList.remove('active'));
        preset.classList.add('active');
        
        const years = parseInt(preset.getAttribute('data-years')) || 1;
        const { fromDate, toDate } = this.calculateDateRange(years);
        
        this.elements.dateFromInput.value = fromDate;
        this.elements.dateToInput.value = toDate;
      });
    });
  }

  // Search button setup
  setupSearchButton() {
    this.elements.searchButton?.addEventListener('click', (e) => {
      e.preventDefault();
      const searchTerm = this.elements.searchInput.value.trim();
      if (searchTerm) {
        this.addFilter('search', searchTerm);
        this.elements.searchInput.value = '';
        this.updateActiveFiltersDisplay();
        this.elements.activeFiltersContainer.dispatchEvent(new Event('commitSearch')); // Trigger search event
      }
      this.elements.searchBoxMain.value = '';
    }
    );
  }
  
  // Apply filters setup
  setupApplyFilters() {
    this.elements.applyFiltersBtn?.addEventListener('click', () => {
      // Handle filter checkboxes
      this.elements.filterCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const { name, value } = checkbox;
          // Handle label for checkbox
          let label_checkbox = checkbox.getAttribute('label');
          this.addFilter(name, value, label_checkbox);
        } else {
          const { name, value } = checkbox;
          this.removeFilter(name, value);
        }
      });
      // Date inputs
      this.removeFilter('date_from', null, false);
      this.removeFilter('date_to', null, false);

      const dateFromValue = this.elements.dateFromInput.value;
      const dateToValue = this.elements.dateToInput.value;
      if (dateFromValue) {
        const label_date_from = `${dateFromValue}`;
        this.addFilter('date_from', dateFromValue, label_date_from);
      }
      if (dateToValue) {
        const label_date_to = `${dateToValue}`;
        this.addFilter('date_to', dateToValue, label_date_to);
      }

      this.updateActiveFiltersDisplay();
      this.elements.activeFiltersContainer.dispatchEvent(new Event('commitSearch')); // Trigger search event

    });
  }

  // Search boxes setup
  setupSearchBoxes() {
    this.elements.searchBoxMain.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const searchTerm = this.elements.searchBoxMain.value.toLowerCase().trim();
        if (searchTerm) {
          this.addFilter('search', searchTerm);
          this.elements.searchBoxInputs.forEach(input => input.value = '');
          this.updateActiveFiltersDisplay();
          this.elements.activeFiltersContainer.dispatchEvent(new Event('commitSearch')); // Trigger search event
        }
        this.elements.searchBoxMain.value = '';
      }
    });

    this.elements.searchBoxInputs.forEach(input => {
      input.addEventListener('input', () => {
        const searchTerm = input.value.toLowerCase().trim();
        const filterOptions = input.closest('.accordion-content').querySelectorAll('.filter-checkbox');
        
        filterOptions.forEach(option => {
          const label = option.querySelector('span').textContent.toLowerCase();
          option.style.display = label.includes(searchTerm) || searchTerm === '' ? 'flex' : 'none';
        });
      });
    });
  }
  
  // Utility methods
  calculateDateRange(years) {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setFullYear(today.getFullYear() - years);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      fromDate: formatDate(fromDate),
      toDate: formatDate(today)
    };
  }

  
  // Filter management
  addFilter(type, value, label) {
    const existingIndex = this.state.activeFilters.findIndex(
      filter => filter.type === type && filter.value === value
    );
    if (existingIndex === -1) {
      this.state.activeFilters.push({
        type,
        value,
        label: label || value,
        id: Date.now()
      });
    }
  }
  
  removeFilter(type, value, commitSearch = true) {

    var existingIndex = -1;
    // Find the index of the filter to remove (if value is null or undefined, remove all filters of that type)
    if (value === null || value === undefined) {
       existingIndex = this.state.activeFilters.findIndex( filter => filter.type === type);
    } else {
        existingIndex = this.state.activeFilters.findIndex( filter => filter.type === type && filter.value === value  );
    }

    if (existingIndex !== -1) {
      this.state.activeFilters.splice(existingIndex, 1);
      document
        .querySelectorAll(`input[name="${type}"][value="${value}"]`)
        .forEach(cb => (cb.checked = false));

      this.updateActiveFiltersDisplay();
      if (commitSearch) {
        this.elements.activeFiltersContainer.dispatchEvent(new Event('commitSearch')); // Trigger search event
      }
    }
  }

  updateActiveFiltersDisplay() {
    if (!this.elements.activeFiltersContainer) return;
    
    const filterTypeNames = {
      search: 'Keyword',
      type: 'Type',
      country: 'Country',
      theme: 'Topic',
      actor: 'Actor',
      beneficiary: 'Beneficiary',
      sdg: 'SDG',
      legal_bindingness: 'Binding',
      agreement_type: 'Agreement',
      'date_from': 'From',
      'date_to': 'Until'
    };
    
    this.elements.activeFiltersContainer.innerHTML = this.state.activeFilters.map(filter => `
      <div class="filter-chip" data-id="${filter.id}" data-type="${filter.type}" data-value="${filter.value}">
        <span class="filter-type">${filterTypeNames[filter.type] || filter.type}:</span>
        <span class="filter-value">${filter.label}</span>
        <span class="remove-filter" data-id="${filter.id}">×</span>
      </div>
    `).join('');
  }
  onChipClick(e) {
    if (e.target.classList.contains('remove-filter')) {
      const id = parseInt(e.target.dataset.id, 10);
      const chip = this.state.activeFilters.find(f => f.id === id);
      if (chip) this.removeFilter(chip.type, chip.value);
    }
  }

  
  // View management
  initializeViewFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    this.setActiveView(viewParam === 'map' ? 'map' : 'list');
  }
  
  setActiveView(viewType) {
    this.state.currentView = viewType;
    
    this.elements.viewTabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-view') === viewType);
    });
    
    this.elements.listView.classList.toggle('active', viewType === 'list');
    this.elements.mapView.classList.toggle('active', viewType === 'map');
    
    if (viewType === 'map') {
      this.initializeMap();
    }
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('view', viewType);
    window.history.pushState({}, '', url);
  }
  
  // Search and form handling
  handleSearch(e) {
    e.preventDefault();
    const searchTerm = this.elements.searchInput.value.trim();
    if (searchTerm) {
      this.addFilter('keyword', searchTerm);
      this.elements.searchInput.value = '';
    }
  }
    
  resetAllFilters() {
    // Reset all form inputs
    document.querySelectorAll('.filter-checkbox input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    ['date_from', 'date_to'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.value = '';
      }
    });

    this.state.activeFilters = [];
    
    this.elements.searchBoxInputs.forEach(input => {
      input.value = '';
      const filterOptions = input.closest('.accordion-content')?.querySelectorAll('.filter-checkbox');
      if (filterOptions) {
        filterOptions.forEach(option => {
          option.style.display = 'flex';
        });
      }
    });
    
    this.elements.datePresets.forEach(preset => {
      preset.classList.remove('active');
    });
    
    if (this.elements.regionTabs.length > 0 && this.elements.countryFilters) {
      this.elements.regionTabs.forEach(tab => tab.classList.remove('active'));
      this.elements.regionTabs[0].classList.add('active');
      this.elements.countryFilters.className = 'filter-options scrollable show-all';
    }
    
    this.updateActiveFiltersDisplay();
    this.elements.activeFiltersContainer.dispatchEvent(new Event('commitSearch')); // Trigger search event
  }
  
  // Infinite scroll
  initInfiniteScroll() {
    const scrollSentinel = document.getElementById('scroll-sentinel');
    if (!scrollSentinel || window.innerWidth <= 992) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadMoreResults();
        }
      });
    }, { rootMargin: '200px' });
    
    observer.observe(scrollSentinel);
  }
  
  loadMoreResults() {
    setTimeout(() => {
      const existingCards = this.elements.documentsGrid.querySelectorAll('.document-card');
      const sentinel = document.getElementById('scroll-sentinel');
      
      if (existingCards.length > 0) {
        if (sentinel) sentinel.remove();
        
        for (let i = 0; i < Math.min(3, existingCards.length); i++) {
          const clone = existingCards[i].cloneNode(true);
          const title = clone.querySelector('.document-title');
          if (title) {
            title.textContent += ' (New)';
          }
          this.elements.documentsGrid.appendChild(clone);
        }
        
        if (sentinel) this.elements.documentsGrid.appendChild(sentinel);
      }
    }, 800);
  }
  
  // Simulation methods
  simulateSearch() {
    this.elements.documentsGrid.classList.add('loading');
    
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
      resultsCount.textContent = 'Loading results...';
    }
    
    setTimeout(() => {
      const resultNumber = Math.max(10, 50 - (this.state.activeFilters.length * 8));
      if (resultsCount) {
        resultsCount.textContent = `${resultNumber} documents found`;
      }
      
      this.elements.documentsGrid.classList.remove('loading');
    }, 800);
  }
  
  updatePaginationUI() {
    this.elements.paginationButtons.forEach(btn => {
      if (!btn.classList.contains('prev-page') && !btn.classList.contains('next-page')) {
        const pageNum = parseInt(btn.textContent);
        btn.classList.toggle('active', pageNum === this.state.currentPage);
      }
    });
    
    this.elements.prevPageBtn.disabled = this.state.currentPage === 1;
    this.elements.nextPageBtn.disabled = this.state.currentPage === this.state.totalPages;
    
    this.simulatePageChange();
  }
  
  simulatePageChange() {
    const documentsGrid = document.querySelector('.documents-grid');
    const documentsList = document.querySelector('.documents-list');
    
    if (documentsGrid) documentsGrid.style.opacity = '0.5';
    if (documentsList) documentsList.style.opacity = '0.5';
    
    const resultsCount = document.querySelector('.results-count');
    if (resultsCount) {
      resultsCount.textContent = `Loading page ${this.state.currentPage}...`;
    }
    
    setTimeout(() => {
      if (documentsGrid) documentsGrid.style.opacity = '1';
      if (documentsList) documentsList.style.opacity = '1';
      
      if (resultsCount) {
        const startItem = (this.state.currentPage - 1) * 10 + 1;
        const endItem = Math.min(this.state.currentPage * 10, 120);
        resultsCount.textContent = `Showing ${startItem}-${endItem} of 120 documents`;
      }
      
      const resultsContainer = document.querySelector('.results-container');
      if (resultsContainer) {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 800);
  }
  
  // Map functionality
  initializeMap() {
    const mapContainer = document.getElementById('interactive-map');
    if (!mapContainer || mapContainer.getAttribute('data-initialized') === 'true') return;
    
    mapContainer.setAttribute('data-initialized', 'true');
    
    const placeholder = mapContainer.querySelector('.map-placeholder');
    if (placeholder) placeholder.remove();
    
    // Create SVG map with modern approach
    const mapSvg = this.createMapSVG();
    mapContainer.appendChild(mapSvg);
    
    this.addMapStyles();
  }
  
  createMapSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 1000 500');
    svg.setAttribute('id', 'map-svg');
    svg.style.backgroundColor = '#f0f6ff';
    
    // Add defs for gradients and filters
    svg.appendChild(this.createMapDefs());
    
    // Add continents
    svg.appendChild(this.createContinents());
    
    // Add connections
    svg.appendChild(this.createConnections());
    
    // Add markers
    svg.appendChild(this.createMarkers());
    
    // Add labels
    svg.appendChild(this.createLabels());
    
    return svg;
  }
  
  createMapDefs() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <radialGradient id="markerGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stop-color="white" stop-opacity="1" />
        <stop offset="100%" stop-color="white" stop-opacity="0" />
      </radialGradient>
      
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feComposite in="SourceGraphic" in2="coloredBlur" operator="over"/>
      </filter>
    `;
    return defs;
  }
  
  createContinents() {
    const continentsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    continentsGroup.setAttribute('class', 'continents');
    
    const continents = [
      {
        path: 'M550 80 Q650 50 700 80 Q750 110 800 100 Q840 80 860 120 Q830 180 780 200 Q730 220 680 190 Q630 160 590 170 Q560 190 550 150 Z',
        fill: '#d4e2ff',
        stroke: '#094EB2',
        class: 'continent europe'
      },
      {
        path: 'M350 220 Q370 200 390 220 Q410 240 400 270 Q390 300 370 330 Q340 350 310 380 Q280 400 250 390 Q230 370 250 340 Q280 310 310 290 Q330 270 350 220 Z',
        fill: '#d4ffe6',
        stroke: '#34A853',
        class: 'continent latam'
      }
    ];
    
    continents.forEach(continent => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      Object.entries(continent).forEach(([key, value]) => {
        if (key === 'class') {
          path.setAttribute('class', value);
        } else {
          path.setAttribute(key, value);
        }
      });
      path.setAttribute('stroke-width', '2');
      continentsGroup.appendChild(path);
    });
    
    return continentsGroup;
  }
  
  createConnections() {
    const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connectionsGroup.setAttribute('class', 'connections');
    
    const connections = [
      { start: { x: 650, y: 150 }, end: { x: 320, y: 280 }, color: '#094EB2', delay: 0 },
      { start: { x: 700, y: 120 }, end: { x: 300, y: 260 }, color: '#34A853', delay: 0.5 },
      { start: { x: 600, y: 180 }, end: { x: 350, y: 300 }, color: '#FBBC04', delay: 1 }
    ];
    
    connections.forEach((conn) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const pathData = `M${conn.start.x},${conn.start.y} Q${(conn.start.x + conn.end.x)/2},${(conn.start.y + conn.end.y)/2 - 80} ${conn.end.x},${conn.end.y}`;
      
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', conn.color);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-dasharray', '5,3');
      path.setAttribute('class', 'connection-line');
      path.style.opacity = '0';
      
      connectionsGroup.appendChild(path);
      
      // Animate path
      path.animate([
        { opacity: 0, strokeDashoffset: '1000' },
        { opacity: 1, strokeDashoffset: '0' }
      ], {
        duration: 2000,
        delay: conn.delay * 1000,
        fill: 'forwards',
        easing: 'ease-out'
      });
    });
    
    return connectionsGroup;
  }
  
  createMarkers() {
    const markersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    markersGroup.setAttribute('class', 'markers');
    
    const markers = [
      { x: 600, y: 120, label: 'European Union', count: 25, color: '#094EB2' },
      { x: 650, y: 180, label: 'Spain', count: 15, color: '#094EB2' },
      { x: 720, y: 150, label: 'Germany', count: 12, color: '#094EB2' },
      { x: 780, y: 130, label: 'France', count: 10, color: '#094EB2' },
      { x: 300, y: 260, label: 'Brazil', count: 18, color: '#34A853' },
      { x: 320, y: 320, label: 'Argentina', count: 13, color: '#34A853' },
      { x: 350, y: 280, label: 'Colombia', count: 11, color: '#34A853' },
      { x: 310, y: 230, label: 'Mexico', count: 14, color: '#34A853' },
      { x: 470, y: 200, label: 'EU-LATAM Agreements', count: 30, color: '#FBBC04' }
    ];
    
    markers.forEach((marker, index) => {
      const markerGroup = this.createMarkerElement(marker, index);
      markersGroup.appendChild(markerGroup);
    });
    
    return markersGroup;
  }
  
  createMarkerElement(marker, index) {
    const size = 10 + marker.count * 0.5;
    const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    markerGroup.setAttribute('class', 'map-marker');
    markerGroup.setAttribute('data-label', marker.label);
    markerGroup.setAttribute('data-count', marker.count);
    markerGroup.style.opacity = '0';
    markerGroup.style.cursor = 'pointer';
    
    // Create marker elements
    const elements = [
      this.createCircle(marker.x, marker.y, size + 10, 'none', marker.color, '1', 'pulse-circle pulse-2'),
      this.createCircle(marker.x, marker.y, size + 5, 'none', marker.color, '1.5', 'pulse-circle pulse-1'),
      this.createCircle(marker.x, marker.y, size, marker.color, marker.color, '2'),
      this.createText(marker.x, marker.y + 5, marker.count.toString(), 'white', 'bold', '12')
    ];
    
    elements.forEach(element => markerGroup.appendChild(element));
    
    // Add tooltip
    const tooltip = this.createTooltip(marker);
    markerGroup.appendChild(tooltip);
    
    // Animation
    markerGroup.animate([
      { opacity: 0, transform: 'scale(0.5)' },
      { opacity: 1, transform: 'scale(1)' }
    ], {
      duration: 800,
      delay: index * 200,
      fill: 'forwards',
      easing: 'ease-out'
    });
    
    // Event listeners
    this.addMarkerEventListeners(markerGroup, marker);
    
    return markerGroup;
  }
  
  createCircle(cx, cy, r, fill, stroke, strokeWidth, className = '') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', fill);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', strokeWidth);
    if (className) circle.setAttribute('class', className);
    if (fill !== 'none') circle.setAttribute('fill-opacity', '0.6');
    return circle;
  }
  
  createText(x, y, text, fill, fontWeight, fontSize) {
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', x);
    textElement.setAttribute('y', y);
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('fill', fill);
    textElement.setAttribute('font-weight', fontWeight);
    textElement.setAttribute('font-size', fontSize);
    textElement.textContent = text;
    return textElement;
  }
  
  createTooltip(marker) {
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tooltip.setAttribute('class', 'marker-tooltip');
    tooltip.style.opacity = '0';
    tooltip.style.pointerEvents = 'none';
    tooltip.setAttribute('transform', `translate(${marker.x},${marker.y - 25})`);
    
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', '-60');
    bg.setAttribute('y', '-25');
    bg.setAttribute('width', '120');
    bg.setAttribute('height', '25');
    bg.setAttribute('rx', '4');
    bg.setAttribute('ry', '4');
    bg.setAttribute('fill', 'white');
    bg.setAttribute('stroke', '#ddd');
    bg.setAttribute('stroke-width', '1');
    bg.setAttribute('filter', 'url(#glow)');
    
    const text = this.createText(0, -8, marker.label, '#333', 'normal', '12');
    
    tooltip.appendChild(bg);
    tooltip.appendChild(text);
    
    return tooltip;
  }
  
  addMarkerEventListeners(markerGroup, marker) {
    const baseCircle = markerGroup.querySelector('circle[fill-opacity]');
    const tooltip = markerGroup.querySelector('.marker-tooltip');
    
    markerGroup.addEventListener('mouseenter', () => {
      baseCircle.setAttribute('fill-opacity', '0.8');
      baseCircle.setAttribute('stroke-width', '3');
      tooltip.style.opacity = '1';
      tooltip.style.transition = 'opacity 0.3s';
    });
    
    markerGroup.addEventListener('mouseleave', () => {
      baseCircle.setAttribute('fill-opacity', '0.6');
      baseCircle.setAttribute('stroke-width', '2');
      tooltip.style.opacity = '0';
    });
    
    markerGroup.addEventListener('click', () => {
      this.showMarkerPopup(marker, document.getElementById('interactive-map'));
    });
  }
  
  createLabels() {
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('class', 'map-labels');
    
    const labels = [
      { x: 680, y: 120, text: 'EUROPE', color: '#094EB2' },
      { x: 300, y: 350, text: 'LATIN AMERICA', color: '#34A853' }
    ];
    
    labels.forEach(label => {
      const text = this.createText(label.x, label.y, label.text, label.color, 'bold', '16');
      text.setAttribute('filter', 'url(#glow)');
      labelsGroup.appendChild(text);
    });
    
    return labelsGroup;
  }
  
  addMapStyles() {
    if (document.getElementById('map-animations')) return;
    
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
  
  showMarkerPopup(marker, container) {
    const existingPopup = document.querySelector('.map-popup');
    if (existingPopup) existingPopup.remove();
    
    const popup = document.createElement('div');
    popup.className = 'map-popup';
    popup.innerHTML = `
      <div class="popup-header">
        <h3>${marker.label}</h3>
        <button class="popup-close">×</button>
      </div>
      <div class="popup-content">
        <p>${marker.count} documents found</p>
        <button class="btn btn-primary view-docs-btn">View documents</button>
      </div>
    `;
    
    this.stylePopup(popup);
    this.addPopupEventListeners(popup, marker);
    
    container.appendChild(popup);
  }
  
  stylePopup(popup) {
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
    const header = popup.querySelector('.popup-header');
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      borderBottom: '1px solid #eee',
      backgroundColor: '#f8f8f8',
      borderRadius: '8px 8px 0 0'
    });
    
    // Style content
    const content = popup.querySelector('.popup-content');
    content.style.padding = '1rem';
    
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
  }
  
  addPopupEventListeners(popup, marker) {
    const closeBtn = popup.querySelector('.popup-close');
    const viewDocsBtn = popup.querySelector('.view-docs-btn');
    
    closeBtn.addEventListener('click', () => {
      popup.style.animation = 'fadeOut 0.2s forwards';
      setTimeout(() => popup.remove(), 200);
    });
    
    viewDocsBtn.addEventListener('click', () => {
      this.setActiveView('list');
      this.addFilter('country', marker.label);
      // this.simulateSearch();
      popup.remove();
    });
  }
}

// Initialize the explore page manager
document.addEventListener('DOMContentLoaded', () => {
  new ExplorePageManager();
});