import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { signInWithApple, signInWithGoogle } from '@/src/features/auth/service';
import { Linking } from 'react-native';
import { Image } from 'expo-image';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID ?? '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID ?? '';

const URL_PRIVACY_POLICY = process.env.EXPO_PUBLIC_API_BASE_URL + '/privacy-policy';
// Google iOS OAuth client expects its own reversed-ID scheme as the redirect URI
const REVERSED_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_REVERSED_IOS_CLIENT_ID;

export default function LoginScreen() {
  const router = useRouter();
  const { setGuest, setAuth } = useAuthStore();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri({
      native: `${REVERSED_IOS_CLIENT_ID}:/oauthredirect`,
    }),
  });

  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === 'success') {
      const accessToken = googleResponse.authentication?.accessToken;
      if (!accessToken) {
        setError('Google sign-in failed. Please try again.');
        setLoadingProvider(null);
        return;
      }
      signInWithGoogle(accessToken)
        .then(({ user, tokens }) => setAuth(user, tokens))
        .then(() => router.replace('/(tabs)'))
        .catch((e: unknown) => {
          const msg = (e as { message?: string }).message;
          console.error('[Google sign-in error]', e);
          setError(msg ?? 'Google sign-in failed. Please try again.');
        })
        .finally(() => setLoadingProvider(null));
    } else if (googleResponse.type === 'cancel' || googleResponse.type === 'dismiss') {
      setLoadingProvider(null);
    } else {
      setLoadingProvider(null);
    }
  }, [googleResponse]);

  const handleGoogle = async () => {
    setError(null);
    setLoadingProvider('google');
    await promptGoogleAsync();
  };

  const handleApple = async () => {
    setLoadingProvider('apple');
    setError(null);
    try {
      const { user, tokens } = await signInWithApple();
      await setAuth(user, tokens);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const err = e as { code?: string | number; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED' || err.code === 1001) return;
      console.error('[Apple sign-in error]', err);
      const isNoAccount =
        err.code === 'ERR_REQUEST_UNKNOWN' ||
        err.code === 'ERR_REQUEST_NOT_HANDLED' ||
        err.code === 1000 ||
        err.code === 1003 ||
        (err.message ?? '').toLowerCase().includes('unknown reason');
      if (isNoAccount) {
        setError('Please sign in to your Apple ID in Settings → [your name] and try again.');
      } else {
        setError(err.message ?? 'Apple sign-in failed. Please try again.');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGuest = () => {
    setGuest();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={{
                width: 64,
                height: 64,
              }}
              contentFit="contain"
            />
          </View>
          <Text variant="title" style={styles.appName}>KhmerLesson</Text>
          <Text variant="caption" color={Colors.text.secondary} style={styles.tagline}>
            រៀនភាសាខ្មែរ · Learn Khmer
          </Text>
        </View>

        {/* Auth buttons */}
        <View style={styles.authSection}>
          <Text variant="subtitle" style={styles.signInLabel}>Sign in to continue</Text>

          {/* Google */}
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={handleGoogle}
            disabled={loadingProvider !== null}
            activeOpacity={0.8}
          >
            {loadingProvider === 'google' ? (
              <ActivityIndicator color={Colors.text.primary} size="small" />
            ) : (
              <Ionicons name="logo-google" size={20} color="#DB4437" />
            )}
            <Text variant="body" weight="semibold" style={styles.socialBtnText}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Apple — iOS only */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialBtn, styles.appleBtn]}
              onPress={handleApple}
              disabled={loadingProvider !== null}
              activeOpacity={0.8}
            >
              {loadingProvider === 'apple' ? (
                <ActivityIndicator color={Colors.text.inverse} size="small" />
              ) : (
                <Ionicons name="logo-apple" size={22} color={Colors.text.inverse} />
              )}
              <Text variant="body" weight="semibold" color={Colors.text.inverse} style={styles.socialBtnText}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text variant="caption" color={Colors.text.muted} style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest */}
          <TouchableOpacity onPress={handleGuest} style={styles.guestBtn} activeOpacity={0.7}>
            <Text variant="body" color={Colors.text.secondary} weight="medium">
              Continue as Guest
            </Text>
          </TouchableOpacity>

          {error && (
            <Text variant="caption" color={Colors.error} style={styles.errorText}>
              {error}
            </Text>
          )}
        </View>

        {/* Footer note */}
        <Text
          variant="caption"
          color={Colors.text.muted}
          style={styles.footer}
        >
          By continuing, you agree to our{' '}

          <Text
            style={{ color: Colors.primary }}
            onPress={() =>
              Linking.openURL(URL_PRIVACY_POLICY)
            }
          >
            Privacy Policy
          </Text>
          .
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
  },
  tagline: {
    lineHeight: 24,
  },
  authSection: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  signInLabel: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
    fontSize: FontSize.lg,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  appleBtn: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  socialBtnText: {
    fontSize: FontSize.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    paddingHorizontal: Spacing.xs,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  footer: {
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    textAlign: 'center',
  },
});
