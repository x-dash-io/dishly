import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FocusAwareStatusBar } from '../../../src/components/ui/FocusAwareStatusBar';

export default function CreateTab() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main create flow immediately
    router.replace('/create');
  }, []);

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF6ED',
  },
});
