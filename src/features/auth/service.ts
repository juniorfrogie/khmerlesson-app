import * as AppleAuthentication from 'expo-apple-authentication';
import { apiPostForm } from '@/src/services/api';
import type { User, AuthTokens } from './types';

// Backend returns "token" (not "accessToken") — matches Flutter reference
interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface GoogleProfile {
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function signInWithGoogle(
  accessToken: string,
): Promise<{ user: User; tokens: AuthTokens }> {
  // Fetch Google profile with the OAuth access token
  const profileRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) throw new Error('Failed to fetch Google profile.');
  const profile: GoogleProfile = await profileRes.json();

  // register-auth-service handles both new and returning social-auth users
  const body: Record<string, string> = {
    email: profile.email,
    registrationType: 'google',
  };
  if (profile.given_name) body.firstName = profile.given_name;
  if (profile.family_name) body.lastName = profile.family_name;

  const response = await apiPostForm<AuthResponse>('/api/auth/register-auth-service', body);

  return {
    user: { ...response.user, provider: 'google' },
    tokens: {
      accessToken: response.token,
      refreshToken: response.refreshToken,
    },
  };
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
