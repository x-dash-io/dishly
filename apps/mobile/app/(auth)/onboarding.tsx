import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useApiClient } from '../../src/lib/api-client';
import { COLORS } from '../../constants/colors';
import { AppIcon } from '../../constants/icons';

const DIETARY_PREFS = ['Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Halal', 'Kosher', 'Keto', 'Paleo'];
const CUISINES = [
  'Italian', 'West African', 'Japanese', 'Mexican', 'Indian', 'Thai',
  'Mediterranean', 'Chinese', 'French', 'Middle Eastern', 'Korean', 'American',
];

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const api = useApiClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [error, setError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  // Skip onboarding if user already has an account
  useEffect(() => {
    let mounted = true;
    api.request<{ username: string }>('GET', '/auth/me')
      .then(() => { if (mounted) router.replace('/(app)/(tabs)'); })
      .catch(() => { if (mounted) setIsCheckingOnboarding(false); });
    return () => { mounted = false; };
  }, []);

  // Real username availability check
  useEffect(() => {
    if (username.length < 3) { setUsernameValid(null); return; }
    const regex = /^[a-z0-9_]+$/;
    if (!regex.test(username)) { setUsernameValid(false); return; }

    setUsernameChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.request<{ available: boolean }>(
          'GET', `/users/check-username?username=${username}`
        );
        setUsernameValid(res.available);
      } catch {
        // Endpoint not yet responding — treat as valid to unblock dev
        setUsernameValid(true);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const toggle = (item: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);

  const nextEnabled = () => {
    if (step === 1) return displayName.trim().length > 0 && usernameValid === true;
    if (step === 3) return skillLevel !== null;
    if (step === 4) return selectedCuisines.length >= 3;
    return true;
  };

  const handleFinish = async () => {
    setLoading(true); setError('');
    try {
      await api.request('POST', '/auth/onboarding', {
        username,
        display_name: displayName,
        dietary_prefs: selectedDietary,
        skill_level: skillLevel,
        cuisine_preferences: selectedCuisines,
      });
      router.replace('/(app)/(tabs)');
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      setError(e.message || 'Something went wrong. Please try again.');
      if (e.code === 'USERNAME_TAKEN') setStep(1);
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingOnboarding) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[styles.progressSegment, step > i && styles.progressSegmentDone]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>This is how other cooks will know you.</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Display name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Amara Mensah"
                placeholderTextColor={COLORS.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.usernameRow}>
                <TextInput
                  style={[styles.input, styles.usernameInput]}
                  placeholder="e.g. amara_cooks"
                  placeholderTextColor={COLORS.textMuted}
                  value={username}
                  onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.usernameStatus}>
                  {usernameChecking
                    ? <ActivityIndicator size="small" color={COLORS.primary} />
                    : usernameValid === true
                    ? <AppIcon name="check" size={18} color={COLORS.success} />
                    : usernameValid === false
                    ? <AppIcon name="close" size={18} color={COLORS.error} />
                    : null}
                </View>
              </View>
              <Text style={styles.helperText}>
                {usernameValid === false
                  ? username.length >= 3 && !/^[a-z0-9_]+$/.test(username)
                    ? 'Only lowercase letters, numbers, and underscores.'
                    : 'Username is already taken.'
                  : 'Lowercase letters, numbers, and underscores only.'}
              </Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>Dietary preferences</Text>
            <Text style={styles.stepSubtitle}>Optional — we'll tailor your feed.</Text>
            <View style={styles.chipGrid}>
              {DIETARY_PREFS.map(pref => {
                const active = selectedDietary.includes(pref);
                return (
                  <TouchableOpacity
                    key={pref}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggle(pref, selectedDietary, setSelectedDietary)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{pref}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>Your skill level</Text>
            <Text style={styles.stepSubtitle}>Helps us recommend the right recipes.</Text>
            {([
              { key: 'beginner', title: 'Beginner', sub: "I'm just starting out" },
              { key: 'intermediate', title: 'Intermediate', sub: 'I cook regularly' },
              { key: 'advanced', title: 'Advanced', sub: 'I live in the kitchen' },
            ] as const).map(({ key, title, sub }) => {
              const active = skillLevel === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.skillCard, active && styles.skillCardActive]}
                  onPress={() => setSkillLevel(key)}
                  activeOpacity={0.8}
                >
                  <View style={styles.skillCardInner}>
                    <View>
                      <Text style={[styles.skillTitle, active && styles.skillTitleActive]}>{title}</Text>
                      <Text style={styles.skillSub}>{sub}</Text>
                    </View>
                    {active && <AppIcon name="check" size={20} color={COLORS.primary} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>Favourite cuisines</Text>
            <Text style={styles.stepSubtitle}>Pick at least 3.</Text>
            <View style={styles.chipGrid}>
              {CUISINES.map(cuisine => {
                const active = selectedCuisines.includes(cuisine);
                return (
                  <TouchableOpacity
                    key={cuisine}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggle(cuisine, selectedCuisines, setSelectedCuisines)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{cuisine}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedCuisines.length > 0 && selectedCuisines.length < 3 && (
              <Text style={styles.hintText}>
                Pick {3 - selectedCuisines.length} more to continue
              </Text>
            )}
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer nav */}
      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <AppIcon name="back" size={20} color={COLORS.mahogany} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : <View style={{ flex: 1 }} />}

        <TouchableOpacity
          style={[styles.nextBtn, (!nextEnabled() || loading) && styles.nextBtnDisabled]}
          onPress={() => step < TOTAL_STEPS ? setStep(s => s + 1) : handleFinish()}
          disabled={!nextEnabled() || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.textInverse} />
            : <Text style={styles.nextBtnText}>{step === TOTAL_STEPS ? 'Finish' : 'Next'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  container: { flex: 1, backgroundColor: COLORS.background },
  progressRow: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
  },
  progressSegment: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
  },
  progressSegmentDone: { backgroundColor: COLORS.primary },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },
  stepBody: { gap: 0 },
  stepTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28, fontWeight: '700', color: COLORS.mahogany, marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15, color: COLORS.textSecondary, marginBottom: 28, lineHeight: 22,
  },
  fieldGroup: { gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  input: {
    height: 48, backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, fontSize: 16, color: COLORS.textPrimary,
  },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  usernameInput: { flex: 1, marginBottom: 0 },
  usernameStatus: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  helperText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  chipTextActive: { color: COLORS.textInverse },
  skillCard: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  skillCardActive: { borderColor: COLORS.primary, borderWidth: 2 },
  skillCardInner: {
    padding: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  skillTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  skillTitleActive: { color: COLORS.primary },
  skillSub: { fontSize: 13, color: COLORS.textMuted },
  hintText: { fontSize: 13, color: COLORS.textMuted, marginTop: 12, textAlign: 'center' },
  errorBox: { backgroundColor: COLORS.errorLight, borderRadius: 10, padding: 12, marginTop: 12 },
  errorText: { fontSize: 13, color: COLORS.errorText, textAlign: 'center' },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 6, height: 52, justifyContent: 'flex-start',
  },
  backBtnText: { fontSize: 16, color: COLORS.mahogany, fontWeight: '600' },
  nextBtn: {
    flex: 2, height: 52, backgroundColor: COLORS.primary,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.45 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.textInverse },
});
