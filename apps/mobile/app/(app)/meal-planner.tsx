import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';
import { useMealPlan, useRemoveMealPlanItem, type MealPlanItem } from '../../hooks/useMealPlanner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export default function MealPlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const weekDates = getWeekDates();
  const todayIdx = getTodayIndex();
  const [selectedDay, setSelectedDay] = useState(todayIdx);

  const { data: plan, isLoading } = useMealPlan();
  const { mutate: removeItem, isPending: isRemoving } = useRemoveMealPlanItem();

  // Get items for the selected day
  const dayItems = plan?.items.filter(i => i.day_of_week === selectedDay) ?? [];
  const getSlot = (meal: string): MealPlanItem | undefined =>
    dayItems.find(i => i.meal_type === meal);

  const handleRemove = (item: MealPlanItem) => {
    Alert.alert(
      'Remove from plan',
      `Remove ${item.recipe?.title ?? 'this recipe'} from ${MEAL_LABELS[item.meal_type]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItem(item.id),
        },
      ]
    );
  };

  const handleAddSlot = (mealType: string) => {
    // Navigate to recipe picker — stub that pushes to explore with callback
    Alert.alert(
      'Add recipe',
      `Search for a recipe to add to ${MEAL_LABELS[mealType]}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Browse recipes',
          onPress: () => router.push('/(app)/(tabs)/explore'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color={COLORS.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Planner</Text>
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
          const isToday = i === todayIdx;
          const isSelected = i === selectedDay;
          return (
            <TouchableOpacity
              key={day}
              style={styles.dayPill}
              onPress={() => setSelectedDay(i)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayLabel, (isToday || isSelected) && styles.dayLabelActive]}>
                {day}
              </Text>
              <View style={[
                styles.dateBubble,
                isSelected && styles.dateBubbleSelected,
                isToday && !isSelected && styles.dateBubbleToday,
              ]}>
                <Text style={[
                  styles.dateNum,
                  (isSelected || isToday) && styles.dateNumActive,
                ]}>
                  {weekDates[i].getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day label */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderText}>
          {DAYS[selectedDay]}, {weekDates[selectedDay].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </Text>
        {plan?.items.filter(i => i.day_of_week === selectedDay).length === 0 && (
          <Text style={styles.dayHeaderSub}>Nothing planned</Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {MEALS.map((meal) => {
            const slot = getSlot(meal);
            return (
              <View key={meal} style={styles.mealSection}>
                <Text style={styles.mealLabel}>{MEAL_LABELS[meal]}</Text>

                {slot?.recipe ? (
                  /* Filled slot */
                  <TouchableOpacity
                    style={styles.recipeCard}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/recipe/${slot.recipe!.id}`)}
                    onLongPress={() => handleRemove(slot)}
                  >
                    <Image
                      source={{ uri: slot.recipe.cover_image_url ?? slot.recipe.hero_image_url ?? undefined }}
                      style={styles.recipeThumb}
                      contentFit="cover"
                    />
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeTitle} numberOfLines={2}>
                        {slot.recipe.title}
                      </Text>
                      {slot.recipe.cook_minutes != null && (
                        <View style={styles.recipeMeta}>
                          <AppIcon name="clock" size={12} color={COLORS.textMuted} />
                          <Text style={styles.recipeMetaText}>{slot.recipe.cook_minutes} min</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemove(slot)}
                      disabled={isRemoving}
                    >
                      <AppIcon name="close" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ) : (
                  /* Empty slot */
                  <TouchableOpacity
                    style={styles.emptySlot}
                    activeOpacity={0.7}
                    onPress={() => handleAddSlot(meal)}
                  >
                    <AppIcon name="add" size={18} color={COLORS.textMuted} />
                    <Text style={styles.emptySlotText}>Add recipe</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
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
    paddingHorizontal: 8, paddingBottom: 16, justifyContent: 'space-between',
  },
  dayPill: { alignItems: 'center', gap: 4, flex: 1 },
  dayLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.45)' },
  dayLabelActive: { color: 'rgba(255,255,255,0.95)' },
  dateBubble: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dateBubbleSelected: { backgroundColor: COLORS.primary },
  dateBubbleToday: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  dateNum: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  dateNumActive: { color: COLORS.textInverse, fontWeight: '700' },
  dayHeader: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  dayHeaderText: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  dayHeaderSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  mealSection: { gap: 8 },
  mealLabel: { fontSize: 13, fontWeight: '700', color: COLORS.mahogany, textTransform: 'uppercase', letterSpacing: 0.5 },
  recipeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  recipeThumb: { width: 80, height: 72 },
  recipeInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  recipeTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },
  recipeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  recipeMetaText: { fontSize: 12, color: COLORS.textMuted },
  removeBtn: { padding: 12 },
  emptySlot: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  emptySlotText: { fontSize: 14, color: COLORS.textMuted },
});
