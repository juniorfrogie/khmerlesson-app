import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Colors } from '@/src/shared/theme';
import { logger, newTraceId, flushLogs, startLogFlushing } from '@/src/shared/utils/logger';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { fetchAndMergeCloudProgress } from '@/src/features/progress/service';
import { ErrorBoundary } from '@/src/shared/components/ErrorBoundary';

// Registered once at module load (a process-wide hook, not tied to
// RootLayout's mount lifecycle) — decided against adding a dedicated crash
// SDK this cycle (see context/progress-tracker.md's Observability section),
// so this reuses the existing debug_logs pipeline instead. Catches what the
// ErrorBoundary below can't: errors in event handlers, async code, timers —
// the actual "hard crash" case the pipeline was previously blind to (it
// only flushed on a 15s interval, which a crash can pre-empt). Chains to
// the previous handler so default RN behavior (dev red screen, prod crash)
// is preserved — this only adds logging in front of it, never suppresses it.
type GlobalErrorHandler = (error: Error, isFatal?: boolean) => void;
const globalWithErrorUtils = global as typeof global & {
  ErrorUtils?: {
    getGlobalHandler: () => GlobalErrorHandler;
    setGlobalHandler: (handler: GlobalErrorHandler) => void;
  };
};
if (globalWithErrorUtils.ErrorUtils) {
  const previousHandler = globalWithErrorUtils.ErrorUtils.getGlobalHandler();
  globalWithErrorUtils.ErrorUtils.setGlobalHandler((error, isFatal) => {
    const traceId = newTraceId();
    logger.error(traceId, 'uncaught_exception', {
      message: error.message,
      stack: error.stack,
      isFatal: !!isFatal,
    });
    flushLogs();
    previousHandler?.(error, isFatal);
  });
}

export default function RootLayout() {
  const router = useRouter();

  // A dead session (e.g. syncSubscription's own signOut() when a token
  // fails definitively — see src/features/subscriptions/service.ts) used to
  // only redirect to login once the user happened to land on a screen that
  // separately checked isAuthenticated (me.tsx) or a forbiddenReason
  // (course/lesson screens). Neither Home, Explore, nor the Quiz tab has
  // such a check, so a sign-out that fired while the user was on one of
  // those left them stuck on a screen with cleared auth state instead of
  // being routed to login. Subscribing here catches every transition from
  // authenticated to fully signed-out, regardless of which screen is
  // active. Only fires on an actual transition (prevState really was
  // authenticated) — not on the initial default state at boot, before
  // app/index.tsx's own hydrate()-then-route logic has run.
  useEffect(() => {
    return useAuthStore.subscribe((state, prevState) => {
      if (prevState.isAuthenticated && !state.isAuthenticated && !state.isGuest) {
        router.replace('/auth/login');
      }
    });
  }, [router]);

  useEffect(() => {
    startLogFlushing();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        useAuthStore.getState().revalidateIfExpiring().catch(() => {});
        // Any quiz/lesson completions made while offline (or backgrounded
        // through a transient failure) queue locally — see
        // src/features/progress/service.ts. Foreground return is a
        // reasonable point to assume connectivity may have come back.
        // Fetch-and-merge cloud state first (same ordering as cold start,
        // app/index.tsx) before flushing the local queue — otherwise a
        // locally-queued item could overwrite a newer completion synced
        // from another device in the meantime, since the queue's own
        // staleness check only has local knowledge.
        const accessToken = useAuthStore.getState().tokens?.accessToken;
        if (accessToken) fetchAndMergeCloudProgress(accessToken).catch(() => {});
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <>
      <ErrorBoundary>
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
      </ErrorBoundary>
      <StatusBar style="dark" />
    </>
  );
}
