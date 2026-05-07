import { test, expect } from '@playwright/test';

// This test assumes the dev server is running at http://localhost:5173
// It intercepts API calls to provide deterministic data for the approval flow.

test('S12 approval flow (happy path)', async ({ page }) => {
  // Mock list of requisitions
  await page.route('**/api/v1/storekeeper/stores/s12-requisitions/**', route => {
    const sample = [{
      id: 'req-1',
      s12Number: 'S12/2026/001',
      requestDate: '2026-05-07',
      requestingDepartment: 'Administration',
      requestedBy: 'Alice',
      purpose: 'Test purchase',
      status: 'Pending Approval',
      items: [{ id: 'item-1', itemCode: 'STA-001', description: 'Stapler', unit: 'pc', quantityRequested: 5, quantityApproved: 0, quantityIssued: 0 }],
      approvals: []
    }];
    route.fulfill({ status: 200, body: JSON.stringify(sample), headers: { 'Content-Type': 'application/json' } });
  });

  // Intercept approval POST
  await page.route('**/api/v1/storekeeper/stores/requisitions/req-1/approve/**', route => {
    route.fulfill({ status: 200, body: JSON.stringify({ ok: true, approval_id: 1, status: 'Approved' }), headers: { 'Content-Type': 'application/json' } });
  });

  await page.goto('http://localhost:5173/stores/s12');
  await page.waitForSelector('text=S12 - Stores Requisition & Issue Voucher');

  // Click Review on the first requisition row
  await page.click('text=S12/2026/001');
  // Open Review modal via Review button
  await page.click('button:has-text("Review")');
  await page.waitForSelector('text=Review Requisition - S12/2026/001');

  // Click Approve
  await page.click('button:has-text("Approve")');

  // Confirm success notification appears
  await expect(page.locator('text=Requisition approved')).toBeVisible({ timeout: 3000 });
});
