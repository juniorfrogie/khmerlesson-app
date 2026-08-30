import { apiFetch } from '@/src/services/api';
import { logger, newTraceId } from '@/src/shared/utils/logger';
import { useSubscriptionStore } from './store/subscriptionStore';
import type { Subscription } from './types';

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
    store.setError((err as Error).message);
    logger.warn(traceId, 'subscription_sync_failed', { message: (err as Error).message });
    throw err;
  }
}
