// Global setup for Playwright E2E tests
// This file runs once before all tests

const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting global setup for E2E tests...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Check if Django server is running
    console.log('📡 Checking Django server...');
    await page.goto('http://localhost:8000/', { timeout: 10000 });
    console.log('✅ Django server is running');
    
    // Optional: Set up initial test data
    // This could involve:
    // 1. Creating test users
    // 2. Loading fixtures
    // 3. Setting up test documents
    
    console.log('📊 Setting up test data...');
    // Add any global test data setup here
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
