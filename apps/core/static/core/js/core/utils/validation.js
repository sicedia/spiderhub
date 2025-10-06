/**
 * Form Validation Utilities
 * Centralized validation functions and form handling
 * ES6 Module Export
 */

export class ValidationUtils {
  /**
   * Common validation patterns
   */
  static patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    alpha: /^[a-zA-Z]+$/,
    numeric: /^[0-9]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  };

  /**
   * Validate email address
   */
  static isValidEmail(email) {
    return this.patterns.email.test(email);
  }

  /**
   * Validate phone number
   */
  static isValidPhone(phone) {
    return this.patterns.phone.test(phone);
  }

  /**
   * Validate URL
   */
  static isValidUrl(url) {
    return this.patterns.url.test(url);
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password) {
    return this.patterns.password.test(password);
  }

  /**
   * Check if string is empty or only whitespace
   */
  static isEmpty(value) {
    return !value || value.trim().length === 0;
  }

  /**
   * Check if value is within length range
   */
  static isValidLength(value, min = 0, max = Infinity) {
    const length = value ? value.length : 0;
    return length >= min && length <= max;
  }

  /**
   * Check if number is within range
   */
  static isInRange(value, min = -Infinity, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  }

  /**
   * Validate required field
   */
  static isRequired(value) {
    return !this.isEmpty(value);
  }

  /**
   * Validate date format and range
   */
  static isValidDate(dateString, minDate = null, maxDate = null) {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return false;
    }
    
    if (minDate && date < new Date(minDate)) {
      return false;
    }
    
    if (maxDate && date > new Date(maxDate)) {
      return false;
    }
    
    return true;
  }

  /**
   * Validate file type
   */
  static isValidFileType(file, allowedTypes = []) {
    if (!file || !file.type) return false;
    
    return allowedTypes.length === 0 || allowedTypes.includes(file.type);
  }

  /**
   * Validate file size
   */
  static isValidFileSize(file, maxSizeInMB = 10) {
    if (!file || !file.size) return false;
    
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  /**
   * Validate form field with multiple rules
   */
  static validateField(value, rules = {}) {
    const errors = [];
    
    // Required validation
    if (rules.required && !this.isRequired(value)) {
      errors.push('This field is required');
    }
    
    // Skip other validations if field is empty and not required
    if (this.isEmpty(value) && !rules.required) {
      return { isValid: true, errors: [] };
    }
    
    // Length validation
    if (rules.minLength && !this.isValidLength(value, rules.minLength)) {
      errors.push(`Minimum length is ${rules.minLength} characters`);
    }
    
    if (rules.maxLength && !this.isValidLength(value, 0, rules.maxLength)) {
      errors.push(`Maximum length is ${rules.maxLength} characters`);
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.patternMessage || 'Invalid format');
    }
    
    // Email validation
    if (rules.email && !this.isValidEmail(value)) {
      errors.push('Please enter a valid email address');
    }
    
    // Phone validation
    if (rules.phone && !this.isValidPhone(value)) {
      errors.push('Please enter a valid phone number');
    }
    
    // URL validation
    if (rules.url && !this.isValidUrl(value)) {
      errors.push('Please enter a valid URL');
    }
    
    // Password validation
    if (rules.password && !this.isValidPassword(value)) {
      errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
    }
    
    // Numeric range validation
    if (rules.min !== undefined || rules.max !== undefined) {
      if (!this.isInRange(value, rules.min, rules.max)) {
        errors.push(`Value must be between ${rules.min || 'any'} and ${rules.max || 'any'}`);
      }
    }
    
    // Date validation
    if (rules.date && !this.isValidDate(value, rules.minDate, rules.maxDate)) {
      errors.push('Please enter a valid date');
    }
    
    // Custom validation function
    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        errors.push(customResult || 'Invalid value');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate entire form
   */
  static validateForm(formElement, validationRules = {}) {
    const results = {};
    let isFormValid = true;
    
    // Get all form fields
    const fields = formElement.querySelectorAll('input, select, textarea');
    
    fields.forEach(field => {
      const fieldName = field.name || field.id;
      if (!fieldName || !validationRules[fieldName]) return;
      
      const value = field.type === 'checkbox' ? field.checked : field.value;
      const rules = validationRules[fieldName];
      
      const result = this.validateField(value, rules);
      results[fieldName] = result;
      
      if (!result.isValid) {
        isFormValid = false;
      }
      
      // Update field UI
      this.updateFieldUI(field, result);
    });
    
    return {
      isValid: isFormValid,
      fields: results
    };
  }

  /**
   * Update field UI based on validation result
   */
  static updateFieldUI(field, validationResult) {
    const fieldContainer = field.closest('.form-group, .mb-3, .field-container') || field.parentElement;
    
    // Remove existing validation classes and messages
    field.classList.remove('is-valid', 'is-invalid');
    const existingFeedback = fieldContainer.querySelector('.invalid-feedback, .valid-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    if (validationResult.isValid) {
      field.classList.add('is-valid');
    } else {
      field.classList.add('is-invalid');
      
      // Add error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'invalid-feedback';
      errorDiv.textContent = validationResult.errors[0]; // Show first error
      
      fieldContainer.appendChild(errorDiv);
    }
  }

  /**
   * Clear validation UI for a field
   */
  static clearFieldValidation(field) {
    field.classList.remove('is-valid', 'is-invalid');
    
    const fieldContainer = field.closest('.form-group, .mb-3, .field-container') || field.parentElement;
    const feedback = fieldContainer.querySelector('.invalid-feedback, .valid-feedback');
    if (feedback) {
      feedback.remove();
    }
  }

  /**
   * Clear validation UI for entire form
   */
  static clearFormValidation(formElement) {
    const fields = formElement.querySelectorAll('input, select, textarea');
    fields.forEach(field => this.clearFieldValidation(field));
  }

  /**
   * Add real-time validation to a form
   */
  static addRealTimeValidation(formElement, validationRules = {}) {
    const fields = formElement.querySelectorAll('input, select, textarea');
    
    fields.forEach(field => {
      const fieldName = field.name || field.id;
      if (!fieldName || !validationRules[fieldName]) return;
      
      const rules = validationRules[fieldName];
      
      // Validate on blur
      field.addEventListener('blur', () => {
        const value = field.type === 'checkbox' ? field.checked : field.value;
        const result = this.validateField(value, rules);
        this.updateFieldUI(field, result);
      });
      
      // Clear validation on focus (for better UX)
      field.addEventListener('focus', () => {
        this.clearFieldValidation(field);
      });
      
      // Validate on input for immediate feedback (debounced)
      let timeout;
      field.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const value = field.type === 'checkbox' ? field.checked : field.value;
          const result = this.validateField(value, rules);
          this.updateFieldUI(field, result);
        }, 500);
      });
    });
  }

  /**
   * Get form data as object
   */
  static getFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values (checkboxes, multiple selects)
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate and sanitize form data
   */
  static processFormData(formElement, validationRules = {}) {
    const validation = this.validateForm(formElement, validationRules);
    
    if (validation.isValid) {
      const data = this.getFormData(formElement);
      
      // Sanitize string values
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
          data[key] = this.sanitizeInput(data[key]);
        }
      });
      
      return {
        isValid: true,
        data,
        validation
      };
    }
    
    return {
      isValid: false,
      data: null,
      validation
    };
  }
}

// Default export
export default ValidationUtils;
