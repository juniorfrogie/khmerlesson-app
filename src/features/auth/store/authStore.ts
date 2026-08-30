import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '@/src/services/api';
import { useSubscriptionStore } from '@/src/features/subscriptions/store/subscriptionStore';
import { logger, newTraceId } from '@/src/shared/utils/logger';
import type { User, AuthTokens } from '../types';

const AUTH_STORAGE_KEY = 'auth_state';

// A token within this many seconds of its `exp` is treated as expired, so a
// proactive refresh has a chance to land before the server would also reject it.
const EXPIRY_SKEW_SECONDS = 30;

function decodeExpiry(accessToken: string | undefined): number | null {
  try {
    const payload = JSON.parse(atob(accessToken?.split('.')[1] ?? ''));
    return typeof payload?.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// No `exp` claim or an undecodable token isn't treated as "expired" here —
// only a token whose exp has actually passed triggers a refresh attempt;
// anything else is left for the server (and the api.ts interceptor) to judge.
function isExpiredOrExpiringSoon(accessToken: string | undefined): boolean {
  const exp = decodeExpiry(accessToken);
  if (exp === null) return false;
  return Date.now() >= exp * 1000 - EXPIRY_SKEW_SECONDS * 1000;
}

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
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, tokens }));
    set({ user, tokens, isAuthenticated: true, isGuest: false });
  },

  setGuest: () => {
    set({ user: null, tokens: null, isAuthenticated: false, isGuest: true });
  },

  signOut: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    // The subscription belongs to the account signing out — without this, a
    // fresh login hydrates the previous user's persisted subscription state.
    useSubscriptionStore.getState().clearSubscription();
    set({ user: null, tokens: null, isAuthenticated: false, isGuest: false });
  },

  // App Launch -> Restore Session -> Validate/Refresh Session -> Establish
  // Authenticated User. Called from app/index.tsx at cold start; the caller
  // awaits this (alongside the other stores' hydrate calls) before routing,
  // so a proactive refresh here happens before the app ever commits to
  // (tabs) vs auth/login — the user should only land on the login screen
  // when the stored session cannot legitimately be recovered at all.
  hydrate: async () => {
    const traceId = newTraceId();
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        logger.info(traceId, 'session_restore_started', { found: false });
        return;
      }

      logger.info(traceId, 'session_restore_started', { found: true });
      const { user, tokens } = JSON.parse(raw);
      set({ user, tokens, isAuthenticated: true, isGuest: false });

      if (isExpiredOrExpiringSoon(tokens?.accessToken)) {
        try {
          await get().refreshTokens();
          logger.info(traceId, 'session_restored', { refreshed: true });
        } catch (err) {
          // Refresh token itself invalid/expired/blacklisted — this is a
          // genuinely dead session, not a merely-expired access token, so
          // clear it now rather than letting every subsequent screen
          // rediscover the same failure independently.
          logger.warn(traceId, 'session_refresh_failed', { message: (err as Error).message });
          await get().signOut();
        }
      } else {
        logger.info(traceId, 'session_restored', { refreshed: false });
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
