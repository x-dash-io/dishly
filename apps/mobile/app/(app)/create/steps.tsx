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
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

import { WizardHeader } from '../../../components/create/WizardHeader';
import { Button } from '../../../components/ui/Button';
import { AppIcon } from '../../../constants/icons';
import { COLORS } from '../../../constants/colors';
import { useRecipeDraft, DraftStep } from '../../../stores/recipe-draft.store';

export default function CreateStep4StepsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { 
    steps, addStep, updateStep, removeStep 
  } = useRecipeDraft();

  const [activeTimerStepId, setActiveTimerStepId] = useState<string | null>(null);
  const [timerMins, setTimerMins] = useState('0');
  const [timerSecs, setTimerSecs] = useState('0');
  const timerSheetRef = useRef<BottomSheetModal>(null);
  
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);

  const snapPoints = useMemo(() => ['50%'], []);

  const handleNext = () => {
    const valid = steps.filter(s => s.instruction.trim().length > 0).length > 0;
    if (!valid) {
      Alert.alert('Missing Info', 'Please add at least one step with instructions.');
      return;
    }
    router.push('/create/publish');
  };

  const handleDelete = (id: string, text: string) => {
    if (text.trim().length > 0) {
      Alert.alert('Delete Step?', `Are you sure you want to remove this step?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeStep(id) }
      ]);
    } else {
      removeStep(id);
    }
  };

  const handlePickImage = async (id: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setUploadingStepId(id);
        
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate upload
        
        updateStep(id, { imageUri: uri, imageUrl: uri });
      }
    } catch (error) {
      console.error('Image picker error:', error);
    } finally {
      setUploadingStepId(null);
    }
  };

  const openTimerModal = (id: string) => {
    const step = steps.find(s => s.id === id);
    if (step && step.timer_seconds) {
      setTimerMins(Math.floor(step.timer_seconds / 60).toString());
      setTimerSecs((step.timer_seconds % 60).toString());
    } else {
      setTimerMins('0');
      setTimerSecs('0');
    }
    setActiveTimerStepId(id);
    timerSheetRef.current?.present();
  };

  const saveTimer = () => {
    if (activeTimerStepId) {
      const totalSecs = (parseInt(timerMins || '0', 10) * 60) + parseInt(timerSecs || '0', 10);
      updateStep(activeTimerStepId, { timer_seconds: totalSecs > 0 ? totalSecs : null });
    }
    timerSheetRef.current?.dismiss();
  };

  const renderBackdrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const formatTimerCode = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<DraftStep>) => {
    const isError = steps.length > 0 && item.instruction.trim() === '';
    const index = getIndex() || 0;

    return (
      <ScaleDecorator>
        <View style={[styles.card, isActive && styles.cardActive]}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.stepNumBadge}>
              <Text style={styles.stepNumText}>{index + 1}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onLongPress={drag} delayLongPress={200} style={styles.iconBtn}>
                <AppIcon name="menu" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.instruction)} style={styles.iconBtn}>
                <AppIcon name="close" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            <TouchableOpacity 
              style={styles.imageZone} 
              onPress={() => handlePickImage(item.id)}
              disabled={uploadingStepId === item.id}
            >
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <AppIcon name="aiImage" size={24} color={COLORS.textMuted} />
                </View>
              )}
              {uploadingStepId === item.id && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator color={COLORS.primary} size="small" />
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={[styles.instructionInput, isError && styles.inputError]}
              placeholder="Describe this step..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              value={item.instruction}
              onChangeText={(val) => updateStep(item.id, { instruction: val })}
            />
          </View>

          {/* Card Footer - Timer */}
          <View style={styles.cardFooter}>
            {item.timer_seconds ? (
              <View style={styles.timerPillActive}>
                <AppIcon name="timer" size={16} color={COLORS.primary} />
                <Text style={styles.timerPillText}>{formatTimerCode(item.timer_seconds)}</Text>
                <TouchableOpacity onPress={() => updateStep(item.id, { timer_seconds: null })} style={styles.timerClear}>
                  <AppIcon name="close" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.timerPill} onPress={() => openTimerModal(item.id)}>
                <AppIcon name="timer" size={16} color={COLORS.textSecondary} />
                <Text style={styles.timerPillTextMuted}>Add timer</Text>
              </TouchableOpacity>
            )}
          </View>
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
        step={4} 
        title="Cooking Steps" 
        onBack={() => router.back()} 
      />
      
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={addStep}>
          <AppIcon name="add" size={18} color={COLORS.primary} />
          <Text style={styles.actionBtnText}>Add step</Text>
        </TouchableOpacity>
      </View>

      {steps.length === 0 ? (
        <View style={styles.emptyState}>
          <AppIcon name="chef" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>Add your first cooking step</Text>
          <Button label="Add Step" variant="ghost" onPress={addStep} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <DraggableFlatList
          data={steps}
          onDragEnd={({ data }) => {
            useRecipeDraft.setState({ steps: data });
          }}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 16 }}
        />
      )}

      {/* Floating Action */}
      <View style={[styles.floatingFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button 
          label="Next: Publish" 
          variant="primary" 
          fullWidth
          onPress={handleNext}
        />
      </View>

      {/* Timer Picker Bottom Sheet */}
      <BottomSheetModal
        ref={timerSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBg}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <AppIcon name="timer" size={24} color={COLORS.textPrimary} />
            <Text style={styles.sheetTitle}>Set Step Timer</Text>
          </View>
          
          <View style={styles.timeInputsRow}>
            <View style={styles.timeInputBox}>
              <Text style={styles.timeInputLabel}>Minutes</Text>
              <TextInput 
                style={styles.timeInput}
                keyboardType="number-pad"
                value={timerMins}
                onChangeText={setTimerMins}
                selectTextOnFocus
              />
            </View>
            <Text style={styles.timeDivider}>:</Text>
            <View style={styles.timeInputBox}>
              <Text style={styles.timeInputLabel}>Seconds</Text>
              <TextInput 
                style={styles.timeInput}
                keyboardType="number-pad"
                value={timerSecs}
                onChangeText={setTimerSecs}
                selectTextOnFocus
              />
            </View>
          </View>

          <View style={styles.sheetBtnContainer}>
            <Button 
              label="Save Timer" 
              variant="primary" 
              fullWidth
              onPress={saveTimer}
            />
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  cardActive: {
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    transform: [{ scale: 1.02 }],
    borderColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  cardBody: {
    flexDirection: 'row',
    gap: 12,
  },
  imageZone: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 12,
    paddingLeft: 72, // align with text input
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timerPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '1A',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  timerPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  timerPillTextMuted: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  timerClear: {
    marginLeft: 4,
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
    marginBottom: 32,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timeInputBox: {
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    width: 80,
    height: 64,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  timeDivider: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 24,
  },
  sheetBtnContainer: {
    marginTop: 40,
    paddingBottom: 24,
  }
});
