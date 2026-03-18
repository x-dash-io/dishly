import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!me?.username) {
    return null;
  }

  return <UserProfileView username={me.username} isOwnProfile={true} showBackButton={false} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  }
});
