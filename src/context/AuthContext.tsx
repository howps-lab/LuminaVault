import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, getActiveSupabaseCredentials } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isCustom: boolean;
  isDemoUser: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  refreshConfig: () => void;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'demo-user-id',
  app_metadata: {},
  user_metadata: { name: 'Demo Photographer' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'curator@lumina.vault',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [configState, setConfigState] = useState(getActiveSupabaseCredentials());
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  const initAuth = useCallback(async () => {
    setLoading(true);
    const creds = getActiveSupabaseCredentials();
    setConfigState(creds);

    if (!creds.isConfigured) {
      // Check if demo user was active
      const storedDemo = localStorage.getItem('lumina_demo_active');
      if (storedDemo === 'true') {
        setUser(DEMO_USER);
        setIsDemoUser(true);
      } else {
        setUser(null);
        setIsDemoUser(false);
      }
      setSession(null);
      setLoading(false);
      return;
    }

    const client = getSupabase();
    if (!client) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Get initial session
      const { data: { session: initialSession }, error } = await client.auth.getSession();
      if (error) {
        console.warn('Supabase getSession error:', error);
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsDemoUser(false);

      // Listen for auth state changes
      const { data: authListener } = client.auth.onAuthStateChange((_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsDemoUser(false);
      });

      setLoading(false);

      return () => {
        authListener?.subscription.unsubscribe();
      };
    } catch (err) {
      console.error('Auth initialization error:', err);
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const refreshConfig = useCallback(() => {
    initAuth();
  }, [initAuth]);

  const signInWithEmail = async (email: string, password: string) => {
    const creds = getActiveSupabaseCredentials();
    if (!creds.isConfigured) {
      // Mock login for demo mode
      if (email.trim().toLowerCase() === 'curator@lumina.vault' || email.includes('@')) {
        setUser({ ...DEMO_USER, email: email.trim() });
        setIsDemoUser(true);
        localStorage.setItem('lumina_demo_active', 'true');
        return { success: true };
      }
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const client = getSupabase();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);
      setSession(data.session);
      setIsDemoUser(false);
      localStorage.removeItem('lumina_demo_active');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed.' };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const creds = getActiveSupabaseCredentials();
    if (!creds.isConfigured) {
      // Demo mode sign up
      setUser({ ...DEMO_USER, email: email.trim() });
      setIsDemoUser(true);
      localStorage.setItem('lumina_demo_active', 'true');
      return {
        success: true,
        message: 'Signed in via Demo Mode! To persist across devices, connect your Supabase project in settings.',
      };
    }

    const client = getSupabase();
    if (!client) {
      return { success: false, error: 'Supabase client not initialized.' };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If Supabase has email confirmation enabled
      if (data.user && !data.session) {
        return {
          success: true,
          message: 'Account created! Please check your email inbox to confirm your address before logging in.',
        };
      }

      setUser(data.user);
      setSession(data.session);
      setIsDemoUser(false);
      localStorage.removeItem('lumina_demo_active');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sign up failed.' };
    }
  };

  const signOut = async () => {
    const client = getSupabase();
    if (client && !isDemoUser) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.error('Error during signOut:', err);
      }
    }
    localStorage.removeItem('lumina_demo_active');
    setUser(null);
    setSession(null);
    setIsDemoUser(false);
  };

  const enableDemoMode = () => {
    setUser(DEMO_USER);
    setIsDemoUser(true);
    localStorage.setItem('lumina_demo_active', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: configState.isConfigured,
        isCustom: configState.isCustom,
        isDemoUser,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshConfig,
        enableDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
