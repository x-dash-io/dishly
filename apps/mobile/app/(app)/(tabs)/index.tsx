import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList, ViewToken } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';
import { RecipeCard } from '../../../components/recipe/RecipeCard';
import { RecipeCardSkeleton } from '../../../components/recipe/RecipeCardSkeleton';
import { Button } from '../../../components/ui/Button';
import { useHomeFeed, FeedType } from '../../../hooks/useFeed';
import { useLikeRecipe, useSaveRecipe } from '../../../hooks/useRecipeActions';
import { usePrefetchRecipe } from '../../../hooks/usePrefetch';
import type { RecipeCardItem } from '@dishly/types';

// Memoized RecipeCard for performance
export default function HomeFeedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedType>('forYou');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useHomeFeed(activeTab);

  const flatData = useMemo(() => 
    (data?.pages.flatMap((page) => page.recipes) ?? []) as RecipeCardItem[], 
    [data]
  );

  // Stable handlers — prevent RecipeCard re-renders on parent state changes
  const handlePress = useCallback((id: string) => router.push(`/recipe/${id}`), [router]);
  const handleAuthorPress = useCallback((username: string) => router.push(`/user/${username}`), [router]);
  const handleShare = useCallback((recipe: RecipeCardItem) => {
    Share.share({ url: `https://dishly.app/recipe/${recipe.id}`, title: recipe.title });
  }, []);

  // Image prefetch — prefetch 2 cards ahead of the last visible item
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!viewableItems.length) return;
      const lastVisible = Math.max(...viewableItems.map(v => v.index ?? 0));
      [flatData[lastVisible + 1], flatData[lastVisible + 2]].forEach(item => {
        if (!item) return;
        if (item.hero_image_url) Image.prefetch(item.hero_image_url);
        if (item.cover_image_url) Image.prefetch(item.cover_image_url);
      });
    },
    [flatData]
  );
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

  // For simplicity and to follow instructions, I'll define the mutation at the top level of the screen
  // but it needs to be per-recipe or generic.
  // Actually, the best way in React Query is to have the mutation hook return the mutate function.
  
  const renderItem = useCallback(({ item }: { item: RecipeCardItem }) => (
    <RecipeCardItemWrapper 
      recipe={item} 
      onPress={() => handlePress(item.id)}
      onAuthorPress={() => handleAuthorPress(item.author.username)}
      onShare={() => handleShare(item)}
    />
  ), [handlePress, handleAuthorPress, handleShare]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Header />
          <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </SafeAreaView>
        <View style={styles.listPadding}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <RecipeCardSkeleton />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Header />
        </SafeAreaView>
        <View style={[styles.flex1, styles.center]}>
          <Text style={styles.errorText}>Failed to load feed</Text>
          <Button 
            label="Retry" 
            variant="ghost" 
            onPress={() => refetch()} 
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header />
        <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </SafeAreaView>

      <FlashList<RecipeCardItem>
        data={flatData}
        renderItem={renderItem}
        estimatedItemSize={445}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={refetch} 
            tintColor={COLORS.primary} 
          />
        }
        contentContainerStyle={styles.listPadding}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<EmptyState activeTab={activeTab} />}
      />
    </View>
  );
}

// Wrapper to handle per-recipe mutations
function RecipeCardItemWrapper({ 
  recipe, 
  onPress, 
  onAuthorPress, 
  onShare 
}: { 
  recipe: RecipeCardItem; 
  onPress: () => void;
  onAuthorPress: (id: string) => void;
  onShare: () => void;
}) {
  const { mutate: like } = useLikeRecipe(recipe.id);
  const { mutate: save } = useSaveRecipe(recipe.id);

  const prefetch = usePrefetchRecipe();

  return (
    <RecipeCard
      recipe={recipe}
      onPress={onPress}
      onLongPress={() => prefetch(recipe.id)}
      onAuthorPress={onAuthorPress}
      onLike={() => like()}
      onSave={() => save()}
      onShare={onShare}
    />
  );
}

function Header() {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Text style={styles.wordmarkText}>
        Dish<Text style={{ color: COLORS.primary }}>l</Text>y
      </Text>
      <TouchableOpacity style={styles.searchIcon} onPress={() => router.push('/(app)/(tabs)/explore')}>
        <AppIcon name="search" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
}

function Tabs({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: FeedType; 
  onTabChange: (tab: FeedType) => void;
}) {
  const tabs: { key: FeedType; label: string }[] = [
    { key: 'forYou', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'trending', label: 'Trending' },
  ];

  return (
    <View style={styles.tabStrip}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity 
            key={tab.key} 
            onPress={() => onTabChange(tab.key)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Text style={[styles.tabText, isActive ? styles.activeTabText : styles.inactiveTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function EmptyState({ activeTab }: { activeTab: FeedType }) {
  const router = useRouter();
  if (activeTab !== 'following') return null;

  return (
    <View style={styles.emptyContainer}>
      <AppIcon name="chef" size={64} color={COLORS.border} />
      <Text style={styles.emptyTitle}>Nobody you follow has posted yet</Text>
      <Text style={styles.emptySubtitle}>Explore recipes to find creators to follow</Text>
      <Button
        variant="primary"
        label="Explore recipes"
        onPress={() => router.push('/(app)/(tabs)/explore')}
        style={styles.emptyButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    backgroundColor: COLORS.navDark,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: COLORS.navDark,
  },
  wordmarkText: {
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  searchIcon: {
    padding: 6,
  },
  tabStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.navDark,
    paddingHorizontal: 10,
    paddingBottom: 2,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  inactiveTabText: {
    color: 'rgba(255,255,255,0.5)',
  },
  listPadding: {
    padding: 12,
    paddingBottom: 24,
  },
  flex1: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});
