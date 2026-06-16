import { describe, it, expect } from 'vitest';

function bmiHesapla(kilo, boy) {
  const boyMetre = boy / 100;
  return parseFloat((kilo / (boyMetre * boyMetre)).toFixed(1));
}

function bmiKategori(bmi) {
  if (bmi < 18.5) return 'Zayıf';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Kilolu';
  return 'Obez';
}

function skorRengi(skor) {
  if (skor >= 75) return 'var(--accent)';
  if (skor >= 50) return 'var(--accent-2)';
  return 'var(--danger)';
}

function tarihFormat(tarihStr) {
  const d = new Date(tarihStr);
  return d.toLocaleString('tr-TR');
}

describe('BMI Hesaplama', () => {
  it('normal BMI doğru hesaplar', () => {
    expect(bmiHesapla(70, 175)).toBe(22.9);
  });

  it('zayıf kategorisi', () => {
    expect(bmiKategori(17.0)).toBe('Zayıf');
  });

  it('normal kategorisi', () => {
    expect(bmiKategori(22.5)).toBe('Normal');
  });

  it('kilolu kategorisi', () => {
    expect(bmiKategori(27.0)).toBe('Kilolu');
  });

  it('obez kategorisi', () => {
    expect(bmiKategori(32.0)).toBe('Obez');
  });

  it('sınır değer 18.5 normal kategorisinde', () => {
    expect(bmiKategori(18.5)).toBe('Normal');
  });

  it('sınır değer 25.0 kilolu kategorisinde', () => {
    expect(bmiKategori(25.0)).toBe('Kilolu');
  });
});

describe('Skor Rengi', () => {
  it('75 ve üzeri accent rengi', () => {
    expect(skorRengi(75)).toBe('var(--accent)');
    expect(skorRengi(100)).toBe('var(--accent)');
  });

  it('50-74 arası accent-2 rengi', () => {
    expect(skorRengi(50)).toBe('var(--accent-2)');
    expect(skorRengi(74)).toBe('var(--accent-2)');
  });

  it('50 altı danger rengi', () => {
    expect(skorRengi(49)).toBe('var(--danger)');
    expect(skorRengi(0)).toBe('var(--danger)');
  });
});

describe('Tarih Format', () => {
  it('geçerli tarih string formatlanır', () => {
    const sonuc = tarihFormat('2026-01-15T10:30:00');
    expect(typeof sonuc).toBe('string');
    expect(sonuc.length).toBeGreaterThan(0);
  });
});