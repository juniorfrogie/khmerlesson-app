import { useSubscriptionStore } from '../subscriptionStore';
import type { Subscription } from '../../types';

const activeSub: Subscription = {
  id: 1,
  userId: 1,
  planId: 1,
  platform: 'ios',
  productId: 'com.khmerlesson.subscription.plan1',
  originalTransactionId: 'txn-1',
  status: 'active',
  currentPeriodEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const expiredSub: Subscription = {
  ...activeSub,
  status: 'expired',
};

function resetStore() {
  useSubscriptionStore.setState({ mySubscription: null, status: 'unknown', error: null });
}

describe('subscriptionStore — sync status', () => {
  beforeEach(resetStore);

  it('starts at "unknown", never "inactive", before any sync', () => {
    // This is the core bug this field exists to prevent: a fresh store must
    // not be misread as "confirmed no subscription."
    expect(useSubscriptionStore.getState().status).toBe('unknown');
  });

  it('setLoading() moves to "loading" without touching mySubscription', () => {
    useSubscriptionStore.getState().setSubscription(activeSub);
    useSubscriptionStore.getState().setLoading();
    const state = useSubscriptionStore.getState();
    expect(state.status).toBe('loading');
    expect(state.mySubscription).toEqual(activeSub); // still there — loading isn't a reset
  });

  it('setSubscription(active) → status "active"', () => {
    useSubscriptionStore.getState().setSubscription(activeSub);
    expect(useSubscriptionStore.getState().status).toBe('active');
  });

  it('setSubscription(expired) → status "inactive" (row still kept for renewal UI)', () => {
    useSubscriptionStore.getState().setSubscription(expiredSub);
    const state = useSubscriptionStore.getState();
    expect(state.status).toBe('inactive');
    expect(state.mySubscription).toEqual(expiredSub); // not nulled out — needed for renewal UI
  });

  it('setSubscription(null) → status "inactive", distinct from "unknown"', () => {
    useSubscriptionStore.getState().setSubscription(null);
    const state = useSubscriptionStore.getState();
    expect(state.status).toBe('inactive');
    expect(state.mySubscription).toBeNull();
  });

  it('setError() moves to "error" WITHOUT downgrading a previously-confirmed subscription', () => {
    useSubscriptionStore.getState().setSubscription(activeSub);
    useSubscriptionStore.getState().setError('network down');
    const state = useSubscriptionStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBe('network down');
    // The concrete regression this guards against: a failed sync must never
    // make previously-unlocked content look locked.
    expect(state.mySubscription).toEqual(activeSub);
  });

  it('clearSubscription() → status "inactive", mySubscription null', () => {
    useSubscriptionStore.getState().setSubscription(activeSub);
    useSubscriptionStore.getState().clearSubscription();
    const state = useSubscriptionStore.getState();
    expect(state.status).toBe('inactive');
    expect(state.mySubscription).toBeNull();
  });
});
