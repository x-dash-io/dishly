import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  onPress?: () => void;
}

const FallbackColors = [
  '#E8531A', // Spice Orange
  '#3D7A4F', // Forest Green
  '#7C3AED', // AI Purple
  COLORS.mahogany, // Mahogany
  '#D97706', // Warning Gold
];

function getInitials(name: string) {
  const parts = name.split(' ').filter(p => !!p);
  const initials = parts.map(p => p[0].toUpperCase()).slice(0, 2).join('');
  return initials || '?';
}

function getFallbackColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FallbackColors.length;
  return FallbackColors[index];
}

export function Avatar({ uri, name, size = 40, onPress }: AvatarProps) {
  const initials = getInitials(name);
  const fallbackColor = getFallbackColor(name);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  };

  const content = uri ? (
    <Image 
      source={{ uri }} 
      style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} 
    />
  ) : (
    <View style={[styles.fallback, { backgroundColor: fallbackColor, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={containerStyle}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
});
