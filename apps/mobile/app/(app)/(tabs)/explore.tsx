import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';
import { FocusAwareStatusBar } from '../../../src/components/ui/FocusAwareStatusBar';
import { RecipeCard } from '../../../components/recipe/RecipeCard';
import { RecipeCardSkeleton } from '../../../components/recipe/RecipeCardSkeleton';
import { Button } from '../../../components/ui/Button';
import { useRecipeSearch, useTrendingFeed, ExploreFilters } from '../../../hooks/useExplore';
import { useLikeRecipe, useSaveRecipe } from '../../../hooks/useRecipeActions';
import type { RecipeCardItem } from '@dishly/types';

const CUISINES = ['All', 'Italian', 'Japanese', 'West African', 'Mexican', 'Indian', 'Thai'];
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const TIMES = [30, 60] as const;

export default function ExploreScreen() {
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Filter state
  const [filters, setFilters] = useState<ExploreFilters>({
    cuisine: 'All',
  });

  // Debouncing logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Autofocus when screen receives focus
  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }, [])
  );

  const isSearching = debouncedQuery.length >= 2;
  
  // Data hooks
  const { 
    data: searchData, 
    isLoading: isSearchLoading,
    refetch: refetchSearch
  } = useRecipeSearch(debouncedQuery, filters);

  const { 
    data: trendingData, 
    isLoading: isTrendingLoading,
    refetch: refetchTrending
  } = useTrendingFeed();

  const currentData = isSearching ? searchData?.recipes : trendingData?.recipes;
  const isLoading = isSearching ? isSearchLoading : isTrendingLoading;

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const toggleFilter = (type: keyof ExploreFilters, value: any) => {
    setFilters(prev => {
      if (prev[type] === value && type !== 'cuisine') {
        const next = { ...prev };
        delete next[type];
        return next;
      }
      return { ...prev, [type]: value };
    });
  };

  const renderItem = ({ item }: { item: RecipeCardItem }) => (
    <RecipeCardItemWrapper 
      recipe={item} 
      onPress={() => router.push(`/recipe/${item.id}`)}
      onAuthorPress={(id) => router.push(`/user/${id}`)}
      onShare={() => Share.share({ 
        url: `https://dishly.app/recipe/${item.id}`, 
        title: item.title 
      })}
    />
  );

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar style="dark" />
      <View style={styles.stickyHeader}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <AppIcon name="search" size={16} color={COLORS.textMuted} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search recipes, cuisines, ingredients…"
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} style={styles.clearIcon}>
                  <AppIcon name="close" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterStrip}
            contentContainerStyle={styles.filterContent}
          >
            {CUISINES.map(cuisine => (
              <FilterChip 
                key={cuisine}
                label={cuisine}
                active={filters.cuisine === cuisine}
                onPress={() => toggleFilter('cuisine', cuisine)}
              />
            ))}
            {DIFFICULTIES.map(diff => (
              <FilterChip 
                key={diff}
                label={diff.charAt(0).toUpperCase() + diff.slice(1)}
                active={filters.difficulty === diff}
                onPress={() => toggleFilter('difficulty', diff)}
              />
            ))}
            {TIMES.map(time => (
              <FilterChip 
                key={time}
                label={`Under ${time} min`}
                active={filters.max_minutes === time}
                onPress={() => toggleFilter('max_minutes', time)}
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.listPadding}>
            {[1, 2, 3].map(i => <RecipeCardSkeleton key={i} />)}
          </View>
        ) : isSearching && currentData?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes found for '{debouncedQuery}'</Text>
            <Button 
              variant="ghost" 
              label="Clear search" 
              onPress={handleClearSearch} 
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          <FlashList<RecipeCardItem>
            data={currentData}
            renderItem={renderItem}
            // @ts-ignore - FlashList types can be finicky
            estimatedItemSize={420}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPadding}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                {isSearching ? (
                  <Text style={styles.headerTitle}>
                    {currentData?.length || 0} recipes for '{debouncedQuery}'
                  </Text>
                ) : (
                  <View style={styles.trendingHeader}>
                    <AppIcon name="trending" size={20} color={COLORS.primary} />
                    <Text style={[styles.headerTitle, { marginLeft: 8 }]}>Trending now</Text>
                  </View>
                )}
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

// Wrapper for optimistic mutations
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
    <RecipeCard
      recipe={recipe}
      onPress={onPress}
      onAuthorPress={onAuthorPress}
      onLike={() => like()}
      onSave={() => save()}
      onShare={onShare}
    />
  );
}

function FilterChip({ 
  label, 
  active, 
  onPress 
}: { 
  label: string; 
  active: boolean; 
  onPress: () => void;
}) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.chip,
        active ? styles.chipActive : styles.chipInactive
      ]}
    >
      <Text style={[
        styles.chipText,
        active ? styles.chipTextActive : styles.chipTextInactive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stickyHeader: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  safeArea: {
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.textPrimary,
    height: '100%',
  },
  clearIcon: {
    padding: 4,
  },
  filterStrip: {
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: 'white',
  },
  chipTextInactive: {
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  listPadding: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
