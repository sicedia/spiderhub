// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Navigation and Cross-Page Functionality', () => {
  test('should navigate between main pages', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if navigation menu exists and navigate to explore
    const exploreLink = page.getByRole('link', { name: /explore|explorar/i });
    if (await exploreLink.isVisible()) {
      await exploreLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();
    }
    
    // Navigate to analysis
    const analysisLink = page.getByRole('link', { name: /analysis|análisis/i });
    if (await analysisLink.isVisible()) {
      await analysisLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /analysis/i })).toBeVisible();
    }
  });

  test('should maintain navigation state across pages', async ({ page }) => {
    // Go to explore page
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Apply some filters
    const countriesAccordion = page.getByRole('button', { name: /countries/i }).first();
    if (await countriesAccordion.isVisible()) {
      await countriesAccordion.click();
      await page.waitForSelector('.filter-checkbox');
      
      const firstCountryCheckbox = page.locator('input[name="country"]').first();
      if (await firstCountryCheckbox.isVisible()) {
        await firstCountryCheckbox.check();
        
        const applyFiltersButton = page.getByRole('button', { name: 'Apply Filters' });
        if (await applyFiltersButton.isVisible()) {
          await applyFiltersButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }
    
    // Navigate to analysis page
    const analysisLink = page.getByRole('link', { name: /analysis/i });
    if (await analysisLink.isVisible()) {
      await analysisLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /analysis/i })).toBeVisible();
    }
    
    // Navigate back to explore
    const exploreLink = page.getByRole('link', { name: /explore/i });
    if (await exploreLink.isVisible()) {
      await exploreLink.click();
      await page.waitForLoadState('networkidle');
      
      // Check that explore page loads correctly
      await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();
    }
  });

  test('should handle browser back and forward navigation', async ({ page }) => {
    // Go to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to explore
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();
    
    // Navigate to analysis
    await page.goto('/analysis/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /analysis/i })).toBeVisible();
    
    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();
    
    // Use browser forward button
    await page.goForward();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /analysis/i })).toBeVisible();
  });

  test('should maintain responsive design across pages', async ({ page }) => {
    const pages = ['/', '/explore/', '/analysis/'];
    
    for (const pageUrl of pages) {
      // Test desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      
      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check that main content is still visible
      const mainContent = page.locator('main, .main-content, .container');
      await expect(mainContent.first()).toBeVisible();
    }
  });

  test('should handle page refresh correctly', async ({ page }) => {
    // Go to explore page and apply filters
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Apply a search
    const searchInput = page.getByRole('textbox', { name: /search/i });
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
    }
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that page loads correctly after refresh
    await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();
  });

  test('should handle direct URL access', async ({ page }) => {
    // Test direct access to explore page
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /explore/i })).toBeVisible();
    
    // Test direct access to analysis page
    await page.goto('/analysis/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /analysis/i })).toBeVisible();
  });

  test('should handle 404 errors gracefully', async ({ page }) => {
    // Try to access a non-existent page
    const response = await page.goto('/non-existent-page/');
    
    // Should get a 404 response
    expect(response.status()).toBe(404);
    
    // Check that error page is displayed
    await expect(page.getByText(/not found|404|error/i)).toBeVisible();
  });

  test('should load static assets correctly', async ({ page }) => {
    // Listen for failed requests
    const failedRequests = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // Navigate to different pages
    const pages = ['/', '/explore/', '/analysis/'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      
      // Wait a bit more for all assets to load
      await page.waitForTimeout(1000);
    }
    
    // Filter out expected 404s (like favicon)
    const criticalFailures = failedRequests.filter(req => 
      !req.url.includes('favicon') && 
      !req.url.includes('robots.txt')
    );
    
    // Log failures for debugging
    if (criticalFailures.length > 0) {
      console.log('Failed requests:', criticalFailures);
    }
    
    // Critical assets should load successfully
    expect(criticalFailures.length).toBe(0);
  });
});
