/**
 * Filter Groups Component
 * Handles accordion behavior and search functionality for filter groups
 * Following the existing JavaScript architecture
 */

import { gettext as _ } from '../../core/i18n/i18n.js';

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
    this.initializeCountryOptions();
    this.initializePeriodPresets();
    this.initializeDateInputs();
    this.initializeSegmentedControl();
    this.initializeSelectedCounts();
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
        this.updateSelectedCount(e.target);
      } else if (e.target.tagName === 'SELECT') {
        this.handleSelectChange(e.target);
      }
    });
    
    // Period preset buttons
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-date-preset')) {
        this.handlePeriodPreset(e.target);
      }
      
      // Segmented control for country role
      if (e.target.classList.contains('filter-role-segmented__option')) {
        this.handleRoleSegmented(e.target);
      }
      
      // Legal filter chips
      if (e.target.closest('.filter-legal-row__options')) {
        const chip = e.target.closest('.filter-option');
        if (chip) {
          const checkbox = chip.querySelector('input[type="checkbox"]');
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            this.handleCheckboxChange(checkbox);
            this.updateSelectedCount(checkbox);
          }
        }
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
    // For country options, also check the label text
    if (option.querySelector('input[name="country"]')) {
      const label = option.querySelector('.filter-option__label');
      return label ? label.textContent : null;
    }
    return null;
  }

  handleCheckboxChange(checkbox) {
    const filterName = checkbox.name;
    const filterValue = checkbox.value;
    const filterLabel = checkbox.closest('.filter-option').querySelector('.filter-option__label').textContent;
    const filterCategory = this.getFilterCategory(checkbox);
    
    // Special handling for country checkboxes - add/remove chips
    if (filterName === 'country') {
      if (checkbox.checked) {
        this.addCountryChip(filterValue, filterLabel);
      } else {
        this.removeCountryChip(filterValue);
      }
    }
    
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
    // Country role is now handled by segmented control, so this is mainly for other selects
    // For other select inputs, dispatch filter change event
    const event = new CustomEvent('filterChange', {
      detail: {
        filterName: select.name,
        filterValue: select.value,
        filterLabel: select.options[select.selectedIndex]?.text || select.value
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
      
      const response = await fetch(`/api/v1/countries/by-role/?role=${role}`);
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
      const filterLabel = checkbox.closest('.filter-option')?.querySelector('.filter-option__label')?.textContent || 
                         checkbox.value;
      const filterCategory = this.getFilterCategory(checkbox);
      
      activeFilters.push({
        name: filterName,
        value: filterValue,
        label: filterLabel,
        category: filterCategory
      });
    });
    
    // Get all select inputs (like country_role)
    const selects = this.container.querySelectorAll('select[name], input[type="hidden"][name="country_role"]');
    selects.forEach(select => {
      const filterName = select.name;
      const filterValue = select.value;
      let filterLabel = '';
      
      if (select.tagName === 'SELECT') {
        filterLabel = select.options[select.selectedIndex].text;
      } else {
        // For hidden input, get label from segmented control
        const segmented = this.container.querySelector(`.filter-role-segmented__option[data-role="${filterValue}"]`);
        filterLabel = segmented?.textContent || filterValue;
      }
      
      activeFilters.push({
        name: filterName,
        value: filterValue,
        label: filterLabel,
        category: ''
      });
    });
    
    return activeFilters;
  }
  
  /**
   * Initialize country options (similar to Topics)
   */
  initializeCountryOptions() {
    // Load countries on initialization, but don't block if container doesn't exist yet
    // This will be called after FilterLoader finishes, so container should exist
    const container = this.container.querySelector('#filter-options-countries');
    if (container) {
      this.loadCountriesAsOptions();
    } else {
      // If container doesn't exist yet, wait a bit and try again
      setTimeout(() => {
        const retryContainer = this.container.querySelector('#filter-options-countries');
        if (retryContainer) {
          this.loadCountriesAsOptions();
        }
      }, 100);
    }
  }
  
  /**
   * Show loading state for countries
   */
  showCountriesLoading() {
    const container = this.container.querySelector('#filter-options-countries');
    if (!container) return;
    
    container.innerHTML = `
      <div class="filter-loading">
        <div class="filter-loading__spinner"></div>
        <span class="filter-loading__text">${_('Loading countries...')}</span>
      </div>
    `;
  }
  
  /**
   * Load countries as checkbox options (similar to Topics)
   */
  async loadCountriesAsOptions(showLoading = false) {
    const container = this.container.querySelector('#filter-options-countries');
    if (!container) return;
    
    // Show loading state if requested
    if (showLoading) {
      this.showCountriesLoading();
    }
    
    try {
      const roleInput = this.container.querySelector('#country-role-select');
      const role = roleInput?.value || 'any';
      const response = await fetch(`/api/v1/countries/by-role/?role=${role}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const countries = data.countries || [];
      
      if (countries.length === 0) {
        container.innerHTML = '<div class="filter-empty">No countries available</div>';
        return;
      }
      
      // Get currently selected countries from chips
      const selectedCountries = new Set();
      const chips = this.container.querySelectorAll('#filter-country-chips .filter-country-chip');
      chips.forEach(chip => {
        selectedCountries.add(chip.dataset.iso3);
      });
      
      container.innerHTML = countries.map(country => {
        const isChecked = selectedCountries.has(country.iso3);
        return `
          <div class="filter-option" data-country="${this.escapeHtml(country.name.toLowerCase())}">
            <input
              type="checkbox"
              name="country"
              value="${this.escapeHtml(country.iso3)}"
              class="filter-option__checkbox"
              id="country-${this.escapeHtml(country.iso3)}"
              ${isChecked ? 'checked' : ''}
            />
            <label for="country-${this.escapeHtml(country.iso3)}" class="filter-option__label">${this.escapeHtml(country.name)}</label>
            <span class="filter-option__count">${country.count || 0}</span>
          </div>
        `;
      }).join('');
      
      // Update country group count
      const countryGroup = this.container.querySelector('[data-filter-group="countries"]');
      if (countryGroup) {
        const countBadge = countryGroup.querySelector('.filter-group__count[data-count]');
        if (countBadge) {
          countBadge.setAttribute('data-count', countries.length.toString());
        }
      }
    } catch (error) {
      console.error('Error loading countries as options:', error);
      if (container) {
        container.innerHTML = '<div class="filter-error">Error loading countries</div>';
      }
    }
  }
  
  /**
   * Escape HTML for XSS prevention
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Add country chip
   */
  addCountryChip(iso3, name) {
    const chipsContainer = this.container.querySelector('#filter-country-chips');
    if (!chipsContainer) return;
    
    const chip = document.createElement('div');
    chip.className = 'filter-country-chip';
    chip.dataset.iso3 = iso3;
    chip.innerHTML = `
      <span>${name}</span>
      <button class="filter-country-chip__remove" type="button" aria-label="Remove ${name}">✕</button>
    `;
    
    chip.querySelector('.filter-country-chip__remove').addEventListener('click', () => {
      this.removeCountryChip(iso3);
    });
    
    chipsContainer.appendChild(chip);
  }
  
  /**
   * Remove country chip
   */
  removeCountryChip(iso3) {
    const chip = this.container.querySelector(`#filter-country-chips .filter-country-chip[data-iso3="${iso3}"]`);
    const name = chip?.querySelector('span')?.textContent.trim() || '';
    
    if (chip) chip.remove();
    
    // Uncheck the corresponding checkbox
    const checkbox = this.container.querySelector(`input[name="country"][value="${iso3}"]`);
    if (checkbox) {
      checkbox.checked = false;
    }
    
    // Dispatch filter toggle event
    const event = new CustomEvent('filterToggle', {
      detail: {
        filterName: 'country',
        filterValue: iso3,
        filterLabel: name,
        filterCategory: 'Countries',
        isChecked: false
      }
    });
    document.dispatchEvent(event);
    
    this.updateSelectedCount(null, 'countries');
  }
  
  /**
   * Initialize period presets
   */
  initializePeriodPresets() {
    const presets = this.container.querySelectorAll('.filter-date-preset');
    presets.forEach(preset => {
      preset.addEventListener('click', () => {
        this.handlePeriodPreset(preset);
      });
    });
  }
  
  /**
   * Initialize date inputs listeners
   */
  initializeDateInputs() {
    const dateFromInput = this.container.querySelector('#date_from');
    const dateToInput = this.container.querySelector('#date_to');
    
    if (dateFromInput) {
      dateFromInput.addEventListener('change', () => {
        this.handleDateInputChange();
      });
    }
    
    if (dateToInput) {
      dateToInput.addEventListener('change', () => {
        this.handleDateInputChange();
      });
    }
  }
  
  /**
   * Format date for display in chips
   */
  formatDateForChip(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  /**
   * Handle date input changes
   */
  handleDateInputChange() {
    const dateFromInput = this.container.querySelector('#date_from');
    const dateToInput = this.container.querySelector('#date_to');
    
    const dateFrom = dateFromInput?.value || '';
    const dateTo = dateToInput?.value || '';
    
    // Validate date range
    if (dateFrom && dateTo && dateFrom > dateTo) {
      // Invalid range - don't add filters, but don't remove existing ones either
      return;
    }
    
    // Get current active date filters from FilterChips (if available)
    const filterChipsContainer = document.querySelector('.filter-chips');
    const existingDateFromChip = filterChipsContainer?.querySelector('.filter-chip[data-type="date_from"]');
    const existingDateToChip = filterChipsContainer?.querySelector('.filter-chip[data-type="date_to"]');
    
    // Remove existing date_from filter if value changed or cleared
    if (existingDateFromChip) {
      const oldValue = existingDateFromChip.dataset.value;
      if (oldValue !== dateFrom) {
        const removeEvent = new CustomEvent('filterToggle', {
          detail: {
            filterName: 'date_from',
            filterValue: oldValue,
            filterLabel: '',
            filterCategory: 'Period',
            isChecked: false
          }
        });
        document.dispatchEvent(removeEvent);
      }
    }
    
    // Remove existing date_to filter if value changed or cleared
    if (existingDateToChip) {
      const oldValue = existingDateToChip.dataset.value;
      if (oldValue !== dateTo) {
        const removeEvent = new CustomEvent('filterToggle', {
          detail: {
            filterName: 'date_to',
            filterValue: oldValue,
            filterLabel: '',
            filterCategory: 'Period',
            isChecked: false
          }
        });
        document.dispatchEvent(removeEvent);
      }
    }
    
    // Add new date_from filter if value is set and different from existing
    if (dateFrom) {
      if (!existingDateFromChip || existingDateFromChip.dataset.value !== dateFrom) {
        const fromEvent = new CustomEvent('filterToggle', {
          detail: {
            filterName: 'date_from',
            filterValue: dateFrom,
            filterLabel: `From: ${this.formatDateForChip(dateFrom)}`,
            filterCategory: 'Period',
            isChecked: true
          }
        });
        document.dispatchEvent(fromEvent);
      }
    }
    
    // Add new date_to filter if value is set and different from existing
    if (dateTo) {
      if (!existingDateToChip || existingDateToChip.dataset.value !== dateTo) {
        const toEvent = new CustomEvent('filterToggle', {
          detail: {
            filterName: 'date_to',
            filterValue: dateTo,
            filterLabel: `Until: ${this.formatDateForChip(dateTo)}`,
            filterCategory: 'Period',
            isChecked: true
          }
        });
        document.dispatchEvent(toEvent);
      }
    }
    
    this.updateSelectedCount(null, 'period');
  }
  
  /**
   * Handle period preset selection
   */
  handlePeriodPreset(presetButton) {
    const preset = presetButton.dataset.preset;
    const customRange = this.container.querySelector('#filter-date-range-custom');
    
    // Remove active state from all presets
    this.container.querySelectorAll('.filter-date-preset').forEach(btn => {
      btn.classList.remove('active', 'filter-date-preset--active');
      btn.setAttribute('aria-pressed', 'false');
    });
    
    if (preset === 'custom') {
      // Show custom date range
      presetButton.classList.add('active', 'filter-date-preset--active');
      presetButton.setAttribute('aria-pressed', 'true');
      if (customRange) {
        customRange.classList.remove('filter-date-range--hidden');
      }
      // Don't clear dates when switching to custom - let user enter them
    } else {
      // Apply preset
      presetButton.classList.add('active', 'filter-date-preset--active');
      presetButton.setAttribute('aria-pressed', 'true');
      if (customRange) {
        customRange.classList.add('filter-date-range--hidden');
      }
      
      const years = parseInt(preset);
      const today = new Date();
      const fromDate = new Date(today.getFullYear() - years, today.getMonth(), today.getDate());
      
      const dateFromInput = this.container.querySelector('#date_from');
      const dateToInput = this.container.querySelector('#date_to');
      
      // Clear existing date filters first
      if (dateFromInput?.value || dateToInput?.value) {
        // Remove old filters
        if (dateFromInput?.value) {
          const removeFromEvent = new CustomEvent('filterToggle', {
            detail: {
              filterName: 'date_from',
              filterValue: dateFromInput.value,
              filterLabel: '',
              filterCategory: 'Period',
              isChecked: false
            }
          });
          document.dispatchEvent(removeFromEvent);
        }
        if (dateToInput?.value) {
          const removeToEvent = new CustomEvent('filterToggle', {
            detail: {
              filterName: 'date_to',
              filterValue: dateToInput.value,
              filterLabel: '',
              filterCategory: 'Period',
              isChecked: false
            }
          });
          document.dispatchEvent(removeToEvent);
        }
      }
      
      // Set new date values
      if (dateFromInput) {
        dateFromInput.value = fromDate.toISOString().split('T')[0];
      }
      if (dateToInput) {
        dateToInput.value = today.toISOString().split('T')[0];
      }
      
      // Trigger date input change handler which will add the filters
      this.handleDateInputChange();
    }
    
    this.updateSelectedCount(null, 'period');
  }
  
  /**
   * Initialize segmented control for country role
   */
  initializeSegmentedControl() {
    const segmentedOptions = this.container.querySelectorAll('.filter-role-segmented__option');
    segmentedOptions.forEach(option => {
      option.addEventListener('click', () => {
        this.handleRoleSegmented(option);
      });
    });
  }
  
  /**
   * Handle role segmented control selection
   */
  async handleRoleSegmented(optionButton) {
    const role = optionButton.dataset.role;
    const hiddenInput = this.container.querySelector('#country-role-select');
    const previousRole = hiddenInput?.value || 'any';
    
    // Only show loading if role actually changed
    const roleChanged = role !== previousRole;
    
    // Update all segmented options
    this.container.querySelectorAll('.filter-role-segmented__option').forEach(btn => {
      btn.setAttribute('aria-pressed', 'false');
    });
    optionButton.setAttribute('aria-pressed', 'true');
    
    // Update hidden input
    if (hiddenInput) {
      hiddenInput.value = role;
    }
    
    // Clear selected countries chips and uncheck all country checkboxes
    const chipsContainer = this.container.querySelector('#filter-country-chips');
    if (chipsContainer) {
      // Get all chips before clearing
      const chips = chipsContainer.querySelectorAll('.filter-country-chip');
      chips.forEach(chip => {
        const iso3 = chip.dataset.iso3;
        // Uncheck the corresponding checkbox
        const checkbox = this.container.querySelector(`input[name="country"][value="${iso3}"]`);
        if (checkbox) {
          checkbox.checked = false;
        }
        // Dispatch filter toggle event to remove from filter chips
        const name = chip.textContent.trim().replace('✕', '').trim();
        const event = new CustomEvent('filterToggle', {
          detail: {
            filterName: 'country',
            filterValue: iso3,
            filterLabel: name,
            filterCategory: 'Countries',
            isChecked: false
          }
        });
        document.dispatchEvent(event);
      });
      chipsContainer.innerHTML = '';
    }
    
    // Uncheck all country checkboxes
    const countryCheckboxes = this.container.querySelectorAll('input[name="country"]');
    countryCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Reload countries for new role (show loading if role changed)
    await this.loadCountriesAsOptions(roleChanged);
    await this.updateCountryCounts(role);
    
    // Dispatch filter change
    const event = new CustomEvent('filterChange', {
      detail: {
        filterName: 'country_role',
        filterValue: role,
        filterLabel: optionButton.textContent
      }
    });
    document.dispatchEvent(event);
    
    // Update selected count
    this.updateSelectedCount(null, 'countries');
  }
  
  /**
   * Initialize selected count badges
   */
  initializeSelectedCounts() {
    // Listen for filter changes to update counts
    document.addEventListener('filterToggle', () => {
      requestAnimationFrame(() => {
        this.updateAllSelectedCounts();
      });
    });
    
    // Initial update
    this.updateAllSelectedCounts();
  }
  
  /**
   * Update selected count for a specific filter group
   * Note: Count badges are hidden via CSS, but we keep the data-selected attribute
   * for potential future use or analytics
   */
  updateSelectedCount(checkbox, groupId = null) {
    if (!groupId && checkbox) {
      const group = checkbox.closest('.filter-group');
      groupId = group?.dataset.filterGroup;
    }
    
    if (!groupId) return;
    
    const group = this.container.querySelector(`[data-filter-group="${groupId}"]`);
    if (!group) return;
    
    const countBadge = group.querySelector('.filter-group__count[data-selected]');
    if (!countBadge) return;
    
    // Count selected checkboxes in this group
    const selected = group.querySelectorAll('input[type="checkbox"]:checked').length;
    countBadge.setAttribute('data-selected', selected.toString());
    // Text content removed - badges are hidden via CSS
  }
  
  /**
   * Update all selected counts
   * Note: Count badges are hidden via CSS, but we keep the data-selected attribute
   * for potential future use or analytics
   */
  updateAllSelectedCounts() {
    const groups = this.container.querySelectorAll('.filter-group[data-filter-group]');
    groups.forEach(group => {
      const groupId = group.dataset.filterGroup;
      const countBadge = group.querySelector('.filter-group__count[data-selected]');
      if (!countBadge) return;
      
      // Special handling for countries (use chips count)
      if (groupId === 'countries') {
        const chips = group.querySelectorAll('.filter-country-chip');
        const count = chips.length;
        countBadge.setAttribute('data-selected', count.toString());
        // Text content removed - badges are hidden via CSS
        return;
      }
      
      // Special handling for period
      if (groupId === 'period') {
        const hasActivePreset = group.querySelector('.filter-date-preset[aria-pressed="true"]');
        const hasCustomDates = group.querySelector('#date_from')?.value || group.querySelector('#date_to')?.value;
        const count = (hasActivePreset || hasCustomDates) ? 1 : 0;
        countBadge.setAttribute('data-selected', count.toString());
        // Text content removed - badges are hidden via CSS
        return;
      }
      
      // For other groups, count checkboxes
      const selected = group.querySelectorAll('input[type="checkbox"]:checked').length;
      countBadge.setAttribute('data-selected', selected.toString());
      // Text content removed - badges are hidden via CSS
    });
  }
}
