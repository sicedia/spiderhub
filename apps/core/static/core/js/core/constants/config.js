/**
 * Application Configuration Constants
 * Centralized configuration for the entire application
 * ES6 Module Export
 */

export const CONFIG = {
  // Animation settings
  ANIMATION: {
    DURATION: 2000,
    RESIZE_DEBOUNCE_DELAY: 250,
    FADE_DURATION: 300,
    SLIDE_DURATION: 400
  },

  // Breakpoints for responsive design
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 992,
    DESKTOP: 1200
  },

  // Carousel settings
  CAROUSEL: {
    CARDS_PER_VIEW: {
      mobile: 1,
      tablet: 2,
      desktop: 3
    },
    AUTO_PLAY_DELAY: 5000
  },

  // Pagination settings
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_VISIBLE_PAGES: 5
  },

  // Chart settings
  CHARTS: {
    RETRY_DELAY: 100,
    MAX_RETRY_ATTEMPTS: 10,
    DEFAULT_COLORS: [
      '#094EB2', '#34A853', '#FBBC04', '#EA4335', 
      '#9AA0A6', '#5F6368', '#202124'
    ]
  },

  // Map settings
  MAP: {
    DEFAULT_ZOOM: 2,
    MARKER_PULSE_DURATION: 2000,
    TOOLTIP_DELAY: 300
  },

  // Search and filter settings
  SEARCH: {
    MIN_QUERY_LENGTH: 2,
    DEBOUNCE_DELAY: 300,
    MAX_RESULTS: 100
  },

  // API endpoints (if needed)
  API: {
    BASE_URL: '/api/v1',
    TIMEOUT: 10000
  }
};

export const FILTER_TYPES = {
  SEARCH: 'search',
  TYPE: 'type',
  COUNTRY: 'country',
  THEME: 'theme',
  ACTOR: 'actor',
  BENEFICIARY: 'beneficiary',
  SDG: 'sdg',
  LEGAL_BINDINGNESS: 'legal_bindingness',
  AGREEMENT_TYPE: 'agreement_type',
  DATE_FROM: 'date_from',
  DATE_TO: 'date_to'
};

export const VIEW_TYPES = {
  LIST: 'list',
  MAP: 'map',
  GRID: 'grid'
};

export const EVENTS = {
  FILTER_CHANGED: 'filterChanged',
  SEARCH_COMMITTED: 'commitSearch',
  VIEW_CHANGED: 'viewChanged',
  PAGE_CHANGED: 'pageChanged',
  DATA_LOADED: 'dataLoaded'
};

// Default export for convenience
export default {
  CONFIG,
  FILTER_TYPES,
  VIEW_TYPES,
  EVENTS
};
