import { describe, it, expect } from 'vitest';

function boyDogrula(val) {
  const num = parseFloat(val);
  if (val === '') return '';
  if (isNaN(num) || num < 50 || num > 300) return 'Boy 50 ile 300 cm arasında olmalıdır.';
  return '';
}

function kiloDogrula(val) {
  const num = parseFloat(val);
  if (val === '') return '';
  if (isNaN(num) || num < 10 || num > 500) return 'Kilo 10 ile 500 kg arasında olmalıdır.';
  return '';
}

function yasDogrula(val) {
  const num = parseInt(val);
  if (val === '') return '';
  if (isNaN(num) || num < 10 || num > 120) return 'Yaş 10 ile 120 arasında olmalıdır.';
  return '';
}

function sifreDogrula(sifre) {
  if (sifre.length < 8) return 'Şifre en az 8 karakter olmalıdır.';
  if (!/[A-Z]/.test(sifre)) return 'Şifre en az bir büyük harf içermelidir.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(sifre)) return 'Şifre en az bir özel karakter içermelidir.';
  return '';
}

describe('Boy Doğrulama', () => {
  it('geçerli boy için hata yok', () => {
    expect(boyDogrula('175')).toBe('');
  });

  it('boş değer için hata yok', () => {
    expect(boyDogrula('')).toBe('');
  });

  it('çok kısa boy hata verir', () => {
    expect(boyDogrula('40')).toBeTruthy();
  });

  it('çok uzun boy hata verir', () => {
    expect(boyDogrula('310')).toBeTruthy();
  });

  it('sınır değer 50 geçerli', () => {
    expect(boyDogrula('50')).toBe('');
  });

  it('sınır değer 300 geçerli', () => {
    expect(boyDogrula('300')).toBe('');
  });
});

describe('Kilo Doğrulama', () => {
  it('geçerli kilo için hata yok', () => {
    expect(kiloDogrula('70')).toBe('');
  });

  it('çok düşük kilo hata verir', () => {
    expect(kiloDogrula('5')).toBeTruthy();
  });
});

describe('Yaş Doğrulama', () => {
  it('geçerli yaş için hata yok', () => {
    expect(yasDogrula('25')).toBe('');
  });

  it('çok düşük yaş hata verir', () => {
    expect(yasDogrula('5')).toBeTruthy();
  });

  it('çok yüksek yaş hata verir', () => {
    expect(yasDogrula('150')).toBeTruthy();
  });
});

describe('Şifre Doğrulama', () => {
  it('geçerli şifre için hata yok', () => {
    expect(sifreDogrula('Test1234!')).toBe('');
  });

  it('çok kısa şifre hata verir', () => {
    expect(sifreDogrula('Ab1!')).toBeTruthy();
  });

  it('büyük harf olmayan şifre hata verir', () => {
    expect(sifreDogrula('test1234!')).toBeTruthy();
  });

  it('özel karakter olmayan şifre hata verir', () => {
    expect(sifreDogrula('Test12345')).toBeTruthy();
  });
});