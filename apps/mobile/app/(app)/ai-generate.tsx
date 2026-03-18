import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';
import { Button } from '../../components/ui/Button';
import { useApiClient } from '../../src/lib/api-client';

type Mode = 'choose' | 'camera' | 'text' | 'review';

const DIETARY_PREFS = ['Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Halal', 'Keto', 'Paleo'];
const { width: SW } = Dimensions.get('window');

interface DetectedIngredient {
  name: string;
  quantity?: string;
  unit?: string;
  confidence?: number;
}

export default function AiGenerateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const api = useApiClient();

  const [mode, setMode] = useState<Mode>('choose');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  
  // Scanning/generating states
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  
  // Review state
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newChip, setNewChip] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [servings, setServings] = useState(2);

  // ──────────────────────────────────────────────
  // Step B: Camera mode
  // ──────────────────────────────────────────────
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setCapturedImageUri(uri);
        await scanIngredients(uri);
      }
    } catch {
      setScanError('Could not open library. Please try again.');
    }
  };

  const scanIngredients = async (imageUri: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      // For now, we use the local URI as a proxy and POST it directly.
      // In production, upload to R2 first, then send the public URL.
      // Here we fake the upload and pass the local URI as-is.
      const uploadedUrl = imageUri; // Placeholder; in prod: pickAndUpload({ purpose: 'ai-input' })
      setCapturedImageUrl(uploadedUrl);
      
      const res = await api.request<{ ingredients: DetectedIngredient[] }>(
        'POST',
        '/ai/image-to-ingredients',
        { image_url: uploadedUrl }
      );
      const names = res.ingredients.map(i => {
        const parts = [i.quantity, i.unit, i.name].filter(Boolean);
        return parts.join(' ');
      });
      setIngredients(names);
      setMode('review');
    } catch {
      setScanError("Couldn't detect ingredients. Try a clearer photo or enter manually.");
    } finally {
      setIsScanning(false);
    }
  };

  // ──────────────────────────────────────────────
  // Step B: Text mode
  // ──────────────────────────────────────────────
  const confirmTextIngredients = () => {
    const lines = textInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      Alert.alert('Empty', 'Please enter at least one ingredient.');
      return;
    }
    setIngredients(lines);
    setMode('review');
  };

  // ──────────────────────────────────────────────
  // Step C: Review & Generate
  // ──────────────────────────────────────────────
  const addChip = () => {
    const v = newChip.trim();
    if (v && !ingredients.includes(v)) {
      setIngredients(prev => [...prev, v]);
    }
    setNewChip('');
  };

  const removeChip = (idx: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await api.request<{ id: string }>(
        'POST',
        '/ai/ingredients-to-recipe',
        {
          ingredients,
          dietary_filters: selectedDietary,
          servings,
        }
      );
      router.replace(`/recipe/${res.id}`);
    } catch {
      setGenerateError("Couldn't generate a recipe. Try adjusting your ingredients.");
      setIsGenerating(false);
    }
  };

  // ──────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (mode === 'camera' || mode === 'text') {
              setMode('choose');
              setCapturedImageUri(null);
            } else if (mode === 'review') {
              setMode('choose');
              setIngredients([]);
            } else {
              router.back();
            }
          }}
        >
          <AppIcon name="back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'choose' ? '✦ AI Generate' : mode === 'review' ? 'Review & Generate' : mode === 'camera' ? 'Scan Fridge' : 'Enter Ingredients'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Step A: Choose ── */}
      {mode === 'choose' && (
        <View style={styles.chooseContainer}>
          <Text style={styles.chooseSubtitle}>Tell me what you have and I'll craft a recipe.</Text>
          <View style={styles.chooseCards}>
            <TouchableOpacity style={styles.chooseCard} activeOpacity={0.85} onPress={() => setMode('camera')}>
              <View style={[styles.cardIconBg, { backgroundColor: COLORS.aiPurple + '22' }]}>
                <AppIcon name="aiCamera" size={36} color={COLORS.aiPurple} />
              </View>
              <Text style={styles.cardTitle}>Scan my fridge</Text>
              <Text style={styles.cardSubtitle}>Take a photo of your ingredients</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chooseCard} activeOpacity={0.85} onPress={() => setMode('text')}>
              <View style={[styles.cardIconBg, { backgroundColor: COLORS.primary + '22' }]}>
                <AppIcon name="create" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Enter ingredients</Text>
              <Text style={styles.cardSubtitle}>Type or paste what you have</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Step B: Camera ── */}
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

          {!capturedImageUri && (
            <Button
              label="Choose from Library"
              variant="primary"
              fullWidth
              onPress={pickImage}
              style={{ margin: 24, marginTop: 32 }}
            />
          )}
        </ScrollView>
      )}

      {/* ── Step B: Text ── */}
      {mode === 'text' && (
        <View style={styles.textContainer}>
          <Text style={styles.textHint}>One ingredient per line — include amounts if you know them.</Text>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder={'e.g.\n3 chicken thighs\n2 cups rice\n1 lemon\nfresh coriander'}
            placeholderTextColor={COLORS.textMuted}
            value={textInput}
            onChangeText={setTextInput}
            textAlignVertical="top"
          />
          <Button
            label="Review Ingredients →"
            variant="primary"
            fullWidth
            disabled={!textInput.trim()}
            onPress={confirmTextIngredients}
            style={{ marginTop: 20 }}
          />
        </View>
      )}

      {/* ── Step C: Review ── */}
      {mode === 'review' && (
        <ScrollView contentContainerStyle={[styles.reviewContainer, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.sectionLabel}>Detected Ingredients</Text>
          <Text style={styles.sectionHint}>Tap × to remove, or add more below.</Text>

          {/* Chip list */}
          <View style={styles.chipsWrap}>
            {ingredients.map((ing, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{ing}</Text>
                <TouchableOpacity onPress={() => removeChip(idx)} style={styles.chipRemove}>
                  <AppIcon name="close" size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add chip */}
          <View style={styles.addChipRow}>
            <TextInput
              style={styles.chipInput}
              placeholder="Add another ingredient…"
              placeholderTextColor={COLORS.textMuted}
              value={newChip}
              onChangeText={setNewChip}
              onSubmitEditing={addChip}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.chipAddBtn} onPress={addChip}>
              <AppIcon name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Dietary filters */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Dietary Filters</Text>
          <View style={styles.chipsWrap}>
            {DIETARY_PREFS.map(pref => {
              const active = selectedDietary.includes(pref);
              return (
                <TouchableOpacity
                  key={pref}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedDietary(prev => active ? prev.filter(p => p !== pref) : [...prev, pref])}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{pref}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Servings */}
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

          {/* Error */}
          {generateError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{generateError}</Text>
            </View>
          )}

          {/* Generate button */}
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
              <AppIcon name="aiGenerate" size={22} color="#FFF" />
              <Text style={styles.generateBtnText}>✦ Generate Recipe</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.aiPurple },

  // Step A — Choose
  chooseContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  chooseSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  chooseCards: { flexDirection: 'row', gap: 16 },
  chooseCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardIconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  cardSubtitle: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },

  // Step B — Camera
  cameraContainer: { padding: 24, alignItems: 'center' },
  previewContainer: { width: SW - 48, borderRadius: 16, overflow: 'hidden', aspectRatio: 4/3, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  scanningText: { color: COLORS.aiPurple, fontStyle: 'italic', fontSize: 16, fontWeight: '600' },
  cameraPlaceholder: {
    width: SW - 48,
    aspectRatio: 4/3,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.aiPurple,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  cameraHint: { color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 24, lineHeight: 22 },

  // Step B — Text
  textContainer: { flex: 1, padding: 24 },
  textHint: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlignVertical: 'top',
    minHeight: 200,
  },

  // Step C — Review
  reviewContainer: { padding: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  sectionHint: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  chipText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  chipRemove: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  addChipRow: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center' },
  chipInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  chipAddBtn: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primary + '22',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  filterChipActive: { backgroundColor: COLORS.aiPurple, borderColor: COLORS.aiPurple },
  filterChipText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
  filterChipTextActive: { color: '#FFF' },
  servingsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 12 },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  servingsNum: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, minWidth: 32, textAlign: 'center' },

  // Generate
  generateBtn: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.aiPurple,
    borderRadius: 16,
    height: 54,
    shadowColor: COLORS.aiPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  generateBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  generatingRow: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 54,
    backgroundColor: COLORS.aiPurple + '18',
    borderRadius: 16,
  },
  generatingText: { color: COLORS.aiPurple, fontStyle: 'italic', fontSize: 16, fontWeight: '600' },
  errorCard: {
    marginTop: 16,
    backgroundColor: COLORS.error + '18',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: COLORS.error, fontSize: 14, textAlign: 'center' },
});
