/**
 * API Communication Utilities
 * Centralized HTTP request handling with error management
 * ES6 Module Export
 */

import { CONFIG } from '../constants/config.js';
import { logger } from '../logger/Logger.js';

// Create child logger for API utilities
const apiLogger = logger.child({ component: 'APIUtils' });

export class APIUtils {
  /**
   * Default configuration for API requests
   */
  static defaultConfig = {
    baseURL: CONFIG.API.BASE_URL,
    timeout: CONFIG.API.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  };

  /**
   * Get CSRF token from meta tag or cookie
   */
  static getCSRFToken() {
    // Try to get from meta tag first (Django style)
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Create request headers with CSRF token
   */
  static createHeaders(customHeaders = {}) {
    const headers = { ...this.defaultConfig.headers, ...customHeaders };
    
    // Add CSRF token for non-GET requests
    const csrfToken = this.getCSRFToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    return headers;
  }

  /**
   * Make HTTP request with fetch API
   */
  static async request(url, options = {}) {
    const config = {
      ...this.defaultConfig,
      ...options,
      headers: this.createHeaders(options.headers)
    };
    
    // Handle relative URLs
    let fullURL;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Absolute URL, use as-is
      fullURL = url;
    } else if (url.startsWith('/')) {
      // Absolute path, use as-is (don't prepend baseURL)
      fullURL = url;
    } else {
      // Relative path, prepend baseURL
      fullURL = `${config.baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      const response = await fetch(fullURL, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle HTTP errors
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        
        // Try to get error details from response
        try {
          const errorData = await response.json();
          error.data = errorData;
          error.message = errorData.message || error.message;
        } catch (e) {
          // Response is not JSON, use status text
        }
        
        throw error;
      }
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else if (contentType && contentType.includes('text/')) {
        return await response.text();
      } else {
        return response;
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }
      
      // Network or other errors
      if (!error.status) {
        error.code = 'NETWORK_ERROR';
      }
      
      throw error;
    }
  }

  /**
   * GET request
   */
  static async get(url, params = {}, options = {}) {
    // Handle relative URLs properly
    let finalUrl = url;
    
    // If URL is absolute (starts with http), use as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      finalUrl = url;
    } else {
      // For relative URLs, ensure they start with /
      if (!url.startsWith('/')) {
        finalUrl = `/${url}`;
      } else {
        finalUrl = url;
      }
    }
    
    // Add query parameters if any
    if (Object.keys(params).length > 0) {
      const urlObj = new URL(finalUrl, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          urlObj.searchParams.append(key, value);
        }
      });
      finalUrl = urlObj.pathname + urlObj.search;
    }
    
    return this.request(finalUrl, {
      method: 'GET',
      ...options
    });
  }

  /**
   * POST request
   */
  static async post(url, data = {}, options = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * PUT request
   */
  static async put(url, data = {}, options = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * PATCH request
   */
  static async patch(url, data = {}, options = {}) {
    return this.request(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * DELETE request
   */
  static async delete(url, options = {}) {
    return this.request(url, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Upload file(s)
   */
  static async upload(url, files, additionalData = {}, options = {}) {
    const formData = new FormData();
    
    // Add files
    if (files instanceof FileList) {
      Array.from(files).forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    } else if (files instanceof File) {
      formData.append('file', files);
    } else if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }
    
    // Add additional data
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Remove Content-Type header to let browser set it with boundary
    const headers = { ...options.headers };
    delete headers['Content-Type'];
    
    return this.request(url, {
      method: 'POST',
      body: formData,
      headers,
      ...options
    });
  }

  /**
   * Download file
   */
  static async download(url, filename = null, options = {}) {
    const response = await this.request(url, {
      ...options,
      headers: {
        ...options.headers,
        'Accept': '*/*'
      }
    });
    
    // Create blob from response
    const blob = await response.blob();
    
    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    
    return blob;
  }

  /**
   * Handle API errors with user-friendly messages
   */
  static handleError(error, showToUser = true) {
    apiLogger.error('API Error', error, {
      showToUser,
      status: error.status,
      statusText: error.statusText
    });
    
    let userMessage = 'An unexpected error occurred';
    
    switch (error.code) {
      case 'TIMEOUT':
        userMessage = 'Request timed out. Please try again.';
        break;
      case 'NETWORK_ERROR':
        userMessage = 'Network error. Please check your connection.';
        break;
      default:
        if (error.status) {
          switch (error.status) {
            case 400:
              userMessage = 'Invalid request. Please check your input.';
              break;
            case 401:
              userMessage = 'You are not authorized. Please log in.';
              break;
            case 403:
              userMessage = 'Access denied. You do not have permission.';
              break;
            case 404:
              userMessage = 'Resource not found.';
              break;
            case 429:
              userMessage = 'Too many requests. Please wait and try again.';
              break;
            case 500:
              userMessage = 'Server error. Please try again later.';
              break;
            case 503:
              userMessage = 'Service unavailable. Please try again later.';
              break;
            default:
              userMessage = error.message || userMessage;
          }
        }
    }
    
    if (showToUser) {
      this.showErrorMessage(userMessage);
    }
    
    return {
      error,
      userMessage,
      shouldRetry: [408, 429, 500, 502, 503, 504].includes(error.status)
    };
  }

  /**
   * Show error message to user
   */
  static showErrorMessage(message) {
    // Try to use existing toast/notification system
    if (window.showToast) {
      window.showToast(message, 'error');
      return;
    }
    
    // Fallback to simple alert or custom notification
    const notification = document.createElement('div');
    notification.className = 'api-error-notification alert alert-danger';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    notification.innerHTML = `
      <strong>Error:</strong> ${message}
      <button type="button" class="btn-close float-end" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => notification.remove());
    }
  }

  /**
   * Retry request with exponential backoff
   */
  static async retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        const errorInfo = this.handleError(error, false);
        
        if (!errorInfo.shouldRetry || attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        apiLogger.info('Retrying API request', {
          attempt: attempt + 2,
          maxRetries: maxRetries + 1,
          delay: `${delay}ms`
        });
      }
    }
    
    throw lastError;
  }

  /**
   * Create a cached request function
   */
  static createCachedRequest(cacheKey, ttl = 300000) { // 5 minutes default TTL
    const cache = new Map();
    
    return async (requestFn) => {
      const now = Date.now();
      const cached = cache.get(cacheKey);
      
      if (cached && (now - cached.timestamp) < ttl) {
        return cached.data;
      }
      
      try {
        const data = await requestFn();
        cache.set(cacheKey, { data, timestamp: now });
        return data;
      } catch (error) {
        // Remove invalid cache entry
        cache.delete(cacheKey);
        throw error;
      }
    };
  }
}

// Default export
export default APIUtils;
