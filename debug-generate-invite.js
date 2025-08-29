// Quick Playwright script to test generate invite button
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Reset test data
  await page.request.post('http://localhost:3000/api/test/reset');
  await page.request.post('http://localhost:3000/api/test/freeze-time', {
    data: { nowISOString: '2024-02-01T10:00:00Z' }
  });
  await page.request.post('http://localhost:3000/api/test/make-week', {
    data: { weekNo: 1, games: 2 }
  });

  // Go to admin page
  await page.goto('http://localhost:3000/l/2024-test-survivor/admin');
  
  // Wait for page to load
  await page.waitForSelector('[data-cy="admin-generate-invite"]', { timeout: 15000 });
  
  // Click generate button
  console.log('Clicking generate invite button...');
  await page.click('[data-cy="admin-generate-invite"]');
  
  // Wait a moment for the API call
  await page.waitForTimeout(2000);
  
  console.log('Done - check dev server logs for debug output');
  
  await browser.close();
})();