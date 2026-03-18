import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useApiClient } from '../../src/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────
type Mode = 'choose' | 'camera' | 'text' | 'dish' | 'review' | 'dish-preview';

interface DetectedIngredient {
  name: string;
  quantity?: string;
  unit?: string;
  confidence?: number;
}

interface IdentifyResult {
  dish_name: string;
  cuisine: string;
  confidence: number;
  details?: string;
}

const DIETARY_PREFS = ['Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Halal', 'Keto', 'Paleo'];
const { width: SW } = Dimensions.get('window');

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function AiGenerateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const api = useApiClient();

  const [mode, setMode] = useState<Mode>('choose');

  // Fridge scan state
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Ingredient review state
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newChip, setNewChip] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [servings, setServings] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Text mode
  const [textInput, setTextInput] = useState('');

  // Dish-reverse state
  const [dishImageUri, setDishImageUri] = useState<string | null>(null);
  const [dishImageUrl, setDishImageUrl] = useState<string | null>(null);
  const [dishPhase, setDishPhase] = useState<'idle' | 'identifying' | 'generating' | 'error'>('idle');
  const [dishIdentified, setDishIdentified] = useState<IdentifyResult | null>(null);
  const [dishError, setDishError] = useState<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetAll = () => {
    setCapturedImageUri(null); setCapturedImageUrl(null);
    setScanError(null); setIngredients([]); setNewChip('');
    setSelectedDietary([]); setServings(2); setIsGenerating(false);
    setGenerateError(null); setTextInput('');
    setDishImageUri(null); setDishImageUrl(null);
    setDishPhase('idle'); setDishIdentified(null); setDishError(null);
  };

  const handleBack = () => {
    if (mode === 'dish-preview') { setMode('dish'); setDishPhase('idle'); setDishError(null); return; }
    if (mode !== 'choose') { resetAll(); setMode('choose'); return; }
    router.back();
  };

  const headerTitle = (): string => {
    switch (mode) {
      case 'choose':       return '✦ AI Generate';
      case 'camera':       return 'Scan Fridge';
      case 'text':         return 'Enter Ingredients';
      case 'dish':         return 'Reverse a Dish';
      case 'dish-preview': return 'Identify & Generate';
      case 'review':       return 'Review & Generate';
    }
  };

  // ── Fridge scan ────────────────────────────────────────────────────────────
  const pickFridgeImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setCapturedImageUri(uri);
        await scanIngredients(uri);
      }
    } catch { setScanError('Could not open library. Please try again.'); }
  };

  const scanIngredients = async (imageUri: string) => {
    setIsScanning(true); setScanError(null);
    try {
      // TODO: upload to R2 before sending. Using local URI as placeholder.
      const uploadedUrl = imageUri;
      setCapturedImageUrl(uploadedUrl);
      const res = await api.request<{ ingredients: DetectedIngredient[] }>(
        'POST', '/ai/image-to-ingredients', { image_url: uploadedUrl }
      );
      const names = res.ingredients.map(i =>
        [i.quantity, i.unit, i.name].filter(Boolean).join(' ')
      );
      setIngredients(names);
      setMode('review');
    } catch { setScanError("Couldn't detect ingredients. Try a clearer photo or enter manually."); }
    finally { setIsScanning(false); }
  };

  // ── Text mode ──────────────────────────────────────────────────────────────
  const confirmTextIngredients = () => {
    const lines = textInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { Alert.alert('Empty', 'Please enter at least one ingredient.'); return; }
    setIngredients(lines); setMode('review');
  };

  // ── Review → generate recipe ───────────────────────────────────────────────
  const addChip = () => {
    const v = newChip.trim();
    if (v && !ingredients.includes(v)) setIngredients(prev => [...prev, v]);
    setNewChip('');
  };
  const removeChip = (idx: number) => setIngredients(prev => prev.filter((_, i) => i !== idx));

  const generateRecipe = async () => {
    if (!ingredients.length) return;
    setIsGenerating(true); setGenerateError(null);
    try {
      const res = await api.request<{ id: string }>(
        'POST', '/ai/ingredients-to-recipe',
        { ingredients, dietary_filters: selectedDietary, servings }
      );
      router.replace(`/recipe/${res.id}`);
    } catch {
      setGenerateError("Couldn't generate a recipe. Try adjusting your ingredients.");
      setIsGenerating(false);
    }
  };

  // ── Dish reverse ───────────────────────────────────────────────────────────
  const pickDishImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setDishImageUri(result.assets[0].uri);
        setDishPhase('idle'); setDishError(null);
        setMode('dish-preview');
      }
    } catch { Alert.alert('Error', 'Could not open library.'); }
  };

  const identifyAndGenerate = async () => {
    if (!dishImageUri) return;
    setDishError(null);

    // Phase 1 — identify
    setDishPhase('identifying');
    let identified: IdentifyResult;
    try {
      // TODO: upload to R2. Using local URI as placeholder.
      const uploadedUrl = dishImageUri;
      setDishImageUrl(uploadedUrl);

      identified = await api.request<IdentifyResult>(
        'POST', '/ai/identify-dish', { image_url: uploadedUrl }
      );
      setDishIdentified(identified);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code === 'DISH_NOT_RECOGNISED') {
        setDishError('not_recognised');
      } else {
        setDishError('network');
      }
      setDishPhase('error');
      return;
    }

    // Phase 2 — generate recipe from identified dish
    setDishPhase('generating');
    try {
      const res = await api.request<{ id: string }>(
        'POST', '/ai/dish-to-recipe-from-name',
        {
          dish_name:  identified.dish_name,
          cuisine:    identified.cuisine,
          details:    identified.details ?? '',
          image_url:  dishImageUrl ?? dishImageUri,
        }
      );
      router.replace(`/recipe/${res.id}`);
    } catch {
      setDishError('network');
      setDishPhase('error');
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <AppIcon name="back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Step A: Choose ── */}
      {mode === 'choose' && (
        <ScrollView contentContainerStyle={styles.chooseContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.chooseSubtitle}>Tell me what you have and I'll craft a recipe.</Text>
          <View style={styles.chooseCards}>

            <TouchableOpacity style={styles.chooseCard} activeOpacity={0.85} onPress={() => setMode('camera')}>
              <View style={[styles.cardIconBg, { backgroundColor: COLORS.aiPurple + '22' }]}>
                <AppIcon name="aiCamera" size={32} color={COLORS.aiPurple} />
              </View>
              <Text style={styles.cardTitle}>Scan my fridge</Text>
              <Text style={styles.cardSubtitle}>Take a photo of your ingredients</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chooseCard} activeOpacity={0.85} onPress={() => setMode('text')}>
              <View style={[styles.cardIconBg, { backgroundColor: COLORS.primary + '22' }]}>
                <AppIcon name="create" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Enter ingredients</Text>
              <Text style={styles.cardSubtitle}>Type or paste what you have</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chooseCard, styles.dishCard]}
              activeOpacity={0.85}
              onPress={() => setMode('dish')}
            >
              <View style={[styles.cardIconBg, { backgroundColor: COLORS.aiPurple + '15' }]}>
                <AppIcon name="aiScan" size={32} color={COLORS.aiPurple} />
              </View>
              <Text style={styles.cardTitle}>Reverse a dish</Text>
              <Text style={styles.cardSubtitle}>Photo any dish to get its recipe</Text>
              <Badge variant="ai" label="AI" size="sm" />
            </TouchableOpacity>

          </View>
        </ScrollView>
      )}

      {/* ── Step B: Camera (fridge scan) ── */}
      {mode === 'camera' && (
        <ScrollView contentContainerStyle={styles.cameraContainer}>
          {capturedImageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedImageUri }} style={styles.previewImage} contentFit="cover" />
              {isScanning && (
                <View style={styles.scanOverlay}>
                  <ActivityIndicator size="large" color={COLORS.aiPurple} />
                  <Text style={styles.scanningText}>Scanning your ingredients…</Text>
                </View>
              )}
              {scanError && (
                <View style={styles.errorCard}>
                  <AppIcon name="alert" size={20} color={COLORS.error} />
                  <Text style={styles.errorText}>{scanError}</Text>
                  <Button label="Try Again" variant="ghost" onPress={() => { setCapturedImageUri(null); setScanError(null); }} />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <AppIcon name="aiCamera" size={64} color={COLORS.aiPurple} />
              <Text style={styles.cameraHint}>Choose a photo of your fridge, pantry or ingredients</Text>
            </View>
          )}
          {!isScanning && (
            <View style={styles.cameraActions}>
              <Button label="Choose from library" variant="primary" icon="aiImage" onPress={pickFridgeImage} fullWidth />
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Step B: Text ── */}
      {mode === 'text' && (
        <View style={styles.textContainer}>
          <Text style={styles.textHint}>
            One ingredient per line, e.g.{'\n'}3 chicken thighs{'\n'}2 cups rice{'\n'}1 lemon
          </Text>
          <TextInput
            style={styles.textInputField}
            placeholder={'3 chicken thighs\n2 cups rice\n1 lemon\n…'}
            placeholderTextColor={COLORS.textMuted}
            multiline
            value={textInput}
            onChangeText={setTextInput}
          />
          <Button
            label="Use these ingredients"
            variant="primary"
            fullWidth
            onPress={confirmTextIngredients}
            style={{ marginTop: 16 }}
          />
        </View>
      )}

      {/* ── Step B: Dish mode — pick image ── */}
      {mode === 'dish' && (
        <View style={styles.dishPickContainer}>
          <View style={styles.dishHintCard}>
            <AppIcon name="aiScan" size={28} color={COLORS.aiPurple} />
            <Text style={styles.dishHintTitle}>Reverse-engineer any dish</Text>
            <Text style={styles.dishHintText}>
              Point at a restaurant dish, a friend's plate, a cookbook photo, or anything you want to cook.
              AI will identify it and generate the full recipe.
            </Text>
          </View>
          <Button
            label="Choose a dish photo"
            variant="ai"
            icon="aiImage"
            fullWidth
            onPress={pickDishImage}
          />
        </View>
      )}

      {/* ── Step B: Dish preview — confirm and generate ── */}
      {mode === 'dish-preview' && dishImageUri && (
        <ScrollView contentContainerStyle={styles.cameraContainer}>
          <View style={styles.previewContainer}>
            <Image source={{ uri: dishImageUri }} style={styles.previewImage} contentFit="cover" />
            {(dishPhase === 'identifying' || dishPhase === 'generating') && (
              <View style={styles.scanOverlay}>
                <ActivityIndicator size="large" color={COLORS.aiPurple} />
                <Text style={styles.scanningText}>
                  {dishPhase === 'identifying'
                    ? 'Identifying your dish…'
                    : `Generating recipe for ${dishIdentified?.dish_name ?? 'your dish'}…`}
                </Text>
              </View>
            )}
          </View>

          {/* Error card */}
          {dishPhase === 'error' && (
            <View style={[styles.errorCard, { marginTop: 20, width: SW - 48 }]}>
              <AppIcon name="alert" size={20} color={COLORS.error} />
              <Text style={styles.errorTitle}>
                {dishError === 'not_recognised'
                  ? "Couldn't identify this dish"
                  : "Something went wrong"}
              </Text>
              <Text style={styles.errorText}>
                {dishError === 'not_recognised'
                  ? 'Try a clearer photo with better lighting, or use the ingredients scanner instead.'
                  : 'Check your connection and try again.'}
              </Text>
              <View style={styles.errorActions}>
                <Button label="Try again" variant="ghost" size="sm"
                  onPress={() => { setDishPhase('idle'); setDishError(null); }} />
                <Button label="Use scanner" variant="primary" size="sm"
                  onPress={() => { resetAll(); setMode('camera'); }} />
              </View>
            </View>
          )}

          {dishPhase === 'idle' && (
            <View style={[styles.cameraActions, { width: SW - 48 }]}>
              <Button
                label="Retake"
                variant="ghost"
                onPress={() => { setDishImageUri(null); setMode('dish'); }}
                style={{ flex: 1 }}
              />
              <Button
                label="✦ Identify & Generate"
                variant="ai"
                onPress={identifyAndGenerate}
                style={{ flex: 2 }}
              />
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Step C: Review & Generate ── */}
      {mode === 'review' && (
        <ScrollView contentContainerStyle={styles.reviewContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Ingredients</Text>
          <Text style={styles.sectionHint}>Tap × to remove, or add more below.</Text>
          <View style={styles.chipsWrap}>
            {ingredients.map((ing, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{ing}</Text>
                <TouchableOpacity style={styles.chipRemove} onPress={() => removeChip(idx)}>
                  <AppIcon name="close" size={12} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addChipRow}>
            <TextInput
              style={styles.chipInput}
              placeholder="Add ingredient…"
              placeholderTextColor={COLORS.textMuted}
              value={newChip}
              onChangeText={setNewChip}
              onSubmitEditing={addChip}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.chipAddBtn} onPress={addChip}>
              <AppIcon name="add" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Dietary filters</Text>
          <View style={[styles.chipsWrap, { marginTop: 10 }]}>
            {DIETARY_PREFS.map(pref => {
              const active = selectedDietary.includes(pref);
              return (
                <TouchableOpacity
                  key={pref}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() =>
                    setSelectedDietary(prev =>
                      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
                    )
                  }
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{pref}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Servings</Text>
          <View style={styles.servingsRow}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setServings(s => Math.max(1, s - 1))}>
              <AppIcon name="remove" size={22} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.servingsNum}>{servings}</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => setServings(s => Math.min(20, s + 1))}>
              <AppIcon name="add" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {generateError && (
            <View style={styles.errorCard}>
              <AppIcon name="alert" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{generateError}</Text>
            </View>
          )}

          {isGenerating ? (
            <View style={styles.generatingRow}>
              <ActivityIndicator color={COLORS.aiPurple} />
              <Text style={styles.generatingText}>Crafting your recipe…</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.generateBtn, ingredients.length === 0 && { opacity: 0.5 }]}
              activeOpacity={0.85}
              disabled={ingredients.length === 0}
              onPress={generateRecipe}
            >
              <AppIcon name="aiGenerate" size={22} color={COLORS.textInverse} />
              <Text style={styles.generateBtnText}>✦ Generate Recipe</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:      { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: COLORS.aiPurple },

  // Choose
  chooseContainer: { padding: 24, paddingTop: 32 },
  chooseSubtitle: {
    fontSize: 15, color: COLORS.textSecondary, textAlign: 'center',
    marginBottom: 28, lineHeight: 22,
  },
  chooseCards:  { gap: 14 },
  chooseCard: {
    backgroundColor: COLORS.surface, borderRadius: 18, padding: 20,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dishCard: {
    borderColor: COLORS.aiPurple + '50',
    backgroundColor: COLORS.aiPurpleLight,
  },
  cardIconBg: {
    width: 64, height: 64, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle:    { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  cardSubtitle: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 17 },

  // Camera / Preview
  cameraContainer: { padding: 24, alignItems: 'center', gap: 20 },
  previewContainer: {
    width: SW - 48, borderRadius: 16, overflow: 'hidden',
    aspectRatio: 4 / 3, position: 'relative',
  },
  previewImage:  { width: '100%', height: '100%' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  scanningText: { color: COLORS.aiPurpleLight, fontStyle: 'italic', fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20 },
  cameraPlaceholder: {
    width: SW - 48, aspectRatio: 4 / 3,
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.aiPurple,
    justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  cameraHint: { color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 24, lineHeight: 22 },
  cameraActions: { flexDirection: 'row', gap: 12, width: SW - 48 },

  // Dish pick
  dishPickContainer: { flex: 1, padding: 24, gap: 24, justifyContent: 'center' },
  dishHintCard: {
    backgroundColor: COLORS.aiPurpleLight, borderRadius: 18, padding: 24,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: COLORS.aiPurple + '40',
  },
  dishHintTitle: { fontSize: 17, fontWeight: '700', color: COLORS.aiPurple, textAlign: 'center' },
  dishHintText: { fontSize: 14, color: '#5B21B6', textAlign: 'center', lineHeight: 22 },

  // Text
  textContainer: { flex: 1, padding: 24 },
  textHint: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12, lineHeight: 20 },
  textInputField: {
    flex: 1, backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 16, padding: 16,
    fontSize: 16, color: COLORS.textPrimary, textAlignVertical: 'top', minHeight: 180,
  },

  // Review
  reviewContainer: { padding: 24, paddingBottom: 48 },
  sectionLabel:  { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  sectionHint:   { fontSize: 13, color: COLORS.textMuted, marginBottom: 14 },
  chipsWrap:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 20,
    paddingVertical: 8, paddingLeft: 14, paddingRight: 8,
    borderWidth: 1, borderColor: COLORS.border, gap: 6,
  },
  chipText:    { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  chipRemove: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  addChipRow: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center' },
  chipInput: {
    flex: 1, backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: COLORS.textPrimary,
  },
  chipAddBtn: {
    width: 44, height: 44, backgroundColor: COLORS.primary + '22',
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'transparent',
  },
  filterChipActive:    { backgroundColor: COLORS.aiPurple, borderColor: COLORS.aiPurple },
  filterChipText:      { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
  filterChipTextActive: { color: COLORS.textInverse },
  servingsRow:  { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12 },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  servingsNum: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, minWidth: 32, textAlign: 'center' },

  // Generate
  generateBtn: {
    marginTop: 32, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.aiPurple, borderRadius: 16, height: 54,
    shadowColor: COLORS.aiPurple, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  generateBtnText: { color: COLORS.textInverse, fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  generatingRow: {
    marginTop: 32, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 12, height: 54,
    backgroundColor: COLORS.aiPurple + '18', borderRadius: 16,
  },
  generatingText: { color: COLORS.aiPurple, fontStyle: 'italic', fontSize: 16, fontWeight: '600' },

  // Errors
  errorCard: {
    marginTop: 16, backgroundColor: COLORS.errorLight,
    borderRadius: 14, padding: 16, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: COLORS.error + '40',
  },
  errorTitle: { fontSize: 15, fontWeight: '700', color: COLORS.error, textAlign: 'center' },
  errorText:  { fontSize: 13, color: COLORS.errorText, textAlign: 'center', lineHeight: 20 },
  errorActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
