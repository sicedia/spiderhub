// Test data setup helpers for E2E tests
// This file contains utilities to set up test data for Playwright tests

/**
 * Setup test data for explore page tests
 */
export async function setupExploreTestData(page) {
  // Navigate to admin or use API endpoints to create test data
  // This would typically involve:
  // 1. Creating test documents
  // 2. Setting up test filters
  // 3. Ensuring search functionality has data to work with
  
  console.log('Setting up test data for explore page...');
  
  // Example: Navigate to admin and create test data
  // await page.goto('/admin/');
  // ... create test data via admin interface
}

/**
 * Setup test data for analysis page tests
 */
export async function setupAnalysisTestData(page) {
  // Setup data needed for analysis dashboard
  // This might include:
  // 1. Documents with various attributes
  // 2. Countries and actors
  // 3. Themes and SDG alignments
  
  console.log('Setting up test data for analysis page...');
  
  // Example: Ensure we have data for charts
  // await page.goto('/admin/apps/documents/document/');
  // ... create sample documents
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestData(page) {
  console.log('Cleaning up test data...');
  
  // Remove test data created during tests
  // This ensures tests don't interfere with each other
}

/**
 * Wait for specific elements to be ready
 */
export async function waitForPageReady(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Additional wait for dynamic content
}

/**
 * Check if Django server is running
 */
export async function checkDjangoServer(page) {
  try {
    await page.goto('/', { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('Django server not running:', error);
    return false;
  }
}
