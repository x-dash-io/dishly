import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { tokenCache } from '../src/lib/token-cache';
import { queryClient } from '../src/lib/query-client';
import { env } from '../src/config/env';

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
