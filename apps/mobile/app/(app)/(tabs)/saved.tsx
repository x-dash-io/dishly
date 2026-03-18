import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';

export default function SavedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved</Text>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => router.push('/meal-planner')}
            activeOpacity={0.8}
          >
            <AppIcon name="calendar" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.emptyState}>
        <View style={styles.iconWrap}>
          <AppIcon name="saved" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No saved recipes yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the bookmark on any recipe to save it here for later.
        </Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/(app)/(tabs)/explore')}
        >
          <AppIcon name="explore" size={16} color={COLORS.textInverse} />
          <Text style={styles.exploreBtnText}>Explore recipes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { backgroundColor: COLORS.navDark },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: COLORS.navDark,
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  calendarBtn: { padding: 6 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '700', color: COLORS.textPrimary,
    textAlign: 'center', marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: 24,
    paddingVertical: 14, borderRadius: 14,
  },
  exploreBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textInverse },
});
