import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useApiClient } from '../../src/lib/api-client';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { AppIcon } from '../../constants/icons';
import type { UserProfile } from '@dishly/types';

const DIETARY_PREFS = ['Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Halal', 'Kosher', 'Keto', 'Paleo'];

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const api = useApiClient();
  const queryClient = useQueryClient();

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.request<UserProfile>('GET', '/auth/me'),
    staleTime: Infinity,
  });

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [usernameValid, setUsernameValid] = useState<boolean | null>(true);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (me) {
      setDisplayName(me.display_name || '');
      setUsername(me.username || '');
      setBio(me.bio || '');
      setSelectedDietary(me.dietary_prefs || []);
      setSkillLevel(me.skill_level || 'beginner');
      setAvatarUrl(me.avatar_url || null);
    }
  }, [me]);

  useEffect(() => {
    if (!me) return;
    if (username === me.username) {
      setUsernameValid(true);
      return;
    }

    if (username.length < 3) {
      setUsernameValid(null);
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const { available } = await api.request<{available: boolean}>('GET', `/users/check-username?username=${username}`);
        setUsernameValid(available);
      } catch {
        setUsernameValid(false);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, me]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.request('PATCH', '/users/me', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Invalidate the public profile view for this user
      if (me?.username) {
        queryClient.invalidateQueries({ queryKey: ['user', me.username] });
      }
      if (username && username !== me?.username) {
        queryClient.invalidateQueries({ queryKey: ['user', username] });
      }
      Alert.alert('Success', 'Profile updated!', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (err: unknown) => {
      Alert.alert('Error', err?.message || 'Failed to update profile');
    }
  });

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        // Simulate upload
        await new Promise(res => setTimeout(res, 1000));
        setAvatarUrl(result.assets[0].uri);
        setIsUploading(false);
      }
    } catch (e) {
      console.error(e);
      setIsUploading(false);
    }
  };

  const toggleSelection = (item: string) => {
    if (selectedDietary.includes(item)) {
      setSelectedDietary(selectedDietary.filter(i => i !== item));
    } else {
      setSelectedDietary([...selectedDietary, item]);
    }
  };

  const handleSave = () => {
    if (!displayName.trim() || !usernameValid) return;
    updateProfileMutation.mutate({
      username: username.toLowerCase(),
      display_name: displayName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl,
      dietary_prefs: selectedDietary,
      skill_level: skillLevel,
    });
  };

  const remainingChars = 300 - bio.length;

  if (meLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={COLORS.background} translucent={false} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <AppIcon name="back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarWrapper} 
            activeOpacity={0.8} 
            onPress={pickAvatar}
            disabled={isUploading}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {isUploading ? <ActivityIndicator size="small" color="#FFF" /> : <AppIcon name="add" size={16} color="#FFF" />}
            </View>
          </TouchableOpacity>
          <Text style={styles.sectionLabel}>Tap to change avatar</Text>
        </View>

        {/* Inputs */}
        <View style={styles.fieldSection}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="E.g. Gordon Ramsay"
          />
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.usernameContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={username}
              onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoCapitalize="none"
            />
            <View style={styles.validationIcon}>
              {usernameChecking ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
                usernameValid === true ? <AppIcon name="check" size={20} color={COLORS.success} /> :
                usernameValid === false ? <AppIcon name="close" size={20} color={COLORS.error} /> : null
              )}
            </View>
          </View>
        </View>

        <View style={styles.fieldSection}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={(txt) => {
              if (txt.length <= 300) setBio(txt);
            }}
            placeholder="A bit about yourself..."
            multiline
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, remainingChars < 30 && { color: COLORS.error }]}>
            {remainingChars} characters remaining
          </Text>
        </View>

        {/* Dietary */}
        <View style={styles.fieldSection}>
          <Text style={styles.label}>Dietary Preferences</Text>
          <View style={styles.tagGrid}>
            {DIETARY_PREFS.map(pref => {
              const selected = selectedDietary.includes(pref);
              return (
                <TouchableOpacity 
                  key={pref}
                  style={[styles.tag, selected && styles.tagSelected]}
                  onPress={() => toggleSelection(pref)}
                >
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{pref}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Skill */}
        <View style={styles.fieldSection}>
          <Text style={styles.label}>Skill Level</Text>
          <View style={styles.skillRow}>
            {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
              <TouchableOpacity
                key={lvl}
                style={[styles.skillCard, skillLevel === lvl && styles.skillCardActive]}
                onPress={() => setSkillLevel(lvl)}
              >
                <Text style={[styles.skillCardText, skillLevel === lvl && styles.skillCardTextActive]}>
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button 
          label="Save Changes" 
          variant="primary" 
          fullWidth
          disabled={updateProfileMutation.isPending || !displayName.trim() || !usernameValid}
          loading={updateProfileMutation.isPending}
          onPress={handleSave}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  sectionLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  fieldSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 100,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  validationIcon: {
    width: 32,
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'right',
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
    borderColor: COLORS.borderStrong,
    backgroundColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: COLORS.textInverse,
  },
  skillRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skillCard: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  skillCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '0D',
  },
  skillCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  skillCardTextActive: {
    color: COLORS.primary,
  }
});
