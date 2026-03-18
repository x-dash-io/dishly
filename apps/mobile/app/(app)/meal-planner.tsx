import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, FlatList, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';
import {
  useCurrentMealPlan, useAddMealPlanItem, useRemoveMealPlanItem,
  type MealType, type MealPlanDay, type MealPlanItem,
} from '../../hooks/useMealPlanner';
import { useApiClient } from '../../src/lib/api-client';
import type { RecipeCardItem } from '@dishly/types';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};
const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function getWeekDates(weekStart: string): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
}

function getTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

// Recipe picker sheet — search + select
function RecipePicker({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (recipe: RecipeCardItem) => void;
  onClose: () => void;
}) {
  const api = useApiClient();
  const sheetRef = useRef<BottomSheet>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RecipeCardItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
      setQuery('');
      setResults([]);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.request<{ recipes: RecipeCardItem[] }>(
          'GET', `/feed/explore?q=${encodeURIComponent(query.trim())}&limit=20`
        );
        setResults(res.recipes ?? []);
      } catch { setResults([]); }
      finally { setIsSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={onClose} />
    ), [onClose]
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['65%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.sheetHandle}
    >
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>Choose a recipe</Text>
      </View>

      <View style={styles.pickerSearchWrap}>
        <View style={styles.pickerSearchBar}>
          <AppIcon name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.pickerInput}
            placeholder="Search recipes…"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.pickerList}>
        {query.trim().length < 2 ? (
          <Text style={styles.pickerHint}>Type at least 2 characters to search</Text>
        ) : results.length === 0 && !isSearching ? (
          <Text style={styles.pickerHint}>No recipes found</Text>
        ) : (
          results.map(recipe => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.pickerItem}
              onPress={() => onSelect(recipe)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: recipe.cover_image_url ?? recipe.hero_image_url ?? undefined }}
                style={styles.pickerThumb}
                contentFit="cover"
              />
              <View style={styles.pickerItemInfo}>
                <Text style={styles.pickerItemTitle} numberOfLines={2}>{recipe.title}</Text>
                <Text style={styles.pickerItemMeta}>
                  {(recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0)} min · {recipe.difficulty}
                </Text>
              </View>
              <AppIcon name="add" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          ))
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

