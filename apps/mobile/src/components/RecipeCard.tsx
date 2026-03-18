import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';
import type { Recipe } from '@dishly/types';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={styles.container} 
      onPress={() => onPress?.(recipe)}
    >
      <View style={styles.imageContainer}>
        {recipe.coverImageUrl ? (
          <Image 
            source={{ uri: recipe.coverImageUrl }} 
            style={styles.image} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <AppIcon name="chef" size={40} color={COLORS.textMuted} />
          </View>
        )}
        
        {/* Overlay for text readability */}
        <LinearGradient
          colors={['transparent', COLORS.overlay]}
          style={styles.gradient}
        />

        {/* AI Badge */}
        {recipe.isAiGenerated && (
          <View style={styles.aiBadge}>
            <AppIcon name="aiGenerate" size={14} color={COLORS.textInverse} />
            <Text style={styles.aiBadgeText}>AI Generated</Text>
          </View>
        )}

        {/* Heart/Like Button (Top Right) */}
        <TouchableOpacity style={styles.likeButton} activeOpacity={0.7}>
          <AppIcon name="like" size={20} color={COLORS.textInverse} />
        </TouchableOpacity>

        {/* Content Overlay */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          
          <View style={styles.metaRow}>
            <View style={styles.authorSection}>
              {recipe.user?.avatarUrl ? (
                <Image source={{ uri: recipe.user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {recipe.user?.displayName?.[0] || '?'}
                  </Text>
                </View>
              )}
              <Text style={styles.authorName}>
                {recipe.user?.displayName || 'Dishly Chef'}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <AppIcon name="clock" size={14} color={COLORS.textInverse} />
                <Text style={styles.statText}>
                  {recipe.prepMinutes + recipe.cookMinutes}m
                </Text>
              </View>
              <View style={styles.stat}>
                <AppIcon name="difficulty" size={14} color={COLORS.textInverse} />
                <Text style={styles.statText}>
                  {recipe.difficulty}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    height: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  aiBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.aiPurple,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  aiBadgeText: {
    color: COLORS.textInverse,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  likeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  title: {
    ...Platform.select({
      ios: { fontFamily: 'Georgia' },
      android: { fontFamily: 'serif' },
    }),
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textInverse,
    marginBottom: 16,
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.textInverse,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.textInverse,
  },
  avatarInitial: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  authorName: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
