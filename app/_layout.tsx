import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Colors } from '@/src/shared/theme';

export default function RootLayout() {
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
        <Stack.Screen name="course/purchase" options={{ presentation: 'modal' }} />
        <Stack.Screen name="lesson/[id]" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
