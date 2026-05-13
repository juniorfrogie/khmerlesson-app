export type AuthProvider = 'google' | 'apple' | 'email';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: AuthProvider;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isGuest: boolean;
}
