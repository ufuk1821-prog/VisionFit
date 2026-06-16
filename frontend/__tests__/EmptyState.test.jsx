import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EmptyState from '../components/EmptyState';

describe('EmptyState', () => {
  it('başlık ve açıklama gösterir', () => {
    render(<EmptyState type="camera" title="Kayıt Yok" description="Henüz kayıt yok." />);
    expect(screen.getByText('Kayıt Yok')).toBeInTheDocument();
    expect(screen.getByText('Henüz kayıt yok.')).toBeInTheDocument();
  });

  it('açıklama verilmezse göstermez', () => {
    render(<EmptyState type="camera" title="Kayıt Yok" />);
    expect(screen.getByText('Kayıt Yok')).toBeInTheDocument();
    expect(screen.queryByText('Henüz kayıt yok.')).not.toBeInTheDocument();
  });

  it('farklı type değerleri için render eder', () => {
    const tipler = ['camera', 'plate', 'footprint', 'notebook'];
    tipler.forEach((tip) => {
      const { unmount } = render(<EmptyState type={tip} title="Test" />);
      expect(screen.getByText('Test')).toBeInTheDocument();
      unmount();
    });
  });

  it('bilinmeyen type için de render eder', () => {
    render(<EmptyState type="bilinmeyen" title="Fallback Test" />);
    expect(screen.getByText('Fallback Test')).toBeInTheDocument();
  });
});