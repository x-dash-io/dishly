import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal,
  ActionSheetIOS, Alert, Platform, ActivityIndicator, TextInput,
  Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';
import {
  useSavedRecipes, useUnsaveRecipe,
  useCollections, useDeleteCollection, useCreateCollection,
} from '../../../hooks/useSaved';
import { CollectionCard } from '../../../components/recipe/CollectionCard';
import { CollectionPicker } from '../../../components/recipe/CollectionPicker';
import { useApiClient } from '../../../src/lib/api-client';
import type { RecipeCardItem, Collection } from '@dishly/types';

const { width: SW } = Dimensions.get('window');
const COLS = 2;
const GUTTER = 10;
const CELL_W = (SW - GUTTER * (COLS + 1)) / COLS;

type Tab = 'saved' | 'collections';

export default function SavedScreen() {
  const router = useRouter();
  const api = useApiClient();
  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [pickerRecipeId, setPickerRecipeId] = useState<string | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Get current user id
  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.request<{ id: string; username: string }>('GET', '/auth/me'),
    staleTime: Infinity,
  });

  const userId = me?.id ?? '';

  const {
    data: savedData,
    isLoading: savedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchSaved,
  } = useSavedRecipes(userId);

  const { data: collections, isLoading: collectionsLoading, refetch: refetchCollections } = useCollections();
  const { mutate: unsave } = useUnsaveRecipe();
  const { mutate: deleteCollection } = useDeleteCollection();
  const { mutate: createCollection, isPending: isCreatingCollection } = useCreateCollection();

  const savedRecipes = savedData?.pages.flatMap(p =>
    // API returns items or recipes depending on the shape
    (p as { items?: RecipeCardItem[]; recipes?: RecipeCardItem[] }).items
    ?? (p as { recipes?: RecipeCardItem[] }).recipes
    ?? []
  ) ?? [];

  const handleLongPressSaved = useCallback((recipe: RecipeCardItem) => {
    const options = ['Add to collection', 'Remove from saved', 'Cancel'];
    const destructiveIdx = 1;
    const cancelIdx = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: destructiveIdx, cancelButtonIndex: cancelIdx },
        (idx) => {
          if (idx === 0) setPickerRecipeId(recipe.id);
          if (idx === 1) unsave(recipe.id);
        }
      );
    } else {
      Alert.alert(recipe.title, undefined, [
        { text: 'Add to collection', onPress: () => setPickerRecipeId(recipe.id) },
        { text: 'Remove from saved', style: 'destructive', onPress: () => unsave(recipe.id) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [unsave]);

  const renderSavedItem = useCallback(({ item }: { item: RecipeCardItem }) => {
    const totalMin = (item.prep_minutes ?? 0) + (item.cook_minutes ?? 0);
    return (
      <TouchableOpacity
        style={styles.cell}
        onPress={() => router.push(`/recipe/${item.id}`)}
        onLongPress={() => handleLongPressSaved(item)}
        delayLongPress={350}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: item.cover_image_url ?? item.hero_image_url ?? undefined }}
          style={styles.cellImg}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.cellBody}>
          <Text style={styles.cellTitle} numberOfLines={2}>{item.title}</Text>
          {totalMin > 0 && (
            <View style={styles.cellMeta}>
              <AppIcon name="clock" size={11} color={COLORS.textMuted} />
              <Text style={styles.cellMetaText}>{totalMin} min</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [router, handleLongPressSaved]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved</Text>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => router.push('/meal-planner')}
          >
            <AppIcon name="calendar" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Segmented control */}
        <View style={styles.segment}>
          {(['saved', 'collections'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.segBtn, activeTab === tab && styles.segBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segText, activeTab === tab && styles.segTextActive]}>
                {tab === 'saved' ? 'All Saved' : 'Collections'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {/* ── All Saved ── */}
      {activeTab === 'saved' && (
        savedLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : savedRecipes.length === 0 ? (
          <View style={styles.center}>
            <AppIcon name="saved" size={56} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No saved recipes yet</Text>
            <Text style={styles.emptyText}>Tap the bookmark icon on any recipe to save it</Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(app)/(tabs)/explore')}
              activeOpacity={0.85}
            >
              <AppIcon name="explore" size={16} color={COLORS.textInverse} />
              <Text style={styles.exploreBtnText}>Explore recipes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList<RecipeCardItem>
            data={savedRecipes}
            renderItem={renderSavedItem}
            keyExtractor={item => item.id}
            numColumns={COLS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={savedLoading}
                onRefresh={refetchSaved}
                tintColor={COLORS.primary}
              />
            }
          />
        )
      )}

      {/* ── Collections ── */}
      {activeTab === 'collections' && (
        <View style={styles.collectionsPane}>
          {/* New collection button */}
          <TouchableOpacity
            style={styles.newCollectionBtn}
            onPress={() => { setNewCollectionName(''); setShowNewCollection(true); }}
            activeOpacity={0.8}
          >
            <AppIcon name="add" size={18} color={COLORS.primary} />
            <Text style={styles.newCollectionText}>New collection</Text>
          </TouchableOpacity>

          {collectionsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : !collections?.length ? (
            <View style={styles.center}>
              <AppIcon name="saved" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No collections yet</Text>
              <Text style={styles.emptyText}>Organise your saved recipes into collections</Text>
            </View>
          ) : (
            <FlatList<Collection>
              data={collections}
              keyExtractor={c => c.id}
              numColumns={2}
              columnWrapperStyle={styles.collRow}
              contentContainerStyle={styles.collGrid}
              renderItem={({ item }) => (
                <CollectionCard
                  collection={item}
                  onPress={() => router.push(`/collection/${item.id}`)}
                  onDelete={() => deleteCollection(item.id)}
                />
              )}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={collectionsLoading}
                  onRefresh={refetchCollections}
                  tintColor={COLORS.primary}
                />
              }
            />
          )}
        </View>
      )}

      {/* New collection modal */}
      <Modal
        visible={showNewCollection}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewCollection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New collection</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Collection name…"
              placeholderTextColor={COLORS.textMuted}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              autoFocus
              maxLength={60}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowNewCollection(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreate, (!newCollectionName.trim() || isCreatingCollection) && styles.modalCreateDisabled]}
                disabled={!newCollectionName.trim() || isCreatingCollection}
                onPress={() => {
                  const name = newCollectionName.trim();
                  if (!name) return;
                  createCollection(
                    { name, is_public: false },
                    { onSuccess: () => { setShowNewCollection(false); setNewCollectionName(''); } }
                  );
                }}
              >
                {isCreatingCollection
                  ? <ActivityIndicator size="small" color={COLORS.textInverse} />
                  : <Text style={styles.modalCreateText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Collection picker sheet */}
      <CollectionPicker
        recipeId={pickerRecipeId}
        onClose={() => setPickerRecipeId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { backgroundColor: COLORS.navDark },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
    backgroundColor: COLORS.navDark,
  },
  headerTitle: {
    fontFamily: 'Georgia', fontSize: 22, fontWeight: '700', color: 'white',
  },
  calendarBtn: { padding: 6 },
  segment: {
    flexDirection: 'row', backgroundColor: COLORS.navDark,
    paddingHorizontal: 16, paddingBottom: 12, gap: 8,
  },
  segBtn: {
    flex: 1, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  segBtnActive: { backgroundColor: COLORS.primary },
  segText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  segTextActive: { color: 'white' },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 36, gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 12, marginTop: 8,
  },
  exploreBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textInverse },
  // Saved grid
  grid: { padding: GUTTER, paddingBottom: 40 },
  row: { gap: GUTTER, marginBottom: GUTTER },
  cell: {
    width: CELL_W, backgroundColor: COLORS.surface,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  cellImg: { width: CELL_W, height: CELL_W * 0.65 },
  cellBody: { padding: 10, gap: 4 },
  cellTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 18 },
  cellMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cellMetaText: { fontSize: 11, color: COLORS.textMuted },
  // Collections
  collectionsPane: { flex: 1 },
  newCollectionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  newCollectionText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  collGrid: { padding: GUTTER, paddingBottom: 40 },
  collRow: { gap: GUTTER, marginBottom: GUTTER, justifyContent: 'space-between' },
  // New collection modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  modalCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 20, width: '100%', gap: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  modalInput: {
    height: 46, backgroundColor: COLORS.background,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, fontSize: 16, color: COLORS.textPrimary,
  },
  modalActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalCancel: {
    height: 40, paddingHorizontal: 16, justifyContent: 'center',
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  modalCancelText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  modalCreate: {
    height: 40, paddingHorizontal: 20, justifyContent: 'center',
    alignItems: 'center', borderRadius: 10, backgroundColor: COLORS.primary,
    minWidth: 80,
  },
  modalCreateDisabled: { opacity: 0.45 },
  modalCreateText: { fontSize: 14, fontWeight: '700', color: COLORS.textInverse },
});
