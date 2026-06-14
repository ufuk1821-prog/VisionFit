import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useCountUp from './useCountUp';

describe('useCountUp', () => {
  it('başlangıçta sıfırdan başlar', () => {
    const { result } = renderHook(() => useCountUp(100, 200));
    expect(result.current).toBe(0);
  });

  it('hedef değere ulaşır', async () => {
    const { result } = renderHook(() => useCountUp(100, 50));
    await waitFor(() => expect(result.current).toBe(100), { timeout: 5000 });
  });

  it('ondalıklı değer formatını destekler', async () => {
    const { result } = renderHook(() => useCountUp(75.5, 50, 1));
    await waitFor(() => expect(result.current).toBe('75.5'), { timeout: 5000 });
  });
});