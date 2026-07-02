import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { apiDelete } from '@/src/services/api';
import { useMySubscription } from '@/src/services/hooks/useMySubscription';
import { useSubscriptionPlans } from '@/src/services/hooks/useSubscriptionPlans';

const SUPPORT_EMAIL = 'support@khmerlesson.com';
const PRIVACY_URL = `${process.env.EXPO_PUBLIC_API_BASE_URL}/privacy-policy`;

export default function MeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const { subscription: mySubscription } = useMySubscription();
  const { plans } = useSubscriptionPlans();

  const isActiveOrTrial = mySubscription?.status === 'active' || mySubscription?.status === 'trial';
  const currentPlan = isActiveOrTrial ? plans.find(p => p.id === mySubscription!.planId) : null;
  const subscriptionLabel = isActiveOrTrial
    ? `${currentPlan?.name ?? 'Plan'} · ${mySubscription!.status === 'trial' ? 'Trial' : 'Active'}`
    : 'No active subscription';

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const openSupportEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=KhmerLesson%20Support`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Contact Support', SUPPORT_EMAIL);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Read fresh state — Alert onPress captures a stale closure
            const { user: currentUser, tokens: currentTokens, signOut: doSignOut } = useAuthStore.getState();
            const accessToken = currentTokens?.accessToken;

            if (!accessToken || !currentUser) {
              Alert.alert('Session Expired', 'Please log in again and retry.');
              return;
            }

            try {
              await apiDelete(`/api/users/${currentUser.id}`, accessToken);
              await doSignOut();
              router.replace('/auth/login');
            } catch (e: unknown) {
              const msg = (e as { message?: string }).message ?? 'Failed to delete account. Please try again.';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL(PRIVACY_URL);
  };

  if (!isAuthenticated || !user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text variant="subtitle" style={styles.name}>{user.name || 'User'}</Text>
          <Text variant="caption" color={Colors.text.secondary}>{user.email}</Text>
          <View style={styles.providerBadge}>
            <Ionicons
              name={user.provider === 'apple' ? 'logo-apple' : 'logo-google'}
              size={12}
              color={Colors.text.secondary}
            />
            <Text variant="label" color={Colors.text.secondary} style={styles.providerText}>
              {user.provider === 'apple' ? 'Apple' : 'Google'}
            </Text>
          </View>
        </View>

        {/* Subscription section */}
        <View style={styles.section}>
          <Text variant="label" color={Colors.text.muted} style={styles.sectionTitle}>SUBSCRIPTION</Text>

          <View style={styles.card}>
            <MenuItem
              icon="card-outline"
              label={subscriptionLabel}
              onPress={() => router.push('/subscription')}
            />
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text variant="label" color={Colors.text.muted} style={styles.sectionTitle}>ACCOUNT</Text>

          <View style={styles.card}>
            <MenuItem
              icon="mail-outline"
              label="Support"
              onPress={openSupportEmail}
            />
            <View style={styles.separator} />
            <MenuItem
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={handlePrivacyPolicy}
            />
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text variant="label" color={Colors.text.muted} style={styles.sectionTitle}>ACCOUNT ACTIONS</Text>

          <View style={styles.card}>
            <MenuItem
              icon="log-out-outline"
              label="Log Out"
              onPress={handleLogout}
            />
            <View style={styles.separator} />
            <MenuItem
              icon="trash-outline"
              label="Delete Account"
              labelColor={Colors.error}
              iconColor={Colors.error}
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  labelColor,
  iconColor,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  labelColor?: string;
  iconColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={iconColor ?? Colors.text.secondary} />
      <Text variant="body" color={labelColor ?? Colors.text.primary} style={styles.menuLabel}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xs,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  name: {
    textAlign: 'center',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  providerText: {
    fontSize: 11,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuLabel: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.md + 20 + Spacing.md,
  },
});
