import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WizardHeader } from '../../../components/create/WizardHeader';
import { RecipeCard } from '../../../components/recipe/RecipeCard';
import { Button } from '../../../components/ui/Button';
import { AppIcon } from '../../../constants/icons';
import { COLORS } from '../../../constants/colors';
import { useRecipeDraft } from '../../../stores/recipe-draft.store';

export default function CreateStep5PublishScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const draft = useRecipeDraft();
  const [isPublishing, setIsPublishing] = useState(false);

  // Validation
  const hasTitle = draft.title.trim().length > 0;
  const hasIngredients = draft.ingredients.filter(i => i.name.trim().length > 0).length > 0;
  const hasSteps = draft.steps.filter(s => s.instruction.trim().length > 0).length > 0;
  const hasHeroImage = !!draft.heroImageUri;
  
  const canPublish = hasTitle && hasIngredients && hasSteps && hasHeroImage;

  const handlePublish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    
    try {
      // 1. Upload any remaining images
      // 2. POST /recipes
      // 3. POST /recipes/:id/publish
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert('Success', 'Your recipe has been published!', [
        { 
          text: 'View Recipe', 
          onPress: () => {
            draft.reset();
            router.replace({ pathname: '/recipe/[id]', params: { id: 'new-draft' }});
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to publish recipe. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsPublishing(true);
    try {
      // POST /recipes (status=draft)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      Alert.alert('Saved', 'Recipe saved as draft.', [
        { 
          text: 'OK', 
          onPress: () => {
            draft.reset();
            router.replace('/(app)/(tabs)/profile');
          }
        }
      ]);
    } finally {
      setIsPublishing(false);
    }
  };

  // Build a mock card item
  // @ts-ignore - Mocking fields that RecipeCardItem needs but we don't have deeply typed right here
  const previewItem = {
    id: 'draft-preview',
    title: draft.title || 'Untitled Recipe',
    cuisine: draft.cuisine || 'Other',
    difficulty: draft.difficulty || 'medium',
    ai_badge: null,
    cook_time_minutes: draft.cook_minutes || 0,
    prep_time_minutes: draft.prep_minutes || 0,
    servings: draft.servings || 2,
    hero_image_url: draft.heroImageUri || '',
    author_username: 'chef_you',
    author_display_name: 'You',
    author_avatar_url: '',
    likes_count: 0,
    saves_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString()
  };

  const ChecklistItem = ({ checked, label, required = true, sublabel }: { checked: boolean, label: string, required?: boolean, sublabel?: string }) => (
    <View style={styles.checkItem}>
      <View style={[
        styles.checkCircle, 
        checked ? styles.checkCircleYes : (required ? styles.checkCircleNo : styles.checkCircleInfo)
      ]}>
        <AppIcon 
          name={checked ? "check" : (required ? "close" : "info")} 
          size={12} 
          color="#FFF" 
        />
      </View>
      <View style={styles.checkTextCol}>
        <Text style={[styles.checkLabel, !checked && required && styles.checkLabelError]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={styles.checkSublabel}>{sublabel}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WizardHeader 
        step={5} 
        title="Review & Publish" 
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/create');
          }
        }} 
      />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Card */}
        <View style={styles.section}>
          <Text style={styles.previewLabel}>Preview</Text>
          <View pointerEvents="none">
            {/* @ts-ignore */}
            <RecipeCard item={previewItem} onPress={() => {}} />
          </View>
        </View>

        {/* Readiness Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Readiness Checklist</Text>
          <View style={styles.checklistCard}>
            <ChecklistItem checked={hasTitle} label="Title set" />
            <ChecklistItem checked={hasIngredients} label="At least 1 ingredient" />
            <ChecklistItem checked={hasSteps} label="At least 1 step" />
            <ChecklistItem 
              checked={hasHeroImage} 
              label="Final dish photo" 
              sublabel={!hasHeroImage ? "Add before publishing" : undefined}
            />
            <ChecklistItem 
              checked={false} 
              required={false}
              label="Nutrition info" 
              sublabel="Will be estimated by AI after publish"
            />
          </View>
        </View>

        {/* Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>
          
          <TouchableOpacity 
            style={[styles.visCard, draft.visibility === 'public' && styles.visCardActive]}
            activeOpacity={0.8}
            onPress={() => draft.setField('visibility', 'public')}
          >
            <View style={styles.visIconBox}>
              <AppIcon name="public" size={24} color={draft.visibility === 'public' ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <View style={styles.visTextCol}>
              <Text style={styles.visTitle}>Public</Text>
              <Text style={styles.visDesc}>Anyone can see and search for this recipe</Text>
            </View>
            {draft.visibility === 'public' && <AppIcon name="check" size={20} color={COLORS.primary} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.visCard, draft.visibility === 'followers' && styles.visCardActive]}
            activeOpacity={0.8}
            onPress={() => draft.setField('visibility', 'followers')}
          >
            <View style={styles.visIconBox}>
              <AppIcon name="follow" size={24} color={draft.visibility === 'followers' ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <View style={styles.visTextCol}>
              <Text style={styles.visTitle}>Followers only</Text>
              <Text style={styles.visDesc}>Only your followers can see this recipe</Text>
            </View>
            {draft.visibility === 'followers' && <AppIcon name="check" size={20} color={COLORS.primary} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.visCard, draft.visibility === 'private' && styles.visCardActive]}
            activeOpacity={0.8}
            onPress={() => draft.setField('visibility', 'private')}
          >
            <View style={styles.visIconBox}>
              <AppIcon name="private" size={24} color={draft.visibility === 'private' ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <View style={styles.visTextCol}>
              <Text style={styles.visTitle}>Private</Text>
              <Text style={styles.visDesc}>Only you can see this recipe</Text>
            </View>
            {draft.visibility === 'private' && <AppIcon name="check" size={20} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Floating Action */}
      <View style={[styles.floatingFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button 
          label="Publish recipe" 
          variant="primary" 
          fullWidth
          disabled={!canPublish || isPublishing}
          loading={isPublishing}
          onPress={handlePublish}
          style={styles.publishBtn}
        />
        <Button 
          label="Save as draft" 
          variant="ghost" 
          fullWidth
          disabled={isPublishing}
          onPress={handleSaveDraft}
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
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  checklistCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkCircleYes: {
    backgroundColor: COLORS.success,
  },
  checkCircleNo: {
    backgroundColor: COLORS.error,
  },
  checkCircleInfo: {
    backgroundColor: COLORS.textMuted,
  },
  checkTextCol: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  checkLabelError: {
    color: COLORS.error,
  },
  checkSublabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  visCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  visCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '0D',
  },
  visIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  visTextCol: {
    flex: 1,
  },
  visTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  visDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingRight: 16,
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  publishBtn: {
    marginBottom: 12,
  }
});
