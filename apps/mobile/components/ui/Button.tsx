import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View,
  ViewStyle,
  TextStyle
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { AppIcon, IconName } from '../../constants/icons';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'ai';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const textColor = variant === 'ghost' ? COLORS.primary : '#FFFFFF';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        VARIANT_STYLES[variant].container,
        SIZE_STYLES[size].container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>
              <AppIcon name={icon} size={size === 'sm' ? 16 : 20} color={textColor} />
            </View>
          )}
          
          <Text style={[styles.text, SIZE_STYLES[size].text, { color: textColor }]}>
            {variant === 'ai' ? `★ ${label}` : label}
          </Text>

          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>
              <AppIcon name={icon} size={size === 'sm' ? 16 : 20} color={textColor} />
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const VARIANT_STYLES: Record<string, { container: ViewStyle }> = {
  primary: {
    container: { backgroundColor: COLORS.primary },
  },
  secondary: {
    container: { backgroundColor: COLORS.secondary },
  },
  ghost: {
    container: { 
      backgroundColor: 'transparent', 
      borderWidth: 1, 
      borderColor: COLORS.primary 
    },
  },
  ai: {
    container: { backgroundColor: COLORS.aiPurple },
  },
};

const SIZE_STYLES: Record<string, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { height: 36, paddingHorizontal: 14 },
    text: { fontSize: 13 },
  },
  md: {
    container: { height: 44, paddingHorizontal: 20 },
    text: { fontSize: 15 },
  },
  lg: {
    container: { height: 52, paddingHorizontal: 24 },
    text: { fontSize: 16 },
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
