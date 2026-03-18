import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WizardHeader } from '../../../components/create/WizardHeader';
import { Button } from '../../../components/ui/Button';
import { AppIcon } from '../../../constants/icons';
import { COLORS } from '../../../constants/colors';
import { useRecipeDraft } from '../../../stores/recipe-draft.store';

const CUISINES = [
  'Italian', 'West African', 'Japanese', 'Mexican', 'Indian', 'Thai',
  'Mediterranean', 'Chinese', 'French', 'Middle Eastern', 'Korean', 'American', 'Other'
];

const DIET_TAGS = [
  'Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Halal', 'Keto', 'Paleo', 'High-protein'
];

export default function CreateStep1InfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { 
    title, description, cuisine, difficulty, 
    prep_minutes, cook_minutes, servings, tags,
    setField
  } = useRecipeDraft();

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setField('tags', tags.filter((t: string) => t !== tag));
    } else {
      setField('tags', [...tags, tag]);
    }
  };

  const isNextEnabled = title.trim().length >= 2;

  const handleNext = () => {
    if (isNextEnabled) {
      router.push('/create/photos');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WizardHeader 
        step={1} 
        title="Basic Info" 
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/create');
          }
        }} 
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.section}>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.titleInput}
                placeholder="Give your recipe a name…"
                placeholderTextColor={COLORS.textMuted}
                maxLength={120}
                value={title}
                onChangeText={(val) => setField('title', val)}
              />
            </View>
            <Text style={styles.charCount}>{title.length}/120</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.descInput}
                placeholder="What makes this dish special?"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                maxLength={500}
                value={description}
                onChangeText={(val) => setField('description', val)}
              />
            </View>
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Cuisine */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cuisine</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {CUISINES.map((c) => {
                const isActive = cuisine === c;
                return (
                  <TouchableOpacity 
                    key={c}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setField('cuisine', c)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Difficulty */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Difficulty</Text>
            <View style={styles.difficultyRow}>
              {[
                { val: 'easy', label: 'Easy', sub: 'Beginner-friendly' },
                { val: 'medium', label: 'Medium', sub: 'Some skills needed' },
                { val: 'hard', label: 'Hard', sub: 'For the pros' }
              ].map((diff) => {
                const isActive = difficulty === diff.val;
                return (
                  <TouchableOpacity 
                    key={diff.val}
                    style={[styles.diffCard, isActive && styles.diffCardActive]}
                    onPress={() => setField('difficulty', diff.val as any)}
                  >
                    <Text style={[styles.diffLabel, isActive && styles.diffLabelActive]}>{diff.label}</Text>
                    <Text style={[styles.diffSub, isActive && styles.diffSubActive]}>{diff.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Times */}
          <View style={styles.section}>
            <View style={styles.timesRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.sectionLabel}>Prep time</Text>
                <View style={styles.timeInputRow}>
                  <TextInput 
                    style={styles.numberInput}
                    keyboardType="numeric"
                    value={prep_minutes > 0 ? prep_minutes.toString() : ''}
                    onChangeText={(val) => setField('prep_minutes', parseInt(val || '0', 10))}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={styles.unitText}>min</Text>
                </View>
              </View>

              <View style={styles.timeBlock}>
                <Text style={styles.sectionLabel}>Cook time</Text>
                <View style={styles.timeInputRow}>
                  <TextInput 
                    style={styles.numberInput}
                    keyboardType="numeric"
                    value={cook_minutes > 0 ? cook_minutes.toString() : ''}
                    onChangeText={(val) => setField('cook_minutes', parseInt(val || '0', 10))}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Text style={styles.unitText}>min</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Servings */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Servings</Text>
            <View style={styles.servingsStepper}>
              <TouchableOpacity 
                style={styles.stepBtn}
                onPress={() => setField('servings', Math.max(1, servings - 1))}
              >
                <AppIcon name="remove" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.servingsNum}>{servings}</Text>
              <TouchableOpacity 
                style={styles.stepBtn}
                onPress={() => setField('servings', Math.min(100, servings + 1))}
              >
                <AppIcon name="add" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dietary Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Dietary (Optional)</Text>
            <View style={styles.tagsContainer}>
              {DIET_TAGS.map((tag) => {
                const isActive = tags.includes(tag);
                return (
                  <TouchableOpacity 
                    key={tag}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Action */}
      <View style={[styles.floatingFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button 
          label="Next: Photos" 
          variant="primary" 
          fullWidth
          disabled={!isNextEnabled}
          onPress={handleNext}
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
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  inputWrapper: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A2A18',
  },
  descInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  diffCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  diffCardActive: {
    backgroundColor: COLORS.primary + '1A', // transparent primary
    borderColor: COLORS.primary,
  },
  diffLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  diffLabelActive: {
    color: COLORS.primary,
  },
  diffSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  diffSubActive: {
    color: COLORS.primary,
  },
  timesRow: {
    flexDirection: 'row',
    gap: 20,
  },
  timeBlock: {
    flex: 1,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  numberInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  unitText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 8,
    fontWeight: '500',
  },
  servingsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsNum: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  }
});
