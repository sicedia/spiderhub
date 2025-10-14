/**
 * init-i18n.js - Initialize i18n system before other modules
 * 
 * This script should be loaded early in the page lifecycle to ensure
 * translations are available when components initialize.
 */

import i18n from './i18n.js';

// Initialize i18n system immediately
(async () => {
    try {
        const loaded = await i18n.init();
        if (loaded) {
            console.log('[i18n] Translation system initialized successfully');
            
            // Dispatch custom event to notify other modules
            window.dispatchEvent(new CustomEvent('i18n:loaded', {
                detail: { locale: i18n.getLocale() }
            }));
        } else {
            console.warn('[i18n] Translation system initialized with fallback (English)');
        }
    } catch (error) {
        console.error('[i18n] Failed to initialize translation system:', error);
    }
})();

// Make i18n available globally for debugging
if (typeof window !== 'undefined') {
    window.__i18n = i18n;
}

export default i18n;

