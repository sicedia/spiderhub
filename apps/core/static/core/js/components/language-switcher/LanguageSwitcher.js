/**
 * Language Switcher Component
 * Manages the dropdown behavior for language selection
 * ES6 Module Export
 */

export class LanguageSwitcher {
  constructor() {
    this.button = null;
    this.dropdown = null;
    this.isOpen = false;
  }

  /**
   * Initialize the language switcher
   */
  init() {
    this.button = document.querySelector('.language-switcher__button');
    this.dropdown = document.querySelector('.language-switcher__dropdown');
    
    if (!this.button || !this.dropdown) {
      return; // Language switcher not present on this page (mobile view)
    }

    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toggle dropdown on button click
    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.dropdown.contains(e.target) && !this.button.contains(e.target)) {
        this.close();
      }
    });

    // Handle keyboard navigation
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
        this.button.focus();
      }
    });

    // Close on Escape key when dropdown is open
    this.dropdown.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
        this.button.focus();
      }
    });

    // Handle option clicks - allow form submission
    const options = this.dropdown.querySelectorAll('.language-switcher__option');
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        // Don't prevent default - let the form submit
        // Just close the dropdown visually (form will redirect anyway)
        this.close();
      });
    });
  }

  /**
   * Toggle dropdown open/close
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open the dropdown
   */
  open() {
    this.isOpen = true;
    this.button.setAttribute('aria-expanded', 'true');
    
    // Focus first option
    setTimeout(() => {
      const firstOption = this.dropdown.querySelector('.language-switcher__option');
      if (firstOption) {
        firstOption.focus();
      }
    }, 100);
  }

  /**
   * Close the dropdown
   */
  close() {
    this.isOpen = false;
    this.button.setAttribute('aria-expanded', 'false');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const languageSwitcher = new LanguageSwitcher();
    languageSwitcher.init();
  });
} else {
  const languageSwitcher = new LanguageSwitcher();
  languageSwitcher.init();
}

export default LanguageSwitcher;

