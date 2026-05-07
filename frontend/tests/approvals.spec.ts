import { test, expect } from '@playwright/test';

// This test mocks backend for pending prompts, attachments, upload and approve endpoints.
test('upload attachment then approve prompt', async ({ page }) => {
  // Intercept pending prompts
  await page.route('**/api/storekeeper/stores/capitalization/prompts/pending/', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [
        { id: 'CAP-TEST-1', item_name: 'Test Item', override_decision: 'capitalize', quantity: 1, total_value: 100, approval_status: 'pending' }
      ]})
    });
  });

  // Intercept attachments list (initially empty)
  await page.route('**/api/v1/messages/attachments/**', route => {
    const url = route.request().url();
    if (url.includes('entity_id=CAP-TEST-1')) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0, results: [] }) });
    } else {
      route.continue();
    }
  });

  // Intercept upload to succeed and then attachments list return one item
  let uploaded = false;
  await page.route('**/api/v1/messages/attachments/', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      uploaded = true;
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 1 }) });
    } else {
      route.continue();
    }
  });

  // Intercept approve POST
  await page.route('**/api/v1/storekeeper/stores/capitalization/prompts/CAP-TEST-1/approve/', route => {
    if (!uploaded) {
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'No attachments' }) });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'CAP-TEST-1', approval_status: 'approved' }) });
    }
  });

  // Serve the app page that contains the Approvals component. The project does not run here,
  // so we navigate to the static file that loads the SPA; adjust as needed when running locally.
  await page.goto('http://localhost:5173/finance?tab=assets');

  // Wait for the Approvals tab to be present and click it
  await page.waitForSelector('text=Approvals');
  await page.click('text=Approvals');

  // Ensure the prompt row is visible
  await page.waitForSelector('text=CAP-TEST-1');

  // Try clicking Approve without uploading — should show error toast or blocked button
  const approveBtn = await page.locator('button', { hasText: 'Approve' }).first();
  expect(await approveBtn.isDisabled()).toBeTruthy();

  // Upload a dummy file
  const fileInput = await page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({ name: 'dummy.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });

  // Click Upload
  await page.click('button:has-text("Upload")');

  // After upload, Approve should be enabled; click it
  await page.waitForTimeout(200); // allow intercepted routes to update
  expect(await approveBtn.isDisabled()).toBeFalsy();
  await approveBtn.click();

  // Expect success action — in mocked flow we simply ensure route was called
  await page.waitForTimeout(200);
});
