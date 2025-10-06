/**
 * Base Chart Class
 * Provides common functionality for all chart components
 * Extends BaseComponent with chart-specific features
 * ES6 Module Export
 */

import { BaseComponent } from './BaseComponent.js';
import { CONFIG } from '../constants/config.js';
import { DOMUtils } from '../utils/dom.js';

export class BaseChart extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.chartInstance = null;
    this.data = null;
    this.isLoading = false;
    this.hasError = false;
    this.retryCount = 0;
  }

  /**
   * Default options for all charts
   */
  getDefaultOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      colors: CONFIG.CHARTS.DEFAULT_COLORS,
      animation: {
        duration: CONFIG.ANIMATION.DURATION
      },
      retryAttempts: CONFIG.CHARTS.MAX_RETRY_ATTEMPTS,
      retryDelay: CONFIG.CHARTS.RETRY_DELAY
    };
  }

  /**
   * Initialize chart with loading state
   */
  async init() {
    try {
      this.showLoading();
      await this.loadData();
      await this.render();
      this.hideLoading();
      super.init();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Load chart data - to be implemented by child classes
   */
  async loadData() {
    throw new Error('loadData method must be implemented by child classes');
  }

  /**
   * Render chart - to be implemented by child classes
   */
  async render() {
    throw new Error('render method must be implemented by child classes');
  }

  /**
   * Update chart with new data
   */
  async updateData(newData) {
    try {
      this.showLoading();
      this.data = newData;
      await this.render();
      this.hideLoading();
      this.emit('chart:dataUpdated', { data: newData });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Resize chart
   */
  resize() {
    if (this.chartInstance && typeof this.chartInstance.resize === 'function') {
      this.chartInstance.resize();
    }
    this.emit('chart:resized');
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.isLoading = true;
    this.element.classList.add('chart-loading');
    
    // Create loading spinner if it doesn't exist
    if (!this.find('.chart-spinner')) {
      const spinner = DOMUtils.createElement('div', {
        className: 'chart-spinner',
        innerHTML: `
          <div class="spinner-border" role="status">
            <span class="sr-only">Loading...</span>
          </div>
        `
      });
      this.element.appendChild(spinner);
    }
    
    this.emit('chart:loadingStarted');
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.isLoading = false;
    this.element.classList.remove('chart-loading');
    
    const spinner = this.find('.chart-spinner');
    if (spinner) {
      spinner.remove();
    }
    
    this.emit('chart:loadingFinished');
  }

  /**
   * Show error state
   */
  showError(message = 'Failed to load chart') {
    this.hasError = true;
    this.hideLoading();
    this.element.classList.add('chart-error');
    
    // Create error message if it doesn't exist
    if (!this.find('.chart-error-message')) {
      const errorDiv = DOMUtils.createElement('div', {
        className: 'chart-error-message',
        innerHTML: `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
            <button type="button" class="btn btn-sm btn-outline-danger ms-2 retry-btn">
              Retry
            </button>
          </div>
        `
      });
      
      this.element.appendChild(errorDiv);
      
      // Add retry functionality
      const retryBtn = errorDiv.querySelector('.retry-btn');
      if (retryBtn) {
        this.addEventListener(retryBtn, 'click', this.retry);
      }
    }
    
    this.emit('chart:error', { message });
  }

  /**
   * Hide error state
   */
  hideError() {
    this.hasError = false;
    this.element.classList.remove('chart-error');
    
    const errorMessage = this.find('.chart-error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
  }

  /**
   * Handle chart errors with retry logic
   */
  async handleError(error) {
    console.error(`Chart error in ${this.constructor.name}:`, error);
    
    if (this.retryCount < this.options.retryAttempts) {
      this.retryCount++;
      console.log(`Retrying chart initialization (attempt ${this.retryCount}/${this.options.retryAttempts})`);
      
      setTimeout(() => {
        this.retry();
      }, this.options.retryDelay * this.retryCount);
    } else {
      this.showError(error.message || 'Failed to load chart');
    }
  }

  /**
   * Retry chart initialization
   */
  async retry() {
    this.hideError();
    try {
      await this.init();
      this.retryCount = 0; // Reset retry count on success
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Bind resize events
   */
  bindEvents() {
    super.bindEvents();
    
    // Debounced resize handler
    const debouncedResize = this.debounce(() => {
      this.resize();
    }, CONFIG.ANIMATION.RESIZE_DEBOUNCE_DELAY);
    
    this.addEventListener(window, 'resize', debouncedResize);
  }

  /**
   * Destroy chart and cleanup
   */
  destroy() {
    if (this.chartInstance) {
      if (typeof this.chartInstance.destroy === 'function') {
        this.chartInstance.destroy();
      }
      this.chartInstance = null;
    }
    
    this.hideLoading();
    this.hideError();
    
    super.destroy();
  }

  /**
   * Get chart data in a standardized format
   */
  getChartData() {
    return this.data;
  }

  /**
   * Set chart colors
   */
  setColors(colors) {
    this.options.colors = colors;
    if (this.chartInstance) {
      this.render(); // Re-render with new colors
    }
  }

  /**
   * Export chart as image (if supported by chart library)
   */
  exportAsImage(format = 'png') {
    if (this.chartInstance && typeof this.chartInstance.getDataURL === 'function') {
      return this.chartInstance.getDataURL(format);
    }
    
    console.warn('Chart export not supported for this chart type');
    return null;
  }
}

// Default export
export default BaseChart;
