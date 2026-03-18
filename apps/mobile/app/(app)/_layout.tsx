import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Slot } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6ED' }}>
        <ActivityIndicator size="large" color="#E8531A" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Slot />;
}
