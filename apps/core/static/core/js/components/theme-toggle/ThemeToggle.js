/**
 * Theme Toggle Component
 * Manages theme switching between light and dark mode
 * ES6 Module Export
 */

import { darkModeManager } from '../../core/utils/darkMode.js';

export class ThemeToggle {
  constructor() {
    this.desktopButton = null;
    this.mobileButtons = [];
    this.currentTheme = 'auto';
  }

  /**
   * Initialize the theme toggle
   */
  init() {
    // Get current theme from manager
    this.currentTheme = darkModeManager.currentTheme || 'auto';
    
    // Initialize desktop button
    this.desktopButton = document.querySelector('.theme-toggle__button');
    if (this.desktopButton) {
      this.attachDesktopListeners();
      this.updateDesktopButton();
    }

    // Initialize mobile buttons
    this.mobileButtons = document.querySelectorAll('.mobile-theme-toggle__button');
    if (this.mobileButtons.length > 0) {
      this.attachMobileListeners();
      this.updateMobileButtons();
    }

    // Listen for theme changes from other sources
    window.addEventListener('darkModeChange', () => {
      this.updateDesktopButton();
      this.updateMobileButtons();
    });
  }

  /**
   * Attach event listeners to desktop button
   */
  attachDesktopListeners() {
    if (!this.desktopButton) return;

    // Toggle theme on click
    this.desktopButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleTheme();
    });

    // Handle keyboard navigation
    this.desktopButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  /**
   * Attach event listeners to mobile buttons
   */
  attachMobileListeners() {
    this.mobileButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = button.dataset.theme;
        if (theme) {
          this.setTheme(theme);
        }
      });

      // Handle keyboard navigation
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const theme = button.dataset.theme;
          if (theme) {
            this.setTheme(theme);
          }
        }
      });
    });
  }

  /**
   * Toggle between light and dark mode
   */
  toggleTheme() {
    const currentIsDark = darkModeManager.isDarkMode;
    const newTheme = currentIsDark ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Set theme explicitly
   * @param {string} theme - 'light', 'dark', or 'auto'
   */
  setTheme(theme) {
    if (!['light', 'dark', 'auto'].includes(theme)) {
      console.warn('[ThemeToggle] Invalid theme:', theme);
      return;
    }

    this.currentTheme = theme;
    darkModeManager.setTheme(theme);
    this.updateDesktopButton();
    this.updateMobileButtons();
  }

  /**
   * Update desktop button state and aria label
   */
  updateDesktopButton() {
    if (!this.desktopButton) return;

    const isDark = darkModeManager.isDarkMode;
    const ariaLabel = isDark 
      ? 'Switch to light mode' 
      : 'Switch to dark mode';
    
    this.desktopButton.setAttribute('aria-label', ariaLabel);
    this.desktopButton.setAttribute('title', ariaLabel);
  }

  /**
   * Update mobile buttons state
   */
  updateMobileButtons() {
    const currentTheme = darkModeManager.currentTheme || 'auto';
    
    this.mobileButtons.forEach((button) => {
      const buttonTheme = button.dataset.theme;
      const isActive = buttonTheme === currentTheme;
      
      button.classList.toggle('mobile-theme-toggle__button--active', isActive);
      button.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = new ThemeToggle();
    themeToggle.init();
  });
} else {
  // DOM already ready
  const themeToggle = new ThemeToggle();
  themeToggle.init();
}

export default ThemeToggle;

