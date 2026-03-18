import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { COLORS } from '../../constants/colors';

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  // If already signed in redirect to app — unless hitting onboarding
  if (isSignedIn) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <>
      {/* Auth screens sit on cream background — need dark icons */}
      <StatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
