import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';
import { useCollectionRecipes } from '../../../hooks/useSaved';
import type { RecipeCardItem } from '@dishly/types';

const { width: SW } = Dimensions.get('window');
const COLS = 2;
const GUTTER = 12;
const CELL = (SW - GUTTER * (COLS + 1)) / COLS;

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useCollectionRecipes(id);

  const recipes = data?.pages.flatMap(p => p.recipes) ?? [];
  const collectionName = (data?.pages[0] as { collection?: { name: string } } | undefined)?.collection?.name ?? 'Collection';

  const renderItem = ({ item }: { item: RecipeCardItem }) => (
    <TouchableOpacity
      style={styles.cell}
      onPress={() => router.push()}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.cover_image_url ?? item.hero_image_url ?? undefined }}
        style={styles.cellImage}
        contentFit=cover
      />
      <View style={styles.cellBody}>
        <Text style={styles.cellTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cellMeta}>
          {(item.prep_minutes ?? 0) + (item.cook_minutes ?? 0)} min
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={false} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color={COLORS.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{collectionName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.center}>
          <AppIcon name="saved" size={48} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No recipes yet</Text>
          <Text style={styles.emptyText}>Save recipes to this collection from their detail page.</Text>
        </View>
      ) : (
        <FlatList<RecipeCardItem>
          data={recipes}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={COLS}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 }]}
          columnWrapperStyle={styles.row}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.navDark, paddingBottom: 14, paddingHorizontal: 16,
  },
  backBtn: { padding: 8, width: 40 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.textInverse, textAlign: 'center' },
  grid: { paddingHorizontal: GUTTER, paddingTop: GUTTER },
  row: { gap: GUTTER, marginBottom: GUTTER },
  cell: {
    width: CELL, backgroundColor: COLORS.surface,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cellImage: { width: CELL, height: CELL * 0.65 },
  cellBody: { padding: 10, gap: 4 },
  cellTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 18 },
  cellMeta: { fontSize: 11, color: COLORS.textMuted },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
});
