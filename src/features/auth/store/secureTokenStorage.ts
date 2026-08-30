import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { AuthTokens } from '../types';

// expo-secure-store isn't available on web (Keychain/Keystore-backed, no web
// equivalent) — this app also ships a `web` target (see app.json), so web
// falls back to AsyncStorage. Native platforms always use SecureStore.
const TOKENS_KEY = 'auth_tokens_secure';
const useSecureStore = Platform.OS !== 'web';

export async function setSecureTokens(tokens: AuthTokens): Promise<void> {
  const json = JSON.stringify(tokens);
  if (useSecureStore) {
    await SecureStore.setItemAsync(TOKENS_KEY, json);
  } else {
    await AsyncStorage.setItem(TOKENS_KEY, json);
  }
}

export async function getSecureTokens(): Promise<AuthTokens | null> {
  const json = useSecureStore
    ? await SecureStore.getItemAsync(TOKENS_KEY)
    : await AsyncStorage.getItem(TOKENS_KEY);
  return json ? (JSON.parse(json) as AuthTokens) : null;
}

export async function clearSecureTokens(): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(TOKENS_KEY);
  } else {
    await AsyncStorage.removeItem(TOKENS_KEY);
  }
}
