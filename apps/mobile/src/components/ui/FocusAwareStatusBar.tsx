import * as React from 'react';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

export function FocusAwareStatusBar(props: StatusBarProps) {
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();

  const defaultProps: StatusBarProps = {
    style: 'light', // Always use light content (white icons/text)
    backgroundColor: '#FDF6ED', // Always use creamy background
    translucent: false,
    ...props
  };

  return isFocused ? <StatusBar {...defaultProps} /> : null;
}
