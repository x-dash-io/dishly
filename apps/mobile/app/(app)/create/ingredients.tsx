import React, { useRef, useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

import { WizardHeader } from '../../../components/create/WizardHeader';
import { Button } from '../../../components/ui/Button';
import { AppIcon } from '../../../constants/icons';
import { COLORS } from '../../../constants/colors';
import { useRecipeDraft, DraftIngredient } from '../../../stores/recipe-draft.store';
import { useApiClient } from '../../../src/lib/api-client';

const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'pcs', 'bunch', 'pinch', 'to taste'];

export default function CreateStep3IngredientsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { 
    ingredients, addIngredient, updateIngredient, removeIngredient, reorderIngredients 
  } = useRecipeDraft();

  const [aiText, setAiText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiParseError, setAiParseError] = useState<string | null>(null);
  const aiSheetRef = useRef<BottomSheetModal>(null);
  const api = useApiClient();

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['50%', '80%'], []);

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiParsing(true);
    setAiParseError(null);
    try {
      const result = await api.request<{ ingredients: Array<{ name: string; quantity: string; unit: string; notes: string }> }>(
        'POST',
        '/ai/parse-ingredients',
        { text: aiText }
      );
      for (const ing of result.ingredients) {
        addIngredient();
        // The store adds a blank ingredient - we need to update the last one
        // Use a small trick: update via setState directly since addIngredient adds at the end
        const currentState = useRecipeDraft.getState();
        const lastId = currentState.ingredients[currentState.ingredients.length - 1]?.id;
        if (lastId) {
          updateIngredient(lastId, {
            name: ing.name,
            quantity: ing.quantity || '',
            unit: ing.unit || '',
            notes: ing.notes || '',
          });
        }
      }
      aiSheetRef.current?.dismiss();
      setAiText('');
    } catch (err) {
      setAiParseError("Couldn't parse ingredients — try again or add manually");
    } finally {
      setAiParsing(false);
    }
  };

  const handleNext = () => {
    // Validation: at least 1 ingredient with non-empty name
    const valid = ingredients.filter(i => i.name.trim().length > 0).length > 0;
    if (!valid) {
      Alert.alert('Missing Info', 'Please add at least one ingredient with a name.');
      return;
    }
    router.push('/create/steps');
  };

  const handleDelete = (id: string, name: string) => {
    if (name.trim().length > 0) {
      Alert.alert('Delete Ingredient?', `Are you sure you want to remove ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeIngredient(id) }
      ]);
    } else {
      removeIngredient(id);
    }
  };

  const renderBackdrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<DraftIngredient>) => {
    const isError = ingredients.length > 0 && item.name.trim() === ''; // highlights empty names when trying to navigate but for now we just show normal

    return (
      <ScaleDecorator>
        <View style={[styles.row, isActive && styles.rowActive]}>
          <TouchableOpacity onLongPress={drag} delayLongPress={200} style={styles.dragHandle}>
            <AppIcon name="menu" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          <TextInput 
            style={[styles.input, styles.nameInput, isError && styles.inputError]}
            placeholder="Ingredient Name"
            placeholderTextColor={COLORS.textMuted}
            value={item.name}
            onChangeText={(val) => updateIngredient(item.id, { name: val })}
          />
          
          <TextInput 
            style={[styles.input, styles.qtyInput]}
            placeholder="Amt"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
            value={item.quantity}
            onChangeText={(val) => updateIngredient(item.id, { quantity: val })}
          />

          <View style={styles.unitPickerContainer}>
            <TextInput 
              style={[styles.input, styles.unitInput]}
              placeholder="Unit"
              placeholderTextColor={COLORS.textMuted}
              value={item.unit}
              onChangeText={(val) => updateIngredient(item.id, { unit: val })}
            />
          </View>

          <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
            <AppIcon name="delete" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <WizardHeader 
        step={3} 
        title="Ingredients" 
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/create');
          }
        }} 
      />
      
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={addIngredient}>
          <AppIcon name="add" size={18} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>Add ingredient</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.aiActionBtn} onPress={() => aiSheetRef.current?.present()}>
          <AppIcon name="aiGenerate" size={18} color={COLORS.aiPurple} />
          <Text style={styles.aiActionBtnText}>AI parse text</Text>
        </TouchableOpacity>
      </View>

      {ingredients.length === 0 ? (
        <View style={styles.emptyState}>
          <AppIcon name="add" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>Add your first ingredient</Text>
          <Button label="Add Manually" variant="ghost" onPress={addIngredient} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <DraggableFlatList
          data={ingredients}
          onDragEnd={({ data }) => {
            // Update the entire list
            // The store method takes fromIndex and toIndex, but we can also just implement a setIngredients if we preferred.
            // For now, we manually reconstruct or add a setIngredients field.
            // Since we have reorderIngredients, wait, DraggableFlatList gives the sorted array. Let's just update the store.
            // We'll dispatch a custom update.
            useRecipeDraft.setState({ ingredients: data });
          }}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
        />
      )}

      {/* Floating Action */}
      <View style={[styles.floatingFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button 
          label="Next: Steps" 
          variant="primary" 
          fullWidth
          onPress={handleNext}
        />
      </View>

      {/* AI Parse Bottom Sheet */}
      <BottomSheetModal
        ref={aiSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <AppIcon name="aiGenerate" size={24} color={COLORS.aiPurple} />
            <Text style={styles.sheetTitle}>Parse with AI</Text>
          </View>
          
          <TextInput 
            style={styles.aiTextInput}
            multiline
            placeholder={"Paste your ingredients list here...\ne.g.\n500g ground lamb\n8 corn tortillas\n2 tbsp suya spice"}
            placeholderTextColor={COLORS.textMuted}
            value={aiText}
            onChangeText={setAiText}
          />

          {aiParseError ? (
            <Text style={styles.aiParseError}>{aiParseError}</Text>
          ) : null}

          <View style={styles.aiBtnContainer}>
            {aiParsing ? (
              <View style={styles.aiParsingState}>
                <ActivityIndicator color={COLORS.aiPurple} />
                <Text style={styles.aiParsingText}>Parsing ingredients…</Text>
              </View>
            ) : (
              <Button
                label="★ Parse with AI"
                variant="primary"
                fullWidth
                disabled={!aiText.trim()}
                onPress={handleAiParse}
              />
            )}
          </View>
        </View>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary + '1A',
    borderRadius: 20,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.aiPurpleLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.aiPurple,
  },
  aiActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.aiPurple,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  rowActive: {
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    transform: [{ scale: 1.02 }],
  },
  dragHandle: {
    padding: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  nameInput: {
    flex: 2,
  },
  qtyInput: {
    flex: 0.8,
  },
  unitPickerContainer: {
    flex: 1,
  },
  unitInput: {
    width: '100%',
  },
  deleteBtn: {
    padding: 8,
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
  },
  sheetBg: {
    backgroundColor: COLORS.background,
    borderRadius: 24,
  },
  sheetContent: {
    flex: 1,
    padding: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  aiTextInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  aiBtnContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  aiParsingState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    backgroundColor: COLORS.aiPurple + '18',
    borderRadius: 12,
  },
  aiParsingText: {
    color: COLORS.aiPurple,
    fontStyle: 'italic',
    fontSize: 15,
    fontWeight: '600',
  },
  aiParseError: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
