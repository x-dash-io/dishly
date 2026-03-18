import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';
import { useGroceryList, type GroceryItem } from '../../hooks/useMealPlanner';

export default function GroceryListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useGroceryList();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleChecked = (name: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleShare = () => {
    if (!data?.items.length) return;
    const lines = data.items.map(i => {
      const qty = [i.quantity, i.unit].filter(Boolean).join(' ');
      return qty ? `• ${i.name} — ${qty}` : `• ${i.name}`;
    });
    Share.share({
      title: 'Dishly Grocery List',
      message: `My grocery list for the week:\n\n${lines.join('\n')}`,
    });
  };

  const unchecked = data?.items.filter(i => !checked.has(i.name)) ?? [];
  const done = data?.items.filter(i => checked.has(i.name)) ?? [];

  const renderItem = ({ item }: { item: GroceryItem }) => {
    const isChecked = checked.has(item.name);
    const qty = [item.quantity, item.unit].filter(Boolean).join(' ');
    return (
      <TouchableOpacity
        style={[styles.item, isChecked && styles.itemChecked]}
        onPress={() => toggleChecked(item.name)}
        activeOpacity={0.75}
      >
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
          {isChecked && <AppIcon name="check" size={12} color={COLORS.textInverse} />}
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
            {item.name}
          </Text>
          {qty ? <Text style={styles.itemQty}>{qty}</Text> : null}
        </View>
        {item.recipes.length > 0 && (
          <Text style={styles.itemSource} numberOfLines={1}>
            {item.recipes.slice(0, 2).join(', ')}
          </Text>
        )}
      </TouchableOpacity>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Grocery list</Text>
          {data?.week_start && (
            <Text style={styles.headerSub}>Week of {data.week_start}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.shareBtn, (!data?.items.length) && styles.shareBtnDisabled]}
          onPress={handleShare}
          disabled={!data?.items.length}
        >
          <AppIcon name="share" size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : !data?.items.length ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <AppIcon name="cart" size={36} color={COLORS.secondary} />
          </View>
          <Text style={styles.emptyTitle}>No ingredients yet</Text>
          <Text style={styles.emptyText}>
            Add recipes to your meal planner and they'll appear here automatically.
          </Text>
          <TouchableOpacity
            style={styles.plannerBtn}
            onPress={() => router.push('/meal-planner')}
            activeOpacity={0.85}
          >
            <AppIcon name="calendar" size={16} color={COLORS.textInverse} />
            <Text style={styles.plannerBtnText}>Open meal planner</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList<GroceryItem>
          data={[...unchecked, ...done]}
          renderItem={renderItem}
          keyExtractor={item => item.name}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listCount}>
                {unchecked.length} item{unchecked.length !== 1 ? 's' : ''} remaining
              </Text>
              {done.length > 0 && (
                <TouchableOpacity onPress={() => setChecked(new Set())}>
                  <Text style={styles.clearBtn}>Clear checked</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
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
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textInverse },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  shareBtn: { padding: 8, width: 40, alignItems: 'flex-end' },
  shareBtnDisabled: { opacity: 0.35 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
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
  listContent: { paddingHorizontal: 16, paddingTop: 12 },
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  listCount: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  clearBtn: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  separator: { height: 1, backgroundColor: COLORS.border, marginVertical: 1 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 4,
  },
  itemChecked: { opacity: 0.45 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  itemContent: { flex: 1 },
  itemName: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  itemNameChecked: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  itemQty: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  itemSource: { fontSize: 11, color: COLORS.textMuted, maxWidth: 100, textAlign: 'right' },
});
