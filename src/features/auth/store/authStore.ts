import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '@/src/services/api';
import type { User, AuthTokens } from '../types';

const AUTH_STORAGE_KEY = 'auth_state';

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isGuest: boolean;
  isAuthenticated: boolean;

  setAuth: (user: User, tokens: AuthTokens) => Promise<void>;
  setGuest: () => void;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  tokens: null,
  isGuest: false,
  isAuthenticated: false,

  setAuth: async (user, tokens) => {
    console.log('[setAuth] user:', user);
    console.log('[setAuth] accessToken:', tokens.accessToken);
    console.log('[setAuth] refreshToken:', tokens.refreshToken);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, tokens }));
    set({ user, tokens, isAuthenticated: true, isGuest: false });
  },

  setGuest: () => {
    set({ user: null, tokens: null, isAuthenticated: false, isGuest: true });
  },

  signOut: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    set({ user: null, tokens: null, isAuthenticated: false, isGuest: false });
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const { user, tokens } = JSON.parse(raw);
        set({ user, tokens, isAuthenticated: true, isGuest: false });
      }
    } catch {
      // ignore corrupt storage
    }
  },

  refreshTokens: async () => {
    const { tokens, user } = get();
    if (!tokens?.refreshToken) throw new Error('No refresh token available');
    const result = await apiPost<{ accessToken: string; refreshToken?: string }>(
      '/api/auth/refresh-token',
      { refreshToken: tokens.refreshToken },
    );
    const newTokens: AuthTokens = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? tokens.refreshToken,
    };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, tokens: newTokens }));
    set({ tokens: newTokens });
  },
}));
