import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;

// Generate dates for current week starting Monday
function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function MealPlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const weekDates = getCurrentWeekDates();
  const today = new Date();
  const todayIdx = (() => {
    const d = today.getDay();
    return d === 0 ? 6 : d - 1;
  })();

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color={COLORS.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>This week</Text>
        <TouchableOpacity
          style={styles.groceryBtn}
          onPress={() => router.push('/grocery-list')}
          activeOpacity={0.8}
        >
          <AppIcon name="cart" size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Week strip */}
      <View style={styles.weekStrip}>
        {DAYS.map((day, i) => {
          const date = weekDates[i];
          const isToday = i === todayIdx;
          return (
            <View key={day} style={styles.dayPill}>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>{day}</Text>
              <View style={[styles.dateBubble, isToday && styles.dateBubbleActive]}>
                <Text style={[styles.dateNum, isToday && styles.dateNumActive]}>
                  {date.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Coming soon card */}
        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonIcon}>
            <AppIcon name="calendar" size={32} color={COLORS.aiPurple} />
          </View>
          <Text style={styles.comingSoonTitle}>Meal planner coming soon</Text>
          <Text style={styles.comingSoonText}>
            Schedule recipes for every day of the week, then auto-generate your grocery list.
            This feature is in active development.
          </Text>
        </View>

        {/* Preview of the planner grid — visual stub */}
        {DAYS.map((day, dayIdx) => (
          <View key={day} style={styles.daySection}>
            <Text style={styles.daySectionTitle}>
              {day}, {weekDates[dayIdx].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            {MEALS.map((meal) => (
              <TouchableOpacity
                key={meal}
                style={styles.mealSlot}
                activeOpacity={0.7}
                onPress={() => {}}
              >
                <View style={styles.mealSlotLeft}>
                  <Text style={styles.mealLabel}>{meal}</Text>
                </View>
                <View style={styles.addSlot}>
                  <AppIcon name="add" size={16} color={COLORS.textMuted} />
                  <Text style={styles.addSlotText}>Add recipe</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
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
  groceryBtn: { padding: 8, width: 40, alignItems: 'flex-end' },
  weekStrip: {
    flexDirection: 'row', backgroundColor: COLORS.navDark,
    paddingHorizontal: 12, paddingBottom: 14, justifyContent: 'space-between',
  },
  dayPill: { alignItems: 'center', gap: 4, flex: 1 },
  dayLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  dayLabelActive: { color: 'rgba(255,255,255,0.95)' },
  dateBubble: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  dateBubbleActive: { backgroundColor: COLORS.primary },
  dateNum: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  dateNumActive: { color: COLORS.textInverse, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  comingSoonCard: {
    backgroundColor: COLORS.aiPurpleLight,
    borderRadius: 16, padding: 20, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: COLORS.aiPurple + '30',
    marginBottom: 8,
  },
  comingSoonIcon: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: COLORS.aiPurple + '18',
    justifyContent: 'center', alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 17, fontWeight: '700', color: COLORS.aiPurple, textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 13, color: COLORS.aiPurple, textAlign: 'center', lineHeight: 20,
  },
  daySection: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  daySectionTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.mahogany,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  mealSlot: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border + '80',
  },
  mealSlotLeft: {},
  mealLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  addSlot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addSlotText: { fontSize: 12, color: COLORS.textMuted },
});
