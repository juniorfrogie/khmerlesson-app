import { View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/src/shared/theme';
import { Text } from '@/src/shared/components/Text';
import { Button } from '@/src/shared/components/Button';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import {
  connectIAP,
  disconnectIAP,
  loadCourseProduct,
  purchaseCourse,
  isSubscriptionProductId,
} from '@/src/features/courses/service/purchaseService';

export default function PurchaseScreen() {
  const { courseId, productId, title, price } = useLocalSearchParams<{
    courseId: string;
    productId: string;
    title: string;
    price: string;
  }>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [iapReady, setIapReady] = useState(false);
  const [iapUnavailable, setIapUnavailable] = useState(false);
  const [productNotFound, setProductNotFound] = useState(false);
  const [displayPrice, setDisplayPrice] = useState<string | null>(null);
  const [isSubscription, setIsSubscription] = useState(false);
  const [reconnectKey, setReconnectKey] = useState(0);

  const effectiveProductId = productId || `course_${courseId}`;

  useEffect(() => {
    let mounted = true;
    setIapReady(false);

    (async () => {
      try {
        await connectIAP();
        if (!mounted) return;
        const product = await loadCourseProduct(effectiveProductId);
        if (!mounted) return;
        console.log('[Purchase] loadCourseProduct result:', product, 'for SKU:', effectiveProductId);
        if (!product) {
          console.warn('[Purchase] SKU not found in App Store Connect:', effectiveProductId);
          setProductNotFound(true);
        }
        setDisplayPrice(product?.displayPrice ?? (price ? `$${Number(price).toFixed(2)}` : null));
        // Use store result when available; fall back to SKU name heuristic
        setIsSubscription(product?.isSubscription ?? isSubscriptionProductId(effectiveProductId));
      } catch {
        if (!mounted) return;
        setIapUnavailable(true);
        if (price) setDisplayPrice(`$${Number(price).toFixed(2)}`);
      } finally {
        if (mounted) setIapReady(true);
      }
    })();

    return () => {
      mounted = false;
      disconnectIAP().catch(() => { });
    };
  }, [effectiveProductId, price, reconnectKey]);

  const handlePurchase = async () => {
    const { tokens, user } = useAuthStore.getState();
    if (!tokens?.accessToken || !user) {
      Alert.alert('Not logged in', 'Please log in to purchase this course.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    console.log('[Purchase] handlePurchase — effectiveProductId:', effectiveProductId, 'isSubscription:', isSubscription);
    setLoading(true);
    try {
      await purchaseCourse({
        courseId: Number(courseId),
        productId: effectiveProductId,
        isSubscription,
        price: Number(price) || 0,
        accessToken: tokens.accessToken,
      });
      console.log('[Purchase] purchaseCourse resolved — navigating to course');
      router.replace({
        pathname: '/course/[id]',
        params: { id: courseId, purchased: '1' },
      });
    } catch (err: unknown) {
      const msg = (err as Error).message;
      console.log('[Purchase] purchaseCourse rejected — msg:', msg);
      setLoading(false);
      if (msg === 'CANCELED') {
        // Reconnect to flush the stale cancelled transaction from StoreKit's queue.
        // Without this, the next requestPurchase immediately re-fires the same error.
        setReconnectKey(k => k + 1);
        return;
      }
      Alert.alert('Purchase Failed', msg ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Unlock Course' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.container}>

          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Ionicons name="lock-open-outline" size={36} color={Colors.primary} />
            </View>
            <Text variant="title" style={styles.title}>{title}</Text>
            {displayPrice && (
              <Text style={styles.price}>{displayPrice}</Text>
            )}
          </View>

          <View style={styles.features}>
            <FeatureRow icon="book-outline" text="Full access to all lessons" />
            <FeatureRow icon="infinite-outline" text="One year access" />
            <FeatureRow icon="phone-portrait-outline" text="Learn at your own pace" />
          </View>

          <View style={styles.footer}>
            {iapUnavailable ? (
              <View style={styles.iapWarning}>
                <Ionicons name="warning-outline" size={20} color={Colors.warning} />
                <Text variant="caption" color={Colors.text.secondary} style={styles.iapWarningText}>
                  In-app purchases require a native build.{'\n'}Run{' '}
                  <Text variant="caption" weight="bold" color={Colors.text.primary}>expo run:ios</Text>
                  {' '}to test purchases.
                </Text>
              </View>
            ) : productNotFound ? (
              <View style={styles.iapWarning}>
                <Ionicons name="warning-outline" size={20} color={Colors.warning} />
                <Text variant="caption" color={Colors.text.secondary} style={styles.iapWarningText}>
                  Product not found in App Store Connect.{'\n'}
                  SKU: <Text variant="caption" weight="bold" color={Colors.text.primary}>{effectiveProductId}</Text>
                </Text>
              </View>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading || !iapReady}
                onPress={handlePurchase}
              >
                {loading ? 'Processing...' : displayPrice ? `Unlock — ${displayPrice}` : 'Unlock Course'}
              </Button>
            )}
            <Text variant="caption" color={Colors.text.muted} style={styles.terms}>
              {`Payment processed securely via ${Platform.OS === 'ios' ? 'App Store' : 'Google Play'}. One-time purchase.`}
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </>
  );
}

function FeatureRow({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text variant="body" color={Colors.text.secondary} style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  price: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  features: {
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    gap: Spacing.md,
  },
  iapWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  iapWarningText: {
    flex: 1,
    lineHeight: 18,
  },
  terms: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
