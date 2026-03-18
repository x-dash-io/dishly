import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  withSequence
} from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';
import { AppIcon, IconName } from '../../constants/icons';

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  size?: number;
  color?: string;
  label?: string;
  count?: number;
  active?: boolean;
  disabled?: boolean;
}

export function IconButton({ 
  icon, 
  onPress, 
  size = 20, 
  color, 
  label, 
  count, 
  active, 
  disabled 
}: IconButtonProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;
    
    // Animate scale 1 -> 1.2 -> 1
    scale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 100 }),
      withSpring(1)
    );
    
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = active 
    ? COLORS.primary 
    : (color || COLORS.textSecondary);

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.6} 
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
    >
      <Animated.View style={animatedStyle}>
        <AppIcon 
          name={icon} 
          size={size} 
          color={iconColor} 
          strokeWidth={active && icon === 'like' ? 2 : 1.75}
        />
        {active && icon === 'like' && (
          <View style={[StyleSheet.absoluteFill, styles.heartOverlay]}>
            <AppIcon name="like" size={size} color={COLORS.primary} strokeWidth={0} />
          </View>
        )}
      </Animated.View>
      
      {(label || count !== undefined) && (
        <View style={styles.content}>
          {count !== undefined && <Text style={styles.count}>{count}</Text>}
          {label && <Text style={styles.label}>{label}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    marginLeft: 6,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  label: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  heartOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
