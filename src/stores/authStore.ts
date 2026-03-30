import React from 'react';
import { create } from 'zustand';
import type { User } from '@/types';
import { FORCED_DATASET_MODE, IS_STANDALONE_DEMO } from '@/lib/demoMode';

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
    team?: string;
    dataset_mode?: string;
  };
}

export interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  sessionTimeout: NodeJS.Timeout | null;
  datasetMode: 'demo' | 'prod';

  // Actions
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSessionTimeout: (timeout: NodeJS.Timeout | null) => void;
  setDatasetMode: (mode: 'demo' | 'prod') => void;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setupSessionTimeout: () => void;
  clearSessionTimeout: () => void;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const DEMO_SESSION_KEY = 'itsm-demo-authenticated';
const DEMO_USER: User = {
  name: 'Admin User',
  email: 'admin@admin.com',
  role: 'Demo Administrator',
  avatar: 'AU',
};

const normalizeDatasetValue = (value?: string | null): 'demo' | 'prod' | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'demo' || normalized === 'prod') {
    return normalized;
  }
  return null;
};

const resolveDatasetMode = (authUser: AuthUser): 'demo' | 'prod' => {
  const forcedMode = normalizeDatasetValue(FORCED_DATASET_MODE);
  if (forcedMode) return forcedMode;

  const metadataMode = normalizeDatasetValue(authUser.user_metadata?.dataset_mode);
  if (metadataMode) return metadataMode;

  const roleMode = normalizeDatasetValue(authUser.user_metadata?.role);
  if (roleMode) return roleMode;

  const email = authUser.email?.trim().toLowerCase() ?? '';
  return email.startsWith('demo@') ? 'demo' : 'prod';
};

/**
 * Convert Supabase AuthUser to app User type
 */
const convertAuthUserToUser = (authUser: AuthUser): User => {
  const firstName = authUser.user_metadata?.first_name || authUser.user_metadata?.full_name?.split(' ')[0] || 'User';
  const lastName = authUser.user_metadata?.last_name || authUser.user_metadata?.full_name?.split(' ')[1] || '';
  const fullName = authUser.user_metadata?.full_name || `${firstName} ${lastName}`.trim();
  const datasetMode = resolveDatasetMode(authUser);
  const displayRole =
    authUser.user_metadata?.team ||
    (datasetMode === 'demo' ? 'Demo User' : 'Support Analyst');

  return {
    name: fullName,
    email: authUser.email || '',
    role: displayRole,
    avatar: (firstName + (lastName ? lastName[0] : '')).toUpperCase(),
  };
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: IS_STANDALONE_DEMO,
  error: null,
  sessionTimeout: null,
  datasetMode: 'demo',

  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSessionTimeout: (timeout) => set({ sessionTimeout: timeout }),
  setDatasetMode: (mode) => set({ datasetMode: mode }),

  login: async (email: string, password: string) => {
    if (IS_STANDALONE_DEMO) {
      set({ isLoading: true, error: null });

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();
      if (normalizedEmail !== 'admin@admin.com' || normalizedPassword !== 'password') {
        const message = 'Use admin@admin.com / password for the demo.';
        set({ isLoading: false, error: message, user: null, datasetMode: 'demo' });
        throw new Error(message);
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DEMO_SESSION_KEY, 'true');
      }

      set({ user: DEMO_USER, datasetMode: 'demo', isLoading: false, error: null });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const { signIn } = await import('@/lib/supabase');
      const { user: authUser } = await signIn(email, password);

      if (authUser) {
        const user: AuthUser = {
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata,
        };
        const datasetMode = resolveDatasetMode(user);

        set({
          user: convertAuthUserToUser(user),
          datasetMode
        });
        get().setupSessionTimeout();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, user: null });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    if (IS_STANDALONE_DEMO) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(DEMO_SESSION_KEY);
      }
      set({ user: null, error: null, datasetMode: 'demo', isLoading: false });
      get().clearSessionTimeout();
      return;
    }

    try {
      set({ isLoading: true });
      const { signOut } = await import('@/lib/supabase');
      await signOut();
      set({ user: null, error: null, datasetMode: 'prod' });
      get().clearSessionTimeout();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  restoreSession: async () => {
    if (IS_STANDALONE_DEMO) {
      const isAuthenticated =
        typeof window !== 'undefined' && window.localStorage.getItem(DEMO_SESSION_KEY) === 'true';
      set({
        user: isAuthenticated ? DEMO_USER : null,
        datasetMode: 'demo',
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      set({ isLoading: true });
      const { getCurrentUser } = await import('@/lib/supabase');
      const authUser = await getCurrentUser();

      if (authUser) {
        const user: AuthUser = {
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata,
        };
        const datasetMode = resolveDatasetMode(user);

        set({
          user: convertAuthUserToUser(user),
          datasetMode
        });
        get().setupSessionTimeout();
      } else {
        set({ user: null, datasetMode: 'prod' });
      }
    } catch (error: unknown) {
      console.error('Failed to restore session:', error);
      const message = error instanceof Error ? error.message : '';
      if (message.includes('Refresh Token')) {
        try {
          const { signOut } = await import('@/lib/supabase');
          await signOut();
        } catch {}
      }
      set({ user: null, error: null });
    } finally {
      set({ isLoading: false });
    }
  },

  setupSessionTimeout: () => {
    get().clearSessionTimeout();

    const timeout = setTimeout(() => {
      set({ error: 'Session expired. Please login again.' });
      get().logout().catch(() => {});
    }, SESSION_TIMEOUT_MS);

    set({ sessionTimeout: timeout });
  },

  clearSessionTimeout: () => {
    const { sessionTimeout } = get();
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      set({ sessionTimeout: null });
    }
  },
}));

/**
 * Hook to initialize auth state from Supabase
 */
export const useInitializeAuth = () => {
  const { restoreSession } = useAuthStore();

  React.useEffect(() => {
    if (IS_STANDALONE_DEMO) {
      restoreSession();
      return;
    }

    restoreSession();

    let unsubscribe: (() => void) | undefined;

    import('@/lib/supabase').then(({ onAuthStateChange }) => {
      const { data } = onAuthStateChange((authUser: AuthUser | null) => {
        if (authUser) {
          const user: AuthUser = {
            id: authUser.id,
            email: authUser.email,
            user_metadata: authUser.user_metadata,
          };
          const datasetMode = resolveDatasetMode(user);

          useAuthStore.setState({
            user: convertAuthUserToUser(user),
            datasetMode
          });
        } else {
          useAuthStore.setState({ user: null, datasetMode: 'prod' });
        }
      });
      unsubscribe = () => data?.subscription?.unsubscribe();
    });

    return () => {
      unsubscribe?.();
    };
  }, [restoreSession]);
};
