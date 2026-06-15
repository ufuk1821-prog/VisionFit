import { test, expect } from '@playwright/test';

test('kullanici kaydi ve girisi uctan uca calisir', async ({ page }) => {
  const eposta = `pw_test_${Date.now()}@test.com`;
  const sifre = 'PwTest123!';

  await page.goto('/register');
  await page.locator('input[type="text"]').nth(0).fill('Playwright');
  await page.locator('input[type="text"]').nth(1).fill('Test');
  await page.locator('input[type="email"]').fill(eposta);
  await page.locator('input[type="password"]').nth(0).fill(sifre);
  await page.locator('input[type="password"]').nth(1).fill(sifre);
  await page.getByRole('button', { name: 'Hesap Oluştur' }).click();

  await expect(page.getByText('E-postanı Kontrol Et')).toBeVisible();

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(eposta);
  await page.locator('input[type="password"]').fill(sifre);
  await page.getByRole('button', { name: 'Giriş Yap' }).click();

  await page.waitForURL('http://localhost:5173/');
});