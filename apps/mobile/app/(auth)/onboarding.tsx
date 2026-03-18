import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiClient } from '../../src/lib/api-client';

// const { width } = Dimensions.get('window');

const DIETARY_PREFS = ['Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Halal', 'Kosher', 'Keto', 'Paleo'];
const CUISINES = ['Italian', 'West African', 'Japanese', 'Mexican', 'Indian', 'Thai', 'Mediterranean', 'Chinese', 'French', 'Middle Eastern', 'Korean', 'American'];

export default function OnboardingScreen() {
  const router = useRouter();
  const api = useApiClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [error, setError] = useState('');

  // Step 1: Name & Username
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  // Step 2: Dietary Preferences
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  // Step 3: Skill Level
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);

  // Step 4: Favorite Cuisines
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  // Initial Onboarding Check
  useEffect(() => {
    let mounted = true;
    async function checkUser() {
      try {
        await api.get('/auth/me');
        // If it succeeds, they are already onboarded, redirect to app
        if (mounted) {
          router.replace('/(app)/(tabs)');
        }
      } catch (err: any) {
        // If it throws ONBOARDING_REQUIRED, we let them see the form
        if (mounted) {
          setIsCheckingOnboarding(false);
        }
      }
    }
    checkUser();
    return () => { mounted = false; };
  }, []);

  // Username validation effect
  useEffect(() => {
    if (username.length < 3) {
      setUsernameValid(null);
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        // Mocking check for now as the endpoint /users/check-username might not be in the stub yet
        // In the real app: const { available } = await api.get<{available: boolean}>(`/users/check-username?username=${username}`);
        // setUsernameValid(available);
        setUsernameValid(true); 
      } catch {
        setUsernameValid(false);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/onboarding', {
        username,
        display_name: displayName,
        dietary_prefs: selectedDietary,
        skill_level: skillLevel,
        cuisine_preferences: selectedCuisines,
      });
      router.replace('/(app)/(tabs)');
    } catch (err: unknown) {
      const apiError = err as { message?: string; code?: string };
      setError(apiError.message || 'Onboarding failed');
      if (apiError.code === 'USERNAME_TAKEN') {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextEnabled = () => {
    if (step === 1) return displayName.length > 0 && usernameValid === true;
    if (step === 3) return skillLevel !== null;
    if (step === 4) return selectedCuisines.length >= 3;
    return true;
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's your name?</Text>
      <TextInput
        style={styles.input}
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <View style={styles.usernameContainer}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Username"
          value={username}
          onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          autoCapitalize="none"
        />
        <View style={styles.validationIcon}>
          {usernameChecking ? <ActivityIndicator size="small" color="#E8531A" /> : (
            usernameValid === true ? <Text style={{color: '#4CAF50', fontSize: 20}}>✓</Text> :
            usernameValid === false ? <Text style={{color: '#F44336', fontSize: 20}}>✗</Text> : null
          )}
        </View>
      </View>
      <Text style={styles.helperText}>Lower case, numbers, and underscores only.</Text>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Dietary preferences</Text>
      <Text style={styles.stepSubtitle}>Optional — we'll use this to tailor your feed.</Text>
      <View style={styles.tagGrid}>
        {DIETARY_PREFS.map(pref => (
          <TouchableOpacity 
            key={pref}
            style={[styles.tag, selectedDietary.includes(pref) && styles.tagSelected]}
            onPress={() => toggleSelection(pref, selectedDietary, setSelectedDietary)}
          >
            <Text style={[styles.tagText, selectedDietary.includes(pref) && styles.tagTextSelected]}>{pref}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Skill level</Text>
      <TouchableOpacity 
        style={[styles.skillCard, skillLevel === 'beginner' && styles.skillCardSelected]}
        onPress={() => setSkillLevel('beginner')}
      >
        <Text style={styles.skillTitle}>Beginner</Text>
        <Text style={styles.skillSubtext}>I'm just starting out</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.skillCard, skillLevel === 'intermediate' && styles.skillCardSelected]}
        onPress={() => setSkillLevel('intermediate')}
      >
        <Text style={styles.skillTitle}>Intermediate</Text>
        <Text style={styles.skillSubtext}>I cook regularly</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.skillCard, skillLevel === 'advanced' && styles.skillCardSelected]}
        onPress={() => setSkillLevel('advanced')}
      >
        <Text style={styles.skillTitle}>Advanced</Text>
        <Text style={styles.skillSubtext}>I live in the kitchen</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Favourite cuisines</Text>
      <Text style={styles.stepSubtitle}>Pick 3 or more</Text>
      <View style={styles.tagGrid}>
        {CUISINES.map(cuisine => (
          <TouchableOpacity 
            key={cuisine}
            style={[styles.tag, selectedCuisines.includes(cuisine) && styles.tagSelected]}
            onPress={() => toggleSelection(cuisine, selectedCuisines, setSelectedCuisines)}
          >
            <Text style={[styles.tagText, selectedCuisines.includes(cuisine) && styles.tagTextSelected]}>{cuisine}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6ED' }}>
         <ActivityIndicator size="large" color="#E8531A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map(s => (
          <View key={s} style={[styles.progressDot, step >= s && styles.progressDotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.primaryButton, (!nextEnabled() || loading) && styles.buttonDisabled]} 
          onPress={() => step < 4 ? setStep(step + 1) : handleFinish()}
          disabled={!nextEnabled() || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.primaryButtonText}>{step === 4 ? 'Finish' : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6ED',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  progressDotActive: {
    backgroundColor: '#E8531A',
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5E3C2C',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#5E3C2C',
    marginBottom: 24,
  },
  input: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  validationIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8531A',
    backgroundColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: '#E8531A',
  },
  tagText: {
    color: '#E8531A',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#fff',
  },
  skillCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  skillCardSelected: {
    borderColor: '#E8531A',
    borderWidth: 2,
  },
  skillTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5E3C2C',
  },
  skillSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  footer: {
    padding: 24,
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    height: 56,
    backgroundColor: '#E8531A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#5E3C2C',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  errorText: {
    color: '#F44336',
    marginTop: 20,
    textAlign: 'center',
  },
});
