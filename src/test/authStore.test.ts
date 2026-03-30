import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

// Mock supabase module
vi.mock('@/lib/supabase', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn().mockResolvedValue(null),
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isLoading: false,
      error: null,
      sessionTimeout: null,
      datasetMode: 'prod',
    });
  });

  it('initialises with null user', () => {
    const { user } = useAuthStore.getState();
    expect(user).toBeNull();
  });

  it('setUser stores the user', () => {
    const mockUser = { name: 'Alice', email: 'alice@test.com', role: 'admin', avatar: 'AL' };
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('logout clears the user', async () => {
    useAuthStore.setState({ user: { name: 'Alice', email: 'alice@test.com', role: 'admin', avatar: 'AL' } });
    const { signOut } = await import('@/lib/supabase');
    (signOut as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('login sets error on failure', async () => {
    const { signIn } = await import('@/lib/supabase');
    (signIn as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid credentials'));
    await expect(useAuthStore.getState().login('bad@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
    expect(useAuthStore.getState().error).toBe('Invalid credentials');
    expect(useAuthStore.getState().user).toBeNull();
  });
});
