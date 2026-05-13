import * as AppleAuthentication from 'expo-apple-authentication';
import { apiPostForm } from '@/src/services/api';
import type { User, AuthTokens } from './types';

// Backend returns "token" (not "accessToken") — matches Flutter reference
interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export async function signInWithApple(): Promise<{ user: User; tokens: AuthTokens }> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token.');
  }

  // Build form body — field is "idToken" per Flutter reference
  const body: Record<string, string> = {
    idToken: credential.identityToken,
  };

  const givenName = credential.fullName?.givenName;
  const familyName = credential.fullName?.familyName;
  if (givenName) body.firstName = givenName;
  if (familyName) body.lastName = familyName;
  if (credential.email) body.email = credential.email;

  const response = await apiPostForm<AuthResponse>('/api/auth/verify-apple-id-token', body);

  return {
    user: { ...response.user, provider: 'apple' },
    tokens: {
      accessToken: response.token,
      refreshToken: response.refreshToken,
    },
  };
}
