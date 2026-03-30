import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useTickets } from '@/services/api';

// useAuthStore must be callable (React hook) AND have getState (Zustand static API).
vi.mock('@/stores/authStore', () => {
  const useAuthStore = vi.fn(() => ({ datasetMode: 'demo' }));
  useAuthStore.getState = () => ({ datasetMode: 'demo' });
  return { useAuthStore };
});

vi.mock('@/lib/supabase', () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn(),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  Wrapper.displayName = 'TestQueryClientWrapper';
  return Wrapper;
}

describe('useTickets', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tickets: [], total: 0 }),
    } as Response);
  });

  it('returns empty list when backend returns no tickets', async () => {
    const { result } = renderHook(() => useTickets(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tickets).toHaveLength(0);
    expect(result.current.data?.total).toBe(0);
  });

  it('passes search query as URL parameter', async () => {
    renderHook(() => useTickets({ search: 'network outage' }), { wrapper: makeWrapper() });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const searchParam = new URL(url as string).searchParams.get('search');
    expect(searchParam).toBe('network outage');
  });
});
