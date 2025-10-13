/**
 * Filter Groups Component
 * Handles accordion behavior and search functionality for filter groups
 * Following the existing JavaScript architecture
 */

export class FilterGroups {
  constructor(container) {
    this.container = container;
    this.filterGroups = new Map();
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
      } else {
        group.classList.remove('filter-group--expanded');
      }
    }
  }

  handleSearch(searchInput) {
    const filterGroup = searchInput.closest('.filter-group');
    const options = filterGroup.querySelectorAll('.filter-option');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    options.forEach(option => {
      const label = option.querySelector('.filter-option__label').textContent.toLowerCase();
      const dataAttribute = this.getSearchDataAttribute(option);
      
      let shouldShow = false;
      
      if (dataAttribute) {
        // Use data attribute for search (countries, actors, topics)
        shouldShow = dataAttribute.includes(searchTerm);
      } else {
        // Use label text for search
        shouldShow = label.includes(searchTerm);
      }
      
      option.style.display = shouldShow ? 'flex' : 'none';
    });
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

  handleSelectChange(select) {
    // For select inputs, we dispatch a filter change event
    const event = new CustomEvent('filterChange', {
      detail: {
        filterName: select.name,
        filterValue: select.value,
        filterLabel: select.options[select.selectedIndex].text
      }
    });
    document.dispatchEvent(event);
    
    // If this is the country_role select, update country counts
    if (select.id === 'country-role-select') {
      this.updateCountryCounts(select.value);
    }
  }
  
  async updateCountryCounts(role) {
    try {
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
      const countryOptions = this.container.querySelectorAll('.filter-option[data-country]');
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
    } catch (error) {
      console.error('Error updating country counts:', error);
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
