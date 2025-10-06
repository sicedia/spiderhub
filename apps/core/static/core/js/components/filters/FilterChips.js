/**
 * Filter Chips Component
 * Handles the display and interaction of active filter chips
 * Following the existing JavaScript architecture
 */

export class FilterChips {
  constructor(container) {
    this.container = container;
    this.activeFilters = new Map();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateDisplay();
  }

  bindEvents() {
    // Clear all filters button
    const clearAllBtn = this.container.querySelector('.filter-chips__clear-all');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // Remove individual filter chips
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-chip__remove')) {
        const chip = e.target.closest('.filter-chip');
        const filterName = chip.dataset.filterName;
        const filterValue = chip.dataset.filterValue;
        this.removeFilter(filterName, filterValue);
      }
    });
  }

  addFilter(filterName, filterValue, filterLabel, filterCategory = '') {
    const key = `${filterName}-${filterValue}`;
    if (!this.activeFilters.has(key)) {
      this.activeFilters.set(key, {
        name: filterName,
        value: filterValue,
        label: filterLabel,
        category: filterCategory
      });
      this.updateDisplay();
    }
  }

  removeFilter(filterName, filterValue) {
    const key = `${filterName}-${filterValue}`;
    if (this.activeFilters.has(key)) {
      this.activeFilters.delete(key);
      this.updateDisplay();
      
      // Uncheck the corresponding checkbox
      const checkbox = document.querySelector(`input[name="${filterName}"][value="${filterValue}"]`);
      if (checkbox) {
        checkbox.checked = false;
      }
      
      // Trigger filter change event
      this.triggerFilterChange();
    }
  }

  clearAllFilters() {
    this.activeFilters.clear();
    this.updateDisplay();
    
    // Uncheck all filter checkboxes
    const checkboxes = this.container.parentElement.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Trigger filter change event
    this.triggerFilterChange();
  }

  updateDisplay() {
    const chipsContainer = this.container;
    const clearAllBtn = chipsContainer.querySelector('.filter-chips__clear-all');
    
    // Remove existing chips (except clear all button)
    const existingChips = chipsContainer.querySelectorAll('.filter-chip');
    existingChips.forEach(chip => chip.remove());
    
    if (this.activeFilters.size === 0) {
      chipsContainer.classList.add('filter-chips--empty');
      if (clearAllBtn) {
        clearAllBtn.style.display = 'none';
      }
    } else {
      chipsContainer.classList.remove('filter-chips--empty');
      if (clearAllBtn) {
        clearAllBtn.style.display = 'block';
      }
      
      // Add chips for active filters
      this.activeFilters.forEach((filter, key) => {
        const chip = this.createFilterChip(filter);
        chipsContainer.insertBefore(chip, clearAllBtn);
      });
    }
  }

  createFilterChip(filter) {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.dataset.filterName = filter.name;
    chip.dataset.filterValue = filter.value;
    
    chip.innerHTML = `
      <div class="filter-chip__label">
        ${filter.category ? `<span class="filter-chip__category">${filter.category}:</span>` : ''}
        <span>${filter.label}</span>
      </div>
      <button class="filter-chip__remove" type="button" aria-label="Remove ${filter.label} filter">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;
    
    return chip;
  }

  triggerFilterChange() {
    // Dispatch custom event for other components to listen to
    const event = new CustomEvent('filterChange', {
      detail: {
        activeFilters: Array.from(this.activeFilters.values())
      }
    });
    document.dispatchEvent(event);
  }

  getActiveFilters() {
    return Array.from(this.activeFilters.values());
  }

  hasActiveFilters() {
    return this.activeFilters.size > 0;
  }
}
