import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { UserProfileView } from '../../../components/profile/UserProfileView';
import { useApiClient } from '../../../src/lib/api-client';
import { COLORS } from '../../../constants/colors';

export default function ProfileTab() {
  const api = useApiClient();

  const { data: me, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.request<{ username: string }>('GET', '/auth/me'),
    staleTime: Infinity,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" translucent={false} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!me?.username) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" translucent={false} />
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" translucent={false} />
      <UserProfileView username={me.username} isOwnProfile={true} showBackButton={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  }
});
