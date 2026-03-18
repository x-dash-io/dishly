import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/colors';

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <StatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.navDark} translucent={false} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="cook/[id]" />
        <Stack.Screen name="user/[username]" />
        <Stack.Screen name="ai-generate" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="meal-planner" />
        <Stack.Screen name="grocery-list" />
        <Stack.Screen name="collection/[id]" />
        <Stack.Screen name="create" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
