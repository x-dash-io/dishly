import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { FocusAwareStatusBar } from '../../src/components/ui/FocusAwareStatusBar';
import { COLORS } from '../../constants/colors';

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6ED' }}>
        <FocusAwareStatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />
        <ActivityIndicator size="large" color="#E8531A" />
      </View>
    );
  }

  return (
    <>
      <FocusAwareStatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="create" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
