import { apiFetch } from '@/src/services/api';
import { logger, newTraceId } from '@/src/shared/utils/logger';
import { useSubscriptionStore } from './store/subscriptionStore';
import type { Subscription } from './types';

// Deferred require to avoid a module cycle: authStore -> apiPost (api.ts) is
// fine, but authStore.ts also imports useSubscriptionStore from this
// feature's store module — importing authStore at the top level here risks
// the same cycle shape api.ts already works around with getAuthStore().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAuthStore(): any {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/src/features/auth/store/authStore').useAuthStore;
}

// A sync failure carrying one of these codes means withTokenRefresh (api.ts)
// already tried to refresh and either couldn't (TOKEN_REVOKED — blacklisted,
// never retried) or did and it still failed (TOKEN_EXPIRED surviving a
// retry) — i.e. the session is definitively dead, not a transient blip.
const DEFINITIVE_AUTH_FAILURE_CODES = new Set(['TOKEN_EXPIRED', 'TOKEN_REVOKED']);

// Central subscription sync — call this from anywhere an authenticated
// access token is available (session restore, fresh login, returning from
// background, the Plan/Me screens), not only from a mounted hook. Writes
// the result into the shared subscriptionStore, so every consumer
// (including screens that mounted before this resolves) reflects it
// immediately — this is what previously only happened inside useMySubscription.
export async function syncSubscription(accessToken: string): Promise<Subscription | null> {
  const traceId = newTraceId();
  const store = useSubscriptionStore.getState();
  store.setLoading();
  logger.info(traceId, 'subscription_sync_started');
  try {
    const sub = await apiFetch<Subscription | null>('/api/v1/subscriptions/me', accessToken);
    store.setSubscription(sub);
    logger.info(traceId, sub ? 'subscription_active' : 'subscription_sync_completed_none', {
      status: sub?.status,
    });
    return sub;
  } catch (err) {
    const code = (err as Error & { code?: string }).code;
    if (code && DEFINITIVE_AUTH_FAILURE_CODES.has(code)) {
      // Bug fixed: setError() alone deliberately never clears mySubscription
      // (correct for a transient network error — see its own comment), but
      // that same caution let a genuinely dead session keep showing a stale
      // "Plan X Active" on the Me tab indefinitely — inconsistent with
      // course access, which is computed fresh server-side per request and
      // has no such cache to go stale. Signing out here (which also clears
      // subscription state, see authStore.signOut) makes both consistent
      // immediately instead of only after some other screen's own
      // forbiddenReason check happens to catch the same dead token.
      logger.warn(traceId, 'subscription_sync_dead_session — signing out', { code });
      await getAuthStore().getState().signOut();
    } else {
      store.setError((err as Error).message);
    }
    logger.warn(traceId, 'subscription_sync_failed', { message: (err as Error).message, code });
    throw err;
  }
}
