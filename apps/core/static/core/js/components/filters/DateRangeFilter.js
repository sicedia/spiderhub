/**
 * Date Range Filter Component
 * Handles date range selection with validation
 * ES6 Module Export
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';
import { DOMUtils } from '../../core/utils/dom.js';
import { ValidationUtils } from '../../core/utils/validation.js';
import { EVENTS } from '../../core/constants/config.js';
import { darkModeManager } from '../../core/utils/darkMode.js';
import { gettext as _ } from '../../core/i18n/i18n.js';

export class DateRangeFilter extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.startDate = null;
    this.endDate = null;
    this.isValid = true;
  }

  /**
   * Default options for date range filter
   */
  getDefaultOptions() {
    return {
      startDateId: 'date_from',
      endDateId: 'date_to',
      format: 'YYYY-MM-DD',
      minDate: null,
      maxDate: null,
      allowSameDate: true,
      autoApply: false,
      showClearButton: true,
      showTodayButton: true,
      showPresets: true,
      presets: [
        { label: _('Last 7 days'), days: 7 },
        { label: _('Last 30 days'), days: 30 },
        { label: _('Last 90 days'), days: 90 },
        { label: _('Last year'), days: 365 }
      ],
      labels: {
        startDate: _('From Date'),
        endDate: _('To Date'),
        clear: _('Clear'),
        today: _('Today'),
        apply: _('Apply')
      }
    };
  }

  /**
   * Initialize the date range filter
   */
  init() {
    this.render();
    super.init();
    this.loadInitialValues();
  }

  /**
   * Render the date range filter
   */
  render() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Add CSS classes
    this.element.classList.add('date-range-filter');
    
    // Create filter content
    const content = this.createFilterContent();
    this.element.appendChild(content);
    
    // Add styles
    this.addStyles();
  }

  /**
   * Create filter content
   */
  createFilterContent() {
    const content = DOMUtils.createElement('div', {
      className: 'date-range-filter__content'
    });
    
    // Create date inputs section
    const inputsSection = this.createInputsSection();
    content.appendChild(inputsSection);
    
    // Create presets section if enabled
    if (this.options.showPresets && this.options.presets.length > 0) {
      const presetsSection = this.createPresetsSection();
      content.appendChild(presetsSection);
    }
    
    // Create actions section
    const actionsSection = this.createActionsSection();
    content.appendChild(actionsSection);
    
    return content;
  }

  /**
   * Create date inputs section
   */
  createInputsSection() {
    const section = DOMUtils.createElement('div', {
      className: 'date-range-filter__inputs'
    });
    
    // Start date input
    const startDateGroup = DOMUtils.createElement('div', {
      className: 'date-input-group'
    });
    
    const startLabel = DOMUtils.createElement('label', {
      for: this.options.startDateId,
      className: 'date-input-label'
    }, this.options.labels.startDate);
    
    const startInput = DOMUtils.createElement('input', {
      type: 'date',
      id: this.options.startDateId,
      name: this.options.startDateId,
      className: 'date-input'
    });
    
    if (this.options.minDate) {
      startInput.setAttribute('min', this.options.minDate);
    }
    if (this.options.maxDate) {
      startInput.setAttribute('max', this.options.maxDate);
    }
    
    startDateGroup.appendChild(startLabel);
    startDateGroup.appendChild(startInput);
    
    // End date input
    const endDateGroup = DOMUtils.createElement('div', {
      className: 'date-input-group'
    });
    
    const endLabel = DOMUtils.createElement('label', {
      for: this.options.endDateId,
      className: 'date-input-label'
    }, this.options.labels.endDate);
    
    const endInput = DOMUtils.createElement('input', {
      type: 'date',
      id: this.options.endDateId,
      name: this.options.endDateId,
      className: 'date-input'
    });
    
    if (this.options.minDate) {
      endInput.setAttribute('min', this.options.minDate);
    }
    if (this.options.maxDate) {
      endInput.setAttribute('max', this.options.maxDate);
    }
    
    endDateGroup.appendChild(endLabel);
    endDateGroup.appendChild(endInput);
    
    section.appendChild(startDateGroup);
    section.appendChild(endDateGroup);
    
    return section;
  }

  /**
   * Create presets section
   */
  createPresetsSection() {
    const section = DOMUtils.createElement('div', {
      className: 'date-range-filter__presets'
    });
    
    const title = DOMUtils.createElement('div', {
      className: 'presets-title'
    }, 'Quick Select:');
    section.appendChild(title);
    
    const presetsContainer = DOMUtils.createElement('div', {
      className: 'presets-container'
    });
    
    this.options.presets.forEach(preset => {
      const button = DOMUtils.createElement('button', {
        type: 'button',
        className: 'preset-button',
        'data-days': preset.days
      }, preset.label);
      
      presetsContainer.appendChild(button);
    });
    
    section.appendChild(presetsContainer);
    
    return section;
  }

  /**
   * Create actions section
   */
  createActionsSection() {
    const section = DOMUtils.createElement('div', {
      className: 'date-range-filter__actions'
    });
    
    // Clear button
    if (this.options.showClearButton) {
      const clearBtn = DOMUtils.createElement('button', {
        type: 'button',
        className: 'action-button action-button--secondary'
      }, this.options.labels.clear);
      section.appendChild(clearBtn);
    }
    
    // Today button
    if (this.options.showTodayButton) {
      const todayBtn = DOMUtils.createElement('button', {
        type: 'button',
        className: 'action-button action-button--secondary'
      }, this.options.labels.today);
      section.appendChild(todayBtn);
    }
    
    // Apply button (if not auto-apply)
    if (!this.options.autoApply) {
      const applyBtn = DOMUtils.createElement('button', {
        type: 'button',
        className: 'action-button action-button--primary'
      }, this.options.labels.apply);
      section.appendChild(applyBtn);
    }
    
    return section;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Date input changes
    const startInput = this.find(`#${this.options.startDateId}`);
    const endInput = this.find(`#${this.options.endDateId}`);
    
    if (startInput) {
      this.addEventListener(startInput, 'change', this.handleStartDateChange);
      this.addEventListener(startInput, 'blur', this.validateDateRange);
    }
    
    if (endInput) {
      this.addEventListener(endInput, 'change', this.handleEndDateChange);
      this.addEventListener(endInput, 'blur', this.validateDateRange);
    }
    
    // Preset buttons
    const presetButtons = this.findAll('.preset-button');
    presetButtons.forEach(button => {
      this.addEventListener(button, 'click', this.handlePresetClick);
    });
    
    // Action buttons
    const clearBtn = this.find('.action-button--secondary');
    if (clearBtn && clearBtn.textContent === this.options.labels.clear) {
      this.addEventListener(clearBtn, 'click', this.handleClear);
    }
    
    const todayBtn = this.findAll('.action-button--secondary').find(btn => 
      btn.textContent === this.options.labels.today
    );
    if (todayBtn) {
      this.addEventListener(todayBtn, 'click', this.handleToday);
    }
    
    const applyBtn = this.find('.action-button--primary');
    if (applyBtn) {
      this.addEventListener(applyBtn, 'click', this.handleApply);
    }
  }

  /**
   * Handle start date change
   */
  handleStartDateChange(event) {
    this.startDate = event.target.value;
    
    // Update end date minimum
    const endInput = this.find(`#${this.options.endDateId}`);
    if (endInput && this.startDate) {
      if (this.options.allowSameDate) {
        endInput.setAttribute('min', this.startDate);
      } else {
        const nextDay = this.addDays(new Date(this.startDate), 1);
        endInput.setAttribute('min', this.formatDate(nextDay));
      }
    }
    
    this.validateDateRange();
    
    if (this.options.autoApply) {
      this.applyFilter();
    }
  }

  /**
   * Handle end date change
   */
  handleEndDateChange(event) {
    this.endDate = event.target.value;
    
    // Update start date maximum
    const startInput = this.find(`#${this.options.startDateId}`);
    if (startInput && this.endDate) {
      if (this.options.allowSameDate) {
        startInput.setAttribute('max', this.endDate);
      } else {
        const prevDay = this.addDays(new Date(this.endDate), -1);
        startInput.setAttribute('max', this.formatDate(prevDay));
      }
    }
    
    this.validateDateRange();
    
    if (this.options.autoApply) {
      this.applyFilter();
    }
  }

  /**
   * Handle preset button click
   */
  handlePresetClick(event) {
    const days = parseInt(event.target.getAttribute('data-days'));
    const endDate = new Date();
    const startDate = this.addDays(endDate, -days);
    
    this.setDateRange(startDate, endDate);
  }

  /**
   * Handle clear button click
   */
  handleClear() {
    this.clearDateRange();
  }

  /**
   * Handle today button click
   */
  handleToday() {
    const today = new Date();
    this.setDateRange(today, today);
  }

  /**
   * Handle apply button click
   */
  handleApply() {
    if (this.isValid) {
      this.applyFilter();
    }
  }

  /**
   * Validate date range
   */
  validateDateRange() {
    const startInput = this.find(`#${this.options.startDateId}`);
    const endInput = this.find(`#${this.options.endDateId}`);
    
    // Clear previous validation
    this.clearValidation();
    
    let isValid = true;
    const errors = [];
    
    // Check if both dates are provided
    if (this.startDate && !this.endDate) {
      errors.push('Please select an end date');
      isValid = false;
    } else if (!this.startDate && this.endDate) {
      errors.push('Please select a start date');
      isValid = false;
    }
    
    // Check date order
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      
      if (start > end) {
        errors.push('Start date must be before end date');
        isValid = false;
      } else if (!this.options.allowSameDate && start.getTime() === end.getTime()) {
        errors.push('Start and end dates cannot be the same');
        isValid = false;
      }
    }
    
    // Check against min/max dates
    if (this.startDate && this.options.minDate) {
      if (new Date(this.startDate) < new Date(this.options.minDate)) {
        errors.push(`Start date cannot be before ${this.options.minDate}`);
        isValid = false;
      }
    }
    
    if (this.endDate && this.options.maxDate) {
      if (new Date(this.endDate) > new Date(this.options.maxDate)) {
        errors.push(`End date cannot be after ${this.options.maxDate}`);
        isValid = false;
      }
    }
    
    this.isValid = isValid;
    
    // Show validation errors
    if (!isValid) {
      this.showValidationErrors(errors);
    }
    
    // Update UI state
    this.updateUIState();
    
    return isValid;
  }

  /**
   * Show validation errors
   */
  showValidationErrors(errors) {
    const errorContainer = DOMUtils.createElement('div', {
      className: 'date-range-filter__errors'
    });
    
    errors.forEach(error => {
      const errorItem = DOMUtils.createElement('div', {
        className: 'error-message'
      }, error);
      errorContainer.appendChild(errorItem);
    });
    
    // Insert after inputs section
    const inputsSection = this.find('.date-range-filter__inputs');
    if (inputsSection && inputsSection.nextSibling) {
      this.element.insertBefore(errorContainer, inputsSection.nextSibling);
    } else {
      this.element.appendChild(errorContainer);
    }
  }

  /**
   * Clear validation errors
   */
  clearValidation() {
    const errorContainer = this.find('.date-range-filter__errors');
    if (errorContainer) {
      errorContainer.remove();
    }
    
    // Remove error classes from inputs
    const inputs = this.findAll('.date-input');
    inputs.forEach(input => {
      input.classList.remove('date-input--error');
    });
  }

  /**
   * Update UI state based on validation
   */
  updateUIState() {
    const applyBtn = this.find('.action-button--primary');
    if (applyBtn) {
      applyBtn.disabled = !this.isValid;
    }
    
    // Add error classes to inputs if invalid
    if (!this.isValid) {
      const startInput = this.find(`#${this.options.startDateId}`);
      const endInput = this.find(`#${this.options.endDateId}`);
      
      if (startInput) startInput.classList.add('date-input--error');
      if (endInput) endInput.classList.add('date-input--error');
    }
  }

  /**
   * Set date range
   */
  setDateRange(startDate, endDate) {
    const startInput = this.find(`#${this.options.startDateId}`);
    const endInput = this.find(`#${this.options.endDateId}`);
    
    if (startInput) {
      startInput.value = this.formatDate(startDate);
      this.startDate = startInput.value;
    }
    
    if (endInput) {
      endInput.value = this.formatDate(endDate);
      this.endDate = endInput.value;
    }
    
    this.validateDateRange();
    
    if (this.options.autoApply && this.isValid) {
      this.applyFilter();
    }
  }

  /**
   * Clear date range
   */
  clearDateRange() {
    const startInput = this.find(`#${this.options.startDateId}`);
    const endInput = this.find(`#${this.options.endDateId}`);
    
    if (startInput) {
      startInput.value = '';
      startInput.removeAttribute('max');
    }
    
    if (endInput) {
      endInput.value = '';
      endInput.removeAttribute('min');
    }
    
    this.startDate = null;
    this.endDate = null;
    this.isValid = true;
    
    this.clearValidation();
    this.updateUIState();
    
    if (this.options.autoApply) {
      this.applyFilter();
    }
  }

  /**
   * Apply filter
   */
  applyFilter() {
    this.emit(EVENTS.FILTERS_APPLIED, {
      startDate: this.startDate,
      endDate: this.endDate,
      isValid: this.isValid
    });
  }

  /**
   * Load initial values
   */
  loadInitialValues() {
    const startInput = this.find(`#${this.options.startDateId}`);
    const endInput = this.find(`#${this.options.endDateId}`);
    
    if (startInput && startInput.value) {
      this.startDate = startInput.value;
    }
    
    if (endInput && endInput.value) {
      this.endDate = endInput.value;
    }
    
    this.validateDateRange();
  }

  /**
   * Get current date range
   */
  getDateRange() {
    return {
      startDate: this.startDate,
      endDate: this.endDate,
      isValid: this.isValid
    };
  }

  /**
   * Format date for input
   */
  formatDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    
    return date.toISOString().split('T')[0];
  }

  /**
   * Add days to date
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById('date-range-filter-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'date-range-filter-styles';
    style.textContent = darkModeManager.generateAdaptiveCSS(`
      .date-range-filter {
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .date-range-filter__content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .date-range-filter__inputs {
        display: flex;
        gap: 16px;
      }

      .date-input-group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .date-input-label {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
      }

      .date-input {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s ease;
      }

      .date-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      .date-input--error {
        border-color: #ef4444;
      }

      .date-input--error:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
      }

      .date-range-filter__presets {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .presets-title {
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
      }

      .presets-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .preset-button {
        padding: 4px 8px;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 12px;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .preset-button:hover {
        background: #e5e7eb;
        border-color: #9ca3af;
      }

      .preset-button:active {
        background: #d1d5db;
      }

      .date-range-filter__actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .action-button {
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }

      .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .action-button--primary {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .action-button--primary:hover:not(:disabled) {
        background: #2563eb;
        border-color: #2563eb;
      }

      .action-button--secondary {
        background: #f3f4f6;
        color: #374151;
        border-color: #d1d5db;
      }

      .action-button--secondary:hover:not(:disabled) {
        background: #e5e7eb;
        border-color: #9ca3af;
      }

      .date-range-filter__errors {
        padding: 8px 12px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 4px;
      }

      .error-message {
        font-size: 12px;
        color: #dc2626;
        margin-bottom: 4px;
      }

      .error-message:last-child {
        margin-bottom: 0;
      }

      /* Responsive */
      @media (max-width: 640px) {
        .date-range-filter__inputs {
          flex-direction: column;
        }
        
        .presets-container {
          justify-content: center;
        }
        
        .date-range-filter__actions {
          justify-content: center;
        }
      }
    `, {
      '.date-range-filter': {
        'background': 'var(--color-bg-primary)',
        'border-color': 'var(--color-border-medium)'
      },
      '.date-input-label': {
        'color': 'var(--color-text-primary)'
      },
      '.date-input': {
        'background-color': 'var(--color-bg-primary)',
        'border-color': 'var(--color-border-medium)',
        'color': 'var(--color-text-primary)'
      },
      '.date-input:focus': {
        'border-color': 'var(--color-primary-400)',
        'box-shadow': '0 0 0 2px var(--focus-ring-color)'
      },
      '.date-input--error': {
        'border-color': 'var(--color-accent-error)'
      },
      '.date-input--error:focus': {
        'border-color': 'var(--color-accent-error)',
        'box-shadow': '0 0 0 2px rgba(239, 68, 68, 0.2)'
      },
      '.presets-title': {
        'color': 'var(--color-text-secondary)'
      },
      '.preset-button': {
        'background': 'var(--color-bg-secondary)',
        'border-color': 'var(--color-border-medium)',
        'color': 'var(--color-text-primary)'
      },
      '.preset-button:hover': {
        'background': 'var(--color-bg-muted)',
        'border-color': 'var(--color-border-strong)'
      },
      '.preset-button:active': {
        'background': 'var(--color-bg-muted)'
      },
      '.preset-button--active': {
        'background': 'var(--color-primary-400)',
        'border-color': 'var(--color-primary-400)',
        'color': 'var(--color-text-inverse)'
      },
      '.preset-button--active:hover': {
        'background': 'var(--color-primary-500)',
        'border-color': 'var(--color-primary-500)'
      },
      '.date-range-filter__actions': {
        'border-top-color': 'var(--color-border-medium)'
      },
      '.date-range-filter__button': {
        'background': 'var(--color-primary-400)',
        'border-color': 'var(--color-primary-400)',
        'color': 'var(--color-text-inverse)'
      },
      '.date-range-filter__button:hover': {
        'background': 'var(--color-primary-500)',
        'border-color': 'var(--color-primary-500)'
      },
      '.date-range-filter__button--secondary': {
        'background': 'var(--color-bg-primary)',
        'border-color': 'var(--color-border-medium)',
        'color': 'var(--color-text-primary)'
      },
      '.date-range-filter__button--secondary:hover': {
        'background': 'var(--color-bg-secondary)',
        'border-color': 'var(--color-border-strong)'
      }
    });
    
    document.head.appendChild(style);
  }
}

// Default export
export default DateRangeFilter;
