import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../constants/icons';
import { COLORS } from '../../constants/colors';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useUserProfile, useFollowUser, useUserRecipes, useUserSavedRecipes } from '../../hooks/useUserProfile';
import type { RecipeCardItem } from '@dishly/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * 2) / 3;

interface UserProfileViewProps {
  username: string;
  isOwnProfile?: boolean;
  showBackButton?: boolean;
}

export function UserProfileView({ username, isOwnProfile = false, showBackButton = false }: UserProfileViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<'published' | 'saved'>('published');

  const { data: profile, isLoading: profileLoading } = useUserProfile(username);
  const followMutation = useFollowUser(profile?.id || '', profile?.username);

  // Feeds
  const { 
    data: publishedData, 
    isLoading: publishedLoading,
    fetchNextPage: fetchNextPublished,
    hasNextPage: hasNextPublished,
    isFetchingNextPage: isFetchingNextPublished
  } = useUserRecipes(username);

  const {
    data: savedData,
    isLoading: savedLoading,
    fetchNextPage: fetchNextSaved,
    hasNextPage: hasNextSaved,
    isFetchingNextPage: isFetchingNextSaved
  } = useUserSavedRecipes(isOwnProfile ? profile?.id : undefined);

  if (profileLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>User not found.</Text>
        {showBackButton && (
          <Button label="Go back" variant="ghost" onPress={() => router.back()} />
        )}
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {showBackButton && (
        <View style={[styles.topBar, { marginTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <AppIcon name="back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <AppIcon name="menu" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={[styles.profileInfo, !showBackButton && { marginTop: insets.top + 24 }]}>
        <Avatar uri={profile.avatar_url} name={profile.display_name} size={96} />
        <Text style={styles.displayName}>{profile.display_name}</Text>
        <Text style={styles.usernameText}>@{profile.username}</Text>
        
        {profile.bio ? (
          <Text style={styles.bioText} numberOfLines={2}>{profile.bio}</Text>
        ) : null}

        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.stats.recipe_count}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.stats.follower_count}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statBox}>
            <Text style={styles.statNumber}>{profile.stats.following_count}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {profile.dietary_prefs.length > 0 && (
          <View style={styles.tagsContainer}>
            {profile.dietary_prefs.map(tag => (
              <Badge key={tag} label={tag} variant="secondary" size="sm" />
            ))}
          </View>
        )}

        <View style={styles.actionsContainer}>
          {isOwnProfile ? (
            <>
              <Button label="Edit Profile" variant="secondary" onPress={() => router.push('/edit-profile')} style={{ flex: 1 }} />
              <Button label="Settings" variant="ghost" onPress={() => router.push('/settings')} style={{ flex: 1 }} />
            </>
          ) : (
            <Button 
              label={profile.viewer?.following ? 'Following' : 'Follow'}
              variant={profile.viewer?.following ? 'secondary' : 'primary'}
              fullWidth
              disabled={followMutation.isPending}
              onPress={() => followMutation.mutate()}
            />
          )}
        </View>
      </View>

      <View style={styles.tabStrip}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'published' && styles.tabBtnActive]}
          onPress={() => setActiveTab('published')}
        >
          <Text style={[styles.tabText, activeTab === 'published' && styles.tabTextActive]}>PUBLISHED</Text>
        </TouchableOpacity>
        {isOwnProfile && (
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'saved' && styles.tabBtnActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>SAVED</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const recipesOutput = activeTab === 'published' 
    ? publishedData?.pages.flatMap(p => p.recipes) || []
    : savedData?.pages.flatMap(p => p.items) || [];

  const isLoadingFeed = activeTab === 'published' ? publishedLoading : savedLoading;

  const renderGridItem = ({ item, index }: { item: RecipeCardItem, index: number }) => {
    // Add margin right if not the last in the row
    const isFirstColumn = index % 3 === 0;
    const isLastColumn = (index + 1) % 3 === 0;

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => router.push(`/recipe/${item.id}`)}
        style={[
          styles.gridItem, 
          { 
            marginLeft: isFirstColumn ? 0 : GRID_SPACING,
            marginRight: isLastColumn ? 0 : GRID_SPACING,
          }
        ]}
      >
        <Image 
          source={{ uri: item.cover_image_url || item.hero_image_url || undefined }} 
          style={styles.gridImage} 
          contentFit="cover"
        />
        {item.is_ai_generated && (
          <View style={styles.aiBadge}>
            <AppIcon name="aiGenerate" size={10} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* @ts-ignore */}
      <FlashList
        data={recipesOutput as any}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        // @ts-ignore
        estimatedItemSize={ITEM_SIZE}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoadingFeed ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {activeTab === 'published' ? 'No published recipes yet.' : 'No saved recipes yet.'}
              </Text>
            </View>
          )
        }
        onEndReached={() => {
          if (activeTab === 'published' && hasNextPublished && !isFetchingNextPublished) {
            fetchNextPublished();
          } else if (activeTab === 'saved' && hasNextSaved && !isFetchingNextSaved) {
            fetchNextSaved();
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingBottom: 4,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'Georgia',
    marginTop: 16,
    marginBottom: 2,
  },
  usernameText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  actionsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tabStrip: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginBottom: GRID_SPACING,
  },
  gridImage: {
    flex: 1,
    backgroundColor: COLORS.border,
  },
  aiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.aiPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  }
});
