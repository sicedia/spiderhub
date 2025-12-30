/**
 * Dark Mode Utilities
 * Utilities for handling dark mode in JavaScript-generated content
 * ES6 Module Export
 */

/**
 * Dark Mode Manager
 * Handles dark mode detection and dynamic styling
 */
export class DarkModeManager {
  constructor() {
    this.storageKey = 'spiderhub-theme';
    this.currentTheme = this.getStoredTheme() || 'auto';
    this.isDarkMode = this.detectDarkMode();
    this.setupMediaQueryListener();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get stored theme preference from localStorage
   * @returns {string|null} 'light', 'dark', 'auto', or null
   */
  getStoredTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (e) {
      console.warn('[DarkModeManager] localStorage not available:', e);
      return null;
    }
  }

  /**
   * Store theme preference in localStorage
   * @param {string} theme - 'light', 'dark', or 'auto'
   */
  storeTheme(theme) {
    try {
      if (theme === 'auto') {
        localStorage.removeItem(this.storageKey);
      } else {
        localStorage.setItem(this.storageKey, theme);
      }
    } catch (e) {
      console.warn('[DarkModeManager] Failed to store theme:', e);
    }
  }

  /**
   * Set theme manually
   * @param {string} theme - 'light', 'dark', or 'auto'
   */
  setTheme(theme) {
    if (!['light', 'dark', 'auto'].includes(theme)) {
      console.warn('[DarkModeManager] Invalid theme:', theme);
      return;
    }
    
    this.currentTheme = theme;
    this.storeTheme(theme);
    this.applyTheme(theme);
    this.isDarkMode = this.detectDarkMode();
    this.notifyDarkModeChange();
  }

  /**
   * Apply theme to document
   * @param {string} theme - 'light', 'dark', or 'auto'
   */
  applyTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'auto') {
      // Remove data-theme to let media query take over
      html.removeAttribute('data-theme');
      // Update isDarkMode based on system preference
      this.isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      // Set explicit theme
      html.setAttribute('data-theme', theme);
      this.isDarkMode = theme === 'dark';
    }
  }

  /**
   * Detect if dark mode is currently active
   * @returns {boolean} True if dark mode is active
   */
  detectDarkMode() {
    // Check if explicit theme is set
    const html = document.documentElement;
    const dataTheme = html.getAttribute('data-theme');
    
    if (dataTheme === 'dark') {
      return true;
    } else if (dataTheme === 'light') {
      return false;
    }
    
    // Fall back to system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Setup media query listener for dark mode changes (only when theme is 'auto')
   */
  setupMediaQueryListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Use addEventListener for modern browsers, addListener for older ones
      const handler = (e) => {
        // Only update if theme is set to 'auto'
        if (this.currentTheme === 'auto') {
          this.isDarkMode = e.matches;
          this.notifyDarkModeChange();
        }
      };
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
      } else {
        mediaQuery.addListener(handler);
      }
    }
  }

  /**
   * Notify components about dark mode changes
   */
  notifyDarkModeChange() {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('darkModeChange', {
      detail: { isDarkMode: this.isDarkMode }
    }));
  }

  /**
   * Get dark mode aware colors
   * @param {Object} colors - Color configuration object
   * @returns {Object} Colors adjusted for current mode
   */
  getAdaptiveColors(colors) {
    if (!colors) return {};

    if (this.isDarkMode) {
      return {
        ...colors,
        // Override with dark mode colors
        background: colors.darkBackground || colors.background,
        text: colors.darkText || colors.text,
        border: colors.darkBorder || colors.border,
        primary: colors.darkPrimary || colors.primary,
        secondary: colors.darkSecondary || colors.secondary,
        // Chart specific
        gridColor: colors.darkGridColor || 'rgba(255, 255, 255, 0.1)',
        tooltipBackground: colors.darkTooltipBackground || 'rgba(0, 0, 0, 0.9)',
        tooltipText: colors.darkTooltipText || '#ffffff'
      };
    }

    return colors;
  }

  /**
   * Generate dark mode aware CSS
   * @param {string} baseCSS - Base CSS string
   * @param {Object} darkModeOverrides - Dark mode specific overrides
   * @returns {string} Complete CSS with dark mode support
   */
  generateAdaptiveCSS(baseCSS, darkModeOverrides = {}) {
    const darkModeCSS = Object.entries(darkModeOverrides)
      .map(([selector, styles]) => {
        const darkStyles = Object.entries(styles)
          .map(([property, value]) => `    ${property}: ${value};`)
          .join('\n');
        return `  ${selector} {\n${darkStyles}\n  }`;
      })
      .join('\n');

    return `${baseCSS}

@media (prefers-color-scheme: dark) {
${darkModeCSS}
}`;
  }

  /**
   * Apply dark mode styles to dynamically created elements
   * @param {HTMLElement} element - Element to apply styles to
   * @param {Object} styles - Styles object with light/dark variants
   */
  applyAdaptiveStyles(element, styles) {
    if (!element || !styles) return;

    const currentStyles = this.isDarkMode ? styles.dark : styles.light;
    
    if (currentStyles) {
      Object.entries(currentStyles).forEach(([property, value]) => {
        element.style[property] = value;
      });
    }
  }

  /**
   * Create dark mode aware style element
   * @param {string} id - Unique ID for the style element
   * @param {string} css - CSS content
   * @param {Object} darkModeOverrides - Dark mode overrides
   * @returns {HTMLStyleElement} Style element with dark mode support
   */
  createAdaptiveStyleElement(id, css, darkModeOverrides = {}) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = this.generateAdaptiveCSS(css, darkModeOverrides);
    return style;
  }
}

