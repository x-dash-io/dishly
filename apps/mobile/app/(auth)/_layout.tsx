import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { FocusAwareStatusBar } from '../../src/components/ui/FocusAwareStatusBar';
import { COLORS } from '../../constants/colors';

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  // Only redirect if signed in AND not on the onboarding screen
  // This allows signed-in but non-onboarded users to stay on the onboarding page
  if (isSignedIn) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="sign-in" redirect />
        <Stack.Screen name="sign-up" redirect />
      </Stack>
    );
  }

  return (
    <>
      <FocusAwareStatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
