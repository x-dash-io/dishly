import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/colors';

function getPasswordStrength(pass: string) {
  if (pass.length === 0) return null;
  if (pass.length < 6) return { label: 'Weak', color: COLORS.error, pct: '33%' };
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  if (pass.length >= 8 && hasSpecial && hasNumber) return { label: 'Strong', color: COLORS.success, pct: '100%' };
  return { label: 'Medium', color: COLORS.warning, pct: '66%' };
}

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const strength = getPasswordStrength(password);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setLoading(true); setError('');
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage: string }[] };
      setError(e.errors?.[0]?.longMessage || 'Failed to create account');
    } finally { setLoading(false); }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(auth)/onboarding');
      }
    } catch (err: unknown) {
      const e = err as { errors?: { longMessage: string }[] };
      setError(e.errors?.[0]?.longMessage || 'Verification failed');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.logoBlock}>
            <Text style={styles.logo}>dish<Text style={{ color: COLORS.primary }}>l</Text>y</Text>
            <Text style={styles.tagline}>every dish tells a story.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {pendingVerification ? 'Check your email' : 'Create your account'}
            </Text>

            {!pendingVerification ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={COLORS.textMuted}
                    value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput style={styles.input} placeholder="8+ characters" placeholderTextColor={COLORS.textMuted}
                    value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
                  {strength && (
                    <View style={styles.strengthRow}>
                      <View style={styles.strengthTrack}>
                        <View style={[styles.strengthFill, { width: strength.pct, backgroundColor: strength.color }]} />
                      </View>
                      <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirm password</Text>
                  <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" />
                </View>

                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                <TouchableOpacity style={[styles.primaryBtn, (loading || !email || !password) && styles.btnDisabled]}
                  onPress={onSignUpPress} disabled={loading || !email || !password} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color={COLORS.textInverse} /> : <Text style={styles.primaryBtnText}>Create account</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.verifyHint}>
                  We sent a 6-digit code to <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{email}</Text>
                </Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Verification code</Text>
                  <TextInput style={[styles.input, styles.codeInput]} placeholder="000000" placeholderTextColor={COLORS.textMuted}
                    value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
                </View>
                {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
                <TouchableOpacity style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={onPressVerify} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color={COLORS.textInverse} /> : <Text style={styles.primaryBtnText}>Verify &amp; continue</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPendingVerification(false)} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {!pendingVerification && (
            <TouchableOpacity style={styles.footerLink} onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  logoBlock: { alignItems: 'center', marginBottom: 32 },
  logo: {
    fontSize: 48,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: COLORS.mahogany, fontWeight: '700', letterSpacing: -1,
  },
  tagline: { fontSize: 15, color: COLORS.mahogany, fontStyle: 'italic', opacity: 0.7, marginTop: 6 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: COLORS.border, gap: 16,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  input: {
    height: 48, backgroundColor: COLORS.background, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14,
    fontSize: 16, color: COLORS.textPrimary,
  },
  codeInput: { fontSize: 24, fontWeight: '700', textAlign: 'center', letterSpacing: 8 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  strengthTrack: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2 },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 48, textAlign: 'right' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12 },
  errorText: { fontSize: 13, color: '#991B1B', textAlign: 'center' },
  primaryBtn: {
    height: 52, backgroundColor: COLORS.primary,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.textInverse },
  verifyHint: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  backLink: { alignItems: 'center', marginTop: 4 },
  backLinkText: { fontSize: 14, color: COLORS.textSecondary },
  footerLink: { marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
});
