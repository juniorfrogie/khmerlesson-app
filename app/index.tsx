import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/src/shared/theme';
import { ONBOARDING_COMPLETE_KEY } from './onboarding';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useProgressStore } from '@/src/features/lessons/store/progressStore';

export default function Index() {
  const router = useRouter();
  const { hydrate, isAuthenticated, isGuest } = useAuthStore();

  useEffect(() => {
    (async () => {
      await Promise.all([hydrate(), useProgressStore.getState().hydrate()]);
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

      if (!onboardingDone) {
        router.replace('/onboarding');
        return;
      }

      const { isAuthenticated: authed, isGuest: guest } = useAuthStore.getState();
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
