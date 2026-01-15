import { create } from 'zustand';
import { signIn, signOut, getCurrentUser, onAuthStateChange } from '@/lib/supabase';
import type { User } from '@/types';

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
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

/**
 * Convert Supabase AuthUser to app User type
 */
const convertAuthUserToUser = (authUser: AuthUser): User => {
  const firstName = authUser.user_metadata?.first_name || authUser.user_metadata?.full_name?.split(' ')[0] || 'User';
  const lastName = authUser.user_metadata?.last_name || authUser.user_metadata?.full_name?.split(' ')[1] || '';
  const fullName = authUser.user_metadata?.full_name || `${firstName} ${lastName}`.trim();
  
  return {
    name: fullName,
    email: authUser.email || '',
    role: authUser.user_metadata?.role || 'Support Analyst',
    avatar: (firstName + (lastName ? lastName[0] : '')).toUpperCase(),
  };
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  sessionTimeout: null,
  datasetMode: 'prod',

  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSessionTimeout: (timeout) => set({ sessionTimeout: timeout }),
  setDatasetMode: (mode) => set({ datasetMode: mode }),

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const { user: authUser } = await signIn(email, password);

      if (authUser) {
        const user: AuthUser = {
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata,
        };
        // Extract dataset mode from user metadata
        const role = authUser.user_metadata?.role || 'prod';
        const datasetMode: 'demo' | 'prod' = role === 'demo' ? 'demo' : 'prod';
        
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
    try {
      set({ isLoading: true });
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
    try {
      set({ isLoading: true });
      const authUser = await getCurrentUser();

      if (authUser) {
        const user: AuthUser = {
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata,
        };
        // Extract dataset mode from user metadata
        const role = authUser.user_metadata?.role || 'prod';
        const datasetMode: 'demo' | 'prod' = role === 'demo' ? 'demo' : 'prod';
        
        set({ 
          user: convertAuthUserToUser(user),
          datasetMode 
        });
        get().setupSessionTimeout();
      } else {
        // No session found - user not logged in
        set({ user: null, datasetMode: 'prod' });
      }
    } catch (error: any) {
      console.error('Failed to restore session:', error);
      // If it's a refresh token error, explicitly sign out to clear invalid tokens
      if (error?.message?.includes('Refresh Token')) {
        try {
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
import React from 'react';

export const useInitializeAuth = () => {
  const { restoreSession } = useAuthStore();

  React.useEffect(() => {
    restoreSession();

    const { data } = onAuthStateChange((authUser) => {
      if (authUser) {
        const user: AuthUser = {
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata,
        };
        // Extract dataset mode from user metadata
        const role = authUser.user_metadata?.role || 'prod';
        const datasetMode: 'demo' | 'prod' = role === 'demo' ? 'demo' : 'prod';
        
        useAuthStore.setState({ 
          user: convertAuthUserToUser(user),
          datasetMode 
        });
      } else {
        useAuthStore.setState({ user: null, datasetMode: 'prod' });
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [restoreSession]);
};
