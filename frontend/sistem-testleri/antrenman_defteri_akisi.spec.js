import { test, expect } from '@playwright/test';

test('antrenman defteri sayfasi giris gerektiriyor', async ({ page }) => {
  await page.goto('/workout-notebook');
  await page.waitForURL('http://localhost:5173/login');
});