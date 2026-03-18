import React, { useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  ActivityIndicator, 
  Share 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../../constants/colors';
import { AppIcon } from '../../../constants/icons';
import { Button } from '../../../components/ui/Button';
import { useRecipe } from '../../../hooks/useRecipe';
import { useServingScaler } from '../../../hooks/useServingScaler';
import { useLikeRecipe, useSaveRecipe } from '../../../hooks/useRecipeActions';
import { IngredientRow } from '../../../components/recipe/IngredientRow';
import { StepCard } from '../../../components/recipe/StepCard';
import { CommentsPreview } from '../../../components/recipe/CommentsPreview';
import { FocusAwareStatusBar } from '../../../src/components/ui/FocusAwareStatusBar';

const HEADER_HEIGHT_EXPANDED = 300;
const HEADER_HEIGHT_COLLAPSED = 90;

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const scrollY = useRef(new Animated.Value(0)).current;

  const { data: recipe, isLoading, isError, refetch } = useRecipe(id as string);
  const { mutate: like } = useLikeRecipe(id as string);
  const { mutate: save } = useSaveRecipe(id as string);

  const { servings, setServings, scaleQuantity } = useServingScaler(4);

  // Update servings when data loads
  React.useEffect(() => {
    if (recipe && recipe.servings) {
      setServings(recipe.servings);
    }
  }, [recipe?.servings]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isError || !recipe) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Failed to load recipe</Text>
        <Button label="Retry" variant="primary" onPress={() => refetch()} />
        <Button label="Go Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const handleShare = () => {
    Share.share({
      url: `https://dishly.app/recipe/${id}`,
      title: recipe.title,
    });
  };

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, HEADER_HEIGHT_EXPANDED],
    outputRange: [0, 0, HEADER_HEIGHT_EXPANDED * 0.5],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT_EXPANDED - 40, HEADER_HEIGHT_EXPANDED],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT_EXPANDED - 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar style="light" />
      
      {/* Parallax Hero Image */}
      <Animated.View style={[styles.heroContainer, { transform: [{ translateY: imageTranslateY }] }]}>
        <Image 
          source={{ uri: recipe.hero_image_url || recipe.cover_image_url || '' }} 
          style={styles.heroImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.heroGradient}
        />
        <Animated.View style={[styles.heroActionsContent, { opacity: heroOpacity }]}>
          <TouchableOpacity 
            style={styles.heroLikeBtn} 
            onPress={() => like()}
            activeOpacity={0.8}
          >
            <AppIcon 
              name="like" 
              size={20} 
              color={recipe.viewer?.liked ? COLORS.primary : '#FFF'} 
            />
            <Text style={styles.heroLikeCount}>{recipe.like_count}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainBody}>
          
          {/* Author Row */}
          <View style={styles.authorRow}>
            <TouchableOpacity 
              style={styles.authorInfo}
              onPress={() => router.push(`/user/${recipe.author.username}`)}
            >
              {recipe.author.avatar_url ? (
                <Image source={{ uri: recipe.author.avatar_url }} style={styles.authorAvatar} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
              <View>
                <Text style={styles.authorName}>{recipe.author.display_name}</Text>
                <Text style={styles.authorFollowers}>{recipe.author.follower_count} followers</Text>
              </View>
            </TouchableOpacity>
            <Button label="Follow" variant="ghost" size="sm" onPress={() => {}} />
          </View>

          {/* Title and Badges */}
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={styles.badgeRow}>
            {recipe.cuisine && <View style={styles.badge}><Text style={styles.badgeText}>{recipe.cuisine}</Text></View>}
            <View style={[styles.badge, styles.difficultyBadge]}><Text style={styles.difficultyText}>{recipe.difficulty}</Text></View>
            {recipe.is_ai_generated && <View style={[styles.badge, styles.aiBadge]}><Text style={styles.aiBadgeText}>AI Estimated</Text></View>}
          </View>

          {/* Meta Info */}
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <AppIcon name="clock" size={20} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{recipe.prep_minutes + recipe.cook_minutes} min</Text>
            </View>
            <View style={styles.metaItem}>
              <AppIcon name="chef" size={20} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}</Text>
            </View>
            <View style={styles.servingsScaler}>
              <TouchableOpacity 
                style={styles.scaleBtn}
                onPress={() => setServings(Math.max(1, servings - 1))}
              >
                <AppIcon name="remove" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.servingsText}>{servings} servings</Text>
              <TouchableOpacity 
                style={styles.scaleBtn}
                onPress={() => setServings(servings + 1)}
              >
                <AppIcon name="add" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.metaDivider} />

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients?.map((ing: any) => (
              <IngredientRow 
                key={ing.name + ing.orderIndex} 
                ingredient={ing} 
                scaledQuantity={ing.quantity ? scaleQuantity(ing.quantity) : ''} 
              />
            ))}
          </View>
          <View style={styles.metaDivider} />

          {/* Steps */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {recipe.steps?.map((step: any, idx: number) => (
              <StepCard 
                key={idx} 
                recipeId={recipe.id} 
                step={step} 
                index={idx} 
              />
            ))}
          </View>
          <View style={styles.metaDivider} />

          {/* Nutrition */}
          {recipe.nutrition && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionVal}>{recipe.nutrition.calories || '--'}</Text>
                    <Text style={styles.nutritionLabel}>Cal</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionVal}>{recipe.nutrition.proteinG || '--'}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionVal}>{recipe.nutrition.carbsG || '--'}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionVal}>{recipe.nutrition.fatG || '--'}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </View>
              <View style={styles.metaDivider} />
            </>
          )}

          {/* Comments Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <CommentsPreview recipeId={recipe.id} />
          </View>

          {/* Padding for sticky button */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Floating Header Actions (Always visible) */}
      <View style={[styles.floatingHeader, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <AppIcon name="share" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Sticky Header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity, paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.stickyHeaderIcon} onPress={() => router.back()}>
          <AppIcon name="back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle} numberOfLines={1}>{recipe.title}</Text>
        <TouchableOpacity style={styles.stickyHeaderIcon} onPress={() => save()}>
          <AppIcon 
            name="saved" 
            size={24} 
            color={recipe.viewer?.saved ? COLORS.primary : '#FFF'} 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Sticky Start Cooking Button */}
      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button 
          label="Start Cooking" 
          variant="primary" 
          fullWidth
          icon="play"
          iconPosition="left"
          onPress={() => router.push(`/cook/${recipe.id}`)}
        />
      </View>
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
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT_EXPANDED,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT_EXPANDED,
    zIndex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroActionsContent: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  heroLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  heroLikeCount: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 3,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.navDark,
    zIndex: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stickyHeaderIcon: {
    padding: 8,
  },
  stickyHeaderTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  mainBody: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingTop: 32,
    paddingHorizontal: 24,
    zIndex: 2,
    minHeight: 1000,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.border,
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  authorFollowers: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 34,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  difficultyBadge: {
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  aiBadge: {
    backgroundColor: COLORS.aiPurple + '1A', // With opacity
    borderColor: COLORS.aiPurple,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.aiPurple,
  },
  metaDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  servingsScaler: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scaleBtn: {
    padding: 6,
  },
  servingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionVal: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    zIndex: 10,
  },
});
