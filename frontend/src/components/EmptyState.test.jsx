import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('başlık ve açıklamayı gösterir', () => {
    render(<EmptyState type="camera" title="Henüz kayıt yok" description="Açıklama metni" />);
    expect(screen.getByText('Henüz kayıt yok')).toBeInTheDocument();
    expect(screen.getByText('Açıklama metni')).toBeInTheDocument();
  });

  it('açıklama verilmezse göstermez', () => {
    render(<EmptyState type="camera" title="Başlık" />);
    expect(screen.getByText('Başlık')).toBeInTheDocument();
    expect(screen.queryByText('Açıklama metni')).not.toBeInTheDocument();
  });

  it('tanınmayan tip için varsayılan illüstrasyonu kullanır', () => {
    render(<EmptyState type="bilinmeyen" title="Başlık" />);
    expect(screen.getByText('Başlık')).toBeInTheDocument();
  });
});