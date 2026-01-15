import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

// Handle auth errors globally - clear invalid sessions on sign out
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      // Clear any stale auth data from localStorage
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
      keys.forEach(k => localStorage.removeItem(k));
    }
  });
}

/**
 * Get current session from Supabase
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

/**
 * Sign in with email/password
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

/**
 * Sign up new user
 */
export const signUp = async (
  email: string,
  password: string,
  options?: { data?: Record<string, any> }
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options,
  });

  if (error) throw error;
  return data;
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Handle invalid refresh token by signing out
      if (error.message.includes('Refresh Token')) {
        await supabase.auth.signOut();
        return null;
      }
      // Session missing is expected when user is not logged in
      if (error.message === 'Auth session missing!') {
        return null;
      }
      throw error;
    }
    return data.user;
  } catch (error) {
    if (error instanceof Error) {
      // Silently return null for auth errors - user will be shown login screen
      if (error.message.includes('Auth session missing') || error.message.includes('Refresh Token')) {
        return null;
      }
    }
    console.error('Failed to get current user:', error);
    return null;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    callback(session?.user || null);
  });
};
