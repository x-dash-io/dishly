import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SectionList,
  ActivityIndicator, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';
import { useGroceryList, type GroceryItem, type GroceryCategory } from '../../hooks/useMealPlanner';

const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce:  'Produce',
  proteins: 'Proteins',
  dairy:    'Dairy',
  pantry:   'Pantry',
  other:    'Other',
};

const CATEGORY_ORDER: GroceryCategory[] = ['produce', 'proteins', 'dairy', 'pantry', 'other'];

export default function GroceryListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useGroceryList();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (name: string) =>
    setChecked(prev => {
      const s = new Set(prev);
      s.has(name) ? s.delete(name) : s.add(name);
      return s;
    });

  // Build SectionList sections from categories
  const sections = data
    ? CATEGORY_ORDER
        .map(cat => ({
          key: cat,
          title: CATEGORY_LABELS[cat],
          data: (data.categories[cat] ?? []).filter(i => !checked.has(i.name)),
        }))
        .filter(s => s.data.length > 0)
    : [];

  const gotItItems: GroceryItem[] = data
    ? CATEGORY_ORDER.flatMap(cat => (data.categories[cat] ?? []).filter(i => checked.has(i.name)))
    : [];

  const totalUnchecked = sections.reduce((n, s) => n + s.data.length, 0);

  const handleShare = () => {
    if (!data) return;
    const lines: string[] = [`Dishly Grocery List — Week of ${data.week_start_date}\n`];
    for (const cat of CATEGORY_ORDER) {
      const items = data.categories[cat] ?? [];
      if (!items.length) continue;
      lines.push(`${CATEGORY_LABELS[cat]}:`);
      for (const item of items) {
        const qty = [item.quantity, item.unit].filter(Boolean).join(' ');
        lines.push(`• ${item.name}${qty ? ` ${qty}` : ''}`);
      }
      lines.push('');
    }
    Share.share({ title: 'Dishly Grocery List', message: lines.join('\n') });
  };

  const renderItem = ({ item }: { item: GroceryItem }) => {
    const isChecked = checked.has(item.name);
    const qty = [item.quantity, item.unit].filter(Boolean).join(' ');
    return (
      <TouchableOpacity style={styles.row} onPress={() => toggle(item.name)} activeOpacity={0.75}>
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
          {isChecked && <AppIcon name="check" size={11} color={COLORS.textInverse} />}
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowName, isChecked && styles.strikethrough]}>{item.name}</Text>
          {qty ? <Text style={styles.rowQty}>{qty}</Text> : null}
        </View>
        {item.recipe_count > 1 && (
          <Text style={styles.recipeCount}>({item.recipe_count} recipes)</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={false} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color={COLORS.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Grocery list</Text>
          {data?.week_start_date && (
            <Text style={styles.headerSub}>Week of {data.week_start_date}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.shareBtn, !data?.total_recipes && styles.disabled]}
          onPress={handleShare}
          disabled={!data?.total_recipes}
        >
          <AppIcon name="share" size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      ) : !data?.total_recipes ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <AppIcon name="cart" size={36} color={COLORS.secondary} />
          </View>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>
            Add recipes to your meal planner and the ingredients will appear here automatically.
          </Text>
          <TouchableOpacity style={styles.plannerBtn} onPress={() => router.push('/meal-planner')}>
            <AppIcon name="calendar" size={16} color={COLORS.textInverse} />
            <Text style={styles.plannerBtnText}>Open meal planner</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {section.title.toUpperCase()} ({section.data.length})
              </Text>
              <View style={styles.sectionDivider} />
            </View>
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 48 }]}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listSummary}>
                {totalUnchecked} item{totalUnchecked !== 1 ? 's' : ''} · {data.total_recipes} recipe{data.total_recipes !== 1 ? 's' : ''}
              </Text>
              {checked.size > 0 && (
                <TouchableOpacity onPress={() => setChecked(new Set())}>
                  <Text style={styles.clearBtn}>Clear checked</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            gotItItems.length > 0 ? (
              <View style={styles.gotItSection}>
                <Text style={styles.gotItLabel}>Got it ({gotItItems.length})</Text>
                {gotItItems.map(item => {
                  const qty = [item.quantity, item.unit].filter(Boolean).join(' ');
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.row, styles.rowDone]}
                      onPress={() => toggle(item.name)}
                    >
                      <View style={[styles.checkbox, styles.checkboxChecked]}>
                        <AppIcon name="check" size={11} color={COLORS.textInverse} />
                      </View>
                      <View style={styles.rowContent}>
                        <Text style={[styles.rowName, styles.strikethrough]}>{item.name}</Text>
                        {qty ? <Text style={styles.rowQty}>{qty}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.navDark, paddingBottom: 14, paddingHorizontal: 16,
  },
  backBtn: { padding: 8, width: 40 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textInverse },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  shareBtn: { padding: 8, width: 40, alignItems: 'flex-end' },
  disabled: { opacity: 0.35 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  plannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  plannerBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.textInverse },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12,
  },
  listSummary: { fontSize: 13, color: COLORS.textSecondary },
  clearBtn: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  sectionHeader: { paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8 },
  sectionDivider: { height: 1, backgroundColor: COLORS.border, marginTop: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  rowDone: { opacity: 0.5 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  rowContent: { flex: 1 },
  rowName: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  rowQty: { fontSize: 13, color: COLORS.textSecondary, marginTop: 1 },
  recipeCount: { fontSize: 11, color: COLORS.textMuted },
  gotItSection: { marginTop: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  gotItLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: 4 },
});
