#!/usr/bin/env node

/**
 * End-to-End Test Script for Mintari App
 * Tests the complete flow: Login → Upload → Generate → Save → Mint
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  timeout: 30000,
  headless: false, // Set to true for CI/CD
  viewport: { width: 1280, height: 720 },
  testImage: path.join(__dirname, '../test-assets/sample-image.jpg'),
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  startTime: Date.now(),
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(name, passed, error = null) {
  if (passed) {
    testResults.passed++;
    log(`PASS: ${name}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push({ name, error });
    log(`FAIL: ${name} - ${error}`, 'error');
  }
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function checkConsoleErrors(page) {
  const errors = await page.evaluate(() => {
    return window.consoleErrors || [];
  });
  return errors;
}

// Test functions
async function testAppLoads(page) {
  log('Testing app loads without errors...');
  
  try {
    await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle0' });
    
    // Check for console errors
    const consoleErrors = await checkConsoleErrors(page);
    if (consoleErrors.length > 0) {
      recordTest('App loads without console errors', false, `Console errors: ${consoleErrors.join(', ')}`);
      return false;
    }
    
    // Check if main content loads
    const mainContent = await waitForElement(page, 'main, [data-testid="main-content"]');
    if (!mainContent) {
      recordTest('App loads without console errors', false, 'Main content not found');
      return false;
    }
    
    recordTest('App loads without console errors', true);
    return true;
  } catch (error) {
    recordTest('App loads without console errors', false, error.message);
    return false;
  }
}

async function testSessionPersistence(page) {
  log('Testing session persistence...');
  
  try {
    // Check if user is logged in (demo user should auto-login)
    const userElement = await waitForElement(page, '[data-testid="user-menu"], .user-avatar, .user-info');
    if (!userElement) {
      recordTest('Session persistence', false, 'User not logged in');
      return false;
    }
    
    // Refresh page
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Check if user is still logged in
    const userElementAfterRefresh = await waitForElement(page, '[data-testid="user-menu"], .user-avatar, .user-info');
    if (!userElementAfterRefresh) {
      recordTest('Session persistence', false, 'User session lost after refresh');
      return false;
    }
    
    recordTest('Session persistence', true);
    return true;
  } catch (error) {
    recordTest('Session persistence', false, error.message);
    return false;
  }
}

async function testUploadFlow(page) {
  log('Testing upload flow...');
  
  try {
    // Navigate to upload page
    await page.click('a[href="/upload"], [data-testid="upload-button"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Check if upload page loads
    const uploadArea = await waitForElement(page, '[data-testid="upload-area"], .upload-zone, input[type="file"]');
    if (!uploadArea) {
      recordTest('Upload page loads', false, 'Upload area not found');
      return false;
    }
    
    // Test file upload (if test image exists)
    if (fs.existsSync(TEST_CONFIG.testImage)) {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.uploadFile(TEST_CONFIG.testImage);
        
        // Wait for upload to complete
        await page.waitForTimeout(2000);
        
        // Check for upload success
        const uploadSuccess = await waitForElement(page, '[data-testid="upload-success"], .upload-success');
        if (uploadSuccess) {
          recordTest('File upload works', true);
        } else {
          recordTest('File upload works', false, 'Upload success indicator not found');
        }
      }
    } else {
      log('Test image not found, skipping file upload test', 'info');
    }
    
    recordTest('Upload page loads', true);
    return true;
  } catch (error) {
    recordTest('Upload flow', false, error.message);
    return false;
  }
}

async function testGenerationFlow(page) {
  log('Testing generation flow...');
  
  try {
    // Look for generate button
    const generateButton = await waitForElement(page, '[data-testid="generate-button"], button:has-text("Generate")');
    if (!generateButton) {
      recordTest('Generation flow', false, 'Generate button not found');
      return false;
    }
    
    // Click generate button
    await page.click('[data-testid="generate-button"], button:has-text("Generate")');
    
    // Wait for generation to start
    await page.waitForTimeout(1000);
    
    // Check for loading state
    const loadingState = await waitForElement(page, '[data-testid="generation-loading"], .loading, .generating');
    if (!loadingState) {
      recordTest('Generation flow', false, 'Loading state not found');
      return false;
    }
    
    // Wait for generation to complete (with timeout)
    const generationComplete = await waitForElement(page, '[data-testid="generation-complete"], .generation-complete', 30000);
    if (!generationComplete) {
      recordTest('Generation flow', false, 'Generation did not complete within timeout');
      return false;
    }
    
    recordTest('Generation flow', true);
    return true;
  } catch (error) {
    recordTest('Generation flow', false, error.message);
    return false;
  }
}

async function testCollectionSave(page) {
  log('Testing collection save...');
  
  try {
    // Look for save to collection button
    const saveButton = await waitForElement(page, '[data-testid="save-button"], button:has-text("Save")');
    if (!saveButton) {
      recordTest('Collection save', false, 'Save button not found');
      return false;
    }
    
    // Click save button
    await page.click('[data-testid="save-button"], button:has-text("Save")');
    
    // Wait for save modal or success
    await page.waitForTimeout(1000);
    
    // Check for save success
    const saveSuccess = await waitForElement(page, '[data-testid="save-success"], .save-success, .toast-success');
    if (!saveSuccess) {
      recordTest('Collection save', false, 'Save success indicator not found');
      return false;
    }
    
    recordTest('Collection save', true);
    return true;
  } catch (error) {
    recordTest('Collection save', false, error.message);
    return false;
  }
}

async function testMintingFlow(page) {
  log('Testing minting flow...');
  
  try {
    // Look for mint button
    const mintButton = await waitForElement(page, '[data-testid="mint-button"], button:has-text("Mint")');
    if (!mintButton) {
      recordTest('Minting flow', false, 'Mint button not found');
      return false;
    }
    
    // Click mint button
    await page.click('[data-testid="mint-button"], button:has-text("Mint")');
    
    // Wait for wallet connection modal
    const walletModal = await waitForElement(page, '[data-testid="wallet-modal"], .wallet-modal, .connect-wallet');
    if (!walletModal) {
      recordTest('Minting flow', false, 'Wallet connection modal not found');
      return false;
    }
    
    // Test wallet connection (mock)
    const connectButton = await waitForElement(page, '[data-testid="connect-wallet"], button:has-text("Connect")');
    if (connectButton) {
      await page.click('[data-testid="connect-wallet"], button:has-text("Connect")');
      await page.waitForTimeout(2000);
    }
    
    recordTest('Minting flow', true);
    return true;
  } catch (error) {
    recordTest('Minting flow', false, error.message);
    return false;
  }
}

async function testPublicShareLink(page) {
  log('Testing public share link...');
  
  try {
    // Navigate to collections page
    await page.click('a[href="/collection"], [data-testid="collections-link"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Look for public collection
    const publicCollection = await waitForElement(page, '[data-testid="public-collection"], .public-collection');
    if (!publicCollection) {
      recordTest('Public share link', false, 'Public collection not found');
      return false;
    }
    
    // Get public link
    await page.click('[data-testid="share-button"], button:has-text("Share")');
    await page.waitForTimeout(1000);
    
    // Check for share modal
    const shareModal = await waitForElement(page, '[data-testid="share-modal"], .share-modal');
    if (!shareModal) {
      recordTest('Public share link', false, 'Share modal not found');
      return false;
    }
    
    recordTest('Public share link', true);
    return true;
  } catch (error) {
    recordTest('Public share link', false, error.message);
    return false;
  }
}

async function testPWAInstallPrompt(page) {
  log('Testing PWA install prompt...');
  
  try {
    // Check if install prompt appears
    const installPrompt = await waitForElement(page, '[data-testid="install-prompt"], .install-prompt', 5000);
    if (!installPrompt) {
      recordTest('PWA install prompt', false, 'Install prompt not found');
      return false;
    }
    
    recordTest('PWA install prompt', true);
    return true;
  } catch (error) {
    recordTest('PWA install prompt', false, error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('Starting Mintari App End-to-End Tests...');
  
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport(TEST_CONFIG.viewport);
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      if (!page.consoleErrors) page.consoleErrors = [];
      page.consoleErrors.push(msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    if (!page.consoleErrors) page.consoleErrors = [];
    page.consoleErrors.push(`Page Error: ${error.message}`);
  });
  
  try {
    // Run all tests
    await testAppLoads(page);
    await testSessionPersistence(page);
    await testUploadFlow(page);
    await testGenerationFlow(page);
    await testCollectionSave(page);
    await testMintingFlow(page);
    await testPublicShareLink(page);
    await testPWAInstallPrompt(page);
    
  } catch (error) {
    log(`Test runner error: ${error.message}`, 'error');
  } finally {
    await browser.close();
  }
  
  // Generate test report
  const endTime = Date.now();
  const duration = (endTime - testResults.startTime) / 1000;
  
  log('\n=== TEST RESULTS ===');
  log(`Total Tests: ${testResults.passed + testResults.failed}`);
  log(`Passed: ${testResults.passed}`);
  log(`Failed: ${testResults.failed}`);
  log(`Duration: ${duration}s`);
  
  if (testResults.errors.length > 0) {
    log('\n=== FAILED TESTS ===');
    testResults.errors.forEach(error => {
      log(`${error.name}: ${error.error}`, 'error');
    });
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runTests, testResults };
