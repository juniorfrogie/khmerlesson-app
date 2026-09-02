// Covers the bug where a definitively dead session (token expired AND the
// refresh retry also failed, or a blacklisted/revoked token) left the Me
// tab showing a stale "Plan X Active" indefinitely: setError() deliberately
// never clears mySubscription (correct for a transient network blip — see
// subscriptionStore.test.ts), but that same caution meant a genuine auth
// failure never got distinguished from one. syncSubscription must sign the
// user out (which also clears subscription state) for TOKEN_EXPIRED/
// TOKEN_REVOKED specifically, and must NOT do so for any other error.
import { syncSubscription } from '../service';
import { useSubscriptionStore } from '../store/subscriptionStore';
import type { Subscription } from '../types';

const mockSignOut = jest.fn(async () => {});
jest.mock('@/src/features/auth/store/authStore', () => ({
  useAuthStore: { getState: () => ({ signOut: mockSignOut }) },
}));

const mockApiFetch = jest.fn();
jest.mock('@/src/services/api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

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

function codedError(message: string, code?: string): Error & { code?: string } {
  const err = new Error(message) as Error & { code?: string };
  if (code) err.code = code;
  return err;
}

describe('syncSubscription — dead-session detection', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockApiFetch.mockReset();
    useSubscriptionStore.setState({ mySubscription: activeSub, status: 'active', error: null });
  });

  it('signs out (does not just setError) when the sync fails with TOKEN_EXPIRED', async () => {
    mockApiFetch.mockRejectedValueOnce(codedError('Access token expired', 'TOKEN_EXPIRED'));
    await expect(syncSubscription('stale-token')).rejects.toThrow();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('signs out when the sync fails with TOKEN_REVOKED (blacklisted)', async () => {
    mockApiFetch.mockRejectedValueOnce(codedError('Token is no longer valid', 'TOKEN_REVOKED'));
    await expect(syncSubscription('revoked-token')).rejects.toThrow();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('does NOT sign out on a plain network/server error — preserves the existing setError() behavior', async () => {
    mockApiFetch.mockRejectedValueOnce(codedError('Network request failed'));
    await expect(syncSubscription('some-token')).rejects.toThrow();
    expect(mockSignOut).not.toHaveBeenCalled();
    const state = useSubscriptionStore.getState();
    expect(state.status).toBe('error');
    // The exact regression this whole fix is about: a transient failure
    // must still leave previously-confirmed access alone.
    expect(state.mySubscription).toEqual(activeSub);
  });
});
