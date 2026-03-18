import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { COLORS } from '@/constants/colors';
import { AppIcon } from '@/constants/icons';
import { useCollections, useCreateCollection, useSaveToCollection } from '@/hooks/useSaved';
import type { Collection } from '@dishly/types';

interface CollectionPickerProps {
  recipeId: string | null; // null = closed
  onClose: () => void;
}

function CollectionPickerComponent({ recipeId, onClose }: CollectionPickerProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: collections, isLoading } = useCollections();
  const { mutate: createCollection, isPending: isCreating } = useCreateCollection();
  const { mutate: saveToCollection, isPending: isSaving } = useSaveToCollection();

  useEffect(() => {
    if (recipeId) {
      sheetRef.current?.snapToIndex(0);
      setShowNewInput(false);
      setNewName('');
    } else {
      sheetRef.current?.close();
    }
  }, [recipeId]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  const handleSelectCollection = (collection: Collection) => {
    if (!recipeId) return;
    saveToCollection(
      { recipeId, collectionId: collection.id },
      { onSuccess: onClose }
    );
  };

  const handleCreateAndSave = () => {
    const name = newName.trim();
    if (!name || !recipeId) return;
    createCollection(
      { name, is_public: false },
      {
        onSuccess: (newCollection) => {
          saveToCollection(
            { recipeId, collectionId: newCollection.id },
            { onSuccess: onClose }
          );
        },
      }
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['50%']}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Add to collection</Text>

        {/* New collection row */}
        {showNewInput ? (
          <View style={styles.newInputRow}>
            <TextInput
              style={styles.newInput}
              placeholder="Collection name…"
              placeholderTextColor={COLORS.textMuted}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={handleCreateAndSave}
            />
            <TouchableOpacity
              style={[styles.createBtn, (!newName.trim() || isCreating || isSaving) && styles.createBtnDisabled]}
              onPress={handleCreateAndSave}
              disabled={!newName.trim() || isCreating || isSaving}
            >
              {isCreating || isSaving
                ? <ActivityIndicator size="small" color={COLORS.textInverse} />
                : <Text style={styles.createBtnText}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowNewInput(false)} style={styles.cancelBtn}>
              <AppIcon name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.newRow} onPress={() => setShowNewInput(true)}>
            <View style={styles.newRowIcon}>
              <AppIcon name="add" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.newRowText}>New collection</Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Existing collections */}
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : !collections?.length ? (
          <Text style={styles.emptyHint}>No collections yet. Create one above.</Text>
        ) : (
          collections.map((col) => (
            <TouchableOpacity
              key={col.id}
              style={styles.collectionRow}
              onPress={() => handleSelectCollection(col)}
              disabled={isSaving}
              activeOpacity={0.75}
            >
              {/* Mini mosaic 2×2 */}
              <View style={styles.miniMosaic}>
                {col.cover_images.slice(0, 4).map((uri, i) => (
                  <View key={i} style={styles.miniCell}>
                    <View style={[styles.miniImg, !uri && styles.miniImgEmpty]}>
                      {uri ? null : null}
                    </View>
                  </View>
                ))}
                {col.cover_images.length === 0 && (
                  <View style={styles.miniEmpty}>
                    <AppIcon name="saved" size={14} color={COLORS.border} />
                  </View>
                )}
              </View>
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionName} numberOfLines={1}>{col.name}</Text>
                <Text style={styles.collectionMeta}>
                  {col.recipe_count} recipe{col.recipe_count !== 1 ? 's' : ''} · {col.is_public ? 'Public' : 'Private'}
                </Text>
              </View>
              <AppIcon name="forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

export const CollectionPicker = React.memo(CollectionPickerComponent);

const MINI = 36;

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: COLORS.background, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { backgroundColor: COLORS.border, width: 36 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, paddingVertical: 12 },
  newRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  newRowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  newRowText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  newInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  newInput: {
    flex: 1, height: 40, backgroundColor: COLORS.surface,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, fontSize: 15, color: COLORS.textPrimary,
  },
  createBtn: {
    height: 40, paddingHorizontal: 14, backgroundColor: COLORS.primary,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.45 },
  createBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textInverse },
  cancelBtn: { padding: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  emptyHint: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14, paddingVertical: 24 },
  collectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  miniMosaic: {
    width: MINI, height: MINI, borderRadius: 8,
    flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
  },
  miniCell: { width: MINI / 2, height: MINI / 2 },
  miniImg: { width: '100%', height: '100%', backgroundColor: COLORS.border },
  miniImgEmpty: { backgroundColor: COLORS.surfaceAlt },
  miniEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  collectionInfo: { flex: 1 },
  collectionName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  collectionMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});
