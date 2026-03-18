import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: '', color: '#ddd' };
    if (pass.length < 6) return { label: 'Weak', color: '#ff4d4d' };
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    if (pass.length >= 8 && hasSpecial && hasNumber) return { label: 'Strong', color: '#4CAF50' };
    return { label: 'Medium', color: '#FF9800' };
  };

  const strength = getPasswordStrength(password);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError('');

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const clerkError = err as { errors?: { longMessage: string }[] };
      setError(clerkError.errors?.[0]?.longMessage || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(auth)/onboarding');
      } else {
        console.warn('Sign up status not complete:', completeSignUp.status);
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { longMessage: string }[] };
      setError(clerkError.errors?.[0]?.longMessage || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.header}>
            <Text style={styles.title}>{pendingVerification ? 'Verify Email' : 'Join Dishly'}</Text>
            {!pendingVerification && <Text style={styles.subtitle}>Start your culinary story today.</Text>}
          </View>

          {!pendingVerification ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={[styles.strengthBar, { backgroundColor: strength.color, width: strength.label === 'Strong' ? '100%' : strength.label === 'Medium' ? '66%' : '33%' }]} />
                  <Text style={[styles.strengthText, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={onSignUpPress}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.footerLink}>Already have an account? <Text style={{fontWeight: 'bold'}}>Sign in</Text></Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.instructions}>Enter the code sent to your email</Text>
              <TextInput
                style={styles.input}
                placeholder="Verification Code"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={onPressVerify}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPendingVerification(false)}>
                <Text style={styles.footerLink}>Back to edit email</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6ED',
  },
  inner: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    color: '#5E3C2C',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#5E3C2C',
    marginTop: 8,
  },
  form: {
    width: '100%',
    paddingHorizontal: 24,
  },
  input: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  strengthContainer: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    marginRight: 10,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  primaryButton: {
    height: 52,
    backgroundColor: '#E8531A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#cc0000',
    marginBottom: 12,
    textAlign: 'center',
  },
  footerLink: {
    marginTop: 24,
    textAlign: 'center',
    color: '#5E3C2C',
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#5E3C2C',
  },
});
