/**
 * SuggestionsBox Component
 * Manages search suggestions dropdown
 */

import { BaseComponent } from '../../core/base/BaseComponent.js';

export class SuggestionsBox extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
  }

  getDefaultOptions() {
    return {
      searchInputElement: null,
      minChars: 2
    };
  }

  init() {
    this.suggestions = [];
    this.selectedIndex = -1;
    this.bindEvents();
  }

  bindEvents() {
    // Handle clicks on suggestion items
    this.element.addEventListener('click', (e) => {
      const suggestionItem = e.target.closest('.suggestion-item');
      if (suggestionItem) {
        const text = suggestionItem.textContent;
        this.selectSuggestion(text);
      }
    });

    // Handle keyboard navigation if search input is provided
    if (this.options.searchInputElement) {
      this.options.searchInputElement.addEventListener('keydown', (e) => {
        if (!this.isVisible()) return;

        switch(e.key) {
          case 'ArrowDown':
            e.preventDefault();
            this.selectNext();
            break;
          case 'ArrowUp':
            e.preventDefault();
            this.selectPrevious();
            break;
          case 'Enter':
            if (this.selectedIndex >= 0) {
              e.preventDefault();
              this.selectSuggestion(this.suggestions[this.selectedIndex]);
            } else {
              // Hide suggestions when pressing Enter without a selection
              // This allows the search form to submit normally
              this.hide();
            }
            break;
          case 'Escape':
            this.hide();
            break;
        }
      });
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target) && 
          e.target !== this.options.searchInputElement) {
        this.hide();
      }
    });
  }

  /**
   * Show suggestions
   */
  show(suggestions) {
    this.suggestions = suggestions || [];
    this.selectedIndex = -1;

    if (this.suggestions.length === 0) {
      this.hide();
      return;
    }

    this.render();
    this.element.classList.add('visible');
    this.emit('suggestions:shown', { suggestions: this.suggestions });
  }

  /**
   * Hide suggestions
   */
  hide() {
    this.element.classList.remove('visible');
    this.element.innerHTML = '';
    this.suggestions = [];
    this.selectedIndex = -1;
    this.emit('suggestions:hidden');
  }

  /**
   * Render suggestions
   */
  render() {
    this.element.innerHTML = this.suggestions
      .map((text, index) => `
        <li class="suggestion-item ${index === this.selectedIndex ? 'selected' : ''}" 
            data-index="${index}">
          ${this.escapeHtml(text)}
        </li>
      `)
      .join('');
  }

  /**
   * Select next suggestion
   */
  selectNext() {
    if (this.selectedIndex < this.suggestions.length - 1) {
      this.selectedIndex++;
      this.updateSelection();
    }
  }

  /**
   * Select previous suggestion
   */
  selectPrevious() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateSelection();
    }
  }

  /**
   * Update visual selection
   */
  updateSelection() {
    const items = this.element.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });

    // Update input with selected suggestion
    if (this.selectedIndex >= 0 && this.options.searchInputElement) {
      this.options.searchInputElement.value = this.suggestions[this.selectedIndex];
    }
  }

  /**
   * Select a suggestion
   */
  selectSuggestion(text) {
    if (this.options.searchInputElement) {
      this.options.searchInputElement.value = text;
    }
    
    this.emit('suggestion:selected', { text });
    this.hide();
  }

  /**
   * Check if suggestions are visible
   */
  isVisible() {
    return this.element.classList.contains('visible');
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default SuggestionsBox;

