import { COLORS } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';

export default function TabPlaceholder({ name }: { name: string }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={false} />
      <Text style={styles.text}>{name} Screen</Text>
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
    color: COLORS.mahogany,
  },
  subtext: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
