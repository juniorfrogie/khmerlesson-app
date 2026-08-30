import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Colors } from '@/src/shared/theme';
import { startLogFlushing } from '@/src/shared/utils/logger';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { flushPendingProgress } from '@/src/features/progress/service';

export default function RootLayout() {
  useEffect(() => {
    startLogFlushing();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        useAuthStore.getState().revalidateIfExpiring().catch(() => {});
        // Any quiz/lesson completions made while offline (or backgrounded
        // through a transient failure) queue locally — see
        // src/features/progress/service.ts. Foreground return is a
        // reasonable point to assume connectivity may have come back.
        const accessToken = useAuthStore.getState().tokens?.accessToken;
        if (accessToken) flushPendingProgress(accessToken).catch(() => {});
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.primary,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.surface },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="subscription/index" options={{ presentation: 'modal', title: 'Subscribe' }} />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="quiz/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="quiz-guide" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
