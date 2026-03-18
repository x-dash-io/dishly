import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';

export default function GroceryListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleShare = () => {
    Share.share({
      title: 'Dishly Grocery List',
      message: 'My grocery list from Dishly — https://dishly.app',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={false} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color={COLORS.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grocery list</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <AppIcon name="share" size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <AppIcon name="cart" size={32} color={COLORS.secondary} />
          </View>
          <Text style={styles.cardTitle}>Auto grocery list</Text>
          <Text style={styles.cardText}>
            Once you add recipes to your meal planner, we'll automatically
            aggregate all ingredients into a categorised grocery list — ready to share.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.navDark, paddingBottom: 14, paddingHorizontal: 16,
  },
  backBtn: { padding: 8, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textInverse },
  shareBtn: { padding: 8, width: 40, alignItems: 'flex-end' },
  body: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border,
    width: '100%',
  },
  cardIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  cardText: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22,
  },
});
