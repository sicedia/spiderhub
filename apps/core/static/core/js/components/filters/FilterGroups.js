/**
 * Filter Groups Component
 * Handles accordion behavior and search functionality for filter groups
 * Following the existing JavaScript architecture
 */

export class FilterGroups {
  constructor(container) {
    this.container = container;
    this.filterGroups = new Map();
    this.searchTimeouts = new Map(); // Store debounce timeouts per search input
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializeFilterGroups();
  }

  bindEvents() {
    // Filter group headers (accordion behavior)
    this.container.addEventListener('click', (e) => {
      const header = e.target.closest('.filter-group__header');
      if (header) {
        this.toggleFilterGroup(header);
      }
    });

    // Filter group headers (keyboard navigation)
    this.container.addEventListener('keydown', (e) => {
      const header = e.target.closest('.filter-group__header');
      if (header && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.toggleFilterGroup(header);
      }
    });

    // Search functionality
    this.container.addEventListener('input', (e) => {
      if (e.target.classList.contains('filter-search__input')) {
        this.handleSearch(e.target);
      }
    });

    // Checkbox and select changes
    this.container.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        this.handleCheckboxChange(e.target);
      } else if (e.target.tagName === 'SELECT') {
        this.handleSelectChange(e.target);
      }
    });
  }

  initializeFilterGroups() {
    const groups = this.container.querySelectorAll('.filter-group');
    groups.forEach(group => {
      const groupId = group.dataset.filterGroup;
      const header = group.querySelector('.filter-group__header');
      const content = group.querySelector('.filter-group__content');
      
      this.filterGroups.set(groupId, {
        element: group,
        header: header,
        content: content,
        isExpanded: header.getAttribute('aria-expanded') === 'true'
      });
    });
  }

  toggleFilterGroup(header) {
    const group = header.closest('.filter-group');
    const groupId = group.dataset.filterGroup;
    const groupData = this.filterGroups.get(groupId);
    
    if (groupData) {
      const isExpanded = !groupData.isExpanded;
      
      // Update state
      groupData.isExpanded = isExpanded;
      header.setAttribute('aria-expanded', isExpanded.toString());
      
      // Update classes
      if (isExpanded) {
        group.classList.add('filter-group--expanded');
        
        // Scroll to group header when expanded (smooth scroll)
        requestAnimationFrame(() => {
          header.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        });
      } else {
        group.classList.remove('filter-group--expanded');
      }
    }
  }

  handleSearch(searchInput) {
    // Clear existing timeout for this input
    const existingTimeout = this.searchTimeouts.get(searchInput);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Debounce search for better performance
    const timeout = setTimeout(() => {
      this.performSearch(searchInput);
      this.searchTimeouts.delete(searchInput);
    }, 200); // 200ms debounce
    
    this.searchTimeouts.set(searchInput, timeout);
  }
  
  performSearch(searchInput) {
    const filterGroup = searchInput.closest('.filter-group');
    if (!filterGroup) return;
    
    const options = Array.from(filterGroup.querySelectorAll('.filter-option'));
    const searchTerm = this.normalizeSearchTerm(searchInput.value);
    
    let visibleCount = 0;
    let totalCount = options.length;
    
    options.forEach(option => {
      const label = option.querySelector('.filter-option__label')?.textContent || '';
      const normalizedLabel = this.normalizeSearchTerm(label);
      const dataAttribute = this.getSearchDataAttribute(option);
      
      let shouldShow = false;
      
      if (searchTerm === '') {
        // Show all when search is empty
        shouldShow = true;
      } else if (dataAttribute) {
        // Use data attribute for search (countries, actors, topics)
        const normalizedData = this.normalizeSearchTerm(dataAttribute);
        shouldShow = normalizedData.includes(searchTerm);
      } else {
        // Use label text for search
        shouldShow = normalizedLabel.includes(searchTerm);
      }
      
      option.style.display = shouldShow ? 'flex' : 'none';
      if (shouldShow) visibleCount++;
    });
    
    // Update search results indicator
    this.updateSearchResults(filterGroup, visibleCount, totalCount, searchTerm);
    
    // Show/hide clear button
    this.toggleClearButton(searchInput, searchTerm);
  }
  
  /**
   * Normalize search term (remove accents, lowercase, trim)
   */
  normalizeSearchTerm(term) {
    if (!term) return '';
    return term
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .trim();
  }
  
  /**
   * Update search results indicator
   */
  updateSearchResults(filterGroup, visibleCount, totalCount, searchTerm) {
    // Remove existing indicator
    let indicator = filterGroup.querySelector('.filter-search-results');
    const optionsContainer = filterGroup.querySelector('.filter-options');
    
    if (!optionsContainer) return;
    
    if (searchTerm === '') {
      // Remove indicator when search is empty
      if (indicator) {
        indicator.remove();
      }
      return;
    }
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'filter-search-results';
      indicator.setAttribute('role', 'status');
      indicator.setAttribute('aria-live', 'polite');
      optionsContainer.insertBefore(indicator, optionsContainer.firstChild);
    }
    
    if (visibleCount === 0) {
      indicator.className = 'filter-search-results filter-search-results--empty';
      indicator.textContent = `No results found for "${searchTerm}"`;
    } else {
      indicator.className = 'filter-search-results';
      indicator.textContent = `Showing ${visibleCount} of ${totalCount} options`;
    }
  }
  
  /**
   * Toggle clear search button
   */
  toggleClearButton(searchInput, searchTerm) {
    const searchContainer = searchInput.closest('.filter-search');
    if (!searchContainer) return;
    
    let clearButton = searchContainer.querySelector('.filter-search__clear');
    
    if (searchTerm && !clearButton) {
      // Create clear button
      clearButton = document.createElement('button');
      clearButton.type = 'button';
      clearButton.className = 'filter-search__clear';
      clearButton.setAttribute('aria-label', 'Clear search');
      clearButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      clearButton.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        this.performSearch(searchInput);
      });
      searchContainer.appendChild(clearButton);
      // Add class to input for padding adjustment
      searchInput.classList.add('has-clear');
    } else if (!searchTerm && clearButton) {
      // Remove clear button when search is empty
      clearButton.remove();
      searchInput.classList.remove('has-clear');
    }
  }

  getSearchDataAttribute(option) {
    // Check for different data attributes used for search
    if (option.dataset.country) return option.dataset.country;
    if (option.dataset.actor) return option.dataset.actor;
    if (option.dataset.topic) return option.dataset.topic;
    return null;
  }

  handleCheckboxChange(checkbox) {
    const filterName = checkbox.name;
    const filterValue = checkbox.value;
    const filterLabel = checkbox.closest('.filter-option').querySelector('.filter-option__label').textContent;
    const filterCategory = this.getFilterCategory(checkbox);
    
    // Dispatch event for filter chips to handle
    const event = new CustomEvent('filterToggle', {
      detail: {
        filterName: filterName,
        filterValue: filterValue,
        filterLabel: filterLabel,
        filterCategory: filterCategory,
        isChecked: checkbox.checked
      }
    });
    document.dispatchEvent(event);
  }

  async handleSelectChange(select) {
    // If this is the country_role select, uncheck all country checkboxes and remove chips
    if (select.id === 'country-role-select') {
      // Get all checked country checkboxes before unchecking
      const countryCheckboxes = this.container.querySelectorAll('input[name="country"]:checked');
      const hadCountriesSelected = countryCheckboxes.length > 0;
      
      // Uncheck and dispatch removal events for each country
      countryCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
        
        // Dispatch filterToggle event to properly remove the chip through FilterManager
        const filterOption = checkbox.closest('.filter-option');
        if (filterOption) {
          const filterLabel = filterOption.querySelector('.filter-option__label')?.textContent || '';
          const event = new CustomEvent('filterToggle', {
            detail: {
              filterName: checkbox.name,
              filterValue: checkbox.value,
              filterLabel: filterLabel,
              filterCategory: this.getFilterCategory(checkbox),
              isChecked: false
            }
          });
          document.dispatchEvent(event);
        }
      });
      
      // Clear the country search input
      const countryGroup = this.container.querySelector('[data-filter-group="countries"]');
      if (countryGroup) {
        const countrySearchInput = countryGroup.querySelector('.filter-search__input');
        if (countrySearchInput) {
          countrySearchInput.value = '';
          // Trigger the search to show all countries again
          this.handleSearch(countrySearchInput);
        }
      }
      
      // Update country counts with new role and wait for it to complete
      await this.updateCountryCounts(select.value);
      
      // Only dispatch filter change event if there were countries selected
      // This triggers a new search with the updated role
      if (hadCountriesSelected) {
        const event = new CustomEvent('filterChange', {
          detail: {
            filterName: select.name,
            filterValue: select.value,
            filterLabel: select.options[select.selectedIndex].text
          }
        });
        document.dispatchEvent(event);
      }
      
      return; // Early return for country_role to avoid dispatching the event below
    }
    
    // For other select inputs, dispatch filter change event
    const event = new CustomEvent('filterChange', {
      detail: {
        filterName: select.name,
        filterValue: select.value,
        filterLabel: select.options[select.selectedIndex].text
      }
    });
    document.dispatchEvent(event);
  }
  
  async updateCountryCounts(role) {
    try {
      // Get all country checkboxes first
      const countryOptions = this.container.querySelectorAll('.filter-option[data-country]');
      const countryCheckboxes = Array.from(countryOptions).map(opt => 
        opt.querySelector('input[type="checkbox"][name="country"]')
      ).filter(cb => cb !== null);
      
      // Temporarily disable all country checkboxes to prevent race conditions
      countryCheckboxes.forEach(checkbox => {
        checkbox.disabled = true;
      });
      
      const response = await fetch(`/api/countries-by-role/?role=${role}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const countries = data.countries;
      
      // Create a map of iso3 -> count for quick lookup
      const countMap = {};
      countries.forEach(country => {
        countMap[country.iso3] = country.count;
      });
      
      // Update all country filter options
      countryOptions.forEach(option => {
        const checkbox = option.querySelector('input[type="checkbox"]');
        if (checkbox && checkbox.name === 'country') {
          const iso3 = checkbox.value;
          const countElement = option.querySelector('.filter-option__count');
          
          if (countMap[iso3]) {
            // Country has documents in this role
            countElement.textContent = countMap[iso3];
            option.style.display = ''; // Show the option
          } else {
            // Country has no documents in this role
            countElement.textContent = '0';
            option.style.display = 'none'; // Hide the option
          }
        }
      });
      
      // Update the country group count
      const visibleCount = countries.length;
      const countryGroup = this.container.querySelector('[data-filter-group="countries"]');
      if (countryGroup) {
        const countBadge = countryGroup.querySelector('.filter-group__count');
        if (countBadge) {
          countBadge.textContent = visibleCount;
        }
      }
      
      // Re-enable all country checkboxes after update is complete
      countryCheckboxes.forEach(checkbox => {
        checkbox.disabled = false;
      });
    } catch (error) {
      console.error('Error updating country counts:', error);
      
      // Make sure to re-enable checkboxes even if there's an error
      const countryCheckboxes = this.container.querySelectorAll('input[type="checkbox"][name="country"]');
      countryCheckboxes.forEach(checkbox => {
        checkbox.disabled = false;
      });
    }
  }

  getFilterCategory(checkbox) {
    const filterGroup = checkbox.closest('.filter-group');
    const groupTitle = filterGroup.querySelector('.filter-group__title').textContent;
    
    // For subgroups, get the subgroup title
    const subgroup = checkbox.closest('.filter-subgroup');
    if (subgroup) {
      return subgroup.querySelector('.filter-subgroup__title').textContent;
    }
    
    return groupTitle;
  }

  expandAllGroups() {
    this.filterGroups.forEach((groupData, groupId) => {
      if (!groupData.isExpanded) {
        this.toggleFilterGroup(groupData.header);
      }
    });
  }

  collapseAllGroups() {
    this.filterGroups.forEach((groupData, groupId) => {
      if (groupData.isExpanded) {
        this.toggleFilterGroup(groupData.header);
      }
    });
  }

  resetAllFilters() {
    const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Clear search inputs
    const searchInputs = this.container.querySelectorAll('.filter-search__input');
    searchInputs.forEach(input => {
      input.value = '';
      this.handleSearch(input);
    });
  }

  getActiveFilters() {
    const activeFilters = [];
    
    // Get all checked checkboxes
    const checkboxes = this.container.querySelectorAll('input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
      const filterName = checkbox.name;
      const filterValue = checkbox.value;
      const filterLabel = checkbox.closest('.filter-option').querySelector('.filter-option__label').textContent;
      const filterCategory = this.getFilterCategory(checkbox);
      
      activeFilters.push({
        name: filterName,
        value: filterValue,
        label: filterLabel,
        category: filterCategory
      });
    });
    
    // Get all select inputs (like country_role)
    const selects = this.container.querySelectorAll('select[name]');
    selects.forEach(select => {
      const filterName = select.name;
      const filterValue = select.value;
      const filterLabel = select.options[select.selectedIndex].text;
      
      activeFilters.push({
        name: filterName,
        value: filterValue,
        label: filterLabel,
        category: ''
      });
    });
    
    return activeFilters;
  }
}
