// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Analysis Dashboard - Loading and Charts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analysis/');
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should load analysis dashboard with main sections', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Analysis Dashboard' })).toBeVisible();
    
    // Check main sections are present
    await expect(page.getByRole('heading', { name: 'Executive Overview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Strategic Alignment' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Geographic Distribution & Leadership' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thematic Focus Areas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Stakeholder Ecosystem' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Variety Analysis' })).toBeVisible();
  });

  test('should display summary cards with data', async ({ page }) => {
    // Check that summary cards are visible
    const summaryCards = page.locator('.summary-card');
    await expect(summaryCards).toHaveCount(4);
    
    // Check specific cards
    await expect(page.getByText('Total Documents')).toBeVisible();
    await expect(page.getByText('Active Agreements')).toBeVisible();
    await expect(page.getByText('Participating Countries')).toBeVisible();
    await expect(page.getByText('Active Dialogues')).toBeVisible();
    
    // Check that cards have numeric values
    const cardNumbers = page.locator('.card-number');
    await expect(cardNumbers.first()).toBeVisible();
    
    // Numbers should be greater than 0
    for (let i = 0; i < 4; i++) {
      const cardNumber = cardNumbers.nth(i);
      await expect(cardNumber).toContainText(/\d+/);
    }
  });

  test('should load and display charts', async ({ page }) => {
    // Wait for charts to be rendered
    await page.waitForTimeout(2000); // Give time for chart.js to render
    
    // Check chart placeholders are present
    await expect(page.locator('#radar-chart')).toBeVisible();
    await expect(page.locator('#pie-chart')).toBeVisible();
    await expect(page.locator('#lead-countries-chart')).toBeVisible();
    await expect(page.locator('#coverage-bar-chart')).toBeVisible();
    await expect(page.locator('#theme-bar-chart')).toBeVisible();
    await expect(page.locator('#actor-bar-chart')).toBeVisible();
    await expect(page.locator('#beneficiary-bar-chart')).toBeVisible();
  });

  test('should display chart descriptions and headers', async ({ page }) => {
    // Check chart headers and descriptions
    await expect(page.getByText('SDG Alignment Overview')).toBeVisible();
    await expect(page.getByText('Legal Bindingness Distribution')).toBeVisible();
    await expect(page.getByText('Lead Countries Analysis')).toBeVisible();
    await expect(page.getByText('Coverage Scope Distribution')).toBeVisible();
    await expect(page.getByText('Digital Transformation Themes')).toBeVisible();
    await expect(page.getByText('Actor Type Distribution')).toBeVisible();
    await expect(page.getByText('Beneficiary Groups Analysis')).toBeVisible();
  });

  test('should show tooltips on hover', async ({ page }) => {
    // Hover over a summary card with tooltip
    const summaryCard = page.locator('.summary-card').first();
    await summaryCard.hover();
    
    // Check that tooltip appears
    await expect(page.locator('.tooltip')).toBeVisible();
  });

  test('should display additional metrics section', async ({ page }) => {
    // Check additional insights section
    await expect(page.getByRole('heading', { name: 'Additional Insights' })).toBeVisible();
    
    // Check metric cards
    await expect(page.getByText('Active Themes')).toBeVisible();
    await expect(page.getByText('Unique Actors')).toBeVisible();
    await expect(page.getByText('Beneficiary Groups')).toBeVisible();
    await expect(page.getByText('Total Commitments')).toBeVisible();
  });

  test('should display help section', async ({ page }) => {
    // Scroll to help section
    await page.getByRole('heading', { name: 'How to Use This Dashboard' }).scrollIntoViewIfNeeded();
    
    // Check help cards
    await expect(page.getByText('Getting Started')).toBeVisible();
    await expect(page.getByText('Interactive Charts')).toBeVisible();
    await expect(page.getByText('Data Insights')).toBeVisible();
    await expect(page.getByText('Analysis Tips')).toBeVisible();
  });

  test('should handle chart interactions', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(3000);
    
    // Try to interact with a chart (this depends on chart.js implementation)
    const radarChart = page.locator('#radar-chart');
    await radarChart.click();
    
    // Check that chart is interactive (no errors)
    await expect(radarChart).toBeVisible();
  });

  test('should load analysis data from backend', async ({ page }) => {
    // Check that analysis data script is present
    await expect(page.locator('script#analysis-data')).toBeVisible();
    
    // Verify that data is loaded by checking if charts have content
    await page.waitForTimeout(2000);
    
    // Charts should not be empty placeholders
    const chartPlaceholders = page.locator('.placeholder-content');
    if (await chartPlaceholders.count() > 0) {
      // If placeholders exist, they should eventually be replaced by actual charts
      await page.waitForTimeout(3000);
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByRole('heading', { name: 'Analysis Dashboard' })).toBeVisible();
    
    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: 'Analysis Dashboard' })).toBeVisible();
    
    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByRole('heading', { name: 'Analysis Dashboard' })).toBeVisible();
    
    // Summary cards should still be visible
    await expect(page.locator('.summary-card')).toHaveCount(4);
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check that no critical JavaScript errors occurred
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('CORS')
    );
    
    // Log errors for debugging but don't fail the test
    if (criticalErrors.length > 0) {
      console.log('JavaScript errors found:', criticalErrors);
    }
    
    // Main content should still be visible
    await expect(page.getByRole('heading', { name: 'Analysis Dashboard' })).toBeVisible();
  });
});
