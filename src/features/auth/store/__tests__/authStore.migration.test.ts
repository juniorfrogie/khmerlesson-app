// Covers the interrupted-SecureStore-migration fix: if the app crashes
// after tokens are written to SecureStore but before the legacy plaintext
// copy is stripped from AsyncStorage, the next hydrate() must still finish
// the cleanup rather than leaving it stuck forever (since getSecureTokens()
// already returns non-null by then, the original migration branch alone
// would never run again).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../authStore';
import type { AuthTokens } from '../../types';

const secureStoreState: { tokens: AuthTokens | null } = { tokens: null };
const mockSetSecureTokens = jest.fn(async (tokens: AuthTokens) => {
  secureStoreState.tokens = tokens;
});
const mockGetSecureTokens = jest.fn(async () => secureStoreState.tokens);
const mockClearSecureTokens = jest.fn(async () => {
  secureStoreState.tokens = null;
});
jest.mock('../secureTokenStorage', () => ({
  setSecureTokens: (...args: [AuthTokens]) => mockSetSecureTokens(...args),
  getSecureTokens: () => mockGetSecureTokens(),
  clearSecureTokens: () => mockClearSecureTokens(),
}));

jest.mock('@/src/features/subscriptions/store/subscriptionStore', () => ({
  useSubscriptionStore: { getState: () => ({ clearSubscription: jest.fn() }) },
}));

jest.mock('@/src/services/api', () => ({ apiPost: jest.fn() }));

const AUTH_STORAGE_KEY = 'auth_state';
const user = { id: '1', email: 'a@b.com', name: 'A', provider: 'google' as const };
const tokens: AuthTokens = { accessToken: 'access-1', refreshToken: 'refresh-1' };

describe('authStore.hydrate() — interrupted SecureStore migration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    secureStoreState.tokens = null;
    mockSetSecureTokens.mockClear();
    useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false, isGuest: false });
  });

  it('finishes stripping the legacy plaintext tokens on a later hydrate, even if SecureStore already has them (simulated crash between the two writes)', async () => {
    // Simulate a run that crashed after the SecureStore write but before
    // the AsyncStorage cleanup: SecureStore already holds the tokens, yet
    // the legacy blob still carries a plaintext `tokens` field.
    secureStoreState.tokens = tokens;
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, tokens }));

    await useAuthStore.getState().hydrate();

    expect(mockSetSecureTokens).not.toHaveBeenCalled(); // migration branch must not re-run
    const raw = JSON.parse((await AsyncStorage.getItem(AUTH_STORAGE_KEY)) ?? '{}');
    expect(raw.tokens).toBeUndefined(); // plaintext copy finally cleaned up
    expect(raw.user).toEqual(user);
  });

  it('performs the normal first-time migration and cleans up in the same pass', async () => {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, tokens }));

    await useAuthStore.getState().hydrate();

    expect(mockSetSecureTokens).toHaveBeenCalledWith(tokens);
    const raw = JSON.parse((await AsyncStorage.getItem(AUTH_STORAGE_KEY)) ?? '{}');
    expect(raw.tokens).toBeUndefined();
  });

  it('a fully-migrated install (no legacy tokens field) is left untouched', async () => {
    secureStoreState.tokens = tokens;
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));

    await useAuthStore.getState().hydrate();

    expect(mockSetSecureTokens).not.toHaveBeenCalled();
    const raw = JSON.parse((await AsyncStorage.getItem(AUTH_STORAGE_KEY)) ?? '{}');
    expect(raw).toEqual({ user });
  });
});
