/**
 * Layout Fix Utility
 * Ensures correct DOM structure for explore page layout
 * Fixes issue where .explore-results gets moved outside .explore-content
 */

(function() {
  'use strict';
  
  function fixExploreLayout() {
    const exploreContent = document.querySelector('.explore-content');
    const exploreResults = document.querySelector('.explore-results');
    
    if (exploreContent && exploreResults && !exploreContent.contains(exploreResults)) {
      exploreContent.appendChild(exploreResults);
      console.log('✅ Fixed explore layout: moved .explore-results inside .explore-content');
      
      // Trigger a reflow to ensure layout updates
      exploreContent.offsetHeight;
    }
  }
  
  function initLayoutFix() {
    // Run immediately if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixExploreLayout);
    } else {
      fixExploreLayout();
    }
    
    // Also run after a short delay to catch any dynamic changes
    setTimeout(fixExploreLayout, 100);
    setTimeout(fixExploreLayout, 500);
  }
  
  // Initialize the layout fix
  initLayoutFix();
  
  // Export for manual use if needed
  window.fixExploreLayout = fixExploreLayout;
  
})();
