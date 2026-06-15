import { test, expect } from '@playwright/test';

test('diyet hesaplama akisi uctan uca calisir', async ({ page, request }) => {
  const eposta = `pw_diet_${Date.now()}@test.com`;
  const sifre = 'PwTest123!';

  await request.post('http://localhost:8000/api/auth/register', {
    data: { ad: 'Playwright', soyad: 'Diyet', email: eposta, sifre: sifre },
  });
  const girisYaniti = await request.post('http://localhost:8000/api/auth/login', {
    data: { email: eposta, sifre: sifre },
  });
  const { token } = await girisYaniti.json();

  await page.goto('/login');
  await page.evaluate((kullanici_token) => localStorage.setItem('token', kullanici_token), token);
  await page.goto('/diet');

  await page.locator('input[type="number"]').nth(0).fill('180');
  await page.locator('input[type="number"]').nth(1).fill('80');
  await page.locator('input[type="number"]').nth(2).fill('25');
  await page.locator('select').nth(0).selectOption('Erkek');
  await page.locator('select').nth(1).selectOption('orta_hareketli');
  await page.locator('select').nth(2).selectOption('kilo_verme');
  await page.getByRole('button', { name: 'Diyet Önerisi Al' }).click();

  await expect(page.getByText('Vücut Kitle Endeksi')).toBeVisible({ timeout: 15000 });
});