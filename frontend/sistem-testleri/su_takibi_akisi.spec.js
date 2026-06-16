import { test, expect } from '@playwright/test';

test('su takibi sayfasi giris gerektiriyor', async ({ page }) => {
  await page.goto('/nutrition');
  await page.waitForURL('http://localhost:5173/login');
});