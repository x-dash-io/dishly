import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../../constants/colors';

interface BadgeProps {
  label: string;
  variant: 'primary' | 'secondary' | 'ai' | 'success' | 'muted';
  size?: 'sm' | 'md';
}

function BadgeComponent({ label, variant, size = 'md' }: BadgeProps) {
  const containerStyle = [
    styles.container,
    VARIANT_STYLES[variant].container,
    SIZE_STYLES[size].container,
  ];
  
  const textStyle = [
    styles.text,
    VARIANT_STYLES[variant].text,
    SIZE_STYLES[size].text,
  ];

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>
        {variant === 'ai' ? `★ ${label}` : label}
      </Text>
    </View>
  );
}

const VARIANT_STYLES: Record<string, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: COLORS.primaryLight },
    text: { color: COLORS.primaryLightText },
  },
  secondary: {
    container: { backgroundColor: COLORS.secondaryLight },
    text: { color: COLORS.secondaryLightText },
  },
  ai: {
    container: { backgroundColor: COLORS.aiPurpleLight },
    text: { color: COLORS.aiPurple },
  },
  success: {
    container: { backgroundColor: COLORS.secondaryLight },
    text: { color: COLORS.secondaryLightText },
  },
  muted: {
    container: { backgroundColor: COLORS.surfaceAlt },
    text: { color: COLORS.textSecondary },
  },
};

const SIZE_STYLES: Record<string, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 99,
    },
    text: { fontSize: 10 },
  },
  md: {
    container: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 99,
    },
    text: { fontSize: 12 },
  },
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
});

// Wrapped in React.memo for FlashList / scroll performance
export const Badge = React.memo(BadgeComponent);
