/**
 * Theme Initialization Script
 * Applies saved theme immediately on page load to prevent FOUC
 * Must be loaded synchronously (no defer/async) and early in <head>
 */
(function() {
  try {
    var theme = localStorage.getItem('spiderhub-theme');
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  } catch (e) {
    // localStorage not available, ignore
  }
})();

