import * as AppleAuthentication from 'expo-apple-authentication';
import { apiPostForm } from '@/src/services/api';
import type { User, AuthTokens } from './types';

// Backend returns "token" (not "accessToken") — matches Flutter reference
interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VerifyAppleResponse = any;

interface GoogleProfile {
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function signInWithGoogle(
  accessToken: string,
): Promise<{ user: User; tokens: AuthTokens }> {
  const profileRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) throw new Error('Failed to fetch Google profile.');
  const profile: GoogleProfile = await profileRes.json();

  const body: Record<string, string> = {
    email: profile.email,
    registrationType: 'google_service',
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

  // Step 1: verify identity token → backend decodes it and returns user info including email
  const verifyBody: Record<string, string> = {
    idToken: credential.identityToken,
  };
  const givenName = credential.fullName?.givenName;
  const familyName = credential.fullName?.familyName;
  if (credential.email) verifyBody.email = credential.email;
  if (givenName) verifyBody.firstName = givenName;
  if (familyName) verifyBody.lastName = familyName;

  const verifyResponse = await apiPostForm<VerifyAppleResponse>(
    '/api/auth/verify-apple-id-token',
    verifyBody,
  );

  console.log('[Apple] verify response:', JSON.stringify(verifyResponse));

  const email =
    verifyResponse?.email ??
    verifyResponse?.user?.email ??
    credential.email;

  if (!email) throw new Error('Could not determine email from Apple sign-in.');

  // Apple only returns fullName on the very first sign-in.
  // Use || (not ??) so empty strings fall through to the next fallback.
  const firstName =
    givenName || verifyResponse?.user?.firstName || email.split('@')[0];
  const lastName =
    familyName || verifyResponse?.user?.lastName || 'User';

  // Step 2: register / login via auth service
  const body: Record<string, string> = {
    email,
    registrationType: 'apple_service',
    firstName,
    lastName,
  };

  const response = await apiPostForm<AuthResponse>('/api/auth/register-auth-service', body);

  return {
    user: { ...response.user, provider: 'apple' },
    tokens: {
      accessToken: response.token,
      refreshToken: response.refreshToken,
    },
  };
}
