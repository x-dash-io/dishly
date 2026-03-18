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

  // Build a preview card directly — avoids all RecipeCardItem type mismatch issues
  const PreviewCard = () => (
    <View style={styles.previewCard}>
      {draft.heroImageUri ? (
        <View style={styles.previewImageWrap}>
          {/* expo-image needs Image import */}
        </View>
      ) : (
        <View style={styles.previewImagePlaceholder}>
          <AppIcon name="aiImage" size={32} color={COLORS.border} />
          <Text style={styles.previewImageHint}>Final dish photo will appear here</Text>
        </View>
      )}
      <View style={styles.previewBody}>
        <Text style={styles.previewTitle} numberOfLines={2}>
          {draft.title || 'Untitled Recipe'}
        </Text>
        <View style={styles.previewMeta}>
          {draft.cuisine ? (
            <View style={styles.previewPill}>
              <Text style={styles.previewPillText}>{draft.cuisine}</Text>
            </View>
          ) : null}
          <View style={styles.previewPill}>
            <Text style={styles.previewPillText}>
              {draft.difficulty.charAt(0).toUpperCase() + draft.difficulty.slice(1)}
            </Text>
          </View>
          {(draft.prep_minutes + draft.cook_minutes) > 0 && (
            <View style={styles.previewPill}>
              <Text style={styles.previewPillText}>
                {draft.prep_minutes + draft.cook_minutes} min
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const ChecklistItem = ({ checked, label, required = true, sublabel }: { checked: boolean, label: string, required?: boolean, sublabel?: string }) => (
    <View style={styles.checkItem}>
      <View style={[
        styles.checkCircle, 
        checked ? styles.checkCircleYes : (required ? styles.checkCircleNo : styles.checkCircleInfo)
      ]}>
        <AppIcon 
          name={checked ? "check" : (required ? "close" : "info")} 
          size={12} 
          color={COLORS.textInverse} 
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
          <PreviewCard />
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
  },
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.surfaceAlt,
  },
  previewImagePlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  previewImageHint: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  previewBody: {
    padding: 14,
    gap: 10,
  },
  previewTitle: {
    fontFamily: 'Georgia',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.mahogany,
    lineHeight: 24,
  },
  previewMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewPill: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  previewPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
