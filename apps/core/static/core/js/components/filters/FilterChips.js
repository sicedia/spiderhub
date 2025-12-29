/**
 * Filter Chips Component
 * Handles the display and interaction of active filter chips
 * Following the existing JavaScript architecture
 */

import { gettext as _ } from '../../core/i18n/i18n.js';

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
      if (e.target.classList.contains('filter-chip__remove') || e.target.closest('.filter-chip__remove')) {
        const chip = e.target.closest('.filter-chip');
        if (chip) {
          const filterName = chip.dataset.type;  // Using 'type' to match createFilterChip
          const filterValue = chip.dataset.value;  // Using 'value' to match createFilterChip
          this.removeFilter(filterName, filterValue);
        }
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
      this.triggerFilterChange();  // Trigger filter change after adding filter
    }
  }

  removeFilter(filterName, filterValue) {
    const key = `${filterName}-${filterValue}`;
    if (this.activeFilters.has(key)) {
      this.activeFilters.delete(key);
      this.updateDisplay(); // This will trigger filterCountChanged event
      
      // Uncheck the corresponding checkbox
      const checkbox = document.querySelector(`input[name="${filterName}"][value="${filterValue}"]`);
      if (checkbox) {
        checkbox.checked = false;
      }
      
      // Clear date inputs if removing date filters
      if (filterName === 'date_from' || filterName === 'date_to') {
        const dateFromInput = document.getElementById('date_from');
        const dateToInput = document.getElementById('date_to');
        
        // Check if both date filters are being removed
        const hasOtherDateFilter = Array.from(this.activeFilters.values()).some(
          f => (f.name === 'date_from' || f.name === 'date_to') && 
               !(f.name === filterName && f.value === filterValue)
        );
        
        // Only clear inputs if no other date filter remains
        if (!hasOtherDateFilter) {
          if (dateFromInput) dateFromInput.value = '';
          if (dateToInput) dateToInput.value = '';
          
          // Clear active state from date preset buttons
          const datePresets = document.querySelectorAll('.filter-date-preset');
          datePresets.forEach(preset => {
            preset.classList.remove('active', 'filter-date-preset--active');
            preset.setAttribute('aria-pressed', 'false');
          });
          
          // Hide custom date range if visible
          const customRange = document.getElementById('filter-date-range-custom');
          if (customRange) {
            customRange.classList.add('filter-date-range--hidden');
          }
        } else {
          // Only clear the specific input
          if (filterName === 'date_from' && dateFromInput) {
            dateFromInput.value = '';
          }
          if (filterName === 'date_to' && dateToInput) {
            dateToInput.value = '';
          }
        }
      }
      
      // Trigger filter change event
      this.triggerFilterChange();
    }
  }

  clearAllFilters() {
    this.activeFilters.clear();
    this.updateDisplay();
    
    // Uncheck all filter checkboxes in the filter sidebar
    const filterSidebar = document.querySelector('.filter-sidebar') || document.querySelector('.explore-sidebar');
    if (filterSidebar) {
      const checkboxes = filterSidebar.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
    }
    
    // Clear date inputs
    const dateFromInput = document.getElementById('date_from');
    const dateToInput = document.getElementById('date_to');
    if (dateFromInput) dateFromInput.value = '';
    if (dateToInput) dateToInput.value = '';
    
    // Clear active state from date preset buttons
    const datePresets = document.querySelectorAll('.filter-date-preset');
    datePresets.forEach(preset => {
      preset.classList.remove('active', 'filter-date-preset--active');
    });
    
    // Trigger filter change event
    this.triggerFilterChange();
  }

  updateDisplay() {
    const chipsContainer = this.container;
    const clearAllBtn = chipsContainer.querySelector('.filter-chips__clear-all');
    
    // Remove existing chips and OR separators (except clear all button)
    const existingChips = chipsContainer.querySelectorAll('.filter-chip');
    existingChips.forEach(chip => chip.remove());
    const existingSeparators = chipsContainer.querySelectorAll('.filter-chips__or-separator');
    existingSeparators.forEach(sep => sep.remove());
    const existingHint = chipsContainer.querySelector('.filter-chips__hint');
    if (existingHint) existingHint.remove();
    
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
      
      // Add hint text explaining OR logic (only if more than one filter)
      if (this.activeFilters.size > 1) {
        const hint = document.createElement('span');
        hint.className = 'filter-chips__hint';
        hint.textContent = _('Multiple filters use OR logic:');
        hint.setAttribute('aria-label', _('Multiple filters use OR logic'));
        chipsContainer.insertBefore(hint, clearAllBtn);
      }
      
      // Add chips for active filters with OR separators
      let isFirst = true;
      this.activeFilters.forEach((filter, key) => {
        // Add OR separator before each chip except the first
        if (!isFirst) {
          const separator = document.createElement('span');
          separator.className = 'filter-chips__or-separator';
          separator.textContent = 'OR';
          separator.setAttribute('aria-hidden', 'true');
          chipsContainer.insertBefore(separator, clearAllBtn);
        }
        
        const chip = this.createFilterChip(filter);
        chipsContainer.insertBefore(chip, clearAllBtn);
        isFirst = false;
      });
    }
    
    // Dispatch event to notify FilterManager of count change
    // Use requestAnimationFrame to ensure DOM is updated first
    requestAnimationFrame(() => {
      const countEvent = new CustomEvent('filterCountChanged', {
        detail: { count: this.activeFilters.size }
      });
      document.dispatchEvent(countEvent);
    });
  }

  createFilterChip(filter) {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.dataset.type = filter.name;  // Changed from filterName to type for backward compatibility
    chip.dataset.value = filter.value;  // Changed from filterValue to value for backward compatibility
    
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
    
    // Also trigger commitSearch event for backward compatibility with old search system
    const commitEvent = new CustomEvent('commitSearch', {
      bubbles: true,
      detail: {
        activeFilters: Array.from(this.activeFilters.values())
      }
    });
    this.container.dispatchEvent(commitEvent);
  }

  getActiveFilters() {
    return Array.from(this.activeFilters.values());
  }

  hasActiveFilters() {
    return this.activeFilters.size > 0;
  }
}
