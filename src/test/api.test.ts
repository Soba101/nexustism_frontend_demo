import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useTickets } from '@/services/api';

// Mock authStore so fetchAPI can read datasetMode without Supabase.
// useAuthStore must be callable (React hook) AND have getState (Zustand static API).
vi.mock('@/stores/authStore', () => {
  const useAuthStore = vi.fn(() => ({ datasetMode: 'demo' }));
  useAuthStore.getState = () => ({ datasetMode: 'demo' });
  return { useAuthStore };
});

// Mock supabase session helper
vi.mock('@/lib/supabase', () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn(),
}));

const mockTickets = [
  { id: '1', number: 'INC001', short_description: 'Test', state: 'open', priority: '3 - Moderate' },
];

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ tickets: mockTickets, total: 1 }),
  } as Response);
});

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  Wrapper.displayName = 'TestQueryClientWrapper';
  return Wrapper;
}

describe('useTickets hook', () => {
  it('returns ticket data on success', async () => {
    const { result } = renderHook(() => useTickets(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tickets).toHaveLength(1);
    expect(result.current.data?.tickets[0].number).toBe('INC001');
  });

  it('sends X-Dataset header', async () => {
    renderHook(() => useTickets(), { wrapper: makeWrapper() });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((options as RequestInit).headers).toMatchObject({ 'X-Dataset': 'demo' });
  });
});

describe('fetchAPI 401 handling', () => {
  it('throws session-expired error on 401', async () => {
    const { signOut } = await import('@/lib/supabase');
    (signOut as ReturnType<typeof vi.fn>).mockResolvedValue({});
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    const { result } = renderHook(() => useTickets(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('Session expired');
  });
});
