/**
 * Application Enums and Constants
 * Centralized enumerations and constant values
 * ES6 Module Export
 */

/**
 * Filter types for search and filtering functionality
 */
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
  DATE_TO: 'date_to',
  COVERAGE_SCOPE: 'coverage_scope',
  INVESTMENT_AMOUNT: 'investment_amount'
};

/**
 * View types for different display modes
 */
export const VIEW_TYPES = {
  LIST: 'list',
  MAP: 'map',
  GRID: 'grid',
  CARD: 'card',
  TABLE: 'table'
};

/**
 * Chart types for visualization components
 */
export const CHART_TYPES = {
  BAR: 'bar',
  PIE: 'pie',
  LINE: 'line',
  AREA: 'area',
  SCATTER: 'scatter',
  RADAR: 'radar',
  TREEMAP: 'treemap',
  HEATMAP: 'heatmap',
  CHOROPLETH: 'choropleth',
  NETWORK: 'network',
  SANKEY: 'sankey',
  GANTT: 'gantt'
};

/**
 * Component states
 */
export const COMPONENT_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  DISABLED: 'disabled'
};

/**
 * Event types for component communication
 */
export const EVENT_TYPES = {
  // Filter events
  FILTER_CHANGED: 'filterChanged',
  FILTER_APPLIED: 'filterApplied',
  FILTER_CLEARED: 'filterCleared',
  
  // Search events
  SEARCH_STARTED: 'searchStarted',
  SEARCH_COMPLETED: 'searchCompleted',
  SEARCH_CLEARED: 'searchCleared',
  
  // View events
  VIEW_CHANGED: 'viewChanged',
  VIEW_REFRESHED: 'viewRefreshed',
  
  // Data events
  DATA_LOADED: 'dataLoaded',
  DATA_UPDATED: 'dataUpdated',
  DATA_ERROR: 'dataError',
  
  // Page events
  PAGE_READY: 'pageReady',
  PAGE_ERROR: 'pageError',
  PAGE_REFRESHED: 'pageRefreshed',
  
  // Component events
  COMPONENT_INITIALIZED: 'componentInitialized',
  COMPONENT_DESTROYED: 'componentDestroyed',
  COMPONENT_UPDATED: 'componentUpdated',
  
  // Chart events
  CHART_RENDERED: 'chartRendered',
  CHART_UPDATED: 'chartUpdated',
  CHART_ERROR: 'chartError',
  
  // Modal events
  MODAL_OPENED: 'modalOpened',
  MODAL_CLOSED: 'modalClosed',
  
  // Navigation events
  NAVIGATION_CHANGED: 'navigationChanged',
  
  // Pagination events
  PAGE_CHANGED: 'pageChanged',
  PAGE_SIZE_CHANGED: 'pageSizeChanged'
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * Data types for validation and processing
 */
export const DATA_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  EMAIL: 'email',
  URL: 'url',
  PHONE: 'phone',
  ARRAY: 'array',
  OBJECT: 'object'
};

/**
 * Sort directions
 */
export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
};

/**
 * Animation types
 */
export const ANIMATION_TYPES = {
  FADE_IN: 'fadeIn',
  FADE_OUT: 'fadeOut',
  SLIDE_UP: 'slideUp',
  SLIDE_DOWN: 'slideDown',
  SLIDE_LEFT: 'slideLeft',
  SLIDE_RIGHT: 'slideRight',
  SCALE_IN: 'scaleIn',
  SCALE_OUT: 'scaleOut',
  BOUNCE: 'bounce',
  SHAKE: 'shake',
  PULSE: 'pulse'
};

/**
 * Device types based on screen size
 */
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
};

/**
 * Theme modes
 */
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

/**
 * Log levels
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

/**
 * Storage types
 */
export const STORAGE_TYPES = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
  COOKIE: 'cookie'
};

/**
 * File types for uploads
 */
export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  TEXT: ['text/plain', 'text/csv'],
  ARCHIVE: ['application/zip', 'application/x-rar-compressed', 'application/x-tar']
};

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  REQUIRED: 'required',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  PATTERN: 'pattern',
  EMAIL: 'email',
  URL: 'url',
  PHONE: 'phone',
  NUMBER: 'number',
  MIN_VALUE: 'minValue',
  MAX_VALUE: 'maxValue',
  DATE: 'date',
  CUSTOM: 'custom'
};

/**
 * Modal sizes
 */
export const MODAL_SIZES = {
  SMALL: 'sm',
  MEDIUM: 'md',
  LARGE: 'lg',
  EXTRA_LARGE: 'xl'
};

/**
 * Toast/notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Keyboard key codes
 */
export const KEY_CODES = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  BACKSPACE: 'Backspace',
  DELETE: 'Delete'
};

/**
 * Default export containing all enums
 */
export default {
  FILTER_TYPES,
  VIEW_TYPES,
  CHART_TYPES,
  COMPONENT_STATES,
  EVENT_TYPES,
  HTTP_STATUS,
  DATA_TYPES,
  SORT_DIRECTIONS,
  ANIMATION_TYPES,
  DEVICE_TYPES,
  THEME_MODES,
  LOG_LEVELS,
  STORAGE_TYPES,
  FILE_TYPES,
  VALIDATION_RULES,
  MODAL_SIZES,
  NOTIFICATION_TYPES,
  KEY_CODES
};