/**
 * Chart color schemes for dark mode
 */
export const CHART_COLORS = {
  light: {
    primary: '#1C7377',
    secondary: '#32AFAF',
    accent: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#ffffff',
    text: '#1f2937',
    border: '#d1d5db',
    gridColor: 'rgba(0, 0, 0, 0.1)',
    tooltipBackground: 'rgba(255, 255, 255, 0.95)',
    tooltipText: '#1f2937'
  },
  dark: {
    primary: '#4FD1C7',
    secondary: '#5EEAD4',
    accent: '#60A5FA',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    background: '#1f2937',
    text: '#f9fafb',
    border: '#4b5563',
    gridColor: 'rgba(255, 255, 255, 0.1)',
    tooltipBackground: 'rgba(0, 0, 0, 0.9)',
    tooltipText: '#ffffff'
  }
};

/**
 * Get current chart colors based on dark mode
 * @param {DarkModeManager} darkModeManager - Dark mode manager instance
 * @returns {Object} Current color scheme
 */
export function getCurrentChartColors(darkModeManager) {
  return darkModeManager.isDarkMode ? CHART_COLORS.dark : CHART_COLORS.light;
}

/**
 * Create dark mode aware chart options
 * @param {Object} baseOptions - Base chart options
 * @param {DarkModeManager} darkModeManager - Dark mode manager instance
 * @returns {Object} Chart options with dark mode support
 */
export function createAdaptiveChartOptions(baseOptions, darkModeManager) {
  const colors = getCurrentChartColors(darkModeManager);
  
  return {
    ...baseOptions,
    plugins: {
      ...baseOptions.plugins,
      legend: {
        ...baseOptions.plugins?.legend,
        labels: {
          ...baseOptions.plugins?.legend?.labels,
          color: colors.text
        }
      },
      tooltip: {
        ...baseOptions.plugins?.tooltip,
        backgroundColor: colors.tooltipBackground,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        borderColor: colors.border,
        borderWidth: 1
      }
    },
    scales: baseOptions.scales ? Object.keys(baseOptions.scales).reduce((acc, scaleKey) => {
      acc[scaleKey] = {
        ...baseOptions.scales[scaleKey],
        grid: {
          ...baseOptions.scales[scaleKey].grid,
          color: colors.gridColor
        },
        ticks: {
          ...baseOptions.scales[scaleKey].ticks,
          color: colors.text
        }
      };
      return acc;
    }, {}) : undefined
  };
}

// Create global instance
export const darkModeManager = new DarkModeManager();
