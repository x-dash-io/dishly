import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FocusAwareStatusBar } from '../../../src/components/ui/FocusAwareStatusBar';
import { COLORS } from '../../../constants/colors';

export default function SavedScreen() {
  return (
    <View style={styles.container}>
      <FocusAwareStatusBar />
      <Text style={styles.text}>Saved Screen</Text>
      <Text style={styles.subtext}>Coming Soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});
