import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { WizardHeader } from '../../../components/create/WizardHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { AppIcon } from '../../../constants/icons';
import { COLORS } from '../../../constants/colors';
import { useRecipeDraft } from '../../../stores/recipe-draft.store';

export default function CreateStep2PhotosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { 
    coverImageUri, heroImageUri, heroImageUrl,
    setField
  } = useRecipeDraft();

  const [isUploading, setIsUploading] = useState<'cover' | 'hero' | null>(null);

  // Mock upload function
  const pickAndUpload = async (purpose: 'cover' | 'hero', aspect: [number, number]) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setIsUploading(purpose);
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock public URL
        const publicUrl = uri; 

        if (purpose === 'cover') {
          setField('coverImageUri', uri);
          setField('coverImageUrl', publicUrl);
        } else {
          setField('heroImageUri', uri);
          setField('heroImageUrl', publicUrl);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WizardHeader 
        step={2} 
        title="Photos" 
        onBack={() => router.back()} 
      />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cover photo (Optional)</Text>
          <Text style={styles.sectionSubtitle}>Shows up in feed cards.</Text>
          
          <TouchableOpacity 
            style={[styles.uploadZone, styles.aspect16x9]}
            activeOpacity={0.8}
            onPress={() => pickAndUpload('cover', [16, 9])}
            disabled={isUploading === 'cover'}
          >
            {coverImageUri ? (
              <Image source={{ uri: coverImageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            ) : null}
            
            <View style={[styles.uploadOverlay, coverImageUri && styles.uploadOverlayDark]}>
              {isUploading === 'cover' ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : (
                <>
                  <AppIcon name={coverImageUri ? 'aiImage' : 'add'} size={32} color={coverImageUri ? '#FFF' : COLORS.textMuted} />
                  <Text style={[styles.uploadText, coverImageUri && { color: '#FFF' }]}>
                    {coverImageUri ? 'Tap to change' : 'Upload cover photo'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Step Photos Note */}
        <View style={styles.infoCard}>
          <AppIcon name="info" size={20} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            Add photos to individual steps in the next screen.
          </Text>
        </View>

        {/* Hero Photo - required */}
        <View style={styles.section}>
          <View style={styles.heroLabelRow}>
            <Text style={styles.sectionTitle}>Final dish photo</Text>
            <Badge label="Required to publish" variant="primary" />
          </View>
          
          <TouchableOpacity 
            style={[styles.uploadZone, styles.aspect4x3, styles.heroBorder]}
            activeOpacity={0.8}
            onPress={() => pickAndUpload('hero', [4, 3])}
            disabled={isUploading === 'hero'}
          >
            {heroImageUri ? (
              <Image source={{ uri: heroImageUri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            ) : null}
            
            <View style={[styles.uploadOverlay, heroImageUri && styles.uploadOverlayDark]}>
              {isUploading === 'hero' ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : (
                <>
                  <AppIcon name={heroImageUri ? 'aiImage' : 'add'} size={32} color={heroImageUri ? '#FFF' : COLORS.primary} />
                  <Text style={[styles.uploadText, heroImageUri ? { color: '#FFF' } : { color: COLORS.primary }]}>
                    {heroImageUri ? 'Tap to change' : 'Upload final dish photo'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          {!heroImageUrl && (
            <Text style={styles.hintText}>You'll need a final dish photo to publish.</Text>
          )}
        </View>

      </ScrollView>

      {/* Floating Action */}
      <View style={[styles.floatingFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Button 
          label="Next: Ingredients" 
          variant="primary" 
          fullWidth
          onPress={() => router.push('/create/ingredients')}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  uploadZone: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroBorder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
  },
  aspect16x9: {
    aspectRatio: 16 / 9,
    width: '100%',
  },
  aspect4x3: {
    aspectRatio: 4 / 3,
    width: '100%',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  uploadOverlayDark: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  heroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hintText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
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
