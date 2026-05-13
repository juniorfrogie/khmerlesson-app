import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { signInWithApple } from '@/src/features/auth/service';

export default function LoginScreen() {
  const router = useRouter();
  const { setGuest, setAuth } = useAuthStore();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoadingProvider('google');
    setError(null);
    // TODO: Step 2 — Google OAuth
    setLoadingProvider(null);
  };

  const handleApple = async () => {
    setLoadingProvider('apple');
    setError(null);
    try {
      const { user, tokens } = await signInWithApple();
      await setAuth(user, tokens);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      console.error('[Apple sign-in error]', err);
      setError(err.message ?? 'Apple sign-in failed. Please try again.');
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
            <Ionicons name="book" size={48} color={Colors.primary} />
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
        <Text variant="caption" color={Colors.text.muted} style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
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
    borderRadius: Radius.xl,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
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
