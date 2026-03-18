import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { tokenCache } from '../src/lib/token-cache';
import { queryClient } from '../src/lib/query-client';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { env } from '../src/config/env';
import { useEffect } from 'react';
import { registerForPushNotifications, useNotificationNavigation } from '../lib/notifications';
import { useApiClient } from '../src/lib/api-client';

function NotificationBootstrap() {
  const { isSignedIn } = useAuth();
  const api = useApiClient();
  useNotificationNavigation();

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await api.request('POST', '/users/me/push-token', { token });
        }
      } catch {
        // Push registration failure is non-fatal — silently ignore
      }
    })();
  }, [isSignedIn]);

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
        <ClerkLoaded>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <NotificationBootstrap />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
              </Stack>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
