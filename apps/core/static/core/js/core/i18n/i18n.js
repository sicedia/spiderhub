/**
 * i18n.js - Internationalization utility for JavaScript
 * 
 * This module provides translation functions for client-side JavaScript code,
 * integrating with Django's JavaScriptCatalog view.
 */

class I18n {
    constructor() {
        this.catalog = {};
        this.locale = 'en';
        this.pluralFunc = this.defaultPluralFunc;
        this.loaded = false;
    }

    /**
     * Default plural function for English
     * @param {number} n - The number to check
     * @returns {number} - Plural form index (0 or 1)
     */
    defaultPluralFunc(n) {
        return n !== 1 ? 1 : 0;
    }

    /**
     * Initialize i18n system by loading translations from Django's JavaScriptCatalog
     * @returns {Promise<boolean>} - True if loaded successfully
     */
    async init() {
        try {
            // Get current language from document
            this.locale = document.documentElement.lang || 'en';
            
            // Check if Django catalog is already loaded via script tag
            // (The catalog script is loaded in base.html before this module)
            if (window.django && window.django.catalog) {
                this.catalog = window.django.catalog;
                this.pluralFunc = window.django.pluralidx || this.defaultPluralFunc;
                this.loaded = true;
                console.log(`[i18n] Loaded ${Object.keys(this.catalog).length} translations for locale: ${this.locale}`);
                return true;
            }

            // If not loaded yet, wait a bit and check again
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (window.django && window.django.catalog) {
                this.catalog = window.django.catalog;
                this.pluralFunc = window.django.pluralidx || this.defaultPluralFunc;
                this.loaded = true;
                console.log(`[i18n] Loaded ${Object.keys(this.catalog).length} translations for locale: ${this.locale}`);
                return true;
            }

            console.warn('[i18n] Translation catalog not loaded, using fallback');
            this.loaded = false;
            return false;
        } catch (error) {
            console.error('[i18n] Error loading translations:', error);
            this.loaded = false;
            return false;
        }
    }

    /**
     * Translate a string (singular)
     * @param {string} msgid - The string to translate
     * @returns {string} - Translated string or original if not found
     */
    gettext(msgid) {
        if (!this.loaded || !this.catalog[msgid]) {
            return msgid;
        }
        return this.catalog[msgid];
    }

    /**
     * Translate a string with plural forms
     * @param {string} singular - Singular form
     * @param {string} plural - Plural form
     * @param {number} count - The count to determine which form to use
     * @returns {string} - Translated string
     */
    ngettext(singular, plural, count) {
        if (!this.loaded) {
            return count === 1 ? singular : plural;
        }

        const key = singular;
        if (!this.catalog[key]) {
            return count === 1 ? singular : plural;
        }

        const pluralForm = this.pluralFunc(count);
        const translation = this.catalog[key];
        
        if (Array.isArray(translation)) {
            return translation[pluralForm] || translation[0];
        }
        
        return translation;
    }

    /**
     * Translate with context (for disambiguation)
     * @param {string} context - Context string
     * @param {string} msgid - The string to translate
     * @returns {string} - Translated string
     */
    pgettext(context, msgid) {
        const key = `${context}\x04${msgid}`;
        return this.gettext(key) || msgid;
    }

    /**
     * Interpolate variables into translated string
     * @param {string} msgid - The string to translate
     * @param {Object} params - Object with named parameters
     * @returns {string} - Translated and interpolated string
     * @example
     * i18n.interpolate(i18n.gettext("Hello, %(name)s!"), {name: "World"})
     * // Returns: "¡Hola, World!"
     */
    interpolate(fmt, params) {
        if (!params) return fmt;
        
        return fmt.replace(/%\((\w+)\)s/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Get current locale
     * @returns {string} - Current locale code
     */
    getLocale() {
        return this.locale;
    }

    /**
     * Check if translations are loaded
     * @returns {boolean} - True if loaded
     */
    isLoaded() {
        return this.loaded;
    }
}

// Create singleton instance
const i18n = new I18n();

// Convenient aliases
const gettext = (msgid) => i18n.gettext(msgid);
const ngettext = (singular, plural, count) => i18n.ngettext(singular, plural, count);
const pgettext = (context, msgid) => i18n.pgettext(context, msgid);
const interpolate = (fmt, params) => i18n.interpolate(fmt, params);

// Short aliases (like Django)
const _ = gettext;
const _n = ngettext;
const _p = pgettext;

// Export for ES6 modules
export { i18n, gettext, ngettext, pgettext, interpolate, _, _n, _p };
export default i18n;

