// Covers the refreshIfNeeded network-failure fix: a transient network
// failure while proactively refreshing the session (cold start / foreground)
// must not be treated the same as the backend explicitly rejecting the
// refresh token — only the latter is a genuinely dead session.
import { useAuthStore } from '../authStore';

const mockSetSecureTokens = jest.fn(async (_tokens: unknown) => {});
const mockGetSecureTokens = jest.fn(async () => null);
const mockClearSecureTokens = jest.fn(async () => {});
jest.mock('../secureTokenStorage', () => ({
  setSecureTokens: (tokens: unknown) => mockSetSecureTokens(tokens),
  getSecureTokens: () => mockGetSecureTokens(),
  clearSecureTokens: () => mockClearSecureTokens(),
}));

const mockClearSubscription = jest.fn();
jest.mock('@/src/features/subscriptions/store/subscriptionStore', () => ({
  useSubscriptionStore: { getState: () => ({ clearSubscription: mockClearSubscription }) },
}));

const mockApiPost = jest.fn();
jest.mock('@/src/services/api', () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}));

function expiredAccessToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 })).toString('base64');
  return `${header}.${payload}.sig`;
}

describe('authStore — refreshIfNeeded distinguishes network failure from a dead session', () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockSetSecureTokens.mockClear();
    mockClearSecureTokens.mockClear();
    mockClearSubscription.mockClear();
    useAuthStore.setState({
      user: { id: '1', email: 'a@b.com', name: 'A', provider: 'google' },
      tokens: { accessToken: expiredAccessToken(), refreshToken: 'refresh-1' },
      isAuthenticated: true,
      isGuest: false,
    });
  });

  it('does NOT sign out when the refresh call fails with no status (network/timeout failure)', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('Network request failed'));
    await useAuthStore.getState().revalidateIfExpiring();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.tokens?.refreshToken).toBe('refresh-1'); // untouched — still expired, but session preserved
    expect(mockClearSecureTokens).not.toHaveBeenCalled();
  });

  it('DOES sign out when the backend explicitly rejects the refresh token (error carries a status)', async () => {
    const err = new Error('invalid refresh token') as Error & { status: number };
    err.status = 401;
    mockApiPost.mockRejectedValueOnce(err);
    await useAuthStore.getState().revalidateIfExpiring();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.tokens).toBeNull();
    expect(mockClearSecureTokens).toHaveBeenCalled();
  });

  it('refreshes normally and stores the new tokens when the call succeeds', async () => {
    mockApiPost.mockResolvedValueOnce({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    await useAuthStore.getState().revalidateIfExpiring();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.tokens?.accessToken).toBe('new-access');
    expect(state.tokens?.refreshToken).toBe('new-refresh');
  });
});
