import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../constants/colors';
import { RecipeCardItem } from '@dishly/types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';
import { Button } from '../ui/Button';
import { MetaPill } from './MetaPill';

interface RecipeCardProps {
  recipe: RecipeCardItem;
  onPress: () => void;
  onAuthorPress: (userId: string) => void;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  currentUserId?: string;
}

export function RecipeCard({
  recipe,
  onPress,
  onAuthorPress,
  onLike,
  onSave,
  onShare,
  currentUserId,
}: RecipeCardProps) {
  const totalMinutes = recipe.prep_minutes + recipe.cook_minutes;
  const isOwnRecipe = currentUserId === recipe.author.id;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      style={styles.container}
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={recipe.hero_image_url || recipe.cover_image_url}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={COLORS.surfaceAlt}
          cachePolicy="memory-disk"
        />
        {recipe.is_ai_generated && (
          <View style={styles.aiBadge}>
            <Badge variant="ai" label="AI Recipe" size="sm" />
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.authorInfo}>
            <Avatar 
              uri={recipe.author.avatar_url} 
              name={recipe.author.display_name} 
              size={32}
              onPress={() => onAuthorPress(recipe.author.id)}
            />
            <TouchableOpacity onPress={() => onAuthorPress(recipe.author.id)}>
              <Text style={styles.authorName}>{recipe.author.display_name}</Text>
            </TouchableOpacity>
          </View>
          
          {!isOwnRecipe && (
            <Button 
              label="Follow" 
              variant="secondary" 
              size="sm" 
              onPress={() => {}} // Handle follow
            />
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

        {/* Badges */}
        <View style={styles.badgeRow}>
          {recipe.cuisine && (
            <Badge variant="secondary" label={recipe.cuisine} size="sm" />
          )}
          <Badge 
            variant="muted" 
            label={recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)} 
            size="sm" 
          />
        </View>

        {/* Meta Pills */}
        <View style={styles.metaRow}>
          <MetaPill icon="clock" label={`${totalMinutes} min`} />
          <MetaPill icon="chef" label={recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)} />
          <MetaPill icon="servings" label={recipe.servings.toString()} />
        </View>

        {/* Social Actions */}
        <View style={styles.actionRow}>
          <IconButton 
            icon="like" 
            count={recipe.like_count} 
            active={recipe.viewer?.liked} 
            onPress={onLike}
          />
          <IconButton 
            icon="saved" 
            count={recipe.save_count} 
            active={recipe.viewer?.saved} 
            onPress={onSave}
          />
          <IconButton icon="share" onPress={onShare} />
        </View>
      </View>
    </TouchableOpacity>
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
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.surfaceAlt,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  aiBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  content: {
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  title: {
    fontFamily: 'Georgia', // Serif font requested
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.mahogany,
    fontWeight: '700',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
    gap: 12,
  },
});
