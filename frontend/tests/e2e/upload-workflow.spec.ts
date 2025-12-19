import { test, expect } from '@playwright/test';

test.describe('Upload Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
  });

  test('should complete upload workflow', async ({ page }) => {
    // Check if the main page loads
    await expect(page).toHaveTitle(/Delhi Waste Management/);
    
    // Navigate to upload page
    await page.click('[data-testid="upload-link"]');
    
    // Wait for upload page to load
    await expect(page.locator('[data-testid="upload-container"]')).toBeVisible();
    
    // Check if file upload area is present
    await expect(page.locator('[data-testid="file-upload-area"]')).toBeVisible();
    
    // Simulate file upload (using a mock file)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="file-upload-input"]');
    const fileChooser = await fileChooserPromise;
    
    // Create a mock file for testing
    const buffer = Buffer.from('mock file content for testing');
    await fileChooser.setFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: buffer,
    });
    
    // Check if upload progress is shown
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    
    // Wait for upload completion
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });
    
    // Check if result preview is available
    await expect(page.locator('[data-testid="result-preview"]')).toBeVisible();
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Navigate to upload page
    await page.click('[data-testid="upload-link"]');
    
    // Try to upload an invalid file type
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="file-upload-input"]');
    const fileChooser = await fileChooserPromise;
    
    const buffer = Buffer.from('invalid content');
    await fileChooser.setFiles({
      name: 'invalid-file.txt',
      mimeType: 'text/plain',
      buffer: buffer,
    });
    
    // Check if error message is displayed
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
    
    // Check if retry option is available
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should navigate between pages correctly', async ({ page }) => {
    // Test navigation to different sections
    const navItems = [
      { selector: '[data-testid="dashboard-link"]', expectedUrl: '/' },
      { selector: '[data-testid="waste-analysis-link"]', expectedUrl: '/waste-analysis' },
      { selector: '[data-testid="contamination-detection-link"]', expectedUrl: '/contamination-detection' },
      { selector: '[data-testid="upload-link"]', expectedUrl: '/upload' },
    ];

    for (const item of navItems) {
      await page.click(item.selector);
      await expect(page).toHaveURL(new RegExp(item.expectedUrl));
      
      // Check if page loads without errors
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display system status correctly', async ({ page }) => {
    // Check if status indicators are present on dashboard
    await expect(page.locator('[data-testid="system-status"]')).toBeVisible();
    
    // Check if AI service status is displayed
    await expect(page.locator('[data-testid="ai-service-status"]')).toBeVisible();
    
    // Check if blockchain status is displayed
    await expect(page.locator('[data-testid="blockchain-status"]')).toBeVisible();
    
    // Check if database status is displayed
    await expect(page.locator('[data-testid="database-status"]')).toBeVisible();
  });

  test('should handle authentication flow', async ({ page }) => {
    // Try to access protected route
    await page.goto('http://localhost:5173/admin');
    
    // Should redirect to login or show login form
    await expect(page).toHaveURL(/login/);
    
    // Fill login form (with test credentials)
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard or intended page
    await expect(page).toHaveURL(/dashboard/);
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:5173');
    
    // Check if mobile navigation works
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
    
    // Check if upload works on mobile
    await page.click('[data-testid="upload-link-mobile"]');
    await expect(page.locator('[data-testid="mobile-upload-area"]')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should be accessible', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Check for basic accessibility requirements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    
    // Check if navigation is keyboard accessible
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });
});