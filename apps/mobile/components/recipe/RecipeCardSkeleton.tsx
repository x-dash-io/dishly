import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { Skeleton } from '../ui/Skeleton';

export function RecipeCardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Image Skeleton */}
      <Skeleton width="100%" height={200} style={styles.image} />
      
      <View style={styles.content}>
        {/* Author row skeleton */}
        <View style={styles.authorRow}>
          <View style={styles.authorInfo}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width={100} height={16} style={{ marginLeft: 8 }} />
          </View>
          <Skeleton width={70} height={30} borderRadius={8} />
        </View>

        {/* Title skeleton */}
        <Skeleton width="90%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={20} style={{ marginBottom: 16 }} />

        {/* Badges skeleton */}
        <View style={styles.badgeRow}>
          <Skeleton width={60} height={20} borderRadius={10} />
          <Skeleton width={80} height={20} borderRadius={10} />
        </View>

        {/* Meta row skeleton */}
        <View style={styles.metaRow}>
          <Skeleton width={60} height={16} />
          <View style={{ width: 16 }} />
          <Skeleton width={60} height={16} />
          <View style={{ width: 16 }} />
          <Skeleton width={40} height={16} />
        </View>

        {/* Action row skeleton */}
        <View style={styles.actionRow}>
          <Skeleton width={40} height={24} borderRadius={12} />
          <Skeleton width={40} height={24} borderRadius={12} />
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    aspectRatio: 16 / 9,
  },
  content: {
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceAlt,
    paddingTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
  },
});
