// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Explore Page - Search and Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore/');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should load explore page with all main elements', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Explore Digital Dialogues' })).toBeVisible();
    
    // Check search bar
    await expect(page.getByRole('search', { name: 'Search dialogues' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /search/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    
    // Check view selector tabs
    await expect(page.getByRole('tab', { name: 'List' })).toBeVisible();
    
    // Check filter sidebar
    await expect(page.getByRole('region', { name: /filters/i })).toBeVisible();
    await expect(page.getByText('Filters')).toBeVisible();
    
    // Check results container
    await expect(page.getByRole('region', { name: /search results/i })).toBeVisible();
  });

  test('should perform basic search', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: /search/i });
    const searchButton = page.getByRole('button', { name: 'Search' });
    
    // Type search query
    await searchInput.fill('digital transformation');
    await searchButton.click();
    
    // Wait for search results to load
    await page.waitForLoadState('networkidle');
    
    // Check that results are displayed
    await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Search results' })).toBeVisible();
  });

  test('should expand and collapse filter accordions', async ({ page }) => {
    // Test Document Type accordion
    const documentTypeAccordion = page.getByRole('button', { name: /document type/i }).first();
    await documentTypeAccordion.click();
    
    // Check that accordion content is visible
    await expect(page.locator('.accordion-content').first()).toBeVisible();
    
    // Click again to collapse
    await documentTypeAccordion.click();
    
    // Check that accordion content is hidden
    await expect(page.locator('.accordion-content').first()).not.toBeVisible();
  });

  test('should apply filters', async ({ page }) => {
    // Expand Countries filter
    const countriesAccordion = page.getByRole('button', { name: /countries/i }).first();
    await countriesAccordion.click();
    
    // Wait for countries to load
    await page.waitForSelector('.filter-checkbox');
    
    // Select a country filter (first available)
    const firstCountryCheckbox = page.locator('input[name="country"]').first();
    await firstCountryCheckbox.check();
    
    // Click Apply Filters button
    const applyFiltersButton = page.getByRole('button', { name: 'Apply Filters' });
    await applyFiltersButton.click();
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');
    
    // Check that active filters are displayed
    await expect(page.getByRole('region', { name: 'Active filters' })).toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // First apply some filters
    const countriesAccordion = page.getByRole('button', { name: /countries/i }).first();
    await countriesAccordion.click();
    await page.waitForSelector('.filter-checkbox');
    
    const firstCountryCheckbox = page.locator('input[name="country"]').first();
    await firstCountryCheckbox.check();
    
    const applyFiltersButton = page.getByRole('button', { name: 'Apply Filters' });
    await applyFiltersButton.click();
    await page.waitForLoadState('networkidle');
    
    // Now clear all filters
    const clearFiltersButton = page.getByRole('button', { name: 'Clear all' });
    await clearFiltersButton.click();
    
    // Check that filters are cleared
    await expect(firstCountryCheckbox).not.toBeChecked();
  });

  test('should handle date range filters', async ({ page }) => {
    // Expand Period filter
    const periodAccordion = page.getByRole('button', { name: /period/i }).first();
    await periodAccordion.click();
    
    // Check date inputs are present
    await expect(page.getByLabel('From:')).toBeVisible();
    await expect(page.getByLabel('Until:')).toBeVisible();
    
    // Test date presets
    const lastYearButton = page.getByRole('button', { name: 'Last year' });
    await lastYearButton.click();
    
    // Check that date inputs have values
    const fromDate = page.getByLabel('From:');
    const toDate = page.getByLabel('Until:');
    
    await expect(fromDate).toHaveValue(/.+/); // Should have some value
    await expect(toDate).toHaveValue(/.+/); // Should have some value
  });

  test('should search within filter options', async ({ page }) => {
    // Expand Countries filter
    const countriesAccordion = page.getByRole('button', { name: /countries/i }).first();
    await countriesAccordion.click();
    
    // Find the search input within countries section
    const countrySearchInput = page.locator('.filter-sidebar input[placeholder*="country"]');
    await expect(countrySearchInput).toBeVisible();
    
    // Type in the search
    await countrySearchInput.fill('Brazil');
    
    // Check that search is working (this would depend on implementation)
    await expect(countrySearchInput).toHaveValue('Brazil');
  });

  test('should display results count', async ({ page }) => {
    // Wait for initial results to load
    await page.waitForLoadState('networkidle');
    
    // Check that results count is displayed
    const resultsCount = page.locator('.results-count');
    await expect(resultsCount).toBeVisible();
    
    // Results count should contain a number
    await expect(resultsCount).toContainText(/\d+/);
  });

  test('should handle pagination', async ({ page }) => {
    // Wait for results to load
    await page.waitForLoadState('networkidle');
    
    // Check if pagination exists
    const pagination = page.getByRole('navigation', { name: /pagination/i });
    
    // If pagination exists, test it
    if (await pagination.isVisible()) {
      const nextButton = page.getByRole('button', { name: /next|siguiente/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForLoadState('networkidle');
        
        // Check that we're on a different page
        await expect(page.getByRole('list', { name: 'Search results' })).toBeVisible();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile filter toggle is visible
    const mobileFilterToggle = page.getByRole('button', { name: /toggle filters/i });
    await expect(mobileFilterToggle).toBeVisible();
    
    // Click to open mobile filters
    await mobileFilterToggle.click();
    
    // Check that filters are visible
    await expect(page.getByText('Filters')).toBeVisible();
  });
});
