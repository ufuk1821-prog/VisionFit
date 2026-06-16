import { test, expect } from '@playwright/test';

test('fotografli analiz sayfasi giris gerektiriyor', async ({ page }) => {
  await page.goto('/plank');
  await page.waitForURL('http://localhost:5173/login');
});