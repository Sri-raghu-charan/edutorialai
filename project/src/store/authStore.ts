import { create } from 'zustand';
import { User } from '../types';
import { auth } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'teacher') => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;
      
      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata.full_name || '',
          role: data.user.user_metadata.role || 'student',
          avatar_url: data.user.user_metadata.avatar_url,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        };
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, fullName: string, role: 'student' | 'teacher') => {
    set({ isLoading: true });
    try {
      const { data, error } = await auth.signUp(email, password, fullName, role);
      if (error) throw error;
      
      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role,
          created_at: data.user.created_at,
          updated_at: data.user.created_at,
        };
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      const { error } = await auth.signOut();
      if (error) throw error;
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  initialize: async () => {
    try {
      const user = await auth.getCurrentUser();
      if (user) {
        const userData: User = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name || '',
          role: user.user_metadata.role || 'student',
          avatar_url: user.user_metadata.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
        };
        set({ user: userData, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Initialize auth error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));