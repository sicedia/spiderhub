// Tests for Utils module from main.js
import { Utils } from '../../apps/core/static/core/js/main.js';

describe('Utils Module', () => {
  describe('Constants', () => {
    test('should have correct animation duration', () => {
      expect(Utils.ANIMATION_DURATION).toBe(2000);
    });

    test('should have correct resize debounce delay', () => {
      expect(Utils.RESIZE_DEBOUNCE_DELAY).toBe(250);
    });

    test('should have correct carousel cards per view configuration', () => {
      expect(Utils.CAROUSEL_CARDS_PER_VIEW).toEqual({
        mobile: 1,
        tablet: 2,
        desktop: 3
      });
    });

    test('should have correct breakpoints', () => {
      expect(Utils.BREAKPOINTS).toEqual({
        mobile: 768,
        tablet: 992
      });
    });
  });

  describe('createIntersectionObserver', () => {
    test('should create intersection observer with default options', () => {
      const callback = jest.fn();
      const observer = Utils.createIntersectionObserver(callback);
      
      expect(observer).toBeInstanceOf(IntersectionObserver);
    });

    test('should create intersection observer with custom options', () => {
      const callback = jest.fn();
      const options = { threshold: 0.1 };
      const observer = Utils.createIntersectionObserver(callback, options);
      
      expect(observer).toBeInstanceOf(IntersectionObserver);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should debounce function calls', () => {
      const mockFunction = jest.fn();
      const debouncedFunction = Utils.debounce(mockFunction, 100);

      debouncedFunction();
      debouncedFunction();
      debouncedFunction();

      expect(mockFunction).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments to debounced function', () => {
      const mockFunction = jest.fn();
      const debouncedFunction = Utils.debounce(mockFunction, 100);

      debouncedFunction('arg1', 'arg2');

      jest.advanceTimersByTime(100);

      expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('getCardsPerView', () => {
    beforeEach(() => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    test('should return desktop cards per view for large screens', () => {
      window.innerWidth = 1200;
      expect(Utils.getCardsPerView()).toBe(3);
    });

    test('should return tablet cards per view for medium screens', () => {
      window.innerWidth = 800;
      expect(Utils.getCardsPerView()).toBe(2);
    });

    test('should return mobile cards per view for small screens', () => {
      window.innerWidth = 600;
      expect(Utils.getCardsPerView()).toBe(1);
    });

    test('should handle edge case at mobile breakpoint', () => {
      window.innerWidth = 768;
      expect(Utils.getCardsPerView()).toBe(2); // 768 is >= 768, so tablet
    });

    test('should handle edge case at tablet breakpoint', () => {
      window.innerWidth = 992;
      expect(Utils.getCardsPerView()).toBe(3); // 992 is >= 992, so desktop
    });
  });

  describe('animateCounter', () => {
    beforeEach(() => {
      // Mock DOM elements
      document.body.innerHTML = `
        <div id="counter" data-target="100" data-suffix="%"></div>
      `;
      
      // Mock requestAnimationFrame
      global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    });

    test('should animate counter from 0 to target value', () => {
      const counter = document.getElementById('counter');
      Utils.animateCounter(counter, 100);

      // Wait for animation to complete
      setTimeout(() => {
        expect(counter.textContent).toBe('100%');
      }, 100);
    });

    test('should handle counter without suffix', () => {
      const counter = document.createElement('div');
      counter.setAttribute('data-target', '50');
      
      Utils.animateCounter(counter, 100);

      setTimeout(() => {
        expect(counter.textContent).toBe('50');
      }, 100);
    });
  });

  describe('initializeMobileNavigation', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <button class="mobile-menu-toggle">Toggle</button>
        <div class="mobile-nav-overlay">
          <div class="mobile-nav-links">
            <a href="/home">Home</a>
            <a href="/about">About</a>
          </div>
        </div>
      `;
    });

    test('should initialize mobile navigation with default selectors', () => {
      const toggleButton = document.querySelector('.mobile-menu-toggle');
      const overlay = document.querySelector('.mobile-nav-overlay');

      expect(() => {
        Utils.initializeMobileNavigation();
      }).not.toThrow();

      expect(toggleButton).toBeTruthy();
      expect(overlay).toBeTruthy();
    });

    test('should handle missing elements gracefully', () => {
      document.body.innerHTML = '';
      
      expect(() => {
        Utils.initializeMobileNavigation();
      }).not.toThrow();
    });

    test('should handle custom selectors', () => {
      document.body.innerHTML = `
        <button class="custom-toggle">Toggle</button>
        <div class="custom-overlay"></div>
      `;

      expect(() => {
        Utils.initializeMobileNavigation('.custom-toggle', '.custom-overlay');
      }).not.toThrow();
    });
  });
});
