import { View, Text, StyleSheet } from 'react-native';

export default function TabPlaceholder({ name }: { name: string }) {
  return (
    <View style={styles.container}>
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
    backgroundColor: '#FDF6ED',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5E3C2C',
  },
  subtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
});
