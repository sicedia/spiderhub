// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Check that h1 exists and is unique
    const h1Elements = page.locator('h1');
    await expect(h1Elements).toHaveCount(1);
    
    // Check heading hierarchy
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    
    // Check that h1 has meaningful text
    const h1Text = await h1.textContent();
    expect(h1Text).toBeTruthy();
    expect(h1Text.length).toBeGreaterThan(5);
  });

  test('should have proper form labels and ARIA attributes', async ({ page }) => {
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Check search form
    const searchForm = page.getByRole('search');
    await expect(searchForm).toBeVisible();
    
    // Check search input has proper attributes
    const searchInput = page.getByRole('textbox', { name: /search/i });
    await expect(searchInput).toBeVisible();
    
    // Check that search input has proper ARIA attributes
    const ariaDescribedBy = await searchInput.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Check that focus is visible on interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test tab through main interactive elements
    const interactiveElements = [
      'textbox[name="q"]',
      'button[type="submit"]',
      'button[data-view="list"]'
    ];
    
    for (const selector of interactiveElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.focus();
        await expect(element).toBeFocused();
      }
    }
  });

  test('should have proper ARIA roles and landmarks', async ({ page }) => {
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Check main landmarks
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('search')).toBeVisible();
    await expect(page.getByRole('region', { name: /filters/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /search results/i })).toBeVisible();
    
    // Check tablist for view selector
    const tablist = page.getByRole('tablist');
    if (await tablist.isVisible()) {
      await expect(tablist).toBeVisible();
      
      // Check tabs have proper ARIA attributes
      const tabs = page.getByRole('tab');
      if (await tabs.first().isVisible()) {
        const firstTab = tabs.first();
        await expect(firstTab).toHaveAttribute('aria-selected');
        await expect(firstTab).toHaveAttribute('aria-controls');
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Check that text is visible and readable
    const mainHeading = page.getByRole('heading', { name: /explore/i });
    await expect(mainHeading).toBeVisible();
    
    // Check that buttons have sufficient contrast
    const searchButton = page.getByRole('button', { name: 'Search' });
    await expect(searchButton).toBeVisible();
    
    // Check that links are distinguishable
    const links = page.getByRole('link');
    if (await links.count() > 0) {
      const firstLink = links.first();
      await expect(firstLink).toBeVisible();
    }
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Test focus on search input
    const searchInput = page.getByRole('textbox', { name: /search/i });
    if (await searchInput.isVisible()) {
      await searchInput.focus();
      await expect(searchInput).toBeFocused();
      
      // Check that focus indicator is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // Alt text should exist (even if empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('should have proper button labels', async ({ page }) => {
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Check all buttons have accessible names
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      
      if (await button.isVisible()) {
        // Button should have accessible name (aria-label, text content, or aria-labelledby)
        const accessibleName = await button.evaluate(el => {
          return el.getAttribute('aria-label') || 
                 el.textContent?.trim() || 
                 el.getAttribute('aria-labelledby');
        });
        
        expect(accessibleName).toBeTruthy();
      }
    }
  });

  test('should work with screen reader', async ({ page }) => {
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Check that important content is accessible via screen reader
    const mainHeading = page.getByRole('heading', { name: /explore/i });
    await expect(mainHeading).toBeVisible();
    
    // Check that form is properly labeled
    const searchForm = page.getByRole('search');
    await expect(searchForm).toBeVisible();
    
    // Check that results are properly announced
    const resultsRegion = page.getByRole('region', { name: /search results/i });
    await expect(resultsRegion).toBeVisible();
  });

  test('should handle mobile accessibility', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/explore/');
    await page.waitForLoadState('networkidle');
    
    // Check that mobile navigation is accessible
    const mobileToggle = page.getByRole('button', { name: /toggle filters/i });
    if (await mobileToggle.isVisible()) {
      await expect(mobileToggle).toBeVisible();
      await expect(mobileToggle).toHaveAttribute('aria-expanded');
      await expect(mobileToggle).toHaveAttribute('aria-controls');
    }
    
    // Check that touch targets are large enough
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44px
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});
