import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/src/shared/theme';
import { ONBOARDING_COMPLETE_KEY } from './onboarding';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useProgressStore } from '@/src/features/lessons/store/progressStore';
import { useSubscriptionStore } from '@/src/features/subscriptions/store/subscriptionStore';
import { syncSubscription } from '@/src/features/subscriptions/service';
import { useQuizScoreStore } from '@/src/features/quizzes/store/quizScoreStore';
import { fetchAndMergeCloudProgress } from '@/src/features/progress/service';

export default function Index() {
  const router = useRouter();
  const { hydrate, isAuthenticated, isGuest } = useAuthStore();

  useEffect(() => {
    (async () => {
      // Auth MUST resolve first: progressStore/quizScoreStore read the
      // active user identity (see src/shared/utils/identityNamespace.ts) at
      // the moment their own hydrate() runs, to load the right namespaced
      // data. Running them in the same Promise.all as auth would race —
      // they could read the still-default "no user" identity before
      // hydrate() finishes restoring the real one.
      await hydrate();
      await Promise.all([
        useProgressStore.getState().hydrate(),
        useSubscriptionStore.getState().hydrate(),
        useQuizScoreStore.getState().hydrate(),
      ]);
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

      if (!onboardingDone) {
        router.replace('/onboarding');
        return;
      }

      const { isAuthenticated: authed, isGuest: guest, tokens } = useAuthStore.getState();

      // Fire-and-forget: an existing subscriber's entitlement should restore
      // automatically on relaunch, not only after visiting the Plan screen.
      // Not awaited — this shouldn't add a network round trip to every cold
      // start; the store updates in the background and any screen reading it
      // (subscriptionStore's `status` distinguishes "still syncing" from
      // "confirmed no subscription", so nothing flashes as locked meanwhile).
      if (authed && tokens?.accessToken) {
        syncSubscription(tokens.accessToken).catch(() => {});
        // Cloud progress (quiz scores + lesson completion) restores the
        // same way — see src/features/progress/service.ts. Also fire-and-
        // forget for the same reason: shouldn't add a round trip to every
        // cold start, and the local namespaced stores already hydrated
        // above render correctly in the meantime.
        fetchAndMergeCloudProgress(tokens.accessToken).catch(() => {});
      }

      if (authed || guest) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    })();
  }, []);

  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
