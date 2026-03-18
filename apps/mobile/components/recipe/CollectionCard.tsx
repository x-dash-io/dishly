import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '@/constants/colors';
import { AppIcon } from '@/constants/icons';
import type { Collection } from '@dishly/types';

interface CollectionCardProps {
  collection: Collection;
  onPress: () => void;
  onDelete: () => void;
}

function CollectionCardComponent({ collection, onPress, onDelete }: CollectionCardProps) {
  const handleLongPress = () => {
    Alert.alert(
      collection.name,
      'What would you like to do?',
      [
        {
          text: 'Delete collection',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete collection',
              `Delete "${collection.name}"? The recipes will remain in your saved list.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Build a 2×2 mosaic — up to 4 images, fill remaining with surfaceAlt
  const images = collection.cover_images.slice(0, 4);
  const cells = Array.from({ length: 4 }, (_, i) => images[i] ?? null);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      activeOpacity={0.85}
    >
      {/* Mosaic */}
      <View style={styles.mosaic}>
        {cells.length === 0 ? (
          <View style={styles.mosaicEmpty}>
            <AppIcon name="saved" size={28} color={COLORS.border} />
          </View>
        ) : (
          <View style={styles.mosaicGrid}>
            {cells.map((uri, i) => (
              <View key={i} style={styles.mosaicCell}>
                {uri ? (
                  <Image source={{ uri }} style={styles.mosaicImage} contentFit="cover" />
                ) : (
                  <View style={[styles.mosaicImage, styles.mosaicPlaceholder]} />
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{collection.name}</Text>
          <Text style={styles.count}>{collection.recipe_count}</Text>
        </View>
        <View style={styles.visibilityRow}>
          <AppIcon
            name={collection.is_public ? 'public' : 'private'}
            size={12}
            color={COLORS.textMuted}
          />
          <Text style={styles.visibility}>
            {collection.is_public ? 'Public' : 'Private'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const CollectionCard = React.memo(CollectionCardComponent);

const CARD_SIZE = 160;

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mosaic: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: COLORS.surfaceAlt,
  },
  mosaicEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  mosaicGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mosaicCell: {
    width: CARD_SIZE / 2,
    height: CARD_SIZE / 2,
  },
  mosaicImage: {
    width: '100%',
    height: '100%',
  },
  mosaicPlaceholder: {
    backgroundColor: COLORS.surfaceAlt,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  name: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  count: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    minWidth: 20,
    textAlign: 'right',
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visibility: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
