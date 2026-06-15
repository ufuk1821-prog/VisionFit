import { test, expect } from '@playwright/test';

test('giris sayfasi acilir', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveURL(/login/);
});

test('kayit sayfasi acilir', async ({ page }) => {
  await page.goto('/register');
  await expect(page).toHaveURL(/register/);
});