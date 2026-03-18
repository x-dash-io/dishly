import React, { useState, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  Share,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';
import { RecipeCard } from '../../../components/recipe/RecipeCard';
import { RecipeCardSkeleton } from '../../../components/recipe/RecipeCardSkeleton';
import { Button } from '../../../components/ui/Button';
import { useHomeFeed, FeedType } from '../../../hooks/useFeed';
import { useLikeRecipe, useSaveRecipe } from '../../../hooks/useRecipeActions';
import type { RecipeCardItem } from '@dishly/types';

// Memoized RecipeCard for performance
const MemoizedRecipeCard = React.memo(RecipeCard);

export default function HomeFeedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedType>('forYou');
  const { getToken } = useAuth();

  const handleCopyJWT = async () => {
    try {
      const token = await getToken();
      if (token) {
        await Clipboard.setStringAsync(token);
        Alert.alert('Success', 'JWT copied to clipboard');
      } else {
        Alert.alert('Error', 'Could not get JWT');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to copy JWT');
    }
  };

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

  const handleLike = useCallback((recipeId: string) => {
    // We'll use a local hook call inside the component if needed, 
    // but the user prompt says useLikeRecipe(recipe.id).mutate()
    // However, hooks cannot be called inside callbacks. 
    // I will use a separate component or a predefined mutation.
  }, []);

  // For simplicity and to follow instructions, I'll define the mutation at the top level of the screen
  // but it needs to be per-recipe or generic.
  // Actually, the best way in React Query is to have the mutation hook return the mutate function.
  
  const renderItem = ({ item }: { item: RecipeCardItem }) => (
    <RecipeCardItemWrapper 
      recipe={item} 
      onPress={() => router.push(`/recipe/${item.id}`)}
      onAuthorPress={(userId) => router.push(`/user/${item.author.username}`)}
      onShare={() => Share.share({ 
        url: `https://dishly.app/recipe/${item.id}`, 
        title: item.title 
      })}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header onCopyJWT={handleCopyJWT} />
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        <View style={styles.listPadding}>
          {[1, 2, 3, 4].map((i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Failed to load feed</Text>
        <Button 
          label="Retry" 
          variant="ghost" 
          onPress={() => refetch()} 
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header onCopyJWT={handleCopyJWT} />
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      </SafeAreaView>

      <FlashList<RecipeCardItem>
        data={flatData}
        renderItem={renderItem}
        // @ts-ignore - FlashList types can be finicky in some environments
        estimatedItemSize={420}
        keyExtractor={(item) => item.id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
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

  return (
    <MemoizedRecipeCard
      recipe={recipe}
      onPress={onPress}
      onAuthorPress={onAuthorPress}
      onLike={() => like()}
      onSave={() => save()}
      onShare={onShare}
    />
  );
}

function Header({ onCopyJWT }: { onCopyJWT: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.wordmark}>
        <Text style={styles.wordmarkText}>
          dish<Text style={{ color: COLORS.primary }}>l</Text>y
        </Text>
      </View>
      <View style={styles.headerActions}>
        {__DEV__ && (
          <TouchableOpacity onPress={onCopyJWT} style={styles.debugBtn}>
            <AppIcon name="check" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.searchIcon} onPress={() => {}}>
          <AppIcon name="search" size={22} color="white" />
        </TouchableOpacity>
      </View>
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
  if (activeTab !== 'following') return null;

  return (
    <View style={styles.emptyContainer}>
      <AppIcon name="chef" size={64} color={COLORS.border} />
      <Text style={styles.emptyTitle}>Nobody you follow has posted yet</Text>
      <Text style={styles.emptySubtitle}>Explore recipes to find creators to follow</Text>
      <Button 
        variant="primary" 
        label="Explore recipes" 
        onPress={() => {}} // Navigate to explore tab
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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: COLORS.navDark,
  },
  wordmark: {
    flexDirection: 'row',
  },
  wordmarkText: {
    fontFamily: 'Georgia', // Serif logic
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  searchIcon: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debugBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  tabStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.navDark,
    paddingHorizontal: 10,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  inactiveTabText: {
    color: 'rgba(255,255,255,0.5)',
  },
  listPadding: {
    padding: 16,
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
    paddingTop: 100,
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
