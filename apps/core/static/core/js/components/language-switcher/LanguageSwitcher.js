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
    
    // Initialize form interceptors for both desktop and mobile language switchers
    this.initializeLanguageFormInterceptors();
    
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

  /**
   * Initialize form interceptors for language switching
   * Intercepts Spanish and Portuguese language selection to show warning modal
   */
  initializeLanguageFormInterceptors() {
    // Get all language switcher forms (desktop and mobile)
    const languageForms = document.querySelectorAll(
      '.language-switcher__form, .mobile-language-switcher__form'
    );

    languageForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const languageInput = form.querySelector('input[name="language"]');
        const languageCode = languageInput ? languageInput.value : null;
        // Intercept Spanish and Portuguese language selection
        if (languageCode === 'es' || languageCode === 'pt') {
          e.preventDefault();
          this.showTranslationWarningModal(form, languageCode);
        }
      });
    });
  }

  /**
   * Show translation warning modal
   * @param {HTMLFormElement} form - The form that was submitted
   * @param {string} languageCode - Language code ('es' or 'pt')
   */
  showTranslationWarningModal(form, languageCode) {
    // Define messages for each language
    const messages = {
      'es': {
        title: 'Aviso de Traducción',
        message: 'La traducción al español aún se está trabajando. Algunos elementos pueden aparecer en inglés.',
        acceptButton: 'Aceptar'
      },
      'pt': {
        title: 'Aviso de Tradução',
        message: 'A tradução para português ainda está em andamento. Alguns elementos podem aparecer em inglês.',
        acceptButton: 'Aceitar'
      }
    };

    const langMessages = messages[languageCode] || messages['es'];

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-labelledby', 'translation-warning-title');
    overlay.setAttribute('aria-modal', 'true');

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal modal--small modal--confirm modal--warning';

    modal.innerHTML = `
      <div class="modal__header">
        <h2 class="modal__title" id="translation-warning-title">${langMessages.title}</h2>
      </div>
      <div class="modal__body">
        <div class="modal__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
          </svg>
        </div>
        <p class="modal__message">
          ${langMessages.message}
        </p>
      </div>
      <div class="modal__footer">
        <button type="button" class="button button--primary translation-warning-accept" aria-label="${langMessages.acceptButton}">
          ${langMessages.acceptButton}
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    // Show modal with animation
    requestAnimationFrame(() => {
      overlay.classList.add('modal-overlay--active');
    });

    // Handle accept button click
    const acceptButton = overlay.querySelector('.translation-warning-accept');
    const closeModal = () => {
      overlay.classList.remove('modal-overlay--active');
      setTimeout(() => {
        document.body.removeChild(overlay);
        document.body.classList.remove('modal-open');
      }, 300);
    };

    acceptButton.addEventListener('click', () => {
      closeModal();
      // Submit the form to change language
      form.submit();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Focus the accept button
    setTimeout(() => {
      acceptButton.focus();
    }, 100);
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

