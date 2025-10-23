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

/**
 * Standardized Event Names
 * All events are namespaced for clarity and to prevent conflicts
 * Format: category:action or category:entity:action
 */
export const EVENTS = {
  // Search Events
  SEARCH_PERFORMED: 'search:performed',
  SEARCH_COMMITTED: 'search:committed',
  SEARCH_CLEARED: 'search:cleared',
  SEARCH_FOCUS: 'search:focus',
  SEARCH_BLUR: 'search:blur',
  SEARCH_ERROR: 'search:error',
  SEARCH_SUCCESS: 'search:success',
  
  // Filter Events
  FILTER_CHANGED: 'filter:changed',
  FILTER_TOGGLE: 'filter:toggle',
  FILTERS_CHANGED: 'filters:changed',
  FILTERS_CLEARED: 'filters:cleared',
  FILTERS_APPLIED: 'filters:applied',
  DATE_RANGE_CHANGED: 'filter:date_range:changed',
  REGION_CHANGED: 'filter:region:changed',
  
  // Suggestion Events
  SUGGESTIONS_READY: 'suggestions:ready',
  SUGGESTIONS_CLEAR: 'suggestions:clear',
  SUGGESTIONS_ERROR: 'suggestions:error',
  SUGGESTIONS_SHOWN: 'suggestions:shown',
  SUGGESTIONS_HIDDEN: 'suggestions:hidden',
  SUGGESTION_SELECTED: 'suggestion:selected',
  
  // Pagination Events
  PAGE_CHANGED: 'page:changed',
  PAGE_SIZE_CHANGED: 'page:size:changed',
  
  // View Events
  VIEW_CHANGED: 'view:changed',
  
  // Filter Chip Events
  FILTER_CHIP_CLICKED: 'filter:chip:clicked',
  FILTER_CHIP_REMOVED: 'filter:chip:removed',
  
  // Data Events
  DATA_LOADED: 'data:loaded',
  LOADING_START: 'loading:start',
  LOADING_END: 'loading:end',
  
  // Accordion Events
  ACCORDION_OPENED: 'accordion:opened',
  ACCORDION_CLOSED: 'accordion:closed',
  
  // Component Registration (for PageManager)
  COMPONENT_REGISTERED: 'component:registered',
  COMPONENT_REMOVED: 'component:removed',
  SERVICE_REGISTERED: 'service:registered',
  
  // Result Events
  ITEMS_APPENDED: 'items:appended',
  COUNT_UPDATED: 'count:updated',
  
  // Navigation Events
  NAVIGATION_OPENED: 'navigation:opened',
  NAVIGATION_CLOSED: 'navigation:closed',
  
  // Document Events  
  DOCUMENT_LOADING_START: 'document:loading:start',
  DOCUMENT_LOADED: 'document:loaded',
  DOCUMENT_LOAD_ERROR: 'document:load:error',
  DOCUMENT_CONTENT_READY: 'document:content:ready',
  DOCUMENT_RELOAD_REQUESTED: 'document:reload:requested',
  DOCUMENT_VIEWED: 'document:viewed',
  DOCUMENT_SHARED: 'document:shared',
  DOCUMENT_LINK_COPIED: 'document:link:copied',
  DOCUMENT_BOOKMARKED: 'document:bookmarked',
  DOCUMENT_UNBOOKMARKED: 'document:unbookmarked',
  DOCUMENT_PRINTED: 'document:printed',
  DOCUMENT_TIME_TRACKED: 'document:time:tracked',
  
  // Navigation & Sections
  NAVIGATION_READY: 'navigation:ready',
  SECTION_NAVIGATED: 'section:navigated',
  SECTION_VIEWED: 'section:viewed',
  SCROLL_MILESTONE: 'scroll:milestone',
  
  // Related Documents
  RELATED_DOCUMENTS_LOADED: 'related:documents:loaded',
  
  // UI Events
  IMAGE_LOADED: 'image:loaded',
  
  // Home page events
  HOME_DATA_LOADED: 'home:data:loaded',
  HOME_SEARCH_SUBMITTED: 'home:search:submitted',
  HOME_QUICK_ACTION: 'home:quick:action',
  CAROUSEL_SLIDE_CHANGED: 'carousel:slide:changed',
  
  // Analytics Events
  ANALYTICS: {
    TRACK: 'analytics:track',
    PAGE_VIEW: 'analytics:page_view',
    EVENT: 'analytics:event',
    USER_ACTION: 'analytics:user_action'
  },
  
  // UI Events
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_HIDE: 'notification:hide',
  
  // Legacy Events (to be migrated)
  commitSearch: 'search:committed', // Legacy alias
  filterChanged: 'filter:changed', // Legacy alias
  filterToggle: 'filter:toggle', // Legacy alias
  filtersChanged: 'filters:changed' // Legacy alias
};

// Default export for convenience
export default {
  CONFIG,
  FILTER_TYPES,
  VIEW_TYPES,
  EVENTS
};
