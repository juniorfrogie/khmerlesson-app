// Covers Phase 1's token-refresh interceptor + dedup: an expired-but-
// refreshable access token should never force a login redirect, concurrent
// requests should share one refresh, and a genuinely dead session should
// still surface TOKEN_EXPIRED to existing callers.
import { apiFetch } from '../api';

let mockCurrentTokens = { accessToken: 'expired-token', refreshToken: 'refresh-token' };
const mockRefreshTokens = jest.fn(async () => {
  mockCurrentTokens = { ...mockCurrentTokens, accessToken: 'fresh-token' };
});

jest.mock('@/src/features/auth/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      tokens: mockCurrentTokens,
      refreshTokens: mockRefreshTokens,
    }),
  },
}));

let fetchCallCount = 0;

function mockResponse(ok: boolean, status: number, body: unknown) {
  return {
    ok,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response;
}

global.fetch = jest.fn(async (_url: RequestInfo | URL, options?: RequestInit) => {
  fetchCallCount++;
  const headers = options?.headers as Record<string, string> | undefined;
  const auth = headers?.Authorization;

  if (auth === 'Bearer expired-token') {
    return mockResponse(false, 401, { code: 'TOKEN_EXPIRED', message: 'Access token expired.' });
  }
  if (auth === 'Bearer fresh-token') {
    return mockResponse(true, 200, { data: { success: true } });
  }
  throw new Error(`unexpected Authorization header in test: ${auth}`);
}) as unknown as typeof fetch;

describe('api.ts — transparent token refresh', () => {
  beforeEach(() => {
    fetchCallCount = 0;
    mockCurrentTokens = { accessToken: 'expired-token', refreshToken: 'refresh-token' };
    mockRefreshTokens.mockClear();
    mockRefreshTokens.mockImplementation(async () => {
      mockCurrentTokens = { ...mockCurrentTokens, accessToken: 'fresh-token' };
    });
  });

  it('retries once after TOKEN_EXPIRED and succeeds with the refreshed token', async () => {
    const result = await apiFetch('/api/v1/whatever', 'expired-token');
    expect(result).toEqual({ success: true });
    expect(mockRefreshTokens).toHaveBeenCalledTimes(1);
    expect(fetchCallCount).toBe(2); // original (401) + retry (200)
  });

  it('deduplicates concurrent refresh calls into a single refreshTokens() invocation', async () => {
    await Promise.all([
      apiFetch('/api/v1/one', 'expired-token'),
      apiFetch('/api/v1/two', 'expired-token'),
      apiFetch('/api/v1/three', 'expired-token'),
    ]);
    expect(mockRefreshTokens).toHaveBeenCalledTimes(1);
  });

  it('surfaces the original TOKEN_EXPIRED error unchanged when refresh itself fails', async () => {
    mockRefreshTokens.mockImplementationOnce(async () => {
      throw new Error('refresh token invalid');
    });
    await expect(apiFetch('/api/v1/whatever', 'expired-token')).rejects.toMatchObject({
      code: 'TOKEN_EXPIRED',
    });
  });

  it('does not attempt a refresh at all when no accessToken was provided', async () => {
    global.fetch = jest.fn(async () =>
      mockResponse(false, 401, { code: 'TOKEN_EXPIRED', message: 'x' }),
    ) as unknown as typeof fetch;
    await expect(apiFetch('/api/v1/whatever')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
    expect(mockRefreshTokens).not.toHaveBeenCalled();
  });
});
