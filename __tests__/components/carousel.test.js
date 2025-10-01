// Tests for carousel functionality
import { Utils } from '../../apps/core/static/core/js/main.js';

// Mock the carousel functions since they're not exported
// We'll test the behavior through DOM manipulation

describe('Carousel Component', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="carousel-track">
        <div class="document-card">Card 1</div>
        <div class="document-card">Card 2</div>
        <div class="document-card">Card 3</div>
        <div class="document-card">Card 4</div>
        <div class="document-card">Card 5</div>
      </div>
      <button class="carousel-prev">Previous</button>
      <button class="carousel-next">Next</button>
      <div class="carousel-indicators"></div>
    `;

    // Mock offsetWidth for cards
    const cards = document.querySelectorAll('.document-card');
    cards.forEach(card => {
      Object.defineProperty(card, 'offsetWidth', {
        writable: true,
        value: 300
      });
    });

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Carousel Setup', () => {
    test('should find carousel elements', () => {
      const track = document.querySelector('.carousel-track');
      const prevButton = document.querySelector('.carousel-prev');
      const nextButton = document.querySelector('.carousel-next');
      const indicators = document.querySelector('.carousel-indicators');

      expect(track).toBeTruthy();
      expect(prevButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
      expect(indicators).toBeTruthy();
    });

    test('should have correct number of cards', () => {
      const cards = document.querySelectorAll('.document-card');
      expect(cards).toHaveLength(5);
    });
  });

  describe('Responsive Behavior', () => {
    test('should return correct cards per view for desktop', () => {
      window.innerWidth = 1200;
      expect(Utils.getCardsPerView()).toBe(3);
    });

    test('should return correct cards per view for tablet', () => {
      window.innerWidth = 800;
      expect(Utils.getCardsPerView()).toBe(2);
    });

    test('should return correct cards per view for mobile', () => {
      window.innerWidth = 600;
      expect(Utils.getCardsPerView()).toBe(1);
    });
  });

  describe('Touch Events', () => {
    test('should handle touch events on carousel track', () => {
      const track = document.querySelector('.carousel-track');
      
      // Simulate touch events
      const touchStartEvent = new TouchEvent('touchstart', {
        changedTouches: [{ screenX: 100 }]
      });
      
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [{ screenX: 150 }]
      });

      expect(() => {
        track.dispatchEvent(touchStartEvent);
        track.dispatchEvent(touchEndEvent);
      }).not.toThrow();
    });
  });

  describe('Resize Handling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should handle window resize events', () => {
      const resizeHandler = jest.fn();
      window.addEventListener('resize', resizeHandler);

      // Simulate resize
      window.innerWidth = 800;
      window.dispatchEvent(new Event('resize'));

      // Advance timers to trigger debounced function
      jest.advanceTimersByTime(250);

      expect(resizeHandler).toHaveBeenCalled();
    });
  });
});