export default function MealPlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const todayIdx = getTodayIndex();
  const scrollRef = useRef<ScrollView>(null);
  const daySectionRefs = useRef<Record<number, number>>({});

  const { data: plan, isLoading } = useCurrentMealPlan();
  const { mutate: addItem, isPending: isAdding } = useAddMealPlanItem();
  const { mutate: removeItem } = useRemoveMealPlanItem();

  const weekStart = plan?.week_start_date ?? '';
  const weekDates = useMemo(() => weekStart ? getWeekDates(weekStart) : [], [weekStart]);

  // Recipe picker state
  const [pickerTarget, setPickerTarget] = useState<{ dayIdx: number; mealType: MealType; replaceId?: string } | null>(null);

  const openPicker = (dayIdx: number, mealType: MealType, replaceId?: string) => {
    setPickerTarget({ dayIdx, mealType, replaceId });
  };

  const handlePickerSelect = (recipe: RecipeCardItem) => {
    if (!pickerTarget || !weekStart) return;
    addItem({
      recipe_id: recipe.id,
      day_of_week: pickerTarget.dayIdx,
      meal_type: pickerTarget.mealType,
      week_start_date: weekStart,
    });
    setPickerTarget(null);
  };

  const scrollToDay = (dayIdx: number) => {
    const y = daySectionRefs.current[dayIdx] ?? 0;
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color={COLORS.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>This week</Text>
        <TouchableOpacity style={styles.groceryBtn} onPress={() => router.push('/grocery-list')}>
          <AppIcon name="cart" size={22} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Week strip */}
      <View style={styles.weekStrip}>
        {DAY_SHORT.map((label, i) => {
          const isToday = i === todayIdx;
          const dateNum = weekDates[i]?.getUTCDate();
          return (
            <TouchableOpacity
              key={label}
              style={styles.dayPill}
              onPress={() => scrollToDay(i)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayShort, isToday && styles.dayShortToday]}>{label}</Text>
              <View style={[styles.dateBubble, isToday && styles.dateBubbleToday]}>
                <Text style={[styles.dateNum, isToday && styles.dateNumToday]}>
                  {dateNum ?? ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 7 }, (_, i) => i).map(dayIdx => {
            const day: MealPlanDay | undefined = plan?.days[dayIdx];
            if (!day) return null;
            const dayDate = weekDates[dayIdx];
            const dateLabel = dayDate
              ? dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })
              : day.label;

            return (
              <View
                key={dayIdx}
                onLayout={e => { daySectionRefs.current[dayIdx] = e.nativeEvent.layout.y; }}
              >
                {/* Day header */}
                <View style={styles.daySectionHeader}>
                  <Text style={styles.daySectionLabel}>{dateLabel}</Text>
                </View>

                {/* Meal slots */}
                <View style={styles.daySectionBody}>
                  {MEALS.map(mealType => {
                    const slot: MealPlanItem | null = day.meals[mealType];
                    return (
                      <View key={mealType} style={styles.mealRow}>
                        <Text style={styles.mealTypeLabel}>{MEAL_LABELS[mealType]}</Text>

                        {slot ? (
                          /* Filled slot */
                          <Pressable
                            style={styles.filledSlot}
                            onPress={() => router.push(`/recipe/${slot.recipe.id}`)}
                            onLongPress={() => openPicker(dayIdx, mealType, slot.id)}
                            delayLongPress={400}
                          >
                            <Image
                              source={{ uri: slot.recipe.cover_image_url ?? slot.recipe.hero_image_url ?? undefined }}
                              style={styles.slotThumb}
                              contentFit="cover"
                            />
                            <View style={styles.slotInfo}>
                              <Text style={styles.slotTitle} numberOfLines={2}>{slot.recipe.title}</Text>
                              <Text style={styles.slotMeta}>
                                {((slot.recipe.prep_minutes ?? 0) + (slot.recipe.cook_minutes ?? 0))} min
                                {slot.recipe.difficulty ? ` · ${slot.recipe.difficulty.charAt(0).toUpperCase() + slot.recipe.difficulty.slice(1)}` : ''}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.removeBtn}
                              onPress={() => removeItem(slot.id)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <AppIcon name="close" size={16} color={COLORS.textMuted} />
                            </TouchableOpacity>
                          </Pressable>
                        ) : (
                          /* Empty slot */
                          <TouchableOpacity
                            style={styles.emptySlot}
                            onPress={() => openPicker(dayIdx, mealType)}
                            activeOpacity={0.7}
                          >
                            <AppIcon name="add" size={16} color={COLORS.textMuted} />
                            <Text style={styles.emptySlotText}>Add a recipe</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Recipe Picker Sheet */}
      <RecipePicker
        visible={!!pickerTarget}
        onSelect={handlePickerSelect}
        onClose={() => setPickerTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.navDark, paddingBottom: 12, paddingHorizontal: 16,
  },
  backBtn: { padding: 8, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textInverse },
  groceryBtn: { padding: 8, width: 40, alignItems: 'flex-end' },
  weekStrip: {
    flexDirection: 'row', backgroundColor: COLORS.navDark,
    paddingHorizontal: 8, paddingBottom: 14,
  },
  dayPill: { flex: 1, alignItems: 'center', gap: 4 },
  dayShort: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.45)' },
  dayShortToday: { color: 'rgba(255,255,255,0.95)' },
  dateBubble: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dateBubbleToday: { backgroundColor: COLORS.primary },
  dateNum: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  dateNumToday: { color: COLORS.textInverse, fontWeight: '700' },
  scroll: { flex: 1 },
  daySectionHeader: {
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  daySectionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.mahogany },
  daySectionBody: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  mealRow: { gap: 6 },
  mealTypeLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  filledSlot: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  slotThumb: { width: 72, height: 64 },
  slotInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  slotTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20 },
  slotMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  removeBtn: { padding: 14 },
  emptySlot: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  emptySlotText: { fontSize: 14, color: COLORS.textMuted },
  // Bottom sheet
  sheetBg: { backgroundColor: COLORS.background, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetHandle: { backgroundColor: COLORS.border, width: 36 },
  pickerHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  pickerSearchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  pickerSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 12,
    paddingHorizontal: 12, height: 44,
  },
  pickerInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  pickerList: { paddingHorizontal: 16, paddingBottom: 32 },
  pickerHint: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14, paddingVertical: 40 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  pickerThumb: { width: 56, height: 48, borderRadius: 8 },
  pickerItemInfo: { flex: 1 },
  pickerItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  pickerItemMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
