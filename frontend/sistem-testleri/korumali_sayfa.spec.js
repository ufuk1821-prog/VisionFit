import { test, expect } from '@playwright/test';

test('giris yapmadan korumali sayfaya erisim login a yonlendirir', async ({ page }) => {
  await page.goto('/diet');
  await page.waitForURL('http://localhost:5173/login');
});