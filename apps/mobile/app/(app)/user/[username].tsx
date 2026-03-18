import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { UserProfileView } from '../../../components/profile/UserProfileView';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  
  return <UserProfileView username={username} showBackButton={true} />;
}
