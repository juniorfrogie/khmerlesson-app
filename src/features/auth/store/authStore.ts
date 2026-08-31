import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '@/src/services/api';
import { useSubscriptionStore } from '@/src/features/subscriptions/store/subscriptionStore';
import { logger, newTraceId } from '@/src/shared/utils/logger';
import { setSecureTokens, getSecureTokens, clearSecureTokens } from './secureTokenStorage';
import type { User, AuthTokens } from '../types';

// Holds only the non-sensitive `user` profile — tokens live in SecureStore
// (see secureTokenStorage.ts). Older installs persisted `{ user, tokens }`
// together here; hydrate() migrates any such legacy blob on first load.
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

// Shared by hydrate() (cold start) and revalidateIfExpiring() (foreground
// resume) — checks the currently-stored token and refreshes it if it's
// expired/expiring, signing out only if the refresh itself fails.
async function refreshIfNeeded(
  get: () => AuthStore,
  traceId: string,
  trigger: 'cold_start' | 'foreground',
): Promise<void> {
  const { tokens } = get();
  if (!isExpiredOrExpiringSoon(tokens?.accessToken)) {
    logger.info(traceId, 'session_restored', { refreshed: false, trigger });
    return;
  }
  try {
    await get().refreshTokens();
    logger.info(traceId, 'session_restored', { refreshed: true, trigger });
  } catch (err) {
    // A `status` on the error means the backend actually responded (see
    // rawApiPost in api.ts) — e.g. 401 because the refresh token itself is
    // invalid/expired/blacklisted, a genuinely dead session. No `status`
    // means the request never got a response at all (offline, timeout,
    // DNS failure, etc.) — that says nothing about whether the refresh
    // token is valid, so it must not be treated as one. Signing out on a
    // transient network failure would force a real session out from under
    // a user who simply has no signal right now.
    const status = (err as Error & { status?: number }).status;
    if (status === undefined) {
      logger.warn(traceId, 'session_refresh_network_error', { message: (err as Error).message, trigger });
      return;
    }
    logger.warn(traceId, 'session_refresh_failed', { message: (err as Error).message, trigger, status });
    await get().signOut();
  }
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
  revalidateIfExpiring: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  tokens: null,
  isGuest: false,
  isAuthenticated: false,

  setAuth: async (user, tokens) => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
    await setSecureTokens(tokens);
    set({ user, tokens, isAuthenticated: true, isGuest: false });
  },

  setGuest: () => {
    set({ user: null, tokens: null, isAuthenticated: false, isGuest: true });
  },

  signOut: async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await clearSecureTokens();
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
      const parsed = JSON.parse(raw) as { user: User; tokens?: AuthTokens };
      const { user } = parsed;

      let tokens = await getSecureTokens();
      if (!tokens && parsed.tokens) {
        // Legacy pre-SecureStore install: tokens were stored alongside the
        // user profile in plain AsyncStorage. Migrate them into SecureStore.
        tokens = parsed.tokens;
        await setSecureTokens(tokens);
        logger.info(traceId, 'auth_tokens_migrated_to_secure_store', {});
      }
      if (parsed.tokens && tokens) {
        // Strip any lingering plaintext tokens field from the legacy blob.
        // Kept as its own step (not folded into the migration branch above)
        // so a run that crashed after the SecureStore write but before this
        // cleanup still finishes the job on its next launch — otherwise
        // `getSecureTokens()` would already return non-null next time and
        // the migration branch's `if` would never run again, leaving the
        // plaintext copy stuck in AsyncStorage forever.
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
      }

      if (!tokens) return; // a user record with no tokens at all — nothing to restore

      set({ user, tokens, isAuthenticated: true, isGuest: false });
      await refreshIfNeeded(get, traceId, 'cold_start');
    } catch {
      // ignore corrupt storage
    }
  },

  // Called when the app returns to the foreground (see app/_layout.tsx's
  // AppState listener) — the access token can have expired while backgrounded,
  // and without this the first API call after resuming would surface a
  // (self-healing, but visible) TOKEN_EXPIRED round trip instead of already
  // holding a fresh token by the time the user sees anything.
  revalidateIfExpiring: async () => {
    const { isAuthenticated, tokens } = get();
    if (!isAuthenticated || !tokens) return;
    await refreshIfNeeded(get, newTraceId(), 'foreground');
  },

  refreshTokens: async () => {
    const { tokens } = get();
    if (!tokens?.refreshToken) throw new Error('No refresh token available');
    const result = await apiPost<{ accessToken: string; refreshToken?: string }>(
      '/api/auth/refresh-token',
      { refreshToken: tokens.refreshToken },
    );
    const newTokens: AuthTokens = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? tokens.refreshToken,
    };
    await setSecureTokens(newTokens);
    set({ tokens: newTokens });
  },
}));
