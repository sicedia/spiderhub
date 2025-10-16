/**
 * i18n URL Utilities
 * Helper functions to handle URLs with language prefixes
 * ES6 Module Export
 */

/**
 * Get current language from URL
 * Extracts language code from pathname (e.g., /es/explore -> 'es')
 * @returns {string} Language code (e.g., 'es', 'en', 'pt')
 */
export function getCurrentLanguage() {
  const pathParts = window.location.pathname.split('/').filter(part => part);
  const firstPart = pathParts[0];
  
  // Check if first part is a valid language code
  const validLanguages = ['es', 'en', 'pt'];
  if (validLanguages.includes(firstPart)) {
    return firstPart;
  }
  
  // Fallback to default language
  return 'en';
}

/**
 * Build URL with current language prefix
 * @param {string} path - Path without language prefix (e.g., '/explore')
 * @returns {string} Path with language prefix (e.g., '/es/explore')
 */
export function buildI18nUrl(path) {
  const lang = getCurrentLanguage();
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Build URL with language prefix
  return `/${lang}/${cleanPath}`;
}

/**
 * Navigate to path with i18n support
 * @param {string} path - Path to navigate to
 * @param {Object} options - Navigation options
 */
export function navigateI18n(path, options = {}) {
  const { 
    newTab = false,
    replace = false 
  } = options;
  
  const url = buildI18nUrl(path);
  
  if (newTab) {
    window.open(url, '_blank');
  } else if (replace) {
    window.location.replace(url);
  } else {
    window.location.href = url;
  }
}

/**
 * Get base path without language prefix
 * @returns {string} Base path (e.g., '/explore' from '/es/explore')
 */
export function getBasePathWithoutLang() {
  const pathParts = window.location.pathname.split('/').filter(part => part);
  const validLanguages = ['es', 'en', 'pt'];
  
  // Remove language prefix if present
  if (validLanguages.includes(pathParts[0])) {
    pathParts.shift();
  }
  
  return '/' + pathParts.join('/');
}

/**
 * Check if current page matches a path (ignoring language prefix)
 * @param {string} path - Path to check (e.g., '/explore')
 * @returns {boolean} True if current page matches
 */
export function isCurrentPage(path) {
  const basePath = getBasePathWithoutLang();
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return basePath === cleanPath || basePath.startsWith(cleanPath + '/');
}

/**
 * Get API endpoint URL (no language prefix for API calls)
 * @param {string} endpoint - API endpoint path (e.g., '/api/search/')
 * @returns {string} Full API URL
 */
export function getApiUrl(endpoint) {
  // API endpoints should NOT have language prefix
  // They're excluded in urls.py
  return endpoint.startsWith('/') ? endpoint : '/' + endpoint;
}

/**
 * Build full URL with domain (useful for sharing)
 * @param {string} path - Path to build URL for
 * @returns {string} Full URL with protocol and domain
 */
export function buildFullUrl(path) {
  const protocol = window.location.protocol;
  const host = window.location.host;
  const i18nPath = buildI18nUrl(path);
  
  return `${protocol}//${host}${i18nPath}`;
}

/**
 * Get available languages
 * @returns {Array} Array of language objects
 */
export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' }
  ];
}

/**
 * Switch to a different language
 * Maintains current path but changes language prefix
 * @param {string} languageCode - Language code to switch to
 */
export function switchLanguage(languageCode) {
  const basePath = getBasePathWithoutLang();
  const newUrl = `/${languageCode}${basePath}`;
  window.location.href = newUrl;
}

// Export all as default object
export default {
  getCurrentLanguage,
  buildI18nUrl,
  navigateI18n,
  getBasePathWithoutLang,
  isCurrentPage,
  getApiUrl,
  buildFullUrl,
  getAvailableLanguages,
  switchLanguage
};

