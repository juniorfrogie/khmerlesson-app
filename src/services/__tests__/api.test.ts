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

function mockResponse(ok: boolean, status: number, body: unknown, responseHeaders?: Record<string, string>) {
  return {
    ok,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
    headers: { get: (key: string) => responseHeaders?.[key] ?? null },
  } as unknown as Response;
}

function mainFetchMock(_url: RequestInfo | URL, options?: RequestInit) {
  fetchCallCount++;
  const headers = options?.headers as Record<string, string> | undefined;
  const auth = headers?.Authorization;

  if (auth === 'Bearer expired-token') {
    return Promise.resolve(mockResponse(false, 401, { code: 'TOKEN_EXPIRED', message: 'Access token expired.' }));
  }
  if (auth === 'Bearer stale-token') {
    // Semi-public route (server/auth/middleware/authenticate.ts): token
    // presented but failed verification — server still returns 200,
    // silently downgraded to anonymous, flagged via this header.
    return Promise.resolve(
      mockResponse(true, 200, { data: { hasAccess: false } }, { 'X-Token-Status': 'invalid' }),
    );
  }
  if (auth === 'Bearer fresh-token') {
    return Promise.resolve(mockResponse(true, 200, { data: { success: true } }));
  }
  if (auth === 'Bearer null-data-token') {
    // e.g. GET /api/v1/subscriptions/me with no active subscription — a
    // legitimate `data: null`, not a missing/absent field.
    return Promise.resolve(mockResponse(true, 200, { success: true, data: null }));
  }
  if (auth === 'Bearer no-envelope-token') {
    // Some endpoints don't use the { success, data } envelope at all.
    return Promise.resolve(mockResponse(true, 200, { raw: 'value' }));
  }
  return Promise.reject(new Error(`unexpected Authorization header in test: ${auth}`));
}

global.fetch = jest.fn(mainFetchMock) as unknown as typeof fetch;

describe('api.ts — transparent token refresh', () => {
  beforeEach(() => {
    global.fetch = jest.fn(mainFetchMock) as unknown as typeof fetch;
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

  it('treats a 200 response with X-Token-Status: invalid as TOKEN_EXPIRED and retries with a fresh token', async () => {
    mockCurrentTokens = { accessToken: 'stale-token', refreshToken: 'refresh-token' };
    const result = await apiFetch('/api/v1/main-lessons', 'stale-token');
    expect(result).toEqual({ success: true });
    expect(mockRefreshTokens).toHaveBeenCalledTimes(1);
  });

  it('does not attempt a refresh at all when no accessToken was provided', async () => {
    global.fetch = jest.fn(async () =>
      mockResponse(false, 401, { code: 'TOKEN_EXPIRED', message: 'x' }),
    ) as unknown as typeof fetch;
    await expect(apiFetch('/api/v1/whatever')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
    expect(mockRefreshTokens).not.toHaveBeenCalled();
  });
});

describe('api.ts — envelope unwrapping', () => {
  beforeEach(() => {
    global.fetch = jest.fn(mainFetchMock) as unknown as typeof fetch;
    mockCurrentTokens = { accessToken: 'null-data-token', refreshToken: 'refresh-token' };
  });

  // Regression test: `json?.data ?? json` treated an explicit `data: null`
  // (a legitimate envelope value, e.g. "no active subscription") the same as
  // `data` being absent, and returned the whole envelope object instead of
  // null. That object is truthy, so callers expecting `T | null` (like
  // syncSubscription) saw a non-null, non-Subscription object instead —
  // e.g. reading `.status` off it produced `undefined` rather than the
  // paywall correctly showing "not subscribed".
  it('returns null (not the envelope) when data is explicitly null', async () => {
    const result = await apiFetch('/api/v1/subscriptions/me', 'null-data-token');
    expect(result).toBeNull();
  });

  it('falls back to the raw response body when there is no data-envelope at all', async () => {
    mockCurrentTokens = { accessToken: 'no-envelope-token', refreshToken: 'refresh-token' };
    const result = await apiFetch('/api/v1/whatever', 'no-envelope-token');
    expect(result).toEqual({ raw: 'value' });
  });
});
